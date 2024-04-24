import type {UIHandler} from "@/domain"
import type {PopupStyle} from "@/domain/usecase/state/popup"

import {useState, useLayoutEffect} from "react"

export default ({
  ctx,
  style,
  children,
  preventDismiss,
  onConfirm,
}: {
  ctx: UIHandler
  style?: PopupStyle;
  children: JSX.Element;
  preventDismiss?: boolean;
  onConfirm?: () => void;
}) => {
  const editor = ctx.editor
  const [clickFromPopup, setClickFromPopup] = useState(false)

  useLayoutEffect(() => {
    if (preventDismiss) return
    const onGlobalKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        editor.popup(null)
      } else if (event.key === "Enter") {
        event.preventDefault()
        event.stopPropagation()
        onConfirm?.()
        editor.popup(null)
      }
    }

    window.addEventListener("keypress", onGlobalKeyPress)
    return () => {
      window.removeEventListener("keypress", onGlobalKeyPress)
    }
  }, [])

  return (
    <div
      id="nb-ui-layer-popup"
      onClick={event => {
        if (preventDismiss) return
        if ((event.target as any).id !== "nb-ui-layer-popup") return
        if (clickFromPopup) {
          setClickFromPopup(false)
          return
        }
        event.preventDefault()
        event.stopPropagation()
        editor.state.popup.dismiss()
      }}
      style={style ? undefined : {display: "flex"}}
    >
      <div
        id="nb-ui-popup"
        style={style ?? {margin: "auto"}}
        onMouseDown={() => {
          if (preventDismiss) return
          setClickFromPopup(true)
        }}
        onMouseUp={() => {
          if (preventDismiss) return
          setClickFromPopup(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}
