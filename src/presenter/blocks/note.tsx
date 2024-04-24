import type {UIHandler} from "@/domain/usecase"

import EditableText from "@/presenter/blocks/typedContent/common/EditableText"
import {BlockChildrenComponent} from "@/presenter/blocks"

const NoteComponent = ({ctx}: {ctx: UIHandler}): JSX.Element => {
  const block = ctx.editor.dataManipulator.rootBlock()
  return (
    <div
      data-nb-block={block.blockID}
      data-nb-block-type={block.type}
      data-nb-dom-type="note"
    >
      <div className="nb-block-body">
        <div className="nb-block-content">
          <div className="note-title">
            <EditableText ctx={ctx} block={block} />
          </div>
        </div>
        {BlockChildrenComponent({ctx, block, order: 0}, true)}
      </div>
    </div>
  )
}

export default NoteComponent
