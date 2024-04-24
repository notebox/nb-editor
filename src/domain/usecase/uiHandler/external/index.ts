import type {
  NBRangeData,
  TextPropsDelta,
  BlockID,
  BlockPropsDelta,
  FileID,
  TextPropKey,
  Theme,
  Markdown,
  Editor
} from "@/domain"
import type {ReadOnlyOptions} from "@/domain/usecase"

import {NBRange, BlockType, BlockPropKey} from "@/domain/entity"
import {setMermaid} from "@/presenter/blocks/typedContent/mermaid/mermaid"
import {TextSearcher} from "./searcher"

export class ExternalEventHandler {
  editor: Editor
  searcher: TextSearcher

  constructor(editor: Editor) {
    this.editor = editor
    this.searcher = new TextSearcher(editor)
  }

  init = (_data: any, _readOnly: ReadOnlyOptions | false = false) => {
    this.editor.emitter.emitError(new Error("undefined initializer."))
  }

  /** @dev as global navigator for a-tags */
  navigate = (url: string) => {
    this.editor.emitter.emitNavigate(url)
  }

  setTheme(theme: Theme): void {
    try {
      window.document.body.className = `${theme}-theme`
      if (this.editor.state.theme.get() !== theme) {
        setMermaid(theme)
        this.editor.state.theme.set(theme)
      }
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  setDefaultFontSize(size: number): void {
    try {
      const stylesheet = window.document.createElement("style")
      stylesheet.innerText = `.ql-container { font-size: ${size}px !important; }`
      window.document.head.appendChild(stylesheet)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  applyRemoteBlock(data: any): void {
    try {
      this.editor.applyRemoteBlock(data)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  trackMergedNonce(blockID: BlockID, ctrbNonce: number): void {
    try {
      this.editor.trackMergedNonce(blockID, ctrbNonce)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  insertBlock(propsDelta: BlockPropsDelta): void {
    try {
      this.editor.insertBlock(propsDelta)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  setBlockType(type: BlockType): void {
    try {
      this.editor.setBlockType(type)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  setBlockProp(
    blockID: BlockID,
    propKey: BlockPropKey,
    propVal: true | string | number | null
  ): void {
    try {
      this.editor.setBlockProp(blockID, propKey, propVal)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  formatText(
    key: TextPropKey,
    value: TextPropsDelta[TextPropKey] = null
  ): void {
    try {
      this.editor.format(key, value)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  insertImage(
    key: BlockPropKey.Source | BlockPropKey.FileID,
    value: string
  ): void {
    try {
      this.editor.insertImageBlock(key, value)
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  focus(): void {
    try {
      const el =
        window.document.querySelector(
          "[data-nb-dom-type=\"editor\"][contenteditable=\"true\"]"
        ) ||
        window.document.querySelector(
          "[data-nb-dom-type=\"editor\"] [contenteditable=\"true\"]"
        );
      (el as any)?.focus()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  blur(): void {
    try {
      this.editor.selector.blur()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  indent(): void {
    try {
      this.editor.indent()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  dedent(): void {
    try {
      this.editor.dedent()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  undo(): void {
    try {
      this.editor.undo()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  redo(): void {
    try {
      this.editor.redo()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  markUploadedFile(fileID: FileID): void {
    try {
      this.editor.emitter.uploader.release(fileID)
      this.editor.state.reRender()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  select(data: NBRangeData): void {
    try {
      const editor = this.editor
      if (!editor) return

      const range = NBRange.decode(data.start, data.end)
      if (!editor.selector.isFocused) {
        editor.selector.focus()
      }
      editor.selector.select(range)
      editor.syncSelection()
    } catch (err) {
      this.editor.emitter.emitError(err)
    }
  }

  iOSKeyboardShowUp() {
    const input = document.createElement("input")
    input.setAttribute("style", "position: fixed; inset: 10px;")
    document.body.appendChild(input)
    input.focus()
    document.body.removeChild(input)
  }

  reloadImages(fileURL: string) {
    const newFileURL = `${fileURL}&${Date.now()}`
    document
      .querySelectorAll<HTMLImageElement>(`img[src^='${fileURL}']`)
      .forEach(img => {
        img.src = newFileURL
      })
  }

  lock(readOnly: boolean) {
    this.editor.setReadOnly(readOnly)
  }

  markdown(): Markdown {
    return this.editor.markdown() || {markdown: "", resources: []}
  }
}
