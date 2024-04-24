import type {BlockProps, SubPath} from "@/domain/entity"
import type {Point, BlockID, Block} from "../../crdt"
import type {Operator} from ".."

import {NBRange, isNoteBlock, BlockPropKey, BlockType} from "@/domain/entity"
import {genBlock, inherit} from "./lowLevel"

export const insBlock = (
  operator: Operator,
  props: BlockProps
): BlockID | null => {
  const range = operator.editor.selector.selection
  if (!range || !props.TYPE?.[1]) return null

  const blockID = range.start.blockID
  const block = operator.dataManipulator.replica.block(blockID)

  let prevPoint: Point | undefined
  let nextPoint: Point | undefined
  let parentBlockID: BlockID

  if (isNoteBlock(block)) {
    nextPoint = operator.dataManipulator.firstContentBlock()?.point
    parentBlockID = block.blockID
  } else {
    prevPoint = block.point
    nextPoint = operator.dataManipulator.replica.nextSiblingBlock(blockID)?.point
    parentBlockID = block.parentBlockID!
  }

  const newBlock = genBlock(
    operator,
    prevPoint,
    nextPoint,
    {
      parentBlockID,
      props,
    },
    undefined
  )
  operator.editor.selector.select(
    NBRange.decode({blockID: newBlock.blockID, offset: 0})
  )

  return newBlock.blockID
}

export const insDividerBlockBeforeWithoutSelection = (
  operator: Operator
): void => {
  const range = operator.editor.selector.selection
  if (!range) return

  const blockID = range.start.blockID
  const block = operator.dataManipulator.replica.block(blockID)

  if (isNoteBlock(block)) return

  const prevPoint = operator.dataManipulator.replica.prevSiblingBlock(blockID)?.point
  const nextPoint = block.point
  const parentBlockID = block.parentBlockID!

  genBlock(
    operator,
    prevPoint,
    nextPoint,
    {
      parentBlockID,
      props: {
        [BlockPropKey.TYPE]: [null, BlockType.Divider],
      },
    },
    undefined
  )
}

export const insLineBlockBelow = (
  operator: Operator,
  prevBlockID: BlockID,
  subPath?: SubPath,
): Block => {
  const prevBlock = operator.dataManipulator.replica.block(prevBlockID)
  const nextBlock = operator.dataManipulator.replica.nextSiblingBlock(prevBlockID)
  const inheritance = inherit(prevBlock, false)

  if (subPath?.type === "db-board") {
    inheritance.props.DB_RECORD = {}
    inheritance.props.DB_RECORD[subPath.fieldID] = {
      VALUE: [null, ["LABELS", [subPath.labelID]]],
    }
  }

  return genBlock(
    operator,
    prevBlock.point,
    nextBlock?.point,
    inheritance,
    undefined
  )
}
