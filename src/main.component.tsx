import type {UIHandler} from "./domain"

import {Toolbar} from "./presenter/external/toolbar"
import {Component} from "./presenter"

export const NBEditor = Component
export const NBEditorWithToolbar = ({ctx, theme}: {ctx: UIHandler, theme: "light-theme" | "black-theme"}) => {
  return (
    <div className={theme} style={{display: "flex", flexDirection: "column"}}>
      <Toolbar ctx={ctx} />
      <Component ctx={ctx} />
    </div>
  )
}
