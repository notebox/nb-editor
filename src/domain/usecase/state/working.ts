import type {RecoilState} from "recoil"
import type {BlockID, NBRange, SubPath} from "@/domain/entity"
import type {Editor} from "@/domain/usecase/editor"
import type {Operator} from "@/domain/usecase/dataManipulator"

import _ from "lodash"
import {atom as genAtom} from "recoil"
import {setRecoilExternalState} from "./common"

export class WorkingStateHandler {
  constructor(id: string) {
    this.atom = genAtom<Working>({
      key: id + "working",
      default: {},
    })
  }

  // caret
  readonly atom: RecoilState<Working>
  workingCaret?: WorkingCaret

  // selector
  iPadScribble: string | null = null
  composing: null | {
    blockID: BlockID;
    subPath?: SubPath;
    start: number;
    end: number | null;
  } = null

  // texting
  delayedOperator: DelayedOperator | undefined

  private spaceByComposition = false

  consumeSpaceByComposition(): boolean {
    const result = this.spaceByComposition
    this.spaceByComposition = false
    return result
  }

  setSpaceByComposition(data: string) {
    if (data !== " ") return
    this.spaceByComposition = true
  }

  delayOperator(editor: Editor, operator: Operator): void {
    /** @verbose executes existing delayed operation */
    if (this.delayedOperator) {
      this.delayedOperator.stack += 1
      return
    }

    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    const texting = this
    this.delayedOperator = {
      timeout: window.setTimeout(() => {
        delete texting.delayedOperator
        operator.deleteBackward()
        editor.commit(operator, true)
      }),
      stack: 1,
    }
  }

  // hovered block || selected block
  private workingBlockID?: BlockID
  private isLocked = false

  isWorkingBlock(blockID: BlockID): boolean {
    return this.workingBlockID === blockID
  }

  lock(bool: boolean) {
    this.isLocked = bool
  }

  set(blockID: BlockID): void {
    if (this.isLocked || this.workingBlockID == blockID) return
    this.workingBlockID = blockID
    delete this.workingCaret
    this.setRecoil()
  }

  select(range: NBRange | null) {
    if (this.isLocked) return
    if (!range) {
      delete this.workingBlockID
      delete this.workingCaret
    } else {
      if (range.start.subPath?.type === "db") {
        this.workingBlockID = range.start.subPath.recordBlockID
      } else {
        this.workingBlockID = range.start.blockID
      }

      if (
        range.start.blockID === range.end?.blockID &&
        _.isEqual(range.start.subPath, range.end.subPath)
      ) {
        this.workingCaret = {
          blockID: range.start.blockID,
          subPath: range.start.subPath,
        }
      } else {
        delete this.workingCaret
      }
    }
    this.setRecoil()
  }

  willSelect(working: Working) {
    this.lock(true)
    this.workingBlockID = working.blockID
    this.workingCaret = working.caret
    this.setRecoil()
  }

  hover(blockID?: BlockID) {
    if (this.workingBlockID === blockID) return
    this.workingBlockID = blockID
    this.setRecoil()
  }

  private setRecoil() {
    setRecoilExternalState(this.atom, {
      blockID: this.workingBlockID,
      caret: this.workingCaret,
    })
  }
}

export type Working = {
  blockID?: BlockID;
  caret?: WorkingCaret; // means collapsed caret.
};
export type WorkingCaret = {
  blockID: BlockID;
  subPath?: SubPath;
};
type DelayedOperator = {
  timeout: number;
  stack: number;
};
