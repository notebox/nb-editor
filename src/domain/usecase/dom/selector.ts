import type {BlockID, SubPath} from "@/domain/entity"
import type {DOMText, DOMPoint, DOMRange, DOMElement, DOMNode} from "./common"

import {NBPoint, NBRange} from "@/domain/entity"
import {IS_FIREFOX} from "@/utils/environment"
import {domBlock, isDOMElement} from "./common"

const getAllTextNodes = (node: DOMNode): DOMText[] => {
  let result: DOMText[] = []
  node.childNodes.forEach(childNode => {
    if (childNode.nodeType === 3) {
      result.push(childNode as DOMText)
    } else {
      result = result.concat(getAllTextNodes(childNode))
    }
  })
  return result
}

const domBlockProp = (blockID: BlockID, subPath: SubPath): HTMLElement => {
  let result = domBlock(blockID)
  switch (subPath.type) {
  case "caption":
    result = result.querySelector("[data-nb-prop-type=\"caption\"]")!
    break
  case "db":
    result = result
      .querySelector(`[data-nb-prop-value="${subPath.recordBlockID}"]`)!
      .querySelector(`[data-nb-prop-value="${subPath.fieldID}"]`)!
    break
  }
  return result
}


const _syncDOMSelection = (ctx: IContext): void => {
  const {selection} = ctx.selector
  const domSelection = window.getSelection()
  if (ctx.state.working.composing || !domSelection || !ctx.selector.isFocused) {
    return
  }
  const hasDomSelection = domSelection.type !== "None"
  if (!selection && !hasDomSelection) {
    return
  }

  /** @verbose verify that the dom selection is in the editor */
  const editorElement = domBlock(ctx.rootBlockID)
  let hasDomSelectionInEditor = false
  if (
    editorElement.contains(domSelection.anchorNode) &&
    editorElement.contains(domSelection.focusNode)
  ) {
    hasDomSelectionInEditor = true
  }

  if (
    hasDomSelection &&
    hasDomSelectionInEditor &&
    selection &&
    domSelection.rangeCount > 0
  ) {
    const range = domSelection.getRangeAt(0)
    if (
      /** @bug to handle Safari invalid focusOffset without on selection change event */
      !(
        range.startOffset === 0 &&
        range.endOffset === 0 &&
        domSelection.focusOffset !== 0
      )
    ) {
      if (domToNBRange(range)?.equals(selection)) return
    }
  }

  /** @verbose update DOM selection */
  const el = domBlock(ctx.rootBlockID)
  ctx.selector.isUpdatingSelection = true

  const newDomRange = selection && textingDomFromNBRange(selection)
  if (newDomRange && selection) {
    if (selection.start.offset != null && selection.end.offset != null) {
      domSelection.setBaseAndExtent(
        newDomRange.startContainer,
        newDomRange.startOffset,
        newDomRange.endContainer,
        newDomRange.endOffset
      )
    } else if (selection.start.subPath?.type === "caption") {
      /** @todo do I need this? */
      domSelection.removeAllRanges()
      const input = domBlockProp(
        selection.start.blockID,
        selection.start.subPath
      )
      input.focus()
    }
  } else {
    domSelection.removeAllRanges()
  }
  syncDOMSelectionHook(ctx, newDomRange, el)
}

const syncDOMSelectionHook = async (
  ctx: IContext,
  newDOMRange: Range | null,
  el: HTMLElement
) => {
  /**
   * @compat In Firefox, it's not enough to create a range, you also need
   * to focus the contenteditable element too. (2016/11/16)
   */
  if (IS_FIREFOX && newDOMRange) {
    el.focus()
  }
  ctx.selector.isUpdatingSelection = false
}

const getDOMTextDIV = (domBlock: DOMElement): DOMElement | null => {
  return domBlock.querySelector("[data-nb-dom-type=\"text\"]")
}

const domToNBPoint = (domPoint: DOMPoint): NBPoint | null => {
  const [domNode, domNodeOffset] = domPoint
  let isInsideBoundary = false
  let domEl = isDOMElement(domNode) ? domNode : domNode.parentElement!

  /** @category block.props */
  if (
    domEl.getAttribute("data-nb-dom-type") === "prop" &&
    domEl.getAttribute("data-nb-prop-type") === "caption"
  ) {
    const blockID = domEl
      .closest("[data-nb-block]")
      ?.getAttribute("data-nb-block")
    if (!blockID) return null
    return new NBPoint({
      blockID,
      subPath: {type: "caption"},
      offset: domNodeOffset,
      isInsideBoundary: true,
    })
  }

  if (domEl.getAttribute("data-nb-prop-type") === "db-cell") {
    const fieldID = domEl.getAttribute("data-nb-prop-value")
    if (!fieldID) return null
    domEl = domEl.parentElement!.closest("[data-nb-dom-type=\"prop\"]")!
    const recordBlockID = domEl.getAttribute("data-nb-prop-value")
    if (!recordBlockID) return null
    const blockID = domEl
      .closest("[data-nb-block]")
      ?.getAttribute("data-nb-block")
    if (!blockID) return null
    return new NBPoint({
      blockID,
      subPath: {type: "db", recordBlockID, fieldID},
      offset: domNodeOffset,
      isInsideBoundary: true,
    })
  }

  /** @category block.text */
  const domText = domEl.closest("[data-nb-dom-type=\"text\"]")
  if (!domText) return null

  domEl = domText.parentElement!.closest("[data-nb-dom-type]")!
  if (domEl.getAttribute("data-nb-dom-type") === "boundary") {
    isInsideBoundary = true
    domEl = domEl.parentElement!.closest("[data-nb-dom-type]")!
  }

  const domBlock = domEl.closest("[data-nb-block]")!
  const blockID = domBlock.getAttribute("data-nb-block")! as BlockID
  const firstNode = getDOMTextDIV(domBlock)?.childNodes[0]
  let offset = 0

  // defense code
  if (!firstNode || !window.getSelection) {
    return new NBPoint({blockID, offset})
  }

  // get offset considering multiple leaves
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0).cloneRange()
    range.selectNodeContents(firstNode)
    range.setStart(firstNode, 0)
    range.setEnd(domNode, domNodeOffset)
    offset = range.toString().length
  }

  const point = new NBPoint({
    blockID,
    offset,
    isInsideBoundary,
  })
  return point
}

const textingDomFromNBRange = (range: NBRange): DOMRange => {
  const domRange = window.document.createRange()
  const start = textingDomFromNBPoint(range.start)
  const end = textingDomFromNBPoint(range.end)
  if (start) {
    domRange.setStart(start[0], start[1])
  }
  if (end) {
    domRange.setEnd(end[0], end[1])
  }
  return domRange
}

const textingDomFromNBPoint = (point: NBPoint): DOMPoint | null => {
  if (!point.isTextEditable) return null
  const el = domSubPathElOrBlockElFromNBPoint(point)
  if (!el) return null

  /** @category block-prop */
  if (point.subPath) return [el.childNodes?.[0] ?? el, point.offset!]

  /** @category block-text */
  const domTextDIV = getDOMTextDIV(el)
  if (!domTextDIV) return [el, 0]

  const leaves = domTextDIV.childNodes
  const leavesCount = leaves.length
  if (leavesCount < 1) return [domTextDIV, 0]

  return domRangeFromHTML(domTextDIV, point.offset)
}

const domSubPathElOrBlockElFromNBPoint = (
  point: NBPoint
): DOMElement | null => {
  const el = domBlock(point.blockID)

  /** @category block-text */
  if (!point.subPath) return el

  /** @category block-prop */
  switch (point.subPath.type) {
  case "caption":
    return el.querySelector("[data-nb-prop-type=\"caption\"]")!
  case "db":
    return el
      .querySelector(`[data-nb-prop-value="${point.subPath.recordBlockID}"]`)!
      .querySelector(`[data-nb-prop-value="${point.subPath.fieldID}"]`)!
  default:
    return null
  }
}

export const domRangeFromHTML = (el: Element, offset?: number): DOMPoint => {
  const leaves = el.childNodes
  const leavesCount = leaves.length
  if (leavesCount < 1) return [el, 0]

  let domOffset = offset!
  let domTextNode: DOMText
  const domTextNodes: DOMText[] = getAllTextNodes(el)
  for (let index = 0; index < domTextNodes.length; index++) {
    domTextNode = domTextNodes[index]
    if (domTextNode.length < domOffset) {
      domOffset -= domTextNode.length
    } else {
      break
    }
  }

  return [domTextNode!, domOffset]
}

export const domFocus = (dom: HTMLElement): void => {
  if (window.document.activeElement !== dom) {
    dom.focus({preventScroll: true})
  }
}

export const domBlur = (): void => {
  (window.document.activeElement as HTMLElement)?.blur()
}

export const domDeselect = (): void => {
  const domSelection = window.getSelection()
  if (domSelection && domSelection.rangeCount > 0) {
    domSelection.removeAllRanges()
  }
}

export const domToNBRange = (domRange: DOMRange | StaticRange): NBRange | null => {
  const {startContainer, startOffset, endContainer, endOffset} = domRange

  const start = domToNBPoint([startContainer, startOffset])
  if (!start) return null

  const end = domRange.collapsed
    ? start.clone()
    : domToNBPoint([endContainer, endOffset])
  if (!end) return null

  return new NBRange(start, end)
}

export const domScrollToSelection = (smooth = true): void => {
  const scrollingContainer = window.document.scrollingElement
  if (!scrollingContainer) return

  const selection = window.getSelection()
  if (!selection || !selection.isCollapsed || selection.rangeCount !== 1)
    return

  const rects = selection.getRangeAt(0).getClientRects()
  if (!rects.length) return

  const rect = rects[0]

  let top: number
  const padding = 32
  if (rect.bottom + padding > window.visualViewport!.height) {
    const delta = rect.bottom + padding - window.visualViewport!.height
    top = scrollingContainer.scrollTop + delta
    if (smooth) {
      scrollingContainer.scrollTo({top, behavior: "smooth"})
    } else {
      scrollingContainer.scrollTop = top
    }
  } else if (rect.top < padding) {
    const delta = rect.top - padding
    top = scrollingContainer.scrollTop + delta
  } else {
    return
  }

  if (smooth) {
    scrollingContainer.scrollTo({top, behavior: "smooth"})
  } else {
    scrollingContainer.scrollTop = top
  }
}

export const domTextOffsetsFromHTML = (
  el: Element,
  range: Range
): [start: number, end: number] | undefined => {
  const firstNode = el.childNodes[0] ?? el

  if (!el.contains(range.startContainer) || !el.contains(range.endContainer))
    return

  const start = range.cloneRange()
  start.selectNodeContents(firstNode)
  start.setStart(firstNode, 0)
  start.setEnd(range.startContainer, range.startOffset)
  const startOffset = start.toString().length

  const end = range.cloneRange()
  end.selectNodeContents(firstNode)
  end.setStart(firstNode, 0)
  end.setEnd(range.endContainer, range.endOffset)
  const endOffset = end.toString().length

  return [startOffset, endOffset]
}

export const syncDOMSelection = (ctx: IContext): void => {
  /** @purpose defense code
     * 1. popup - delete selected block -> restore selection
     */
  try {
    _syncDOMSelection(ctx)
  } catch {
    window.getSelection()?.removeAllRanges()
    ctx.selector.select(null)
  }
}

export const isEditableDOM = (element?: DOMElement | null): boolean => {
  if (!element) return false

  let el: DOMElement | null = element
  while (el) {
    if (element.classList.contains("nb-no-editable")) return false
    const contenteditable = element.getAttribute("contenteditable")
    if (contenteditable) return contenteditable === "true"
    el = el.parentElement
  }
  return false
}

interface IContext {
  rootBlockID: BlockID
  selector: {
    isUpdatingSelection: boolean
    isFocused: boolean
    select: (range: NBRange | null) => void
    selection: NBRange | null
  }
  state: {
    working: {
      composing: null | object
    }
  }
}