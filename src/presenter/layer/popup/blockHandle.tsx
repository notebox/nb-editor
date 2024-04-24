import type {UIHandler} from "@/domain"
import type {BlockHandlePopup, PopupWithStyle} from "@/domain/usecase/state/popup"

import {NBRange, BlockType, BlockPropKey} from "@/domain/entity"

import Popup from "./Popup"

const BlockHandlePopupComponent = ({ctx, popup}: {
  ctx: UIHandler;
  popup: PopupWithStyle<BlockHandlePopup>;
}) => {
  return (
    <Popup ctx={ctx} style={popup.style}>
      <div className="nb-ui-menu">
        {popup.meta.blockType === BlockType.Linkblock ? (
          <div
            className="nb-ui-menu-item is-hoverable"
            onClick={event => {
              if (!ctx.state.popup.isPresented) return
              ctx.editor.popup({
                type: "link-url-setter",
                meta: {
                  purpose: {
                    to: "block",
                    blockID: popup.meta.blockID,
                  },
                  initial:
                    ctx.editor.dataManipulator.block(popup.meta.blockID).props[
                      BlockPropKey.Link
                    ]?.[1] ?? "",
                },
              }, event)
            }}
          >
            Edit URL
          </div>
        ) : null}
        {popup.meta.blockType === BlockType.Mermaid ? (
          <div
            className="nb-ui-menu-item is-hoverable"
            onClick={event => {
              if (!ctx.state.popup.isPresented) return

              const svgDOM = document.querySelector(
                `[data-nb-block="${popup.meta.blockID}"] .nb-mermaid-draw svg`
              )
              if (!svgDOM) return
              const blob = new Blob([svgDOM.outerHTML], {
                type: "image/svg+xml",
              })
              const url = URL.createObjectURL(blob)

              ctx.editor.popup({
                type: "mermaid",
                meta: {
                  svg: url,
                  width: svgDOM.clientWidth,
                  height: svgDOM.clientHeight,
                },
              }, event)
            }}
          >
            Full screen
          </div>
        ) : null}
        {ImageBTNs(ctx, popup)}
        <div
          className="nb-ui-menu-item is-hoverable"
          onClick={event => {
            if (!ctx.state.popup.isPresented) return
            ctx.editor.emitter.emitHaptic()
            const operator = ctx.editor.newOperator()
            operator.delBlock(popup.meta.blockID, true)
            ctx.editor.commit(operator)
            ctx.state.popup.dismiss(event, true)
          }}
        >
          Delete
        </div>
        <div
          className="nb-ui-menu-item is-hoverable"
          onClick={event => {
            if (!ctx.state.popup.isPresented) return
            ctx.editor.emitter.emitHaptic()
            const operator = ctx.editor.newOperator()
            const block = operator.insertLineBlockBelow(
              popup.meta.blockID,
              popup.meta.subPath
            )

            const autoSelection = block.hasText()
            if (autoSelection) {
              const range = NBRange.decode({
                blockID: block.blockID,
                offset: 0,
              })
              range.flagFromDom(true)
              ctx.editor.selector.select(range)
            }
            ctx.editor.commit(operator)
            ctx.state.popup.dismiss(event, autoSelection)
          }}
        >
          Insert below
        </div>
        {MoveBTN(ctx, popup)}
      </div>
    </Popup>
  )
}

const MoveBTN = (ctx: UIHandler, popup: PopupWithStyle<BlockHandlePopup>) => {
  if (!popup.meta.draggable) return null

  return (
    <div
      className="nb-ui-menu-item is-hoverable"
      onClick={event => {
        if (!ctx.state.popup.isPresented) return
        ctx.editor.emitter.emitHaptic()
        ctx.state.popup.dismiss(event, true)
        ctx.drag.onBlockDraggingStart(popup.meta.draggable!, {
          left: event.clientX,
          top: event.clientY,
        })
      }}
    >
      Move
    </div>
  )
}

const ImageBTNs = (ctx: UIHandler, popup: PopupWithStyle<BlockHandlePopup>) => {
  if (popup.meta.blockType != BlockType.Image) return null
  return (
    <>
      <div
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          if (!ctx.state.popup.isPresented) return
          ctx.editor.emitter.emitHaptic()
          const props = ctx.editor.dataManipulator.block(popup.meta.blockID).props
          const fileID = props.FILE_ID?.[1]
          if (!fileID) return
          const title = props.CAPTION?.[1] || undefined
          ctx.editor.emitter.openFile({fileID, title})
          ctx.state.popup.dismiss(event, true)
        }}
      >
        Open
      </div>
      <div
        className="nb-ui-menu-item is-hoverable"
        onClick={event => {
          if (!ctx.state.popup.isPresented) return
          ctx.editor.emitter.emitHaptic()
          ctx.state.working.willSelect({
            blockID: popup.meta.blockID,
            caret: {
              blockID: popup.meta.blockID,
              subPath: {type: "caption"},
            },
          })
          ctx.state.reRender()
          ctx.state.popup.dismiss(event, true)
        }}
      >
        Edit Caption
      </div>
    </>
  )
}

export default BlockHandlePopupComponent
