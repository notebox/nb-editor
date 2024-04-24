import type {UIHandler} from "@/domain/usecase"
import type {MermaidPopup, PopupWithStyle} from "@/domain/usecase/state/popup"

import {useState} from "@/presenter"

export default ({ctx, popup}: {ctx: UIHandler, popup: PopupWithStyle<MermaidPopup>}) => {
  const [zoom, setZoom] = useState(1)

  return (
    <div id="nb-ui-layer-popup">
      <div id="nb-mermaid-popup">
        <div className="nb-diagram-container">
          <div className="nb-img-container" style={{zoom}}>
            <img
              src={popup.meta.svg}
              style={{
                width: `${popup.meta.width}px`,
                height: `${popup.meta.height}px`,
              }}
            />
          </div>
        </div>
        <div className="nb-ui-footer">
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={zoom || 1}
            onChange={event => setZoom(Number(event.target.value))}
          />
          <div
            className="nb-ui-btn role-cancel"
            onClick={() => {
              ctx.editor.emitter.emitHaptic()
              ctx.editor.popup(null)
            }}
          >
            Close
          </div>
        </div>
      </div>
    </div>
  )
}
