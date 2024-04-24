import type {NBRange} from "@/domain/entity"
import type * as HistoryOp from "./operation"
import type {BlockID, Block, OP} from "../crdt"

import {RemoteContribution} from "./remote"

export class Delta {
  selection: HistoryOp.UndoRedo<NBRange | null>
  ops: HistoryOp.Op[] = []

  constructor(selection: NBRange | null) {
    this.selection = {undo: selection, redo: selection}
  }

  bINS(block: Block) {
    this.ops.push({
      type: "bINS",
      blockID: block.blockID,
      block,
      undo: true,
      redo: false,
    })
  }

  bDEL(receipt: OP.bDELReceipt) {
    this.ops.push({
      type: "bDEL",
      blockID: receipt.blockID,
      undo: receipt.from,
      redo: receipt.to,
    })
  }

  bMOV(receipt: OP.bMOVReceipt) {
    this.ops.push({
      type: "bMOV",
      blockID: receipt.blockID,
      undo: receipt.from,
      redo: receipt.to,
    })
  }

  bSET(receipt: OP.bSETReceipt) {
    this.ops.push({
      type: "bSET",
      blockID: receipt.blockID,
      undo: receipt.from,
      redo: receipt.to,
    })
  }

  tINS(receipt: OP.tINSAtReceipt, index: number) {
    this.ops.push({
      type: "tINS",
      blockID: receipt.blockID,
      index,
      undo: {
        length: receipt.span.length,
      },
      redo: {
        content: receipt.span.content,
      },
    })
  }

  tDEL(receipt: OP.tDELAtReceipt, index: number) {
    const content = receipt.spans.toINSContent()
    if (!content) return

    this.ops.push({
      type: "tDEL",
      blockID: receipt.blockID,
      index,
      undo: {
        content,
      },
      redo: {
        length: content.length,
      },
    })
  }

  tFMT(
    blockID: BlockID,
    log: {
      undo: HistoryOp.tFMTUndo;
      redo: HistoryOp.tFMTRedo;
    }
  ) {
    this.ops.push({
      type: "tFMT",
      blockID,
      undo: log.undo,
      redo: log.redo,
    })
  }

  tMOD(blockID: BlockID, log: {index: number; undo: string; redo: string}) {
    this.ops.push({
      type: "tMOD",
      blockID,
      index: log.index,
      undo: log.undo,
      redo: log.redo,
    })
  }

  applyRemote(rc: RemoteContribution): void {
    let ops: HistoryOp.Op[] = []

    this.ops.forEach(op => {
      switch (op.type) {
      case "tINS":
        ops = ops.concat(rc.transformINS(op))
        break
      case "tDEL":
        ops = ops.concat(rc.transformDEL(op))
        break
      default:
        ops.push(op)
        return
      }
    })
  }
}
