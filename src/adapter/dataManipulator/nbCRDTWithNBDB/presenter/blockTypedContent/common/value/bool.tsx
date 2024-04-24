import Checkbox from "@/presenter/common/icon/checkbox"

export const renderBooleanAsCheckbox = (bool: boolean) => (
  <div className="nb-db-boolean">{Checkbox(bool)}</div>
)
export const renderBoolean = (
  fieldName: string,
  bool: boolean
): JSX.Element => {
  return (
    <div className="nb-db-bool-value">
      {Checkbox(bool)}
      <div className="nb-db-bool-field-name">{fieldName}</div>
    </div>
  )
}
