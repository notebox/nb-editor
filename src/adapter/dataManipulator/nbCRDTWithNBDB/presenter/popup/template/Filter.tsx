import type {UIHandler} from "@/domain"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBTemplateSettingsPopup} from ".."

import {useState} from "react"
import Popup from "@/presenter/layer/popup/Popup"
import FormulaEditor, {Model as FormulaModel} from "../common/formula/editor"
import {DBFormula} from "@/domain/entity"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default ({ctx, popup}: Props) => {
  const [model] = useState(() => {
    const template = (ctx as NBDBContext).templates.get(popup.meta.templateBlockID)!
    const filter = template.filter

    return new FormulaModel({editor: ctx.editor, template, initialData: filter})
  })

  return (
    <Popup ctx={ctx} style={popup.style} preventDismiss>
      <div className="nbdb-formula">
        <FormulaEditor
          model={model}
          onCancel={() => ctx.editor.popup(null)}
          onDone={() => {
            if (
              model.data !== undefined &&
              FormulaModel.isChanged(model.data, model.initialState.data)
            ) {
              ctx.editor.operate(operator =>
                Command.setNBDBTemplateFilter(operator as NBOperator, {
                  templateBlockID: popup.meta.templateBlockID,
                  template: model.template.type,
                  formulaData: model.data as DBFormula | null,
                })
              )
            }
            ctx.editor.popup(null)
          }}
        />
      </div>
    </Popup>
  )
}

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBTemplateSettingsPopup>};
