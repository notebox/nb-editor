import type {BlockID} from "../common"
import type {DBBoard, DBFields, DBSpreadsheet, DBTemplates, DBValues} from "./database"

import {BlockPropKey} from "./common"

export * from "./common"
export * from "./color"
export * from "./text"
export * from "./database"

/** @category block types */
export const NoteBlockType = "NOTE"
export enum BlockType {
  Line = "LINE",
  Header1 = "H1",
  Header2 = "H2",
  Header3 = "H3",
  UnorderedList = "UL",
  OrderedList = "OL",
  CheckList = "CL",
  Blockquote = "BLOCKQUOTE",
  Codeblock = "CODEBLOCK",
  Image = "IMG",
  Divider = "HR",
  Mermaid = "MERMAID",
  Linkblock = "LINK",
  Database = "DATABASE",
  DBRecord = "DB_RECORD",
}

/** @category block prop contents */
declare module "@notebox/nb-crdt" {
  interface BlockPropsContent extends Dictionary {
    /** @category common */
    [BlockPropKey.TYPE]?: typeof NoteBlockType | BlockType;
    [BlockPropKey.GlobalCountingRule]?: true;

    /** @category checklist */
    [BlockPropKey.Done]?: true;

    /** @category image */
    [BlockPropKey.FileID]?: string;
    [BlockPropKey.Source]?: string;
    [BlockPropKey.Width]?: number;
    [BlockPropKey.Height]?: number;
    [BlockPropKey.Caption]?: string;

    /** @category link-block */
    [BlockPropKey.Link]?: string;

    /** @category code-block */
    [BlockPropKey.Language]?: string;

    /** @category database */
    [BlockPropKey.DBTableID]?: BlockID; // database reference
    [BlockPropKey.DBTable]?: DBFields; // database itself

    /** @category record */
    [BlockPropKey.DBRecord]?: DBValues; // children of database block

    /** @category database template */
    [BlockPropKey.DBTemplate]?: DBTemplates; // presented template
    [BlockPropKey.DBSpreadsheet]?: DBSpreadsheet; // spreadsheet layout
    [BlockPropKey.DBBoard]?: DBBoard; // board layout
  }
}