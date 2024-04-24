import type {
  BlockID,
  DBFieldAggregationKey,
  DBFieldID,
  DBLabelID,
  DBSort,
  DBRecordProp,
  DBFormula,
} from "@/domain"
import type {Block} from "@/adapter/dataManipulator/nbCRDT/crdt"
import type {NBDBTemplateField} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBRecordFieldMap} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"
import type {NBDBBoard, NBDBSpreadsheet, Templates} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import {NBDataManipulator} from "../../nbCRDT"

import {BlockPropKey, DBBoardUnsetLabelID} from "@/domain"

export const encodeToBlockContentData = (templates: Templates, dataManipulator: NBDataManipulator, block: Block): NBDBContent | undefined => {
  const db = templates.get(block.blockID) as NBDBSpreadsheet | NBDBBoard
  if (!db) return undefined

  switch (db.type) {
  case BlockPropKey.DBSpreadsheet: {
    return {
      table: {
        tableBlockID:
            db.tableBlockID === db.templateBlockID
              ? undefined
              : db.tableBlockID,
        allFields: db.allFields,
        allRecords: db.records.map(record => {
          return {
            evaluated: record.fieldMap,
            prop: dataManipulator.block(record.blockID).props.DB_RECORD as DBRecordProp,
          }
        }),
      },
      spreadsheet: {
        fieldMap: db.fieldMap,
        aggregationMap: db.aggregationMap,
        sort: db.sort,
        filter: db.filter,
      },
    }
  }
  case BlockPropKey.DBBoard: {
    return {
      table: {
        tableBlockID:
            db.tableBlockID === db.templateBlockID
              ? undefined
              : db.tableBlockID,
        allFields: db.allFields,
        allRecords: db.labels.reduce<NBDBRecordContent[]>((acc, cur) => {
          const records = db.records[cur.labelID]
          if (records) {
            return acc.concat(
              records.map(record => {
                return {
                  evaluated: record.fieldMap,
                  prop: dataManipulator.block(record.blockID).props
                    .DB_RECORD as DBRecordProp,
                }
              })
            )
          }
          return acc
        }, []),
      },
      board: {
        boardFieldID: db.boardFieldID,
        fieldMap: db.fieldMap,
        labelMap: Object.entries(db.labelMap).reduce<
            NBDBBoardContent["labelMap"]
          >((acc, [labelID, label]) => {
            if (labelID !== DBBoardUnsetLabelID) {
              acc[labelID] = label
            }
            return acc
          }, {}),
        aggregationMap: Object.entries(db.aggregationMap).reduce<
            NBDBBoardContent["aggregationMap"]
          >((acc, [labelID, aggregation]) => {
            if (
              labelID !== DBBoardUnsetLabelID &&
              aggregation.key !== "count"
            ) {
              acc[labelID] = aggregation
            }
            return acc
          }, {}),
        sort: db.sort,
        filter: db.filter,
      },
    }
  }
  default:
    return undefined
  }
}

/** @category types */
export type NBDBContent = {
  table: NBDBTableContent;
  spreadsheet?: NBDBSpreadsheetContent;
  board?: NBDBBoardContent;
};

export type NBDBTableContent = {
  tableBlockID?: BlockID;
  allFields: NBDBTemplateField[];
  allRecords: NBDBRecordContent[];
};

export type NBDBRecordContent = {
  evaluated: NBDBRecordFieldMap;
  prop?: DBRecordProp;
};

export type NBDBSpreadsheetContent = {
  fieldMap: {
    [fieldID: DBFieldID]: {
      order: number;
      visible: boolean;
    };
  };
  aggregationMap: {
    [fieldID: DBFieldID]: {
      key: DBFieldAggregationKey;
    };
  };
  sort?: DBSort;
  filter?: DBFormula;
};

export type NBDBBoardContent = {
  boardFieldID?: DBFieldID;
  fieldMap: {
    [fieldID: DBFieldID]: {
      order: number;
      visible: boolean;
    };
  };
  labelMap: {
    [labelID: DBLabelID]: {
      order: number;
      visible: boolean;
    };
  };
  aggregationMap: {
    [labelID: DBLabelID]: {
      fieldID?: DBFieldID;
      key: DBFieldAggregationKey;
    };
  };
  sort?: DBSort;
  filter?: DBFormula;
};
