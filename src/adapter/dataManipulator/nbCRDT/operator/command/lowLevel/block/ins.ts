import type {BlockID, BlockVersion, Point} from "../../../../crdt"
import type {BlockProps} from "@/domain/entity/block/props"
import type {Operator} from "../../.."

import {
  Block,
  Text,
  TextNode,
  INSContent,
  genPointBetween,
  Span,
} from "@/adapter/dataManipulator/nbCRDT/crdt"

import {
  genBlockID,
  BlockType,
  isNoteBlock,
  isInheritingBlockType,
  isNonTextBlockType,
} from "@/domain"
import {delTextAt} from "../text/del"

export const splitTextBlock = (
  operator: Operator,
  block: Block,
  index: number
): Block | undefined => {
  const textLength = block?.text?.length()
  if (!textLength) return

  const length = textLength - index
  let ins: INSContent | undefined
  if (length > 0) {
    ins = delTextAt(operator, block.blockID, index, length)?.toINSContent()
  }

  let prevBlockPoint: Point | undefined
  let nextBlockPoint: Point | undefined
  let inheritance: Inheritance

  const childBlocks = operator.dataManipulator.childBlocks(block.blockID)
  if (childBlocks.length || isNoteBlock(block)) {
    nextBlockPoint = childBlocks[0]?.point
    inheritance = inherit(block, true)
  } else {
    prevBlockPoint = operator.dataManipulator.replica.block(block.blockID).point
    nextBlockPoint = operator.dataManipulator.replica.nextSiblingBlock(
      block.blockID
    )?.point
    inheritance = inherit(block, false)
  }

  return genBlock(operator, prevBlockPoint, nextBlockPoint, inheritance, ins)
}

export const inherit = (block: Block, asChild: boolean): Inheritance => {
  return asChild
    ? {
      parentBlockID: block.blockID,
      props: {
        TYPE: [null, BlockType.Line],
      },
    }
    : {
      parentBlockID: block.parentBlockID,
      props: {
        TYPE: [
          null,
          isInheritingBlockType(block.type)
            ? (block.type as BlockType)
            : BlockType.Line,
        ],
      },
    }
}

export const genBlock = (
  operator: Operator,
  prevBlockPoint: Point | undefined,
  nextBlockPoint: Point | undefined,
  inherited: Inheritance,
  insContent: INSContent | undefined
): Block => {
  const blockPoint = operator.dataManipulator.replica.genBlockPoint(
    prevBlockPoint,
    nextBlockPoint
  )

  const version: BlockVersion = {}
  let text: Text | undefined
  if (!isNonTextBlockType(inherited.props.TYPE![1]!)) {
    if (insContent) {
      const spanPoint = genPointBetween(operator.dataManipulator.replica.replicaID, 0)
      const insSpan = new Span<INSContent>(spanPoint, insContent)
      text = new Text(new TextNode(insSpan))
      version[operator.dataManipulator.replica.replicaID] = [0, insContent.length]
    } else {
      text = new Text(undefined)
    }
  }
  const newBlock = new Block(
    genBlockID(),
    version,
    blockPoint,
    inherited.props,
    false,
    text,
    inherited.parentBlockID
  )

  operator.dataManipulator.replica.insBlock(newBlock)
  operator.bINS(newBlock)
  return newBlock
}

export const genBlockAdvanced = (
  operator: Operator,
  parentBlockID: BlockID | undefined,
  point: Point,
  props: BlockProps,
  version?: BlockVersion,
  text?: Text | undefined
): Block => {
  const newBlock = new Block(
    genBlockID(),
    version || {},
    point,
    props,
    false,
    text,
    parentBlockID
  )
  operator.dataManipulator.replica.insBlock(newBlock)
  operator.bINS(newBlock)
  return newBlock
}

export type Inheritance = {
  parentBlockID: BlockID | undefined;
  props: BlockProps;
};
