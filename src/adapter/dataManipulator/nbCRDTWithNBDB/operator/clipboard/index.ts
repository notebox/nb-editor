import {
  Point,
  BlockID,
  genPointBetween,
} from "@/adapter/dataManipulator/nbCRDT/crdt"
import {BlockProps} from "@/domain/entity/block/props"
import type {BlockContentData} from "@/adapter/dataManipulator/nbCRDT"
import type {NBDBContent, NBDBTableContent} from "@/adapter/dataManipulator/nbCRDTWithNBDB/parser/data"
import type {Operator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {Inheritance} from "@/adapter/dataManipulator/nbCRDT/operator/command/lowLevel"

import {BlockPropKey, BlockType} from "@/domain/entity/block/props"
import * as lowLevel from "@/adapter/dataManipulator/nbCRDT/operator/command/lowLevel"
import {NBDBRemapper} from "./remapper"

export const addDBBlock = (
  operator: Operator,
  data: BlockContentData,
  inheritance: Inheritance,
  prevPoint?: Point,
  nextPoint?: Point
) => {
  const customData = data.custom?.[BlockType.Database] as NBDBContent | undefined
  if (!customData) return

  const remapper = new NBDBRemapper(operator, customData)
  const props: BlockProps = {
    TYPE: [null, BlockType.Database],
    CAPTION: [null, data.props.CAPTION],
    DB_TEMPLATE: [null, data.props.DB_TEMPLATE ?? BlockPropKey.DBSpreadsheet],
  }

  if (customData.table.tableBlockID) {
    props.DB_TABLE_ID = [null, customData.table.tableBlockID]
  } else {
    props.DB_TABLE = remapper.mapFields(customData.table.allFields)
  }

  if (customData.board) {
    props.DB_BOARD = remapper.mapBoard(customData.board)
  }

  if (customData.spreadsheet || (!customData.board && customData.spreadsheet)) {
    props.DB_SPREADSHEET = remapper.mapSpreadsheet(customData.spreadsheet)
  }

  const newDBBlockPoint = operator.dataManipulator.replica.genBlockPoint(
    prevPoint,
    nextPoint
  )

  const pointNonce = remapper.isRemapped
    ? remapper.pointNonce + customData.table.allRecords.length
    : remapper.pointNonce

  const newDBBlock = lowLevel.genBlockAdvanced(
    operator,
    inheritance.parentBlockID,
    newDBBlockPoint,
    props,
    pointNonce ? {[operator.dataManipulator.replica.replicaID]: [0, pointNonce]} : undefined
  )

  if (remapper.isRemapped) {
    addDBRecordBlocks(operator, newDBBlock.blockID, customData.table, remapper)
  }

  return newDBBlock
}

const addDBRecordBlocks = (
  operator: Operator,
  parentBlockID: BlockID,
  table: NBDBTableContent,
  remapper: NBDBRemapper
): void => {
  let nonce = remapper.pointNonce
  let lowerPoint: Point
  table.allRecords.forEach(recordContent => {
    lowerPoint = genPointBetween(
      operator.dataManipulator.replica.replicaID,
      nonce,
      lowerPoint,
      undefined,
      true
    )
    nonce++

    lowLevel.genBlockAdvanced(operator, parentBlockID, lowerPoint, {
      TYPE: [null, BlockType.DBRecord],
      DB_RECORD: remapper.mapRecord(table.allFields, recordContent),
    })
  })
}
