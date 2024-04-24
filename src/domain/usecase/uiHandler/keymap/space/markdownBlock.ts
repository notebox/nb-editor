
import {
  Unit,
  NBRange,
  BlockType,
  BlockPropKey,
  isBasicTextBlock,
} from "@/domain/entity"
import type {UIHandler} from "@/domain/usecase/uiHandler"
import Hotkeys from "@/utils/hotkeys"
import {list} from "@/presenter/blocks/typedContent/code/prismjs"
import * as utils from "../common"

export default (ctx: UIHandler, event: KeyboardEvent): boolean => {
  if (!Hotkeys.isApplyMarkdown(event)) return false

  const selection = ctx.editor.selector.selection
  if (!selection?.isCollapsed || !selection.isTextBlock) return false
  if (
    selection.start.subPath ||
    !isBasicTextBlock(ctx.editor.dataManipulator.block(selection.start.blockID))
  )
    return false
  const {blockID, offset} = selection.start
  if (!offset || offset > 18) return false
  let pretext = utils.pretext(offset, ctx.editor.dataManipulator.block(blockID))
  const fromComposition = ctx.state.working.consumeSpaceByComposition()
  if (fromComposition) {
    pretext = pretext.slice(0, -1)
  }

  const blockType = getBlockType(pretext)
  if (!blockType) return false

  const block = ctx.editor.dataManipulator.block(blockID)
  if (isHeader(block.type as BlockType) && blockType !== BlockType.Divider)
    return false

  event.preventDefault()
  const operator = ctx.editor.newOperator()
  operator.deleteBackward({unit: Unit.Line})

  if (blockType === BlockType.Divider) {
    operator.insertDivider()
  } else {
    operator.setBlockType(
      block.type === blockType ? BlockType.Line : blockType,
      blockID
    )
    ctx.editor.selector.deselect()
    ctx.editor.selector.select(NBRange.decode({blockID, offset: 0}))

    if (blockType === BlockType.OrderedList) {
      if (pretext === "1.") {
        operator.setBlockGlobalCount(blockID, null)
      } else {
        operator.setBlockGlobalCount(blockID, true)
      }
    } else if (blockType === BlockType.Codeblock) {
      const language = getCodeblockLanguage(pretext)
      if (list[language]) {
        operator.setBlockProp(blockID, BlockPropKey.Language, language)
      }
    }
  }

  ctx.editor.commit(operator)
  return true
}

const getBlockType = (pretext: string): BlockType | null => {
  if (!pretext) return null

  if (pretext.startsWith("```")) {
    if (pretext === "```mermaid") {
      return BlockType.Mermaid
    }
    if (/^\S*$/.test(pretext)) {
      return BlockType.Codeblock
    }
    return null
  }

  switch (pretext) {
  case "#":
    return BlockType.Header1
  case "##":
    return BlockType.Header2
  case "###":
    return BlockType.Header3
  case "-":
    return BlockType.UnorderedList
  case "[]":
    return BlockType.CheckList
  case ">":
    return BlockType.Blockquote
  case "1.":
    return BlockType.OrderedList
  case "---":
  case "—-":
    return BlockType.Divider
  default:
    if (/^([0-9]*)\.$/.test(pretext)) {
      return BlockType.OrderedList
    }
    return null
  }
}

const headBlockTypes = new Set([
  BlockType.Header1,
  BlockType.Header2,
  BlockType.Header3,
])
const isHeader = (blockType: BlockType): boolean => {
  return headBlockTypes.has(blockType)
}

const getCodeblockLanguage = (pretext: string): string => {
  const lang = pretext.substring(3)
  switch (lang) {
  case "js":
    return "javascript"
  case "ts":
    return "typescript"
  default:
    return lang
  }
}
