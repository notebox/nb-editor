import type {BlockID} from "@/domain/entity"
import type {DOMNode} from "@/domain/usecase/dom"

import {domType} from "@/domain/usecase/dom"

/** @todo check */
export const hasNoteLevelDOM = (
  rootBlockID: BlockID,
  target: EventTarget | null
): target is DOMNode => {
  const type = domType(rootBlockID, target)
  return (
    !!type &&
    (type === "editor" || type === "text" || type === "prop")
  )
}
