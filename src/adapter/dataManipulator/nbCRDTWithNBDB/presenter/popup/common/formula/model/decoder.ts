import type {DBFormula} from "@/domain/entity"

import {helpers as operators} from "./helper/operator"

export default (formula?: DBFormula): string => {
  return formula ? stringify(formula) : ""
}

const stringify = (formula: DBFormula): string => {
  switch (typeof formula) {
  case "string":
    return `"${formula}"`
  case "boolean":
    return String(formula)
  default:
    break
  }

  if (formula.length > 1) {
    const key = formula[0]
    if (key === "N") {
      return `${formula[1]}`
    }
    if (key === "group") {
      return `(${stringify(formula[1])})`
    }
    if (operators[key]) {
      if (key === "!") {
        return `!${stringify(formula[1])}`
      }
      return `${stringify(formula[1])} ${key} ${stringify(formula[2])}`
    }
    return `${formula[0]}(${formula.slice(1).map(stringify).join(", ")})`
  } else {
    return `${formula[0]}()`
  }
}
