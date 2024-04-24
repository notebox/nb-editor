import type {DOMElement, DOMNode, EditorEmitter} from "@/domain"
import type {BlockContentData} from "@/adapter/dataManipulator/nbCRDT"
import type {INSContentData} from "@/adapter/dataManipulator/nbCRDT/crdt"

import {INSContent} from "@/adapter/dataManipulator/nbCRDT/crdt"
import {BlockType} from "@/domain/entity"
import {sanitizer} from "@/domain/usecase"

export class Decoder {
  constructor(emitter: EditorEmitter) {
    this.emitter = emitter
  }

  private emitter: EditorEmitter

  decodeDOMDocument(document: Document): BlockContentData[] {
    return this.decodeChildrenOfDOM(document)
  }

  decodeTypedDOMElement(el: DOMElement): BlockContentData[] | null {
    const imageElement = getImgOrLinkImgAsImg(el)
    if (imageElement) {
      return [this.makeImageBlockData(imageElement)]
    }
  
    const blockType = HTMLTagToBlockType[el.tagName]
  
    if (blockType || el.childElementCount === 0 || isTextDOM(el)) {
      const text = makeINSContentData(el)
      return text
        ? [{text, props: {TYPE: blockType || BlockType.Line}, children: []}]
        : []
    }
  
    const listType =
      el.tagName === "OL"
        ? BlockType.OrderedList
        : el.tagName === "UL"
          ? BlockType.UnorderedList
          : null
  
    if (listType) {
      return this.makeListBlockData(el, listType)
    }
  
    return null
  }

  private decodeDOMElement(el: DOMElement): BlockContentData[] {
    if (el.tagName === "HEAD" || !el.hasChildNodes) return []
    if (el.tagName === "BODY") return this.decodeChildrenOfDOM(el)
  
    return this.decodeTypedDOMElement(el) || this.decodeChildrenOfDOM(el)
  }

  private decodeChildrenOfDOM(parent: Document | DOMElement): BlockContentData[] {
    return Array.from(parent.children).reduce(
      (acc: BlockContentData[], cur: DOMElement) => {
        return acc.concat(this.decodeDOMElement(cur))
      },
      []
    )
  }

  private makeListBlockData(el: DOMElement, type: BlockType.OrderedList | BlockType.UnorderedList): BlockContentData[] {
    return Array.from(el.children).reduce((acc: BlockContentData[], cur) => {
      if (cur.tagName === "LI") {
        const content: BlockContentData = {
          props: {TYPE: type},
          children: [],
        }

        let text: INSContentData | null
        if (isTextDOM(cur)) {
          text = makeINSContentData(cur)
        } else {
          const children = Array.from(cur.children)
          if (!children[0] || !HTMLTagToBlockType[children[0].tagName]) {
            text = null
          } else {
            text = makeINSContentData(children.shift())
          }
          content.children = Array.from(cur.children).reduce(
            (acc: BlockContentData[], cur) => acc.concat(this.decodeDOMElement(cur)),
            []
          )
        }
        content.text = text || INSContent.from(" ").encode()

        return acc.concat(content)
      }
      return acc.concat(this.decodeDOMElement(cur))
    }, [])
  }

  private makeImageBlockData = (el: HTMLImageElement): BlockContentData => {
    if (el.src.startsWith("data:image/")) {
      return {
        props: {
          TYPE: BlockType.Image,
          FILE_ID: this.emitter.uploader.upload(this.emitter, el.src),
        },
        children: [],
      }
    } else {
      return {
        props: {
          TYPE: BlockType.Image,
          SRC: sanitizer.sanitizeURL(el.src),
        },
        children: [],
      }
    }
  }
}

const isTextDOM = (el: DOMElement): boolean => {
  if (el.tagName === "A") return true

  const lastNode = el.lastChild
  if (!lastNode) return false
  if (!isElement(lastNode)) return true
  if (getImgOrLinkImgAsImg(lastNode)) return false

  // only if all children are text DOM
  if (!HTMLInlineTagNames.has(lastNode.tagName)) return false
  for (const child of el.childNodes) {
    if (isElement(child) && !HTMLInlineTagNames.has(child.tagName)) return false
  }
  return true
}


const makeINSContentData = (
  el: DOMElement | undefined
): INSContentData | null => {
  const ins = el && makeAndConcatINSContent(el)
  if (ins && ins.text && ins.text !== " ") {
    return ins.encode()
  }
  return null
}

const makeAndConcatINSContent = (node: DOMNode): INSContent | null => {
  const textContent = node.textContent
  if (!textContent) return null

  if (!isElement(node) || !node.hasChildNodes) {
    return INSContent.from(textContent)
  }

  if (node.tagName === "BR") {
    return INSContent.from("\n")
  }

  if (isAnchorElement(node)) {
    return INSContent.decode([
      [[textContent.length, {A: sanitizer.sanitizeURL(node.href)}]],
      textContent,
    ])
  }

  return Array.from(node.childNodes).reduce(
    (acc: INSContent | null, cur: DOMNode) => {
      const child = makeAndConcatINSContent(cur)
      return child ? (acc ? acc.concat(child) : child) : acc
    },
    null
  )
}

const HTMLTagToBlockType: {[key: string]: BlockType | undefined} = {
  H1: BlockType.Header1,
  H2: BlockType.Header2,
  H3: BlockType.Header3,
  BLOCKQUOTE: BlockType.Blockquote,
  CODE: BlockType.Codeblock,
  /** @verbose belows are the adopted tags */
  P: BlockType.Line,
  H4: BlockType.Header3,
  H5: BlockType.Header3,
  H6: BlockType.Header3,
  IMG: BlockType.Image,
}

const HTMLInlineTagNames = new Set<string>([
  "A",
  "ABBR",
  "ACRONYM",
  "B",
  "BDO",
  "BIG",
  // 'BR',
  // 'BUTTON',
  // 'CITE',
  // 'CODE',
  "DFN",
  "EM",
  "I",
  // 'IMG',
  // 'INPUT',
  "KBD",
  "LABEL",
  "MAP",
  "OBJECT",
  "OUTPUT",
  "Q",
  "SAMP",
  "SCRIPT",
  "LABEL",
  "SMALL",
  "SPAN",
  "STRONG",
  "SUB",
  "SUP",
  // 'TEXTAREA',
  "TIME",
  "TT",
  "VAR",
])

/** @dev return <img /> or <a><img /></a> as <img /> */
const getImgOrLinkImgAsImg = (el: DOMElement): HTMLImageElement | undefined => {
  if (isImageElement(el)) return el
  if (isAnchorElement(el) && el.children.length === 1) {
    const child = el.children[0]
    if (isImageElement(child)) return child
  }
  return undefined
}

const isImageElement = (el: DOMElement): el is HTMLImageElement => {
  return el.tagName === "IMG"
}

const isAnchorElement = (el: DOMElement): el is HTMLAnchorElement => {
  return el.tagName === "A"
}

const isElement = (node: DOMNode): node is DOMElement => {
  return node.nodeType === 1
}
