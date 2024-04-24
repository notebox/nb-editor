import type {Editor} from "../../editor"

import {ModifyTextAtResult} from "@/domain/usecase/dataManipulator"
import {hasNoteLevelDOM} from "../common"
import {onDOMBeforeInput} from "./onDOMBeforeInput"

export class TextingEventHandler {
  constructor(editor: Editor) {
    this.editor = editor
  }

  private editor: Editor

  /** @category texting */
  onDOMTextInput = (event: any) => {
    if (!this.editor.state.readOnly && event.data) {
      /** @improve iPad Scribble */
      this.editor.state.working.iPadScribble = event.data
    }
  }

  onDOMCompositionStart = (event: CompositionEvent) => {
    if (!hasNoteLevelDOM(this.editor.rootBlockID, event.target)) return

    const selection = this.editor.selector.selection!

    /** @purpose to prevent composition bug on multi-blocks */
    const domSelection = window.getSelection()
    if (
      domSelection &&
      domSelection.rangeCount &&
      selection.start.blockID !== selection.end.blockID
    ) {
      const range = domSelection.getRangeAt(0)
      domSelection.setBaseAndExtent(
        range.startContainer,
        range.startOffset,
        range.startContainer,
        range.startOffset
      )
    }

    this.editor.state.working.composing = {
      blockID: selection.start.blockID,
      subPath: selection.start.subPath,
      start: selection.start.offset!,
      end: null,
    }

    if (!selection.isCollapsed) {
      this.editor.state.working.composing.end = this.editor.state.working.composing.start
      this.deleteSelectionIfHasRange()
    }
  }

  onDOMCompositionEnd = (event: CompositionEvent) => {
    if (!hasNoteLevelDOM(this.editor.rootBlockID, event.target)) return
    this.editor.state.working.composing = null
    this.editor.state.reRender()
  }

  onDOMCompositionUpdate = (event: CompositionEvent) => {
    if (!this.editor.state.working.composing || !hasNoteLevelDOM(this.editor.rootBlockID, event.target)) return

    const {blockID, subPath, start: index, end} = this.editor.state.working.composing
    const data = event.data!
    this.editor.state.working.composing.end = index + data.length

    const operator = this.editor.newOperator()
    if (end !== null && index !== end) {
      // block-prop
      if (subPath) {
        operator.modifyTextAt({
          blockID,
          subPath,
          index,
          to: data,
        })
        return
      }

      // block-text
      switch (operator.modifyTextAt({blockID, startIDX: index, endIDX: end, to: data})) {
      case ModifyTextAtResult.Invalid:
        break
      default:
        this.editor.commit(operator)
        return
      }
    }
    operator.insertTextAt({
      blockID,
      subPath,
      index,
      text: data,
    })
    this.editor.commit(operator)
    this.editor.state.working.setSpaceByComposition(data)
  }

  onDOMBeforeInput = (event: InputEvent) => {
    onDOMBeforeInput(this.editor, event)
  }

  private deleteSelectionIfHasRange() {
    if (this.editor.selector.selection?.isCollapsed !== false) return

    const operator = this.editor.newOperator()
    operator.deleteSelection()
    this.editor.commit(operator)
  }
}