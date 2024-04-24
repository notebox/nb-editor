import type {BlockID, UIHandler} from "@/domain"

import React from "react"
import {NBRange} from "@/domain/entity"

const CaptionComponent = (props: {ctx: UIHandler; blockID: BlockID; caption?: string}) => {
  const isEditing =
    props.ctx.state.working.workingCaret?.blockID === props.blockID &&
    props.ctx.state.working.workingCaret.subPath?.type === "caption"
  return (
    <div
      className="nb-caption-container"
      onClick={event => {
        if (isEditing) return
        event.preventDefault()
        props.ctx.editor.selector.select(
          NBRange.decode({
            blockID: props.blockID,
            subPath: {
              type: "caption",
            },
            offset: props.caption?.length ?? 0,
          })
        )
        props.ctx.state.reRender()
      }}
    >
      <div
        data-nb-dom-type="prop"
        data-nb-prop-type="caption"
        className="caption"
        placeholder="caption"
        contentEditable={!props.ctx.state.readOnly && !!isEditing}
        suppressContentEditableWarning
      >
        {props.caption ?? "Untitled"}
      </div>
    </div>
  )
}

const MemoizedValueCell = React.memo(CaptionComponent, (_, next) => {
  return (
    next.ctx.state.working.composing?.blockID === next.blockID &&
    next.ctx.state.working.composing.subPath?.type === "caption"
  )
})

export default MemoizedValueCell
