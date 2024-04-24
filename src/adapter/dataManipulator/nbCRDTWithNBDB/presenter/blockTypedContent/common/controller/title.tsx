import type {BlockID, UIHandler} from "@/domain"

import React from "react"
import {NBRange} from "@/domain/entity"

const TitleComponent = (props: {
  ctx: UIHandler;
  templateBlockID: BlockID;
  caption?: string;
}) => {
  const isEditing =
    props.ctx.state.working.workingCaret?.blockID === props.templateBlockID &&
    props.ctx.state.working.workingCaret.subPath?.type === "caption"
  return (
    <div
      className="nb-db-title"
      data-nb-dom-type="prop"
      data-nb-prop-type="caption"
      placeholder="Untitled"
      contentEditable={!props.ctx.state.readOnly && !!isEditing}
      suppressContentEditableWarning
      onClick={event => {
        if (isEditing) return
        event.preventDefault()
        props.ctx.editor.selector.select(
          NBRange.decode({
            blockID: props.templateBlockID,
            subPath: {
              type: "caption",
            },
            offset: props.caption?.length ?? 0,
          })
        )
        props.ctx.editor.emitter.emitHaptic()
        props.ctx.state.reRender()
      }}
    >
      {!isEditing && !props.caption ? "Untitled" : props.caption}
    </div>
  )
}

const MemoizedValueCell = React.memo(TitleComponent, (_, next) => {
  return (
    next.ctx.state.working.composing?.blockID === next.templateBlockID &&
    next.ctx.state.working.composing.subPath?.type === "caption"
  )
})

export default MemoizedValueCell
