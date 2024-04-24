import {Model} from "./editor"

export default ({
  model,
  toggleEditMode,
}: {
  model: Model;
  toggleEditMode: () => void;
}) => (
  <div className="nbdb-formula">
    <div
      placeholder="Edit"
      className="nbdb-formula-preview"
      dangerouslySetInnerHTML={{__html: model.html}}
      contentEditable={false}
      onClick={() => {
        model.editor.emitter.emitHaptic()
        toggleEditMode()
      }}
    ></div>
  </div>
)
