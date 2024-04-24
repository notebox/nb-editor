import type {BlockID} from "@/domain/entity"
import type {Editor} from "@/domain/usecase"
import type {PointerPosition} from "@/domain/usecase/state/drag"

/** @category Dragging */
export const DOMGetBoundary = (el: Element) => {
  const rect = el.getBoundingClientRect()
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  }
}

export const DOMValidateTarget = (
  target?: Element | null,
  container?: {query: string}
): target is Element => {
  if (!target) return false
  if (!container) return true

  return !!window.document.querySelector(container.query)?.contains(target)
}

export const getDraggingBlockIDs = (
  editor: Editor,
  blockID: BlockID,
): [BlockID[], BlockID[]] => {
  const selection = editor.selector.selection
  if (selection && !selection.isCollapsed) {
    const selectedBlocks = editor.dataManipulator.selectedBlocks(
      selection.start.blockID,
      selection.end.blockID
    )
    const selectedBlockIDs = selectedBlocks.map(block => block.blockID)
    if (selectedBlockIDs.includes(blockID)) {
      return [
        selectedBlockIDs,
        editor.dataManipulator
          .removeNoteBlockAndChildren(selectedBlocks)
          .map(block => block.blockID),
      ]
    }
  }
  return [[blockID], [blockID]]
}

/** @category DOM */
export const DOMRemoveDraggingDestinationMarkers = (doc: Document): void => {
  doc
    .querySelectorAll(".nb-dragging-at, .nb-dragging-prev, .nb-dragging-next")
    .forEach(dom => {
      dom.classList.remove(
        "nb-dragging-at",
        "nb-dragging-prev",
        "nb-dragging-next"
      )
    })
}

export const DOMCheckContainer = (
  target: Element,
  container?: {blockID: BlockID}
): boolean => {
  if (!target) return false
  if (container) {
    return (
      container.blockID ===
      (target
        .closest(".nb-db-container")
        ?.closest("[data-nb-block]")
        ?.getAttribute("data-nb-block") as BlockID)
    )
  }
  return true
}

export const DOMWrapGhost = (classNames: string[], target: Node): Node => {
  return classNames.reduce((acc, cur) => {
    const wrapper = document.createElement("div")
    wrapper.className = cur
    wrapper.appendChild(acc)
    return wrapper
  }, target)
}

/** @category ghost */
export const DOMGetWipedGhostContainer = (): HTMLElement => {
  const ghostContainer = window.document.getElementById(
    "nb-ui-layer-ghost-contents"
  )!
  ghostContainer.innerHTML = ""
  return ghostContainer
}

export const DOMGetGhostPositionX = (
  pointer: PointerPosition,
  container: {top: number; left: number; right: number}
) => {
  const top = container.top
  let left = pointer.clientX
  if (pointer.clientX <= container.left) {
    left = container.left
  } else if (pointer.clientX >= container.right) {
    left = container.right
  }
  return {left, top}
}

/** @category Scroller */
// export const autoScroller = {
//   next:
// };

let autoScroll: number | undefined
const scroll = (element: Element, to: {top?: number; left?: number}) => {
  const prev = {top: element.scrollTop, left: element.scrollLeft}
  element.scrollTo(to)

  const verticalDelta = element.scrollTop - prev.top
  const horizontalDelta = element.scrollLeft - prev.left
  if (!(verticalDelta + horizontalDelta)) return

  if (to.top !== undefined && verticalDelta) {
    to.top = element.scrollTop + verticalDelta
  }
  if (to.left !== undefined && horizontalDelta) {
    to.left = element.scrollLeft + horizontalDelta
  }

  autoScroll = window.setTimeout(() => scroll(element, to), 20)
}
const sensitivity = 16

export const clearAutoScroll = (): void => {
  if (!autoScroll) return
  clearTimeout(autoScroll)
}

export const DOMHorizontalScrollWhileDragging = async (
  clientX: number
): Promise<void> => {
  const scrollingContainer = window.document.querySelector(
    "[data-nb-dragging-container=\"true\"]"
  )
  if (!scrollingContainer) return

  if (clientX < 32) {
    scroll(scrollingContainer, {
      left: scrollingContainer.scrollLeft - sensitivity,
    })
  } else if (clientX > window.visualViewport!.width - 32) {
    scroll(scrollingContainer, {
      left: scrollingContainer.scrollLeft + sensitivity,
    })
  }
}

export const DOMVerticalScrollWhileDragging = async (
  clientY: number
): Promise<void> => {
  const scrollingContainer = window.document.querySelector(
    "[data-nb-dragging-container=\"true\"]"
  )
  if (!scrollingContainer) return

  if (clientY < 32) {
    scroll(scrollingContainer, {
      top: scrollingContainer.scrollTop - sensitivity,
    })
  } else if (clientY > window.visualViewport!.height - 32) {
    scroll(scrollingContainer, {
      top: scrollingContainer.scrollTop + sensitivity,
    })
  }
}

export const DOMScrollByTouching = async (clientY: number): Promise<void> => {
  const scrollingContainer = window.document.scrollingElement
  if (!scrollingContainer) return

  const clientTop = scrollingContainer.scrollTop
  if (clientY < 32) {
    scroll(scrollingContainer, {top: clientTop - sensitivity})
    return
  }

  const viewHeight = window.visualViewport!.height
  if (clientY > viewHeight - 32) {
    scroll(scrollingContainer, {top: clientTop + sensitivity})
  }
}
