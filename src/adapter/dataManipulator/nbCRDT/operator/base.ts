import type {Editor} from "@/domain/usecase"
import type {NBDataManipulator} from ".."
import type {Block, Stamp, OP} from "../crdt"
import type {HistoryOp} from "../history"

import {Delta} from "../history"
import {CTRBs} from "../synchronizer/ctrbs"

export class OperatorBase {
  readonly editor: Editor
  readonly dataManipulator: NBDataManipulator
  readonly stamp: Stamp
  delta: Delta
  ctrbs: CTRBs

  constructor({
    editor,
    dataManipulator,
  }: {
    editor: Editor,
    dataManipulator: NBDataManipulator,
  }) {
    this.editor = editor
    this.dataManipulator = dataManipulator
    this.stamp = dataManipulator.replica.genNewStamp()
    this.delta = new Delta(editor.selector.selection)
    this.ctrbs = new CTRBs(this.stamp)
  }

  bINS(block: Block) {
    this.ctrbs.bINS(block)
    this.delta.bINS(block)
    this.editor.state.changed.add(block.blockID)
  }

  bDEL(receipt: OP.bDELReceipt[]) {
    if (!receipt[0]) return

    receipt.forEach(receipt => {
      this.ctrbs.bDEL(receipt)
      this.delta.bDEL(receipt)
      this.editor.state.changed.add(receipt.blockID)
    })
  }

  bMOV(receipt: OP.bMOVReceipt) {
    this.ctrbs.bMOV(receipt)
    this.delta.bMOV(receipt)
    this.editor.state.changed.add(receipt.blockID)
  }

  bSET(receipt: OP.bSETReceipt) {
    this.ctrbs.bSET(receipt)
    this.delta.bSET(receipt)
    this.editor.state.changed.add(receipt.blockID)
  }

  bVER(receipt: OP.BaseReceipt) {
    this.ctrbs.bVER(receipt)
    this.editor.state.changed.add(receipt.blockID)
  }

  tINS(receipt: OP.tINSAtReceipt, index: number) {
    receipt.span = receipt.span.clone()
    this.ctrbs.tINS(receipt)
    this.delta.tINS(receipt, index)
    this.editor.state.changed.add(receipt.blockID)
  }

  tDEL(receipt: OP.tDELAtReceipt, index: number) {
    this.ctrbs.tDEL(receipt)
    this.delta.tDEL(receipt, index)
    this.editor.state.changed.add(receipt.blockID)
  }

  tFMT(
    receipt: OP.tFMTAtReceipt,
    log: {
      undo: HistoryOp.tFMTUndo;
      redo: HistoryOp.tFMTRedo;
    }
  ) {
    this.ctrbs.tFMT(receipt)
    this.delta.tFMT(receipt.blockID, log)
    this.editor.state.changed.add(receipt.blockID)
  }

  tMOD(
    receipt: OP.tMODReceipt,
    log: {index: number; undo: string; redo: string}
  ) {
    this.ctrbs.tMOD(receipt)
    this.delta.tMOD(receipt.blockID, log)
    this.editor.state.changed.add(receipt.blockID)
  }
}
