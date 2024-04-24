import type {TextBlock, NBRange} from "@/domain/entity"
import type {Point, BlockID, Block} from "../../crdt"
import type {Editor} from "@/domain/usecase"
import type {Operator} from ".."

import {isBasicTextBlock} from "@/domain/entity"
import * as lowLevel from "./lowLevel"

export const indent = (operator: Operator): void => {
  const range = operator.editor.selector.selection
  if (!range) return

  // single block
  if (range.start.blockID === range.end.blockID) {
    const block = operator.dataManipulator.replica.block(range.start.blockID)
    const toParentBlockID = operator.dataManipulator.replica.prevSiblingBlock(
      block.blockID
    )?.blockID
    if (!toParentBlockID) return

    if (isInlineIndentation(block, range)) {
      lowLevel.indentTextAndSelect(
        operator,
        block,
        range.start.offset!,
        range.end.offset!
      )
      return
    }
    lowLevel.indentBlocks(operator, toParentBlockID, [block])
    return
  }

  // multi blocks
  const groups = makeIndentGroups(
    operator,
    getTargetBlocks(operator.editor, range.start.blockID, range.end.blockID)
  )

  groups.forEach(group => {
    if (group.toParentBlockID) {
      lowLevel.indentBlocks(operator, group.toParentBlockID, group.blocks)
    }
  })
}

type IndentGroup = {toParentBlockID: BlockID | null; blocks: Block[]};
/** @property blocks in reversed order */
const makeIndentGroups = (
  operator: Operator,
  blocks: Block[]
): IndentGroup[] => {
  const groups: {[fromParentBlockID: string]: IndentGroup} = {}

  blocks.forEach(block => {
    const group = groups[block.parentBlockID!]
    if (group) {
      group.blocks.push(block)
      return
    }

    const toParentBlockID =
      operator.dataManipulator.replica.prevSiblingBlock(block.blockID)?.blockID || null
    groups[block.parentBlockID!] = {
      toParentBlockID,
      blocks: [block],
    }
  })

  return Object.values(groups)
}

export const dedent = (operator: Operator): void => {
  const range = operator.editor.selector.selection
  if (!range) return

  // multi blocks
  if (!range.isCollapsed && range.start.blockID !== range.end.blockID) {
    const cachedNextPoint: {[fromParentBlockID: string]: Point} = {}
    getTargetBlocks(operator.editor, range.start.blockID, range.end.blockID)
      .reverse()
      .forEach(block => {
        const fromParentBlockID = block.parentBlockID!
        const position = lowLevel.dedentSingleBlock(
          operator,
          block,
          cachedNextPoint[fromParentBlockID]
        )
        if (position) {
          cachedNextPoint[fromParentBlockID] = position.point
        }
      })

    return
  }

  // single block
  const block = operator.dataManipulator.replica.block(range.start.blockID)

  if (isInlineIndentation(block, range)) {
    return lowLevel.dedentTextAndSelect(
      operator,
      block,
      range.start.offset!,
      range.end.offset!
    )
  }

  lowLevel.dedentSingleBlock(operator, block)
}

const getTargetBlocks = (
  editor: Editor,
  start: BlockID,
  end: BlockID
): Block[] => {
  return lowLevel.removeNoteBlockAndChildren(
    lowLevel.selectedBlocks(editor.dataManipulator, start, end)
  )
}

export const isInlineIndentation = (
  block: Block,
  range: NBRange
): block is TextBlock & Block => {
  return !isBasicTextBlock(block) && block.hasText() && range.isTextEditable
}
