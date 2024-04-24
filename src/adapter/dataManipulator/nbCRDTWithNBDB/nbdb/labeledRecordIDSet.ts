import type {BlockID, DBLabelID} from "@/domain"

export type NBDBLabeledRecordIDSet = {
  fieldID?: DBLabelID;
  recordIDToLabelIDMap: NBDBRecordIDToLabelIDMap;
  labelIDToRecordIDsMap: NBDBLabelIDToRecordIDSetMap;
};
export type NBDBRecordIDToLabelIDMap = {[blockID: BlockID]: DBLabelID};
export type NBDBLabelIDToRecordIDSetMap = {
  [labelID: DBLabelID]: Set<BlockID> | undefined;
};
