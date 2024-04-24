import type {DBLabelID, Editor, UIHandler} from "@/domain"
import type {NBDBRecord} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"
import type {NBDBBoard, NBDBBoardLabel} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {EditingPath} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/editing"
import type {Draggable as DraggableCOL} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/board/col"
import type {Draggable as DraggableROW} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/board/record"

import {useRecoilValue} from "recoil"
import {BlockType, DBBoardUnsetLabelID} from "@/presenter"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"
import LabelComponent from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/label"
import {
  renderBoolean,
  renderDateRange,
  renderLabels,
  renderFormulaResult,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/value"
import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"
import {getEditingPathFromWorkingCaret} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/editing"
import PlusIcon from "@/presenter/common/icon/plus"
import MoreIcon from "@/presenter/common/icon/more"
import {EditingValue} from "./editingValue"
import NBDBAdder from "../../common/Adder"

const Container = (props: {ctx: UIHandler; state: NBDBBoard}) => {
  const isDragging =
    useRecoilValue(props.ctx.state.drag.atom).isDragging &&
    props.ctx.state.drag.dragging?.container?.blockID === props.state.templateBlockID
  const workingCaret = useRecoilValue(props.ctx.state.working.atom).caret
  const editing = getEditingPathFromWorkingCaret(
    props.ctx.editor,
    props.state.templateBlockID,
    workingCaret
  )

  if (!props.state.boardFieldID) {
    return null
  }

  return (
    <div className="nb-db-container" data-nb-dragging-container={isDragging}>
      <div className="nb-db-content">
        {props.state.labels.map(label => {
          return (
            <Column
              key={label.labelID}
              ctx={props.ctx}
              state={props.state}
              label={label}
              editing={editing}
            />
          )
        })}
        <div className="nb-db-col-add">
          <NBDBAdder onClick={props.state.onClickAddBoardLabel} />
        </div>
      </div>
      <div className="nb-ui-footer">&nbsp;</div>
    </div>
  )
}

const Column = (props: {
  ctx: UIHandler;
  state: NBDBBoard;
  label: NBDBBoardLabel;
  editing: EditingPath;
}) => {
  const label = props.label
  const unset = label.labelID === DBBoardUnsetLabelID

  return (
    <div
      className="nb-db-col"
      key={props.label.labelID}
      data-nb-db-col-id={props.label.labelID}
      onClick={event => {
        event.preventDefault()
        event.stopPropagation()
        const userMayWantsToStopEditingBoard =
          props.editing?.subPath.recordBlockID &&
          !props.state.records[props.label.labelID].find(
            record =>
              record.blockID === props.editing!.subPath.recordBlockID
          )
        if (userMayWantsToStopEditingBoard) {
          props.state.select()
        }
      }}
    >
      <div className="nb-db-col-header">
        {
          <div
            className="nb-db-col-label"
            onClick={event => props.state.presentFieldLabel(event, label)}
            onDragStart={event => {
              event.preventDefault()
              props.ctx.drag.onBlockDraggingStart(
                {
                  type: NBDBDragType.DBBoardCol,
                  templateBlockID: props.state.templateBlockID,
                  columnID: label.labelID,
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
                type: NBDBDragType.DBBoardCol,
                templateBlockID: props.state.templateBlockID,
                columnID: label.labelID,
                state: props.state,
              } as DraggableCOL)
            }}
            draggable={true}
          >
            {unset ? (
              label.name
            ) : (
              <LabelComponent name={label.name} color={label.color} />
            )}
          </div>
        }
        {renderAggregation(props.state, props.label.labelID)}
        <div
          className="nb-db-add-record"
          onClick={event => {
            props.state.onClickAddRecord(event, props.label.labelID, true)
          }}
        >
          <PlusIcon />
        </div>
      </div>
      {props.state.records[props.label.labelID]?.map(record => {
        if (props.editing?.subPath.recordBlockID === record.blockID) {
          return (
            <EditingRecord
              key={record.blockID}
              editor={props.ctx.editor}
              state={props.state}
              label={props.label}
              record={record}
              editing={props.editing}
            />
          )
        }

        return (
          <Record key={record.blockID} ctx={props.ctx} state={props.state} record={record} />
        )
      }) ?? null}
      <div
        className="nbdb-record-adder"
        onClick={event => {
          props.state.onClickAddRecord(event, props.label.labelID, false)
        }}
      >
        <PlusIcon />
        Add Record
      </div>
    </div>
  )
}

const renderAggregation = (
  state: NBDBBoard,
  id: DBLabelID | typeof DBBoardUnsetLabelID
) => {
  return (
    <div
      className="nbdb-col-aggregation"
      onClick={event => {
        state.onClickAggregation(event, id)
      }}
    >
      {state.aggregationMap[id]?.value}
    </div>
  )
}

const Record = (props: {ctx: UIHandler; state: NBDBBoard; record: NBDBRecord}) => {
  return (
    <div
      className="nb-db-record"
      data-nb-prop-value={props.record.blockID}
      key={props.record.blockID}
      onClick={event => {
        event.preventDefault()
        props.state.select(props.record.blockID)
      }}
      onDragStart={event => {
        event.preventDefault()
        props.ctx.drag.onBlockDraggingStart(
          {
            type: NBDBDragType.DBBoardRecord,
            state: props.state,
            dbRecordBlockID: props.record.blockID,
          } as DraggableROW,
          {
            left: event.clientX,
            top: event.clientY,
          }
        )
      }}
      onTouchStart={event => {
        props.ctx.touch.onTouchStart(event, {
          type: NBDBDragType.DBBoardRecord,
          state: props.state,
          dbRecordBlockID: props.record.blockID,
        } as DraggableROW)
      }}
      draggable={true}
    >
      {props.state.visibleFields.map(field => {
        const evaluated = props.record.fieldMap[field.fieldID]

        let value
        switch (evaluated.fieldType) {
        case "VALUE":
        case "NUMBER":
          value = evaluated.value.S
          if (!value) return null
          break
        case "BOOLEAN":
          value = renderBoolean(field.name, evaluated.value.B)
          break
        case "FORMULA":
          if (evaluated.value === null) return null
          value = renderFormulaResult(evaluated.value)
          break
        case "LABEL":
        case "LABELS":
          value = renderLabels(evaluated.value.L)
          break
        case "DATE":
          value = renderDateRange(evaluated.value.D)
          break
        }

        return (
          <div key={field.fieldID} className="nb-db-field">
            <div className="nb-db-field-value">{value}</div>
          </div>
        )
      })}
    </div>
  )
}

const EditingRecord = (props: {
  editor: Editor;
  state: NBDBBoard;
  label: NBDBBoardLabel;
  record: NBDBRecord;
  editing: EditingPath;
}) => {
  return (
    <div
      className="nb-db-editing-record"
      key={props.record.blockID}
      data-nb-dom-type="prop"
      data-nb-prop-value={props.record.blockID}
    >
      <div className="nb-db-editing-record-header">
        <div
          className="nb-db-record-more"
          onClick={event => {
            const boardFieldID = props.state.boardFieldID
            if (!boardFieldID) return

            props.editor.popup({
              type: "block-handle",
              meta: {
                blockID: props.record.blockID,
                blockType: BlockType.DBRecord,
                subPath:
                  props.label.labelID === DBBoardUnsetLabelID
                    ? undefined
                    : {
                      type: "db-board",
                      fieldID: boardFieldID,
                      labelID: props.label.labelID,
                    },
              },
            }, event)
          }}
        >
          <MoreIcon />
        </div>
      </div>
      <div className="nb-db-editing-record-body">
        {props.state.visibleFields.map(field => {
          const evaluated = props.record.fieldMap[field.fieldID]

          return (
            <div
              key={field.fieldID}
              className="nb-db-field"
              data-nb-db-field-id={field.fieldID}
            >
              <div
                className="nb-db-field-title"
                onClick={event => props.state.presentField(event, field)}
              >
                <NBDBSymbol type={field.type} />
                <span placeholder="field">{field.name}</span>
              </div>
              <EditingValue
                state={props.state}
                recordBlockID={props.record.blockID}
                evaluated={evaluated}
                editing={props.editing}
                readOnly={props.editor.state.readOnly}
              />
            </div>
          )
        })}
        <div className="nb-db-field">
          <div
            className="nbdb-field-adder"
            onClick={props.state.onClickAddField}
          >
            <PlusIcon />
            Add Field
          </div>
        </div>
      </div>
    </div>
  )
}

export default Container
