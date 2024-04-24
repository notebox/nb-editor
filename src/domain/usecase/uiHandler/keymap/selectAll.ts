import type {UIHandler} from "@/domain/usecase/uiHandler"
import type {NBBlock} from "@/domain/entity/block"

import Hotkeys from "@/utils/hotkeys"
import {NBRange} from "@/domain/entity"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  const selection = ctx.editor.selector.selection
  if (!selection) return false

  if (!Hotkeys.isSelectAll(event)) {
    if (Hotkeys.isESC(event) && !selection.isCollapsed) {
      if (selection.end.offset !== undefined) {
        ctx.editor.selector.select(NBRange.decode(selection.end))
      } else {
        let block: NBBlock | null = ctx.editor.dataManipulator.block(selection.end.blockID)
        while (block) {
          if (block.text) {
            ctx.editor.selector.select(NBRange.decode({blockID: block.blockID, offset: block.text.length()}))
            break
          }
          block = ctx.editor.dataManipulator.prevBlock(block.blockID)
        }
        if (!block) ctx.editor.selector.select(null)
      }
      ctx.state.reRender()
      return true
    }
    return false
  }

  event.preventDefault()

  let range: NBRange
  if (selection.start.subPath?.type === "caption") {
    const block = ctx.editor.dataManipulator.block(selection.start.blockID)
    range = NBRange.decode(
      {
        blockID: block.blockID,
        subPath: {type: "caption"},
        offset: 0,
      },
      {
        blockID: block.blockID,
        subPath: {type: "caption"},
        offset: block.props.CAPTION?.[1]?.length ?? 0,
      }
    )
    if (selection.equals(range)) {
      range = NBRange.decode({blockID: block.blockID})
    }
  } else {
    const block = ctx.editor.dataManipulator.block(selection.start.blockID)
    range = rangeAllInTheBlock(block)
  }

  if (ctx.editor.selector.selection?.equals(range)) {
    const firstBlock = ctx.editor.dataManipulator.rootBlock()
    const lastBlock = ctx.editor.dataManipulator.lastBlock()
    range = NBRange.decode(
      {
        blockID: firstBlock.blockID,
        offset: 0,
      },
      {
        blockID: lastBlock.blockID,
        offset: lastBlock.text?.length(),
      }
    )
  }

  range.flagFromDom(true)
  ctx.editor.selector.select(range)
  ctx.state.reRender()
  return true
}

const rangeAllInTheBlock = (block: NBBlock): NBRange => {
  const textLength = block.text?.length()

  if (textLength == null) {
    return NBRange.decode({blockID: block.blockID})
  } else {
    return NBRange.decode(
      {
        blockID: block.blockID,
        offset: 0,
      },
      {
        blockID: block.blockID,
        offset: textLength,
      }
    )
  }
}
