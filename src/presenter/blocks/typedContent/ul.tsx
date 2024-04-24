import type {TextBlock} from "@/domain/entity"
import type {PresenterBlockProps} from "@/domain/usecase"

import {NBRange} from "@/domain/entity"
import EditableText from "@/presenter/blocks/typedContent/common/EditableText"

const ULBlockComponent = (props: PresenterBlockProps): JSX.Element => (
  <div className="nb-ul">
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
      <div> • </div>
    </div>
    <EditableText ctx={props.ctx} block={props.block as TextBlock} />
  </div>
)

export default ULBlockComponent
