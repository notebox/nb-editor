import type {BlockID, Block} from "../../../crdt"
import type {DataManipulator} from "@/domain"

import {isNoteBlock} from "@/domain/entity"

export const selectedBlocks = (
  dataManipulator: DataManipulator,
  start: BlockID,
  end: BlockID
): Block[] => {
  if (start === end) return [dataManipulator.block(start) as Block]

  const blocks = betweenBlocks(dataManipulator, start, end)
  blocks.unshift(dataManipulator.block(start) as Block)
  blocks.push(dataManipulator.block(end) as Block)

  return blocks
}

export const removeNoteBlockAndChildren = (blocks: Block[]): Block[] => {
  if (!blocks.length) return []

  /** @purpose remove note block */
  if (isNoteBlock(blocks[0])) {
    blocks.shift()
  }
  const cachedBlockIDs = new Set()
  const result = blocks.reduce((acc: Block[], cur: Block) => {
    cachedBlockIDs.add(cur.blockID)
    if (cachedBlockIDs.has(cur.parentBlockID)) return acc
    acc.push(cur)
    return acc
  }, [])
  return result
}

export const betweenBlockIDs = (
  dataManipulator: DataManipulator,
  start: BlockID,
  end: BlockID
): BlockID[] => {
  return betweenBlocks(dataManipulator, start, end).map(block => block.blockID)
}

export const reversedBetweenBlockIDs = (
  dataManipulator: DataManipulator,
  start: BlockID,
  end: BlockID
): BlockID[] => {
  return betweenBlocks(dataManipulator, start, end).map(
    (_, index, arr) => arr[arr.length - 1 - index].blockID
  )
}

const betweenBlocks = (
  dataManipulator: DataManipulator,
  start: BlockID,
  end: BlockID
): Block[] => {
  const blocks: Block[] = []
  let block = dataManipulator.nextBlock(start) as Block | null

  while (block && block.blockID !== end) {
    blocks.push(block)
    block = dataManipulator.nextBlock(block.blockID) as Block | null
  }

  return blocks
}
