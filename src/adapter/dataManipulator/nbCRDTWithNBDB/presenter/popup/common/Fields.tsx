import type {DBFieldID} from "@/domain"
import type {NBDBField} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"

export default (
  fields: NBDBField[],
  onClick: (labelID: DBFieldID) => void,
  theme: string
) => (
  <div className={`nb-ui-list ${theme}-theme`}>
    {fields.map(field => (
      <div
        className="nb-ui-list-item is-hoverable"
        key={field.fieldID}
        onClick={() => onClick(field.fieldID)}
      >
        <NBDBSymbol type={field.type} />
        {field.name}
      </div>
    ))}
  </div>
)
