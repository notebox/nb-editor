import type {Spans, Stamp} from "../../../../crdt"
import type {
  BlockID,
  TextPropKey,
  TextPropValue,
  TextPropsDelta,
} from "@/domain/entity"
import type {Operator} from "../../.."
import type {HistoryOp} from "../../../../history"

export const fmtText = (
  operator: Operator,
  blockID: BlockID,
  stamp: Stamp,
  index: number,
  end: number | undefined,
  propKey: TextPropKey,
  propVal: TextPropValue | null
): void => {
  const spans = operator.dataManipulator.replica.block(blockID).text?.spans()
  const deductedEnd = end || spans?.textLength() || 0
  const length = deductedEnd - index
  if (!spans || length < 1) return

  const undo = genFMTUndoData(spans, index, deductedEnd, propKey, propVal)
  const receipt = operator.dataManipulator.replica.fmtTextAt(blockID, {
    index,
    length,
    props: {[propKey]: propVal} as TextPropsDelta,
    stamp,
    contributor: operator.dataManipulator.replica.contributor,
  })

  if (receipt) {
    operator.tFMT(receipt, {undo, redo: {index, length, propKey, propVal}})
  }
}

const genFMTUndoData = (
  spans: Spans,
  start: number,
  end: number,
  propKey: TextPropKey,
  propVal: TextPropsDelta[TextPropKey]
): HistoryOp.tFMTUndo => {
  const data: HistoryOp.tFMTUndo = []
  let index = 0
  for (let sIDX = 0; sIDX < spans.length; sIDX++) {
    const span = spans[sIDX]
    const length = span.length
    const spanEnd = index + length
    if (spanEnd < start || span.content.isMeta()) {
      index = spanEnd
      continue
    }

    for (let lIDX = 0; lIDX < span.content.attributes.leaves.length; lIDX++) {
      if (index >= end) {
        return data
      }

      const leaf = span.content.attributes.leaves[lIDX]
      const leafLength = leaf.length
      if (index + leaf.length < start) {
        index += leafLength
        continue
      }

      const oldPropVal = (leaf.props && leaf.props[propKey]) || null
      if (oldPropVal === propVal) {
        index += leafLength
        continue
      }

      const subStart = index < start ? start - index : 0
      const nextIndex = index + leafLength
      const subLength =
        nextIndex < end ? leafLength : leafLength - nextIndex + end
      data.push({
        index: index + subStart,
        length: subLength,
        propKey,
        propVal: oldPropVal,
      })
      index = nextIndex
    }
  }

  return data
}
