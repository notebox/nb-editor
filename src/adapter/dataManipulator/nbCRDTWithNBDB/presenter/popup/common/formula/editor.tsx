import type {DBFieldID, DBFormula, Editor} from "@/domain"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import Selector from "./selector"

import {useState} from "react"
import {domTextOffsetsFromHTML} from "@/domain"
import {Header} from "@/presenter/layer/popup/common/Layout"
import Input from "./input"
import {Interpreter} from "./model/interpreter"
import decoderToString from "./model/decoder"

import _ from "lodash"

export default ({
  model,
  onCancel,
  onDone,
}: {
  model: Model;
  onCancel: () => void;
  onDone: () => void;
}) => {
  const [html, setHTML] = useState(model.html)
  const [error, setError] = useState<string>("")
  const preventUpdate =
    !!error || !Model.isChanged(model.data, model.initialState.data)

  return (
    <div className="nbdb-formula-writer">
      <div className="nbdb-formula-writer-header">
        <Header
          editor={model.editor}
          cancel={() => {
            model.onCancel()
            onCancel()
          }}
          done={onDone}
          disabledDone={preventUpdate}
        />
        <Input
          model={model}
          html={html}
          onChange={code => {
            try {
              model.onChange(code)
              setHTML(model.html)
              setError("")
            } catch (err) {
              setError(err as string)
            }
          }}
          onCancel={() => {
            model.onCancel()
            onCancel()
          }}
        />
        <div className="nbdb-formula-error">{error}</div>
      </div>
      <div className="nbdb-formula-writer-body">
        <Selector
          editor={model.editor}
          template={model.template}
          fieldID={model.fieldID}
          onClick={code => {
            model.editor.emitter.emitHaptic()
            try {
              model.add(code)
              setHTML(model.html)
              setError("")
            } catch (err) {
              setHTML(model.html)
              setError(err as string)
            }
          }}
        />
      </div>
    </div>
  )
}

export class Model {
  template: NBDBTemplate
  fieldID?: DBFieldID
  initialState: {
    html: string;
    data?: DBFormula;
  }

  editor: Editor
  interpreter?: Interpreter
  selection?: [start: number, end: number]
  dom: HTMLDivElement | null = null
  html = ""
  data?: DBFormula | null

  constructor(props: {
    editor: Editor;
    template: NBDBTemplate;
    initialData?: DBFormula;
    fieldID?: DBFieldID;
  }) {
    this.editor = props.editor
    this.template = props.template
    this.fieldID = props.fieldID

    try {
      if (props.initialData) {
        this.interpreter = new Interpreter(
          props.template,
          decoderToString(props.initialData),
          props.fieldID
        )
        this.html = this.interpreter!.result
        this.data = props.initialData
        this.initialState = {
          html: this.html,
          data: props.initialData,
        }
        return
      }
    } catch (err) {
      props.editor.emitter.emitError(err)
    }
    this.initialState = {
      html: "",
      data: props.initialData,
    }
  }

  onCancel = () => {
    this.html = this.initialState.html
    this.data = this.initialState.data
  }

  onSelectionChange = () => {
    const selection = window.document.getSelection()
    if (this.dom && selection?.rangeCount) {
      const range = selection.getRangeAt(0)
      this.selection = domTextOffsetsFromHTML(this.dom, range)
    }
  }

  onChange = (code: string) => {
    this.onSelectionChange()
    this.html = this.dom?.innerHTML ?? ""
    this.interpreter = new Interpreter(this.template, code, this.fieldID)
    this.html = this.interpreter!.result
    this.data = this.interpreter!.data()
  }

  add = (value: string) => {
    let fallback: string
    let code: string
    let offset: number | undefined
    if (this.dom?.textContent) {
      const text = this.dom.textContent
      if (this.selection) {
        const prevOffset = this.selection[0]
        code =
          text.substring(0, prevOffset) +
          value +
          text.substring(this.selection[1])
        fallback = code
        offset = prevOffset + value.length
      } else {
        code = text + value
        fallback = this.html + value
      }
    } else {
      const div = document.createElement("div")
      div.innerHTML = this.html + value
      if (!div.textContent) return
      code = div.textContent
      fallback = this.html + value
    }
    this.html = fallback
    this.setSelection(offset ?? code.length)
    this.interpret(code)
  }

  private setSelection(offset: number) {
    this.selection = [offset, offset]
  }

  private interpret(code: string) {
    this.interpreter = new Interpreter(this.template, code, this.fieldID)
    this.html = this.interpreter!.result
    this.data = this.interpreter!.data()
  }

  static isChanged(a?: DBFormula | null, b?: DBFormula | null): boolean {
    return !_.isEqual(a, b)
  }
}
