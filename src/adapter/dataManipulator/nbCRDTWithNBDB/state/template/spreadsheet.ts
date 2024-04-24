import type {DBFieldID, DBSpreadsheetProp} from "@/domain"
import type {NBDBRecord} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"
import type {PresenterBlockProps} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {NBDBAggregation} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/aggregation"

import {BlockPropKey} from "@/domain/entity"
import {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"
import {aggregate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/aggregation"
import {sortRecords} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"
import {NBDBTemplate} from "./common"

export class NBDBSpreadsheet extends NBDBTemplate {
  readonly type = BlockPropKey.DBSpreadsheet

  records: NBDBRecord[] = []
  aggregationMap: NBDBSpreadsheetAggregation = {}

  constructor(props: PresenterBlockProps) {
    super(props)
    this.updateAll(this.templateProps)
  }

  get templateProps(): DBSpreadsheetProp {
    return (this.templateBlock.props.DB_SPREADSHEET || {}) as DBSpreadsheetProp
  }

  afterUpdate(props: DBSpreadsheetProp): void {
    super.afterUpdate(props)
    this.sortRecords()
    this.aggregateRecords(props)
  }

  movField(fieldID: string, to: string, prev: boolean): void {
    if (fieldID === to) return
    const fieldIDs = this.visibleFields.map(field => field.fieldID)
    const fromIDX = fieldIDs.findIndex(item => item === fieldID)
    fieldIDs.splice(fromIDX, 1)
    const toIDX = fieldIDs.findIndex(item => item === to) + (prev ? 0 : 1)
    fieldIDs.splice(toIDX, 0, fieldID)
    const operator = this.editor.newOperator() as NBOperator
    Command.moveDataField(operator, this.templateBlockID, fieldIDs)
    this.editor.commit(operator)
    this.updateAll(this.templateProps)
  }

  onClickAddRecord = (event?: React.MouseEvent, fieldID?: DBFieldID): void => {
    event?.preventDefault()
    this.editor.emitter.emitHaptic()

    const operator = this.editor.newOperator() as NBOperator
    const blockID = Command.addDBRecord(operator, this.tableBlockID)
    this.editor.commit(operator)
    this.selectAndFocus(blockID, fieldID)
  }

  onClickAggregation = (event: React.MouseEvent, fieldID: DBFieldID) => {
    this.editor.popup({
      type: "db-aggregation",
      meta: {
        spreadsheet: {
          templateBlockID: this.templateBlockID,
          fieldID,
        },
      },
    }, event)
  }

  private sortRecords() {
    if (this.sort) {
      const records = Object.values(this.recordMap).filter(
        record => record
      ) as NBDBRecord[]
      this.records = sortRecords(records, this.sort, this.fieldMap)
    } else {
      this.records = this.editor.dataManipulator
        .childBlocks(this.tableBlockID)
        .reduce<NBDBRecord[]>((acc, cur) => {
          const record = this.recordMap[cur.blockID]
          if (record) {
            acc.push(record)
          }
          return acc
        }, [])
    }
  }

  private aggregateRecords(props: DBSpreadsheetProp) {
    const aggregationMap: NBDBSpreadsheetAggregation = {}
    this.visibleFields.forEach(field => {
      const aggregationKey = props.FIELDS?.[field.fieldID]?.AGGREGATION?.[1]
      if (aggregationKey) {
        const aggregation = {
          key: aggregationKey,
          name: "",
          value: "",
        }
        aggregate(field.fieldID, this.records, aggregation)
        aggregationMap[field.fieldID] = aggregation
      }
    })
    this.aggregationMap = aggregationMap
  }
}

export const isNBDBSpreadsheet = (
  template: NBDBTemplate
): template is NBDBSpreadsheet => {
  return template.type === BlockPropKey.DBSpreadsheet
}

type NBDBSpreadsheetAggregation = {
  [fieldID: DBFieldID]: NBDBAggregation;
};
