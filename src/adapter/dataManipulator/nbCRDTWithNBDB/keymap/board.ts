import type {BlockID, DBFieldID, Editor} from "@/domain"
import type {NBDBTemplateSelection} from "."

import Hotkeys from "@/utils/hotkeys"
import {handleSelectAll, hasNewline, offsetType} from "./common"
import {NBDBBoard} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

export default (
  event: KeyboardEvent,
  editor: Editor,
  template: NBDBBoard,
  selection: NBDBTemplateSelection
): boolean => {
  const point = selection.start
  const {recordBlockID, fieldID} = point.subPath

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
    moveSelectedCellVertically(template, recordBlockID!, fieldID!, true)
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
    template.select(
      point.subPath.recordBlockID,
      point.subPath.fieldID,
      0
    )
    moveSelectedCellVertically(template, recordBlockID!, fieldID!, false)
    return true
  } else if (Hotkeys.isESC(event)) {
    event.preventDefault()
    template.select()

    return true
  } else if (Hotkeys.isSelectAll(event)) {
    event.preventDefault()
    handleSelectAll(editor, point)
    return true
  } else if (Hotkeys.isShiftEnter(event)) {
    event.preventDefault()
    moveSelectedCellVertically(template, recordBlockID!, fieldID!, true)
    return true
  } else if (Hotkeys.isEnter(event)) {
    event.preventDefault()
    if (point.offset) {
      moveSelectedCellVertically(template, recordBlockID!, fieldID!, false)
      return true
    }
    template.editValue(
      point.subPath.recordBlockID!,
      point.subPath.fieldID!
    )
    return true
  } else if (Hotkeys.isMoveBackward(event)) {
    if (point.offset) return false
    event.preventDefault()
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
    return true
  }

  return false
}

export const moveSelectedCellVertically = (
  template: NBDBBoard,
  recordBlockID: BlockID,
  fieldID: DBFieldID,
  toPrev: boolean
): boolean => {
  const field = template.fieldMap[fieldID]
  if (!field) return false

  const offset = toPrev
    ? 0
    : (
        template.recordMap[recordBlockID]?.fieldMap[field.fieldID]?.value as
          | string
          | undefined
    )?.length ?? 0
  template.select(recordBlockID, fieldID, offset)

  return true
}
