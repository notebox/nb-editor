import type {BlockID, TextBlock, Theme, PresenterBlockProps, UIHandler} from "@/domain"

import React from "react"
import {NBRange} from "@/domain/entity"
import {useRecoilValue} from "recoil"
import EditableText from "@/presenter/blocks/typedContent/common/EditableText"
import mermaid from "./mermaid"

export const MermaidBlockComponent = (props: PresenterBlockProps): JSX.Element => {
  const block = props.block as TextBlock
  const data = block.text.toString()

  const expand =
    (props.ctx.state.readOnly && props.ctx.state.readOnly.expanded) ||
    props.ctx.editor.selector.selection?.start.blockID === block.blockID

  return (
    <div>
      {expand ? <EditableText ctx={props.ctx} block={block} /> : null}
      <MemoizedMermaidDrawing
        ctx={props.ctx}
        blockID={block.blockID}
        data={data}
        onClick={event => onClickDrawing(event, {...props, offset: 0})}
      />
    </div>
  )
}

const onClickDrawing = (
  event: React.SyntheticEvent,
  {ctx, block, propKey, offset}: PresenterBlockProps
) => {
  event.preventDefault()
  event.stopPropagation()
  ctx.editor.emitter.emitHaptic()
  if (
    ctx.editor.selector.selection?.start.blockID === block.blockID &&
    ctx.editor.selector.selection?.end.blockID === block.blockID
  ) {
    ctx.editor.selector.deselect()
  } else {
    const pointData = propKey
      ? {blockID: block.blockID, propKey}
      : {blockID: block.blockID, offset}
    const range = NBRange.decode(pointData)
    range.flagFromDom(true)
    ctx.editor.selector.select(range)
  }
  ctx.state.reRender()
}

const MermaidDrawing = (props: {
  ctx: UIHandler;
  blockID: BlockID;
  data: string;
  onClick: React.ReactEventHandler<Element>;
}): JSX.Element => {
  let svg: string | null = null
  let syntaxError = false

  const theme = useRecoilValue(props.ctx.state.theme.atom)

  if (props.data) {
    try {
      svg = draw(mermaidID(props.blockID), props.data, theme)
    } catch (err) {
      syntaxError = true
    }
  }

  const html = syntaxError ? mermaidErroredSVG : svg || mermaidErroredSVG
  window.document.getElementById(`dnb-mermaid-${props.blockID}`)?.remove()

  return (
    <div
      className="nb-mermaid-draw nb-no-editable"
      style={svg ? {marginBottom: "8px"} : {margin: "1em"}}
      onClick={props.onClick}
      dangerouslySetInnerHTML={{__html: html}}
    />
  )
}

const mermaidID = (blockID: BlockID): string => `nb-mermaid-${blockID}`
const mermaidErroredSVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path
d="M18.4 18.5H13.6C12.925 18.5 12.4 19.0625 12.4 19.7V24.5C12.4 25.175 12.925 25.7 13.6 25.7H18.4C19.0375 25.7 19.6 25.175 19.6 24.5V19.7C19.6 19.0625 19.0375 18.5 18.4 18.5ZM11.2 7.7C11.2 7.0625 10.6375 6.5 10 6.5H5.2C4.525 6.5 4 7.0625 4 7.7V12.5C4 13.175 4.525 13.7 5.2 13.7H8.7625L11.5 18.5375C11.9125 17.7875 12.7 17.3 13.6 17.3L11.2 13.1V11.3H19.6V8.9H11.2V7.7ZM26.8 6.5H22C21.325 6.5 20.8 7.0625 20.8 7.7V12.5C20.8 13.175 21.325 13.7 22 13.7H26.8C27.4375 13.7 28 13.175 28 12.5V7.7C28 7.0625 27.4375 6.5 26.8 6.5Z"
fill='red'
/>
</svg>`
const cachedSVG: {
  [domID: string]: [theme: Theme, data: string, html: string];
} = {}
const draw = (domID: string, data: string, theme: Theme) => {
  const cached = cachedSVG[domID]
  if (cached && cached[0] === theme && cached && cached[1] === data) {
    return cached[2]
  }

  const svg = mermaid.render(domID, data)
  cachedSVG[domID] = [theme, data, svg]
  return svg
}

const MemoizedMermaidDrawing = React.memo(MermaidDrawing, (prev, next) => {
  return prev.data === next.data
})

export default MermaidBlockComponent
