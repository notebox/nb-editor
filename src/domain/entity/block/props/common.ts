export type {
  PropLeaf,
  Props,
  OptionalNestedProps,
  PropsDelta,
  Stamp,
  BlockPropsWithStamp,
  /** @category TEXT */
  TextPropsDelta,
  TextProps,
  TextPropsContent,
  /** @category BLOCK */
  BlockPropsDelta,
  BlockProps,
  BlockPropsContent,
} from "@notebox/nb-crdt"

/** @category block prop keys */
export type ReservedBlockPropsKey = "INS" | "DEL" | "MOV" | "SET";
export enum BlockPropKey {
  TYPE = "TYPE",
  MOV = "MOV",
  DEL = "DEL",
  GlobalCountingRule = "GLOBAL_COUNT",
  Done = "DONE",
  Source = "SRC",
  FileID = "FILE_ID",
  Width = "W",
  Height = "H",
  Caption = "CAPTION",
  Link = "LINK",
  Language = "LANG",
  /** @category database */
  DBTableID = "DB_TABLE_ID",
  DBTable = "DB_TABLE",
  DBRecord = "DB_RECORD",
  DBTemplate = "DB_TEMPLATE",
  DBSpreadsheet = "DB_SPREADSHEET",
  DBBoard = "DB_BOARD",
}
