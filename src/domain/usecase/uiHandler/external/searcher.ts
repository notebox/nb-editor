import type {Editor} from "@/domain/usecase/editor"

const searchingRootClassName = "nb-searching"
const layerID = "interact-protection-for-searching"

export class TextSearcher {
  readonly editor: Editor
  isSearching = false

  constructor(editor: Editor) {
    this.editor = editor
  }

  endSearching = () => {
    if (!this.isSearching) return
    this.isSearching = false

    const layer = document.getElementById(layerID)
    if (!layer) return
    layer.removeEventListener("click", () => this.endSearching())

    const root = document.getElementsByClassName("nb-root")[0]!
    root.removeChild(layer)
    this.isSearching = false
    root.classList.remove(searchingRootClassName)

    this.editor.emitter.emitSearchMode(false)
  }

  search = (text: string, backwards = false): boolean => {
    if (!this.isSearching) this.startSearching()
    const selection = window.getSelection()
    if (
      selection?.isCollapsed === false &&
      selection.toString().toLowerCase() !== text.toLowerCase()
    ) {
      selection.collapseToStart()
    }
    return window.find(text, false, backwards, true, false, false, false)
  }

  private startSearching() {
    if (this.isSearching) return
    this.isSearching = true

    const layer = document.createElement("div")
    layer.id = layerID
    layer.setAttribute("style", "position: fixed; inset: 0")
    layer.addEventListener("click", () => this.endSearching())

    const root = document.getElementsByClassName("nb-root")[0]!
    root.appendChild(layer)
    root.classList.add(searchingRootClassName)

    this.editor.emitter.emitSearchMode(true)
  }
}
