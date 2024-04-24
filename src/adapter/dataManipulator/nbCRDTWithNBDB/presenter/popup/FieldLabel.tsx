import type {UIHandler} from "@/domain/usecase"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBFieldLabelPopup} from "."

import Popup from "@/presenter/layer/popup/Popup"
import LabelEditor from "./common/LabelEditor"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default ({ctx, popup}: Props) => (
  <Popup ctx={ctx} style={popup.style}>
    <LabelEditor
      ctx={ctx}
      labelID={popup.meta.label.labelID}
      name={popup.meta.label.name}
      color={popup.meta.label.color}
      onCancelEditingLabel={ctx.state.popup.dismiss}
      onSaveLabel={({name, color}) => {
        const label = popup.meta.label
        if (label.name !== name || label.color !== color) {
          ctx.editor.operate(operator =>
            Command.setNBDBLabel(operator as NBOperator, {
              tableBlockID: popup.meta.tableBlockID,
              fieldID: popup.meta.fieldID,
              label: {
                ...label,
                name,
                color,
              },
            })
          )
        }
        ctx.editor.popup(null)
      }}
      onDeleteEditingLabel={() => {
        ctx.editor.operate(operator =>
          Command.delNBDBLabel(operator as NBOperator, {
            tableBlockID: popup.meta.tableBlockID,
            fieldID: popup.meta.fieldID,
            labelID: popup.meta.label.labelID,
          })
        )
        ctx.editor.popup(null)
      }}
    />
  </Popup>
)

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBFieldLabelPopup>};
