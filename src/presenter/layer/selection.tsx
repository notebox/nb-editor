import type {UIHandler} from "@/domain/usecase"

import {useRecoilValue} from "recoil"

export default ({ctx}: {ctx: UIHandler}) => {
  const dragging = useRecoilValue(ctx.state.drag.atom)?.position
  const position = useRecoilValue(ctx.state.mouse.atom)?.position
  const selected = useRecoilValue(ctx.state.selection.atom)
  if (dragging || (!position && !selected)) return null
  const top = ctx.editor.selector.target?.parentElement?.offsetTop ?? 0

  return (
    <div className="nb-ui-layer-selection" style={{marginTop: -top}}>
      {selected && (
        <div className="nb-ui-layer-selection-container">
          {selected.map(block => (
            <div
              key={block.blockID}
              className="nb-ui-selection-block"
              style={block.position}
            ></div>
          ))}
        </div>
      )}
      {position && (
        <div className="nb-ui-layer-selection-container">
          <div id="nb-ui-selection-rect" style={position}></div>
        </div>
      )}
    </div>
  )
}
