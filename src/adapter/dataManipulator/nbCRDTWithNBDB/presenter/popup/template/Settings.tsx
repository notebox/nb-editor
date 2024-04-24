import type {Editor, UIHandler} from "@/domain"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {NBDBTemplateSettingsPopup} from ".."

import {BlockPropKey} from "@/domain/entity"

import {useState} from "react"
import {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import Popup from "@/presenter/layer/popup/Popup"
import LabeledField from "./LabeledField"

export default ({ctx, popup}: Props) => {
  const [board, setBoard] = useState<BoardExclusiveKey>()

  const template = (ctx as NBDBContext).templates.get(popup.meta.templateBlockID)!

  return (
    <Popup ctx={ctx} style={popup.style}>
      {board ? LabeledField(ctx.editor, template) : TemplateMenu(ctx.editor, template, setBoard)}
    </Popup>
  )
}

const TemplateMenu = (
  editor: Editor,
  template: NBDBTemplate,
  setBoard: (key: BoardExclusiveKey) => void
) => {
  switch (template.type) {
  case BlockPropKey.DBSpreadsheet:
    return (
      <div className="nb-ui-menu">
        {MenuItems(editor, template, [
          {
            label: "Edit fields",
            purpose: "edit-fields",
          },
          {label: "Sort", purpose: "sort"},
          {
            label: "Filter",
            purpose: "filter",
          },
        ])}
      </div>
    )
  case BlockPropKey.DBBoard:
    return (
      <div className="nb-ui-menu">
        <div
          className="nb-ui-menu-item is-hoverable"
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            editor.emitter.emitHaptic()
            setBoard("labeled-field")
          }}
        >
            Labeled field
        </div>
        {MenuItems(
          editor,
          template,
          [
            {
              label: "Edit fields",
              purpose: "edit-fields",
            },
            {label: "Edit labels", purpose: "edit-labels"},
            {label: "Sort", purpose: "sort"},
            {
              label: "Filter",
              purpose: "filter",
            },
          ])}
      </div>
    )
  }
}

const MenuItems = (
  editor: Editor,
  template: NBDBTemplate,
  items: {
    label: string;
    purpose: NBDBTemplateSettingsPopup["meta"]["purpose"];
  }[]
) => (
  <>
    {items.map(item => (
      <div
        key={item.label}
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          editor.popup({
            type: "nbdb-template-settings",
            meta: {
              templateBlockID: template.templateBlockID,
              purpose: item.purpose,
            },
          }, event)
        }}
      >
        {item.label}
      </div>
    ))}
  </>
)

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>};
type BoardExclusiveKey = "labeled-field" | "edit-labels";
