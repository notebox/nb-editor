import type {UIHandler} from "@/domain"
import type {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {Draggable as DraggableCOL} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/spreadsheet/col"

import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"
import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"
import NBDBAdder from "../../common/Adder"

const Header = (props: {ctx: UIHandler, state: NBDBSpreadsheet}) => (
  <thead className="nb-db-header">
    <tr>
      <th className="nb-db-note-padding"></th>
      {props.state.visibleFields.map((field, index) => {
        const style = field.width
          ? {width: field.width, minWidth: field.width, maxWidth: field.width}
          : undefined
        return (
          <th
            style={style}
            data-nb-col-id={field.fieldID}
            data-nb-col-idx={index}
            key={field.fieldID}
            onClick={event => props.state.presentField(event, field, true)}
            onDragStart={event => {
              event.preventDefault()
              props.ctx.drag.onBlockDraggingStart(
                {
                  type: NBDBDragType.DBSpreadsheetCol,
                  spreadsheetBlockID: props.state.templateBlockID,
                  fieldID: field.fieldID,
                  state: props.state,
                } as DraggableCOL,
                {
                  left: event.clientX,
                  top: event.clientY,
                }
              )
            }}
            onTouchStart={event => {
              props.ctx.touch.onTouchStart(event, {
                type: NBDBDragType.DBSpreadsheetCol,
                spreadsheetBlockID: props.state.templateBlockID,
                fieldID: field.fieldID,
                state: props.state,
              } as DraggableCOL)
            }}
            draggable={true}
          >
            <div>
              <NBDBSymbol type={field.type} />
              <span className="nb-ui-title" placeholder="field">
                {field.name}
              </span>
            </div>
          </th>
        )
      })}
      <th className="nb-db-add-field">
        <NBDBAdder onClick={props.state.onClickAddField} />
      </th>
    </tr>
  </thead>
)

export default Header
