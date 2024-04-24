import type {Point, Block, BlockID, BlockPosition} from "../../../../crdt"
import type {Operator} from "../../.."

import {isAllowAnyChildBlock, isNoteBlock} from "@/domain/entity"
import {movBlock} from "./mov"

export const indentBlocks = (
  operator: Operator,
  toParentBlockID: BlockID,
  blocks: Block[]
): void => {
  const fromParentBlock = operator.dataManipulator.replica.block(
    blocks[0].parentBlockID!
  )

  if (
    !isAllowAnyChildBlock(fromParentBlock) ||
    !isAllowAnyChildBlock(operator.dataManipulator.replica.block(toParentBlockID))
  ) {
    return
  }

  const toParentBlockChildren =
    operator.dataManipulator.childBlocks(toParentBlockID) || []
  let prevSiblingPoint =
    toParentBlockChildren[toParentBlockChildren.length - 1]?.point
  blocks.forEach(block => {
    const point = operator.dataManipulator.replica.genBlockPoint(
      prevSiblingPoint,
      undefined
    )
    prevSiblingPoint = point
    movBlock(operator, block.blockID, {parentBlockID: toParentBlockID, point})
  })
}

export const dedentSingleBlock = (
  operator: Operator,
  block: Block,
  nextBlockPoint?: Point
): BlockPosition | undefined => {
  const fromParentBlock = operator.dataManipulator.replica.block(block.parentBlockID!)

  /** @verbose codeblock */
  if (isNoteBlock(fromParentBlock) || !isAllowAnyChildBlock(fromParentBlock)) {
    return
  }

  /** @verbose lift up from the parent */
  const nextPoint =
    nextBlockPoint ||
    operator.dataManipulator.replica.nextSiblingBlock(fromParentBlock.blockID)?.point
  const toPoint = operator.dataManipulator.replica.genBlockPoint(
    fromParentBlock.point,
    nextPoint
  )
  const to = {
    parentBlockID: fromParentBlock.parentBlockID!,
    point: toPoint,
  }
  if (movBlock(operator, block.blockID, to)) {
    return to
  }
  return
}
