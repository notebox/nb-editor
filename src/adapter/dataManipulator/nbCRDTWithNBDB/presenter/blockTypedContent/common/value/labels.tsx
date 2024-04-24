import type {NBDBLabel} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

import LabelComponent from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/label"

export const renderLabels = (labels: NBDBLabel[]) => {
  return (
    <div className="nb-db-labels">
      {labels.map(label => (
        <LabelComponent
          key={label.labelID}
          name={label.name}
          color={label.color}
        />
      ))}
    </div>
  )
}
