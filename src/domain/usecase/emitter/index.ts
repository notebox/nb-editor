import type {
  NBSelection,
  BlockID,
  BlockPropsDelta,
  FileID,
  BlobString,
  BlockPropKey,
} from "@/domain/entity"
import type {Uploader} from "./uploader"
import type {CustomKeymapHandler} from "../uiHandler/keymap"

export interface EditorEmitter {
  readonly uploader: Uploader;

  emitError(err: any): void;
  emitConnected(): void;
  emitInitiated(): void;
  emitSelected(selection: NBSelection): void;
  emitContribute(ctrbs: unknown[]): void;
  emitNavigate(url: string): void;
  emitHaptic(): void;
  emitDraggingStartByTouch(): void;
  emitDraggingEndByTouch(): void;
  emitFile(payload: UploadFilePayload): void;
  emitSearchMode(isSearching: boolean): void;
  fileURL(src: string | undefined, fileID: string | undefined): string;
  openFile(payload: NBFilePayload): void;
  previewLink(url: string): Promise<PreviewRaw | undefined>;
  keymap?: CustomKeymapHandler;
}

export type BlockPropPayload = {
  blockID: BlockID;
  propKey: BlockPropKey;
  propVal: BlockPropsDelta[BlockPropKey];
};

export type UploadFilePayload = {
  fileID: FileID;
  blobString: BlobString;
};

export type NBFilePayload = {
  fileID: FileID;
  title?: string;
};

export type PreviewRaw = {
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
};