import type {
  SubPath, 
  NBRange, 
  NoteBlock, 
  TextPropsContent, 
  Markdown, 
  Editor,
  DataManipulator,
  BlockProps,
  PresenterBlockHandler,
  PresenterBlockProps,
  DBRecordProp
} from "@/domain"
import type {BlockID, ReplicaData, BlockData, Point, BlockVersion} from "./crdt"
import type {Inheritance} from "./operator/command/lowLevel"
import type {BlockContentData} from "./parser"

import {BlockPropKey, isNoteBlock, isAllowAnyChildBlock} from "@/domain"
import {Replica, Block} from "./crdt"
import {isInlineIndentation} from "./operator/command"
import * as lowLevel from "./operator/command/lowLevel"
import {Synchronizer} from "./synchronizer"
import {History} from "./history"
import {Operator as NBOperator} from "./operator"
import {Parser} from "./parser"

export * from "./parser"

export class NBDataManipulator implements DataManipulator {
  readonly replica: Replica
  readonly history: History
  readonly customBlocks: CustomBlockHandlers
  readonly parser: Parser

  private synchronizer: Synchronizer
  private _rootBlockID?: BlockID

  constructor(props: {
    parser: Parser,
    customBlocks: CustomBlockHandlers,
    data: ReplicaData
  }) {
    this.customBlocks = props.customBlocks
    this.parser = props.parser
    this.replica = Replica.decode(props.data)
    this.history = new History()
    this.synchronizer = new Synchronizer(this.replica, this.history)
  }

  markdown(): Markdown {
    return this.parser.encodeToMarkdown(this)
  }
  plaintext(): string {
    return this.parser.encodeToText(this.parser.encodeToBlockContentData(this, this.childBlocks(this.rootBlock().blockID)))
  }
  html(): string {
    return this.parser.encodeToHTML(this.parser.encodeToBlockContentData(this, this.childBlocks(this.rootBlock().blockID)))
  }

  renderCustomBlock(props: PresenterBlockProps): JSX.Element | undefined {
    return this.customBlocks[props.block.type]?.render(props)
  }

  getHistoryProps(): { isUndoable: boolean; isRedoable: boolean } {
    return {
      isUndoable: this.history.isUndoable,
      isRedoable: this.history.isRedoable,
    }
  }

  getTextProps(selection: NBRange | null): TextPropsContent | undefined {
    if (!selection) return
    if (selection.start.offset == null) return

    let start = selection.start.offset
    if (selection.isCollapsed) {
      if (selection.start.offset === 0) return
      start -= 1
    }

    return this.replica.subSpans(
      selection.start.blockID,
      start,
      start + 1
    )?.[0]?.content.attributes.leaves[0]?.props
  }

  getIndentationProps(
    range?: NBRange
  ): {isIndentable: boolean; isDedentable: boolean} {
    const result = {
      isIndentable: false,
      isDedentable: false,
    }
  
    if (!range) return result
  
    // only check start block
    if (range.start.subPath) return result
  
    const block = this.block(range.start.blockID)
    if (isInlineIndentation(block, range)) {
      result.isIndentable = true
      result.isDedentable = range.start.offset !== 0
    } else {
      const toParent = this.prevSiblingBlock(block.blockID)
      result.isIndentable = (toParent && isAllowAnyChildBlock(toParent)) || false
      result.isDedentable =
        (block.parentBlockID &&
          block.parentBlockID !== this.rootBlock().blockID &&
          isAllowAnyChildBlock(this.block(block.parentBlockID))) ||
        false
    }
  
    return result
  }

  /** @category operate */
  newOperator(editor: Editor<NBDataManipulator>): NBOperator {
    return new NBOperator({editor, dataManipulator: this})
  }

  commit(operator: NBOperator, withHistory = true): boolean {
    /** @warning bVER only ctrbs will not be published */
    if (operator.delta.ops.length > 0) {
      if (withHistory) {
        operator.delta.selection.redo = operator.editor.selector.selection
        this.history.log(operator.delta)
      }
      this.synchronizer.publish(operator.editor, operator)
      return true
    }
    return false
  }

  /** @category sync */
  applyRemoteBlock(editor: Editor<NBDataManipulator>, data: BlockData): void {
    const block = Block.decode(data)
    const version = this.block(block.blockID)?.version
    if (version && !isDifferent(version, block.version)) return

    this.synchronizer.subscribeRemoteBlock(editor, block)
    this.history.flush(block.blockID)
  }

  trackMergedNonce(blockID: BlockID, ctrbNonce: number): void {
    this.synchronizer.subscribeMergedNonce(blockID, ctrbNonce)
  }

  /** @category block getters */
  rootBlock(): Block & NoteBlock {
    if (!this._rootBlockID) {
      this._rootBlockID = (this.replica.findBlock(isNoteBlock) as NoteBlock | undefined)!.blockID
    }
    return this.block(this._rootBlockID!) as Block & NoteBlock
  }

  block(blockID: BlockID): Block {
    return this.replica.block(blockID)
  }

  childBlocks(blockID: BlockID, withDeleted: boolean = false): Block[] {
    return this.replica.childBlocks(blockID, withDeleted)
  }

  findBlock(predicate: (this: void, value: Block, index: number, obj: Block[]) => boolean): Block | undefined {
    return this.replica.findBlock(predicate)
  }

  prevSiblingBlock(blockID: BlockID, withDeleted?: boolean): Block | null {
    return this.replica.prevSiblingBlock(blockID, withDeleted)
  }

  nextSiblingBlock(blockID: BlockID, withDeleted?: boolean): Block | null {
    return this.replica.nextSiblingBlock(blockID, withDeleted)
  }

  prevBlock(blockID: BlockID, withDeleted?: boolean): Block | null {
    return this.replica.prevBlock(blockID, withDeleted)
  }

  nextBlock(blockID: BlockID, withDeleted?: boolean): Block | null {
    return this.replica.nextBlock(blockID, withDeleted)
  }

  /** @category extended getters */
  firstContentBlock(): Block | undefined {
    return this.firstChildBlock(this.rootBlock().blockID)
  }

  lastBlock(): Block {
    let parent: Block = this.rootBlock()
    let child: Block | undefined = parent
    while ((child = this.lastChildBlock(parent.blockID))) {
      parent = child
    }
    return parent
  }

  firstChildBlock(
    blockID: BlockID,
    withDeleted: boolean = false
  ): Block | undefined {
    return this.childBlocks(blockID, withDeleted)[0]
  }

  lastChildBlock(
    blockID: BlockID,
    withDeleted: boolean = false
  ): Block | undefined {
    const children = this.childBlocks(blockID, withDeleted)
    return children[children.length - 1]
  }

  nextTextBlock(blockID: BlockID): Block | null {
    let result = this.nextBlock(blockID)
    while (result && !result.hasText()) {
      result = this.nextBlock(result.blockID)!
    }
    return result
  }

  /** @category selection */
  selectedBlocks(start: BlockID, end: BlockID): Block[] {
    return lowLevel.selectedBlocks(this, start, end)
  }

  removeNoteBlockAndChildren(blocks: Block[]): Block[] {
    return lowLevel.removeNoteBlockAndChildren(blocks)
  }

  betweenBlockIDs(start: BlockID, end: BlockID): BlockID[] {
    return lowLevel.betweenBlockIDs(this, start, end)
  }

  reversedBetweenBlockIDs(start: BlockID, end: BlockID): BlockID[] {
    return lowLevel.reversedBetweenBlockIDs(this, start, end)
  }

  getAvailableOffset(blockID: BlockID, subPath?: SubPath): number | undefined {
    const block = this.block(blockID)
    switch (subPath?.type) {
    case "caption":
      return block.props[BlockPropKey.Caption]?.[1]?.length
    case "db": {
      if (!subPath.fieldID) return undefined
      const recordBlock = this.block(
        subPath.recordBlockID
      )
      const value =
        (recordBlock.props[BlockPropKey.DBRecord] as DBRecordProp)?.[
          subPath.fieldID
        ].VALUE?.[1]
      return typeof value === "string" ? value.length : undefined
    }
    default:
      return block.text?.length()
    }
  }
}

export type CustomBlockHandlers = {
  [blockKey: string]: PresenterBlockHandler & {
    insert: (operator: NBOperator, props: BlockProps) => BlockID | null;
    add: (
      operator: NBOperator,
      data: BlockContentData,
      inheritance: Inheritance,
      prevPoint?: Point,
      nextPoint?: Point,
    ) => Block | undefined;
    encoder: {
      encodeToText: (data: BlockContentData) => string;
      encodeToHTML: (data: BlockContentData) => string;
      encodeToMarkdown: (dataManipulator: NBDataManipulator, block: Block) => string;
      encodeToCustomData: (dataManipulator: NBDataManipulator, block: Block) => unknown;
    }
  }
}

const isDifferent = (a: BlockVersion, b: BlockVersion): boolean => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return true
  for (const replicaID of aKeys as any) {
    if (a[replicaID][0] !== b[replicaID][0] || a[replicaID][1] !== b[replicaID][1]) return true
  }
  return false
}