import type {DBLabelID} from "@/domain"
import type {
  Draggable,
  Dragging,
  DraggingDestination,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag/popup/labels"
import type {Props as LabelEditorProps} from "./LabelEditor"

import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"
import Label from "./Label"
import LabelEditor from "./LabelEditor"

export default (props: Props) =>
  props.labelID === props.editingLabelID ? (
    <LabelEditor
      ctx={props.ctx}
      labelID={props.labelID}
      name={props.name}
      color={props.color}
      onCancelEditingLabel={props.onCancelEditingLabel}
      onSaveLabel={props.onSaveLabel}
      onDeleteEditingLabel={props.onDeleteEditingLabel}
    />
  ) : (
    <Label
      index={props.index}
      labelID={props.labelID}
      name={props.name}
      color={props.color}
      onClick={() => props.onClickLabel(props.labelID)}
      isHoverable
      draggable
      onDragStart={event => {
        event.preventDefault()
        props.ctx.drag.onBlockDraggingStart(draggable(props), {
          left: event.clientX,
          top: event.clientY,
        })
      }}
      onTouchStart={event => {
        props.ctx.touch.onTouchStart(event, draggable(props))
      }}
    />
  )

const draggable = (props: Props): Draggable => ({
  type: NBDBDragType.NBDBLabels,
  labelID: props.labelID!,
  query: {
    container: ".nbdb-labels[data-nb-dragging-container]",
    target: `[data-nbdb-label-id="${props.labelID}"]`,
  },
  onDrag: props.onDrag,
})

type Props = LabelEditorProps & {
  index: number;
  labelID: DBLabelID;
  editingLabelID?: DBLabelID;
  onClickLabel: (editingLabelID?: DBLabelID) => void;
  onDrag: (dragging: Dragging, dest: DraggingDestination | null) => void;
};
