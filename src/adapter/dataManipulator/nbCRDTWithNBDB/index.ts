import type {Editor, ContextConfig, ReadOnlyOptions, PresenterBlockProps as RawPresenterBlockProps} from "@/domain"
import type {ReplicaData} from "@/adapter/dataManipulator/nbCRDT/crdt"

import {BlockType, UIHandler} from "@/domain"
import {addDBBlock} from "./operator/clipboard"
import {insertDBBlock} from "./operator"
import render from "./presenter/blockTypedContent"
import {NBDataManipulator} from "@/adapter/dataManipulator/nbCRDT"
import {customKeymap} from "./keymap"
import {NBDBParser, databaseBlockEncoder} from "./parser"
import {Templates} from "./state"
import {customDragHandlers} from "./state/drag"

import {customPopupHandler} from "./presenter/popup"

export class NBDBDataManipulator extends NBDataManipulator {
  constructor(editor: Editor, data: ReplicaData, templates: Templates) {
    const customBlockHandlers = {
      [BlockType.Database]: {
        add: addDBBlock,
        insert: insertDBBlock,
        render,
        encoder: databaseBlockEncoder(templates), /** @improve clipboard encoder, clipboard decoder, and html decoder are hardcoded in NBDBParser */
      }
    }
    const parser = new NBDBParser(editor.emitter, templates, customBlockHandlers)
    super({
      parser,
      customBlocks: customBlockHandlers,
      data,
    })
  }
}

export class NBDBContext extends UIHandler {
  constructor(cfg: ContextConfig) {
    super({
      ...cfg,
      customDrags: customDragHandlers,
      customPopups: customPopupHandler,
      customKeymap,
    })
    this.templates = new Templates(this.editor)
    this.state.changed.subscribe(this.templates)
  }

  readonly templates: Templates

  initialize(data: unknown, readOnly: ReadOnlyOptions | false = false): void {
    if (this.editor.initialized) throw new Error("already initialized")

    try {
      this.editor.load(new NBDBDataManipulator(this.editor, data as ReplicaData, this.templates), readOnly)
      this.editor.emitter.emitInitiated()
    } catch (err) {
      this.editor.emitter.emitError(err as Error)
    }
  }
}

export type PresenterBlockProps = RawPresenterBlockProps & {ctx: NBDBContext}