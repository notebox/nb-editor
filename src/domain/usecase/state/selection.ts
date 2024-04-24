import type {RecoilState} from "recoil"
import type {BlockID, NBBlock, NBRange} from "@/domain/entity"

import {atom as genAtom} from "recoil"
import {domBlock} from "@/domain"
import {setRecoilExternalState} from "./common"

export class SelectionHandler {
  readonly atom: RecoilState<SelectedBlock[] | undefined>

  constructor(id: string) {
    this.atom = genAtom<SelectedBlock[] | undefined>({
      key: id + "selection",
      default: undefined,
    })
  }

  private selectedBlocks?: SelectedBlock[]

  get hasSelectedBlocks() {
    return !!this.selectedBlocks?.length
  }

  setSelectionChanged(range: NBRange | null, blocks: NBBlock[]) {
    if (range) {
      this.selectedBlocks = genSelectedBlocks(range, blocks)
    } else {
      delete this.selectedBlocks
    }
    setRecoilExternalState(this.atom, this.selectedBlocks)
  }
}

const genSelectedBlocks = (range: NBRange, blocks: NBBlock[]): SelectedBlock[] => {
  if (range.isCollapsed && range.isTextEditable) return []

  // const blocks = editor.dataManipulator.selectedBlocks(
  //   range.start.blockID,
  //   range.end.blockID
  // )
  const last = blocks[blocks.length - 1]

  if (
    range.start.offset ||
    range.start.subPath?.type === "db" ||
    (blocks.length === 1 && range.isTextEditable)
  ) {
    blocks.shift()
  }
  if (
    range.end.offset != null &&
    range.end.offset < (last.text?.length() ?? 0)
  ) {
    blocks.pop()
  }
  // blocks = lowLevel.removeNoteBlockAndChildren(blocks);

  const result: SelectedBlock[] = []
  blocks.forEach(block => {
    try {
      const dom = domBlock(block.blockID).querySelector(".nb-block-content")!
      const rect = dom.getBoundingClientRect()
      result.push({
        blockID: block.blockID,
        position: {
          left: rect.left + window.pageXOffset,
          top: rect.top + window.pageYOffset,
          width: rect.width,
          height: rect.height,
        },
      })

      /* eslint-disable-next-line no-empty */
    } catch {}
  })

  return result
}

type Position = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type SelectedBlock = {
  blockID: BlockID;
  position: Position;
};
