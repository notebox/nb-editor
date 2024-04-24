import type {BlockID} from "@/domain/entity/block/common"
import type {NBDOMType} from "@/domain/entity/range"

/**
 * Types.
 */

// COMPAT: This is required to prevent TypeScript aliases from doing some very
// weird things for NBEditor types with the same name as globals. (2019/11/27)
// https://github.com/microsoft/TypeScript/issues/35002
type DOMNode = globalThis.Node;
type DOMComment = globalThis.Comment;
type DOMElement = globalThis.Element;
type DOMText = globalThis.Text;
type DOMRange = globalThis.Range;
type DOMSelection = globalThis.Selection;
type DOMStaticRange = globalThis.StaticRange;

export {
  DOMNode,
  DOMComment,
  DOMElement,
  DOMText,
  DOMRange,
  DOMSelection,
  DOMStaticRange,
}

export type DOMPoint = [Node, number];

/**
 * Returns the host window of a DOM node
 */

export const domDefaultView = (value: any): Window | null => {
  return (
    (value && value.ownerDocument && value.ownerDocument.defaultView) || null
  )
}

/**
 * Check if a DOM node is an element node.
 */

export const isDOMElement = (value: any): value is DOMElement => {
  return isDOMNode(value) && value.nodeType === 1
}

/**
 * Check if a value is a DOM node.
 */

export const isDOMNode = (value: any): value is DOMNode => {
  const window = domDefaultView(value)
  return !!window && value instanceof window.Node
}

export const domBlock = (blockID: BlockID): HTMLElement => {
  const domNode = window.document.querySelector(`[data-nb-block="${blockID}"]`)

  if (!domNode) {
    throw new Error(
      `Cannot resolve a DOM node from Block: ${JSON.stringify(blockID)}`
    )
  }

  return domNode as HTMLElement
}

export const domType = (
  rootBlockID: BlockID,
  target: EventTarget | null
): NBDOMType | null => {
  if (!isDOMNode(target)) return null

  let typedEl: DOMElement | null | undefined = isDOMElement(target)
    ? target
    : target.parentElement
  typedEl = typedEl?.closest("[data-nb-dom-type]")
  if (!typedEl) return null

  const type = typedEl.getAttribute("data-nb-dom-type") as NBDOMType

  return typedEl.closest("[data-nb-dom-type=\"editor\"]") ===
  domBlock(rootBlockID).closest("[data-nb-dom-type=\"editor\"]")
    ? type
    : null
}

export const getMaxEditorWidth = (): number => {
  const noteBlock = window.document.querySelector(
    "[data-nb-block-type=\"NOTE\"]"
  )!
  const noteTitle = noteBlock.querySelector("[data-nb-dom-type=\"text\"]")!
  return Number(window.getComputedStyle(noteTitle).width.replace("px", ""))
}

export const domDBTemplate = (dbTemplateBlockID: BlockID): HTMLElement => {
  const domDBTemplate =
  domBlock(dbTemplateBlockID).querySelector(".nb-db-container")

  if (!domDBTemplate) {
    throw new Error(
      `Cannot resolve a DOM node from Block: ${JSON.stringify(
        dbTemplateBlockID
      )}`
    )
  }

  return domDBTemplate as HTMLElement
}

export const domDBRecord = (
  domTemplate: HTMLElement,
  recordBlockID: BlockID
): HTMLElement => {
  const domDBRecord = domTemplate.querySelector(
    `.nb-db-record[data-nb-prop-value="${recordBlockID}"]`
  )

  if (!domDBRecord) {
    throw new Error(
      `Cannot resolve a DOM node from Block: ${JSON.stringify(recordBlockID)}`
    )
  }

  return domDBRecord as HTMLElement
}