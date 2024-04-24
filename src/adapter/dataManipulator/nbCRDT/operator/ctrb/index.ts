import type {BlockID, Stamp, ReplicaNonce} from "../../crdt"
import type * as CTRBOp from "./op"

type CTRB = {
  blockID: BlockID;
  nonce: ReplicaNonce;
  stamp: Stamp;
  ops: {
    bINS?: CTRBOp.bINS;
    bDEL?: CTRBOp.bDEL;
    bSET?: CTRBOp.bSET;
    bMOV?: CTRBOp.bMOV;
    tINS?: CTRBOp.tINS[];
    tDEL?: CTRBOp.tDEL[];
    tFMT?: CTRBOp.tFMT[];
    tMOD?: CTRBOp.tMOD[];
  };
};

export type {CTRB, CTRBOp}
