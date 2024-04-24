import type {Block, INSContentData} from "@/adapter/dataManipulator/nbCRDT/crdt"
import type {
  BlockProps,
  BlockPropsContent,
  NBRange,
} from "@/domain/entity"
import type {CustomBlockHandlers, NBDataManipulator} from ".."

import {NoteBlockType, BlockType} from "@/domain/entity"

export const encode = (
  dataManipulator: NBDataManipulator,
  customBlocks: CustomBlockHandlers,
  blocks: Block[],
  range?: NBRange
): BlockContentData[] => {
  if (!blocks.length) return []

  const parentBlocks: {[blockID: string]: BlockContentData} = {}
  const data: BlockContentData[] = []
  blocks.forEach(block => {
    const content: BlockContentData = {
      props: propsToPropsContent(block.props),
      text: getText(block, range),
      children: [],
    }

    if (content.props.TYPE === NoteBlockType) {
      content.props.TYPE = BlockType.Header1
    } else {
      const customBlock = content.props.TYPE && customBlocks[content.props.TYPE]
      if (customBlock) {
        content.custom = {
          [content.props.TYPE!]: customBlock.encoder.encodeToCustomData(dataManipulator, block)
        }
      }
      parentBlocks[block.blockID] = content
    }

    const parentBlock =
      block.parentBlockID && parentBlocks[block.parentBlockID]
    if (parentBlock) {
      parentBlock.children.push(content)
    } else {
      data.push(content)
    }
  })

  return data
}

const propsToPropsContent = (props: BlockProps): BlockPropsContent => {
  const result: BlockPropsContent = {}
  Object.entries(props).forEach(([key, stamped]) => {
    const value = stamped?.[1]
    if (value) {
      result[key] = value
    }
  })
  return result
}

const getText = (
  block: Block,
  range: NBRange | undefined
): INSContentData | undefined => {
  const text = block.text
  if (!text) return text

  if (range) {
    if (range.start.offset != null && range.start.blockID === block.blockID) {
      if (range.end.offset != null && range.end.blockID === block.blockID) {
        return text
          .subSpans(range.start.offset, range.end.offset)
          .toINSContent()
          ?.encode()
      }
      return text.spans().toINSContent()?.slice(range.start.offset).encode()
    }
    if (range.end.offset != null && range.end.blockID === block.blockID) {
      return text.spans().toINSContent()?.slice(0, range.end.offset).encode()
    }
  }

  return block.text?.spans().toINSContent()?.encode()
}

export type BlockContentData = {
  props: BlockPropsContent;
  text?: INSContentData | undefined;
  custom?: {[key: string]: unknown};
  children: BlockContentData[];
};
