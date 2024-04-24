import type {uint32} from "../common"
import type {BlockID} from "./common"
import type {TextProps} from "./props"

import {v4 as uuid} from "uuid"
import {BlockType, BlockProps} from "./props"

export * from "./common"
export * from "./props"

export const genBlockID = () => uuid().toUpperCase()

export interface NBSpanContentLeaf {
  length: number
  props?: TextProps
}

export interface NBSpanContent {
  text?: string
  isMeta(): boolean
  toTextWithMetaPlaceholder(): string
  attributes: {
    leaves: NBSpanContentLeaf[]
  }
}

export interface NBSpan {
  content: NBSpanContent
}

export interface NBSpans extends Array<NBSpan> {
  splitAt(offset: number): [left: NBSpans, right: NBSpans];
  textLength(): number;
  toString(): string;
}
export interface NBText {
  spans(): NBSpans;
  subSpans(start: uint32, end: uint32): NBSpans;
  length(): number;
  toString(): string;
}

export interface NBBlock {
    blockID: BlockID;
    // version: BlockVersion;
    // point: Point;
    props: BlockProps;
    isDeleted: boolean;
    type: string;
    text?: NBText;
    parentBlockID?: BlockID;
    hasText(): this is TextBlock
}

export type NoteBlock = NBBlock & {parentBlockID?: undefined; text: Text};
export type TextBlock = NBBlock & {
    text: NBText;
};

export type ContentBlock = NBBlock & {
  type: BlockType;
  parentBlockID: BlockID;
};
export type BasicTextBlock = NBBlock & {
  text: Text;
  type:
    | BlockType.Line
    | BlockType.Header1
    | BlockType.Header2
    | BlockType.Header3
    | BlockType.UnorderedList
    | BlockType.OrderedList
    | BlockType.CheckList
    | BlockType.Blockquote;
};

const basicTextBlockWhitelist: {[key: string]: boolean} = {
  [BlockType.Line]: true,
  [BlockType.Header1]: true,
  [BlockType.Header2]: true,
  [BlockType.Header3]: true,
  [BlockType.UnorderedList]: true,
  [BlockType.OrderedList]: true,
  [BlockType.CheckList]: true,
  [BlockType.Blockquote]: true,
}

const removableTextBlockWhitelist: {[key: string]: boolean} = {
  [BlockType.Line]: false,
  [BlockType.Header1]: true,
  [BlockType.Header2]: true,
  [BlockType.Header3]: true,
  [BlockType.UnorderedList]: true,
  [BlockType.OrderedList]: true,
  [BlockType.CheckList]: true,
  [BlockType.Blockquote]: true,
  [BlockType.Codeblock]: true,
  [BlockType.Mermaid]: true,
}

const inheritingBlockWhitelist: {[key: string]: boolean} = {
  [BlockType.Line]: true,
  [BlockType.UnorderedList]: true,
  [BlockType.OrderedList]: true,
  [BlockType.CheckList]: true,
  [BlockType.DBRecord]: true,
}

const nonTextBlock: {[key: string]: boolean} = {
  [BlockType.Image]: true,
  [BlockType.Divider]: true,
  [BlockType.Database]: true,
  [BlockType.DBRecord]: true,
}

export const isNoteBlock = (block: NBBlock): block is NoteBlock => {
  return !block.parentBlockID
}

/**
 * isIndentable returns whether the blockType allows any block to be child.
 */
export const isBasicTextBlock = (block: NBBlock): block is BasicTextBlock => {
  return isBasicTextBlockType(block.type)
}

export const isBasicTextBlockType = (blockType: string): boolean => {
  return basicTextBlockWhitelist[blockType] || false
}

/**
 * isAllowAnyChildBlock returns whether the block allows any block to be child.
 */
export const isAllowAnyChildBlock = (block: NBBlock): boolean => {
  return isNoteBlock(block) || isBasicTextBlock(block)
}

/**
 * isRemovableBlockType returns whether the block allows to set Line type.
 */
export const isRemovableBlockType = (blockType: string): boolean => {
  return removableTextBlockWhitelist[blockType] || false
}

/**
 * isInheritingBlockType returns whether the block inherits the type to the new block.
 */
export const isInheritingBlockType = (blockType: string): boolean => {
  return inheritingBlockWhitelist[blockType] || false
}

/**
 * isNonTextBlockType returns whether the block is not the TextBlock.
 */
export const isNonTextBlockType = (blockType: string): boolean => {
  return nonTextBlock[blockType] || false
}
