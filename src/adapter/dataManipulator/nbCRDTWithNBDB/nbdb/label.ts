import type {Color, DBLabelsProp, DBLabelID} from "@/domain"

export const parseLabelMap = (props: DBLabelsProp): NBDBLabelMap => {
  return Object.entries(props).reduce<NBDBLabelMap>((acc, cur, index) => {
    if (cur[1].IS_DELETED?.[1]) return acc

    const labelID = cur[0]
    acc[labelID] = {
      labelID,
      order: cur[1].ORDER[1] ?? index,
      name: cur[1].NAME[1] ?? "-",
      color: cur[1].COLOR?.[1],
    }

    return acc
  }, {})
}

export const sortLabels = (labels: NBDBLabel[]): NBDBLabel[] => {
  return labels.sort((a, b) => {
    if (a.order === b.order) {
      return a.labelID > b.labelID ? 1 : -1
    }
    return a.order - b.order
  })
}

export type NBDBLabelMap = {[labelID: DBLabelID]: NBDBLabel};
export type NBDBLabel = {
  labelID: DBLabelID;
  order: number;
  name: string;
  color?: Color;
};
