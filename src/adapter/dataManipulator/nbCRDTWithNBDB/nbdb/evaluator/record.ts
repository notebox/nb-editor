import type {
  DBRecordPointsProp,
  DBRecordProp,
  DBFieldID,
  DBFormula,
  DBFormulaWithArgs,
  BlockID,
  DBSort,
} from "@/domain"
import type {NBDBEvaluatedValue} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

import {DBBoardUnsetLabelID} from "@/domain"
import {
  NBDBTemplateFieldMap,
  NBDBFieldMap,
  NBDBLabeledRecordIDSet,
  NBDBValue,
  NBDBBoolean,
  NBDBNumber,
  NBDBString,
  NBDBDate,
  NBDBLabels,
  NBDBField,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import {Order, Point, PointData, Block} from "@/adapter/dataManipulator/nbCRDT/crdt"
import {FormulaEvaluator} from "./formula"

export * from "./formula"
export class DBRecordEvaluator extends FormulaEvaluator {
  readonly fieldMap: NBDBFieldMap
  readonly filter?: DBFormula
  readonly labeledRecordIDSet?: NBDBLabeledRecordIDSet

  evaluated: NBDBRecordFieldMap = {}

  private blockID: BlockID
  private point: Point
  private recordProps: DBRecordProp
  private calculating: Set<string> = new Set()

  constructor(
    block: Block,
    fieldMap: NBDBFieldMap,
    filter?: DBFormula,
    labeledRecordIDSet?: NBDBLabeledRecordIDSet,
    templatePoints?: DBRecordPointsProp
  ) {
    super()
    this.fieldMap = fieldMap
    this.filter = filter
    this.labeledRecordIDSet = labeledRecordIDSet
    this.blockID = block.blockID
    this.recordProps = block.props.DB_RECORD as DBRecordProp ?? {}

    const templatePointData = templatePoints?.[block.blockID]?.[1] as PointData | undefined
    this.point = templatePointData
      ? Point.decode(templatePointData)
      : block.point
  }

  evaluateAll(): NBDBRecord | null {
    this.evaluated = {}
    const filter = this.filter
    if (filter) {
      try {
        if (!this.evaluate(filter)) return null
      } catch (err) {
        return null
      }
    }

    Object.keys(this.fieldMap).forEach(fieldID => this.evaluateProp(fieldID))
    this.calculating.clear()

    return {
      blockID: this.blockID,
      point: this.point,
      fieldMap: this.evaluated,
    }
  }

  private updateLabeledRecordsForBoard(field: NBDBField, value: NBDBLabels) {
    if (this.labeledRecordIDSet?.fieldID === field.fieldID) {
      const oldLabelID =
        this.labeledRecordIDSet.recordIDToLabelIDMap[this.blockID]
      const newLabelID = value.data[0]?.labelID ?? DBBoardUnsetLabelID

      if (oldLabelID !== newLabelID) {
        this.labeledRecordIDSet.recordIDToLabelIDMap[this.blockID] = newLabelID
        if (oldLabelID) {
          this.labeledRecordIDSet.labelIDToRecordIDsMap[oldLabelID]?.delete(
            this.blockID
          )
        }
        if (newLabelID) {
          this.labeledRecordIDSet.labelIDToRecordIDsMap[newLabelID]?.add(
            this.blockID
          )
        }
      }
    }
  }

  private evaluateProp(fieldID: DBFieldID): NBDBEvaluatedValue {
    const evaluated = this.evaluated[fieldID]
    if (evaluated) {
      return evaluated
    }

    const field = this.fieldMap[fieldID]
    if (!field)
      return {
        fieldID,
        fieldType: "VALUE",
        value: NBDBString.asError(`[prop(${fieldID})] does not exist.`),
      }

    const data = this.recordProps?.[fieldID]
    const rawValue = data?.VALUE?.[1]
    let value: NBDBValue
    switch (field?.type) {
    case "NUMBER":
      value = NBDBNumber.fromDB(rawValue)
      break
    case "VALUE":
      value = NBDBString.fromDB(rawValue)
      break
    case "BOOLEAN":
      value = NBDBBoolean.fromDB(rawValue)
      break
    case "FORMULA":
      value = field.formula
        ? this.evaluateFormula(fieldID, field.formula)
        : NBDBString.fromDB("")
      break
    case "LABEL":
      value = NBDBLabels.fromDB(rawValue, false, field.labelMap)
      this.updateLabeledRecordsForBoard(field, value)
      break
    case "LABELS":
      value = NBDBLabels.fromDB(rawValue, true, field.labelMap)
      break
    case "DATE":
      value = NBDBDate.fromDB(rawValue)
      break
    }

    const result: NBDBEvaluatedValue = {
      fieldID,
      fieldType: field.type,
      format: data?.FORMAT?.[1],
      value,
    }

    this.evaluated[fieldID] = result
    return result
  }

  /** @purpose formula */
  prop = (data: DBFormulaWithArgs): NBDBValue => {
    const fieldID = data[1] as string
    if (this.calculating.has(fieldID)) {
      throw this.SetEvaluatedAndThrowError(fieldID, "circular reference error")
    }

    const evaluated = this.evaluateProp(fieldID)
    if (evaluated.value.isError)
      throw new Error(
        this.fieldMap[fieldID]
          ? `[prop(${this.fieldMap[fieldID].name})] is error.`
          : evaluated.value.S
      )
    return evaluated.value as NBDBValue
  }

  /** @category private */
  private evaluateFormula(fieldID: DBFieldID, data: DBFormula): NBDBValue {
    let result: NBDBValue
    this.calculating.add(fieldID)
    try {
      result = this.evaluate(data)
    } catch (err) {
      result = NBDBString.asError((err as Error).message)
    }
    this.calculating.delete(fieldID)
    return result
  }

  private SetEvaluatedAndThrowError = (
    fieldID: DBFieldID,
    message: string
  ): Error => {
    this.evaluated[fieldID].value = NBDBString.asError(message)
    return new Error(message)
  }
}

export const sortRecords = (
  records: NBDBRecord[],
  sort: DBSort,
  fieldMap: NBDBTemplateFieldMap
) => {
  return records
    .sort((a, b) => {
      switch (a.point.compare(b.point)) {
      case Order.Less:
        return -1
      case Order.Greater:
        return 1
      default:
        return 0
      }
    })
    .sort((a, b) => {
      let result = 0

      for (let i = 0; i < sort.length; i++) {
        const field = fieldMap[sort[i][0]]
        if (!field?.visible) continue

        const aValue = a.fieldMap[field.fieldID].value
        const bValue = b.fieldMap[field.fieldID].value

        if (bValue.isError) {
          result = aValue.isError ? 0 : -1
        } else if (aValue.isError) {
          result = 1
        } else if (
          aValue.dataType === "LABELS" &&
          bValue.dataType === "LABELS"
        ) {
          const a = aValue.L
          const b = bValue.L

          result = a.length - b.length

          if (result === 0 && a.length) {
            a.some(({order}, idx) => {
              result = b[idx].order - order
              return result !== 0
            })
          }
        } else if (
          aValue.dataType === "STRING" &&
          bValue.dataType === "STRING"
        ) {
          const a = NBDBString.toData(aValue as NBDBValue)
          const b = NBDBString.toData(bValue as NBDBValue)
          result = a === b ? 0 : a < b ? -1 : 1
        } else {
          const a = NBDBNumber.toData(aValue as NBDBValue)
          const b = NBDBNumber.toData(bValue as NBDBValue)
          result = a.equals(b) ? 0 : a.lessThan(b) ? -1 : 1
        }

        if (result !== 0) {
          result = sort[i][1] ? -result : result
          break
        }
      }

      return result
    })
}

export type NBDBRecord = {
  blockID: BlockID;
  point: Point;
  fieldMap: NBDBRecordFieldMap;
};

export type NBDBRecordFieldMap = {
  [fieldID: string]: NBDBEvaluatedValue;
};
