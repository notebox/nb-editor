import type {BlockID} from "@/domain/entity"
import type {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {Handler} from "@/domain/usecase/state/drag"

import {BlockType, BlockPropKey, domDBTemplate} from "@/domain"
import {
  DOMGetWipedGhostContainer,
  DOMHorizontalScrollWhileDragging,
  DOMRemoveDraggingDestinationMarkers,
  DOMGetGhostPositionX,
  DOMCheckContainer,
  DOMWrapGhost,
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
    dragging.state.movField(dragging.fieldID, dest.fieldID, dest.toPrev)
  },
}

/** @category Type */
export type Draggable = {
  type: NBDBDragType.DBSpreadsheetCol;
  spreadsheetBlockID: BlockID;
  fieldID: string;
  state: NBDBSpreadsheet;
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
  type: NBDBDragType.DBSpreadsheetCol;
  container: DraggableContainer;
  spreadsheetBlockID: BlockID;
  fieldID: string;
  state: NBDBSpreadsheet;
};

export type DraggingDestination = {
  type: NBDBDragType.DBSpreadsheetCol;
  fieldID: string;
  toPrev: boolean;
};

export const isDraggable = (draggable: {
  type: string;
}): draggable is Draggable => draggable.type === NBDBDragType.DBSpreadsheetCol
export const isDragging = (dragging: {type: string}): dragging is Dragging =>
  dragging.type === NBDBDragType.DBSpreadsheetCol
export const isDraggingDestination = (draggingDestination: {
  type: string;
}): draggingDestination is DraggingDestination =>
  draggingDestination.type === NBDBDragType.DBSpreadsheetCol

/** @category DOM */
const DOMGetDraggableContainer = (draggable: Draggable): DraggableContainer => {
  const domContainer = domDBTemplate(draggable.spreadsheetBlockID)
  const rect = domContainer.getBoundingClientRect()

  return {
    blockID: draggable.spreadsheetBlockID,
    left: rect.left + 8,
    right: rect.right - 8,
    top: rect.top + 8,
    bottom: rect.top,
  }
}

const DOMSetDraggingGhost = (dragging: Dragging): void => {
  const ghostContainer = DOMGetWipedGhostContainer()
  const ghostCell = domDBTemplate(dragging.spreadsheetBlockID)
    .querySelector(`th[data-nb-col-id="${dragging.fieldID}"]`)
    ?.cloneNode(true) as HTMLElement
  const ghost = DOMWrapGhost(["nb-db-table"], ghostCell)

  const ghostBlock = document.createElement("div")
  ghostBlock.dataset.nbBlockType = BlockType.Database
  ghostBlock.dataset.nbDbTemplate = BlockPropKey.DBSpreadsheet
  ghostBlock.classList.add("nb-no-editable")
  ghostBlock.appendChild(ghost)
  ghostContainer.appendChild(ghostBlock)
}

const DOMSetDestination = (
  clientX: number,
  clientY: number,
  container?: DraggableContainer
): DraggingDestination | null => {
  const target = window.document
    .elementFromPoint(clientX, clientY)
    ?.closest("th")
  if (!target) return null
  if (!DOMCheckContainer(target, container)) return null

  const fieldID = target.getAttribute("data-nb-col-id")!
  if (!fieldID) return null

  let toPrev = false
  if (
    clientX <
    target!.getBoundingClientRect().left + target!.clientWidth / 2
  ) {
    toPrev = true
  }

  DOMRemoveDraggingDestinationMarkers(window.document)

  if (toPrev) {
    target.classList.add("nb-dragging-prev");
    (target.previousSibling as HTMLElement).classList.add("nb-dragging-next")
  } else {
    target.classList.add("nb-dragging-next");
    (target.nextSibling as HTMLElement).classList.add("nb-dragging-prev")
  }

  return {type: NBDBDragType.DBSpreadsheetCol, fieldID, toPrev}
}

export default handler
