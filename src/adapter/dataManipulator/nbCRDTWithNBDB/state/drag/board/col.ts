import type {BlockID} from "@/domain/entity"
import type {NBDBBoard} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {Handler} from "@/domain/usecase/state/drag"

import {BlockType, domDBTemplate} from "@/domain"
import {
  DOMGetWipedGhostContainer,
  DOMHorizontalScrollWhileDragging,
  DOMRemoveDraggingDestinationMarkers,
  DOMGetGhostPositionX,
  DOMCheckContainer,
} from "@/domain/usecase/uiHandler/drag/common"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"

/** @category Handler */
const handler: Handler = {
  start: (_editor, draggable) => {
    if (!isDraggable(draggable)) return

    const dragging = {
      ...draggable,
      container: DOMGetDraggableContainer(draggable),
    }
    DOMSetDraggingGhost(dragging)

    return dragging
  },
  move: (_editor, pointer, dragging) => {
    if (!isDragging(dragging)) return
    const destination = DOMSetDestination(
      pointer.clientX,
      pointer.clientY,
      dragging.container
    )
    const position = DOMGetGhostPositionX(pointer, dragging.container)
    DOMHorizontalScrollWhileDragging(pointer.clientX)
    return {destination, position}
  },
  end: (_editor, dragging, dest) => {
    if (!isDragging(dragging) || !isDraggingDestination(dest)) return
    dragging.state.moveColumn(dragging.columnID, dest.columnID, dest.toPrev)
  },
}

/** @category Type */
export type Draggable = {
  type: NBDBDragType.DBBoardCol;
  templateBlockID: BlockID;
  columnID: string;
  state: NBDBBoard;
};

export type DraggableContainer = {
  blockID: BlockID;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type Dragging = {
  blockHandleID?: undefined;
  type: NBDBDragType.DBBoardCol;
  container: DraggableContainer;
  templateBlockID: BlockID;
  columnID: string;
  state: NBDBBoard;
};

export type DraggingDestination = {
  type: NBDBDragType.DBBoardCol;
  columnID: string;
  toPrev: boolean;
};

export const isDraggable = (draggable: {
  type: string;
}): draggable is Draggable => draggable.type === NBDBDragType.DBBoardCol
export const isDragging = (dragging: {type: string}): dragging is Dragging =>
  dragging.type === NBDBDragType.DBBoardCol
export const isDraggingDestination = (draggingDestination: {
  type: string;
}): draggingDestination is DraggingDestination =>
  draggingDestination.type === NBDBDragType.DBBoardCol

/** @category DOM */
const DOMGetDraggableContainer = (draggable: Draggable): DraggableContainer => {
  const domContainer = domDBTemplate(draggable.templateBlockID)
  const rect = domContainer.getBoundingClientRect()

  return {
    blockID: draggable.templateBlockID,
    left: rect.left + 8,
    right: rect.right - 8,
    top: rect.top + 8,
    bottom: rect.top,
  }
}

const DOMSetDraggingGhost = (dragging: Dragging): void => {
  const ghostContainer = DOMGetWipedGhostContainer()
  const ghostLabel = domDBTemplate(dragging.templateBlockID)
    .querySelector(
      `[data-nb-db-col-id="${dragging.columnID}"] .nb-db-col-header .nbdb-label`
    )
    ?.cloneNode(true) as HTMLElement

  const ghostBlock = document.createElement("div")
  ghostBlock.dataset.nbBlockType = BlockType.Database
  ghostBlock.classList.add("nb-no-editable")
  ghostBlock.appendChild(ghostLabel)
  ghostContainer.appendChild(ghostBlock)
}

const DOMSetDestination = (
  clientX: number,
  clientY: number,
  container?: DraggableContainer
): DraggingDestination | null => {
  const target = window.document
    .elementFromPoint(clientX, clientY)
    ?.closest("[data-nb-db-col-id]")
  if (!target) return null
  if (!DOMCheckContainer(target, container)) return null

  const columnID = target.getAttribute("data-nb-db-col-id")!
  if (!columnID) return null

  let toPrev = false
  if (
    clientX <
    target!.getBoundingClientRect().left + target!.clientWidth / 2
  ) {
    toPrev = true
  }

  DOMRemoveDraggingDestinationMarkers(window.document)

  if (toPrev) {
    target.classList.add("nb-dragging-prev")
  } else {
    target.classList.add("nb-dragging-next")
  }

  return {type: NBDBDragType.DBBoardCol, columnID, toPrev}
}

export default handler
