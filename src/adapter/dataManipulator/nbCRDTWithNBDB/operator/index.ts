import type {
  BlockID,
  PropsDelta,
  BlockPropsWithStamp,
  BlockPropsDelta,
  BlockProps,
  Color,
  DBTemplates,
  DBValues,
  DBLabelID,
  DBFieldID,
  DBField,
  DBSort,
  DBBoardFields,
  DBDataValue,
  DBFormula,
  DBFieldType,
  DBTemplateFieldsPropDelta,
  DBSpreadsheetProp,
  DBBoardProp,
  DBTableProp,
} from "@/domain/entity"
import type {Point} from "@/adapter/dataManipulator/nbCRDT/crdt"
import type {Operator} from "@/adapter/dataManipulator/nbCRDT/operator"

import {Block} from "@/adapter/dataManipulator/nbCRDT/crdt"
import {BlockType, BlockPropKey, NBRange} from "@/domain/entity"
import {insBlock} from "@/adapter/dataManipulator/nbCRDT/operator/command"
import * as lowLevel from "@/adapter/dataManipulator/nbCRDT/operator/command/lowLevel"

export const setDBTemplate = (
  operator: Operator,
  tableBlockID: BlockID,
  templateBlockID: BlockID,
  template: DBTemplates
): void => {
  const block = operator.dataManipulator.replica.block(templateBlockID)
  if (block.props.DB_TEMPLATE?.[1] === template) return

  if (block.props[template]) {
    lowLevel.setBlockProp(
      operator,
      templateBlockID,
      BlockPropKey.DBTemplate,
      template
    )
    return
  }

  const props = {
    [BlockPropKey.DBTemplate]: template,
    [template]: {
      FIELDS: {},
    },
  } as BlockPropsDelta

  if (template === BlockPropKey.DBBoard) {
    const FIELD_ID = genFieldIDForEmptyBoard(
      operator,
      tableBlockID,
      templateBlockID
    )
    props.DB_BOARD = {
      FIELD_ID,
      FIELDS: {
        [FIELD_ID]: {
          ORDER: 0,
          VISIBLE: false,
        },
      } as PropsDelta<DBBoardFields>,
    }
  }

  lowLevel.setBlockProps(operator, templateBlockID, props)
}

export const insertDBBlock = (operator: Operator, props: BlockProps): BlockID | null => {
  switch (props.DB_TEMPLATE?.[1]) {
  case BlockPropKey.DBSpreadsheet:
    return insertSpreadsheetBlock(operator)
  case BlockPropKey.DBBoard:
    return insertBoardBlock(operator)
  }
  return null
}

const insertSpreadsheetBlock = (operator: Operator): BlockID | null => {
  const titleFieldID = "0-0"
  const descriptionFieldID = "0-1"
  const blockID = insBlock(operator, {
    [BlockPropKey.TYPE]: [null, BlockType.Database],
    [BlockPropKey.DBTemplate]: [null, BlockPropKey.DBSpreadsheet],
    [BlockPropKey.DBTable]: {
      [titleFieldID]: {NAME: [null, "Title"]},
      [descriptionFieldID]: {NAME: [null, "Description"]},
    },
    [BlockPropKey.DBSpreadsheet]: {
      FIELDS: {
        [titleFieldID]: {
          VISIBLE: [null, true],
          ORDER: [null, 0],
          WIDTH: [null, 192],
        },
        [descriptionFieldID]: {VISIBLE: [null, true], ORDER: [null, 1]},
      },
    },
  })
  if (blockID) {
    const recordBlockID = addDBRecord(operator, blockID)
    operator.editor.selector.select(
      NBRange.decode({
        blockID,
        offset: 0,
        subPath: {
          type: "db",
          recordBlockID,
          fieldID: titleFieldID,
        },
      })
    )
  }
  return blockID
}

const insertBoardBlock = (operator: Operator): BlockID | null => {
  const FIELD_ID = "0-0"
  return insBlock(operator, {
    [BlockPropKey.TYPE]: [null, BlockType.Database],
    [BlockPropKey.DBTemplate]: [null, BlockPropKey.DBBoard],
    [BlockPropKey.DBTable]: {
      [FIELD_ID]: {NAME: [null, "Category"], TYPE: [null, "LABEL"]},
    },
    [BlockPropKey.DBBoard]: {
      FIELD_ID: [null, FIELD_ID],
      FIELDS: {
        [FIELD_ID]: {
          ORDER: [null, 0],
          VISIBLE: [null, false],
        },
      },
    },
  })
}

export const setBlockDBRecordValue = (
  operator: Operator,
  blockID: BlockID,
  fieldID: DBFieldID,
  VALUE: DBDataValue | null
): void => {
  lowLevel.setBlockProps(operator, blockID, {
    [BlockPropKey.DBRecord]: {
      [fieldID]: {
        VALUE,
      },
    },
  } as BlockPropsDelta)
}

export const moveDataField = (
  operator: Operator,
  layoutBlockID: BlockID,
  fieldIDs: DBFieldID[]
): void => {
  const block = operator.dataManipulator.replica.block(layoutBlockID)
  const fieldProps = (block.props.DB_SPREADSHEET as DBSpreadsheetProp)?.FIELDS ?? {}

  const fieldDelta: {
    [fieldID: DBFieldID]: {ORDER: number; VISIBLE?: true};
  } = {}
  fieldIDs.forEach((fieldID, ORDER) => {
    const field = fieldProps[fieldID]
    if (!field) {
      fieldDelta[fieldID] = {ORDER, VISIBLE: true}
      return
    }
    if (field.ORDER?.[1] === ORDER) return
    fieldDelta[fieldID] = {ORDER}
  })

  lowLevel.setBlockProps(operator, layoutBlockID, {
    [BlockPropKey.DBSpreadsheet]: {
      FIELDS: fieldDelta,
    },
  } as BlockPropsDelta)
}

export const moveDBBoardLabel = (
  operator: Operator,
  templateBlockID: BlockID,
  fieldID: DBFieldID,
  labelIDs: DBLabelID[]
): void => {
  const block = operator.dataManipulator.replica.block(templateBlockID)
  const labelProps = (block.props.DB_BOARD as DBBoardProp)?.FIELDS?.[fieldID].LABELS ?? {}

  const labelDelta: {
    [labelID: DBLabelID]: {ORDER: number; VISIBLE?: true};
  } = {}
  labelIDs.forEach((labelID, ORDER) => {
    const label = labelProps[labelID]
    if (!label) {
      labelDelta[labelID] = {ORDER, VISIBLE: true}
      return
    }
    if (label.ORDER?.[1] === ORDER) return
    labelDelta[labelID] = {ORDER}
  })

  lowLevel.setBlockProps(operator, templateBlockID, {
    [BlockPropKey.DBBoard]: {
      FIELDS: {
        [fieldID]: {
          LABELS: labelDelta,
        },
      },
    },
  } as BlockPropsDelta)
}

export const addDataField = (
  operator: Operator,
  sourceBlockID: BlockID,
  layoutBlockID: BlockID,
  field: DBField,
  ORDER: number
): DBFieldID | null => {
  const block = operator.dataManipulator.replica.block(layoutBlockID)
  const fieldID = block.genIdentifier(operator.dataManipulator.replica.replicaID, 1)
  let receipt = lowLevel.setBlockProps(operator, sourceBlockID, {
    [BlockPropKey.DBTable]: {
      [fieldID]: field as PropsDelta<DBField>,
    },
  } as BlockPropsDelta)

  if (!receipt) return null

  receipt = lowLevel.setBlockProps(operator, layoutBlockID, {
    [BlockPropKey.DBSpreadsheet]: {
      FIELDS: {
        [fieldID]: {
          ORDER,
          VISIBLE: true,
          WIDTH: 192,
        },
      },
    },
  } as BlockPropsDelta)

  return receipt ? fieldID : null
}

export const addDBRecord = (
  operator: Operator,
  tableBlockID: BlockID
): BlockID => {
  return genDBRecord(
    operator,
    tableBlockID,
    {TYPE: [null, BlockType.DBRecord]},
    operator.dataManipulator.lastChildBlock(tableBlockID, true)?.point
  ).blockID
}

export const addDBBoardRecord = (
  operator: Operator,
  tableBlockID: BlockID,
  templateBlockID: BlockID,
  fieldID?: DBFieldID,
  labelID?: DBLabelID,
  prevPoint?: Point,
  nextPoint?: Point
): BlockID => {
  const boardFieldID =
    fieldID ?? genFieldIDForEmptyBoard(operator, tableBlockID, templateBlockID)

  const props: BlockProps = {
    TYPE: [null, BlockType.DBRecord],
  }

  if (labelID) {
    props.DB_RECORD = {
      [boardFieldID]: {
        VALUE: [null, ["LABELS", [labelID]]],
      },
    } as unknown as BlockPropsWithStamp<DBValues>
  }

  return genDBRecord(operator, tableBlockID, props, prevPoint, nextPoint)
    .blockID
}

export const addDBBoardLabel = (
  operator: Operator,
  tableBlockID: BlockID,
  templateBlockID: BlockID,
  order: number,
  fieldID?: DBFieldID
): void => {
  const tableBlock = operator.dataManipulator.replica.block(tableBlockID)
  const labelID = tableBlock.genIdentifier(operator.dataManipulator.replica.replicaID, 1)
  const boardFieldID =
    fieldID ?? genFieldIDForEmptyBoard(operator, tableBlockID, templateBlockID)

  lowLevel.setBlockProps(operator, tableBlockID, {
    [BlockPropKey.DBTable]: {
      [boardFieldID]: {
        LABELS: {
          [labelID]: {
            ORDER: order,
            NAME: "Label",
          },
        },
      },
    },
  } as BlockPropsDelta)

  lowLevel.setBlockProps(operator, templateBlockID, {
    [BlockPropKey.DBBoard]: {
      FIELDS: {
        [boardFieldID]: {
          LABELS: {
            [labelID]: {
              ORDER: order,
              VISIBLE: true,
            },
          },
        },
      },
    },
  } as BlockPropsDelta)
}

export const moveDBBoardRecord = (
  operator: Operator,
  tableBlockID: BlockID,
  templateBlockID: BlockID,
  recordBlockID: BlockID,
  label?: {
    fieldID: DBFieldID;
    labelID: DBLabelID;
  },
  point?: {
    prev?: Point;
    next?: Point;
  }
): void => {
  if (label) {
    setBlockDBRecordValue(operator, recordBlockID, label.fieldID, [
      "LABELS",
      [label.labelID],
    ])
  }
  if (point) {
    const recordPoint = genDBRecordPoint(
      operator,
      tableBlockID,
      point.prev,
      point.next
    )
    lowLevel.setBlockProps(operator, templateBlockID, {
      [BlockPropKey.DBBoard]: {
        RECORD_POINTS: {
          [recordBlockID]: recordPoint.encode(),
        },
      },
    } as BlockPropsDelta)
  }
}

const genDBRecordPoint = (
  operator: Operator,
  tableBlockID: BlockID,
  lowerPoint?: Point,
  upperPoint?: Point
): Point => {
  const replicaID = operator.dataManipulator.replica.replicaID
  const tableBlock = operator.dataManipulator.replica.block(tableBlockID)
  const point = tableBlock.genPoint(replicaID, 1, lowerPoint, upperPoint, true)
  operator.bVER({
    blockID: tableBlockID,
    version: {
      replicaID,
      nonce: tableBlock.version[replicaID],
    },
  })
  return point
}

const genDBRecord = (
  operator: Operator,
  tableBlockID: BlockID,
  props: BlockProps,
  lowerPoint?: Point,
  upperPoint?: Point
): Block => {
  return lowLevel.genBlockAdvanced(
    operator,
    tableBlockID,
    genDBRecordPoint(operator, tableBlockID, lowerPoint, upperPoint),
    props
  )
}

const genFieldIDForEmptyBoard = (
  operator: Operator,
  tableBlockID: BlockID,
  templateBlockID: BlockID
): DBFieldID => {
  const tableBlock = operator.dataManipulator.replica.block(tableBlockID)
  const tableField = Object.entries(tableBlock.props.DB_TABLE || {}).find(
    entry => {
      return !entry[1].IS_DELETED && entry[1].TYPE?.[1] === "LABEL"
    }
  )

  let FIELD_ID: DBFieldID
  if (tableField) {
    FIELD_ID = tableField[0]
  } else {
    FIELD_ID = tableBlock.genIdentifier(operator.dataManipulator.replica.replicaID, 1)
    lowLevel.setBlockProps(operator, templateBlockID, {
      [BlockPropKey.DBTable]: {
        [FIELD_ID]: {
          NAME: "Label",
          TYPE: "LABEL",
        },
      },
    } as BlockPropsDelta)
  }

  lowLevel.setBlockProps(operator, templateBlockID, {
    [BlockPropKey.DBBoard]: {
      FIELD_ID,
    },
  })
  return FIELD_ID
}

/** @category new-4.11 */
export const setNBDBLabel = (
  operator: Operator,
  {
    tableBlockID,
    fieldID,
    label,
  }: {
    tableBlockID: BlockID;
    fieldID: DBFieldID;
    label: {labelID?: DBLabelID; name: string; color?: Color; order: number};
  }
): void => {
  const block = operator.dataManipulator.replica.block(tableBlockID)
  const field = (block.props.DB_TABLE as DBTableProp)?.[fieldID]
  const delta = {LABELS: {}} as PropsDelta<DBField>

  let labelID = label.labelID
  if (!labelID) {
    labelID = block.genIdentifier(operator.dataManipulator.replica.replicaID, 1)
  }

  delta.LABELS![labelID] = {
    ORDER: label.order,
    NAME: label.name,
    COLOR: label.color ?? null,
  }

  if (field?.LABELS?.[labelID]?.ORDER?.[1] === label.order) {
    delete delta.LABELS![labelID]!.ORDER
  }
  if (field?.LABELS?.[labelID]?.NAME?.[1] === label.name) {
    delete delta.LABELS![labelID]!.NAME
  }
  if (field?.LABELS?.[labelID]?.COLOR?.[1] === label.color) {
    delete delta.LABELS![labelID]!.COLOR
  }

  lowLevel.setBlockProps(operator, tableBlockID, {
    [BlockPropKey.DBTable]: {
      [fieldID]: delta,
    },
  } as BlockPropsDelta)
}

export const delNBDBLabel = (
  operator: Operator,
  {
    tableBlockID,
    fieldID,
    labelID,
  }: {
    tableBlockID: BlockID;
    fieldID: DBFieldID;
    labelID: DBLabelID;
  }
): void => {
  lowLevel.setBlockProps(operator, tableBlockID, {
    [BlockPropKey.DBTable]: {
      [fieldID]: {LABELS: {[labelID]: {IS_DELETED: true}}},
    },
  } as BlockPropsDelta)
}

export const delNBDBField = (
  operator: Operator,
  {
    tableBlockID,
    fieldID,
  }: {
    tableBlockID: BlockID;
    fieldID: DBFieldID;
  }
): void => {
  lowLevel.setBlockProps(operator, tableBlockID, {
    [BlockPropKey.DBTable]: {
      [fieldID]: {IS_DELETED: true},
    },
  } as BlockPropsDelta)
}

export const setNBDBTemplateFilter = (
  operator: Operator,
  {
    templateBlockID,
    formulaData,
    template,
  }: {
    templateBlockID: BlockID;
    formulaData: DBFormula | null;
    template: BlockPropKey;
  }
): void => {
  lowLevel.setBlockProps(operator, templateBlockID, {
    [template]: {
      FILTER: formulaData,
    },
  } as BlockPropsDelta)
}

export const setNBDBTemplateSort = (
  operator: Operator,
  {
    templateBlockID,
    sort,
    template,
  }: {
    templateBlockID: BlockID;
    sort: DBSort | null;
    template: BlockPropKey;
  }
): void => {
  lowLevel.setBlockProps(operator, templateBlockID, {
    [template]: {
      SORT: sort,
    },
  } as BlockPropsDelta)
}

export const setNBDBBoardLabeledField = (
  operator: Operator,
  {
    templateBlockID,
    fieldID,
  }: {
    templateBlockID: BlockID;
    fieldID: DBFieldID;
  }
): void => {
  lowLevel.setBlockProps(operator, templateBlockID, {
    DB_BOARD: {
      FIELD_ID: fieldID,
    },
  } as BlockPropsDelta)
}

export const setNBDBTemplateHiddenFields = (
  operator: Operator,
  {
    templateBlockID,
    showingFieldIDs,
    template,
  }: {
    templateBlockID: BlockID;
    showingFieldIDs: DBFieldID[];
    template: BlockPropKey.DBSpreadsheet | BlockPropKey.DBBoard;
  }
): void => {
  const block = operator.dataManipulator.replica.block(templateBlockID)
  const fields = (block.props[template] as DBBoardProp | DBSpreadsheetProp)?.FIELDS ?? {}
  const delta = {} as DBTemplateFieldsPropDelta

  const cache = showingFieldIDs.reduce<{
    [fieldID: DBFieldID]: {ORDER: number; VISIBLE: true};
  }>((acc, cur, ORDER) => {
    acc[cur] = {ORDER, VISIBLE: true}
    return acc
  }, {})
  Object.keys(fields).forEach(fieldID => {
    const showing = cache[fieldID]
    if (showing) {
      delta[fieldID] = {VISIBLE: showing.VISIBLE, ORDER: showing.ORDER}
    } else {
      delta[fieldID] = {VISIBLE: false}
    }
  })

  lowLevel.setBlockProps(operator, templateBlockID, {
    [template]: {
      FIELDS: delta,
    },
  } as BlockPropsDelta)
}
export const setNBDBBoardHiddenLabels = (
  operator: Operator,
  {
    templateBlockID,
    showingLabelIDs,
    fieldID,
  }: {
    templateBlockID: BlockID;
    showingLabelIDs: DBLabelID[];
    fieldID: DBFieldID;
  }
): void => {
  const block = operator.dataManipulator.replica.block(templateBlockID)
  const labels = (block.props.DB_BOARD as DBBoardProp)?.FIELDS?.[fieldID].LABELS ?? {}
  const delta = {} as DBTemplateFieldsPropDelta

  const cache = showingLabelIDs.reduce<{
    [labelID: DBLabelID]: {ORDER: number; VISIBLE: true};
  }>((acc, cur, ORDER) => {
    acc[cur] = {ORDER, VISIBLE: true}
    return acc
  }, {})
  Object.keys(labels).forEach(labelID => {
    const showing = cache[labelID]
    if (showing) {
      delta[labelID] = {VISIBLE: showing.VISIBLE, ORDER: showing.ORDER}
    } else {
      delta[labelID] = {VISIBLE: false}
    }
  })

  lowLevel.setBlockProps(operator, templateBlockID, {
    DB_BOARD: {
      FIELDS: {
        [fieldID]: {
          LABELS: delta,
        },
      },
    },
  } as BlockPropsDelta)
}

export const updateNBDBField = (
  operator: Operator,
  {
    tableBlockID,
    templateBlockID,
    fieldID,
    name,
    type,
    labelOrders,
    formula,
    width,
  }: {
    tableBlockID: BlockID;
    templateBlockID: BlockID;
    fieldID: DBFieldID;
    name: string;
    type: DBFieldType;
    labelOrders?: {labelID: DBLabelID; order: number}[];
    formula?: DBFormula | null;
    width?: number | null;
  }
): void => {
  const block = operator.dataManipulator.replica.block(tableBlockID)
  const field = (block.props.DB_TABLE as DBTableProp)?.[fieldID]
  const delta = {} as PropsDelta<DBField>

  if (labelOrders) {
    delta.LABELS = {}
    labelOrders.forEach(({labelID, order: ORDER}) => {
      if (field?.LABELS?.[labelID]?.ORDER?.[1] !== ORDER) {
        delta.LABELS![labelID] = {ORDER}
      }
    })
  }

  if (formula !== undefined) {
    delta.FORMULA = formula
  }

  if (field?.NAME?.[1] !== name) {
    delta.NAME = name
  }

  if (field?.TYPE?.[1] !== type) {
    delta.TYPE = type
  }

  lowLevel.setBlockProps(operator, tableBlockID, {
    [BlockPropKey.DBTable]: {
      [fieldID]: delta,
    },
  } as BlockPropsDelta)

  if (width !== undefined) {
    lowLevel.setBlockProps(operator, templateBlockID, {
      [BlockPropKey.DBSpreadsheet]: {
        FIELDS: {
          [fieldID]: {WIDTH: width},
        },
      },
    } as BlockPropsDelta)
  }
}

/** @deprecated */
export const setNBDBLabelOrders = (
  operator: Operator,
  {
    tableBlockID,
    fieldID,
    labelOrders,
  }: {
    tableBlockID: BlockID;
    fieldID: DBFieldID;
    labelOrders: {labelID: DBLabelID; order: number}[];
  }
): void => {
  const block = operator.dataManipulator.replica.block(tableBlockID)
  const field = (block.props.DB_TABLE as DBTableProp)?.[fieldID]
  const delta = {LABELS: {}} as PropsDelta<DBField>

  labelOrders.forEach(({labelID, order: ORDER}) => {
    if (field?.LABELS?.[labelID]?.ORDER?.[1] !== ORDER) {
      delta.LABELS![labelID] = {ORDER}
    }
  })

  lowLevel.setBlockProps(operator, tableBlockID, {
    [BlockPropKey.DBTable]: {
      [fieldID]: delta,
    },
  } as BlockPropsDelta)
}
