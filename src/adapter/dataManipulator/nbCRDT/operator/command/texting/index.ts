import type {NBRange, NBPoint, SubPath} from "@/domain/entity"
import {InsertTextAtParams, ModifyTextAtParams, ModifyTextAtResult} from "@/domain/usecase"
import type {
  BlockID,
  Point,
} from "../../../crdt"
import type {Operator} from "../.."

import {Unit} from "@/domain/entity"
import {INSContent} from "../../../crdt"
import {
  deleteSelectionAndSelect,
  deleteTextAndSelect,
} from "./deleteText"
import * as lowLevel from "../lowLevel"
import * as prop from "./prop"

export const deleteRange = (operator: Operator, params: DeleteRangeParams) => {
  if (params.subPath) {
    prop.deleteRange(
      operator,
      params as DeleteRangeParams & {subPath: SubPath}
    )
  } else {
    lowLevel.delTextAt(operator, params.blockID, params.index, params.length)
  }
}

export const deleteSelection = (operator: Operator) => {
  const selection = operator.editor.selector.selection
  if (!selection || selection?.isCollapsed) return

  if (selection.start.subPath) {
    prop.deleteSelectionAndSelect(
      operator,
      selection as NBRange & {start: {subPath: SubPath}}
    )
  } else {
    deleteSelectionAndSelect(operator)
  }
}

export const deleteText = (
  operator: Operator,
  unit: Unit = Unit.Character,
  backward: boolean
) => {
  const selection = operator.editor.selector.selection
  if (!selection || !selection.isCollapsed) return

  if (selection.start.subPath) {
    prop.deleteTextAndSelect(
      operator,
      selection.start as NBPoint & {subPath: SubPath},
      unit,
      backward
    )
  } else {
    deleteTextAndSelect(operator, unit, backward)
  }
}

export const insertSoftNewLine = (operator: Operator) => {
  const selection = operator.editor.selector.selection
  if (!selection || !selection.isCollapsed) return

  if (selection.start.subPath) {
    prop.insertTextAtAndSelect(operator, {
      blockID: selection.start.blockID,
      subPath: selection.start.subPath,
      index: selection.start.offset!,
      text: "\n",
    })
  } else {
    lowLevel.insTextSoftNewLineAndSelect(operator)
  }
}

export const insertText = (operator: Operator, text: string) => {
  const selection = operator.editor.selector.selection
  if (!selection || !selection.isCollapsed) return

  if (selection.start.subPath) {
    prop.insertTextAtAndSelect(operator, {
      blockID: selection.start.blockID,
      subPath: selection.start.subPath,
      index: selection.start.offset!,
      text,
    })
  } else {
    lowLevel.insTextAndSelect(operator, text)
  }
}

export const insertTextAt = (
  operator: Operator,
  params: InsertTextAtParams
) => {
  if (params.subPath) {
    prop.insertTextAtAndSelect(operator, params)
  } else {
    const insContent = INSContent.from(params.text, operator.editor.selector.textProps)
    lowLevel.insTextAtAndSelect(
      operator,
      params.blockID,
      params.index,
      insContent
    )
  }
}

export const insertINSContentAt = (
  operator: Operator,
  params: {
    blockID: BlockID;
    index: number;
    insContent: INSContent;
  }
) => {
  lowLevel.insTextAtAndSelect(
    operator,
    params.blockID,
    params.index,
    params.insContent,
  )
}

export const modifyTextAt = (
  operator: Operator,
  params: ModifyTextAtParams
): ModifyTextAtResult => {
  if (params.subPath) {
    prop.modifyTextAt(operator, params)
    return ModifyTextAtResult.Modified
  }

  const spans = operator.dataManipulator.replica.subSpans(
    params.blockID,
    params.startIDX,
    params.endIDX,
  )
  const span = spans[0]
  if (
    spans.length === 1 &&
    span.replicaID === operator.dataManipulator.replica.replicaID
  ) {
    const from = span.content.text!
    if (from === params.to) return ModifyTextAtResult.Skipped
    if (from.length === params.to.length) {
      lowLevel.modTextAt(
        operator,
        params.blockID,
        span.lowerPoint,
        params.startIDX,
        from,
        params.to
      )
      return ModifyTextAtResult.Modified
    }
    if (from.length < params.to.length) {
      const l = from.length
      lowLevel.modTextAt(
        operator,
        params.blockID,
        span.lowerPoint,
        params.startIDX,
        from,
        params.to.substring(0, l)
      )
      lowLevel.insTextAtAndSelect(
        operator,
        params.blockID,
        params.startIDX + l,
        INSContent.from(params.to.substring(l), operator.editor.selector.textProps)
      )
      return ModifyTextAtResult.Modified
    }
    lowLevel.delTextAt(operator, params.blockID, params.startIDX, from.length)
  }
  return ModifyTextAtResult.Invalid
}

export const modifyTextAtPoint = (
  operator: Operator,
  params: {
    blockID: BlockID;
    point: Point;
    index: number;
    from: string;
    to: string;
  }
): void => {
  lowLevel.modTextAt(
    operator,
    params.blockID,
    params.point,
    params.index,
    params.from,
    params.to
  )
}

export {Unit}
export type DeleteRangeParams = {
  blockID: BlockID;
  subPath?: SubPath;
  index: number;
  length: number;
};

export type {InsertTextAtParams, ModifyTextAtParams, ModifyTextAtResult} from "@/domain/usecase"