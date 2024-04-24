import type {
  TextProps,
  TextPropKey,
  TextPropsDelta,
  BlockType,
} from "@/domain/entity"
import type {State} from "@/domain/usecase/state"
import type {DataManipulator} from "@/domain/usecase/dataManipulator"

import {NBRange, NBPoint} from "@/domain/entity"
import {
  DOMElement,
  domBlock,
  domFocus,
  domToNBRange,
  domType,
  domBlur,
  domDeselect,
  domScrollToSelection,
} from "@/domain/usecase/dom"
import {IS_FIREFOX} from "@/utils/environment"
import {polyfill} from "@/utils/smooth-scroll"
import {EditorEmitter} from "../emitter"

polyfill(32)
export class Selector {
  readonly state: State
  readonly dataManipulator: DataManipulator
  readonly emitter: EditorEmitter

  isUpdatingSelection: boolean
  latestElement: DOMElement | null

  isFocused: boolean
  textProps: TextProps = {}
  target?: HTMLElement | null

  private _selection: NBRange | null
  private _lastSelection: NBRange | null

  constructor(state: State, dataManipulator: DataManipulator, emitter: EditorEmitter) {
    this.state = state
    this.dataManipulator = dataManipulator
    this.emitter = emitter

    this.isFocused = false
    this.isUpdatingSelection = false
    this.latestElement = null
    this._selection = null
    this._lastSelection = null
  }

  get selection(): NBRange | null {
    return this._selection
  }

  set selection(range: NBRange | null) {
    this._selection = range
    this.state.working.select(range)
  }

  focus(fromDOM = false): void {
    this.isFocused = true
    if (!fromDOM) {
      domFocus(domBlock(this.dataManipulator.rootBlock().blockID))
    } else if (!this.selection) {
      const selection = window.getSelection()
      if (selection?.rangeCount) {
        this.selection = domToNBRange(selection.getRangeAt(0))
        this.selection?.flagFromDom(fromDOM)
      }
    }
  }

  blur(fromDOM = false): void {
    this.isFocused = false
    this.select(null)
    if (!fromDOM) domBlur()
  }

  deselect(): void {
    this.select(null)
    domDeselect()
  }

  select(range: NBRange | null): void {
    if (range && !this.isFocused) {
      this.isFocused = true
    }

    if (this.selection && range?.equals(this.selection)) return
    this.selection = range
  }

  updateInlineProps(
    key: TextPropKey,
    value: TextPropsDelta[TextPropKey] = null
  ) {
    if (value) {
      if (this.textProps[key] === value) return
      this.textProps = {...this.textProps, [key]: value}
    } else {
      if (!this.textProps[key]) return
      delete this.textProps[key]
    }
    this._lastSelection = this._selection
    this.emit()
  }

  async report() {
    this.setTextProps()
    this.onSelectionChanged()
    this.emit()
  }

  onSelectionChanged = async () => {
    const range = this.selection
    this.state.selection.setSelectionChanged(range, range ? this.dataManipulator.selectedBlocks(
      range.start.blockID,
      range.end.blockID
    ) : [])
    if (this.state.selection.hasSelectedBlocks) {
      window.addEventListener("resize", this.onSelectionChanged)
    } else {
      window.removeEventListener("resize", this.onSelectionChanged)
    }
  }

  /** @category event handler */
  onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      this.state.readOnly ||
      this.isUpdatingSelection ||
      !domType(this.dataManipulator.rootBlock().blockID, event.target)
    ) {
      return
    }

    /**
     * @compat If the current `activeElement` is still the previous
     * one, this is due to the window being blurred when the tab
     * itself becomes unfocused, so we want to abort early to allow to
     * editor to stay focused when the tab becomes focused again.
     */
    if (this.latestElement === window.document.activeElement) {
      return
    }

    const {relatedTarget} = event
    const el = domBlock(this.dataManipulator.rootBlock().blockID)

    /**
     * @compat The event should be ignored if the focus is returning
     * to the editor from an embedded editable element (eg. an <input>
     * element inside a void node).
     */
    if (relatedTarget === el) {
      return
    }

    /**
     * @compat The event should be ignored if the focus is moving to a
     * non- editable section of an element that isn't a void node (eg.
     * a list item of the check list example).
     */
    if (domType(this.dataManipulator.rootBlock().blockID, relatedTarget) !== "text") return

    this.blur(true)
  }

  onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      !this.state.readOnly &&
      !this.isUpdatingSelection &&
      domType(this.dataManipulator.rootBlock().blockID, event.target)
    ) {
      const el = domBlock(this.dataManipulator.rootBlock().blockID)
      this.latestElement = window.document.activeElement

      /**
       * @compat If the editor has nested editable elements, the focus
       * can go to them. In Firefox, this must be prevented because it
       * results in issues with keyboard navigation. (2017/03/30)
       */
      if (IS_FIREFOX && event.target !== el) {
        el.focus()
        return
      }

      if (!this.isFocused) {
        this.focus(true)
        /** @purpose safari auto scrolling after keyboard up */
        setTimeout(() => {
          if (this.selection && this.selection.start.offset != null) {
            this.scrollToSelection()
          }
        }, 100)
      }
    }
  }

  onWindowFocus = () => {
    this.focus(true)
    setTimeout(() => {
      this.scrollToSelection()
    }, 100)
  }

  onDOMSelectionChange = () => {
    if (this.state.drag.dragging) return

    const domSelection = window.getSelection()
    if (domSelection && !this.target?.contains(domSelection.anchorNode)) return

    if (
      this.state.readOnly ||
      this.state.working.composing ||
      this.isUpdatingSelection
    ) {
      return
    }

    if (!domSelection) {
      this.select(null)
      return
    }

    const {activeElement} = window.document
    const el = domBlock(this.dataManipulator.rootBlock().blockID).closest(
      "[data-nb-dom-type=\"editor\"]"
    )

    if (activeElement === el) {
      this.latestElement = activeElement
      this.focus(true)
    } else if (activeElement?.getAttribute("data-nb-dom-type") !== "text") {
      this.isFocused = false
    }

    const {anchorNode, focusNode} = domSelection
    const anchorNodeSelectable = !!domType(this.dataManipulator.rootBlock().blockID, anchorNode)
    const focusNodeSelectable = !!domType(this.dataManipulator.rootBlock().blockID, focusNode)
    const domRange = domSelection.rangeCount > 0 && domSelection.getRangeAt(0)

    if (domRange && anchorNodeSelectable && focusNodeSelectable) {
      let range = domToNBRange(domRange)

      /**
       * @purpose cut boundary
       * @todo remove
       */
      if (range?.hasBoundary) {
        if (
          (range.start.isInsideBoundary &&
            domRange.startContainer === domSelection.anchorNode) ||
          (range.end.isInsideBoundary &&
            domRange.endContainer === domSelection.anchorNode)
        ) {
          const cutRange = this.cutBoundary(range)!
          cutRange.flagFromDom(true)
          this.select(cutRange)
          this.state.reRender()
          return
        }
      }

      /**
       * @purpose double clicking at the end of text-block
       * selects the end of the clicked block and the start of the next block
       * but it does not appear on DOM.
       * so make it collapsed.
       *
       * @issue not work with collapsed mermaid block
       */
      if (
        range &&
        !range.isCollapsed &&
        range.end.offset === 0 &&
        this.dataManipulator.nextTextBlock(range.start.blockID)?.blockID ===
          range.end.blockID &&
        this.dataManipulator.block(range.start.blockID).text?.length() ===
          range.start.offset
      ) {
        range = new NBRange(range.start)
      }
      range?.flagFromDom(true)
      this.select(range)
    } else {
      this.select(null)
    }

    this.state.reRender()
  }

  setTextProps() {
    if (
      this._lastSelection &&
      this._selection &&
      this._lastSelection.equals(this._selection)
    )
      return

    this.textProps = this.dataManipulator.getTextProps(this.selection) ?? {}
    this._lastSelection = this._selection
  }

  scrollToSelection(smooth = true): void {
    if (this.state.drag.dragging || !this.selection || this.selection.fromDOM)
      return
    domScrollToSelection(smooth)
  }

  /** @category private */
  private cutBoundary(range: NBRange): NBRange | null {
    if (range.start.isInsideBoundary) {
      return cutBoundary(this.dataManipulator, range.start, false)
    } else if (range.end.isInsideBoundary) {
      return cutBoundary(this.dataManipulator, range.end, true)
    }
    return null
  }

  private emit() {
    const range = this.selection || undefined
    this.emitter.emitSelected({
      blockType:
        range &&
        (this.dataManipulator.block(range.start.blockID).type as BlockType),
      range,
      history: this.dataManipulator.getHistoryProps(),
      indentation: this.dataManipulator.getIndentationProps(range),
      textProps: this.textProps,
    })
  }
}

const cutBoundary = (dataManipulator: DataManipulator, point: NBPoint, isEnd: boolean): NBRange => {
  if (point.offset == null) {
    return new NBRange(point)
  } else if (isEnd) {
    return new NBRange(
      new NBPoint({
        blockID: point.blockID,
        subPath: point.subPath,
        offset: 0,
      }),
      point
    )
  } else {
    return new NBRange(
      point,
      new NBPoint({
        blockID: point.blockID,
        subPath: point.subPath,
        offset: dataManipulator.getAvailableOffset(point.blockID, point.subPath),
      })
    )
  }
}