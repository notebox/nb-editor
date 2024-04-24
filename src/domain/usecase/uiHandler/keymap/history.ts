
import type {UIHandler} from "@/domain/usecase/uiHandler"

import Hotkeys from "@/utils/hotkeys"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  let fn: (() => void) | undefined

  if (Hotkeys.isUndo(event)) {
    fn = ctx.editor.undo
  } else if (Hotkeys.isRedo(event)) {
    fn = ctx.editor.redo
  }

  if (fn) {
    event.preventDefault()
    fn.call(ctx.editor)
    return true
  }

  return false
}
