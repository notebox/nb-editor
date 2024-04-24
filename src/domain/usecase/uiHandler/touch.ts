import type {Editor} from "@/domain/usecase/editor"
import type {Draggable} from "@/domain/usecase/state/drag"
import type {DragEventHandler} from "./drag"

import React from "react"

export class TouchEventHandler {
  constructor(editor: Editor, drag: DragEventHandler) {
    this.editor = editor
    this.drag = drag
  }

  readonly drag: DragEventHandler

  private editor: Editor
  private longPressTrigger: LongPress | null = null

  onTouchStart = async (
    event: React.TouchEvent,
    draggable: Draggable,
    timeout = 1000
  ) => {
    const touch = event.touches[0]
    const clientX = touch.clientX
    const clientY = touch.clientY

    this.longPressTrigger = {
      draggable,
      clientX,
      clientY,
      timeout: setTimeout(() => {
        this.lockDocumentScroll(true)
        this.longPressTrigger = null
        this.editor.emitter.emitDraggingStartByTouch()
        this.drag.onTouchBlockDraggingStart(draggable, {
          left: clientX,
          top: clientY,
        })
      }, timeout) as any as number,
    }
  }

  onTouchEnd = async () => {
    this.lockDocumentScroll(false)

    if (this.longPressTrigger) {
      this.clearLongPressTrigger()
      return
    }

    this.drag.onDraggingEnd()
    this.editor.emitter.emitDraggingEndByTouch()
  }

  onTouchMove = async (event: TouchEvent) => {
    if (!this.checkLongPress(event)) return
    this.drag.onTouchMove(event)
  }

  private lockDocumentScroll(bool: boolean) {
    if (bool) {
      window.document.body.classList.add("lock-scrolling")
    } else {
      window.document.body.classList.remove("lock-scrolling")
    }
  }

  private checkLongPress(event: TouchEvent): boolean {
    if (!this.longPressTrigger) return true

    const {clientX, clientY} = this.longPressTrigger
    const touch = event.touches[0]
    const delta = 8
    const deltaX = touch.clientX - clientX
    const deltaY = touch.clientY - clientY

    if (
      deltaX > delta ||
      deltaX < -delta ||
      deltaY > delta ||
      deltaY < -delta
    ) {
      this.clearLongPressTrigger()
      return true
    }

    return false
  }

  private clearLongPressTrigger() {
    clearTimeout(this.longPressTrigger?.timeout)
    this.longPressTrigger = null
  }
}

type LongPress = {
  draggable: Draggable;
  clientX: number;
  clientY: number;
  timeout: number;
};
