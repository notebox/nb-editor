import type {Theme} from "@/domain/entity"

import {RecoilState, atom as genAtom} from "recoil"

import {getRecoilExternalLoadable, setRecoilExternalState} from "./common"

export class ThemeStateHandler {
  readonly atom: RecoilState<Theme>

  constructor(id: string) {
    this.atom = genAtom<Theme>({
      key: id + "theme",
      default: "light",
    })
  }

  get() {
    return getRecoilExternalLoadable(this.atom)?.getValue()
  }

  async set(state: Theme) {
    setRecoilExternalState(this.atom, state)
  }
}
