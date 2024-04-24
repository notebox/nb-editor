import type {Editor, UIHandler} from "@/domain/usecase"
import type {LinkURLSetterPopup, PopupWithStyle} from "@/domain/usecase/state/popup"

import {BlockPropKey, BlockType, TextPropKey} from "@/domain/entity"
import {sanitizeLink} from "@/domain/usecase/sanitizer"
import React, {useState} from "react"
import ViewModel from "@/presenter/common/ViewModel"
import Popup from "../Popup"
import {Footer} from "@/presenter/layer/popup/common/Layout"

import InputEl from "@/presenter/common/InputEl"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div className="nb-ui-section-wrap">
        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Set URL</div>
          </div>
          <div style={{padding: "0 1rem", display: "flex"}}>
            <InputEl
              style={{flex: 1}}
              placeholder={model.popup.meta.initial || "URL"}
              value={model.url}
              onChange={model.onChange}
              focused={model.focused}
              onFocus={() => {
                model.focused = false
              }}
            />
          </div>
          <Footer editor={ctx.editor} done={model.done} />
        </div>
      </div>
    </Popup>
  )
}

// MARK: - Model
export class Model extends ViewModel {
  readonly editor: Editor
  readonly popup: LinkURLSetterPopup

  url: string
  sanitized!: string
  get isValid() {
    return !!this.sanitized
  }

  focused = true

  constructor(ctx: UIHandler, popup: PopupWithStyle<LinkURLSetterPopup>) {
    super()

    this.editor = ctx.editor
    this.popup = popup
    this.url = popup.meta.initial ?? ""
    this.validate()
  }

  private validate() {
    let url = this.url.trim()
    if (!url || url === this.popup.meta.initial) {
      url = ""
    } else {
      url = sanitizeLink(url)
      if (url === "//:0" || url === "about:blank") {
        url = ""
      }
    }
    try {
      if (url && new URL(url)) {
        this.sanitized = url
        return
      }
      /* eslint-disable-next-line no-empty */
    } catch {}
    this.sanitized = ""
  }

  onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.url = event.target.value
    this.validate()
    this.rerender()
  }

  done = () => {
    if (this.sanitized && this.popup.meta.initial !== this.url) {
      this.editor.operate(operator => {
        if (this.popup.meta.purpose.to === "text") {
          operator.select(this.popup.meta.purpose.range)
          operator.format(TextPropKey.Link, this.sanitized)
        } else if (this.popup.meta.purpose.blockID) {
          operator.setBlockProp(
            this.popup.meta.purpose.blockID,
            BlockPropKey.Link,
            this.sanitized
          )
        } else {
          operator.insertBlock({
            TYPE: [null, BlockType.Linkblock],
            [BlockPropKey.Link]: [null, this.sanitized],
          })
        }
      })
    }
    this.editor.popup(null)
  }
}

// MARK: - Types
type Props = {ctx: UIHandler; popup: PopupWithStyle<LinkURLSetterPopup>};
