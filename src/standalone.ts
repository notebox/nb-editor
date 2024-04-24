import type {EditorEmitter} from "@/domain"

import {render} from "@/presenter"
import {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"

export const launch = (emitter: EditorEmitter) => {
  document.body.removeChild(document.getElementsByTagName("noscript")[0])
  const target = document.createElement("div")
  target.className = "nb-root"
  document.body.appendChild(target)

  if (!target) throw new Error("root element not found")

  const ctx = new NBDBContext({emitter})

  window.notebox = ctx.external
  window.notebox.init = ctx.initialize.bind(ctx)
  render(target, ctx)

  ctx.editor.emitter.emitConnected()
}
