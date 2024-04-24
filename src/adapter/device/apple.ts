import type {
  NBSelection,
  EditorEmitter,
  UploadFilePayload,
  NBFilePayload,
  PreviewRaw,
} from "@/domain"

import axios from "axios"
import {Uploader} from "@/domain/usecase/emitter/uploader"
import {prettifyError} from "./common"

export class AppleEmitter implements EditorEmitter {
  readonly uploader = new Uploader()

  private handlers: NBAppleMessageHandlers

  constructor() {
    this.handlers = (window as any).webkit!.messageHandlers as NBAppleMessageHandlers
  }

  emitError(err: Error): void {
    console.warn(err)
    this.handlers.nbError.postMessage(prettifyError(err))
    throw err
  }

  emitConnected(): void {
    this.handlers.nbConnected.postMessage(true)
  }

  emitInitiated(): void {
    this.handlers.nbInitiated.postMessage(true)
  }

  emitSelected(selection: NBSelection): void {
    this.handlers.nbSelected.postMessage(
      JSON.stringify(selection)
    )
  }

  emitContribute(ctrbs: unknown[]): void {
    this.handlers.nbContribute.postMessage(
      JSON.stringify(ctrbs)
    )
  }

  emitNavigate(url: string): void {
    this.handlers.nbNavigate.postMessage(url)
  }

  emitHaptic(): void {
    this.handlers.nbHaptic.postMessage(true)
  }

  emitDraggingStartByTouch(): void {
    this.handlers.nbDraggingStartByTouch.postMessage(true)
  }

  emitDraggingEndByTouch(): void {
    this.handlers.nbDraggingEndByTouch.postMessage(true)
  }

  emitSearchMode(isSearching: boolean): void {
    this.handlers.nbSearchMode.postMessage(isSearching)
  }

  emitFile(payload: UploadFilePayload) {
    this.handlers.nbUploadFile.postMessage(
      JSON.stringify(payload)
    )
  }

  fileURL(src: string | undefined, fileID: string | undefined): string {
    const query = src ? `src/?${src}` : `fileID/?${fileID}`
    return `nb-cache://image/${query}`
  }

  openFile(payload: NBFilePayload): void {
    this.handlers.nbOpenFile.postMessage(
      JSON.stringify(payload)
    )
  }

  async previewLink(url: string): Promise<PreviewRaw | undefined> {
    const res = await axios.get(`nb-cache://preview/?${url}`)
    return res?.data
  }
}


type NBAppleMessageHandlers = {
  [Property in keyof NBExternalMessageHandler]: {
    postMessage: NBExternalMessageHandler[Property];
  };
};
