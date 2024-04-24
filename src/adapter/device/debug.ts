import type {
  FileID,
  BlobString,
  NBSelection,
  Theme,
  EditorEmitter,
  ReadOnlyOptions,
  UploadFilePayload,
  NBFilePayload,
  PreviewRaw,
} from "@/domain"

import {v4 as uuid} from "uuid"
import {uint32MAX, NoteBlockType} from "@/domain"
import {Uploader} from "@/domain/usecase/emitter/uploader"
import {prettifyError} from "./common"

export class DebugEmitter implements EditorEmitter {
  readonly uploader = new Uploader()

  emitError(err: Error): void {
    console.warn(err)
    if (debugOptions.log) {
      console.debug("device emitError")
      console.debug(prettifyError(err))
      console.debug(err)
    }
    throw err
  }

  emitConnected(): void {
    console.debug("device emitConnected")
    window.notebox.setTheme(debugOptions.theme)
    window.notebox.init(debugOptions.state, debugOptions.readOnly)
  }

  emitInitiated(): void {
    console.debug("device emitInitiated")
  }

  emitSelected(selection: NBSelection): void {
    if (debugOptions.log) {
      console.debug("device emitSelected")
      console.debug(selection)
    }
  }

  emitContribute(ctrbs: unknown[]): void {
    if (debugOptions.log) {
      console.debug("device emitContribute")
      console.debug(ctrbs)
    }
  }

  emitNavigate(url: string): void {
    window.open(url)
    if (debugOptions.log) {
      console.debug("device emitNavigate")
      console.debug(url)
    }
  }

  emitHaptic(): void {
    console.debug("device emitHaptic")
  }

  emitDraggingStartByTouch(): void {
    console.debug("device emitDraggingStartByTouch")
  }

  emitDraggingEndByTouch(): void {
    console.debug("device emitDraggingEndByTouch")
  }

  emitSearchMode(isSearching: boolean): void {
    console.debug(`device emitSearchMode(${isSearching})`)
  }

  emitFile(payload: UploadFilePayload): void {
    files[payload.fileID] = payload.blobString
    window.notebox.markUploadedFile(payload.fileID)
  }

  fileURL(src: string | undefined, fileID: string | undefined): string {
    return src || files[fileID as FileID]!
  }

  openFile(payload: NBFilePayload): void {
    console.debug(payload)
  }

  async previewLink(_url: string): Promise<PreviewRaw | undefined> {
    return
  }
}

const files: {[fileID: string]: BlobString} = {}

export const debugOptions: {
  log: boolean;
  theme: Theme;
  readOnly: ReadOnlyOptions | false;
  state: unknown;
} = {
  log: false,
  theme: "black",
  readOnly: false,
  state: {
    replicaID: uint32MAX,
    blocks: [
      [
        uuid(),
        {},
        [[0, 0, 1]],
        {
          TYPE: [null, NoteBlockType],
        },
        false,
        [],
      ],
    ],
  },
}

// MERMAID EXAMPLES
// debugOptions.state = require('@/demo/mermaid.json');
// debugOptions.readOnly = {expanded: true};

// BASIC EXAMPLES
import {stateData} from "@/demo/basics"
debugOptions.state = stateData
