
import type {BlockProps} from "@/domain/entity"
import type {BlockContentData} from "@/adapter/dataManipulator/nbCRDT"
import type {Point, Block} from "../../crdt"
import type {Operator} from ".."

import {INSContent} from "../../crdt"
import {BlockType, isNoteBlock} from "@/domain/entity"
import * as lowLevel from "./lowLevel"
import {deleteSelectionAndSelect} from "./texting/deleteText"

export const setSelectionToDataTransfer = (
  operator: Operator,
  dt: DataTransfer
): void => {
  const {selection} = operator.editor.selector
  if (!selection) return

  const encoded = operator.dataManipulator.parser.encodeToClipboardData(operator.dataManipulator, selection)
  dt.setData("data/nb-stringified", encoded.dataNBStringified)
  dt.setData("text/html", encoded.textHTML)
  dt.setData("text/plain", encoded.textPlain)
}

export const insertFromClipboard = (
  operator: Operator,
  dt: DataTransfer
): void => {
  const {selection} = operator.editor.selector
  if (!selection) return

  const decoded = operator.dataManipulator.parser.decodeClipboardData(dt, selection)
  switch (decoded.type) {
  case "props":
    lowLevel.setBlockProps(operator, decoded.blockID, decoded.delta)
    return
  case "blocks":
    break
  default:
    return
  }

  if (!decoded.blocks.length) return
  if (
    selection.start.offset != null &&
    decoded.blocks.length === 1 &&
    decoded.blocks[0].text
  ) {
    const block = operator.dataManipulator.replica.block(selection.start.blockID)
    if (block.hasText()) {
      deleteSelectionAndSelect(operator)
      lowLevel.insTextAtAndSelect(
        operator,
        block.blockID,
        selection.start.offset,
        decoded.blocks[0].text && INSContent.decode(decoded.blocks[0].text)
      )
      return
    }
  }

  const endBlock = operator.dataManipulator.replica.block(selection.end.blockID)

  if (isNoteBlock(endBlock)) {
    const nextPoint = operator.dataManipulator.childBlocks(endBlock.blockID)[0]
      ?.point
    addBlocks(operator, decoded.blocks, endBlock, true, nextPoint)
    return
  } else {
    const nextPoint = operator.dataManipulator.replica.nextSiblingBlock(
      selection.end.blockID
    )?.point
    addBlocks(operator, decoded.blocks, endBlock, false, nextPoint)
    return
  }
}

/** @verbose baseBlock is endBlock when isNested is true */
const addBlocks = (
  operator: Operator,
  dataset: BlockContentData[],
  baseBlock: Block,
  isNested: boolean,
  nextPoint?: Point
): void => {
  let prevPoint: Point | undefined = isNested ? undefined : baseBlock.point

  dataset.forEach(data => {
    const inheritance = lowLevel.inherit(baseBlock, isNested)
    const custom = operator.dataManipulator.customBlocks[data.props.TYPE || ""]
    if (custom) {
      const added = custom.add(operator, data, inheritance, prevPoint, nextPoint)
      if (added) {
        prevPoint = added.point
      }
      return
    }

    const props: BlockProps = {TYPE: [null, BlockType.Line]}
    Object.entries(data.props).forEach(([key, value]) => {
      props[key] = [null, value]
    })

    const newBlock = lowLevel.genBlock(
      operator,
      prevPoint,
      nextPoint,
      {
        ...inheritance,
        props,
      },
      data.text && INSContent.decode(data.text)
    )
    addBlocks(operator, data.children, newBlock, true)
    prevPoint = newBlock.point
  })
}
