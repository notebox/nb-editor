import type {BlockID} from "../crdt"

import * as HistoryOp from "./operation"

export class RemoteContribution {
  private remoteDelta: RemoteTextDelta

  constructor(remoteDelta: RemoteTextDelta) {
    this.remoteDelta = remoteDelta
  }

  transformINS(delta: HistoryOp.tINS): HistoryOp.tINS[] {
    if (this.remoteDelta.blockID !== delta.blockID) return [delta]

    if (this.remoteDelta.isINS) {
      if (this.remoteDelta.index <= delta.index) {
        return [{...delta, index: delta.index + this.remoteDelta.length}]
      } else {
        const leftLength =
          delta.index + delta.undo.length - this.remoteDelta.index

        if (leftLength <= 0) {
          this.remoteDelta.index -= delta.undo.length
          return [delta]
        } else {
          this.remoteDelta.index -= leftLength
          const left = delta.redo.content.slice(0, leftLength)
          const right = delta.redo.content.slice(leftLength)

          return [
            {
              ...delta,
              redo: {content: left},
              undo: {length: left.length},
            },
            {
              ...delta,
              index: delta.index + left.length + this.remoteDelta.length,
              redo: {content: right},
              undo: {length: right.length},
            },
          ]
        }
      }
    } else {
      if (this.remoteDelta.index + this.remoteDelta.length <= delta.index) {
        return [{...delta, index: delta.index - this.remoteDelta.length}]
      } else {
        const deltaLength = delta.undo.length
        if (this.remoteDelta.index >= delta.index + deltaLength) {
          this.remoteDelta.index -= deltaLength
        }
        return [delta]
      }
    }
  }

  transformDEL(delta: HistoryOp.tDEL): HistoryOp.tDEL[] {
    if (this.remoteDelta.blockID !== delta.blockID) return [delta]

    if (this.remoteDelta.isINS) {
      if (this.remoteDelta.index <= delta.index) {
        return [{...delta, index: delta.index + this.remoteDelta.length}]
      } else {
        this.remoteDelta.index -= delta.redo.length
        return [delta]
      }
    } else {
      if (this.remoteDelta.index + this.remoteDelta.length <= delta.index) {
        return [{...delta, index: delta.index - this.remoteDelta.length}]
      } else {
        this.remoteDelta.index -= delta.redo.length
        return [delta]
      }
    }
  }
}

export type RemoteTextDelta = {
  isINS: boolean;
  blockID: BlockID;
  index: number;
  length: number;
};
