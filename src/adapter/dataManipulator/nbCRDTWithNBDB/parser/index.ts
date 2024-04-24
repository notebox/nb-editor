import type {NBRange, EditorEmitter} from "@/domain"
import type {BlockContentData, CustomBlockHandlers} from "@/adapter/dataManipulator/nbCRDT"
import type {Block} from "@/adapter/dataManipulator/nbCRDT/crdt"
import type {Templates} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import {BlockType} from "@/domain"
import {encodeToHTML} from "./html"
import {encodeToMarkdown} from "./markdown"
import {encodeToBlockContentData, NBDBContent} from "./data"

import {Parser} from "@/adapter/dataManipulator/nbCRDT/parser"
import {encodeNBDBToClipboardData, decodeToNBDBBlockProps} from "./clipboard"
import {NBDataManipulator} from "../../nbCRDT"
import {HTMLDecoder} from "./html/decoder"

export class NBDBParser extends Parser {
  constructor(emitter: EditorEmitter, templates: Templates, customBlocks: CustomBlockHandlers) {
    super(emitter, customBlocks, new HTMLDecoder(emitter))
    this.templates = templates
  }

  private templates: Templates

  encodeToClipboardData(dataManipulator: NBDataManipulator, selection: NBRange) {
    return encodeNBDBToClipboardData(this.templates, selection) || super.encodeToClipboardData(dataManipulator, selection)
  }

  decodeClipboardData(dt: DataTransfer, selection: NBRange) {
    return decodeToNBDBBlockProps(this.templates, selection, dt) || super.decodeClipboardData(dt, selection)
  }
}

export const databaseBlockEncoder = (templates: Templates) => ({
  encodeToText: (data: BlockContentData): string => {
    return encodeToMarkdown(data.custom?.[BlockType.Database] as NBDBContent | undefined, data.props.CAPTION)
  },
  encodeToHTML: (data: BlockContentData): string => {
    return encodeToHTML(data)
  },
  encodeToMarkdown: (dataManipulator: NBDataManipulator, block: Block): string => {
    return encodeToMarkdown(
      encodeToBlockContentData(templates, dataManipulator, block),
      block.props.CAPTION?.[1],
    )
  },
  encodeToCustomData: (dataManipulator: NBDataManipulator, block: Block): unknown => {
    return encodeToBlockContentData(templates, dataManipulator, block)
  }
})