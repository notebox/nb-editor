import type {DBFieldType, DBFieldID, DBFormula, Editor, UIHandler} from "@/domain"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {NBDBFieldPopup} from "."

import React, {useState} from "react"
import Popup from "@/presenter/layer/popup/Popup"
import InputEl from "@/presenter/common/InputEl"
import SelectEl from "@/presenter/common/SelectEl"
import ViewModel from "@/presenter/common/ViewModel"
import Checkbox from "@/presenter/common/icon/checkbox"
import Labels, {Model as LabelsModel} from "./common/LabelsEditor"
import Formula from "./common/formula"
import FormulaEditor, {Model as FormulaModel} from "./common/formula/editor"
import {Footer} from "@/presenter/layer/popup/common/Layout"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  if (model.formulaEditMode) {
    return (
      <Popup ctx={ctx} style={popup.style} preventDismiss>
        <div className="nbdb-formula">
          <FormulaEditor
            model={model.formulaModel}
            onCancel={model.toggleEditMode}
            onDone={model.toggleEditMode}
          />
        </div>
      </Popup>
    )
  }

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div id="nbdb-field-popup">
        <InputEl
          type="text"
          value={model.name}
          onChange={model.onChangeName}
          placeholder="Field name"
        />
        <WidthEditor
          editor={ctx.editor}
          enableWidthChanging={popup.meta.enableWidthChanging}
          model={model}
        />
        <SelectEl
          value={model.type}
          onChange={model.onChangeType}
          disabled={popup.meta.disableTypeChanging}
        >
          <option value="VALUE">String</option>
          <option value="NUMBER">Number</option>
          <option value="BOOLEAN">Boolean</option>
          <option value="DATE">Date</option>
          <option value="LABEL">Label</option>
          <option value="LABELS">Labels</option>
          <option value="FORMULA">Formula</option>
        </SelectEl>
        <div className={model.classNames.labels}>
          <Labels ctx={ctx} model={model.labelsModel} />
        </div>
        <div className={model.classNames.formula}>
          <Formula
            model={model.formulaModel}
            toggleEditMode={model.toggleEditMode}
          />
        </div>
        <Footer editor={ctx.editor} done={model.done} delete={model.delete} />
      </div>
    </Popup>
  )
}

const minWidth = 8
const maxWidth = 16384
const WidthEditor = ({
  editor,
  enableWidthChanging,
  model,
}: {
  editor: Editor;
  enableWidthChanging?: boolean;
  model: Model;
}) => {
  if (!enableWidthChanging) return null
  const autoWidth = model.width === undefined

  return (
    <div className="nbdb-field-width">
      <div
        className="nb-ui-leading"
        onClick={() => {
          editor.emitter.emitHaptic()
          model.onChangeWidth(autoWidth ? 32 : undefined)
        }}
      >
        {Checkbox(autoWidth)}
        Auto Width
      </div>
      {autoWidth ? null : (
        <InputEl
          type="tel"
          pattern="/d*"
          min={minWidth}
          max={maxWidth}
          value={model.width}
          onChange={event => {
            const number = Number(event.target.value)
            model.onChangeWidth(number)
          }}
          placeholder="0"
        />
      )}
    </div>
  )
}

// MARK: - Model
export class Model extends ViewModel {
  readonly editor: Editor
  readonly template: NBDBTemplate
  readonly fieldID: DBFieldID
  readonly formulaModel: FormulaModel
  readonly labelsModel: LabelsModel

  width?: number
  name: string
  type: DBFieldType
  classNames!: {labels: string; formula: string}
  formulaEditMode = false

  private initialFormulaData?: DBFormula

  constructor(ctx: UIHandler, popup: PopupWithStyle<NBDBFieldPopup>) {
    super()
    this.editor = ctx.editor
    const template = (ctx as NBDBContext).templates.get(popup.meta.templateBlockID)!
    this.template = template
    this.fieldID = popup.meta.fieldID
    this.initialFormulaData = template.fieldMap[this.fieldID].formula
    this.formulaModel = new FormulaModel({
      editor: this.editor,
      template,
      initialData: this.initialFormulaData,
      fieldID: this.fieldID,
    })
    this.labelsModel = new LabelsModel(ctx, template, this.fieldID)

    const field = template.fieldMap[this.fieldID]
    this.width = field.width
    this.name = field.name
    this.type = field.type
    this.setClassNames()
  }

  onChangeType = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.type = event.target.value as DBFieldType
    this.setClassNames()
    this.rerender()
  }

  onChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.name = event.target.value
    this.rerender()
  }

  onChangeWidth = (width?: number) => {
    this.width = width
    this.rerender()
  }

  toggleEditMode = () => {
    this.formulaEditMode = !this.formulaEditMode
    if (this.formulaEditMode) {
      this.formulaModel.initialState.data = this.formulaModel.data || undefined
      this.formulaModel.initialState.html = this.formulaModel.html
    }
    this.rerender()
  }

  delete = () => {
    this.editor.operate(operator => {
      Command.delNBDBField(operator as NBOperator, {
        tableBlockID: this.template.tableBlockID,
        fieldID: this.fieldID,
      })
    })
    this.editor.popup(null)
  }

  done = () => {
    let formula: DBFormula | null | undefined
    if (
      FormulaModel.isChanged(this.initialFormulaData, this.formulaModel.data)
    ) {
      formula = this.formulaModel.data
    }

    const sanitizedWidth = this.width
      ? this.width < minWidth
        ? minWidth
        : this.width > maxWidth
          ? maxWidth
          : this.width
      : null
    this.editor.operate(operator =>
      Command.updateNBDBField(operator as NBOperator, {
        tableBlockID: this.template.tableBlockID,
        templateBlockID: this.template.templateBlockID,
        fieldID: this.fieldID,
        name: this.name,
        type: this.type,
        labelOrders: this.labelsModel.changedOrders(),
        formula,
        width: sanitizedWidth,
      })
    )
    this.editor.popup(null)
  }

  private setClassNames() {
    this.classNames = {
      labels: this.additionalViewClassName(
        "nbdb-labels-editor",
        this.type === "LABEL" || this.type === "LABELS"
      ),
      formula: this.additionalViewClassName(
        "nbdb-formula-editor",
        this.type === "FORMULA"
      ),
    }
  }

  private additionalViewClassName(base: string, bool: boolean): string {
    return bool ? `${base} open` : base
  }
}

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBFieldPopup>};
