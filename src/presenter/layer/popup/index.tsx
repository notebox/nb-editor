import type {UIHandler} from "@/domain/usecase"
import type {
  BlockHandlePopup,
  CodeLangPopup,
  LinkURLSetterPopup,
  MermaidPopup,
  PopupWithStyle
} from "@/domain/usecase/state/popup"

import {useRecoilValue} from "recoil"
import BlockHandlePopupComponent from "./blockHandle"
import CodeLanguagePicker from "./block/CodeLanguagePicker"
import Mermaid from "./block/Mermaid"

import LinkURLSetter from "./block/LinkURLSetter"

const present = ({ctx}: {ctx: UIHandler}) => {
  const popup = useRecoilValue(ctx.state.popup.atom)
  if (!popup) return null

  const el = ctx.customPopupHandler?.(ctx, popup)
  if (el) return el

  switch (popup.type) {
  case "block-handle":
    return <BlockHandlePopupComponent ctx={ctx} popup={popup as PopupWithStyle<BlockHandlePopup>} />
  case "code-language":
    return <CodeLanguagePicker ctx={ctx} popup={popup as PopupWithStyle<CodeLangPopup>} />
  case "mermaid":
    return <Mermaid ctx={ctx} popup={popup as PopupWithStyle<MermaidPopup>} />
  case "link-url-setter":
    return <LinkURLSetter ctx={ctx} popup={popup as PopupWithStyle<LinkURLSetterPopup>} />
  default:
    return null
  }
}

export default present
