import type {
  BlockID,
  BlockPropsDelta,
  NBPoint,
  SubPath,
} from "@/domain/entity"
import type {Operator} from "../.."
import type {
  DeleteRangeParams,
  InsertTextAtParams,
  ModifyTextAtParams,
} from "."

import {reverse as reverseText} from "esrever"
import {Unit, NBRange, BlockPropKey} from "@/domain/entity"
import {getLengthToDelete} from "./deleteText"
import {deleteSubstring, insertSubstring, modifySubstring} from "./common"

import * as lowLevel from "../lowLevel"

export const deleteRange = (
  operator: Operator,
  params: DeleteRangeParams & {subPath: SubPath}
) => {
  let value = getValue(operator, params)
  value = deleteSubstring(value, params.index, params.index + params.length)
  setValue(operator, params, value)
}

export const deleteSelectionAndSelect = (
  operator: Operator,
  selection: NBRange & {start: {subPath: SubPath}}
) => {
  const point = selection.start
  let value = getValue(operator, point)
  value = deleteSubstring(
    value,
    selection.start.offset!,
    selection.end.offset!
  )
  setValue(operator, point, value)
  select(operator, selection.start, selection.start.offset!)
}

export const deleteTextAndSelect = (
  operator: Operator,
  point: NBPoint & {subPath: SubPath},
  unit: Unit,
  backward: boolean
): void => {
  let offset = point.offset!
  let value = getValue(operator, point)

  const valueToDelete = backward
    ? reverseText(value.substring(0, offset))
    : value.substring(offset)
  if (!valueToDelete) return

  const length = getLengthToDelete(valueToDelete, unit)
  if (length < 1) return
  if (backward) {
    offset = offset - length
    value = deleteSubstring(value, offset, offset + length)
  } else {
    value = deleteSubstring(value, offset, offset + length)
  }

  setValue(operator, point, value)
  select(operator, point, offset)
}

export const insertTextAtAndSelect = (
  operator: Operator,
  params: InsertTextAtParams & {subPath: SubPath}
) => {
  let value = getValue(operator, params)
  value = insertSubstring(value, params.index, params.text)
  setValue(operator, params, value)
  select(operator, params, params.index + params.text.length)
}

export const modifyTextAt = (
  operator: Operator,
  params: ModifyTextAtParams & {subPath: SubPath}
) => {
  let value = getValue(operator, params)
  value = modifySubstring(value, params.index, params.to)
  setValue(operator, params, value)
}

const getValue = (
  operator: Operator,
  path: {
    blockID: BlockID;
    subPath: SubPath;
  }
): string => {
  switch (path.subPath.type) {
  case "caption":
    return operator.dataManipulator.replica.block(path.blockID).props[BlockPropKey.Caption]?.[1] ?? ""
  case "db": {
    const value = operator.dataManipulator.replica.block(path.subPath.recordBlockID)
      .props[BlockPropKey.DBRecord]?.[path.subPath.fieldID ?? ""]?.VALUE?.[1]
    return typeof value === "string" ? value : ""
  }
  default:
    return ""
  }
}

const setValue = (
  operator: Operator,
  path: {
    blockID: BlockID;
    subPath: SubPath;
  },
  VALUE: string
): void => {
  switch (path.subPath.type) {
  case "caption":
    lowLevel.setBlockProps(operator, path.blockID, {
      [BlockPropKey.Caption]: VALUE,
    })
    break
  case "db": {
    const fieldID = path.subPath.fieldID
    if (!fieldID) break
    lowLevel.setBlockProps(operator, path.subPath.recordBlockID, {
      [BlockPropKey.DBRecord]: {
        [fieldID]: {
          VALUE,
        },
      },
    } as BlockPropsDelta)
    break
  }
  }
}

const select = (
  operator: Operator,
  path: {
    blockID: BlockID;
    subPath: SubPath;
  },
  offset: number
): void => {
  operator.select(
    NBRange.decode({blockID: path.blockID, subPath: path.subPath, offset})
  )
}