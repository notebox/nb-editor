import type {
  BlockID,
  Color,
  DBFieldID,
  DBLabelID,
  DBLabelsDataType,
  DBRecordProp,
  UIHandler,
  Editor,
} from "@/domain"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBLabel} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {NBDBLabelsPopup} from ".."

import {isLabelsDataType} from "@/domain"
import {sortLabels} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"
import {useState, useEffect} from "react"
import ViewModel from "@/presenter/common/ViewModel"
import Popup from "@/presenter/layer/popup/Popup"
import {Footer} from "@/presenter/layer/popup/common/Layout"
import Labels from "../common/Labels"
import LabelEditor from "../common/LabelEditor"
import AdderBTN from "../common/AdderBTN"

import _ from "lodash"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div id="nbdb-labels-picker" className="nb-ui-section-wrap">
        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Selected labels</div>
          </div>
          {Labels(model.selectedLabels, model.toggle, "light")}
        </div>

        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Other labels</div>
          </div>
          {Labels(
            model.unselectedLabels,
            model.toggle,
            "black",
            model.isAdding ? (
              <LabelEditor
                ctx={ctx}
                name=""
                onCancelEditingLabel={model.onCancelEditingLabel}
                onSaveLabel={model.onSaveLabel}
              />
            ) : (
              <AdderBTN onClick={model.onClickAdderBTN} />
            )
          )}
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
  readonly blockID: BlockID
  readonly fieldID: DBFieldID
  readonly multiple: boolean
  readonly initial?: Set<DBLabelID>

  labelMap: {[labelID: DBLabelID]: NBDBLabel}
  allLabels: NBDBLabel[]

  isAdding = false
  selectedLabels: NBDBLabel[] = []
  unselectedLabels: NBDBLabel[] = []
  private selection: Set<DBLabelID>

  constructor(ctx: UIHandler, popup: PopupWithStyle<NBDBLabelsPopup>) {
    super()

    this.editor = ctx.editor
    this.template = (ctx as NBDBContext).templates.get(popup.meta.templateBlockID)!
    this.blockID = popup.meta.blockID
    this.fieldID = popup.meta.fieldID
    this.multiple = popup.meta.multiple

    this.labelMap = this.template.fieldMap[popup.meta.fieldID]?.labelMap || {}
    if (this.labelMap) {
      this.allLabels = sortLabels(Object.values(this.labelMap))
    } else {
      this.allLabels = []
    }

    const value = (this.editor.dataManipulator.block(popup.meta.blockID).props.DB_RECORD as DBRecordProp)?.[
      popup.meta.fieldID
    ]?.VALUE?.[1]
    if (isLabelsDataType(value)) {
      this.initial = new Set(value[1])
      this.selection = new Set(value[1])
      this.reorder()
    } else {
      this.selection = new Set()
      this.unselectedLabels = this.allLabels
    }
  }

  setStates = () => {
    super.setStates()

    useEffect(() => {
      const labelMap = this.template.fieldMap[this.fieldID]?.labelMap
      if (labelMap === this.labelMap) return
      this.labelMap = labelMap || {}
      this.allLabels = sortLabels(Object.values(this.labelMap))
      this.reorder()
    })
  }

  toggle = (labelID: DBLabelID) => {
    if (this.selection.has(labelID)) {
      this.selection.delete(labelID)
    } else if (this.multiple) {
      this.selection.add(labelID)
    } else {
      this.selection.clear()
      this.selection.add(labelID)
    }
    this.reorder()
    this.rerender()
  }

  reorder = () => {
    this.selectedLabels = []
    this.unselectedLabels = []
    this.allLabels.forEach(label => {
      if (this.selection.has(label.labelID)) {
        this.selectedLabels.push(label)
      } else {
        this.unselectedLabels.push(label)
      }
    })
  }

  onClickAdderBTN = () => {
    this.editor.emitter.emitHaptic()
    this.isAdding = true
    this.rerender()
  }

  onSaveLabel = (label: {labelID?: DBLabelID; name: string; color?: Color}) => {
    this.editor.operate(operator =>
      Command.setNBDBLabel(operator as NBOperator, {
        tableBlockID: this.template.tableBlockID,
        fieldID: this.fieldID,
        label: {
          ...label,
          order: this.allLabels.length,
        },
      })
    )
    this.isAdding = false
    this.rerender()
  }

  onCancelEditingLabel = () => {
    this.isAdding = false
    this.rerender()
  }

  done = () => {
    if (!_.isEqual(this.selection, this.initial)) {
      this.editor.operate(operator => {
        Command.setBlockDBRecordValue(operator as NBOperator, this.blockID, this.fieldID, [
          "LABELS",
          Array.from(this.selection),
        ] as DBLabelsDataType)
      })
    }
    this.editor.popup(null)
  }
}

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBLabelsPopup>};
