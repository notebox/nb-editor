import type {
  BlockID,
  DBFieldID,
  DBDateRange,
  DBDateDataType,
  DBRecordProp,
  Editor,
  UIHandler,
} from "@/domain"
import type {PopupWithStyle} from "@/domain/usecase/state/popup"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {NBDBDatePopup} from ".."

import dayjs, {Dayjs} from "dayjs"

import Checkbox from "@/presenter/common/icon/checkbox"
import {isDateDataType} from "@/domain/entity"
import React, {useState} from "react"
import ViewModel from "@/presenter/common/ViewModel"
import Popup from "@/presenter/layer/popup/Popup"
import {Footer} from "@/presenter/layer/popup/common/Layout"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

import _ from "lodash"

export default ({ctx, popup}: Props) => {
  const [model] = useState(new Model(ctx, popup))
  model.setStates()

  return (
    <Popup ctx={ctx} style={popup.style} onConfirm={model.done}>
      <div id="nbdb-date-picker" className="nb-ui-section-wrap">
        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div>Start</div>
          </div>
          <div className="nb-ui-content">
            {DateSetter(model.withTime, model.start, model.onChangeStart)}
          </div>
        </div>

        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div
              onClick={() => {
                ctx.editor.emitter.emitHaptic()
                model.toggleEnd()
              }}
            >
              {Checkbox(!!model.end)}
            </div>
            <div>End</div>
          </div>
          {model.end && (
            <div className="nb-ui-content">
              {DateSetter(model.withTime, model.end, model.onChangeEnd)}
            </div>
          )}
        </div>

        <div className="nb-ui-section">
          <div className="nb-ui-section-header">
            <div
              onClick={() => {
                ctx.editor.emitter.emitHaptic()
                model.toggleTime()
              }}
            >
              {Checkbox(model.withTime)}
            </div>
            <div>Time</div>
          </div>
        </div>

        <Footer editor={ctx.editor} done={model.done} />
      </div>
    </Popup>
  )
}

const DateSetter = (
  time: boolean,
  value: string,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
) =>
  time ? (
    <input type="datetime-local" value={value} onChange={onChange} />
  ) : (
    <input type="date" value={value} onChange={onChange} />
  )

// MARK: - Model
export class Model extends ViewModel {
  readonly editor: Editor
  readonly blockID: BlockID
  readonly fieldID: DBFieldID
  readonly initial?: DBDateRange

  get start(): string {
    return this.formatDatetimeForDOM(this._start)
  }
  get end(): string | undefined {
    return this._end && this.formatDatetimeForDOM(this._end)
  }

  withTime: boolean
  private _start: Dayjs
  private _end?: Dayjs

  constructor(ctx: UIHandler, popup: PopupWithStyle<NBDBDatePopup>) {
    super()

    this.editor = ctx.editor
    this.blockID = popup.meta.blockID
    this.fieldID = popup.meta.fieldID

    const value = (this.editor.dataManipulator.block(popup.meta.blockID).props.DB_RECORD as DBRecordProp)?.[
      popup.meta.fieldID
    ]?.VALUE?.[1]
    if (isDateDataType(value)) {
      this.initial = value[1]
      this._start = dayjs(this.initial.start)
      this._end = dayjs(this.initial.end)
      this.withTime = this.initial.time ?? false
    } else {
      this._start = dayjs()
      this.withTime = false
    }
  }

  formatDatetimeForDOM = (day: Dayjs): string => {
    return this.withTime
      ? day.format("YYYY-MM-DDTHH:mm")
      : day.format("YYYY-MM-DD")
  }

  onChangeStart = (event: React.ChangeEvent<HTMLInputElement>) => {
    this._start = dayjs(event.target.value)
    this.rerender()
  }

  onChangeEnd = (event: React.ChangeEvent<HTMLInputElement>) => {
    this._end = dayjs(event.target.value)
    this.rerender()
  }

  toggleTime = () => {
    this.withTime = !this.withTime
    this.rerender()
  }

  toggleEnd = () => {
    if (this.end) {
      delete this._end
    } else {
      this._end = dayjs(this.start)
    }
    this.rerender()
  }

  done = () => {
    const result = {
      start: this._start.format(),
      end: this._end?.format(),
      time: this.withTime,
    }
    if (!_.isEqual(result, this.initial)) {
      this.editor.operate(operator => {
        Command.setBlockDBRecordValue(operator as NBOperator, this.blockID, this.fieldID, [
          "DATE",
          result,
        ] as DBDateDataType)
      })
    }
    this.editor.popup(null)
  }
}

// MARK: - Types
type Props = {ctx: UIHandler, popup: PopupWithStyle<NBDBDatePopup>};
