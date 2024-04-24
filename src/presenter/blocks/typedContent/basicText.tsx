import type {TextBlock} from "@/domain/entity"
import type {PresenterBlockProps} from "@/domain/usecase"
import type {ReactTextTag} from "./common/EditableText"

import {BlockType} from "@/domain/entity"
import EditableText from "./common/EditableText"

const BasicBlock = (props: PresenterBlockProps): JSX.Element => (
  <EditableText
    ctx={props.ctx}
    block={props.block as TextBlock}
    Tag={blockTypeToReactTag[props.block.type]}
  />
)

const blockTypeToReactTag: {[key: string]: ReactTextTag} = {
  [BlockType.Line]: "div",
  [BlockType.Header1]: "h1",
  [BlockType.Header2]: "h2",
  [BlockType.Header3]: "h3",
  [BlockType.Blockquote]: "blockquote",
}

export default BasicBlock
