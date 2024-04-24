import type {
  BlockID,
  BlockPropsDelta,
  DBFieldID,
  DBFieldType,
  DBDataValue,
} from "@/domain"
import type {
  BlockContentData,
  DecodedClipboardData,
  EncodedClipboardData
} from "@/adapter/dataManipulator/nbCRDT"
import type {Templates} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {NBDBEvaluatedValue} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

import {NBRange, BlockPropKey} from "@/domain"
import {evaluatedFieldToString} from "./html/encoder"
import {subCellRange} from "../range"

/** @category encode */
export const encodeNBDBToClipboardData = (templates: Templates, selection: NBRange): EncodedClipboardData | null => {
  const cellRange = subCellRange(selection as NBRange)
  if (!cellRange) return null

  const field = templates.get(cellRange.templateBlockID)?.recordMap[
    cellRange.recordBlockID
  ]?.fieldMap[cellRange.fieldID]
  if (!field) return null

  let stringified = evaluatedFieldToString(field, false).toString()
  let raw: CellData["raw"]
  if (field.fieldType === "VALUE" || field.fieldType === "NUMBER") {
    stringified =
      cellRange.offset?.isCollapsed === false
        ? stringified.substring(cellRange.offset.start, cellRange.offset.end)
        : stringified
    raw = stringified
  } else {
    raw = rawFromEvaluatedValue(field) || undefined
  }

  return {
    dataNBStringified: JSON.stringify({
      templateBlockID: cellRange.templateBlockID,
      recordBlockID: cellRange.recordBlockID,
      fieldID: cellRange.fieldID,
      fieldType: field.fieldType,
      raw,
    }),
    textHTML: stringified,
    textPlain: stringified,
  }
}

const rawFromEvaluatedValue = (
  evaluated: NBDBEvaluatedValue
): CellData["raw"] | null => {
  switch (evaluated.fieldType) {
  case "BOOLEAN":
    return evaluated.value.B
  case "DATE":
    return evaluated.value.D && ["DATE", evaluated.value.D]
  case "LABEL":
  case "LABELS":
    return (
      evaluated.value && [
        "LABELS",
        evaluated.value.L.map(label => label.labelID),
      ]
    )
  case "NUMBER":
  case "VALUE":
    return evaluated.value.S
  case "FORMULA":
  default:
    return null
  }
}

/** @category encode */
export const decodeToNBDBBlockProps = (templates: Templates, selection: NBRange, dt: DataTransfer): DecodedClipboardData | null => {
  const cellRange = subCellRange(selection)
  if (!cellRange) return null

  const blockID = cellRange.recordBlockID
  const blockData = dt.getData("data/nb-stringified")
  const cellData = blockData && (JSON.parse(blockData) as BlockContentData[] | CellData)
  const template = templates.get(cellRange.templateBlockID)

  if (!cellData || Array.isArray(cellData)) {
    const field = template?.recordMap[cellRange.recordBlockID]?.fieldMap[cellRange.fieldID]
    if (
      field &&
      (field.fieldType === "VALUE" || field.fieldType === "NUMBER")
    ) {
      const value = dt.getData("text/plain")

      return {
        type: "props",
        blockID,
        delta: asBlockPropsDelta(cellRange.fieldID, value)
      }
    }
    return {
      type: "invalid",
    }
  }

  const field =
    template?.recordMap[cellRange.recordBlockID]?.fieldMap[cellRange.fieldID]
  const fieldType = template?.fieldMap[cellRange.fieldID]?.type
  if (field && fieldType) {
    let value: DBDataValue | null = null
    if (field.fieldType === "VALUE" || field.fieldType === "NUMBER") {
      value = cellRange.offset
        ? field.value.S.substring(0, cellRange.offset.start) +
        cellData.stringified +
        field.value.S.substring(cellRange.offset.end)
        : cellData.stringified
    } else if (fieldType === cellData.fieldType) {
      value = cellData.raw || null
    }
    return {
      type: "props",
      blockID,
      delta: asBlockPropsDelta(cellRange.fieldID, value)
    }
  }
  return {
    type: "invalid",
  }
}

const asBlockPropsDelta = (
  fieldID: DBFieldID,
  VALUE: DBDataValue | null
): BlockPropsDelta => {
  return {
    [BlockPropKey.DBRecord]: {
      [fieldID]: {
        VALUE,
      },
    },
  } as BlockPropsDelta
}

type CellData = {
  templateBlockID: BlockID;
  recordBlockID: BlockID;
  fieldID: DBFieldID;
  fieldType: DBFieldType;
  stringified: string;
  raw?: DBDataValue;
};
