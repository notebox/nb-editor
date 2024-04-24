import type {BlockID, DBLabelID} from "@/domain/entity"
import type {NBDBBoard} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {Handler} from "@/domain/usecase/state/drag"

import {BlockPropKey, domDBTemplate, domDBRecord} from "@/domain"
import {
  DOMScrollByTouching,
  DOMGetWipedGhostContainer,
  DOMHorizontalScrollWhileDragging,
  DOMRemoveDraggingDestinationMarkers,
  DOMCheckContainer,
  DOMWrapGhost,
} from "@/domain/usecase/uiHandler/drag/common"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"

/** @category Handler */
const handler: Handler = {
  start: (_editor, draggable) => {
    if (!isDraggable(draggable)) return

    const dbTemplateBlockID = draggable.state.templateBlockID
    const dragging: Dragging = {
      type: draggable.type,
      dbTemplateBlockID,
      dbRecordBlockID: draggable.dbRecordBlockID,
      container: DOMGetDraggableContainer(dbTemplateBlockID),
      state: draggable.state,
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
    DOMHorizontalScrollWhileDragging(pointer.clientX)
    DOMScrollByTouching(pointer.clientY)
    return {
      destination,
      position: {
        left: pointer.clientX,
        top: pointer.clientY,
      },
    }
  },
  end: (_editor, dragging, dest) => {
    if (!isDragging(dragging) || !isDraggingDestination(dest)) return
    dragging.state.moveRecord(dragging.dbRecordBlockID, {
      labelID: dest.dbLabelID,
      prevRecordID: dest.dbPrevRecordBlockID,
      nextRecordID: dest.dbNextRecordBlockID,
    })
  },
}

/** @category Type */
export type Draggable = {
  type: NBDBDragType.DBBoardRecord;
  state: NBDBBoard;
  dbRecordBlockID: BlockID;
};

export type DraggableContainer = {
  blockID: BlockID;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type Dragging = {
  type: NBDBDragType.DBBoardRecord;
  blockHandleID?: undefined;
  dbRecordBlockID: BlockID;
  dbTemplateBlockID: BlockID;
  container: DraggableContainer;
  state: NBDBBoard;
};

export type DraggingDestination = {
  type: NBDBDragType.DBBoardRecord;
  dbLabelID: DBLabelID;
  dbPrevRecordBlockID?: BlockID;
  dbNextRecordBlockID?: BlockID;
};

export const isDraggable = (draggable: {
  type: string;
}): draggable is Draggable => draggable.type === NBDBDragType.DBBoardRecord
export const isDragging = (dragging: {type: string}): dragging is Dragging =>
  dragging.type === NBDBDragType.DBBoardRecord
export const isDraggingDestination = (draggingDestination: {
  type: string;
}): draggingDestination is DraggingDestination =>
  draggingDestination.type === NBDBDragType.DBBoardRecord

/** @category DOM */
const DOMGetDraggableContainer = (
  dbTemplateBlockID: BlockID
): DraggableContainer => {
  const domContainer = domDBTemplate(dbTemplateBlockID)
  const rect = domContainer.getBoundingClientRect()

  return {
    blockID: dbTemplateBlockID,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  }
}

const DOMSetDraggingGhost = (dragging: Dragging): void => {
  const ghostContainer = DOMGetWipedGhostContainer()
  const domTemplate = domDBTemplate(dragging.dbTemplateBlockID)
  const domRecord = domDBRecord(domTemplate, dragging.dbRecordBlockID)
  const ghost = DOMWrapGhost(
    ["nb-db-col", "nb-db-content"],
    domRecord.cloneNode(true)
  )

  const ghostBlock = document.createElement("div")
  ghostBlock.dataset.nbDbTemplate = BlockPropKey.DBBoard
  ghostBlock.contentEditable = "false"
  ghostBlock.appendChild(ghost)
  ghostContainer.appendChild(ghostBlock)
}

const DOMSetDestination = (
  clientX: number,
  clientY: number,
  container?: DraggableContainer
): DraggingDestination | null => {
  const target =
    window.document
      .elementFromPoint(
        clientX + 64, // 64 indicating left padding;
        clientY
      )
      ?.closest(".nb-db-record") ||
    // for gap(0.5rem) between records;
    window.document
      .elementFromPoint(
        clientX + 64, // 64 indicating left padding;
        clientY + 16
      )
      ?.closest(".nb-db-record")
  const parentTarget = target
    ? target.closest("[data-nb-db-col-id]")
    : window.document
      .elementFromPoint(
        clientX + 64, // 64 indicating left padding;
        clientY
      )
      ?.closest("[data-nb-db-col-id]")
  if (!parentTarget) return null
  if (!DOMCheckContainer(parentTarget, container)) return null

  DOMRemoveDraggingDestinationMarkers(window.document)
  const result: DraggingDestination = {
    type: NBDBDragType.DBBoardRecord,
    dbLabelID: setColumnDestination(parentTarget),
  }

  if (!target) {
    return result
  }

  const dbRecordBlockID = target.getAttribute("data-nb-prop-value") as BlockID
  let toPrev = false
  if (
    clientY <
    target!.getBoundingClientRect().top + target!.clientHeight / 2
  ) {
    toPrev = true
  }

  let dbPrevRecordBlockID: BlockID | undefined
  let dbNextRecordBlockID: BlockID | undefined

  if (toPrev) {
    dbNextRecordBlockID = dbRecordBlockID
    target.classList.add("nb-dragging-prev")
    const prev = target.previousElementSibling
    if (prev) {
      dbPrevRecordBlockID = prev.getAttribute("data-nb-prop-value") as BlockID
      prev.classList.add("nb-dragging-next")
    }
  } else {
    dbPrevRecordBlockID = dbRecordBlockID
    target.classList.add("nb-dragging-next")
    const next = target.nextElementSibling
    if (next) {
      dbNextRecordBlockID = next.getAttribute("data-nb-prop-value") as BlockID
      next.classList.add("nb-dragging-prev")
    }
  }

  return {
    ...result,
    dbPrevRecordBlockID,
    dbNextRecordBlockID,
  }
}

const setColumnDestination = (parentTarget: Element): DBLabelID => {
  const dbLabelID = parentTarget.getAttribute("data-nb-db-col-id") as DBLabelID
  parentTarget.classList.add("nb-dragging-at")

  return dbLabelID
}

export default handler
