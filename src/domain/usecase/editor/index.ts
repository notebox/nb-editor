import type {
  BlockID,
  BlockProps,
  BlockPropsDelta,
  Markdown,
  TextPropValue,
} from "@/domain/entity"
import type {EditorEmitter} from "../emitter"
import type {State, ReadOnlyOptions} from "../state"

import {BlockPropKey, BlockType, TextPropKey} from "@/domain/entity"
import {syncDOMSelection} from "@/domain/usecase/dom"
import {sanitizeLink} from "@/domain/usecase/sanitizer"
import {DataManipulator, Operator} from "../dataManipulator"
import {Selector} from "./selector"
import {Popup} from "../state/popup"

class Editor<DataType = unknown> {
  readonly state: State
  readonly emitter: EditorEmitter

  dataManipulator!: DataManipulator<DataType>
  selector!: Selector
  initialized = false

  constructor(emitter: EditorEmitter, state: State) {
    this.emitter = emitter
    this.state = state
  }

  load(dataManipulator: DataManipulator<DataType>, readOnly: false | ReadOnlyOptions): void {
    if (this.dataManipulator) {
      throw new Error("already-loaded")
    }
    this.dataManipulator = dataManipulator
    this.selector = new Selector(this.state, dataManipulator, this.emitter)
    this.state.readOnly = readOnly
    this.state.reRender()
    this.initialized = true
  }

  get loaded(): boolean {
    return !!this.dataManipulator
  }

  get rootBlockID(): BlockID {
    return this.dataManipulator.rootBlock().blockID
  }

  setReadOnly(bool: boolean): void {
    if (!bool) this.selector.blur()
    this.state.readOnly = bool && {
      expanded: false,
    }
    this.state.reRender()
  }

  newOperator() {
    return this.dataManipulator.newOperator(this)
  }

  commit(operator: Operator, withHistory = true): void {
    if (this.dataManipulator.commit(operator, withHistory)) {
      this.state.reRender()
    }
  }

  operate(op: (operator: Operator) => void, withHistory?: boolean): void {
    const operator = this.newOperator()
    op(operator)
    this.commit(operator, withHistory)
  }

  syncSelection = () => {
    syncDOMSelection(this)
    this.selector.report()
    this.selector.scrollToSelection(false)
  }

  /** @category sync */
  applyRemoteBlock(data: any): void {
    this.dataManipulator.applyRemoteBlock(this, data)
  }

  trackMergedNonce(blockID: BlockID, ctrbNonce: number): void {
    this.dataManipulator.trackMergedNonce(blockID, ctrbNonce)
  }

  /** @category insertBlock */
  insertImageBlock(
    key: BlockPropKey.Source | BlockPropKey.FileID,
    value: string
  ) {
    this.insertBlock({
      [BlockPropKey.TYPE]: BlockType.Image,
      [key]: value,
    } as BlockPropsDelta)
  }

  insertBlock(propsDelta: BlockPropsDelta) {
    this.operate(operator => {
      const props: BlockProps = {TYPE: [null, BlockType.Line]}
      Object.keys(propsDelta).forEach(propKey => {
        const propVal = propsDelta[propKey]
        if (propVal) {
          props[propKey] = [null, propVal]
        }
      })
      operator.insertBlock(props)
    })
  }

  /** @deprecated */
  insertLastNewLineIfNeeded() {
    const blocks = this.selector.target?.querySelectorAll(
      "[data-nb-dom-type=\"editor\"] [data-nb-block-type]"
    )
    const blockDOM = blocks?.[blocks.length - 1] as HTMLElement
    const blockType = blockDOM?.dataset["nb-block-type"] || "NOTE"
    if (UNSELECTABLE_BLOCKS.has(blockType)) {
      this.operate(operator =>
        operator.insertLineBlockBelow(blockDOM.dataset["nb-block"] as BlockID)
      )
    }
  }

  /** @category block prop */
  setBlockType(type: BlockType) {
    this.operate(operator => operator.setBlockType(type))
  }

  setBlockProp(
    blockID: BlockID,
    propKey: BlockPropKey,
    propVal: true | string | number | null
  ) {
    this.operate(operator => operator.setBlockProp(
      blockID,
      propKey,
      propKey === BlockPropKey.Link && propVal
        ? sanitizeLink(String(propVal))
        : propVal
    ))
  }

  setBlockProps(blockID: BlockID, propsDelta: BlockPropsDelta) {
    this.operate(operator => operator.setBlockProps(blockID, propsDelta))
  }

  moveBlocks(
    blockIDs: BlockID[],
    destination: { blockID: BlockID; toPrev: boolean }
  ): void {
    this.operate(operator => operator.movBlocks(blockIDs, destination))
  }

  /** @category format */
  format(propKey: TextPropKey, propVal: TextPropValue | null): void {
    if (!this.selector.selection) return
    if (propKey === TextPropKey.Link) {
      this.popupToLinkOnCurrentSelection()
      return
    }
    if (!this.selector.selection?.isCollapsed) {
      this.operate(operator => operator.format(propKey, propVal))
    }

    this.selector.updateInlineProps(propKey, propVal)
  }

  semFormat(propKey: TextPropKey): void {
    if (!this.selector.selection) return
    const current = this.selector.textProps
    switch (propKey) {
    case TextPropKey.Link:
      if (current[TextPropKey.Link]) {
        this.operate(operator => operator.format(propKey, null))
        this.selector.updateInlineProps(propKey, null)
      } else {
        this.popupToLinkOnCurrentSelection()
      }
      return
    case TextPropKey.ForegroundColor:
    case TextPropKey.BackgroundColor:
      return
    default:
      break
    }
    const propVal = current[propKey] ? null : true
    this.operate(operator => operator.format(propKey, propVal))
    this.selector.updateInlineProps(propKey, propVal)
    return
  }

  popup(payload: Omit<Popup, "editor"> | null, event?: React.MouseEvent) {
    if (!payload) {
      this.state.popup.dismiss()
      return
    }
    this.state.popup.present(this, {...payload}, event)
  }

  private popupToLinkOnCurrentSelection() {
    this.popup({
      type: "link-url-setter",
      meta: {
        purpose: {
          to: "text",
          range: this.selector.selection,
        },
      },
    })
  }

  insertSoftNewLine(): void {
    this.operate(operator => {
      operator.deleteSelection()
      operator.insertSoftNewLine()
    })
  }

  /** @category indentation */
  indent(): void {
    this.operate(operator => operator.indent())
  }

  dedent(): void {
    this.operate(operator => operator.dedent())
  }

  /** @category history */
  undo(): void {
    this.operate(operator => operator.undo(), false)
  }

  redo(): void {
    this.operate(operator => operator.redo(), false)
  }

  markdown(): Markdown {
    return this.dataManipulator.markdown()
  }
}

const UNSELECTABLE_BLOCKS = new Set<string>([BlockType.Database, BlockType.Divider, BlockType.Mermaid, BlockType.Linkblock])

export * from "./present"

export {Editor, ReadOnlyOptions}
