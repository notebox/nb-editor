import type {PresenterBlockProps} from "@/adapter/dataManipulator/nbCRDTWithNBDB"

import React from "react"
import {BlockPropKey} from "@/domain/entity"
import {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import Controller from "../common/controller"
import Container from "./container"

export const SpreadsheetComponent = (props: PresenterBlockProps): JSX.Element => {
  const [{state}] = React.useState(() => {
    const state = props.ctx.templates.get(props.block.blockID)
    return {
      state:
        state && state.type === BlockPropKey.DBSpreadsheet
          ? (state as NBDBSpreadsheet)
          : new NBDBSpreadsheet(props),
    }
  })

  return (
    <div
      contentEditable={false}
      data-nb-dom-type="boundary"
      data-nb-db-template="DB_SPREADSHEET"
    >
      <Controller ctx={props.ctx} state={state} />
      <Container ctx={props.ctx} state={state} />
    </div>
  )
}

export default SpreadsheetComponent
