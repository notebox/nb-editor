import type {PresenterBlockProps} from "@/domain"

export const HRBlockComponent = (props: PresenterBlockProps): JSX.Element => {
  return (
    <div
      className="nb-no-editable"
      onClick={event => {
        event.preventDefault()
        event.stopPropagation()
        props.ctx.editor.emitter.emitHaptic()

        props.ctx.state.working.set(props.block.blockID)
      }}
    >
      <hr />
    </div>
  )
}

export default HRBlockComponent
