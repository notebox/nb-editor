
import type {UIHandler} from "@/domain/usecase/uiHandler"

import {Unit, isBasicTextBlock} from "@/domain/entity"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  if (event.key !== ">" && event.key !== "-") return false

  const selection = ctx.editor.selector.selection
  if (!selection?.isCollapsed) return false
  const {blockID, offset} = selection.start
  if (!offset) return false
  const block = ctx.editor.dataManipulator.block(blockID)
  if (!isBasicTextBlock(block)) return false
  const text = block.text
  if (!text) return false

  const lSpans = text.subSpans(0, offset)
  if (!lSpans.length) return false
  const pretext = lSpans[lSpans.length - 1]?.content.text
  if (!pretext) return false

  const symbol = pretext.substring(pretext.length - 1) + event.key
  let arrow: string

  switch (symbol) {
  case "->":
    arrow = "→"
    break
  case "<-":
    arrow = "←"
    break
  default:
    return false
  }

  event.preventDefault()
  const operator = ctx.editor.newOperator()
  operator.deleteBackward({unit: Unit.Character})
  operator.insertText(arrow)
  ctx.editor.commit(operator)

  return true
}
