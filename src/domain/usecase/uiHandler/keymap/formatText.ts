
import type {UIHandler} from "@/domain/usecase/uiHandler"

import {TextPropKey} from "@/domain/entity"
import Hotkeys from "@/utils/hotkeys"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  const {selection} = ctx.editor.selector
  if (
    !selection ||
    selection.start.offset == null ||
    selection.start.subPath ||
    selection.end.offset == null ||
    selection.end.subPath
  )
    return false

  if (selection.isCollapsed) return false

  if (Hotkeys.isFMTBold(event)) {
    return handler(ctx, event, TextPropKey.Bold)
  } else if (Hotkeys.isFMTCode(event)) {
    return handler(ctx, event, TextPropKey.Code)
  } else if (Hotkeys.isFMTItalic(event)) {
    return handler(ctx, event, TextPropKey.Italic)
  } else if (Hotkeys.isFMTUnderline(event)) {
    return handler(ctx, event, TextPropKey.Underline)
  } else if (Hotkeys.isFMTLink(event)) {
    return handler(ctx, event, TextPropKey.Link)
  }

  return false
}

const handler = (
  ctx: UIHandler,
  event: KeyboardEvent,
  propKey:
    | TextPropKey.Code
    | TextPropKey.Bold
    | TextPropKey.Italic
    | TextPropKey.Underline
    | TextPropKey.Link
): boolean => {
  event.preventDefault()
  ctx.editor.semFormat(propKey)
  return true
}
