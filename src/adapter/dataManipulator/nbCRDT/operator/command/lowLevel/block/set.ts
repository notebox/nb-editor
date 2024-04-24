import type {BlockPropsDelta} from "@/domain/entity/block/props"
import type {Block, BlockID, OP} from "../../../../crdt"
import type {Operator} from "../../.."

import {
  isAllowAnyChildBlock,
  isNoteBlock,
  isBasicTextBlockType,
  isRemovableBlockType,
  BlockPropKey,
  BlockType,
} from "@/domain/entity"
import {selectedBlocks} from "../common"

export const setBlockProps = (
  operator: Operator,
  blockID: BlockID,
  props: BlockPropsDelta
): OP.bSETReceipt | undefined => {
  const receipt = operator.dataManipulator.replica.setBlock(blockID, {
    props,
    stamp: operator.stamp,
    contributor: operator.dataManipulator.replica.contributor,
  })

  if (receipt) {
    operator.bSET(receipt)
  }
  return receipt
}

export const setBlockProp = (
  operator: Operator,
  blockID: BlockID,
  propKey: BlockPropKey,
  propVal: string | number | true | null
): void => {
  setBlockProps(operator, blockID, {
    [propKey]: propVal,
  } as BlockPropsDelta)
}

export const setBlockType = (
  operator: Operator,
  to: BlockType,
  blockID?: BlockID
): void => {
  if (blockID) {
    const block = operator.dataManipulator.replica.block(blockID)
    if (!block || !block.hasText()) return
    setSingleBlockType(operator, to, block)
  } else {
    if (!isBasicTextBlockType(to)) return
    setMultipleBlockType(operator, to)
  }
}

const setSingleBlockType = (
  operator: Operator,
  to: BlockType,
  block: Block
): void => {
  if (
    isNoteBlock(block) ||
    (block.type !== BlockType.Line && !isRemovableBlockType(block.type))
  )
    return
  setBlockProp(operator, block.blockID, BlockPropKey.TYPE, to)
}

const setMultipleBlockType = (operator: Operator, to: BlockType): void => {
  const {selection} = operator.editor.selector
  if (!selection) return

  selectedBlocks(
    operator.editor.dataManipulator,
    selection.start.blockID,
    selection.end.blockID
  ).forEach(block => setSingleBlockType(operator, to, block))
}

export const setBlockGlobalCount = (
  operator: Operator,
  blockID: BlockID,
  globalCount: true | null
): void => {
  const block = operator.dataManipulator.replica.block(blockID)
  const parentBlock =
    !!block.parentBlockID && operator.dataManipulator.replica.block(block.parentBlockID)
  if (!parentBlock || !isAllowAnyChildBlock(parentBlock)) return
  setBlockProp(operator, blockID, BlockPropKey.GlobalCountingRule, globalCount)
}
