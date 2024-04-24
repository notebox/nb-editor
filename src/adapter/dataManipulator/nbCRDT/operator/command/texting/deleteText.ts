import type {BlockID} from "../../../crdt"
import type {Operator} from "../.."

import {reverse as reverseText} from "esrever"
import {
  Unit,
  NBPoint,
  NBRange,
  BlockType,
  isNoteBlock,
  isAllowAnyChildBlock,
  isRemovableBlockType,
} from "@/domain/entity"
import {getWordDistance, getCharacterDistance} from "@/utils/string"
import * as lowLevel from "../lowLevel"

export const deleteSelectionAndSelect = (operator: Operator): void => {
  const range = operator.editor.selector.selection
  if (!range || range.isCollapsed) return

  /** @verbose single block */
  if (range.start.blockID === range.end.blockID) {
    deleteSelectionSingleBlockAndSelect(operator, range)
    return
  }

  /** @verbose multiple blocks */
  let delBlockIDs: BlockID[] = []
  const startBlock = operator.dataManipulator.replica.block(range.start.blockID)
  const endBlock = operator.dataManipulator.replica.block(range.end.blockID)
  delBlockIDs = lowLevel.reversedBetweenBlockIDs(
    operator.editor.dataManipulator,
    startBlock.blockID,
    endBlock.blockID
  )

  /** @verbose start block */
  if (startBlock.hasText() && range.start.offset != null) {
    const delLength = startBlock.text.length() || 1 - range.start.offset
    lowLevel.delTextAt(
      operator,
      startBlock.blockID,
      range.start.offset,
      delLength
    )
  } else if (!isNoteBlock(startBlock) && !startBlock.props.DB_RECORD) {
    delBlockIDs.unshift(startBlock.blockID)
  }

  /** @verbose end block */
  if (endBlock.hasText() && range.end.offset != null) {
    const [left, right] = endBlock.text.spans().splitAt(range.end.offset)
    const insContent = right.toINSContent()

    if (startBlock.hasText() && range.start.offset != null) {
      /** @verbose delete end block and add append text to start block */
      delBlockIDs.push(endBlock.blockID)
      if (insContent) {
        lowLevel.insTextAtAndSelect(
          operator,
          startBlock.blockID,
          range.start.offset,
          insContent
        )
      }
    } else {
      if (insContent?.length) {
        /** @verbose delete end block text */
        lowLevel.delTextAt(operator, endBlock.blockID, 0, left.textLength())
      } else {
        /** @verbose delete end block */
        delBlockIDs.push(endBlock.blockID)
      }
    }
  } else {
    /** @verbose delete end block */
    delBlockIDs.push(endBlock.blockID)
  }

  /** @verbose delete blocks */
  lowLevel.delBlocks(operator, delBlockIDs, true)

  /** @verbose update and select */
  if (delBlockIDs[0] === startBlock.blockID) {
    operator.editor.selector.select(null)
  } else {
    operator.editor.selector.select(new NBRange(range.start))
  }
}

const deleteSelectionSingleBlockAndSelect = (
  operator: Operator,
  range: NBRange
): void => {
  /** @verbose void block */
  if (range.start.offset == null) {
    if (range.start.subPath) return

    const prevSiblingBlockID = operator.dataManipulator.replica.prevSiblingBlock(
      range.start.blockID
    )?.blockID
    if (prevSiblingBlockID) {
      const prevSiblingBlock = operator.dataManipulator.replica.block(prevSiblingBlockID)
      if (prevSiblingBlock.hasText()) {
        operator.editor.selector.select(
          NBRange.decode({
            blockID: prevSiblingBlockID,
            offset: prevSiblingBlock.text.spans().textLength(),
          })
        )
      } else {
        operator.editor.selector.select(
          NBRange.decode({
            blockID: prevSiblingBlockID,
          })
        )
      }
    } else {
      operator.editor.selector.select(null)
    }

    lowLevel.delBlock(operator, range.start.blockID, true)
    return
  }

  const delLength = range.end.offset! - range.start.offset
  if (delLength < 1) return
  lowLevel.delTextAt(
    operator,
    range.start.blockID,
    range.start.offset,
    delLength
  )
  operator.editor.selector.select(new NBRange(range.start))
}

export const deleteTextAndSelect = (
  operator: Operator,
  unit: Unit = Unit.Character,
  backward: boolean
): void => {
  const range = operator.editor.selector.selection
  if (!range) return
  if (!range.isCollapsed) throw new Error("selection-not-prepared")

  if (range.start.subPath) return

  /** @verbose at the beginning of the text block - remove type / dedent */
  if (backward && range.start.offset === 0) {
    deleteBackwardAtTheBeginningOfTheTextBlock(operator, range.start)
    return
  }

  let point = range.start
  const text = backward
    ? reverseText(
        operator.dataManipulator.replica
          .block(point.blockID)
          .text!.subSpans(0, point.offset!)
          .toString()
    )
    : operator.dataManipulator.replica
      .block(point.blockID)
      .text!.toString()
      .substring(point.offset!)
      .toString()

  /** @verbose at the end of the block - merge */
  if (!backward && text.length === 0) {
    lowLevel.mergeBlockToNext(operator, point)
    return
  }

  /** @verbose text block handler */
  const length = getLengthToDelete(text, unit)

  /** @verbose nothing to delete */
  if (length < 1) return
  if (backward) {
    point = new NBPoint({
      blockID: point.blockID,
      offset: point.offset! - length,
    })
    operator.editor.selector.select(new NBRange(point))
  }

  lowLevel.delTextAt(operator, point.blockID, point.offset!, length)
}

const deleteBackwardAtTheBeginningOfTheTextBlock = (
  operator: Operator,
  point: NBPoint
): void => {
  const block = operator.dataManipulator.replica.block(point.blockID)
  if (isRemovableBlockType(block.type)) {
    lowLevel.setBlockType(operator, BlockType.Line, block.blockID)
    return
  }

  const parentBlock = operator.dataManipulator.replica.block(block.parentBlockID!)
  if (
    block.parentBlockID &&
    parentBlock.type !== "NOTE" &&
    isAllowAnyChildBlock(parentBlock) &&
    !operator.dataManipulator.replica.nextSiblingBlock(block.blockID)
  ) {
    lowLevel.dedentSingleBlock(operator, block)
    return
  }

  lowLevel.mergeBlockToPrevAndSelect(operator, point)
}

export const getLengthToDelete = (text: string, unit: Unit): number => {
  switch (unit) {
  case Unit.Word:
    return getWordDistance(text)
  case Unit.Line:
  case Unit.Block:
    return text.length
  default:
    return getCharacterDistance(text)
  }
}
