import type {EditorEmitter} from "@/domain/usecase/emitter"
import type {CustomDragHandlers} from "./drag"
import type {CustomKeymapHandler} from "./keymap"
import type {ReadOnlyOptions} from "../state"
import type {PopupWithStyle} from "../state/popup"

import {Editor} from "../editor"
import {State} from "../state"
import {useIsomorphicLayoutEffect} from "@/utils/react"
import {ExternalEventHandler} from "./external"
import {TextingEventHandler} from "./texting"
import {DragEventHandler} from "./drag"
import {MouseEventHandler} from "./mouse"
import {TouchEventHandler} from "./touch"
import {keymapHandlers} from "./keymap"
import {ClipboardEventHandler} from "./clipboard"

export class UIHandler {
  constructor(cfg: ContextConfig) {
    const state = new State()
    const editor = new Editor(cfg.emitter, state)

    this.editor = editor
    this.state = state
    this.external = new ExternalEventHandler(editor)
    this.texting = new TextingEventHandler(editor)
    this.drag = new DragEventHandler(editor, cfg.customDrags)
    this.mouse = new MouseEventHandler(editor, this.drag)
    this.touch = new TouchEventHandler(editor, this.drag)
    this.clipboard = new ClipboardEventHandler(editor)
    this.customPopupHandler = cfg.customPopups

    this.keymapHandlers = [...keymapHandlers]
    if (cfg.customKeymap) this.keymapHandlers.splice(1, 0, cfg.customKeymap)
    if (cfg.emitter.keymap) this.keymapHandlers.push(cfg.emitter.keymap)
  }

  initialize(_data: unknown, _readOnly: ReadOnlyOptions | false = false) {
    throw new Error("method not implemented")
  }

  readonly state: State
  readonly editor: Editor
  readonly external: ExternalEventHandler
  readonly texting: TextingEventHandler
  readonly drag: DragEventHandler
  readonly mouse: MouseEventHandler
  readonly touch: TouchEventHandler
  readonly clipboard: ClipboardEventHandler

  readonly customPopupHandler?: CustomPopupHandler

  private keymapHandlers: CustomKeymapHandler[]

  addWindowEventListeners() {
    useIsomorphicLayoutEffect(() => {
      if (!this.editor.loaded) return

      window.document.addEventListener("touchmove", this.touch.onTouchMove, {passive: false})
      window.document.addEventListener("touchend", this.touch.onTouchEnd)
    
      window.document.addEventListener("mousedown", this.mouse.onMouseDown)
      window.document.addEventListener("mousemove", this.mouse.onMouseMove)
      window.document.addEventListener("mouseup", this.mouse.onMouseUp)
      window.document.addEventListener("mouseout", this.drag.onDraggingCancel)

      return () => {
        window.document.removeEventListener("touchmove", this.touch.onTouchMove)
        window.document.removeEventListener("touchend", this.touch.onTouchEnd)
    
        window.document.removeEventListener("mousedown", this.mouse.onMouseDown)
        window.document.removeEventListener("mousemove", this.mouse.onMouseMove)
        window.document.removeEventListener("mouseup", this.mouse.onMouseUp)
        window.document.removeEventListener("mouseout", this.drag.onDraggingCancel)
      }
    }, [this.editor.loaded])
  }

  addWritableEditorEventListeners = (ref: React.RefObject<HTMLDivElement>) => {
    useIsomorphicLayoutEffect(() => {
      if (!ref.current) return

      const el = ref.current
      this.editor.selector.target = el
      el.addEventListener("compositionstart", this.texting.onDOMCompositionStart)
      el.addEventListener("compositionupdate", this.texting.onDOMCompositionUpdate)
      el.addEventListener("compositionend", this.texting.onDOMCompositionEnd)
      el.addEventListener("textInput", this.texting.onDOMTextInput)
      el.addEventListener("beforeinput", this.texting.onDOMBeforeInput)
      el.addEventListener("focus", this.editor.selector.onWindowFocus)
  
      window.document.addEventListener("selectionchange", this.editor.selector.onDOMSelectionChange)
      window.document.addEventListener("keydown", this.onDOMKeyDown)

      return () => {
        el.removeEventListener("compositionstart", this.texting.onDOMCompositionStart)
        el.removeEventListener("compositionupdate", this.texting.onDOMCompositionUpdate)
        el.removeEventListener("compositionend", this.texting.onDOMCompositionEnd)
        el.removeEventListener("textInput", this.texting.onDOMTextInput)
        el.removeEventListener("beforeinput", this.texting.onDOMBeforeInput)
        el.removeEventListener("focus", this.editor.selector.onWindowFocus)
  
        window.document.removeEventListener("selectionchange", this.editor.selector.onDOMSelectionChange)
        window.document.removeEventListener("keydown", this.onDOMKeyDown)
      }
    }, [ref, this.editor.state.readOnly])
  }

  private onDOMKeyDown = (event: KeyboardEvent) => {
    if (this.state.readOnly) return
    if (this.state.popup.isPresented) return

    for (const subHandler of this.keymapHandlers) {
      if (subHandler(this, event)) return true
    }
    return false
  }
}

export type CustomPopupHandler = (ctx: UIHandler, popup: PopupWithStyle<any>) => JSX.Element | null
export type ContextConfig = {
  emitter: EditorEmitter;
  customDrags?: CustomDragHandlers;
  customPopups?: CustomPopupHandler;
  customKeymap?: CustomKeymapHandler;
}