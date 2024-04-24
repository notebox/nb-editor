import type {
  SubPath, 
  BlockID, 
  NBRange, 
  NBBlock,
  NoteBlock,
  Markdown,
} from "@/domain/entity"
import type {Editor, PresenterBlockProps} from "../."
import type {Operator} from "./operator"

export * from "./operator"
export interface DataManipulator<BlockData = unknown> {
  getTextProps(selection: NBRange | null): Dictionary | undefined
  getHistoryProps(): {isUndoable: boolean, isRedoable: boolean}
  getIndentationProps(range?: NBRange): {isIndentable: boolean; isDedentable: boolean}

  /** @presenter */
  renderCustomBlock(props: PresenterBlockProps): JSX.Element | undefined

  /** @category output */
  markdown(): Markdown
  plaintext(): string
  html(): string

  /** @category operate */
  newOperator(editor: Editor): Operator
  commit(operator: Operator, withHistory?: boolean): boolean

  /** @category block getters */
  rootBlock(): NoteBlock
  block(blockID: BlockID): NBBlock
  childBlocks(blockID: BlockID, withDeleted?: boolean): NBBlock[]
  findBlock(predicate: (this: void, value: NBBlock, index: number, obj: NBBlock[]) => boolean): NBBlock | undefined;
  prevSiblingBlock(blockID: BlockID, withDeleted?: boolean): NBBlock | null
  nextSiblingBlock(blockID: BlockID, withDeleted?: boolean): NBBlock | null
  prevBlock(blockID: BlockID, withDeleted?: boolean): NBBlock | null
  nextBlock(blockID: BlockID, withDeleted?: boolean): NBBlock | null

  /** @category extended getters */
  lastBlock(): NBBlock
  firstChildBlock(blockID: BlockID, withDeleted?: boolean): NBBlock | undefined
  lastChildBlock(blockID: BlockID, withDeleted?: boolean): NBBlock | undefined
  nextTextBlock(blockID: BlockID): NBBlock | null

  /** @category selection */
  selectedBlocks(start: BlockID, end: BlockID): NBBlock[]
  removeNoteBlockAndChildren(blocks: NBBlock[]): NBBlock[]
  betweenBlockIDs(start: BlockID, end: BlockID): BlockID[]
  reversedBetweenBlockIDs(start: BlockID, end: BlockID): BlockID[]
  getAvailableOffset(blockID: BlockID, subPath?: SubPath): number | undefined

  /** @category sync */
  applyRemoteBlock(editor: Editor, data: BlockData): void
  trackMergedNonce(blockID: BlockID, ctrbNonce: number): void
}