import type {RecoilState} from "recoil"
import type {
  BlockID,
  BlockType,
  NBRange,
  SubPath,
  Editor,
} from "@/domain"
import type {Draggable} from "@/domain/usecase/state/drag"

import React from "react"
import {atom as genAtom} from "recoil"
import {setRecoilExternalState} from "./common"
import {CodeKey} from "@/domain/usecase/props/codeLangs"

export class PopupStateHandler {
  readonly atom: RecoilState<PopupWithStyle | null>
  isPresented = false

  constructor(id: string) {
    this.atom = genAtom<PopupWithStyle | null>({
      key: id + "popup",
      default: null,
    })
  }

  present(editor: Editor, payload: Popup, event?: React.MouseEvent) {
    if (!event) {
      this.show(editor, payload)
      return
    }

    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getClientRects()?.[0]
    if (!rect) return
    this.show(editor, {...payload, style: this.calculateStyle(rect)})
  }

  dismiss = async (
    event?: React.MouseEvent,
    withoutRestoringSelection?: boolean
  ): Promise<void> => {
    event?.preventDefault()
    event?.stopPropagation()
    this.isPresented = false
    const top = parseInt(document.body.style.top || "0") * -1
    document.body.setAttribute("style", "")
    window.scrollTo(0, top)
    document.body.removeEventListener("wheel", preventScroll)
    setRecoilExternalState(this.atom, null)
    if (withoutRestoringSelection) return
    this.restoreSelection?.()
  }

  private restoreSelection?: () => void

  private storeSelection(editor: Editor) {
    const selection = editor.selector.selection
    this.restoreSelection = () => {
      delete this.restoreSelection
      if (!selection) return
      editor.selector.select(selection)
      editor.syncSelection()
    }
    editor.selector.blur()
    window.getSelection()?.removeAllRanges()
  }

  private calculateStyle(rect: Rect): PopupStyle {
    const {top, right, left} = rect
    const rightSpace = window.innerWidth - right

    if (left > rightSpace) {
      return {
        top,
        right: window.innerWidth - left,
        marginLeft: "auto",
        transformOrigin: "right",
      }
    }

    return {
      top,
      left: right,
      transformOrigin: "left",
    }
  }

  private show = async (editor: Editor, payload: PopupWithStyle) => {
    if (this.isPresented) {
      this.dismiss()
      return
    }

    document.body.setAttribute(
      "style",
      `top: -${window.scrollY}px; overflow-y: hidden; position: fixed; padding-right: 15px;`
    )
    document.body.addEventListener("wheel", preventScroll)

    setRecoilExternalState(this.atom, payload)
    this.storeSelection(editor)
    this.isPresented = true
    editor.emitter.emitHaptic()
  }
}

const preventScroll = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
}

export type Popup<Key = string, Meta = any> = {type: Key; meta: Meta};
export type PopupWithStyle<P = Popup> = P & {style?: PopupStyle};

export type BlockHandlePopup = Popup<"block-handle", {
  blockID: BlockID;
  blockType: BlockType;
  draggable?: Draggable;
  subPath?: SubPath;
}>

/** @category Link URL */
export type LinkURLSetterPopup = Popup<"link-url-setter", {
  purpose:
    | {
        to: "text";
        range: NBRange;
      }
    | {
        to: "block";
        blockID?: BlockID;
      };
  initial?: string;
}>

/** @category Code Language */
export type CodeLangPopup = Popup<"code-language", {
  blockID: BlockID;
  initial: CodeKey;
}>

/** @category Mermaid */
export type MermaidPopup = Popup<"mermaid", {
  svg: string;
  width: number;
  height: number;
}>

export type PopupStyle =
  | {
      top: number;
      left: number;
      transformOrigin: "left";
    }
  | {
      top: number;
      right: number;
      marginLeft: "auto";
      transformOrigin: "right";
    };

type Rect = {top: number; right: number; bottom: number; left: number};
