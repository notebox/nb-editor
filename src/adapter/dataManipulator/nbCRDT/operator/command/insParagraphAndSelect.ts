import type {BlockProps} from "@/domain/entity/block/props"
import type {Block} from "../../crdt"
import type {Operator} from ".."

import {
  NBRange,
  BlockType,
  isBasicTextBlock,
  isRemovableBlockType,
  isNoteBlock,
} from "@/domain/entity"
import {
  insTextSoftNewLineAndSelect,
  setBlockType,
  splitTextBlock,
  genBlock,
  inherit,
} from "./lowLevel"

export const insParagraphAndSelect = (
  operator: Operator,
  props?: BlockProps
): void => {
  const range = operator.editor.selector.selection
  if (!range) return

  const blockID = range.start.blockID
  const block = operator.dataManipulator.replica.block(blockID)

  /** @verbose on void block */
  if (range.start.offset == null && range.start.blockID === range.end.blockID) {
    const newBlock = genBlock(
      operator,
      block.point,
      operator.dataManipulator.replica.nextSiblingBlock(blockID)?.point,
      {
        parentBlockID: block.parentBlockID,
        props: props || {TYPE: [null, BlockType.Line]},
      },
      undefined
    )
    operator.editor.selector.select(
      NBRange.decode({blockID: newBlock.blockID, offset: 0})
    )
    return
  }

  if (!range.isCollapsed) throw new Error("selection-not-prepared")
  const offset = range.start.offset

  /** @verbose handle note title */
  if (isNoteBlock(block)) {
    if (offset != null && block.text.length() > 0) {
      splitTextBlockAndSelect(operator, block, offset)
    } else {
      const newBlock = genBlock(
        operator,
        undefined,
        operator.dataManipulator.firstContentBlock()?.point,
        inherit(block, true),
        undefined
      )
      operator.editor.selector.select(
        NBRange.decode({blockID: newBlock.blockID, offset: 0})
      )
    }
    return
  }

  /** @verbose on not basic text block */
  if (!isBasicTextBlock(block)) {
    return insTextSoftNewLineAndSelect(operator)
  }

  /** @verbose on middle of basic text block or note title */
  if (offset != null && offset > 0) {
    splitTextBlockAndSelect(operator, block, offset)
    return
  }

  /** @verbose RemovableTextBlockType with empty text */
  if (isRemovableBlockType(block.type) && !block.text?.spans().textLength()) {
    return setBlockType(operator, BlockType.Line, block.blockID)
  }

  /** @verbose on start of basic text block */
  genBlock(
    operator,
    operator.dataManipulator.replica.prevSiblingBlock(blockID)?.point,
    block.point,
    inherit(block, false),
    undefined
  )
  operator.editor.selector.select(NBRange.decode({blockID, offset: 0}))
  return
}

const splitTextBlockAndSelect = (
  operator: Operator,
  block: Block,
  index: number
) => {
  const newBlock = splitTextBlock(operator, block, index)
  if (newBlock) {
    operator.editor.selector.select(
      NBRange.decode({blockID: newBlock.blockID, offset: 0})
    )
  }
}
