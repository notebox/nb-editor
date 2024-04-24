import type {DBLabelID} from "@/domain/entity"
import type {Handler} from "@/domain/usecase/state/drag"

import {
  DOMGetBoundary,
  DOMValidateTarget,
  DOMGetWipedGhostContainer,
  DOMVerticalScrollWhileDragging,
} from "@/domain/usecase/uiHandler/drag/common"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"

/** @category Handler */
const handler: Handler = {
  start: (_editor, draggable) => {
    if (!isDraggable(draggable)) return

    const {type, query, labelID, onDrag} = draggable
    const container = document.querySelector(query.container)
    if (!container) return
    const target = container.querySelector(query.target)
    if (!target) return

    const dragging: Dragging = {
      type,
      labelID,
      container: {
        ...DOMGetBoundary(container),
        query: query.container,
      },
      onDrag,
    }

    DOMGetWipedGhostContainer().appendChild(target.cloneNode(true))

    return dragging
  },
  move: (_editor, pointer, dragging) => {
    if (!isDragging(dragging)) return
    const destination = DOMGetDestination(pointer, dragging)

    DOMVerticalScrollWhileDragging(pointer.clientY)

    dragging.onDrag?.(dragging, destination)

    return {
      destination,
      position: {
        left: pointer.clientX,
        top: pointer.clientY,
      },
      style: {
        transform: "scale(1.5)",
        padding: "0.5rem",
      },
    }
  },
  end: (_editor, dragging, dest) => {
    if (!isDragging(dragging) || !isDraggingDestination(dest)) return
  },
}

/** @category Type */
export type Draggable = {
  type: NBDBDragType.NBDBLabels;
  labelID: DBLabelID;
  query: {
    container: string;
    target: string;
  };
  onDrag: (dragging: Dragging, dest: DraggingDestination | null) => void;
};

export type DraggableContainer = {
  query: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type Dragging = {
  type: NBDBDragType.NBDBLabels;
  labelID: DBLabelID;
  container: DraggableContainer;
  onDrag: Draggable["onDrag"];
};

export type DraggingDestination = {
  type: NBDBDragType.NBDBLabels;
  index: number;
};

export const isDraggable = (draggable: {
  type: string;
}): draggable is Draggable => draggable.type === NBDBDragType.NBDBLabels
export const isDragging = (dragging: {type: string}): dragging is Dragging =>
  dragging.type === NBDBDragType.NBDBLabels
export const isDraggingDestination = (draggingDestination: {
  type: string;
}): draggingDestination is DraggingDestination =>
  draggingDestination.type === NBDBDragType.NBDBLabels

/** @category DOM */
const DOMGetDestination = (
  pointer: {
    clientX: number;
    clientY: number;
  },
  dragging: Dragging
): DraggingDestination | null => {
  const target = window.document
    .elementFromPoint(pointer.clientX, pointer.clientY)
    ?.closest("[data-nbdb-label-id]")

  if (!DOMValidateTarget(target, dragging.container)) return null

  const targetLabelID = target.getAttribute("data-nbdb-label-id")!
  if (dragging.labelID === targetLabelID) return null

  let index = Number(target.getAttribute("data-nbdb-label-index"))
  index =
    pointer.clientX <
    target.getBoundingClientRect().left + target.clientWidth * 0.5
      ? index
      : index + 1

  return {
    type: NBDBDragType.NBDBLabels,
    index,
  }
}

export default handler
