import type {
  NBSelection,
  EditorEmitter,
  UploadFilePayload,
  NBFilePayload,
  PreviewRaw,
} from "@/domain"
import type {ExternalEventHandler} from "@/domain/usecase/uiHandler/external"
import type {CustomKeymapHandler} from "@/domain/usecase/uiHandler/keymap"

import {Uploader} from "@/domain/usecase/emitter/uploader"
import {prettifyError} from "./common"

export class IframeEmitter implements EditorEmitter {
  readonly uploader = new Uploader()

  private identifier: string
  private handler: NBIframeExternalMessageHandler

  constructor() {
    this.identifier = window.name
    this.handler = (window.parent as any).nbExternalMessageHandler
  }

  get keymap(): CustomKeymapHandler | undefined {
    return this.handler.keymap
  }

  emitError(err: Error): void {
    console.warn(err)
    this.handler.nbError(this.identifier, prettifyError(err))
    throw err
  }

  emitConnected(): void {
    this.handler.nbConnected(this.identifier, true)
  }

  emitInitiated(): void {
    this.handler.nbInitiated(this.identifier, true)
  }

  emitSelected(selection: NBSelection): void {
    this.handler.nbSelected(this.identifier, JSON.stringify(selection))
  }

  emitContribute(ctrbs: unknown[]): void {
    this.handler.nbContribute(this.identifier, JSON.stringify(ctrbs))
  }

  emitNavigate(url: string): void {
    this.handler.nbNavigate(this.identifier,url)
  }

  emitHaptic(): void {
    this.handler.nbHaptic(this.identifier,true)
  }

  emitDraggingStartByTouch(): void {
    this.handler.nbDraggingStartByTouch(this.identifier,true)
  }

  emitDraggingEndByTouch(): void {
    this.handler.nbDraggingEndByTouch(this.identifier, true)
  }

  emitSearchMode(isSearching: boolean): void {
    this.handler.nbSearchMode(this.identifier, isSearching)
  }

  emitFile(payload: UploadFilePayload) {
    this.handler.nbUploadFile(this.identifier, JSON.stringify(payload))
  }

  fileURL(src: string | undefined, fileID: string | undefined): string {
    return this.handler.fileURL(this.identifier, src, fileID)
  }

  openFile(payload: NBFilePayload): void {
    this.handler.nbOpenFile(this.identifier, JSON.stringify(payload))
  }

  async previewLink(url: string): Promise<PreviewRaw | undefined> {
    return this.handler.previewLink(this.identifier, url)
  }
}

export interface NBIframeExternalMessageHandler {
  nbError(identifier: string, err: string): void
  nbConnected(identifier: string, connected: boolean): void
  nbInitiated(identifier: string, initiated: boolean): void
  nbSelected(identifier: string, selection: string): void
  nbContribute(identifier: string, ctrbs: string): void
  nbNavigate(identifier: string, url: string): void
  nbUploadFile(identifier: string, json: string): void
  nbHaptic(identifier: string, haptic: boolean): void
  nbDraggingStartByTouch(identifier: string, dragging: boolean): void
  nbDraggingEndByTouch(identifier: string, bool: boolean): void
  nbSearchMode(identifier: string, bool: boolean): void
  nbOpenFile(identifier: string, json: string): void
  fileURL(identifier: string, src: string | undefined, fileID: string | undefined): string
  previewLink(identifier: string, url: string): Promise<PreviewRaw | undefined>
  keymap?: CustomKeymapHandler
}

export type NBIframeWindow = Window & {notebox: ExternalEventHandler}