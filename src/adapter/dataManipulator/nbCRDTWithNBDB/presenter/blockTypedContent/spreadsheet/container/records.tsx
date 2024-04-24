import type {UIHandler} from "@/domain"
import type {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {NBDBRecord} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"
import type {EditingPath} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/editing"
import type {Draggable as DraggableROW} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/spreadsheet/record"

import {useRecoilValue} from "recoil"
import {NBRange} from "@/domain/entity"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"
import BlockHandle from "@/presenter/blocks/parts/handle"
import {getEditingPathFromWorkingCaret} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/editing"
import {Cells} from "./cell"

const DBRecords = (props: {ctx: UIHandler; state: NBDBSpreadsheet}) => {
  const workingCaret = useRecoilValue(props.ctx.state.working.atom).caret
  const editing = getEditingPathFromWorkingCaret(
    props.ctx.editor,
    props.state.templateBlockID,
    workingCaret
  )

  return (
    <tbody className="nb-db-records">
      {props.state.records.map(record =>
        renderDBRecord(props.ctx, props.state, record, editing)
      )}
    </tbody>
  )
}

const renderDBRecord = (
  ctx: UIHandler,
  state: NBDBSpreadsheet,
  record: NBDBRecord,
  editing: EditingPath | null
) => {
  const draggable: DraggableROW = {
    type: NBDBDragType.DBSpreadsheetRecord,
    blockID: record.blockID,
    spreadsheetBlockID: state.templateBlockID,
  }
  const editingDBRecord =
    (editing?.subPath?.recordBlockID === record.blockID && editing) || null

  return (
    <tr
      key={record.blockID}
      className="nb-db-record"
      data-nb-dom-type="prop"
      data-nb-prop-value={record.blockID}
      onMouseEnter={event =>
        ctx.mouse.onMouseEnterToBlock(event, record.blockID)
      }
      onMouseLeave={event =>
        ctx.mouse.onMouseLeaveFromBlock(event, record.blockID)
      }
      onTouchStart={event => {
        if (ctx.state.popup.isPresented) return
        ctx.touch.onTouchStart(event, draggable)
      }}
    >
      <td className="nb-db-note-padding">
        <BlockHandle
          ctx={ctx}
          blockID={record.blockID}
          draggable={draggable}
        />
      </td>
      {Cells(ctx.editor, state, record, editingDBRecord)}
      <td
        className="nb-db-add-field"
        onClick={event => {
          event.preventDefault()
          ctx.editor.selector.select(
            NBRange.decode({
              blockID: state.templateBlockID,
              subPath: {
                type: "db",
                recordBlockID: record.blockID,
              },
            })
          )
        }}
      ></td>
    </tr>
  )
}

export default DBRecords
