import {BlockPropsDelta} from "@/domain/entity/block/props"
import type {
  PointData,
  BlockData,
  BlockID,
  INSContentData,
  DELContentData,
  FMTContentData,
  MODContentData,
} from "../../crdt"

export type bINS = BlockData;
export type bDEL = boolean;
export type bSET = BlockPropsDelta;
export type bMOV = [parentBlockID: BlockID, point: PointData];
export type tINS = [PointData, INSContentData];
export type tDEL = [PointData, DELContentData];
export type tFMT = [PointData, FMTContentData];
export type tMOD = [PointData, MODContentData];
