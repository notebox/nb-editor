import type {UIHandler} from "@/domain"

import React, {useEffect, useRef} from "react"
import {NBRange} from "@/domain"
import NoteComponent from "@/presenter/blocks/note"
import {useIsomorphicLayoutEffect} from "@/utils/react"

export default (props: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const {autoFocus = true, isCardView, ctx, ...attributes} = props
  const editor = ctx.editor
  const readOnly = editor.state.readOnly

  const style: React.CSSProperties = {
    outline: "none",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    ...attributes.style,
  }

  if (isCardView || (!readOnly && editor.selector.isFocused)) {
    attributes.contentEditable = true
    attributes.suppressContentEditableWarning = true
  } else {
    attributes.onClick = event => {
      event.preventDefault()
      event.stopPropagation()
      const lastBlock = editor.dataManipulator.lastBlock()
      editor.selector.select(
        NBRange.decode({
          blockID: lastBlock.blockID,
          offset: lastBlock.text?.length(),
        })
      )
      editor.state.reRender()
    }
  }

  /** @purpose sync DOMSelection whenever the editor updates */
  useIsomorphicLayoutEffect(editor.syncSelection)

  /** @purpose autoFocus */
  useEffect(() => {
    if (ref.current && autoFocus) {
      ref.current.focus()
    }
  }, [autoFocus])

  ctx.addWritableEditorEventListeners(ref)

  return (
    <div
      ref={ref}
      data-nb-dom-type="editor"
      /**
       * @compat The Grammarly Chrome extension works by changing the DOM
       * out from under `contenteditable` elements, which leads to weird
       * behaviors so we have to disable it like editor. (2017/04/24)
       */
      data-gramm={false}
      role="textbox"
      {...attributes}
      style={style}
      onBlur={editor.selector.onBlur}
      onDragStart={ctx.clipboard.onDragStart}
      onDrop={ctx.clipboard.onDrop}
      onFocus={editor.selector.onFocus}
      onCopy={ctx.clipboard.onCopy}
      onCut={ctx.clipboard.onCut}
      onPaste={ctx.clipboard.onPaste}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="on"
    >
      <NoteComponent ctx={ctx} />
    </div>
  )
}

export type Props = {
  id?: string;
  ctx: UIHandler;
  autoFocus: boolean;
  isCardView: boolean;
  style?: React.CSSProperties;
} & React.TextareaHTMLAttributes<HTMLDivElement>;
