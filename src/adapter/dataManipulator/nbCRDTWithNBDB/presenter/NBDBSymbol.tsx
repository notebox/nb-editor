import type {DBFieldType} from "@/domain/entity"
import {FormulaReturnType} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/popup/common/formula/selector/helpers"

export default ({type}: {type: FormulaReturnType | DBFieldType}) => {
  switch (type) {
  case "BOOLEAN":
  case FormulaReturnType.Bool:
    return <div className="nbdb-symbol-bool">B</div>
  case "DATE":
  case FormulaReturnType.Date:
    return <div className="nbdb-symbol-date">D</div>
  case "NUMBER":
  case FormulaReturnType.Number:
    return <div className="nbdb-symbol-number">N</div>
  case "VALUE":
  case FormulaReturnType.String:
    return <div className="nbdb-symbol-string">S</div>
  case "FORMULA":
  case FormulaReturnType.Any:
    return <div className="nbdb-symbol-any">?</div>
  case "LABEL":
  case "LABELS":
    return <div className="nbdb-symbol-labels">L</div>
  }
}
