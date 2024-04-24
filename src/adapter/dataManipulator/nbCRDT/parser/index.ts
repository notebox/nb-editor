import type {NBRange, BlockID, BlockPropsDelta, EditorEmitter} from "@/domain"
import type {NBDataManipulator, CustomBlockHandlers} from ".."
import type {Block} from "../crdt"

import {selectedBlocks} from "../operator/command/lowLevel"
import * as html from "./html"
import * as data from "./data"
import * as text from "./text"
import * as markdown from "./markdown"
import * as clipboard from "./clipboard"

export type BlockContentData = data.BlockContentData;

export class Parser {
  readonly emitter: EditorEmitter
  private customBlocks: CustomBlockHandlers
  private htmlDecoder: html.Decoder

  constructor(
    emitter: EditorEmitter,
    customBlocks: CustomBlockHandlers,
    htmlDecoder: html.Decoder = new html.Decoder(emitter),
  ) {
    this.emitter = emitter
    this.customBlocks = customBlocks
    this.htmlDecoder = htmlDecoder
  }

  encodeToBlockContentData(dataManipulator: NBDataManipulator, blocks: Block[], range?: NBRange): BlockContentData[] {
    return data.encode(dataManipulator, this.customBlocks, blocks, range)
  }

  encodeToText(dataset: BlockContentData[]) {
    return text.encode(this.customBlocks, dataset)
  }
  encodeToHTML(dataset: BlockContentData[]) {
    return html.encode(this.customBlocks, dataset)
  }

  encodeToClipboardData(dataManipulator: NBDataManipulator, selection: NBRange): EncodedClipboardData {
    const blocks = selectedBlocks(
      dataManipulator,
      selection.start.blockID,
      selection.end.blockID
    )

    const content = this.encodeToBlockContentData(dataManipulator, blocks, selection)
    return {
      dataNBStringified: JSON.stringify(content),
      textHTML: this.encodeToHTML(content),
      textPlain: this.encodeToText(content),
    }
  }

  encodeToMarkdown(dataManipulator: NBDataManipulator) {
    return markdown.encode(dataManipulator)
  }

  decodeDOMDocument(el: Document) {
    return this.htmlDecoder.decodeDOMDocument(el)
  }

  decodeClipboardData(dt: DataTransfer, _selection: NBRange): DecodedClipboardData {
    return {
      type: "blocks",
      blocks: clipboard.decodeToBlocks(this, dt),
    }
  }
}

export type DecodedClipboardData = |
{
  type: "blocks",
  blocks: BlockContentData[],
} |
{
  type: "props",
  blockID: BlockID,
  delta: BlockPropsDelta,
} |
{
  type: "invalid",
}

export interface EncodedClipboardData {
  dataNBStringified: string;
  textHTML: string;
  textPlain: string;
}
