import type {CustomBlockHandlers} from "@/adapter/dataManipulator/nbCRDT"
import type {INSContentData} from "@/adapter/dataManipulator/nbCRDT/crdt"
import type {BlockContentData} from "../data"

import {BlockType} from "@/domain/entity"
import {sanitizeHTMLText} from "@/domain/usecase/sanitizer"

export const encode = (customBlocks: CustomBlockHandlers, dataset: BlockContentData[]): string => {
  if (!dataset.length) return ""

  let result = ""

  let listContainer = ""
  dataset.forEach(data => {
    const htmlListContainerTag =
      ListBlockTypeToHTMLContainerTag[data.props.TYPE!]
    if (htmlListContainerTag) {
      if (!listContainer) {
        result += `<${htmlListContainerTag}>`
        listContainer = htmlListContainerTag
      } else if (listContainer !== htmlListContainerTag) {
        result += `</${listContainer}><${htmlListContainerTag}>`
        listContainer = htmlListContainerTag
      }

      result += encodeTextBlock(customBlocks, data)
      return
    } else if (listContainer) {
      result += `</${listContainer}>`
      listContainer = ""
    }

    const customBlock = data.props.TYPE && customBlocks[data.props.TYPE]
    if (customBlock) {
      result += customBlock.encoder.encodeToHTML(data)
      return
    }

    switch (data.props.TYPE) {
    case BlockType.Image:
      result += `<img src='${data.props.SRC || ""}' />`
      break
    case BlockType.Linkblock:
      if (data.props.LINK) {
        result += `<div><a href='${data.props.LINK}'>${data.props.LINK}</a></div>`
      }
      break
    case BlockType.Divider:
      result += "<hr />"
      break
    default:
      result += encodeTextBlock(customBlocks, data)
    }
  })

  return listContainer ? result + `</${listContainer}>` : result
}

const encodeTextBlock = (customBlocks: CustomBlockHandlers, data: BlockContentData): string => {
  const tag = BasicBlockTypeHTMLTag[data.props.TYPE!] || "p"
  let textContent = encodeText(data.text)

  let dom: string
  if (tag === "code") {
    dom = `<pre><code>${sanitizeHTMLText(textContent)}</code></pre><hr />`
  } else {
    textContent = textContent.replaceAll("\n", "<br>")
    dom = `<${tag}>${textContent}</${tag}>`
  }

  return dom + encode(customBlocks, data.children)
}

const encodeText = (data?: INSContentData): string => {
  if (!data?.[1]) return ""
  const text = data[1]

  const aTags: {href: string; start: number; end: number}[] = []
  let start = 0
  data[0].forEach(leaf => {
    const end = start + leaf[0]
    if (leaf[1]?.A) {
      aTags.push({href: leaf[1].A, start, end})
    }
    start = end
  })
  if (!aTags.length) return text

  let offset = 0
  let result = ""
  aTags.forEach(aTag => {
    if (offset !== aTag.start) {
      result += text.substring(offset, aTag.start)
    }
    result += `<a href='${aTag.href}'>${text.substring(
      aTag.start,
      aTag.end
    )}</a>`
    offset = aTag.end
  })
  return result + text.substring(offset)
}

const ListBlockTypeToHTMLContainerTag: {[type: string]: string | undefined} = {
  [BlockType.UnorderedList]: "ul",
  [BlockType.OrderedList]: "ol",
  [BlockType.CheckList]: "ul",
}

const BasicBlockTypeHTMLTag: {[type: string]: string | undefined} = {
  [BlockType.Line]: "p",
  [BlockType.Header1]: "h1",
  [BlockType.Header2]: "h2",
  [BlockType.Header3]: "h3",
  [BlockType.Blockquote]: "blockquote",
  [BlockType.Codeblock]: "code",
  [BlockType.Mermaid]: "code",
  [BlockType.UnorderedList]: "li",
  [BlockType.OrderedList]: "li",
  [BlockType.CheckList]: "li",
}
