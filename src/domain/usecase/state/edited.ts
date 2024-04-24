import type {RecoilState} from "recoil"

import {atom as genAtom} from "recoil"
import {setRecoilExternalState} from "./common"

export class EditedStateHandler {
  readonly atom: RecoilState<number>

  constructor(id: string) {
    this.atom = genAtom<number>({
      key: id + "edited",
      default: 0,
    })
  }

  set() {
    setRecoilExternalState(this.atom, cur => cur + 1)
  }
}
