import type {PresenterBlockProps as RawPresenterBlockProps} from "@/domain"
import type {PresenterBlockProps} from "@/adapter/dataManipulator/nbCRDTWithNBDB"

import DBSpreadsheetComponent from "./spreadsheet"
import DBBoardComponent from "./board"

export const DBComponent = (props: RawPresenterBlockProps): JSX.Element => {
  const template = props.block.props.DB_TEMPLATE?.[1]

  switch (template) {
  case "DB_SPREADSHEET":
    return <DBSpreadsheetComponent {...(props as PresenterBlockProps)} />
  case "DB_BOARD":
    return <DBBoardComponent {...(props as PresenterBlockProps)} />
  default:
    return (
      <div contentEditable={false}>
          [UNKNOWN TEMPLATE - {template ?? "NULL"}]
      </div>
    )
  }
}

export default DBComponent
