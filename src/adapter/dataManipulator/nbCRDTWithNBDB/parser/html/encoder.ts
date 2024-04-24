import type {DBDateRange} from "@/domain"
import type {NBDBEvaluatedValue} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {BlockContentData} from "@/adapter/dataManipulator/nbCRDT/parser/data"
import type {NBDBContent} from "@/adapter/dataManipulator/nbCRDTWithNBDB/parser/data"

import {BlockType} from "@/domain"
import {NBDBString} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

export const encodeToHTML = (data: BlockContentData): string => {
  const customData = data.custom?.[BlockType.Database] as NBDBContent | undefined
  if (!customData) return ""

  let result = "<table>"

  if (data.props.CAPTION) {
    result += `<caption>${data.props.CAPTION}</caption>`
  }

  const fields = customData.table.allFields.filter(field => field.visible)

  result += "<thead>"
  fields.forEach(field => {
    result += `<th>${field.name}</th>`
  })
  result += "</thead><tbody>"

  customData.table.allRecords.forEach(record => {
    let tr = "<tr>"
    fields.forEach(field => {
      tr += `<td>${evaluatedFieldToString(
        record.evaluated[field.fieldID]
      )}</td>`
    })
    result += tr + "</tr>"
  })

  return result + "</tbody></table>"
}

export const evaluatedFieldToString = (
  evaluated: NBDBEvaluatedValue,
  html = true
): string | boolean => {
  if (evaluated.value == null) return ""

  switch (evaluated.fieldType) {
  case "DATE":
    return evaluated.value.D
      ? dateRangeToString(evaluated.value.D, html)
      : ""
  default:
    return NBDBString.toData(evaluated.value)
  }
}

const dateRangeToString = (data: DBDateRange, html: boolean): string => {
  if (html) {
    return data.end
      ? `<time>${data.start}</time> ~ <time>${data.end}</time>`
      : `<time>${data.start}</time>`
  } else {
    return data.end
      ? `\`${data.start}\` ~ \`${data.end}\``
      : `\`${data.start}\``
  }
}
