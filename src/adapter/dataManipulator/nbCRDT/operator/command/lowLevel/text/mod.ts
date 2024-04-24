import type {BlockID, Point} from "../../../../crdt"
import type {Operator} from "../../.."

import {Span, MODContent} from "../../../../crdt"

export const modTextAt = (
  operator: Operator,
  blockID: BlockID,
  point: Point,
  index: number,
  from: string,
  to: string
): void => {
  const span = new Span(point, new MODContent(to))
  const receipt = operator.dataManipulator.replica.modText(blockID, {
    span,
    contributor: operator.dataManipulator.replica.contributor,
  })

  if (!receipt) return
  operator.tMOD(receipt, {index, undo: from, redo: to})
}
