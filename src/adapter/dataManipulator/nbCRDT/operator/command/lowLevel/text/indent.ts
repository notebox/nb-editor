import type {TextBlock} from "@/domain/entity"
import type {Operator} from "../../.."

import {INSContent} from "../../../../crdt"
import {NBRange} from "@/domain/entity"
import {insTextAt} from "./ins"
import {delTextAt} from "./del"

/**
 * indentTextAndSelect insert '  ' on each newLineEndIndexes in the range.
 */
const indentTextAndSelect = (
  operator: Operator,
  block: TextBlock,
  start: number,
  end: number
): void => {
  const blockID = block.blockID
  const content = getTargetContent(block, end)
  const newLineEndIndexes = findNewLineEndIndexes(content, start)

  let addedLength = 0
  newLineEndIndexes.reverse().forEach(index => {
    insTextAt(operator, blockID, index, INSContent.from("  "))
    addedLength += 2
  })

  operator.editor.selector.select(
    NBRange.decode(
      {blockID: block.blockID, offset: start + 2},
      {blockID: block.blockID, offset: end + addedLength}
    )
  )
}

/**
 * dedentTextAndSelect delete ' ' or '  ' on each newLineEndIndexes in the range.
 */
const dedentTextAndSelect = (
  operator: Operator,
  block: TextBlock,
  start: number,
  end: number
): void => {
  const blockID = block.blockID
  const content = getTargetContent(block, end)
  const newLineEndIndexes = findNewLineEndIndexes(content, start)

  let newStartOffset = start
  let deletedLength = 0
  newLineEndIndexes.reverse().forEach(index => {
    const target = content.substring(index, index + 2)
    const delLength = target === "  " ? 2 : target[0] === " " ? 1 : 0
    if (delLength) {
      delTextAt(operator, blockID, index, delLength)
      deletedLength += delLength
      if (index < start) {
        newStartOffset -= delLength
      }
    }
  })

  operator.editor.selector.select(
    NBRange.decode(
      {blockID: block.blockID, offset: newStartOffset},
      {blockID: block.blockID, offset: end - deletedLength}
    )
  )
}

const getTargetContent = (block: TextBlock, end: number): string => {
  return block.text.subSpans(0, end).toString()
}

const findNewLineEndIndexes = (content: string, start: number): number[] => {
  const indexes: number[] = []
  const firstIndex = content.substring(0, start).lastIndexOf("\n")
  indexes.push(firstIndex === -1 ? 0 : firstIndex + 1)

  let remains = content.substring(start)
  let minIndex = start
  while (remains) {
    const index = remains.indexOf("\n")
    if (index === -1) return indexes
    remains = remains.substring(index + 1)
    minIndex = minIndex + index + 1
    indexes.push(minIndex)
  }

  return indexes
}

export {indentTextAndSelect, dedentTextAndSelect}
