
import {
  NBRange,
  BlockID,
  TextPropKey,
  isBasicTextBlock,
  isNoteBlock,
} from "@/domain/entity"
import type {UIHandler} from "@/domain/usecase/uiHandler"
import Hotkeys from "@/utils/hotkeys"
import * as utils from "../common"

const regexBold = /(^\*\*|\s\*\*)(((?!\s\*\*).)+)\*\*$/
const regexItalic = /(^\*|\s\*)((?!^\*)((?!\s\*).)+)\*$/
const regexCode = /(^`|\s`)(((?!\s`).)+)`$/
const regexStrike = /(^~|\s~)(((?!\s~).)+)~$/

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  if (!Hotkeys.isApplyMarkdown(event)) return false

  const {selection} = ctx.editor.selector
  if (!selection?.isCollapsed || !selection.isTextBlock) return false

  const block = ctx.editor.dataManipulator.block(selection.start.blockID)
  if (
    selection.start.subPath ||
    (!isNoteBlock(block) && !isBasicTextBlock(block))
  )
    return false
  const {blockID, offset} = selection.start
  if (!offset || offset < 2) return false
  let pretext = utils.pretext(offset, ctx.editor.dataManipulator.block(blockID))
  const fromComposition = ctx.state.working.consumeSpaceByComposition()
  if (fromComposition) {
    pretext = pretext.slice(0, -1)
  }
  if (!pretext) return false

  let result: RegExpMatchArray | null

  result = pretext.match(regexBold)
  if (result) {
    event.preventDefault()
    const [, , text] = result
    apply(ctx, blockID, offset, text, TextPropKey.Bold, 2, fromComposition)
    return true
  }

  result = pretext.match(regexItalic)
  if (result) {
    event.preventDefault()
    const [, , text] = result
    apply(
      ctx,
      blockID,
      offset,
      text,
      TextPropKey.Italic,
      1,
      fromComposition
    )
    return true
  }

  result = pretext.match(regexCode)
  if (result) {
    event.preventDefault()
    const [, , text] = result
    apply(ctx, blockID, offset, text, TextPropKey.Code, 1, fromComposition)
    return true
  }

  result = pretext.match(regexStrike)
  if (result) {
    event.preventDefault()
    const [, , text] = result
    apply(
      ctx,
      blockID,
      offset,
      text,
      TextPropKey.Strike,
      1,
      fromComposition
    )
    return true
  }

  return false
}

const apply = (
  ctx: UIHandler,
  blockID: BlockID,
  offset: number,
  text: string,
  propKey: TextPropKey,
  tokenLength: number,
  fromComposition: boolean
): void => {
  const lastPadding = fromComposition ? 1 : 0
  const bool = ctx.editor.selector.textProps[propKey] ? null : true
  const operator = ctx.editor.newOperator()
  operator.format(propKey, bool, {
    start: {blockID, offset: offset - text.length - tokenLength - lastPadding},
    end: {blockID, offset: offset - tokenLength - lastPadding},
  })
  operator.deleteRange({
    blockID,
    index: offset - tokenLength - lastPadding,
    length: tokenLength + lastPadding,
  })
  operator.deleteRange({
    blockID,
    index: offset - text.length - 2 * tokenLength - lastPadding,
    length: tokenLength,
  })
  operator.select(
    NBRange.decode({blockID, offset: offset - 2 * tokenLength - lastPadding})
  )
  ctx.editor.commit(operator)
}
