import type {
  BlockID,
  BlockPosition,
  Block,
  INSContent,
} from "../crdt"

import type {
  TextPropKey,
  TextPropValue,
  BlockPropsDelta,
} from "@/domain/entity/block"

export type UndoRedo<T> = {
  undo: T;
  redo: T;
};

export type bINS = {
  type: "bINS";
  blockID: BlockID;
  block: Block;
  undo: true;
  redo: false;
};

export type bDEL = {
  type: "bDEL";
  blockID: BlockID;
} & UndoRedo<boolean>;

export type bSET = {
  type: "bSET";
  blockID: BlockID;
} & UndoRedo<BlockPropsDelta>;

export type bMOV = {
  type: "bMOV";
  blockID: BlockID;
} & UndoRedo<BlockPosition>;

export type tINS = {
  type: "tINS";
  blockID: BlockID;
  index: number;
  undo: {
    length: number;
  };
  redo: {
    content: INSContent;
  };
};

export type tDEL = {
  type: "tDEL";
  blockID: BlockID;
  index: number;
  undo: {
    content: INSContent;
  };
  redo: {
    length: number;
  };
};

export type tMOD = {
  type: "tMOD";
  blockID: BlockID;
  index: number;
} & UndoRedo<string>;

export type tFMT = {
  type: "tFMT";
  blockID: BlockID;
  undo: tFMTUndo;
  redo: tFMTRedo;
};

export type tFMTUndo = {
  index: number;
  length: number;
  propKey: TextPropKey;
  propVal: TextPropValue | null;
}[];

export type tFMTRedo = {
  index: number;
  length: number;
  propKey: TextPropKey;
  propVal: TextPropValue | null;
};

export type Op = bINS | bDEL | bSET | bMOV | tINS | tDEL | tFMT | tMOD;
