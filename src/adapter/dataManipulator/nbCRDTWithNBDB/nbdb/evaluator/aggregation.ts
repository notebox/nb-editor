import type {DBFieldID, DBFieldAggregationKey} from "@/domain"
import type {NBDBEvaluatedValue} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBRecord} from "./record"

import BN from "decimal.js"
import {
  NBDBBoolean,
  NBDBNumber,
  NBDBString,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

export const aggregate = (
  fieldID: DBFieldID,
  records: NBDBRecord[],
  aggregation: NBDBAggregation
): void => {
  switch (aggregation.key) {
  case "count":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = records.length.toString()
    return
  case "countEmpty": {
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = countEmpty(fieldID, records).toString()
    return
  }
  case "countNotEmpty":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = countNotEmpty(fieldID, records).toString()
    return
  case "countTruthy": {
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = countTruthy(fieldID, records).toString()
    return
  }
  case "countFalsy":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = countFalsy(fieldID, records).toString()
    return
  case "countUnique":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = records
      .reduce(
        (set, record) =>
          set.add(NBDBString.toData(record.fieldMap[fieldID].value)),
        new Set()
      )
      .size.toString()
    return
  case "percentEmpty":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = percent(countEmpty(fieldID, records), records.length)
    return
  case "percentNotEmpty":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = percent(
      countNotEmpty(fieldID, records),
      records.length
    )
    return
  case "percentTruthy":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = percent(
      countTruthy(fieldID, records),
      records.length
    )
    return
  case "percentFalsy":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = percent(countFalsy(fieldID, records), records.length)
    return
  case "sum":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = sum(fieldID, records).toString()
    return
  case "average":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = sum(fieldID, records)
      .dividedBy(records.length)
      .toString()
    return
  case "median": {
    const range = minmax(fieldID, records)
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = range
      ? range.max.plus(range.min).dividedBy(2).toString()
      : ""
    return
  }
  case "min":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = minmax(fieldID, records)?.min.toString() || ""
    return
  case "max":
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = minmax(fieldID, records)?.max.toString() || ""
    return
  case "range": {
    const range = minmax(fieldID, records)
    aggregation.name = aggregationNameMap[aggregation.key]
    aggregation.value = range?.max.sub(range.min).toString() || ""
    return
  }
  }
}

const countNotEmpty = (fieldID: DBFieldID, records: NBDBRecord[]): number => {
  return records.length - countEmpty(fieldID, records)
}

const countEmpty = (fieldID: DBFieldID, records: NBDBRecord[]): number => {
  return records.reduce((acc, cur) => {
    const evaluated: NBDBEvaluatedValue = cur.fieldMap[fieldID]
    switch (evaluated.fieldType) {
    case "LABEL":
    case "LABELS":
      return evaluated.value.L.length ? acc : acc + 1
    case "DATE":
      return evaluated.value.D ? acc + 1 : acc
    case "BOOLEAN":
      return acc
    default:
      return evaluated.value.S === "" ? acc + 1 : acc
    }
  }, 0)
}

const countTruthy = (fieldID: DBFieldID, records: NBDBRecord[]): number => {
  return records.reduce((acc, cur) => {
    const value = cur.fieldMap[fieldID].value
    return NBDBBoolean.toData(value) ? acc + 1 : acc
  }, 0)
}

const countFalsy = (fieldID: DBFieldID, records: NBDBRecord[]): number => {
  return records.length - countTruthy(fieldID, records)
}

const percent = (numerator: number, denominator: number): string => {
  return (
    Number(
      new BN(numerator).times(100).dividedBy(denominator).toFixed(2)
    ).toString() + "%"
  )
}

const sum = (fieldID: DBFieldID, records: NBDBRecord[]): BN => {
  return records.reduce<BN>((acc, cur) => {
    return acc.plus(NBDBNumber.toData(cur.fieldMap[fieldID].value))
  }, new BN(0))
}

const minmax = (
  fieldID: DBFieldID,
  records: NBDBRecord[]
): {min: BN; max: BN} | null => {
  return records.reduce<{min: BN; max: BN} | null>((acc, cur) => {
    const number = NBDBNumber.toData(cur.fieldMap[fieldID].value)
    if (!acc) {
      return {min: number, max: number}
    }
    if (number.lessThan(acc.min)) {
      acc.min = number
    }
    if (number.greaterThan(acc.max)) {
      acc.max = number
    }
    return acc
  }, null)
}

const aggregationNameMap = {
  count: "COUNT",
  countEmpty: "EMPTY",
  countNotEmpty: "NOT EMPTY",
  percentEmpty: "EMPTY",
  percentNotEmpty: "NOT EMPTY",
  countUnique: "UNIQUE",
  countTruthy: "TRUTHY",
  countFalsy: "FALSY",
  percentTruthy: "TRUTHY",
  percentFalsy: "FALSY",
  sum: "SUM",
  average: "AVERAGE",
  median: "MEDIAN",
  min: "MIN",
  max: "MAX",
  range: "RANGE",
}

export type NBDBAggregation = {
  key: DBFieldAggregationKey;
  name: string;
  value: string;
};
