import type {
  BlockID,
  BlockPropsDelta,
  DBFieldAggregationKey,
  DBFieldID,
  DBLabelID,
  Editor,
  UIHandler,
} from "@/domain"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {DBAggregationPopup} from ".."

import {useState} from "react"
import {BlockPropKey} from "@/domain/entity"
import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"

import Popup from "@/presenter/layer/popup/Popup"

const DBAggregationPopupComponent = (props: {
  ctx: UIHandler,
  popup: PopupWithStyle<DBAggregationPopup>;
}) => {
  const popup = props.popup

  return (
    <Popup ctx={props.ctx} style={popup.style}>
      {popup.meta.spreadsheet ? (
        <SpreadsheetAggregationSetter editor={props.ctx.editor} popup={popup} />
      ) : popup.meta.board ? (
        <BoardAggregationSetter editor={props.ctx.editor} popup={popup} />
      ) : (
        <div>Unknown Template</div>
      )}
    </Popup>
  )
}

/** @category Spreadsheet */
const SpreadsheetAggregationSetter = (props: {editor: Editor, popup: DBAggregationPopup}) => {
  const spreadsheet = props.popup.meta.spreadsheet!

  return (
    <div className="nb-ui-menu">
      <div
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          props.editor.emitter.emitHaptic()
          setSpreadsheetAggregation(
            props.editor,
            event,
            spreadsheet.templateBlockID,
            spreadsheet.fieldID,
            null
          )
        }}
      >
        None
      </div>

      {aggregationKeys.map(key => {
        return (
          <div
            key={key}
            className="nb-ui-menu-item is-hoverable"
            onClick={event => {
              props.editor.emitter.emitHaptic()
              setSpreadsheetAggregation(
                props.editor,
                event,
                spreadsheet.templateBlockID,
                spreadsheet.fieldID,
                key
              )
            }}
          >
            {aggregationNameMap[key]}
          </div>
        )
      })}
    </div>
  )
}

const setSpreadsheetAggregation = async (
  editor: Editor,
  event: React.MouseEvent,
  templateBlockID: BlockID,
  fieldID: DBFieldID,
  aggregationKey: DBFieldAggregationKey | null
) => {
  if (!editor.state.popup.isPresented) return
  editor.setBlockProps(templateBlockID, {
    [BlockPropKey.DBSpreadsheet]: {
      FIELDS: {
        [fieldID]: {
          AGGREGATION: aggregationKey,
        },
      },
    },
  } as BlockPropsDelta)
  editor.state.popup.dismiss(event)
}

/** @category Board */
const BoardAggregationSetter = (props: {editor: Editor; popup: DBAggregationPopup}) => {
  const [aggregationKey, setAggregationKey] = useState<
    DBFieldAggregationKey | undefined | null
  >()
  const board = props.popup.meta.board!

  if (aggregationKey) {
    return (
      <div className="nb-ui-menu">
        {board.fields.map(field => {
          return (
            <div
              key={field.fieldID}
              className="nb-ui-menu-item is-hoverable"
              onClick={event => {
                event.preventDefault()
                event.stopPropagation()
                props.editor.emitter.emitHaptic()
                setBoardAggregation(
                  props.editor,
                  event,
                  board.templateBlockID,
                  board.boardFieldID,
                  board.labelID,
                  aggregationKey,
                  field.fieldID
                )
              }}
            >
              <NBDBSymbol type={field.type} />
              <div>{field.name}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="nb-ui-menu">
      <div
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          props.editor.emitter.emitHaptic()
          setBoardAggregation(
            props.editor,
            event,
            board.templateBlockID,
            board.boardFieldID,
            board.labelID,
            "count"
          )
        }}
      >
        {aggregationNameMap["count"]}
      </div>

      {board.fields.length
        ? aggregationKeysExceptForCountAll.map(key => {
          return (
            <div
              key={key}
              className="nb-ui-menu-item is-hoverable"
              onClick={() => {
                props.editor.emitter.emitHaptic()
                setAggregationKey(key)
              }}
            >
              {aggregationNameMap[key]}
            </div>
          )
        })
        : null}
    </div>
  )
}

const setBoardAggregation = async (
  editor: Editor,
  event: React.MouseEvent,
  templateBlockID: BlockID,
  boardFieldID: DBFieldID,
  labelID: DBLabelID,
  aggregationKey: DBFieldAggregationKey,
  fieldID?: DBFieldID
) => {
  if (!editor.state.popup.isPresented) return

  const AGGREGATION = fieldID ? [aggregationKey, fieldID] : [aggregationKey]
  editor.setBlockProps(templateBlockID, {
    [BlockPropKey.DBBoard]: {
      FIELDS: {
        [boardFieldID]: {
          LABELS: {
            [labelID]: {
              AGGREGATION,
            },
          },
        },
      },
    },
  } as BlockPropsDelta)
  editor.state.popup.dismiss(event)
}

const aggregationKeysExceptForCountAll: DBFieldAggregationKey[] = [
  "countEmpty",
  "countNotEmpty",
  "percentEmpty",
  "percentNotEmpty",
  /** @category date exclusive */
  "countUnique",
  /** @category date and number exclusive */
  "countTruthy",
  "countFalsy",
  "percentTruthy",
  "percentFalsy",
  /** @category number */
  "sum",
  "average",
  "median",
  "min",
  "max",
  "range",
]

const aggregationKeys: DBFieldAggregationKey[] = [
  "count",
  ...aggregationKeysExceptForCountAll,
]

export const aggregationNameMap = {
  count: "Count All",
  countEmpty: "Count Empty",
  countNotEmpty: "Count Not Empty",
  countUnique: "Count Unique",
  countTruthy: "Count Truthy",
  countFalsy: "Count Falsy",
  percentEmpty: "Percent Empty",
  percentNotEmpty: "Percent Not Empty",
  percentTruthy: "Percent Truthy",
  percentFalsy: "Percent Falsy",
  sum: "Sum",
  average: "Average",
  median: "Median",
  min: "Min",
  max: "Max",
  range: "Range",
}

export default DBAggregationPopupComponent
