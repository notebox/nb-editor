import type {BlockID} from "@/domain/entity"
import type {Operator} from "../../.."

import {INSContent} from "../../../../crdt"
import {NBRange} from "@/domain/entity"

export const insTextSoftNewLineAndSelect = (operator: Operator): void => {
  insTextAndSelect(operator, "\n")
}

export const insTextAndSelect = (operator: Operator, text: string): void => {
  const range = operator.editor.selector.selection
  if (!range) return
  if (!range.isCollapsed) throw new Error("selection-not-prepared")
  if (range.start.offset == null) return

  insTextAtAndSelect(
    operator,
    range.start.blockID,
    range.start.offset,
    INSContent.from(text, operator.editor.selector.textProps)
  )
}

export const insTextAtAndSelect = (
  operator: Operator,
  blockID: BlockID,
  index: number,
  content: INSContent
): void => {
  if (!insTextAt(operator, blockID, index, content)) return

  const newRange = NBRange.decode({
    blockID: blockID,
    offset: index + content.length,
  })
  operator.editor.selector.select(newRange)
}

export const insTextAt = (
  operator: Operator,
  blockID: BlockID,
  index: number,
  content: INSContent
): true | undefined => {
  const receipt = operator.dataManipulator.replica.insTextAt(blockID, {
    index,
    content,
    contributor: operator.dataManipulator.replica.contributor,
  })
  if (receipt) {
    operator.tINS(receipt, index)
    return true
  }
  return
}
