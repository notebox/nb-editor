import type {
  BlockID,
  DBFieldID,
  DBLabelID,
  UIHandler,
} from "@/domain"
import type {
  NBDBLabel,
  NBDBTemplateField,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {Popup, PopupWithStyle} from "@/domain/usecase/state/popup"

import NBDBTemplateSettings from "./template/Settings"
import NBDBTemplateFilter from "./template/Filter"
import NBDBTemplateSort from "./template/Sort"
import NBDBTemplateEditFields from "./template/EditFields"
import NBDBTemplateEditLabels from "./template/EditLabels"
import NBDBField from "./Field"
import NBDBLabelEditor from "./FieldLabel"

import NBDBAggregationPicker from "./pickers/Aggregation"
import NBDBTemplatePicker from "./pickers/Template"
import NBDBDatePicker from "./pickers/Date"
import NBDBLabelsPicker from "./pickers/Labels"

export const customPopupHandler = (ctx: UIHandler, popup: PopupWithStyle<NBDBPopup>) => {
  switch (popup.type) {
  case "db-template":
    return <NBDBTemplatePicker ctx={ctx} popup={popup} />
  case "db-aggregation":
    return <NBDBAggregationPicker ctx={ctx} popup={popup} />
  case "nbdb-template-settings":
    switch (popup.meta.purpose) {
    case "filter":
      return <NBDBTemplateFilter ctx={ctx} popup={popup} />
    case "sort":
      return <NBDBTemplateSort ctx={ctx} popup={popup} />
    case "edit-fields":
      return <NBDBTemplateEditFields ctx={ctx} popup={popup} />
    case "edit-labels":
      return <NBDBTemplateEditLabels ctx={ctx} popup={popup} />
    default:
      break
    }
    return <NBDBTemplateSettings ctx={ctx} popup={popup} />
  case "nbdb-field":
    return <NBDBField ctx={ctx} popup={popup} />
  case "nbdb-date":
    return <NBDBDatePicker ctx={ctx} popup={popup} />
  case "nbdb-labels":
    return <NBDBLabelsPicker ctx={ctx} popup={popup} />
  case "nbdb-field-label":
    return <NBDBLabelEditor ctx={ctx} popup={popup} />
  default:
    return null
  }
}

/** @category NBDB */
export type NBDBPopup = DBTemplatePopup |
DBAggregationPopup |
NBDBTemplateSettingsPopup |
NBDBFieldPopup |
NBDBFieldLabelPopup |
NBDBDatePopup |
NBDBLabelsPopup;

export type DBTemplatePopup = Popup<"db-template", {
  tableBlockID: BlockID;
  templateBlockID: BlockID;
}>
export type DBAggregationPopup = Popup<"db-aggregation", {
  spreadsheet?: {
    templateBlockID: BlockID;
    fieldID: DBFieldID;
  };
  board?: {
    templateBlockID: BlockID;
    boardFieldID: DBFieldID;
    labelID: DBLabelID;
    fields: NBDBTemplateField[];
  };
}>
export type NBDBTemplateSettingsPopup = Popup<"nbdb-template-settings", {
  templateBlockID: BlockID;
  purpose: "all" | "filter" | "sort" | "edit-fields" | "edit-labels";
}>

export type NBDBFieldPopup = Popup<"nbdb-field", {
  tableBlockID: BlockID;
  templateBlockID: BlockID;
  fieldID: DBFieldID;
  disableTypeChanging?: boolean;
  enableWidthChanging?: boolean;
}>
export type NBDBFieldLabelPopup = Popup<"nbdb-field-label", {
  tableBlockID: BlockID;
  fieldID: DBFieldID;
  label: NBDBLabel;
}>
export type NBDBDatePopup = Popup<"nbdb-date", {
  blockID: BlockID;
  fieldID: DBFieldID;
}>
export type NBDBLabelsPopup = Popup<"nbdb-labels", {
  templateBlockID: BlockID;
  blockID: BlockID;
  fieldID: DBFieldID;
  multiple: boolean;
}>
