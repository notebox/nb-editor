import type {Editor} from "@/domain"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"

import {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default (editor: Editor, template: NBDBTemplate) => {
  const fields = template.allFields.filter(field => field.type === "LABEL")
  return (
    <div className="nb-ui-menu">
      {fields.map(field => {
        return (
          <div
            key={field.fieldID}
            className="nb-ui-menu-item is-hoverable"
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()
              editor.emitter.emitHaptic()
              editor.operate(operator => {
                Command.setNBDBBoardLabeledField(operator as NBOperator, {
                  templateBlockID: template.templateBlockID,
                  fieldID: field.fieldID,
                })
              })
              editor.popup(null)
            }}
          >
            <NBDBSymbol type={field.type} />
            <div>{field.name}</div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flex: "1",
              }}
            >
              {field.labelMap ? Object.keys(field.labelMap).length : 0}
            </div>
          </div>
        )
      })}
      <div
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          event.preventDefault()
          event.stopPropagation()

          const fieldID = template.addNewLabeledField()
          if (!fieldID) return

          editor.popup({
            type: "nbdb-field",
            meta: {
              tableBlockID: template.tableBlockID,
              templateBlockID: template.templateBlockID,
              fieldID,
              disableTypeChanging: true,
            },
          }, event)
        }}
      >
        <div>Create New Field</div>
      </div>
    </div>
  )
}
