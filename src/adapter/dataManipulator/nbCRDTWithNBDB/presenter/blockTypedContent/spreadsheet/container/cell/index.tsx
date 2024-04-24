import type {Editor} from "@/domain"

import {NBDBEvaluatedValue} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import {NBDBRecord} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"

import type {EditingPath} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/editing"

import {
  renderDateRange,
  renderBooleanAsCheckbox,
  renderLabels,
  renderFormulaResult,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/value"

import ValueCell from "./value"
import {ReactElement} from "react"

export const Cells = (
  editor: Editor,
  state: NBDBSpreadsheet,
  record: NBDBRecord,
  editing: EditingPath
) => {
  return state.visibleFields.map(field => {
    const evaluated = record.fieldMap[field.fieldID]
    const isEditing = editing?.subPath.fieldID === evaluated.fieldID
    return (
      <td
        key={field.fieldID}
        data-nbdb-working={isEditing}
        onClick={event => {
          if (
            (evaluated.fieldType === "VALUE" ||
              evaluated.fieldType === "NUMBER") &&
            isEditing
          )
            return
          event.preventDefault()
          event.stopPropagation()
          state.editValue(record.blockID, evaluated.fieldID)
        }}
      >
        <div className="nb-ui-content-wrapper">
          <CellContent
            data-nb-dom-type="prop"
            data-nb-prop-type="db-cell"
            data-nb-prop-value={field.fieldID}
            data-nb-col-id={field.fieldID}
            editor={editor}
            editing={editing}
            evaluated={evaluated}
          />
        </div>
      </td>
    )
  })
}

const CellContent = (props: CellProps) => {
  let content: ReactElement | string | null

  switch (props.evaluated.fieldType) {
  case "VALUE":
  case "NUMBER":
    return (
      <ValueCell
        {...props}
        fieldID={props.evaluated.fieldID}
        text={props.evaluated.value.S}
      />
    )
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
      className="nb-ui-content"
      data-nb-dom-type="prop"
      data-nb-prop-type="db-cell"
      data-nb-prop-value={props.evaluated.fieldID}
      data-nb-col-id={props.evaluated.fieldID}
    >
      {content}
    </div>
  )
}

export type CellProps = {
  editor: Editor;
  evaluated: NBDBEvaluatedValue;
  editing: EditingPath;
} & React.HTMLAttributes<HTMLDivElement>;
