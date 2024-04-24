import type {BlockID, Spans} from "../../../../crdt"
import type {Operator} from "../../.."

export const delTextAt = (
  operator: Operator,
  blockID: BlockID,
  index: number,
  length: number
): Spans | undefined => {
  const receipt = operator.dataManipulator.replica.delTextAt(blockID, {
    index,
    length,
    contributor: operator.dataManipulator.replica.contributor,
  })
  if (receipt) {
    operator.tDEL(receipt, index)
    return receipt.spans
  }
  return
}
