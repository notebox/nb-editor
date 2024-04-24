import type {BlockID, OP} from "../../../../crdt"
import type {Operator} from "../../.."

export const delBlock = (
  operator: Operator,
  blockID: BlockID,
  isDeleted: boolean
): void => {
  const receipt = operator.dataManipulator.replica.delBlock(blockID, {
    isDeleted,
    stamp: operator.stamp,
    contributor: operator.dataManipulator.replica.contributor,
  })

  if (receipt) {
    operator.bDEL([receipt])
  }
}

export const delBlocks = (
  operator: Operator,
  blockIDs: BlockID[],
  isDeleted: boolean
): void => {
  const receipts: OP.bDELReceipt[] = []

  blockIDs.forEach(blockID => {
    const receipt = operator.dataManipulator.replica.delBlock(blockID, {
      isDeleted,
      stamp: operator.stamp,
      contributor: operator.dataManipulator.replica.contributor,
    })
    if (receipt) {
      receipts.push(receipt)
    }
  })

  operator.bDEL(receipts)
}
