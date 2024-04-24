import type {DBSort, DBFieldID, Editor, UIHandler} from "@/domain"
import type {NBDBField} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {
  Draggable,
  Dragging,
  DraggingDestination,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/popup/fields"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBTemplateSettingsPopup} from ".."

import _ from "lodash"
import {useRecoilValue} from "recoil"
import {useState} from "react"
import {ViewModel} from "@/presenter"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"

import {Footer} from "@/presenter/layer/popup/common/Layout"
import Popup from "@/presenter/layer/popup/Popup"
import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"
import TrashIcon from "@/presenter/common/icon/trash"
import Fields from "../common/Fields"
import Mover from "../common/Mover"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  const isDragging =
    useRecoilValue(ctx.state.drag.atom).isDragging &&
    ctx.state.drag.dragging?.type === NBDBDragType.NBDBFields

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div id="nbdb-sorting" className="nb-ui-section-wrap">
        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Sorting rules</div>
          </div>
          <div
            className="nb-ui-list light-theme"
            data-nb-dragging-container={isDragging}
          >
            {model.rules.map(({field, isDESC}, index) => {
              return (
                <div
                  className="nb-ui-list-item"
                  key={field.fieldID}
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
                  <div className="nb-ui-list-item-trailing">
                    <div
                      className="nb-ui-btn"
                      onClick={() => {
                        ctx.editor.emitter.emitHaptic()
                        model.toggleDESC(field.fieldID)
                      }}
                    >
                      {isDESC ? "↓" : "↑"}
                    </div>
                    <div
                      className="nb-ui-btn"
                      style={{fill: "red", paddingLeft: "3px"}}
                      onClick={() => {
                        ctx.editor.emitter.emitHaptic()
                        model.toggleField(field.fieldID)
                      }}
                    >
                      <TrashIcon />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Other fields</div>
          </div>
          {Fields(model.unselected, model.toggleField, "black")}
        </div>
        <Footer editor={ctx.editor} done={model.done} />
      </div>
    </Popup>
  )
}

const draggable = (model: Model, fieldID: DBFieldID): Draggable => ({
  type: NBDBDragType.NBDBFields,
  fieldID,
  query: {
    container: "#nbdb-sorting .nb-ui-list[data-nb-dragging-container]",
    target: `[data-nbdb-field-id="${fieldID}"]`,
  },
  onDrag: model.onDrag,
})

// MARK: - Model
export type Rule = {field: NBDBField; isDESC: boolean};
export class Model extends ViewModel {
  readonly editor: Editor
  readonly template: NBDBTemplate

  rules: Rule[]
  unselected!: NBDBField[]

  private selection: Set<DBFieldID>

  constructor(ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>) {
    super()

    this.editor = ctx.editor
    this.template = (ctx as NBDBContext).templates.get(popup.meta.templateBlockID)!
    this.rules =
      this.template.sort?.reduce<Rule[]>((acc, cur) => {
        const rule = this.ruleFrom(cur[0], cur[1] || false)
        if (rule) {
          acc.push(rule)
        }
        return acc
      }, []) ?? []
    this.selection = new Set<DBFieldID>()
    this.rules.forEach(rule => this.selection.add(rule.field.fieldID))

    this.setUnselected()
  }

  toggleDESC = (fieldID: DBFieldID) => {
    const rule = this.rules.find(rule => rule.field.fieldID === fieldID)
    if (!rule) return
    rule.isDESC = !rule.isDESC
    this.rerender()
  }

  toggleField = (fieldID: DBFieldID) => {
    if (this.selection.has(fieldID)) {
      this.selection.delete(fieldID)
      this.rules = this.rules.filter(rule => rule.field.fieldID !== fieldID)
    } else {
      const rule = this.ruleFrom(fieldID, false)
      if (rule) {
        this.selection.add(fieldID)
        this.rules.push(rule)
      }
    }
    this.setUnselected()
    this.rerender()
  }

  onDrag = (dragging: Dragging, dest: DraggingDestination | null) => {
    if (!dest) return
    const from = this.rules.findIndex(
      rule => rule.field.fieldID == dragging.fieldID
    )
    if (from < 0 || from === dest.index) return

    const rule = this.rules[from]
    this.rules.splice(from, 1)
    this.rules.splice(dest.index, 0, rule)

    this.rerender()
    this.editor.emitter.emitHaptic()
  }

  private ruleFrom = (
    fieldID: DBFieldID,
    isDESC: boolean
  ): Rule | undefined => {
    const field = this.template.fieldMap[fieldID]
    if (!field) return
    return {field, isDESC}
  }

  private setUnselected = () => {
    this.unselected = []
    this.template.allFields.forEach(field => {
      if (!this.selection.has(field.fieldID)) {
        this.unselected.push(field)
      }
    })
  }

  done = () => {
    const sort: DBSort = this.rules.map(rule => [
      rule.field.fieldID,
      rule.isDESC,
    ])
    if (!_.isEqual(sort, this.template.sort ?? [])) {
      this.editor.operate(operator => {
        Command.setNBDBTemplateSort(operator as NBOperator, {
          templateBlockID: this.template.templateBlockID,
          sort: sort.length ? sort : null,
          template: this.template.type,
        })
      })
    }
    this.editor.popup(null)
  }
}

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>};
