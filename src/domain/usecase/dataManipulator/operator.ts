import type {
  NBRange, 
  NBBlock,
  SubPath, 
  BlockID, 
  BlockProps, 
  BlockPropsDelta, 
  BlockType, 
  BlockPropKey, 
  TextPropKey, 
  TextPropsDelta, 
  Unit, 
} from "@/domain/entity"

export interface Operator {
  insertBlock(props: BlockProps): void
  insertLineBlockBelow(blockID: BlockID, subPath?: SubPath): NBBlock
  setBlockType(type: BlockType, blockID?: BlockID): void
  setBlockProp(blockID: BlockID, propKey: BlockPropKey, propVal: true | string | number | null): void
  setBlockProps(blockID: BlockID, props: BlockPropsDelta): void
  setBlockGlobalCount(blockID: BlockID, globalCount: true | null): void
  movBlocks(blockIDs: BlockID[], destination: {blockID: BlockID, toPrev: boolean}): void
  setSelectionToDataTransfer(data: DataTransfer): void
  format(
    key: TextPropKey,
    value: TextPropsDelta[TextPropKey] | null,
    range?: {
      start: {blockID: BlockID; offset: number};
      end: {blockID: BlockID; offset: number};
    },
  ): void
  insertTextAt(params: InsertTextAtParams): void
  modifyTextAt(params: ModifyTextAtParams): ModifyTextAtResult
  deleteBackward(options?: {unit: Unit}): void
  deleteForward(options?: {unit: Unit}): void
  deleteRange(params: {
    blockID: BlockID;
    subPath?: SubPath;
    index: number;
    length: number;
  }): void
  deleteSelection(): void
  delBlock(blockID: BlockID, isDeleted: boolean): void
  insertFromClipboard(data: DataTransfer): void
  insertDivider(): void
  insertParagraphOnBlockText(): void
  insertSoftNewLine(): void
  insertText(text: string): void
  indent(): void
  indent(): void
  dedent(): void
  undo(): void
  redo(): void
  select(range: NBRange | null): void
}

export type InsertTextAtParams =
  | {
      blockID: BlockID;
      subPath: SubPath;
      index: number;
      text: string;
    }
  | {
      blockID: BlockID;
      subPath?: undefined;
      index: number;
      text: string;
    };

export type ModifyTextAtParams =
  | {
      blockID: BlockID;
      subPath: SubPath;
      index: number;
      to: string;
    }
  | {
      blockID: BlockID;
      subPath?: undefined;
      startIDX: number;
      endIDX: number;
      to: string;
    };

export enum ModifyTextAtResult {
  Modified,
  Skipped,
  Invalid,
}
