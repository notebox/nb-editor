import type {BlockID, Editor, DBFieldID, DBRecordProp, SubPath} from "@/domain"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {NBDBTemplateSelection} from "."

import {BlockPropKey, NBRange} from "@/domain"

export const offsetType = new Set(["VALUE", "NUMBER"])

const findCharInString = (
  str: string,
  match: string,
  offset: number,
  prev: boolean
): boolean => {
  return (
    (prev ? str.substring(0, offset) : str.substring(offset)).indexOf(match) >
    -1
  )
}

export const hasNewline = (
  prev: boolean,
  template: NBDBTemplate,
  subPath: SubPath,
  offset?: number
): boolean => {
  if (!offset) return false
  const recordField =
    template.recordMap[subPath.recordBlockID!]?.fieldMap[
      subPath.fieldID!
    ]
  if (!recordField || !offsetType.has(recordField.fieldType)) return false
  return findCharInString(recordField.value.S, "\n", offset, prev)
}

export const handleSelectAll = (
  editor: Editor,
  point: NBDBTemplateSelection["start"]
) => {
  const value = getDBValueValue(
    editor,
    point.subPath.recordBlockID!,
    point.subPath.fieldID!
  )

  if (
    editor.selector.selection?.isCollapsed === false &&
    value.length === editor.selector.selection.end?.offset
  ) {
    editor.selector.select(NBRange.decode({blockID: point.blockID}))
  } else {
    editor.selector.select(
      NBRange.decode(
        {
          blockID: point.blockID,
          subPath: point.subPath,
          offset: 0,
        },
        {
          blockID: point.blockID,
          subPath: point.subPath,
          offset: value.length,
        }
      )
    )
  }
  editor.state.reRender()
}

const getDBValueValue = (
  editor: Editor,
  recordBlockID: BlockID,
  fieldID: DBFieldID
): string => {
  const props = editor.dataManipulator.block(recordBlockID).props
  const value = (props[BlockPropKey.DBRecord] as DBRecordProp)?.[fieldID]?.VALUE?.[1]
  return typeof value === "string" ? value : ""
}
