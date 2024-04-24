import type {
  BoardLabelsProp,
  DBFormula,
  Color,
  Props,
  PropLeaf,
  BlockPropsWithStamp,
  DBFieldProp,
  DBFieldID,
  DBLabelID,
  DBLabel,
  DBValueProp,
  DBRecordProp,
  DBSort,
  DBBoardProp,
  DBSpreadsheetProp,
  DBTableProp,
} from "@/domain"
import type {
  NBDBContent,
  NBDBRecordContent,
  NBDBBoardContent,
  NBDBSpreadsheetContent,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/parser/data"
import type {NBDBRecordFieldMap} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"

import {DBBoardUnsetLabelID, isFormulaWithArgs} from "@/domain"
import {Operator} from "@/adapter/dataManipulator/nbCRDT/operator"

import {NBDBField, NBDBEvaluatedValue} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

export class NBDBRemapper {
  isRemapped = false
  pointNonce = 0

  private fields: {[oldFieldID: DBFieldID]: NonceTrackerField} = {}

  constructor(operator: Operator, nbdb: NBDBContent) {
    if (nbdb.table.tableBlockID) return

    this.isRemapped = true
    nbdb.table.allFields.forEach(field => {
      const labelIDs: {[oldLabelID: DBLabelID]: DBLabelID} = {}
      this.pointNonce += 1
      this.fields[field.fieldID] = {
        fieldID: operator.dataManipulator.replica.genIdentifier(this.pointNonce),
        labelIDs,
      }

      if (!field.labelMap) return

      Object.values(field.labelMap).forEach(label => {
        this.pointNonce += 1
        labelIDs[label.labelID] = operator.dataManipulator.replica.genIdentifier(
          this.pointNonce
        )
      })
    })
  }

  mapFields = (fields: NBDBField[]): DBTableProp => {
    const result: DBTableProp = {}

    fields.forEach(field => {
      const fieldID = this.mapFieldID(field.fieldID)
      if (!fieldID) return

      const prop: DBFieldProp = {
        NAME: [null, field.name],
      }

      if (field.type) {
        prop.TYPE = [null, field.type]
      }

      const labels = Object.values(field.labelMap ?? {})
      if (labels.length) {
        const labelMap: Props & {
          [labelID: DBLabelID]: BlockPropsWithStamp<DBLabel>;
        } = {}

        labels.forEach(label => {
          const labelID = this.mapLabelID(field.fieldID, label.labelID)
          if (!labelID) return

          labelMap[labelID] = {
            ORDER: [null, label.order],
            NAME: [null, label.name],
            COLOR: [null, label.color as Color],
          }
        })
        if (Object.keys(labelMap).length) {
          prop.LABELS = labelMap
        }
      }

      if (field.formula) {
        prop.FORMULA = [null, this.mapFormula(field.formula)]
      }

      result[fieldID] = prop
    })

    return result
  }

  mapSpreadsheet = (content: NBDBSpreadsheetContent): DBSpreadsheetProp => {
    const result: DBSpreadsheetProp = {
      FIELDS: {},
    }
    this.mapSortAndFilter(content, result)
    Object.entries(content.fieldMap).forEach(([oldFieldID, field]) => {
      const fieldID = this.mapFieldID(oldFieldID)
      if (!fieldID) return
      result.FIELDS![fieldID] = {
        ORDER: [null, field.order],
        VISIBLE: [null, field.visible],
      }
      const aggregation = content.aggregationMap[oldFieldID]
      if (aggregation) {
        result.FIELDS![fieldID].AGGREGATION = [null, aggregation.key]
      }
    })
    return result
  }

  mapBoard = (content: NBDBBoardContent): DBBoardProp => {
    const result: DBBoardProp = {
      FIELDS: {},
    }
    if (!content.boardFieldID) return result
    this.mapSortAndFilter(content, result)

    const boardFieldID = this.mapFieldID(content.boardFieldID)
    result.FIELD_ID = [null, boardFieldID]
    Object.entries(content.fieldMap).forEach(([oldFieldID, field]) => {
      const fieldID = this.mapFieldID(oldFieldID)
      if (!fieldID) return
      result.FIELDS![fieldID] = {
        ORDER: [null, field.order],
        VISIBLE: [null, field.visible],
      }
      if (fieldID !== boardFieldID) return

      result.FIELDS![fieldID].LABELS = Object.entries(
        content.labelMap
      ).reduce<BoardLabelsProp>((acc, [oldLabelID, label]) => {
        const labelID = this.mapLabelID(oldFieldID, oldLabelID)
        if (labelID) {
          acc[labelID] = {
            ORDER: [null, label.order],
            VISIBLE: [null, label.visible],
          }
          const aggregation = content.aggregationMap[oldLabelID]
          if (aggregation) {
            acc[labelID].AGGREGATION = [
              null,
              [aggregation.key, aggregation.fieldID],
            ]
          }
        }
        return acc
      }, {})
    })

    return result
  }

  mapRecord = (
    fields: NBDBField[],
    recordContent: NBDBRecordContent
  ): DBRecordProp => {
    return recordContent.prop
      ? this.mapRecordProp(recordContent.prop)
      : this.mapRecordEvaluated(fields, recordContent.evaluated)
  }

  private mapFieldID(fieldID: DBFieldID): DBFieldID | undefined {
    return this.isRemapped ? this.fields[fieldID]?.fieldID : fieldID
  }

  private mapLabelID(
    oldFieldID: DBFieldID,
    oldLabelID: DBLabelID
  ): DBLabelID | undefined {
    if (oldLabelID === DBBoardUnsetLabelID) return
    return this.isRemapped
      ? this.fields[oldFieldID]?.labelIDs[oldLabelID]
      : oldLabelID
  }

  private mapLabelIDs(fieldID: DBFieldID, labelIDs: DBLabelID[]): DBLabelID[] {
    if (!this.isRemapped) return labelIDs

    const labelIDsMap = this.fields[fieldID]?.labelIDs
    if (!labelIDsMap) return []

    return labelIDs.reduce<DBLabelID[]>((acc, cur) => {
      const labelID = labelIDsMap[cur]
      if (labelID) {
        acc.push(labelID)
      }
      return acc
    }, [])
  }

  private mapFormula(formula: DBFormula): DBFormula {
    if (!this.isRemapped || !isFormulaWithArgs(formula)) return formula

    if (formula[0] === "prop") {
      return ["prop", this.mapFieldID(formula[1] as DBFieldID) || formula[1]]
    }
    const [fn, ...params] = formula
    return [
      fn,
      ...params.map(param => {
        if (Array.isArray(param)) {
          return this.mapFormula(param)
        }
        return param
      }),
    ]
  }

  private mapSort(sort: DBSort): DBSort {
    if (!this.isRemapped) return sort
    return sort.reduce<DBSort>((acc, cur) => {
      const fieldID = this.mapFieldID(cur[0])
      if (fieldID) {
        acc.push(cur[1] ? [fieldID, cur[1]] : [fieldID])
      }
      return acc
    }, [])
  }

  private mapSortAndFilter(
    content: NBDBSpreadsheetContent | NBDBBoardContent,
    prop: DBSpreadsheetProp | DBBoardProp
  ) {
    if (content.sort) {
      prop.SORT = [null, this.mapSort(content.sort)]
    }
    if (content.filter) {
      prop.FILTER = [null, this.mapFormula(content.filter)]
    }
  }

  private mapRecordEvaluated = (
    fields: NBDBField[],
    recordEvaluated: NBDBRecordFieldMap
  ): DBRecordProp => {
    const result: DBRecordProp = {}
    fields.forEach(field => {
      const fieldID = this.mapFieldID(field.fieldID)
      if (!fieldID) return
      const cell: NBDBEvaluatedValue = recordEvaluated[field.fieldID]
      if (!cell) return
      const prop: DBValueProp = {}
      switch (field.type) {
      case "LABEL":
      case "LABELS":
        prop.VALUE = [
          null,
          [
            "LABELS",
            this.mapLabelIDs(
              field.fieldID,
              cell.value.L.map(label => label.labelID)
            ),
          ],
        ]
        break
      case "FORMULA":
        return
      case "BOOLEAN":
        prop.VALUE = [null, cell.value.B]
        break
      case "NUMBER":
      case "VALUE":
        prop.VALUE = [null, cell.value.S]
        break
      case "DATE":
        if (cell.value.D) {
          prop.VALUE = [null, ["DATE", cell.value.D]]
          break
        } else {
          return
        }
      }
      if (cell.format) {
        prop.FORMAT = [null, cell.format as PropLeaf]
      }
      result[fieldID] = prop
    })
    return result
  }

  private mapRecordProp = (recordProp: DBRecordProp): DBRecordProp => {
    const result: DBRecordProp = {}
    Object.entries(recordProp).forEach(([oldFieldID, attr]) => {
      const fieldID = this.mapFieldID(oldFieldID)
      const value = attr.VALUE?.[1]
      if (!fieldID || !value) return

      if (Array.isArray(value)) {
        switch (value[0]) {
        case "FORMULA":
          result[fieldID] = {
            VALUE: [null, ["FORMULA", this.mapFormula(value[1])]],
          }
          break
        case "LABELS":
          result[fieldID] = {
            VALUE: [null, ["LABELS", this.mapLabelIDs(oldFieldID, value[1])]],
          }
          break
        case "DATE":
          result[fieldID] = {
            VALUE: [null, value],
          }
        }
      } else {
        result[fieldID] = {
          VALUE: [null, value],
        }
      }
    })
    return result
  }
}

export type NonceTrackerField = {
  fieldID: DBFieldID;
  labelIDs: {
    [oldLabelID: DBLabelID]: DBLabelID;
  };
};
