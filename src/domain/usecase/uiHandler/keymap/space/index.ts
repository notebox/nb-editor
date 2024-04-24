
import type {UIHandler} from "@/domain/usecase/uiHandler"

import markdownBlock from "./markdownBlock"
import markdownInline from "./markdownInline"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  return markdownBlock(ctx, event) || markdownInline(ctx, event)
}
