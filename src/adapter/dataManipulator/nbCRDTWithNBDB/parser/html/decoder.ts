import type {DOMElement, EditorEmitter} from "@/domain"
import type {BlockContentData} from "@/adapter/dataManipulator/nbCRDT/parser/data"
import type {NBDBRecordContent} from "@/adapter/dataManipulator/nbCRDTWithNBDB/parser/data"

import {BlockType, BlockPropKey} from "@/domain"
import {Decoder} from "@/adapter/dataManipulator/nbCRDT/parser/html"
import {NBDBString, NBDBTemplateField} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

export class HTMLDecoder extends Decoder {
  constructor(emitter: EditorEmitter) {
    super(emitter)
  }

  decodeTypedDOMElement(el: Element): BlockContentData[] | null {
    return decodeTableDOMElement(el as DOMElement) || super.decodeTypedDOMElement(el)
  }
}

const decodeTableDOMElement = (el: DOMElement): [BlockContentData] | null => {
  if (el.tagName !== "TABLE") return null

  const caption = el.querySelector("caption")?.textContent || undefined
  const header = el.querySelector("thead")
  const htmlDBRecords = Array.from(el.querySelectorAll("tr") || [])

  let fieldMap: FieldContentDataMap
  if (header) {
    fieldMap = makeInitialFields(header)
  } else {
    if (htmlDBRecords[0]?.firstElementChild?.tagName === "th") {
      fieldMap = makeInitialFields(htmlDBRecords[0])
      htmlDBRecords.shift()
    } else {
      fieldMap = {}
    }
  }

  const allRecords: NBDBRecordContent[] = []
  htmlDBRecords.forEach(htmlDBRecord => {
    const cells = getHTMLCells(htmlDBRecord)
    if (!cells.length) return

    let order = 0
    const record: NBDBRecordContent = {evaluated: {}}
    cells.forEach(cell => {
      const value = cell.textContent?.trim()
      if (value) {
        const fieldID = dummyFieldID(order)
        record.evaluated[fieldID] = {
          fieldID,
          fieldType: "VALUE",
          value: NBDBString.fromFormula(value),
        }
        if (!fieldMap[fieldID]) {
          fieldMap[fieldID] = {
            fieldID,
            order,
            visible: true,
            name: "",
            type: "VALUE",
            labelMap: {},
          }
        }
      }
      order += cell.colSpan
    })
    allRecords.push(record)
  })

  const allFields = Object.values(fieldMap).sort((a, b) => a.order - b.order)
  /** @purpose defense code */
  if (allFields[allFields.length - 1].order > 1000) return null

  return [{
    props: {
      TYPE: BlockType.Database,
      DB_TEMPLATE: BlockPropKey.DBSpreadsheet,
      CAPTION: caption,
    },
    custom: {
      [BlockType.Database]: {
        table: {
          allFields,
          allRecords,
        },
      },
    },
    children: [],
  }]
}

const getHTMLCells = (
  record: HTMLTableSectionElement | HTMLTableRowElement
): NodeListOf<HTMLTableCellElement> => {
  return record.querySelectorAll("th, td") as NodeListOf<HTMLTableCellElement>
}

const makeInitialFields = (
  record: HTMLTableSectionElement | HTMLTableRowElement
): FieldContentDataMap => {
  const result: FieldContentDataMap = {}
  let order = 0
  getHTMLCells(record).forEach(cell => {
    const fieldID = dummyFieldID(order)
    result[fieldID] = {
      fieldID,
      order,
      visible: true,
      name: cell.textContent?.trim() ?? "",
      type: "VALUE",
      labelMap: {},
    }
    order += cell.colSpan
  })
  return result
}

const dummyFieldID = (index: number) => `0-${index}`

type FieldContentDataMap = {
  [dummyFieldID: string]: NBDBTemplateField;
};
