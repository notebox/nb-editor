export {uint32, uint32MAX} from "@notebox/nb-crdt"

export type UUID = string;

export type FileID = UUID;
export type BlobString = string;
export enum Unit {
  Character,
  Word,
  Line,
  Block,
}

export type Markdown = {
  markdown: string;
  resources: {fileID: string; caption: string; markdown: string}[];
};