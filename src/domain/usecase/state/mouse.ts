import type {RecoilState} from "recoil"

import {atom as genAtom} from "recoil"
import {setRecoilExternalState} from "./common"

export class MouseStateHandler {
  readonly atom: RecoilState<Area | undefined>
  area?: Area

  constructor(id: string) {
    this.atom = genAtom<Area | undefined>({
      key: id+"mouse",
      default: undefined,
    })
  }

  update(area?: Area) {
    this.area = area
    setRecoilExternalState(this.atom, area)
  }
}

type Position = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Area = {
  start: {
    x: number;
    y: number;
  };
  end?: {
    x: number;
    y: number;
  };
  position?: Position;
};
