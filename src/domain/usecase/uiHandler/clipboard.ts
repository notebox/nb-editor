import type {Editor} from "@/domain/usecase"

import {domType} from "@/domain/usecase/dom"
import {IS_SAFARI} from "@/utils/environment"
import {hasNoteLevelDOM} from "./common"

export class ClipboardEventHandler {
  private editor: Editor

  constructor(editor: Editor) {
    this.editor = editor
  }

  onCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (!hasNoteLevelDOM(this.editor.rootBlockID, event.target)) return

    event.preventDefault()
    const operator = this.editor.newOperator()
    operator.setSelectionToDataTransfer(event.clipboardData)

    return
  }

  onCut = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (!hasNoteLevelDOM(this.editor.rootBlockID, event.target)) return

    event.preventDefault()
    const operator = this.editor.newOperator()
    operator.setSelectionToDataTransfer(event.clipboardData)
    operator.deleteSelection()
    this.editor.commit(operator)

    return
  }

  onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (this.editor.state.readOnly || !hasNoteLevelDOM(this.editor.rootBlockID, event.target))
      return

    event.preventDefault()
    const operator = this.editor.newOperator()
    operator.insertFromClipboard(event.clipboardData)
    this.editor.commit(operator)
  }

  onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (domType(this.editor.rootBlockID, event.target)) {
      const operator = this.editor.newOperator()
      operator.setSelectionToDataTransfer(event.dataTransfer)
      this.editor.commit(operator)
    }
  }

  onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!this.editor.state.readOnly && domType(this.editor.rootBlockID, event.target)) {
      /**
       * @compat Certain browsers don't fire `beforeinput` events at all, and
       * Chromium browsers don't properly fire them for files being
       * dropped into a `contenteditable`. (2019/11/26)
       * https://bugs.chromium.org/p/chromium/issues/detail?id=1028668
       */
      if (!IS_SAFARI && event.dataTransfer.files.length > 0) {
        event.preventDefault()
        event.persist()
        const data = event.dataTransfer

        if (!data) return

        const operator = this.editor.newOperator()
        // operator.select(new NBRange({blockID}));
        operator.insertFromClipboard(data)
        this.editor.commit(operator)
      }
    }
  }
}
