import type {Block} from "../../../../crdt"
import type {NBPoint} from "@/domain/entity"
import type {Operator} from "../../.."

import {NBRange} from "@/domain/entity"
import {delBlock} from "./del"
import {movBlock} from "./mov"
import {insTextAt} from "../text/ins"

export const mergeBlockToPrevAndSelect = (
  operator: Operator,
  point: NBPoint
): void => {
  let mergerBlockID = operator.dataManipulator.replica.prevBlock(point.blockID)?.blockID
  /** @verbose merge to note title */
  if (!mergerBlockID) {
    if (
      operator.dataManipulator.childBlocks(operator.dataManipulator.rootBlock().blockID)[0]
        ?.blockID === point.blockID
    ) {
      mergerBlockID = operator.dataManipulator.rootBlock().blockID
    } else {
      return
    }
  }

  /** @verbose delete prev void block */
  if (!operator.dataManipulator.replica.block(mergerBlockID).hasText()) {
    delBlock(operator, mergerBlockID, true)
    return
  }

  const mergerBlock = operator.dataManipulator.replica.block(mergerBlockID)
  const mergerLastOffset = mergerBlock.text?.length() || 0
  mergeBlocks(
    operator,
    mergerBlock,
    operator.dataManipulator.replica.block(point.blockID),
    mergerLastOffset
  )

  operator.editor.selector.select(
    NBRange.decode({
      blockID: mergerBlock.blockID,
      offset: mergerLastOffset,
    })
  )
}

export const mergeBlockToNext = (operator: Operator, point: NBPoint): void => {
  const mergedBlock = operator.dataManipulator.replica.nextBlock(point.blockID)
  if (!mergedBlock) return

  mergeBlocks(
    operator,
    operator.dataManipulator.replica.block(point.blockID),
    mergedBlock,
    point.offset!
  )
}

const mergeBlocks = (
  operator: Operator,
  merger: Block,
  merged: Block,
  mergerLastOffset: number
): void => {
  adoptChildrenToParent(operator, merged)
  const content = merged.text?.spans().toINSContent()

  /** @verbose append text of next block if it exists */
  if (content) {
    insTextAt(operator, merger.blockID, mergerLastOffset, content)
  }

  delBlock(operator, merged.blockID, true)
}

const adoptChildrenToParent = (operator: Operator, block: Block): void => {
  const childBlocks = operator.dataManipulator.childBlocks(block.blockID)
  if (childBlocks.length) {
    let newBlockPoint = block.point
    const nextBlockPoint = operator.dataManipulator.replica.nextSiblingBlock(
      block.blockID
    )?.point

    childBlocks.forEach(child => {
      newBlockPoint = operator.dataManipulator.replica.genBlockPoint(
        newBlockPoint,
        nextBlockPoint
      )
      movBlock(operator, child.blockID, {
        parentBlockID: block.parentBlockID!,
        point: newBlockPoint,
      })
    })
  }
}
