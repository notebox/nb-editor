import type {
  Point,
  Block,
  BlockID,
  BlockPosition,
  INSContent,
} from "../crdt"
import type {
  NBRange,
  BlockProps,
  BlockPropKey,
  BlockType,
  BlockPropsDelta,
  TextPropKey,
  TextPropValue,
  SubPath,
} from "@/domain/entity"

import * as Command from "./command"
import {OperatorBase} from "./base"
export * from "./ctrb"

class Operator extends OperatorBase {
  /** @category History */
  undo(): void {
    this.dataManipulator.history.undo(this)
  }

  redo(): void {
    this.dataManipulator.history.redo(this)
  }

  /** @category Selection */
  select(range: NBRange | null): void {
    this.editor.selector.select(range)
  }

  /** @category Block */
  setBlockType(type: BlockType, blockID?: BlockID): void {
    Command.setBlockType(this, type, blockID)
  }

  setBlockProps(blockID: BlockID, props: BlockPropsDelta): void {
    Command.setBlockProps(this, blockID, props)
  }

  setBlockProp(
    blockID: BlockID,
    propKey: BlockPropKey,
    propVal: true | string | number | null
  ): void {
    Command.setBlockProp(this, blockID, propKey, propVal)
  }

  setBlockGlobalCount(blockID: BlockID, globalCount: true | null): void {
    Command.setBlockGlobalCount(this, blockID, globalCount)
  }

  delBlock(blockID: BlockID, isDeleted: boolean): void {
    Command.delBlock(this, blockID, isDeleted)
  }

  movBlock(blockID: BlockID, to: BlockPosition): void {
    Command.movBlock(this, blockID, to)
  }

  movBlocks(
    blockIDs: BlockID[],
    destination: {blockID: BlockID; toPrev: boolean}
  ): void {
    Command.movBlocks(this, blockIDs, destination)
  }

  indent() {
    Command.indent(this)
  }

  dedent() {
    Command.dedent(this)
  }

  /** @category Text */
  format(
    propKey: TextPropKey,
    propVal: TextPropValue | null,
    range?: {
      start: {blockID: BlockID; offset: number};
      end: {blockID: BlockID; offset: number};
    }
  ): void {
    Command.format(this, propKey, propVal, range)
  }

  deleteRange(params: Command.DeleteRangeParams): void {
    Command.deleteRange(this, params)
  }

  deleteSelection(): void {
    Command.deleteSelection(this)
  }

  deleteBackward(options?: {unit: Command.Unit}): void {
    Command.deleteText(this, options?.unit, true)
  }

  deleteForward(options?: {unit: Command.Unit}): void {
    Command.deleteText(this, options?.unit, false)
  }

  modifyTextAt = (params: Command.ModifyTextAtParams): Command.ModifyTextAtResult => {
    return Command.modifyTextAt(this, params)
  }

  modifyTextAtPoint = (params: {
    blockID: BlockID;
    point: Point;
    index: number;
    from: string;
    to: string;
  }): void => {
    Command.modifyTextAtPoint(this, params)
  }

  insertTextAt(params: Command.InsertTextAtParams): void {
    Command.insertTextAt(this, params)
  }

  insertINSContentAt(params: {
    blockID: BlockID;
    index: number;
    insContent: INSContent;
  }): void {
    Command.insertINSContentAt(this, params)
  }

  insertText(text: string): void {
    Command.insertText(this, text)
  }

  insertSoftNewLine(): void {
    Command.insertSoftNewLine(this)
  }

  insertBlock(props: BlockProps): BlockID | null {
    const custom = this.dataManipulator.customBlocks[props.TYPE?.[1] ?? ""]
    if (custom) {
      return custom.insert(this, props)
    }
    return Command.insBlock(this, props)
  }

  insertLineBlockBelow(
    prevBlockID: BlockID,
    subPath?: SubPath,
  ): Block {
    return Command.insLineBlockBelow(this, prevBlockID, subPath)
  }

  insertParagraphOnBlockText(props?: BlockProps): void {
    Command.insParagraphAndSelect(this, props)
  }

  insertDivider(): void {
    Command.insDividerBlockBeforeWithoutSelection(this)
  }

  /** @category Clipboard */
  setSelectionToDataTransfer(data: DataTransfer): void {
    Command.setSelectionToDataTransfer(this, data)
  }

  insertFromClipboard(data: DataTransfer): void {
    Command.insertFromClipboard(this, data)
  }
}

const Unit = Command.Unit
export {Operator, Unit}
