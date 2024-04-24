import type {DBLabelID} from "@/domain"
import type {NBDBLabel} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

import Label from "../common/Label"

export default (
  labels: NBDBLabel[],
  onClick: (labelID: DBLabelID) => void,
  theme: string,
  children?: JSX.Element
) => (
  <div className={`nbdb-labels ${theme}-theme`}>
    {labels.map(label => (
      <Label
        key={label.labelID}
        labelID={label.labelID}
        name={label.name}
        color={label.color}
        onClick={() => onClick(label.labelID)}
        isHoverable
      />
    ))}
    {children}
  </div>
)
