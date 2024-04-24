import type {
  OP,
  Stamp,
  Block,
  PointData,
  INSContentData,
  DELContentData,
  FMTContentData,
  MODContentData,
} from "../crdt"

import {CTRB} from "../operator"
import {isProps} from "../crdt"

export class CTRBs {
  private ctrbs: CTRBsData = {}
  private stamp: Stamp

  constructor(stamp: Stamp) {
    this.stamp = stamp
  }

  get data(): CTRBsData {
    return this.ctrbs
  }

  bINS(block: Block) {
    const ctrb: CTRB = {
      blockID: block.blockID,
      nonce: [0, 0],
      stamp: this.stamp,
      ops: {
        bINS: block.encode(),
      },
    }
    this.ctrbs[block.blockID] = ctrb
  }

  bDEL(receipt: OP.bDELReceipt) {
    const ctrb = this.ctrb(receipt)
    ctrb.ops.bDEL = receipt.to
  }

  bMOV(receipt: OP.bMOVReceipt) {
    const ctrb = this.ctrb(receipt)
    ctrb.ops.bMOV = [receipt.to.parentBlockID, receipt.to.point.encode()]
  }

  bSET(receipt: OP.bSETReceipt) {
    const ctrb = this.ctrb(receipt)
    if (ctrb.ops.bSET) {
      mergeObject(ctrb.ops.bSET, receipt.to)
    } else {
      ctrb.ops.bSET = receipt.to
    }
  }

  bVER(receipt: OP.BaseReceipt) {
    this.ctrb(receipt)
  }

  tINS(receipt: OP.tINSAtReceipt) {
    const ctrb = this.ctrb(receipt)
    const tINS = receipt.span.encode() as [PointData, INSContentData]
    if (ctrb.ops.tINS) {
      ctrb.ops.tINS.push(tINS)
    } else {
      ctrb.ops.tINS = [tINS]
    }
  }

  tDEL(receipt: OP.tDELAtReceipt) {
    const ctrb = this.ctrb(receipt)
    const tDEL = receipt.spans.map(
      span => span.toDELSpan().encode() as [PointData, DELContentData]
    )
    if (ctrb.ops.tDEL) {
      ctrb.ops.tDEL = ctrb.ops.tDEL.concat(tDEL)
    } else {
      ctrb.ops.tDEL = tDEL
    }
  }

  tFMT(receipt: OP.tFMTAtReceipt) {
    const ctrb = this.ctrb(receipt)
    const tFMT = receipt.spans.map(
      span => span.encode() as [PointData, FMTContentData]
    )
    if (ctrb.ops.tFMT) {
      ctrb.ops.tFMT = ctrb.ops.tFMT.concat(tFMT)
    } else {
      ctrb.ops.tFMT = tFMT
    }
  }

  tMOD(receipt: OP.tMODReceipt) {
    const ctrb = this.ctrb(receipt)
    const tMOD = receipt.span.encode() as [PointData, MODContentData]
    if (ctrb.ops.tMOD) {
      ctrb.ops.tMOD.push(tMOD)
    } else {
      ctrb.ops.tMOD = [tMOD]
    }
  }

  private ctrb(receipt: OP.BaseReceipt): CTRB {
    const {blockID, version} = receipt
    let ctrb: CTRB = this.ctrbs[blockID]
    if (ctrb) {
      ctrb.nonce = version!.nonce
    } else {
      ctrb = {
        nonce: version!.nonce,
        blockID,
        stamp: this.stamp,
        ops: {},
      }
      this.ctrbs[blockID] = ctrb
    }

    return ctrb
  }
}

const mergeObject = (a: Dictionary, b: Dictionary) => {
  Object.keys(b).forEach(key => {
    if (a[key] && isProps(a[key]) && isProps(b[key])) {
      a[key] = mergeObject(a[key], b[key])
    } else {
      a[key] = b[key]
    }
  })
  return a
}

export type CTRBsData = {[blockID: string]: CTRB};
