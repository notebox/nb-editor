import {BlockID, BlockPropKey, Editor, UIHandler} from "@/domain"
import type {CodeLangPopup, PopupWithStyle} from "@/domain/usecase/state/popup"

import {keys, match, CodeKey} from "../../../../domain/usecase/props/codeLangs"

import React, {useState} from "react"
import ViewModel from "@/presenter/common/ViewModel"
import Popup from "../Popup"
import {Header} from "../common/Layout"

import InputEl from "@/presenter/common/InputEl"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div id="nb-code-language-picker" className="nb-ui-section-wrap">
        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div className="nb-ui-content">
              <Header editor={ctx.editor} cancel={ctx.state.popup.dismiss} done={model.done} />
              <div>Select Code Language</div>
              <InputEl
                placeholder={model.searching}
                onChange={model.onSearch}
              />
            </div>
          </div>
          <div className="nb-ui-list">
            {model.keys.map(key => (
              <div
                className="nb-ui-list-item is-hoverable"
                key={key}
                onClick={() => model.onClick(key)}
                style={
                  key === model.selected
                    ? {color: "var(--accent-color)"}
                    : undefined
                }
              >
                {key}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Popup>
  )
}

// MARK: - Model
export class Model extends ViewModel {
  readonly editor: Editor
  readonly blockID: BlockID
  readonly initial: CodeKey

  selected: CodeKey
  searching: string = ""
  keys: CodeKey[] = [...keys]

  constructor(ctx: UIHandler, popup: PopupWithStyle<CodeLangPopup>) {
    super()

    this.editor = ctx.editor
    this.blockID = popup.meta.blockID
    this.initial = popup.meta.initial
    this.selected = popup.meta.initial

    const index = this.keys.indexOf(this.selected)
    if (index > 0) {
      this.keys.splice(index, 1)
      this.keys.unshift(this.selected)
    }
  }

  onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.searching = event.target.value
    this.keys = match(this.searching)
    this.rerender()
  }

  onClick = (key: CodeKey) => {
    this.editor.emitter.emitHaptic()
    this.selected = key
    this.rerender()
  }

  done = () => {
    if (this.initial !== this.selected) {
      this.editor.operate(operator => {
        operator.setBlockProp(
          this.blockID,
          BlockPropKey.Language,
          this.selected
        )
      })
    }
    this.editor.popup(null)
  }
}

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<CodeLangPopup>};
