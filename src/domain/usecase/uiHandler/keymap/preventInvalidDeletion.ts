import type {UIHandler} from "@/domain/usecase/uiHandler"

import Hotkeys from "@/utils/hotkeys"

/** @purpose empty note deletion on safari */
export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  if (Hotkeys.isDeleteBackward(event)) {
    if (
      ctx.editor.selector.selection &&
      ctx.editor.selector.selection.isCollapsed &&
      ctx.editor.selector.selection.start.blockID === ctx.editor.rootBlockID &&
      ctx.editor.selector.selection.start.offset === 0
    ) {
      event.preventDefault()
      return true
    }
  }

  return false
}
