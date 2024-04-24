import type {TextBlock, NBText} from "@/domain/entity"
import type {UIHandler} from "@/domain/usecase"

import React from "react"
import {htmlFromTextContent} from "./textContent"

const EditableText = (props: Props) => {
  const {Tag = "div", block} = props

  return (
    <Tag
      contentEditable={!props.ctx.state.readOnly}
      suppressContentEditableWarning
      data-nb-dom-type="text"
      placeholder=" "
      dangerouslySetInnerHTML={{
        __html: htmlFromText(block.text),
      }}
    />
  )
}

const htmlFromText = (text: NBText): string => {
  return text
    .spans()
    .reduce<string>((acc, cur) => acc + htmlFromTextContent(cur.content), "")
}

const MemoizedText = React.memo(EditableText, (_, next) => {
  if (next.ctx.state.working.composing?.blockID === next.block.blockID) {
    return true
  }
  return !next.ctx.state.changed.extract(next.block.blockID)
})

export type ReactTextTag = "div" | "h1" | "h2" | "h3" | "blockquote";

type Props = {
  ctx: UIHandler;
  block: TextBlock;
  Tag?: ReactTextTag;
};

export default MemoizedText
