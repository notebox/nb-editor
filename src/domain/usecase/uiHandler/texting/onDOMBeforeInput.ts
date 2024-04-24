import type {Editor, Operator} from "@/domain/usecase"

import {Unit, NBPoint, NBRange, TextPropKey} from "@/domain/entity"
import {ModifyTextAtResult} from "@/domain/usecase/dataManipulator"
import {domToNBRange} from "@/domain/usecase/dom"
import {hasNoteLevelDOM} from "../common"

export const onDOMBeforeInput = (editor: Editor, event: InputEvent) => {
  if (editor.state.readOnly || !hasNoteLevelDOM(editor.rootBlockID, event.target)) return

  let {selection} = editor.selector
  let {inputType: type} = event
  let data = event.dataTransfer || event.data || undefined

  // handle iPadScribble rare cases;
  if (!type && !data && editor.state.working.iPadScribble) {
    type = "insertText"
    data = editor.state.working.iPadScribble
    editor.state.working.iPadScribble = null
  }

  /**
   * @verbose insertCompositionText and deleteCompositionText can't be cancelled
   */
  if (
    type === "insertCompositionText" ||
    type === "deleteCompositionText" ||
    type === "deleteByComposition" ||
    type === "insertFromComposition"
  ) {
    return
  }

  const operator = editor.newOperator()

  /**
   * @compat For the deleting forward/backward input types we don't want
   * to change the selection because it is the range that will be deleted,
   * and those commands determine that for themselves.
   */
  if (!type.startsWith("delete") || type.startsWith("deleteBy")) {
    const [targetRange] = event.getTargetRanges()
    if (targetRange) {
      const range = domToNBRange(targetRange)
      if (!selection || (range && !selection.equals(range))) {
        operator.select(range)
        selection = range
      }
    }
  }

  if (
    type === "insertReplacementText" &&
    selection &&
    selection.start.blockID === selection.end.blockID &&
    !selection.isCollapsed
  ) {
    const to = event.dataTransfer?.getData("text/html") || ""
    const blockID = selection.start.blockID
    const startIDX: number = selection.start.offset!
    const endIDX: number = selection.end.offset!

    // block-prop
    if (selection.start.subPath) {
      operator.modifyTextAt({
        blockID,
        subPath: selection.start.subPath,
        index: startIDX,
        to,
      })
      editor.commit(operator)
      editor.selector.select(new NBRange(selection.end))
      return
    }

    // block-text
    const result = operator.modifyTextAt({blockID, startIDX, endIDX, to})
    switch (result) {
    case ModifyTextAtResult.Modified: {
      operator.select(new NBRange(new NBPoint({
        blockID: selection.start.blockID,
        offset: selection.start.offset! + to.length,
        isInsideBoundary: selection.end.isInsideBoundary
      })))
      editor.commit(operator)
      return
    }
    case ModifyTextAtResult.Skipped:
      operator.select(new NBRange(selection.end))
      return
    case ModifyTextAtResult.Invalid:
      break
    }

    if (data instanceof window.DataTransfer) {
      data = (data as DataTransfer).getData("text/plain")
    }
  }

  event.preventDefault()

  /**
   * @compat If the selection is expanded, even if the command seems like
   * a delete forward/backward command it should delete the selection.
   */
  if (selection && !selection.isCollapsed) {
    if (type.startsWith("format")) {
      handleFormat(editor, operator, type)
      return
    }

    operator.deleteSelection()
    if (type.startsWith("delete")) {
      editor.commit(operator)
      return
    }
  }

  switch (type) {
  case "deleteByCut":
  case "deleteByDrag": {
    operator.deleteSelection()
    break
  }

  case "deleteContent":
  case "deleteContentForward": {
    operator.deleteForward()
    break
  }

  case "deleteContentBackward": {
    editor.state.working.delayOperator(editor, operator)
    return
  }

  case "deleteEntireSoftLine": {
    operator.deleteBackward({unit: Unit.Line})
    operator.deleteForward({unit: Unit.Line})
    break
  }

  case "deleteHardLineBackward": {
    operator.deleteBackward({unit: Unit.Block})
    break
  }

  case "deleteSoftLineBackward": {
    operator.deleteBackward({unit: Unit.Line})
    break
  }

  case "deleteHardLineForward": {
    operator.deleteForward({unit: Unit.Block})
    break
  }

  case "deleteSoftLineForward": {
    operator.deleteForward({unit: Unit.Line})
    break
  }

  case "deleteWordBackward": {
    operator.deleteBackward({unit: Unit.Word})
    break
  }

  case "deleteWordForward": {
    operator.deleteForward({unit: Unit.Word})
    break
  }

  case "insertLineBreak": {
    operator.insertSoftNewLine()
    break
  }
  case "insertParagraph": {
    operator.insertParagraphOnBlockText()
    break
  }
  case "insertFromDrop":
  case "insertFromPaste":
  case "insertFromYank":
  case "insertReplacementText":
  case "insertText": {
    if (data instanceof window.DataTransfer) {
      operator.insertFromClipboard(data as DataTransfer)
    } else if (typeof data === "string") {
      if (handleIOSKoreanComposition(editor, operator, data)) return
      operator.insertText(data)
    }
    break
  }
  }
  editor.commit(operator)
}

const handleIOSKoreanComposition = (
  editor: Editor,
  operator: Operator,
  text: string
): boolean => {
  const delayedOperator = editor.state.working.delayedOperator
  delete editor.state.working.delayedOperator

  if (!delayedOperator) return false
  clearTimeout(delayedOperator.timeout)
  for (let i = 0; i < delayedOperator.stack - 1; i++) {
    operator.deleteBackward()
  }

  const {start} = editor.selector.selection!
  const subPath = start.subPath
  const offset = start.offset!
  if (operator.modifyTextAt(
    subPath ? {
      blockID: start.blockID,
      subPath,
      index: offset - 1,
      to: text.substring(0, 1),
    } : {
      blockID: start.blockID,
      startIDX: offset - 1,
      endIDX: offset,
      to: text.substring(0, 1),
    }
  ) === ModifyTextAtResult.Invalid) return false

  const extra = text.substring(1)
  let nextOffset = offset
  if (extra) {
    operator.insertText(extra)
    nextOffset += extra.length
  }
  operator.select(
    NBRange.decode({blockID: start.blockID, subPath, offset: nextOffset})
  )
  editor.commit(operator)

  return true
}

const handleFormat = (editor: Editor, operator: Operator, type: string) => {
  let format: TextPropKey | null = null
  switch (type) {
  case "formatBold":
    format = TextPropKey.Bold
    break
  case "formatItalic":
    format = TextPropKey.Italic
    break
  case "formatUnderline":
    format = TextPropKey.Underline
    break
  default:
    break
  }
  if (format) {
    operator.format(format, !editor.selector.textProps[format] || null)
    editor.commit(operator)
  }
}
