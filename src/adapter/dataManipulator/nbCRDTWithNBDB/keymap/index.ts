import type {NBRange, NBPoint, SubPath, UIHandler} from "@/domain"
import type {NBDBContext} from ".."
import type {NBDBSpreadsheet, NBDBBoard} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import {BlockPropKey} from "@/domain"
import SpreadsheetMap from "./spreadsheet"
import BoardMap from "./board"

export const customKeymap = (ctx: UIHandler, event: KeyboardEvent): boolean => {
  if (!insideSingleNBDBTemplateWithDBValueFieldPath(ctx.editor.selector.selection))
    return false
  const template = (ctx as NBDBContext).templates.get(ctx.editor.selector.selection.start.blockID)
  if (!template) return false

  switch (template.type) {
  case BlockPropKey.DBSpreadsheet:
    return SpreadsheetMap(
      event,
      ctx.editor,
      template as NBDBSpreadsheet,
      ctx.editor.selector.selection
    )
  case BlockPropKey.DBBoard:
    return BoardMap(
      event,
      ctx.editor,
      template as NBDBBoard,
      ctx.editor.selector.selection
    )
  }
}

const insideSingleNBDBTemplateWithDBValueFieldPath = (
  selection: NBRange | null
): selection is NBDBTemplateSelection => {
  if (!selection || !selection?.start?.subPath?.fieldID) return false
  return selection.start.blockID === selection.end.blockID
}

export type NBDBTemplateSelection = NBRange & {
  start: NBPoint & {
    subPath: SubPath
  }
};
