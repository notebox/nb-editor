import type {UIHandler} from "@/domain"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {DBTemplatePopup} from ".."

import {BlockPropKey} from "@/domain/entity"
import Popup from "@/presenter/layer/popup/Popup"
import TableIcon from "@/presenter/common/icon/table"
import BoardIcon from "@/presenter/common/icon/board"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default ({ctx, popup}: {ctx: UIHandler, popup:  PopupWithStyle<DBTemplatePopup>}) => (
  <Popup ctx={ctx} style={popup.style}>
    <div className="nb-ui-menu">
      <div
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          if (!ctx.state.popup.isPresented) return
          ctx.editor.emitter.emitHaptic()
          ctx.editor.operate(operator =>
            Command.setDBTemplate(
              operator as NBOperator,
              popup.meta.tableBlockID,
              popup.meta.templateBlockID,
              BlockPropKey.DBSpreadsheet
            )
          )
          ctx.state.popup.dismiss(event)
        }}
      >
        <TableIcon />
        Spreadsheet
      </div>
      <div
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          if (!ctx.state.popup.isPresented) return
          ctx.editor.emitter.emitHaptic()
          ctx.editor.operate(operator =>
            Command.setDBTemplate(
              operator as NBOperator,
              popup.meta.tableBlockID,
              popup.meta.templateBlockID,
              BlockPropKey.DBBoard
            )
          )
          ctx.state.popup.dismiss(event)
        }}
      >
        <BoardIcon />
        Board
      </div>
    </div>
  </Popup>
)
