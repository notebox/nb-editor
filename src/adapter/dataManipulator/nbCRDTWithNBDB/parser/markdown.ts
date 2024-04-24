import type {NBDBContent} from "./data"

import {evaluatedFieldToString} from "./html/encoder"

export const encodeToMarkdown = (
  data?: NBDBContent,
  caption?: string
): string => {
  let result = ""
  if (!data) return result

  result += "\n"
  if (caption) {
    result += `### ${caption}  \n`
  }

  const fields = data.table.allFields.filter(field => field.visible)
  result += fields.reduce((acc, cur) => `${acc} ${cur.name} |`, "|") + "\n"
  result += fields.reduce((acc, _cur) => `${acc} --- |`, "|") + "\n"

  data.table.allRecords.forEach(record => {
    result +=
      fields.reduce(
        (acc, cur) =>
          `${acc} ${evaluatedFieldToString(
            record.evaluated[cur.fieldID],
            false
          )} |`,
        "|"
      ) + "\n"
  })

  return result + "\n"
}
