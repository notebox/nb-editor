import React from "react"
import PlusIcon from "@/presenter/common/icon/plus"

export default ({onClick}: {onClick: React.MouseEventHandler}) => (
  <div className="nbdb-adder" onClick={onClick}>
    <PlusIcon />
  </div>
)
