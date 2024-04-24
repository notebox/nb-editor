import type {BlockID} from "../../common"
import type {Props, PropLeaf, TextProps, BlockPropsWithStamp, PropsDelta} from "../common"
import type {Color} from "@/domain/entity/block/props/color"
import type {DBFormulaFunctionName, DBFieldAggregationKey} from "./functions"
export * from "./functions"

import {BlockPropKey} from "../common"

/** @category template */
export type DBTemplates = BlockPropKey.DBSpreadsheet | BlockPropKey.DBBoard;

/** @category field */
export type DBFields = Props & {
  [fieldID: string]: DBField;
};
export type DBField = Props & {
  NAME: string;
  TYPE?: DBFieldType;
  FORMULA?: DBFormula;
  IS_DELETED?: boolean;
  LABELS?: DBLabels;
};
export type DBFieldID = string;
export type DBFieldType =
  | "BOOLEAN"
  | "VALUE"
  | "NUMBER"
  | "LABEL"
  | "LABELS"
  | "FORMULA"
  | "DATE";

/** @category cell */
export type DBValues = Props & {
  [fieldID: string]: DBValue;
};
export type DBValue = Props & {
  VALUE?: DBDataValue;
  FORMAT?: PropLeaf & TextProps;
};

/** @category value */
export type DBDataValue =
  | string
  | boolean
  | DBFormulaDataType
  | DBDateDataType
  | DBLabelsDataType;
// | ['content', INSContentData]; // not yet supported
export type DBFormulaDataType = ["FORMULA", DBFormula];
export type DBDateDataType = ["DATE", DBDateRange];
export type DBLabelsDataType = ["LABELS", DBLabelID[]];

// formula
export type DBFormula = string | boolean | DBFormulaWithArgs;
export type DBFormulaWithArgs = [
  DBFormulaFunctionName,
  ...(string | boolean | DBFormulaWithArgs)[]
];

export const isFormulaDataType = (
  VALUE?: DBDataValue
): VALUE is DBFormulaDataType => {
  return Array.isArray(VALUE) && VALUE[0] === "FORMULA"
}
export const isFormulaWithArgs = (
  formula: DBFormula
): formula is DBFormulaWithArgs => {
  return Array.isArray(formula)
}

// date
export type DBDateRange = {
  start: DBDateTime;
  end?: DBDateTime;
  time?: boolean;
};
export type DBDateTime =
  `${number}${number}${number}${number}-${number}${number}-${number}${number}T${number}${number}:${number}${number}`;
export type UnixMillieTimestamp = number;
export const isDateDataType = (
  VALUE?: DBDataValue
): VALUE is DBDateDataType => {
  return Array.isArray(VALUE) && VALUE[0] === "DATE"
}

// label
export type DBLabels = Props & {
  [labelID: string]: DBLabel;
};
export type DBLabel = Props & {
  ORDER: number;
  NAME: string;
  COLOR?: Color;
  IS_DELETED?: boolean;
};
export type DBLabelID = string;
export const isLabelsDataType = (
  VALUE?: DBDataValue
): VALUE is DBLabelsDataType => {
  return Array.isArray(VALUE) && VALUE[0] === "LABELS"
}

// Common
export type DBRecordPoints = Props & {[recordID: BlockID]: unknown};

// Spreadsheet
export type DBSpreadsheet = Props & {
  FIELDS?: DBSpreadsheetFields;

  FILTER?: DBFormula;
  SORT?: DBSort;
};

export type DBSpreadsheetFields = Props & {
  [fieldID: DBFieldID]: {
    ORDER: number;
    VISIBLE: boolean;
    WIDTH?: number;
    AGGREGATION?: DBFieldAggregationKey;
  };
};

// Board
export type DBBoard = Props & {
  FIELD_ID?: DBFieldID;
  FIELDS?: DBBoardFields;
  RECORD_POINTS?: DBRecordPoints;

  FILTER?: DBFormula;
  SORT?: DBSort;
};

export type DBBoardFields = Props & {
  [fieldID: DBFieldID]: {
    ORDER: number;
    VISIBLE: boolean;
    LABELS?: DBBoardLabels;
    WIDTH?: undefined;
  };
};

export type DBBoardLabels = Props & {
  [labelID: DBLabelID | typeof DBBoardUnsetLabelID]: {
    ORDER: number;
    VISIBLE: boolean;
    AGGREGATION?: DBBoardLabelAggregation;
  };
};

export const DBBoardUnsetLabelID = "UNSET"

export type DBBoardLabelAggregation = [
  aggregationKey: DBFieldAggregationKey,
  fieldID?: DBFieldID
];

// Common
export type DBSort = [fieldID: DBFieldID, isDESC?: boolean][];

/** @purpose shorthand */
export type DBTableProp = DBFieldsProp;
export type DBRecordPointsProp = BlockPropsWithStamp<DBRecordPoints>;
export type DBFieldsProp = BlockPropsWithStamp<DBFields>;
export type DBFieldProp = BlockPropsWithStamp<DBField>;
export type DBLabelsProp = BlockPropsWithStamp<DBLabels>;
export type DBRecordProp = BlockPropsWithStamp<DBValues>;
export type DBValueProp = BlockPropsWithStamp<DBValue>;
export type DBTemplateProp = BlockPropsWithStamp<DBSpreadsheet | DBBoard>;
export type DBSpreadsheetProp = BlockPropsWithStamp<DBSpreadsheet>;
export type DBBoardProp = BlockPropsWithStamp<DBBoard>;
export type DBTemplateFieldsProp = BlockPropsWithStamp<
  DBSpreadsheetFields | DBBoardFields
>;
export type DBTemplateFieldsPropDelta = PropsDelta<
  DBSpreadsheetFields | DBBoardFields
>;
export type BoardLabelsDelta = PropsDelta<DBBoardLabels>;
export type BoardLabelsProp = BlockPropsWithStamp<DBBoardLabels>;
export type SpreadsheetProp = BlockPropsWithStamp<DBSpreadsheet>;
