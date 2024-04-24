import type {BlockID, BlockPosition, Point} from "../../../../crdt"
import type {Operator} from "../../.."

export const movBlock = (
  operator: Operator,
  blockID: BlockID,
  to: BlockPosition
): true | undefined => {
  const receipt = operator.dataManipulator.replica.movBlock(blockID, {
    parentBlockID: to.parentBlockID,
    point: to.point,
    stamp: operator.stamp,
    contributor: operator.dataManipulator.replica.contributor,
  })

  if (receipt) {
    operator.bMOV(receipt)
    return true
  }
  return
}

export const movBlocks = (
  operator: Operator,
  blockIDs: BlockID[],
  destination: {blockID: BlockID; toPrev: boolean}
): void => {
  const target = operator.dataManipulator.replica.block(destination.blockID)
  let prevPoint: Point | undefined
  let nextPoint: Point | undefined

  if (destination.toPrev) {
    if (target.blockID === blockIDs[0]) return
    prevPoint = operator.dataManipulator.replica.prevSiblingBlock(target.blockID)?.point
    nextPoint = target.point
  } else {
    const nextBlock = operator.dataManipulator.replica.nextSiblingBlock(target.blockID)
    if (nextBlock?.blockID === blockIDs[0]) return
    prevPoint = target.point
    nextPoint = nextBlock?.point
  }

  blockIDs.forEach(blockID => {
    prevPoint = operator.dataManipulator.replica.genBlockPoint(
      prevPoint,
      nextPoint
    )
    movBlock(operator, blockID, {
      parentBlockID: target.parentBlockID!,
      point: prevPoint,
    })
  })
}
