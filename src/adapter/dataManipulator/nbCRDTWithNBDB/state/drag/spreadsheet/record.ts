import type {BlockID} from "@/domain"
import type {Handler} from "@/domain/usecase/state/drag"

import {BlockType, domDBTemplate, domDBRecord} from "@/domain"
import {
  getDraggingBlockIDs,
  DOMScrollByTouching,
  DOMGetWipedGhostContainer,
  DOMRemoveDraggingDestinationMarkers,
  DOMCheckContainer,
} from "@/domain/usecase/uiHandler/drag/common"
import {NBDBDragType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state/drag"

/** @category Handler */
const handler: Handler = {
  start: (editor, draggable) => {
    if (!isDraggable(draggable)) return

    const [draggingBlockIDs] = getDraggingBlockIDs(editor, draggable.blockID)
    const dragging = {
      blockHandleID: draggable.blockID,
      type: draggable.type,
      draggingBlockIDs,
      spreadsheetBlockID: draggable.spreadsheetBlockID,
      container: DOMGetDraggableContainer(draggable),
    }
    DOMSetDraggingGhost(dragging)

    return dragging
  },
  move: (editor, pointer, dragging) => {
    if (!isDragging(dragging)) return
    const destination = DOMSetDestination(
      pointer.clientX,
      pointer.clientY,
      dragging.container
    )
    DOMScrollByTouching(pointer.clientY)
    return {
      destination,
      position: {
        left: dragging.container.left,
        top: pointer.clientY,
      },
    }
  },
  end: (editor, dragging, dest) => {
    if (!isDragging(dragging) || !isDraggingDestination(dest)) return
    editor?.moveBlocks(dragging.draggingBlockIDs, dest)
  },
}

/** @category Type */
export type Draggable = {
  type: NBDBDragType.DBSpreadsheetRecord;
  blockID: BlockID;
  spreadsheetBlockID: BlockID;
};

export type DraggableContainer = {
  blockID: BlockID;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type Dragging = {
  blockHandleID: BlockID;
  type: NBDBDragType.DBSpreadsheetRecord;
  container: DraggableContainer;
  draggingBlockIDs: BlockID[];
  spreadsheetBlockID: BlockID;
};

export type DraggingDestination = {
  type: NBDBDragType.DBSpreadsheetRecord;
  blockID: BlockID;
  toPrev: boolean;
};

export const isDraggable = (draggable: {
  type: string;
}): draggable is Draggable => draggable.type === NBDBDragType.DBSpreadsheetRecord
export const isDragging = (dragging: {type: string}): dragging is Dragging =>
  dragging.type === NBDBDragType.DBSpreadsheetRecord
export const isDraggingDestination = (draggingDestination: {
  type: string;
}): draggingDestination is DraggingDestination =>
  draggingDestination.type === NBDBDragType.DBSpreadsheetRecord

/** @category DOM */
const DOMGetDraggableContainer = (draggable: Draggable): DraggableContainer => {
  const domContainer = domDBTemplate(draggable.spreadsheetBlockID)
  const rect =
    domContainer.querySelector(".nb-db-table")?.getBoundingClientRect() ??
    domContainer.getBoundingClientRect()

  return {
    blockID: draggable.spreadsheetBlockID,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  }
}

const DOMSetDraggingGhost = (dragging: Dragging): void => {
  const ghostContainer = DOMGetWipedGhostContainer()

  const domSpreadsheet = domDBTemplate(dragging.spreadsheetBlockID)
  const ghostSpreadsheet = domSpreadsheet.cloneNode(false) as HTMLElement
  ghostSpreadsheet.style.width = `${domSpreadsheet.clientWidth}px`
  ghostSpreadsheet.style.overflowX = "hidden"

  const domTable = domSpreadsheet.querySelector("table")
  if (!domTable) return

  const ghostTable = domTable.cloneNode(false) as HTMLElement
  ghostSpreadsheet.appendChild(ghostTable)
  ghostTable.style.tableLayout = "fixed"
  ghostTable.style.width = `${domTable.clientWidth}px`
  const ghostDBRecords = domSpreadsheet
    .querySelector(".nb-db-records")!
    .cloneNode(false) as HTMLElement
  ghostTable.appendChild(ghostDBRecords)

  dragging.draggingBlockIDs.forEach(blockID => {
    const el = domDBRecord(domSpreadsheet, blockID)
    const ghostDBRecord = el.cloneNode(false) as HTMLElement
    for (let i = 0; i < el.children.length; i++) {
      const domField = el.children[i]
      const ghostField = domField.cloneNode(true) as HTMLElement
      if (i) {
        ghostField.style.width = `${domField.clientWidth - 18}px`
      } else {
        ghostField.style.width = `${domField.clientWidth}px`
      }
      ghostDBRecord.appendChild(ghostField)
    }
    ghostDBRecords.appendChild(ghostDBRecord)
  })

  const ghostBlock = document.createElement("div")
  ghostBlock.dataset.nbBlockType = BlockType.Database
  ghostBlock.classList.add("nb-no-editable")
  ghostBlock.appendChild(ghostSpreadsheet)
  ghostContainer.appendChild(ghostBlock)
}

const DOMSetDestination = (
  clientX: number,
  clientY: number,
  container?: DraggableContainer
): DraggingDestination | null => {
  const target = window.document
    .elementFromPoint(
      clientX + 64, // 64 indicating left padding;
      clientY
    )
    ?.closest(".nb-db-record")
  if (!target) return null
  if (!DOMCheckContainer(target, container)) return null

  const blockID = target.getAttribute("data-nb-prop-value") as BlockID
  let toPrev = false
  if (
    clientY <
    target!.getBoundingClientRect().top + target!.clientHeight / 2
  ) {
    toPrev = true
  }
  const flag = toPrev ? "nb-dragging-prev" : "nb-dragging-next"
  DOMRemoveDraggingDestinationMarkers(window.document)
  target.classList.add(flag)
  return {type: NBDBDragType.DBSpreadsheetRecord, blockID, toPrev}
}

export default handler
