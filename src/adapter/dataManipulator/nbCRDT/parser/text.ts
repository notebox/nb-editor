import type {CustomBlockHandlers} from ".."
import type {BlockContentData} from "./data"

import {INSContent} from "@/adapter/dataManipulator/nbCRDT/crdt"

const encode = (customBlocks: CustomBlockHandlers, dataset: BlockContentData[]): string => {
  if (!dataset.length) return ""

  return dataset.reduce((acc, cur) => acc + encodeDefault(customBlocks, cur), "")
}

const encodeDefault = (customBlocks: CustomBlockHandlers, data: BlockContentData): string => {
  let content: string = ""

  const customBlock = data.props.TYPE && customBlocks[data.props.TYPE]

  if (customBlock) {
    content = customBlock.encoder.encodeToText(data)
  } else if (data.text) {
    content = INSContent.decode(data.text).toTextWithMetaPlaceholder()
  } else if (data.props.TYPE === "LINK") {
    content = data.props.LINK ?? ""
  }

  return content + "\n" + encode(customBlocks, data.children)
}

export {encode}
