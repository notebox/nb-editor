import type {NBDBField} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import PlusIcon from "@/presenter/common/icon/plus"

const Footer = (props: {state: NBDBSpreadsheet}) => (
  <tfoot className="nb-db-footer">
    <tr>
      <td className="nb-db-note-padding"></td>
      <td
        className="nb-db-add-record"
        onClick={props.state.onClickAddRecord}
        colSpan={props.state.visibleFields.length + 1}
      >
        <PlusIcon /> Record
      </td>
    </tr>
    <tr className="nb-db-summary">
      <td className="nb-db-note-padding"></td>
      {props.state.visibleFields.map((field, index) => {
        return (
          <td
            data-nb-col-id={field.fieldID}
            data-nb-col-idx={index}
            key={field.fieldID}
            onClick={event => {
              props.state.onClickAggregation(event, field.fieldID)
            }}
          >
            {renderFooter(props.state, field, index)}
          </td>
        )
      })}
      <td className="nb-db-add-field"></td>
    </tr>
  </tfoot>
)

const renderFooter = (
  state: NBDBSpreadsheet,
  field: NBDBField,
  index: number
) => {
  const aggregation = state.aggregationMap[field.fieldID]
  if (aggregation) {
    return renderAggregation(aggregation.name, aggregation.value)
  }
  if (index) return null
  return renderAggregation("count", state.records.length)
}

const renderAggregation = (name: string, value: string | number) => {
  return (
    <div className="nb-db-field-footer">
      <div className="name">{name}</div>
      <div className="value">{value}</div>
    </div>
  )
}

export default Footer
