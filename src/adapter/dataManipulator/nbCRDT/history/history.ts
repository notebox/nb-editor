import type {BlockID} from "../crdt"
import type {Delta} from "./delta"
import type {Operator} from "../operator"

import {RemoteContribution, RemoteTextDelta} from "./remote"

const MAX_STACK = 99
export class History {
  private index = 0
  private logs: Delta[] = []

  get isUndoable(): boolean {
    return this.logs.length > 0 && this.index > 0
  }

  get isRedoable(): boolean {
    return this.logs.length > this.index
  }

  flush(blockID: BlockID): void {
    this.logs.filter(delta => {
      delta.ops = delta.ops.filter(op => op.blockID !== blockID)
      return delta.ops.length !== 0
    })
  }

  applyRemote(remoteTextDelta: RemoteTextDelta): void {
    const rc = new RemoteContribution(remoteTextDelta)

    this.logs.forEach(log => {
      log.applyRemote(rc)
    })
  }

  log(delta: Delta): void {
    this.logs.splice(this.index)
    this.logs.push(delta)
    if (this.logs.length > MAX_STACK) {
      this.logs.shift()
    } else {
      this.index += 1
    }
  }

  undo(operator: Operator): void {
    if (!this.isUndoable) return
    this.do(operator, this.logs[this.index - 1], false)
    this.index--
  }

  redo(operator: Operator): void {
    if (!this.isRedoable) return
    this.do(operator, this.logs[this.index], true)
    this.index++
  }

  do(operator: Operator, delta: Delta, isRedo: boolean): void {
    const key = isRedo ? "redo" : "undo"
    delta.ops.reverse().forEach(op => {
      switch (op.type) {
      case "bINS":
        operator.delBlock(op.block.blockID, op[key])
        return
      case "bDEL":
        operator.delBlock(op.blockID, op[key])
        return
      case "bSET":
        operator.setBlockProps(op.blockID, op[key])
        return
      case "bMOV":
        operator.movBlock(op.blockID, op[key])
        return
      case "tINS":
        if (isRedo) {
          operator.insertINSContentAt({
            blockID: op.blockID,
            index: op.index,
            insContent: op.redo.content,
          })
        } else {
          operator.deleteRange({
            blockID: op.blockID,
            index: op.index,
            length: op.undo.length,
          })
        }
        return
      case "tDEL":
        if (isRedo) {
          operator.deleteRange({
            blockID: op.blockID,
            index: op.index,
            length: op.redo.length,
          })
        } else {
          operator.insertINSContentAt({
            blockID: op.blockID,
            index: op.index,
            insContent: op.undo.content,
          })
        }
        return
      case "tFMT":
        if (isRedo) {
          operator.format(op.redo.propKey, op.redo.propVal, {
            start: {blockID: op.blockID, offset: op.redo.index},
            end: {
              blockID: op.blockID,
              offset: op.redo.index + op.redo.length,
            },
          })
        } else {
          op.undo.forEach(undo => {
            operator.format(undo.propKey, undo.propVal, {
              start: {blockID: op.blockID, offset: undo.index},
              end: {blockID: op.blockID, offset: undo.index + undo.length},
            })
          })
        }
        return
      case "tMOD": {
        const point = operator.dataManipulator.replica.pointAt(
          op.blockID,
          op.index
        )!
        if (point.replicaID !== operator.dataManipulator.replica.replicaID) return

        operator.modifyTextAtPoint({
          blockID: op.blockID,
          point,
          index: op.index,
          from: isRedo ? op.undo : op.redo,
          to: isRedo ? op.redo : op.undo,
        })
        return
      }
      default: {
        const notImplemented: never = op
        return notImplemented
      }
      }
    })
    operator.select(delta.selection[key])
  }
}
