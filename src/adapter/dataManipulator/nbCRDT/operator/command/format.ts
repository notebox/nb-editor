import type {BlockID, TextPropKey, TextPropValue} from "@/domain/entity"
import type {Operator} from ".."

import * as lowLevel from "./lowLevel"

export const format = (
  operator: Operator,
  propKey: TextPropKey,
  propVal: TextPropValue | null,
  range?: {
    start: {blockID: BlockID; offset: number};
    end: {blockID: BlockID; offset: number};
  }
): void => {
  const selection = range || operator.editor.selector.selection
  if (!selection) return

  const stamp = operator.stamp
  const {start, end} = selection

  /** @verbose single block */
  if (start.blockID === end.blockID) {
    lowLevel.fmtText(
      operator,
      start.blockID,
      stamp,
      start.offset || 0,
      end.offset,
      propKey,
      propVal
    )
    return
  }

  /** @verbose multiple blocks */
  lowLevel.fmtText(
    operator,
    start.blockID,
    stamp,
    start.offset || 0,
    undefined,
    propKey,
    propVal
  )
  lowLevel
    .betweenBlockIDs(operator.editor.dataManipulator, start.blockID, end.blockID)
    .forEach(blockID => {
      lowLevel.fmtText(
        operator,
        blockID,
        stamp,
        0,
        undefined,
        propKey,
        propVal
      )
    })
  if (end.offset) {
    lowLevel.fmtText(
      operator,
      end.blockID,
      stamp,
      0,
      end.offset,
      propKey,
      propVal
    )
  }
  return
}
