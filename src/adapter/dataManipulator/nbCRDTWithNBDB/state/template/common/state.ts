import type {BlockID, Editor} from "@/domain"
import type {NBDBTemplate} from "./template"

import {BlockType} from "@/domain"

export class Templates {
  editor: Editor

  private states: {[blockID: string]: NBDBTemplate} = {}

  constructor(editor: Editor) {
    this.editor = editor
  }

  get(blockID: BlockID): NBDBTemplate | undefined {
    return this.states[blockID]
  }

  add(blockID: BlockID, state: NBDBTemplate) {
    this.states[blockID] = state
  }

  update(blockIDs: Set<BlockID>): void {
    const templates = Object.values(this.states)
    const handled = new Set<BlockID>()
    blockIDs.forEach(blockID => {
      const blockType = this.editor.dataManipulator.block(blockID)?.type
      if (blockType === BlockType.Database || blockType === BlockType.DBRecord) {
        handled.add(blockID)
      }
    })
    templates.forEach(template => template.update(handled))
  }
}