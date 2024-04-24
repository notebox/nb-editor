import type {DBLabelID, Editor, UIHandler} from "@/domain"
import type {NBDBLabel} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {
  Dragging,
  Draggable,
  DraggingDestination,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/popup/labels"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBTemplateSettingsPopup} from ".."

import _ from "lodash"
import {useState} from "react"
import {useRecoilValue} from "recoil"
import {
  ViewModel,
  DBBoardUnsetLabelID,
} from "@/presenter"
import {NBDBBoard} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"

import {Footer} from "@/presenter/layer/popup/common/Layout"
import Popup from "@/presenter/layer/popup/Popup"
import Labels from "../common/Labels"
import Label from "../common/Label"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  const isDragging =
    useRecoilValue(ctx.state.drag.atom).isDragging &&
    ctx.state.drag.dragging?.type === NBDBDragType.NBDBLabels

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div id="nbdb-edit-labels" className="nb-ui-section-wrap">
        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Showing labels</div>
          </div>
          <div
            className="nbdb-labels light-theme"
            data-nb-dragging-container={isDragging}
          >
            {model.selected.map((label, index) => (
              <Label
                key={label.labelID}
                index={index}
                labelID={label.labelID}
                name={label.name}
                color={label.color}
                onClick={() => {
                  ctx.editor.emitter.emitHaptic()
                  model.toggle(label.labelID)
                }}
                isHoverable
                draggable={true}
                onDragStart={event => {
                  event.preventDefault()
                  ctx.drag.onBlockDraggingStart(
                    draggable(model, label.labelID),
                    {
                      left: event.clientX,
                      top: event.clientY,
                    }
                  )
                }}
                onTouchStart={event => {
                  ctx.touch.onTouchStart(
                    event,
                    draggable(model, label.labelID)
                  )
                }}
              />
            ))}
          </div>
        </div>

        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Hidden labels</div>
          </div>
          {Labels(model.unselected, model.toggle, "black")}
        </div>
        <Footer editor={ctx.editor} done={model.done} />
      </div>
    </Popup>
  )
}

// MARK: - Model
export class Model extends ViewModel {
  readonly editor: Editor
  readonly template: NBDBBoard
  readonly initial: DBLabelID[]

  selected!: NBDBLabel[]
  unselected!: NBDBLabel[]
  private selection: Set<DBLabelID>

  constructor(ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>) {
    super()

    this.editor = ctx.editor
    this.template = (ctx as NBDBContext).templates.get(popup.meta.templateBlockID) as NBDBBoard
    const showingLabelIDs = this.template.labels.map(label => label.labelID)
    this.initial = showingLabelIDs
    this.selection = new Set(showingLabelIDs)
    this.selected = [
      ...this.template.labels.filter(
        label => label.labelID !== DBBoardUnsetLabelID
      ),
    ]
    this.reorderHiddenLabels()
  }

  toggle = (labelID: DBLabelID) => {
    if (this.selection.has(labelID)) {
      this.selection.delete(labelID)
      this.selected = this.selected.filter(label =>
        this.selection.has(label.labelID)
      )
    } else {
      this.selection.add(labelID)
      this.selected.push(this.template.labelMap[labelID])
    }
    this.reorderHiddenLabels()
    this.rerender()
  }

  reorderHiddenLabels = () => {
    this.unselected = []
    Object.values(this.template.labelMap).forEach(label => {
      if (label.labelID === DBBoardUnsetLabelID) return
      if (!this.selection.has(label.labelID)) {
        this.unselected.push(label)
      }
    })
  }

  onDrag = (dragging: Dragging, dest: DraggingDestination | null) => {
    if (!dest) return
    const from = this.selected.findIndex(
      item => item.labelID == dragging.labelID
    )
    if (from < 0 || from === dest.index) return

    const item = this.selected[from]
    this.selected.splice(from, 1)
    this.selected.splice(dest.index, 0, item)

    this.rerender()
    this.editor.emitter.emitHaptic()
  }

  done = () => {
    const fieldID = this.template.boardFieldID
    const selectedIDs = this.selected.map(label => label.labelID)
    if (fieldID && !_.isEqual(selectedIDs, this.initial)) {
      this.editor.operate(operator => {
        Command.setNBDBBoardHiddenLabels(operator as NBOperator, {
          templateBlockID: this.template.templateBlockID,
          showingLabelIDs: selectedIDs,
          fieldID,
        })
      })
    }
    this.editor.popup(null)
  }
}

const draggable = (model: Model, labelID: DBLabelID): Draggable => ({
  type: NBDBDragType.NBDBLabels,
  labelID,
  query: {
    container: "#nbdb-edit-labels .nbdb-labels[data-nb-dragging-container]",
    target: `[data-nbdb-label-id="${labelID}"]`,
  },
  onDrag: model.onDrag,
})

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>};
