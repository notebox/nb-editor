import type {BlockID} from "@/domain/entity"
import type {Editor} from "@/domain/usecase"
import type {PointerPosition} from "@/domain/usecase/state/drag"

import {IS_IOS} from "@/utils/environment"

import blockHandler from "./block"
import {
  DOMRemoveDraggingDestinationMarkers,
  DOMGetWipedGhostContainer,
  clearAutoScroll,
} from "./common"

export class DragEventHandler {
  constructor(editor: Editor, customDrags?: CustomDragHandlers) {
    this.editor = editor
    this.handler = {BLOCK: blockHandler, ...customDrags}
  }

  private editor: Editor
  private draggingDestination?: DraggingDestination
  private draggingPosition?: Position
  private draggingStyle?: React.CSSProperties
  private handler: CustomDragHandlers

  /** @category event handler */
  onBlockDraggingStart = async (
    draggable: Draggable,
    position: Position
  ): Promise<void> => {
    this.editor.state.drag.dragging = this.handler[draggable.type].start(this.editor, draggable)
    if (!this.editor.state.drag.dragging) {
      this.onDraggingEnd()
      return
    }
    this.draggingPosition = {
      ...position,
      top: position.top - getVerticalTouchAdjustmentOnIOS(),
    }

    this.editor.selector.deselect()
    if (!IS_IOS) {
      this.editor.selector.blur()
    }
    this.setRecoil()
  }

  onTouchBlockDraggingStart = async (
    dragging: Draggable,
    position: Position
  ) => {
    this.onBlockDraggingStart(
      dragging, {
        ...position,
        top: position.top - getVerticalTouchAdjustmentOnIOS(),
      })
  }

  onDraggingEnd = async () => {
    clearAutoScroll()
    if (!this.editor.state.drag.dragging || !this.draggingDestination) return
    this.handler[this.editor.state.drag.dragging.type].end(this.editor, this.editor.state.drag.dragging, this.draggingDestination)
    this.endDragging()
  }

  onMouseMove = async (event: MouseEvent): Promise<void> => {
    clearAutoScroll()
    if (!this.editor.state.drag.dragging) return

    const moved = this.handler[this.editor.state.drag.dragging.type].move?.(
      this.editor,
      {
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
      },
      this.editor.state.drag.dragging
    )

    this.updateGhost(moved, 0)
  }

  onTouchMove = async (event: TouchEvent): Promise<void> => {
    clearAutoScroll()
    if (!this.editor.state.drag.dragging) return

    event.preventDefault()
    event.stopPropagation()
    const touches = event.touches
    const {clientX, clientY, pageX, pageY} = touches[0]

    if (!window.document.scrollingElement?.scrollTop) {
      window.document.scrollingElement?.scrollTo({top: 1})
    }
    const moved = this.handler[this.editor.state.drag.dragging.type].move?.(
      this.editor,
      {
        clientX,
        clientY,
        pageX,
        pageY,
      },
      this.editor.state.drag.dragging
    )

    this.updateGhost(moved, getVerticalTouchAdjustmentOnIOS())
  }

  onDraggingCancel = async (event: MouseEvent): Promise<void> => {
    clearAutoScroll()
    if (
      this.editor.state.drag.dragging &&
      (event.relatedTarget as HTMLElement).tagName === "HTML"
    ) {
      this.endDragging()
    }
  }

  /** @category private */
  private endDragging(): void {
    delete this.editor.state.drag.dragging
    delete this.draggingDestination
    delete this.draggingPosition
    delete this.draggingStyle
    DOMRemoveDraggingDestinationMarkers(window.document)
    DOMGetWipedGhostContainer()
    this.setRecoil()
  }

  private updateGhost(
    moved: DraggingMoved | undefined,
    verticalAdjustment: number
  ): void {
    if (!moved) return
    if (moved.destination) {
      this.draggingDestination = moved.destination
    }

    this.draggingStyle = moved.style
    this.draggingPosition = {
      left: moved.position.left,
      top: moved.position.top - verticalAdjustment,
    }
    this.setRecoil()
  }

  private setRecoil() {
    this.editor.state.drag.update(this.draggingPosition, this.draggingStyle)
  }
}

const getVerticalTouchAdjustmentOnIOS = (): number => {
  return document.querySelector(".nb-ui-layer")?.getClientRects()[0]?.y ?? 0
}

export type CustomDragHandlers = {
  [type: string]: Handler
};

export type Handler = {
  start: (editor: Editor, draggable: Draggable) => Dragging | undefined;
  move: (
    editor: Editor,
    pointer: PointerPosition,
    dragging: Dragging
  ) => DraggingMoved | undefined;
  end: (editor: Editor, dragging: Dragging, destination: DraggingDestination) => void;
};

/** @category payload */
export type Draggable = {type: string};
export type Dragging = {type: string; container?: DraggableContainer};
export type DraggingDestination = {type: string};

export type DraggingMoved = {
  destination: DraggingDestination | null;
  position: Position;
  style?: React.CSSProperties;
};

/** @category ui */
export type DraggableContainer = {
  blockID?: BlockID;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** @category recoil */
export type DragState = {
  isDragging: boolean;
  position?: Position;
  style?: React.CSSProperties;
};

export type Position = {
  left: number;
  top: number;
};
