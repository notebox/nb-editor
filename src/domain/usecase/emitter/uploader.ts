import type {FileID} from "@/domain/entity"
import type {EditorEmitter} from "@/domain/usecase/emitter"

import {v4 as uuid} from "uuid"

export class Uploader {
  uploadingFileIDs = new Set<FileID>()

  upload(emitter: EditorEmitter, file: File | string): FileID {
    const fileID = uuid().toUpperCase()
    if (typeof file === "string") {
      emitter.emitFile({
        fileID,
        blobString: file,
      })
    } else {
      this.uploadFile(emitter, fileID, file)
    }
    return fileID
  }

  release(fileID: FileID): void {
    this.uploadingFileIDs.delete(fileID)
  }

  private async uploadFile(emitter: EditorEmitter, fileID: FileID, file: File) {
    const uploadingFileIDs = this.uploadingFileIDs
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const blobString = reader.result?.toString()
      if (blobString) {
        emitter.emitFile({fileID, blobString})
      } else {
        uploadingFileIDs.delete(fileID)
      }
    }
    reader.onerror = () => {
      uploadingFileIDs.delete(fileID)
    }
  }
}
