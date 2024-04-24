import type {
  DBFieldsProp,
  DBFieldID,
  DBFieldType,
  DBFormula,
} from "@/domain"
import type {NBDBLabelMap} from "./label"

import {parseLabelMap} from "./label"

export const parseFieldMap = (props: DBFieldsProp): NBDBFieldMap => {
  return Object.entries(props).reduce<NBDBFieldMap>((acc, cur) => {
    if (cur[1].IS_DELETED?.[1]) return acc

    const fieldID = cur[0]
    acc[fieldID] = {
      fieldID,
      name: cur[1].NAME[1] ?? "",
      type: cur[1].TYPE?.[1] ?? "VALUE",
      formula: cur[1].FORMULA?.[1],
      labelMap: cur[1].LABELS && parseLabelMap(cur[1].LABELS),
    }

    return acc
  }, {})
}

export const sortFields = (
  fields: NBDBTemplateField[]
): NBDBTemplateField[] => {
  return fields.sort((a, b) => {
    if (a.order === b.order) {
      return a.fieldID > b.fieldID ? 1 : -1
    }
    return a.order - b.order
  })
}

export type NBDBFieldMap = {[fieldID: DBFieldID]: NBDBField};
export type NBDBField = {
  fieldID: DBFieldID;
  name: string;
  type: DBFieldType;
  labelMap?: NBDBLabelMap;
  formula?: DBFormula;

  /** @improve */
  // order: number;
  // visible: boolean;
  // labels: LabelContentData[];
  // labelMap: LabelContentDataMap;
  // aggregation?: FieldAggregationContentData;
};
export type NBDBTemplateFieldMap = {[fieldID: DBFieldID]: NBDBTemplateField};
export type NBDBTemplateField = NBDBField & {
  order: number;
  visible: boolean;
  width?: number;
};