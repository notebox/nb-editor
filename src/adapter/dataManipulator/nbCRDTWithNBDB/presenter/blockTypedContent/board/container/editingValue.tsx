import type {BlockID, ReadOnlyOptions} from "@/domain"
import type {NBDBEvaluatedValue} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBBoard} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {EditingPath} from "../../common/editing"
import type {ReactElement} from "react"

import React from "react"
import {
  renderBooleanAsCheckbox,
  renderDateRange,
  renderLabels,
  renderFormulaResult,
} from "../../common/value"

export const EditingValue = (props: {
  readOnly: false | ReadOnlyOptions;
  state: NBDBBoard;
  recordBlockID: BlockID;
  evaluated: NBDBEvaluatedValue;
  editing: EditingPath;
}): JSX.Element => {
  let content: ReactElement | string | null

  switch (props.evaluated.fieldType) {
  case "VALUE":
  case "NUMBER": {
    const composing =
        (props.editing?.composing &&
          props.editing.subPath.fieldID === props.evaluated.fieldID) ||
        false

    return (
      <MemoizedValue readOnly={props.readOnly} composing={composing} evaluated={props.evaluated} />
    )
  }
  case "BOOLEAN":
    content = renderBooleanAsCheckbox(props.evaluated.value.B)
    break
  case "FORMULA":
    content = renderFormulaResult(props.evaluated.value)
    break
  case "LABEL":
  case "LABELS":
    content = renderLabels(props.evaluated.value.L)
    break
  case "DATE":
    content = renderDateRange(props.evaluated.value.D)
    break
  }

  return (
    <div
      className="nb-db-field-value"
      placeholder="Empty"
      onClick={event => onClick(event, props)}
    >
      {content}
    </div>
  )
}

const ValueCell = (props: {readOnly: false | ReadOnlyOptions; composing: boolean; evaluated: NBDBEvaluatedValue}) => {
  return (
    <div
      className="nb-db-field-value"
      placeholder="Empty"
      contentEditable={!props.readOnly}
      suppressContentEditableWarning
      data-nb-dom-type="prop"
      data-nb-prop-type="db-cell"
      data-nb-prop-value={props.evaluated.fieldID}
    >
      {props.evaluated.value.S}
    </div>
  )
}

const MemoizedValue = React.memo(ValueCell, (_, next) => {
  return next.composing
})

const onClick = (
  event: React.MouseEvent,
  props: {
    state: NBDBBoard;
    recordBlockID: BlockID;
    evaluated: NBDBEvaluatedValue;
  }
) => {
  event.preventDefault()
  event.stopPropagation()
  props.state.editValue(props.recordBlockID, props.evaluated.fieldID)
}
