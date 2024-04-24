import type {BlockID, Editor} from "@/domain"
import type {Handler} from "@/domain/usecase/state/drag"

import {domBlock} from "@/domain/usecase/dom"
import {DragTypeBlockHandle} from "@/domain/usecase/state/drag"
import {
  getDraggingBlockIDs,
  DOMScrollByTouching,
  DOMGetWipedGhostContainer,
  DOMRemoveDraggingDestinationMarkers,
} from "./common"

/** @category Handler */
const handler: Handler = {
  start: (editor, draggable) => {
    if (!isDraggable(draggable)) return
    const [draggingBlockIDs, draggingParentBlockIDs] = getDraggingBlockIDs(
      editor,
      draggable.blockID,
    )
    const dragging = {
      blockHandleID: draggable.blockID,
      type: draggable.type,
      draggingBlockIDs,
      draggingParentBlockIDs,
    }
    DOMSetDraggingGhost(dragging)

    return dragging
  },
  move: (editor, pointer) => {
    const destination = DOMSetBlockDestination(
      editor,
      pointer.clientX,
      pointer.clientY
    )
    DOMScrollByTouching(pointer.clientY)
    return {
      destination,
      position: {
        left: pointer.clientX,
        top: pointer.clientY,
      },
    }
  },
  end: (editor, dragging, dest) => {
    if (!isDragging(dragging) || !isDraggingDestination(dest)) return
    editor.moveBlocks(dragging.draggingParentBlockIDs, dest)
  },
}

/** @category Type */
export type Draggable = {
  type: typeof DragTypeBlockHandle;
  blockID: BlockID;
};

export type Dragging = {
  blockHandleID: BlockID;
  type: typeof DragTypeBlockHandle;
  container?: undefined;
  draggingBlockIDs: BlockID[];
  draggingParentBlockIDs: BlockID[];
};

export type DraggingDestination = {
  type: typeof DragTypeBlockHandle;
  blockID: BlockID;
  toPrev: boolean;
};

export const isDraggable = (draggable: {
  type: string;
}): draggable is Draggable => draggable.type === DragTypeBlockHandle
export const isDragging = (dragging: {type: string}): dragging is Dragging =>
  dragging.type === DragTypeBlockHandle
export const isDraggingDestination = (draggingDestination: {
  type: string;
}): draggingDestination is DraggingDestination =>
  draggingDestination.type === DragTypeBlockHandle

/** @category DOM */
const DOMSetDraggingGhost = (dragging: Dragging): void => {
  const ghostContainer = DOMGetWipedGhostContainer()

  let height = 0
  let width = 0

  dragging.draggingParentBlockIDs.forEach(blockID => {
    const el = domBlock(blockID)
    const ghost = el.cloneNode(true) as HTMLElement
    ghostContainer.appendChild(ghost)

    height += el.clientHeight
    if (el.clientWidth > width) {
      width = el.clientWidth
    }
  })

  ghostContainer.setAttribute(
    "style",
    `width: ${width}px; height: ${height}px;`
  )
}

const DOMSetBlockDestination = (
  editor: Editor,
  clientX: number,
  clientY: number
): DraggingDestination | null => {
  let target = window.document
    .elementFromPoint(clientX, clientY)
    ?.closest("[data-nb-dom-type=\"block\"]")
  if (!target) return null

  let blockID = target.getAttribute("data-nb-block") as BlockID

  let toPrev = true
  let flag = "nb-dragging-prev"
  if (clientY > target.getBoundingClientRect().top + target.clientHeight / 2) {
    const next = editor.dataManipulator.nextSiblingBlock(blockID)
    if (next) {
      target = domBlock(next.blockID)
      blockID = next.blockID
    } else {
      toPrev = false
      flag = "nb-dragging-next"
    }
  }

  DOMRemoveDraggingDestinationMarkers(window.document)
  target.classList.add(flag)
  return {type: DragTypeBlockHandle, blockID, toPrev}
}

export default handler
