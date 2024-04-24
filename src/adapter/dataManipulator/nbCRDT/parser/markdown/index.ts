import type {Block, Text} from "@/adapter/dataManipulator/nbCRDT/crdt"
import type {NBDataManipulator} from "../.."

import {BlockType, Markdown} from "@/domain/entity"
import {markdownFromText} from "./text"

export const encode = (dataManipulator: NBDataManipulator): Markdown => {
  const note = dataManipulator.rootBlock()
  const result = {
    markdown: `# ${markdownFromText(note.text as unknown as Text)}  \n`,
    resources: [],
  }
  dataManipulator.childBlocks(note.blockID).forEach(block => {
    transformBlock(dataManipulator, result, block as Block)
  })
  return result
}

const transformBlock = (dataManipulator: NBDataManipulator, result: Markdown, block: Block, childPretext = "") => {
  result.markdown += childPretext

  const custom = dataManipulator.customBlocks[block.type]
  if (custom) {
    result.markdown += custom.encoder.encodeToMarkdown(dataManipulator, block)
    return
  }

  switch (block.type) {
  case BlockType.Line:
    transformTextBlock(dataManipulator, result, block)
    break
  case BlockType.Header1:
    transformTextBlock(dataManipulator, result, block, "# ")
    break
  case BlockType.Header2:
    transformTextBlock(dataManipulator, result, block, "## ")
    break
  case BlockType.Header3:
    transformTextBlock(dataManipulator, result, block, "### ")
    break
  case BlockType.UnorderedList:
    transformTextBlock(dataManipulator, result, block, "- ", undefined, childPretext + "  ")
    break
  case BlockType.OrderedList:
    transformTextBlock(dataManipulator, result, block, "1. ", undefined, childPretext + "  ")
    break
  case BlockType.CheckList: {
    const check = block.props.DONE?.[1] ? "- [x] " : "- [ ] "
    transformTextBlock(dataManipulator, result, block, check, undefined, childPretext + "  ")
    break
  }
  case BlockType.Blockquote:
    transformTextBlock(dataManipulator, result, block, "\n> ", "  \n\n")
    break
  case BlockType.Mermaid:
  case BlockType.Codeblock: {
    const pretext = "\n```" + (block.props.CODEBLOCK?.[1] ?? "") + "\n"
    const code = block.text?.toString() ?? ""
    result.markdown += pretext + code + "  \n```\n\n"
    break
  }
  case BlockType.Image: {
    const caption =
        block.props.CAPTION?.[1] ??
        block.props.SRC?.[1] ??
        block.props.FILE_ID?.[1] ??
        "image"
    let markdown = `\n![${caption}]`
    if (block.props.SRC?.[1]) {
      markdown += `(${block.props.SRC[1]})`
    } else if (block.props.FILE_ID?.[1]) {
      markdown += `(nb-cache://image/fileID?${block.props.FILE_ID[1]})`
      result.resources.push({
        fileID: block.props.FILE_ID[1],
        caption,
        markdown,
      })
    } else {
      break
    }
    result.markdown += markdown + "  \n\n"
    break
  }
  case BlockType.Divider:
    result.markdown += "\n---  \n\n"
    break
  case BlockType.Linkblock:
    if (block.props.LINK?.[1]) {
      result.markdown += `\n<${block.props.LINK[1]}>  \n\n`
    }
    break
  default:
    break
  }
}

const transformTextBlock = (
  dataManipulator: NBDataManipulator,
  result: Markdown,
  block: Block,
  pre = "",
  post = "  \n",
  childPretext = ""
) => {
  result.markdown += pre + markdownFromText(block.text) + post
  dataManipulator.childBlocks(block.blockID).forEach(block => {
    transformBlock(dataManipulator, result, block as Block, childPretext)
  })
}
