
import type {FileID} from "@/domain/entity"
import type {BlockContentData, Parser} from "@/adapter/dataManipulator/nbCRDT"

import {INSContent} from "../crdt"
import {BlockType} from "@/domain/entity"

export const decodeToBlocks = (parser: Parser, data: DataTransfer): BlockContentData[] => {
  const strBlockData = data.getData("data/nb-stringified")
  if (strBlockData) {
    const result = JSON.parse(strBlockData)
    return Array.isArray(result)
      ? result
      : [
        {
          props: {
            TYPE: BlockType.Line,
          },
          text: INSContent.from(data.getData("text/plain")).encode(),
          children: [],
        },
      ]
  }

  if (data.files.length) {
    const imageFileIDs = Array.from(data.files).reduce<FileID[]>((acc, cur) => {
      if (cur.type.startsWith("image")) {
        acc.push(parser.emitter.uploader.upload(parser.emitter, cur))
        return acc
      } else {
        return acc
      }
    }, [])

    if (imageFileIDs.length) {
      return imageFileIDs.map(fileID => ({
        props: {
          TYPE: BlockType.Image,
          FILE_ID: fileID,
        },
        children: [],
      }))
    }
  }

  const uri = data.getData("text/uri-list")
  if (uri) {
    return [
      {
        props: {
          TYPE: BlockType.Linkblock,
          LINK: uri,
        },
        children: [],
      },
    ]
  }

  const html = data.getData("text/html")
  if (html) {
    const document = new DOMParser().parseFromString(html, "text/html")
    return parser.decodeDOMDocument(document)
  }

  const text = data.getData("text/plain")
  if (text) {
    return [
      {
        props: {
          TYPE: BlockType.Line,
        },
        text: INSContent.from(data.getData("text/plain")).encode(),
        children: [],
      },
    ]
  }

  return []
}
