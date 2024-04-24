import type {DBFieldID, Editor, UIHandler} from "@/domain"
import type {NBDBField} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {
  Dragging,
  Draggable,
  DraggingDestination,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/popup/fields"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBTemplateSettingsPopup} from ".."

import _ from "lodash"
import {useState} from "react"
import {useRecoilValue} from "recoil"
import {ViewModel} from "@/presenter"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"

import {Footer} from "@/presenter/layer/popup/common/Layout"
import Popup from "@/presenter/layer/popup/Popup"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"
import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"
import Fields from "../common/Fields"
import Mover from "../common/Mover"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  const isDragging =
    useRecoilValue(ctx.state.drag.atom).isDragging &&
    ctx.state.drag.dragging?.type === NBDBDragType.NBDBFields

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div id="nbdb-edit-fields" className="nb-ui-section-wrap">
        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Showing fields</div>
          </div>
          <div
            className="nb-ui-list light-theme"
            data-nb-dragging-container={isDragging}
          >
            {model.selected.map((field, index) => (
              <div
                className="nb-ui-list-item is-hoverable"
                key={field.fieldID}
                onClick={() => {
                  ctx.editor.emitter.emitHaptic()
                  model.toggle(field.fieldID)
                }}
                onDragStart={event => {
                  event.preventDefault()
                  ctx.drag.onBlockDraggingStart(
                    draggable(model, field.fieldID),
                    {
                      left: event.clientX,
                      top: event.clientY,
                    }
                  )
                }}
                onTouchStart={event => {
                  ctx.touch.onTouchStart(
                    event,
                    draggable(model, field.fieldID),
                    0
                  )
                }}
                data-nbdb-field-id={field.fieldID}
                data-nbdb-field-index={index}
                draggable
              >
                <Mover />
                <NBDBSymbol type={field.type} />
                {field.name}
              </div>
            ))}
          </div>
        </div>

        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Hidden fields</div>
          </div>
          {Fields(model.unselected, model.toggle, "black")}
        </div>
        <Footer editor={ctx.editor} done={model.done} />
      </div>
    </Popup>
  )
}

// MARK: - Model
export class Model extends ViewModel {
  readonly editor: Editor
  readonly template: NBDBTemplate
  readonly initial: DBFieldID[]

  selected!: NBDBField[]
  unselected!: NBDBField[]
  private selection: Set<DBFieldID>

  constructor(ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>) {
    super()

    this.editor = ctx.editor
    this.template = (ctx as NBDBContext).templates.get(popup.meta.templateBlockID)!
    const showingFieldIDs = this.template.visibleFields.map(
      field => field.fieldID
    )
    this.initial = showingFieldIDs
    this.selection = new Set(showingFieldIDs)
    this.selected = [...this.template.visibleFields]
    this.reorderHiddenFields()
  }

  toggle = (fieldID: DBFieldID) => {
    if (this.selection.has(fieldID)) {
      this.selection.delete(fieldID)
      this.selected = this.selected.filter(field =>
        this.selection.has(field.fieldID)
      )
    } else {
      this.selection.add(fieldID)
      this.selected.push(this.template.fieldMap[fieldID])
    }
    this.reorderHiddenFields()
    this.rerender()
  }

  reorderHiddenFields = () => {
    this.unselected = []
    this.template.allFields.forEach(field => {
      if (!this.selection.has(field.fieldID)) {
        this.unselected.push(field)
      }
    })
  }

  onDrag = (dragging: Dragging, dest: DraggingDestination | null) => {
    if (!dest) return
    const from = this.selected.findIndex(
      item => item.fieldID == dragging.fieldID
    )
    if (from < 0 || from === dest.index) return

    const item = this.selected[from]
    this.selected.splice(from, 1)
    this.selected.splice(dest.index, 0, item)

    this.rerender()
    this.editor.emitter.emitHaptic()
  }

  done = () => {
    const selectedIDs = this.selected.map(field => field.fieldID)
    if (!_.isEqual(selectedIDs, this.initial)) {
      this.editor.operate(operator => {
        Command.setNBDBTemplateHiddenFields(operator as NBOperator, {
          templateBlockID: this.template.templateBlockID,
          showingFieldIDs: selectedIDs,
          template: this.template.type,
        })
      })
    }
    this.editor.popup(null)
  }
}

const draggable = (model: Model, fieldID: DBFieldID): Draggable => ({
  type: NBDBDragType.NBDBFields,
  fieldID,
  query: {
    container: "#nbdb-edit-fields .nb-ui-list[data-nb-dragging-container]",
    target: `[data-nbdb-field-id="${fieldID}"]`,
  },
  onDrag: model.onDrag,
})

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>};
