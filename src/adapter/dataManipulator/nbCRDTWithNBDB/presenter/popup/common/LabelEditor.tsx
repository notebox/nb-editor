import type {DBLabelID, UIHandler} from "@/domain"

import {useState} from "react"
import {Color} from "@/domain/entity"
import InputEl from "@/presenter/common/InputEl"

export default (props: Props) => {
  const [name, setName] = useState(props.name)
  const [color, setColor] = useState(props.color)

  return (
    <div className={`nbdb-label-editor nb-bgcolor-${color ?? Color.Gray}`}>
      <InputEl
        type="text"
        value={name}
        style={{height: "25px"}}
        onChange={event => setName(event.target.value)}
        placeholder="Label Name"
        autoFocus
      />
      {ColorPicker(setColor)}
      <div className="nb-ui-btns">
        {props.labelID ? (
          <div
            className="nb-ui-btn role-delete"
            onClick={() => {
              props.ctx.editor.emitter.emitHaptic()
              props.onDeleteEditingLabel?.(props.labelID!)
            }}
          >
            Delete
          </div>
        ) : null}
        <div
          className="nb-ui-btn role-cancel"
          onClick={() => {
            props.ctx.editor.emitter.emitHaptic()
            props.onCancelEditingLabel
          }}
        >
          Cancel
        </div>
        <div
          className="nb-ui-btn role-default"
          onClick={() => {
            if (!props.labelID && props.name === name && props.color === color)
              return
            props.ctx.editor.emitter.emitHaptic()
            props.onSaveLabel({
              labelID: props.labelID,
              name,
              color,
            })
          }}
        >
          {props.labelID ? "Update" : "Add"}
        </div>
      </div>
    </div>
  )
}

const ColorPicker = (setClick: (color: Color) => void) => (
  <div className="nb-color-picker">
    {[
      Color.Red,
      Color.Orange,
      Color.Yellow,
      Color.Green,
      Color.Blue,
      Color.Purple,
      Color.Gray,
    ].map(color => (
      <div
        key={color}
        className={`nb-color-option nb-bgcolor-${color ?? Color.Gray}`}
        onClick={() => setClick(color)}
      ></div>
    ))}
  </div>
)

export type Props = {
  ctx: UIHandler;
  labelID?: DBLabelID;
  name: string;
  color?: Color;
  onSaveLabel: (props: {
    labelID?: DBLabelID;
    name: string;
    color?: Color;
  }) => void;
  onDeleteEditingLabel?: (labelID: DBLabelID) => void;
  onCancelEditingLabel: () => void;
};
