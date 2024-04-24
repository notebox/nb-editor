import type {UIHandler} from "@/domain/usecase/uiHandler"

import Hotkeys from "@/utils/hotkeys"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  let fn: (() => void) | undefined

  if (Hotkeys.isIndent(event)) {
    fn = ctx.editor.indent
  } else if (Hotkeys.isDedent(event)) {
    fn = ctx.editor.dedent
  }

  if (fn) {
    event.preventDefault()
    fn.call(ctx.editor)
    return true
  }

  return false
}
