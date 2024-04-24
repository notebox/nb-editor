import type {TextBlock} from "@/domain/entity"
import type {PresenterBlockProps} from "@/domain/usecase"

import {NBRange} from "@/domain/entity"
import EditableText from "@/presenter/blocks/typedContent/common/EditableText"

const OLBlockComponent = (props: PresenterBlockProps): JSX.Element => (
  <div className="nb-ol">
    <div
      contentEditable={false}
      onClick={() => {
        props.ctx.editor.selector.select(
          NBRange.decode({
            blockID: props.block.blockID,
            offset: 0,
          })
        )
        props.ctx.state.reRender()
      }}
    >
      <div>{`${props.order}.`}</div>
    </div>
    <EditableText ctx={props.ctx} block={props.block as TextBlock} />
  </div>
)

export default OLBlockComponent
