import type {TextBlock} from "@/domain/entity"
import type {PresenterBlockProps} from "@/domain/usecase"

import Checkbox from "@/presenter/common/icon/checkbox"
import EditableText from "@/presenter/blocks/typedContent/common/EditableText"

const CLBlockComponent = (props: PresenterBlockProps): JSX.Element => {
  return (
    <div className={props.block.props.DONE?.[1] ? "nb-cl done" : "nb-cl"}>
      <div
        contentEditable={false}
        onClick={() => {
          if (props.ctx.state.readOnly) return

          const operator = props.ctx.editor.newOperator()
          const blockProps = props.block.props
          operator.setBlockProps(props.block.blockID, {
            DONE: blockProps.DONE?.[1] ? null : true,
          })
          props.ctx.editor.commit(operator)
          props.ctx.editor.emitter.emitHaptic()
        }}
      >
        {Checkbox(props.block.props.DONE?.[1] || false)}
      </div>
      <EditableText ctx={props.ctx} block={props.block as TextBlock} />
    </div>
  )
}

export default CLBlockComponent
