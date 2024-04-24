import type {UIHandler} from "@/domain/usecase/uiHandler"

import history from "./history"
import formatText from "./formatText"
import prettyArrow from "./prettyArrow"
import space from "./space"
import indentation from "./indentation"
import voidBlock from "./voidBlock"
import preventInvalidDeletion from "./preventInvalidDeletion"
import selectAll from "./selectAll"

export const keymapHandlers = Object.freeze([
  history,
  prettyArrow,
  formatText,
  space,
  indentation,
  voidBlock,
  preventInvalidDeletion,
  selectAll,
])

export type CustomKeymapHandler = (ctx: UIHandler, event: KeyboardEvent) => boolean