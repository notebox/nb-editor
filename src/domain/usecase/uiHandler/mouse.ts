import type {BlockID} from "@/domain/entity"
import type {Editor} from "@/domain/usecase/editor"
import type {Area} from "@/domain/usecase/state/mouse"
import type {DragEventHandler} from "./drag"

export class MouseEventHandler {
  constructor(editor: Editor, drag: DragEventHandler) {
    this.editor = editor
    this.drag = drag
  }

  private editor: Editor
  private drag: DragEventHandler

  onMouseDown = async (event: MouseEvent) => {
    if (ignoreTarget(event)) return
    this.setRecoil({
      start: {
        x: event.pageX,
        y: event.pageY,
      },
    })
  }

  onMouseUp = async () => {
    this.drag.onDraggingEnd()
    this.setRecoil()
  }

  onMouseMove = async (event: MouseEvent) => {
    this.drag.onMouseMove(event)
    if (this.editor.state.drag.dragging) {
      this.setRecoil()
      return
    }
    const area = this.editor.state.mouse.area
    if (!area) return
    this.setRecoil(setPosition(area, {x: event.pageX, y: event.pageY}))
  }

  onMouseEnterToBlock = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    hoveringBlockID: BlockID
  ): Promise<void> => {
    if (this.editor.state.popup.isPresented) return
    event.preventDefault()
    this.editor.state.working.hover(hoveringBlockID)
  }

  onMouseLeaveFromBlock = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    hoveringBlockID: BlockID
  ): Promise<void> => {
    if (this.editor.state.popup.isPresented) return
    event.preventDefault()

    if (!this.editor.state.working.isWorkingBlock(hoveringBlockID)) return
    const parentBlockID = this.editor.dataManipulator.block(hoveringBlockID).parentBlockID
    this.editor.state.working.hover(parentBlockID)
  }

  private setRecoil(area?: Area) {
    this.editor.state.mouse.update(area)
  }
}

const ignoreTarget = (event: MouseEvent): boolean => {
  let el: HTMLElement | null = event.target as HTMLElement | null
  if (event.button > 1) return true

  while (el) {
    if (
      el.dataset.nbDomType === "text" ||
      el.dataset.nbDomType === "prop" ||
      el.classList.contains("nb-resizable-handle")
    ) {
      return true
    }
    el = el.parentElement
  }
  return false
}

const setPosition = (area: Area, end: {x: number; y: number}): Area => {
  let left: number
  let top: number
  let width: number
  let height: number

  if (area.start.x < end.x) {
    left = area.start.x
    width = end.x - area.start.x
  } else {
    left = end.x
    width = area.start.x - end.x
  }

  if (area.start.y < end.y) {
    top = area.start.y
    height = end.y - area.start.y
  } else {
    top = end.y
    height = area.start.y - end.y
  }

  return {
    start: area.start,
    end,
    position: {
      left,
      top,
      width,
      height,
    },
  }
}
