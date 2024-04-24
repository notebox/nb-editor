import type {BlockID} from "@/domain/entity"
import type {Editor} from "@/domain/usecase"
import type {CTRBsData} from "./ctrbs"
import type {Operator, CTRB} from "../operator"
import type {History} from "../history"

import {
  Replica,
  Block,
  Point,
  Span,
  INSContent,
  MODContent,
  DELContent,
  FMTContent,
} from "../crdt"

export class Synchronizer {
  private replica: Replica
  private history: History

  constructor(replica: Replica, history: History) {
    this.replica = replica
    this.history = history
  }

  /** @category sync */
  private cached: {[blockID: string]: CTRB[]} = {}

  publish(editor: Editor, operator: Operator): void {
    this.cache(operator.ctrbs.data)
    editor.emitter.emitContribute(Object.values(operator.ctrbs.data))
  }

  subscribeRemoteCTRBs(editor: Editor, ctrbs: CTRB[]): void {
    ctrbs.forEach(ctrb => {
      if (
        this.replica.block(ctrb.blockID)?.version[ctrb.stamp[0]] <
        ctrb.nonce
      ) {
        applyRemoteCTRB(editor, this.replica, this.history, ctrb)
      }
    })
  }

  subscribeRemoteBlock(editor: Editor, block: Block): void {
    this.replica.replaceBlock(block)
    const cached = this.cachedCTRBs(
      block.blockID,
      block.version[this.replica.replicaID]?.[0]
    )
    if (cached) {
      cached.forEach(ctrb => {
        applyRemoteCTRB(editor, this.replica, this.history, ctrb)
      })
    }

    editor.state.changed.add(block.blockID)
    editor.state.reRender()
  }

  subscribeMergedNonce(blockID: BlockID, nonce: number): void {
    this.release(blockID, nonce)
  }

  private release(blockID: BlockID, nonce = 0): CTRB[] | undefined {
    const index = this.cached[blockID]?.findIndex(
      ctrb => ctrb.nonce[0] > nonce
    )
    if (index === undefined || index === -1) {
      delete this.cached[blockID]
    } else {
      this.cached[blockID] = this.cached[blockID].slice(index)
    }
    return this.cached[blockID]
  }

  private cachedCTRBs(blockID: BlockID, nonce: number): CTRB[] | undefined {
    return this.release(blockID, nonce)
  }

  private cache(data: CTRBsData): void {
    Object.entries(data).forEach(([blockID, ctrb]) => {
      if (this.cached[blockID]) {
        this.cached[blockID].push(ctrb)
      } else {
        this.cached[blockID] = [ctrb]
      }
    })
  }
}

const applyRemoteCTRB = (editor: Editor, replica: Replica, history: History, ctrb: CTRB): void => {
  const {blockID, nonce, stamp} = ctrb
  const replicaID = stamp[0]
  const contributor = {
    replicaID,
    nonce,
  }
  if (ctrb.ops.bINS) {
    const block = Block.decode(ctrb.ops.bINS)
    replica.insBlock(block)
  }
  if (ctrb.ops.bDEL !== undefined) {
    replica.delBlock(blockID, {
      contributor,
      stamp,
      isDeleted: ctrb.ops.bDEL,
    })
  }
  if (ctrb.ops.bMOV) {
    replica.movBlock(blockID, {
      contributor,
      stamp,
      parentBlockID: ctrb.ops.bMOV[0],
      point: Point.decode(ctrb.ops.bMOV[1]),
    })
  }
  if (ctrb.ops.bSET) {
    replica.setBlock(blockID, {
      contributor,
      stamp,
      props: ctrb.ops.bSET,
    })
  }
  if (ctrb.ops.tINS) {
    ctrb.ops.tINS.forEach(tINS => {
      const receipt = replica.insText(blockID, {
        contributor,
        span: new Span(Point.decode(tINS[0]), INSContent.decode(tINS[1])),
      })
      if (receipt) {
        receipt.delta.forEach(d =>
          history.applyRemote({
            isINS: true,
            blockID,
            index: d.index,
            length: d.content.length,
          })
        )
      }
    })
  }
  if (ctrb.ops.tDEL) {
    ctrb.ops.tDEL.forEach(tDEL => {
      const receipt = replica.delText(blockID, {
        contributor,
        span: new Span(Point.decode(tDEL[0]), DELContent.decode(tDEL[1])),
      })
      if (receipt) {
        receipt.delta.forEach(d =>
          history.applyRemote({
            isINS: false,
            blockID,
            index: d.index,
            length: d.length,
          })
        )
      }
    })
  }
  if (ctrb.ops.tFMT) {
    ctrb.ops.tFMT.forEach(tFMT => {
      replica.fmtText(blockID, {
        contributor,
        span: new Span(Point.decode(tFMT[0]), FMTContent.decode(tFMT[1])),
      })
    })
  }
  if (ctrb.ops.tMOD) {
    ctrb.ops.tMOD.forEach(tMOD => {
      replica.modText(blockID, {
        contributor,
        span: new Span(Point.decode(tMOD[0]), MODContent.decode(tMOD[1])),
      })
    })
  }

  editor.state.changed.add(blockID)
}
