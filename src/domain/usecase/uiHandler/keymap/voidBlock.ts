import type {BlockID} from "@/domain/entity"
import type {UIHandler} from "@/domain/usecase/uiHandler"

import {isNoteBlock, NBRange} from "@/domain/entity"
import Hotkeys from "@/utils/hotkeys"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  if (
    !ctx.editor.selector.selection ||
    ctx.editor.selector.selection.start.offset != null
  )
    return false

  if (Hotkeys.isDelete(event)) {
    if (ctx.editor.selector.selection.start.subPath) return true

    event.preventDefault()
    const toSelectRange = predRange(
      ctx,
      ctx.editor.selector.selection.start.blockID
    )
    const operator = ctx.editor.newOperator()
    operator.delBlock(ctx.editor.selector.selection.start.blockID, true)
    operator.select(toSelectRange)
    ctx.editor.commit(operator)
    return true
  } else if (Hotkeys.isEnter(event)) {
    /** @todo check reachable? */
    event.preventDefault()
    const operator = ctx.editor.newOperator()
    operator.insertParagraphOnBlockText()
    ctx.editor.commit(operator)
    return true
  }

  return false
}

const predRange = (ctx: UIHandler, blockID: BlockID): NBRange | null => {
  let toSelectBlockID: BlockID | null = null
  const block = ctx.editor.dataManipulator.block(blockID)
  const siblingBlocks = ctx.editor.dataManipulator.childBlocks(block.parentBlockID!)
  const index = siblingBlocks.findIndex(b => b.blockID === block.blockID)

  if (index < 1) {
    toSelectBlockID = block.parentBlockID!
  } else {
    toSelectBlockID = siblingBlocks[index - 1].blockID
  }

  const toSelectBlock = ctx.editor.dataManipulator.block(toSelectBlockID)
  if (isNoteBlock(toSelectBlock)) {
    return null
  } else if (toSelectBlock.hasText()) {
    return NBRange.decode({
      blockID: toSelectBlockID,
      offset: toSelectBlock.text.length(),
    })
  } else {
    return NBRange.decode({blockID: toSelectBlockID})
  }
}
