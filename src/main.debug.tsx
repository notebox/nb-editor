import {createRoot} from "react-dom/client"

import {NBDBContext} from "./adapter/dataManipulator/nbCRDTWithNBDB"
import {DebugEmitter} from "./adapter/device/debug"
import {stateData} from "./demo/basics"
import {NBEditorWithToolbar} from "./main.component"

const target = document.createElement("div")
target.className = "container"
document.body.removeChild(document.getElementsByTagName("noscript")[0])
document.body.appendChild(target)

const emitter = new DebugEmitter()
const ctx = new NBDBContext({emitter}) // Add the 'external' property with an empty object
ctx.initialize(stateData, false)

window.notebox = ctx.external

createRoot(target).render(
  <NBEditorWithToolbar ctx={ctx} theme="black-theme" />
)
