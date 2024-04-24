import {Editor} from "@/domain"

export const Footer = (props: {
  editor: Editor;
  done: () => void;
  delete?: () => void;
  disabledDone?: boolean;
}) => (
  <div className="ui-popup-footer">
    {props.delete ? (
      <div className="nb-ui-leading">
        <div
          className="nb-ui-btn role-delete"
          onClick={() => {
            props.editor.emitter.emitHaptic()
            props.delete?.()
          }}
        >
          Delete
        </div>
      </div>
    ) : null}
    <div
      className="nb-ui-btn role-cancel"
      onClick={() => {
        props.editor.emitter.emitHaptic()
        props.editor.popup(null)
      }}
    >
      Cancel
    </div>
    <div
      className="nb-ui-btn role-default"
      onClick={() => {
        if (props.disabledDone) return
        props.editor.emitter.emitHaptic()
        props.done()
      }}
      data-nb-disabled={props.disabledDone}
    >
      Done
    </div>
  </div>
)

export const Header = (props: {
  editor: Editor;
  cancel: () => void;
  done: () => void;
  disabledDone?: boolean;
}) => (
  <div className="ui-popup-header">
    <div
      className="nb-ui-btn role-cancel"
      onClick={() => {
        props.editor.emitter.emitHaptic()
        props.cancel()
      }}
    >
      Cancel
    </div>
    <div
      className="nb-ui-btn role-default"
      onClick={() => {
        if (props.disabledDone) return
        props.editor.emitter.emitHaptic()
        props.done()
      }}
      data-nb-disabled={props.disabledDone}
    >
      Done
    </div>
  </div>
)
