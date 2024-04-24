import {Model} from "./editor"
import {domRangeFromHTML} from "@/domain"
import {useState, useLayoutEffect, useRef} from "react"

import React from "react"
import {useIsomorphicLayoutEffect} from "@/utils/react"

export default (props: {
  onCancel: () => void;
  onChange: (content: string) => void;
  model: Model;
  html: string;
}) => {
  const [composing, setComposing] = useState(false)

  return (
    <MemoizedText
      model={props.model}
      html={props.html}
      composing={composing}
      setComposing={setComposing}
      onChange={props.onChange}
      onCancel={props.onCancel}
    />
  )
}

const EditableText = (props: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  useIsomorphicLayoutEffect(() => {
    props.model.dom = ref.current
    window.document.addEventListener(
      "selectionchange",
      props.model.onSelectionChange
    )

    return () => {
      window.document.removeEventListener(
        "selectionchange",
        props.model.onSelectionChange
      )
    }
  })

  useLayoutEffect(() => {
    if (ref.current && props.model.selection) {
      const start = domRangeFromHTML(ref.current, props.model.selection[0])
      const end = domRangeFromHTML(ref.current, props.model.selection[1])
      window.document
        .getSelection()
        ?.setBaseAndExtent(start[0], start[1], end[0], end[1])
    }
  })

  return (
    <div
      ref={ref}
      className="nbdb-formula-preview"
      contentEditable="true"
      suppressContentEditableWarning
      placeholder="formula"
      dangerouslySetInnerHTML={{__html: props.html}}
      onInput={event => props.onChange((event.target as any).textContent)}
      onCompositionStart={() => props.setComposing(true)}
      onCompositionEnd={() => props.setComposing(false)}
      data-gramm={false}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="on"
      role="textbox"
      onKeyUp={event => {
        if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          props.onCancel()
        }
      }}
    />
  )
}

const MemoizedText = React.memo(EditableText, (prev, next) => {
  return next.composing || prev.html === next.html
})

export type ReactTextTag = "div" | "h1" | "h2" | "h3" | "blockquote";

type Props = {
  html: string;
  model: Model;
  composing: boolean;
  onCancel: () => void;
  onChange: (content: string) => void;
  setComposing: (composing: boolean) => void;
};
