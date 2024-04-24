import type {Handler} from "@/domain/usecase/state/drag"

import dbSpreadsheetColHandler from "./spreadsheet/col"
import dbSpreadsheetDBRecordHandler from "./spreadsheet/record"
import dbBoardColHandler from "./board/col"
import dbBoardRecordHandler from "./board/record"
import nbdbLabelsHandler from "./popup/labels"
import nbdbFieldsHandler from "./popup/fields"

export enum NBDBDragType {
  DBSpreadsheetRecord = "DB_SPREADSHEET_RECORD",
  DBSpreadsheetCol = "DB_SPREADSHEET_COL",
  DBBoardRecord = "DB_BOARD_RECORD",
  DBBoardCol = "DB_BOARD_COL",
  NBDBLabels = "NBDB_LABELS" ,
  NBDBFields = "NBDB_FIELDS",
}

export const customDragHandlers: {[type: string]: Handler} = {
  [NBDBDragType.DBSpreadsheetCol]: dbSpreadsheetColHandler,
  [NBDBDragType.DBSpreadsheetRecord]: dbSpreadsheetDBRecordHandler,
  [NBDBDragType.DBBoardCol]: dbBoardColHandler,
  [NBDBDragType.DBBoardRecord]: dbBoardRecordHandler,
  [NBDBDragType.NBDBLabels]: nbdbLabelsHandler,
  [NBDBDragType.NBDBFields]: nbdbFieldsHandler,
}