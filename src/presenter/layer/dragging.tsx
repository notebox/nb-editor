import type {State} from "@/domain/usecase/state"

import {useRecoilValue} from "recoil"

export default ({state}: {state: State}): JSX.Element => {
  const atom = useRecoilValue(state.drag.atom)

  return (
    <div
      className="nb-ui-layer dragging"
      style={{display: atom.position ? undefined : "none"}}
    >
      <div id="nb-ui-layer-ghost" style={atom.position}>
        <div id="nb-ui-layer-ghost-contents" style={atom.style}></div>
      </div>
    </div>
  )
}
