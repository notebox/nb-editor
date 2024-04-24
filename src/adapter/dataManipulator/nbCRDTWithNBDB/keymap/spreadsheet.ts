import type {BlockID, DBFieldID, NBPoint, Editor} from "@/domain"
import type {NBDBTemplateSelection} from "."

import Hotkeys from "@/utils/hotkeys"
import {NBRange} from "@/domain"
import {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import {handleSelectAll, hasNewline, offsetType} from "./common"

export default (
  event: KeyboardEvent,
  editor: Editor,
  template: NBDBSpreadsheet,
  selection: NBDBTemplateSelection
): boolean => {
  const point = selection.start

  if (Hotkeys.isMoveUp(event)) {
    if (
      hasNewline(
        true,
        template,
        selection.start.subPath,
        selection.start.offset
      )
    )
      return false
    event.preventDefault()
    moveSelectedCellVertically(editor, template, selection.start, true)
    return true
  } else if (Hotkeys.isMoveDown(event)) {
    if (
      hasNewline(
        false,
        template,
        selection.start.subPath,
        selection.start.offset
      )
    )
      return false
    event.preventDefault()
    moveSelectedCellVertically(editor, template, selection.start, false)
    return true
  } else if (Hotkeys.isESC(event)) {
    event.preventDefault()
    if (selection.start.offset === undefined) {
      return true
    }
    selectCellWithoutCaret(editor, selection)
    return true
  } else if (Hotkeys.isSelectAll(event)) {
    event.preventDefault()
    handleSelectAll(editor, point)
    editor.state.reRender()
    return true
  } else if (Hotkeys.isShiftEnter(event)) {
    event.preventDefault()
    moveSelectedCellVertically(editor, template, point, true)
    return true
  } else if (Hotkeys.isEnter(event)) {
    event.preventDefault()
    if (point.offset) {
      if (!moveSelectedCellVertically(editor, template, point, false)) {
        template.onClickAddRecord(undefined, point.subPath.fieldID)
      }
      return true
    }
    template.editValue(
      point.subPath.recordBlockID!,
      point.subPath.fieldID!
    )
    return true
  } else if (Hotkeys.isIndent(event)) {
    event.preventDefault()
    moveSelectedCellHorizontally(editor, template, point, false)
    return true
  } else if (Hotkeys.isDedent(event)) {
    event.preventDefault()
    moveSelectedCellHorizontally(editor, template, point, true)
    return true
  } else if (Hotkeys.isMoveBackward(event)) {
    if (point.offset) return false
    event.preventDefault()
    moveSelectedCellHorizontally(editor, template, point, true)
    return true
  } else if (Hotkeys.isMoveForward(event)) {
    if (point.offset !== undefined) {
      const field =
        template.recordMap[point.subPath.recordBlockID!]?.fieldMap[
          point.subPath.fieldID!
        ]
      if (
        field &&
        offsetType.has(field.fieldType) &&
        point.offset !== field.value.S.length
      )
        return false
    }
    event.preventDefault()
    moveSelectedCellHorizontally(editor, template, point, false)
    return true
  }

  return false
}

/** @deprecated */
export const selectWholeRecords = (
  editor: Editor,
  selection: NBDBTemplateSelection
): void => {
  if (selection.start.subPath.type !== "db") return
  if (!selection.start.subPath.fieldID && !selection.end?.subPath?.fieldID) return

  const blockID = selection.start.blockID
  const startRecordBlockID = selection.start.subPath.recordBlockID!
  const endRecordBlockID =
    selection.end.subPath?.recordBlockID ?? startRecordBlockID
  editor.selector.select(
    NBRange.decode(
      {
        blockID,
        subPath: {type: "db", recordBlockID: startRecordBlockID},
      },
      {
        blockID,
        subPath: {type: "db", recordBlockID: endRecordBlockID},
      }
    )
  )
  editor.state.reRender()
}

const selectCellWithoutCaret = (
  editor: Editor,
  selection: NBDBTemplateSelection
): void => {
  const {recordBlockID, fieldID} = selection.start.subPath
  editor.selector.select(
    NBRange.decode({
      blockID: selection.start.blockID,
      subPath: {type: "db", recordBlockID: recordBlockID!, fieldID},
    })
  )
  editor.state.reRender()
}

export const moveSelectedCellVertically = (
  editor: Editor,
  template: NBDBSpreadsheet,
  point: NBPoint,
  toPrev: boolean
): boolean => {
  const subPath = point.subPath
  if (!subPath?.fieldID) return false

  const curr = template.recordMap[subPath.recordBlockID!]
  if (!curr) return false

  let index = template.records.indexOf(curr)
  index = toPrev ? index - 1 : index + 1
  const record = template.records[index]
  if (record) {
    moveSelectedCell(
      editor,
      point.blockID,
      record.blockID,
      subPath.fieldID
    )
    return true
  }
  return false
}

const moveSelectedCellHorizontally = (
  editor: Editor,
  template: NBDBSpreadsheet,
  point: NBPoint,
  toPrev: boolean
) => {
  const subPath = point.subPath
  if (!subPath) return

  const fields = template.visibleFields
  const idx = fields.findIndex(col => col.fieldID === subPath.fieldID)
  const fieldID = fields[toPrev ? idx - 1 : idx + 1]?.fieldID
  if (fieldID) {
    moveSelectedCell(editor, point.blockID, subPath.recordBlockID!, fieldID)
  }
}

const moveSelectedCell = (
  editor: Editor,
  spreadsheetBlockID: BlockID,
  recordBlockID: BlockID,
  fieldID: DBFieldID
) => {
  editor.selector.select(
    NBRange.decode({
      blockID: spreadsheetBlockID,
      subPath: {
        type: "db", 
        recordBlockID,
        fieldID,
      },
      offset: undefined,
    })
  )
  editor.state.reRender()
  return true
}
