import type {BlockID, DBFieldID, DBLabelID} from "./block"

import _ from "lodash"

export type NBPointData = {
  blockID: BlockID;
  subPath?: SubPath;
  offset?: number;
  isInsideBoundary?: boolean;
};

export class NBPoint {
  readonly blockID: BlockID
  readonly subPath?: SubPath
  readonly offset?: number
  readonly isTextEditable: boolean
  readonly isTextBlock: boolean
  readonly isTextProp: boolean
  readonly isInsideBoundary?: boolean

  constructor(data: NBPointData) {
    this.blockID = data.blockID
    this.subPath = data.subPath
    this.offset = data.offset
    this.isInsideBoundary = data.isInsideBoundary || !!data.subPath

    this.isTextEditable = this.offset != null
    this.isTextBlock = this.isTextEditable && !this.subPath
    this.isTextProp = this.isTextEditable && !!this.subPath
  }

  equals(other: NBPoint): boolean {
    return (
      this.blockID === other.blockID &&
      this.offset === other.offset &&
      _.isEqual(this.subPath, other.subPath)
    )
  }

  clone(): NBPoint {
    return new NBPoint({
      blockID: this.blockID,
      subPath: _.cloneDeep(this.subPath),
      offset: this.offset,
      isInsideBoundary: this.isInsideBoundary,
    })
  }
}

export class NBRange {
  readonly start: NBPoint
  readonly end: NBPoint
  readonly isTextEditable: boolean
  readonly isTextBlock: boolean
  readonly isTextProp: boolean

  fromDOM = false

  constructor(start: NBPoint, end?: NBPoint) {
    this.start = start
    this.end = end || start

    this.isTextEditable = this.start.isTextEditable && this.end.isTextEditable
    this.isTextBlock = this.start.isTextBlock && this.end.isTextBlock
    this.isTextProp = this.start.isTextProp && this.end.isTextProp
  }

  get isCollapsed(): boolean {
    return this.start.equals(this.end)
  }

  get isNotCollapsedInABlock(): boolean {
    return (
      this.start.blockID === this.end.blockID &&
      this.start.offset !== this.end.offset
    )
  }

  get isNotCollapsedInASubPath(): boolean {
    return (
      this.isNotCollapsedInABlock &&
      _.isEqual(this.start.subPath, this.end.subPath)
    )
  }

  get hasMultiBlocks(): boolean {
    return this.start.blockID !== this.end.blockID
  }

  get hasBoundary(): boolean {
    return (
      this.hasMultiBlocks &&
      (this.start.isInsideBoundary || this.end.isInsideBoundary || false)
    )
  }

  equals(other: NBRange): boolean {
    return this.start.equals(other.start) && this.end.equals(other.end)
  }

  flagFromDom(fromDOM: boolean) {
    this.fromDOM = fromDOM
  }

  static decode(startData: NBPointData, endData?: NBPointData): NBRange {
    const start = new NBPoint(startData)
    const end = endData ? new NBPoint(endData) : start
    return new NBRange(start, end)
  }
}

export interface NBRangeData {
  start: NBPointData;
  end: NBPointData;
}

export type TextEditablePoint = NBPoint & {
  offset: number;
};

export type TextEditableRange = NBRange & {
  start: TextEditablePoint;
  end: TextEditablePoint;
};

export type NBDOMType = "editor" | "block" | "text" | "prop";
export type SubPath = |
  {type: "caption", recordBlockID?: undefined; fieldID?: undefined} |
  {type: "db", recordBlockID: BlockID, fieldID?: DBFieldID} |
  {type: "db-board", recordBlockID?: undefined; fieldID: DBFieldID; labelID: DBLabelID};