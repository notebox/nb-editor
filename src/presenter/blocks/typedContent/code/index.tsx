import type {PresenterBlockProps} from "@/domain/usecase"

import {BlockPropKey} from "@/domain/entity"
import {CodeblockDecorator} from "./decorator"
import {CodeKey} from "@/domain/usecase/props/codeLangs"

const propKey = BlockPropKey.Language
const Codeblock = ({ctx, block}: PresenterBlockProps): JSX.Element => {
  const html = CodeblockDecorator.tokenize(ctx.state, block)

  const propVal = block.props[propKey]?.[1] ?? "plain"

  return (
    <div>
      <div
        className="language nb-no-editable"
        onClick={event =>
          ctx.editor.popup({
            type: "code-language",
            meta: {
              blockID: block.blockID,
              initial: propVal as CodeKey,
            },
          }, event)
        }
      >
        <div>{propVal}</div>
      </div>
      <div className="code">
        <div
          contentEditable={!ctx.state.readOnly}
          suppressContentEditableWarning
          data-nb-dom-type="text"
          placeholder=" "
          dangerouslySetInnerHTML={{
            __html: html + "\n",
          }}
        />
      </div>
    </div>
  )
}

export default Codeblock
