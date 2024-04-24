import type {DBFieldID, DBLabelID, Color, Editor, UIHandler} from "@/domain"
import type {NBDBLabel, NBDBLabelMap} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {Dragging, DraggingDestination} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/popup/labels"

import _ from "lodash"
import {useEffect} from "react"
import {useRecoilValue} from "recoil"
import {sortLabels} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"
import ViewModel from "@/presenter/common/ViewModel"

import EditableLabel from "./EditableLabel"
import LabelEditor from "./LabelEditor"
import AdderBTN from "./AdderBTN"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

export default ({ctx, model}: Props) => {
  model.setStates()

  return (
    <div className="nbdb-labels" data-nb-dragging-container={model.isDragging}>
      {model.labels.map((label, index) => (
        <EditableLabel
          ctx={ctx}
          key={label.labelID}
          labelID={label.labelID}
          name={label.name}
          color={label.color}
          editingLabelID={model.editingLabelID}
          onClickLabel={model.onClickLabel}
          onCancelEditingLabel={model.onCancelEditingLabel}
          onSaveLabel={model.onSaveLabel}
          onDeleteEditingLabel={model.onDeleteEditingLabel}
          onDrag={model.onDrag}
          index={index}
        />
      ))}
      {model.isAdding ? (
        <LabelEditor
          ctx={ctx}
          name=""
          onCancelEditingLabel={model.onCancelEditingLabel}
          onSaveLabel={model.onSaveLabel}
        />
      ) : (
        <AdderBTN onClick={model.onClickAdderBTN} />
      )}
    </div>
  )
}

export class Model extends ViewModel {
  readonly editor: Editor
  readonly template: NBDBTemplate
  readonly fieldID: DBFieldID

  labels: NBDBLabel[]
  isAdding = false
  isDragging = false
  editingLabelID?: string

  private prevLabelMap?: NBDBLabelMap

  constructor(ctx: UIHandler, template: NBDBTemplate, fieldID: DBFieldID) {
    super()
    this.editor = ctx.editor
    this.template = template
    this.fieldID = fieldID

    const labelMap = this.template.fieldMap[this.fieldID]?.labelMap
    this.labels = labelsFromMap(labelMap)
    this.prevLabelMap = labelMap
  }

  setStates = () => {
    super.setStates()

    this.isDragging =
      useRecoilValue(this.editor.state.drag.atom).isDragging &&
      this.editor.state.drag.dragging?.type === NBDBDragType.NBDBLabels

    useEffect(() => {
      const labelMap = this.template.fieldMap[this.fieldID]?.labelMap
      if (labelMap === this.prevLabelMap) return
      this.prevLabelMap = labelMap
      this.labels = labelsFromMap(labelMap)
      this.isAdding = false
      this.editingLabelID = undefined
      this.rerender()
    })
  }

  onDrag = (dragging: Dragging, dest: DraggingDestination | null) => {
    if (!dest) return
    const reordered = reorder(this.labels, dragging.labelID, dest.index)
    if (!reordered) return
    this.labels = reordered
    this.rerender()
    this.editor.emitter.emitHaptic()
  }

  onClickLabel = (labelID?: DBLabelID) => {
    this.editor.emitter.emitHaptic()
    this.isAdding = false
    this.editingLabelID = labelID
    this.rerender()
  }

  onClickAdderBTN = () => {
    this.editor.emitter.emitHaptic()
    delete this.editingLabelID
    this.isAdding = true
    this.rerender()
  }

  onCancelEditingLabel = () => {
    delete this.editingLabelID
    this.isAdding = false
    this.rerender()
  }

  onDeleteEditingLabel = (labelID: DBLabelID) => {
    this.editor.operate(operator =>
      Command.delNBDBLabel(operator as NBOperator, {
        tableBlockID: this.template.tableBlockID,
        fieldID: this.fieldID,
        labelID,
      })
    )
  }

  onSaveLabel = (label: {labelID?: DBLabelID; name: string; color?: Color}) => {
    this.editor.operate(operator =>
      Command.setNBDBLabel(operator as NBOperator, {
        tableBlockID: this.template.tableBlockID,
        fieldID: this.fieldID,
        label: {
          ...label,
          order: label.labelID
            ? this.prevLabelMap?.[label.labelID!].order ?? 0
            : this.labels.length,
        },
      })
    )
  }

  changedOrders = ():
    | {
        labelID: string;
        order: number;
      }[]
    | undefined => {
    const labelOrders = this.labels
      .map((label, order) => ({labelID: label.labelID, order}))
      .filter(
        labelOrder =>
          this.prevLabelMap?.[labelOrder.labelID]?.order != labelOrder.order
      )

    if (labelOrders.length === 0) return
    return labelOrders
  }
}

const labelsFromMap = (labelMap?: NBDBLabelMap) =>
  labelMap ? _.cloneDeep(sortLabels(Object.values(labelMap))) : []

const reorder = (
  labels: NBDBLabel[],
  draggingLabelID: DBLabelID,
  to: number
): NBDBLabel[] | undefined => {
  const from = labels.findIndex(item => item.labelID == draggingLabelID)
  if (from < 0 || from === to) return

  const label = labels[from]
  labels.splice(from, 1)
  labels.splice(to, 0, label)
  return labels
}

type Props = {
  ctx: UIHandler;
  model: Model;
};
