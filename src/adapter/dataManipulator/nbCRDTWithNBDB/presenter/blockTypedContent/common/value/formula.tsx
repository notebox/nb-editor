import type {ReactElement} from "react"

import {NBDBValueType, NBDBValue, NBDBString} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import {renderBooleanAsCheckbox} from "./bool"

export const renderFormulaResult = (value: NBDBValue) => {
  if (value.isError)
    return (
      <div className="nb-formula nb-db-error">
        {value.S.startsWith("[DecimalError]") ? "NaN" : value.S}
      </div>
    )

  let content: ReactElement | string | null
  switch (value.dataType) {
  case NBDBValueType.B:
    content = renderBooleanAsCheckbox(value.B)
    break
  case NBDBValueType.S:
    content = value.S
    break
  case NBDBValueType.N:
    content = value.S
    break
  case NBDBValueType.L:
    content = NBDBString.toData(value)
    break
  case NBDBValueType.D:
    content = NBDBString.toData(value)
    break
  }

  return <div className="nb-formula">{content}</div>
}
