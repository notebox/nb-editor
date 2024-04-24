import type {PresenterBlockProps} from "@/domain"

import {NoteBlockType, BlockType} from "@/domain"
import BasicBlock from "./basicText"
import ULComponent from "./ul"
import OLComponent from "./ol"
import CLComponent from "./cl"
import IMGComponent from "./img"
import HRComponent from "./hr"
import CodeblockComponent from "./code"
import MermaidComponent from "./mermaid"
import LinkComponent from "./link"

const BlockContentComponent = (props: PresenterBlockProps): JSX.Element => {
  switch (props.block.type) {
  case BlockType.Image:
    return <IMGComponent {...props} />
  case BlockType.OrderedList:
    return OLComponent(props)
  case BlockType.UnorderedList:
    return ULComponent(props)
  case BlockType.CheckList:
    return CLComponent(props)
  case BlockType.Line:
  case BlockType.Header1:
  case BlockType.Header2:
  case BlockType.Header3:
  case BlockType.Blockquote:
    return <BasicBlock {...props} />
  case BlockType.Divider:
    return HRComponent(props)
  case BlockType.Codeblock:
    return CodeblockComponent(props)
  case BlockType.Mermaid:
    return MermaidComponent(props)
  case BlockType.Linkblock:
    return LinkComponent(props)
  default:
    return props.ctx.editor.dataManipulator.renderCustomBlock(props) || (
      <div className="nb-no-editable">
          [UNKNOWN BLOCK - {props.block.type}]
      </div>
    )
  }
}

export const allowChildBlocks: {[type: string]: boolean} = {
  [NoteBlockType]: true,
  [BlockType.Line]: true,
  [BlockType.Header1]: true,
  [BlockType.Header2]: true,
  [BlockType.Header3]: true,
  [BlockType.Blockquote]: true,
  [BlockType.CheckList]: true,
  [BlockType.OrderedList]: true,
  [BlockType.UnorderedList]: true,
}

export default BlockContentComponent
