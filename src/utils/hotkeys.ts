import {isKeyHotkey} from "is-hotkey"
import {IS_APPLE} from "./environment"

/**
 * Hotkey mappings for each platform.
 */

const HOTKEYS: {[key: string]: string | string[]} = {
  compose: ["down", "left", "right", "up", "backspace", "enter"],
  delete: ["backspace", "delete"],
  enter: "enter",
  esc: "esc",
  moveUp: "up",
  moveDown: "down",
  moveBackward: "left",
  moveForward: "right",
  moveWordBackward: "ctrl+left",
  moveWordForward: "ctrl+right",
  deleteBackward: "shift?+backspace",
  deleteForward: "shift?+delete",
  extendBackward: "shift+left",
  extendForward: "shift+right",
  shiftEnter: "shift+enter",
  ctrlEnter: "ctrl+enter",
  applyMarkdown: "shift?+space",
  undo: "mod+z",
  indent: "tab",
  dedent: "shift+tab",
  selectAll: "mod+a",
  fmtBold: "mod+b",
  fmtItalic: "mod+i",
  fmtUnderline: "mod+u",
  fmtLink: "mod+k",
  fmtCode: "mod+e",
  fmtHighlight: "mod+shift+h",
}

const APPLE_HOTKEYS: {[key: string]: string | string[]} = {
  moveLineBackward: "opt+up",
  moveLineForward: "opt+down",
  moveWordBackward: "opt+left",
  moveWordForward: "opt+right",
  deleteBackward: ["ctrl+backspace", "ctrl+h"],
  deleteForward: ["ctrl+delete", "ctrl+d"],
  deleteLineBackward: "cmd+shift?+backspace",
  deleteLineForward: ["cmd+shift?+delete", "ctrl+k"],
  deleteWordBackward: "opt+shift?+backspace",
  deleteWordForward: "opt+shift?+delete",
  extendLineBackward: "opt+shift+up",
  extendLineForward: "opt+shift+down",
  redo: "cmd+shift+z",
  transposeCharacter: "ctrl+t",
}

const WINDOWS_HOTKEYS: {[key: string]: string | string[]} = {
  deleteWordBackward: "ctrl+shift?+backspace",
  deleteWordForward: "ctrl+shift?+delete",
  redo: ["ctrl+y", "ctrl+shift+z"],
}

/**
 * Create a platform-aware hotkey checker.
 */

const create = (key: string) => {
  const generic = HOTKEYS[key]
  const apple = APPLE_HOTKEYS[key]
  const windows = WINDOWS_HOTKEYS[key]
  const isGeneric = generic && isKeyHotkey(generic)
  const isApple = apple && isKeyHotkey(apple)
  const isWindows = windows && isKeyHotkey(windows)

  return (event: KeyboardEvent) => {
    if (isGeneric && isGeneric(event)) return true
    if (IS_APPLE && isApple && isApple(event)) return true
    if (!IS_APPLE && isWindows && isWindows(event)) return true
    return false
  }
}

/**
 * Hotkeys.
 */

export default {
  isCompose: create("compose"),
  isDelete: create("delete"),
  isEnter: create("enter"),
  isESC: create("esc"),
  isMoveUp: create("moveUp"),
  isMoveDown: create("moveDown"),
  isMoveBackward: create("moveBackward"),
  isMoveForward: create("moveForward"),
  isDeleteBackward: create("deleteBackward"),
  isDeleteForward: create("deleteForward"),
  isDeleteLineBackward: create("deleteLineBackward"),
  isDeleteLineForward: create("deleteLineForward"),
  isDeleteWordBackward: create("deleteWordBackward"),
  isDeleteWordForward: create("deleteWordForward"),
  isExtendBackward: create("extendBackward"),
  isExtendForward: create("extendForward"),
  isExtendLineBackward: create("extendLineBackward"),
  isExtendLineForward: create("extendLineForward"),
  isMoveLineBackward: create("moveLineBackward"),
  isMoveLineForward: create("moveLineForward"),
  isMoveWordBackward: create("moveWordBackward"),
  isMoveWordForward: create("moveWordForward"),
  isRedo: create("redo"),
  isShiftEnter: create("shiftEnter"),
  isCTRLEnter: create("ctrlEnter"),
  isApplyMarkdown: create("applyMarkdown"),
  isTransposeCharacter: create("transposeCharacter"),
  isUndo: create("undo"),
  isIndent: create("indent"),
  isDedent: create("dedent"),
  isSelectAll: create("selectAll"),

  isFMTBold: create("fmtBold"),
  isFMTItalic: create("fmtItalic"),
  isFMTUnderline: create("fmtUnderline"),
  isFMTLink: create("fmtLink"),
  isFMTHighlight: create("fmtHighlight"),
  isFMTCode: create("fmtCode"),
}
