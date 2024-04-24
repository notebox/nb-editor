import type {
  BlockID,
  DBLabelID,
  BoardLabelsDelta,
  BlockPropsDelta,
  DBFieldID,
  Editor,
  PresenterBlockProps,
} from "@/domain"
import type {NBDBLabel} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBRecord} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"
import type {NBDBAggregation} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/aggregation"

import {
  BlockPropKey,
  DBBoardProp,
  DBBoardUnsetLabelID,
  NBRange,
} from "@/domain"
import {sortLabels} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"
import {Point, Order} from "@/adapter/dataManipulator/nbCRDT/crdt"
import {Operator} from "@/adapter/dataManipulator/nbCRDT/operator"
import {sortRecords} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"
import {aggregate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/aggregation"
import {NBDBTemplate} from "./common"
import React from "react"

export class NBDBBoard extends NBDBTemplate {
  readonly type = BlockPropKey.DBBoard

  labels: NBDBBoardLabel[] = []
  labelMap: NBDBBoardLabelMap = {}
  records: NBDBBoardRecordMap = {}
  aggregationMap: NBDBBoardAggregation = {}

  constructor(props: PresenterBlockProps) {
    super(props)
    this.updateAll(this.templateProps)
  }

  get templateProps(): DBBoardProp {
    return (this.templateBlock.props.DB_BOARD || {}) as DBBoardProp
  }

  get boardFieldID(): DBFieldID | undefined {
    return this.getBoardFieldID(this.templateProps)
  }

  select(recordBlockID?: BlockID, fieldID?: DBFieldID, offset?: number): void {
    if (recordBlockID) {
      this.editor.selector.select(
        NBRange.decode({
          blockID: this.templateBlockID,
          subPath: {
            type: "db",
            recordBlockID,
            fieldID,
          },
          offset,
        })
      )
    } else {
      this.editor.selector.select(null)
    }
    this.editor.state.reRender()
  }

  onClickAddRecord = (
    event: React.MouseEvent,
    labelID: DBLabelID | typeof DBBoardUnsetLabelID,
    atFirst?: boolean
  ): void => {
    event.preventDefault()
    this.editor.emitter.emitHaptic()

    let prevPoint: Point | undefined
    let nextPoint: Point | undefined
    if (atFirst) {
      nextPoint = this.records[labelID]?.[0]?.point
    } else {
      const labeledRecords = this.records[labelID]
      prevPoint =
        labeledRecords && labeledRecords[labeledRecords.length - 1]?.point
    }

    const operator = this.editor.newOperator() as Operator
    const blockID = Command.addDBBoardRecord(
      operator,
      this.tableBlockID,
      this.templateBlockID,
      this.getBoardFieldID(this.templateProps),
      labelID === DBBoardUnsetLabelID ? undefined : labelID,
      prevPoint,
      nextPoint
    )

    this.editor.commit(operator)
    this.selectAndFocus(blockID)
  }

  onClickAddBoardLabel = (event: React.MouseEvent): void => {
    event.preventDefault()
    this.editor.emitter.emitHaptic()

    const order =
      this.labels.length > 1
        ? this.labels[this.labels.length - 2].order + 1
        : 0
    const operator = this.editor.newOperator() as Operator
    Command.addDBBoardLabel(
      operator,
      this.tableBlockID,
      this.templateBlockID,
      order,
      this.getBoardFieldID(this.templateProps)
    )

    this.editor.commit(operator)
  }

  onClickAggregation = (event: React.MouseEvent, labelID: DBLabelID) => {
    if (!this.boardFieldID) {
      event.preventDefault()
      return
    }

    this.editor.popup({
      type: "db-aggregation",
      meta: {
        board: {
          templateBlockID: this.templateBlockID,
          boardFieldID: this.boardFieldID,
          labelID,
          fields: this.allFields,
        },
      },
    }, event)
  }

  /** @category dragger */
  moveColumn(labelID: string, to: string, prev: boolean): void {
    if (!this.boardFieldID) return
    if (labelID === to) return

    const labelIDs = this.labels.map(label => label.labelID)
    const fromIDX = labelIDs.findIndex(item => item === labelID)
    labelIDs.splice(fromIDX, 1)
    const toIDX = labelIDs.findIndex(item => item === to) + (prev ? 0 : 1)
    labelIDs.splice(toIDX, 0, labelID)
    const operator = this.editor.newOperator() as Operator
    Command.moveDBBoardLabel(
      operator,
      this.templateBlockID,
      this.boardFieldID,
      labelIDs
    )
    this.editor.commit(operator)
    this.updateAll(this.templateProps)
  }

  moveRecord(
    recordID: BlockID,
    to: {
      labelID: DBLabelID;
      prevRecordID?: BlockID;
      nextRecordID?: BlockID;
    }
  ): void {
    if (recordID === to.prevRecordID || recordID === to.nextRecordID) return

    const boardFieldID = this.boardFieldID
    if (!boardFieldID) return
    const record = this.recordMap[recordID]
    if (!record) return

    const label = !this.records[to.labelID].find(
      record => record.blockID === recordID
    )
      ? {
        fieldID: boardFieldID,
        labelID: to.labelID,
      }
      : undefined
    const prevPoint = to.prevRecordID
      ? this.recordMap[to.prevRecordID]?.point
      : undefined
    const nextPoint = to.nextRecordID
      ? this.recordMap[to.nextRecordID]?.point
      : undefined
    const point =
      (prevPoint && record.point.compare(prevPoint) !== Order.Greater) ||
      (nextPoint && record.point.compare(nextPoint) !== Order.Less)
        ? {
          prev: prevPoint,
          next: nextPoint,
        }
        : undefined

    const operator = this.editor.newOperator() as Operator
    Command.moveDBBoardRecord(
      operator,
      this.tableBlockID,
      this.templateBlockID,
      recordID,
      label,
      point
    )
    this.editor.commit(operator)
    this.updateAll(this.templateProps)
  }

  /** @category lifecycle */
  beforeUpdate(props: DBBoardProp): void {
    super.beforeUpdate(props)
    const fieldID = this.getBoardFieldID(props)

    const unsetLabel = {
      labelID: DBBoardUnsetLabelID,
      name: "No labels",
      order: Number.MAX_SAFE_INTEGER,
      visible: true,
    }
    const labelIDToRecordIDsMap: {[labelID: string]: Set<BlockID>} = {
      [DBBoardUnsetLabelID]: new Set<BlockID>(),
    }
    const labelMap: NBDBBoardLabelMap = {
      [DBBoardUnsetLabelID]: unsetLabel,
    }

    const delta: BoardLabelsDelta = {}
    let hasDelta = false

    if (fieldID) {
      const labelsProp = props.FIELDS?.[fieldID]?.LABELS || {}
      Object.entries(this.fieldMap[fieldID].labelMap ?? {}).forEach(
        ([labelID, fieldLabel], index) => {
          const boardLabel = labelsProp[labelID]
          let order: number
          let visible: boolean
          if (boardLabel) {
            order = boardLabel.ORDER[1] ?? index
            visible = boardLabel.VISIBLE[1] ?? false
          } else {
            hasDelta = true
            order = index
            visible = true
            delta[labelID] = {
              ORDER: order,
              VISIBLE: visible,
            }
          }
          labelMap[labelID] = {...fieldLabel, order, visible}
          labelIDToRecordIDsMap[labelID] = new Set<BlockID>()
        }
      )

      const unsetProp = labelsProp[DBBoardUnsetLabelID]
      if (unsetProp) {
        unsetLabel.order = unsetProp.ORDER[1] ?? unsetLabel.order
        unsetLabel.visible = unsetProp.VISIBLE[1] ?? unsetLabel.visible
      } else {
        hasDelta = true
        delta[DBBoardUnsetLabelID] = {
          ORDER: unsetLabel.order,
          VISIBLE: unsetLabel.visible,
        }
      }
    } else {
      this.labeledRecordIDSet = undefined
    }

    this.labelMap = labelMap
    this.labeledRecordIDSet = {
      fieldID,
      recordIDToLabelIDMap: {},
      labelIDToRecordIDsMap,
    }

    if (hasDelta && fieldID) {
      updateMissingBoardLabels(this.editor, this.templateBlockID, fieldID, delta)
    }
  }

  afterUpdate(): void {
    super.afterUpdate()
    this.sortLabels()
    this.sortRecords()
    this.aggregateRecords()
  }

  presentFieldLabel(event: React.MouseEvent, label: NBDBBoardLabel): void {
    const fieldID = this.boardFieldID
    if (!fieldID || label.labelID == DBBoardUnsetLabelID) return

    this.editor.popup({
      type: "nbdb-field-label",
      meta: {
        tableBlockID: this.tableBlockID,
        fieldID,
        label: {...label},
      },
    }, event)
  }

  private sortLabels(): void {
    this.labels = sortLabels(
      Object.values(this.labelMap).filter(label => label.visible)
    ) as NBDBBoardLabel[]
  }

  private sortRecords(): void {
    const records: {[labelID: DBLabelID]: NBDBRecord[]} = {}

    this.labels.forEach(label => {
      const labeledRecords: NBDBRecord[] = []
      this.labeledRecordIDSet!.labelIDToRecordIDsMap[label.labelID]?.forEach(
        recordID => {
          const record = this.recordMap[recordID]
          if (record) {
            labeledRecords.push(record)
          }
        }
      )
      if (this.sort) {
        records[label.labelID] = sortRecords(
          labeledRecords,
          this.sort,
          this.fieldMap
        )
      } else {
        records[label.labelID] = labeledRecords.sort((a, b) => {
          switch (a.point.compare(b.point)) {
          case Order.Less:
            return -1
          case Order.Greater:
            return 1
          default:
            return 0
          }
        })
      }
    })

    this.records = records
  }

  private aggregateRecords(): void {
    const props = this.templateProps
    const boardFieldID = this.getBoardFieldID(props)

    const labels = boardFieldID && props.FIELDS?.[boardFieldID]?.LABELS
    if (!labels) return

    const aggregationMap: NBDBBoardAggregation = {}
    this.labels.forEach(label => {
      const labelAggregation = labels[label.labelID]?.AGGREGATION?.[1]
      if (labelAggregation) {
        const aggregationKey = labelAggregation[0]
        const aggregationFieldID = labelAggregation[1]
        const aggregation = {
          fieldID: aggregationFieldID,
          key: aggregationKey,
          name: "",
          value: "",
        }
        aggregate(
          aggregationFieldID || boardFieldID,
          this.records[label.labelID],
          aggregation
        )
        aggregationMap[label.labelID] = aggregation
      } else {
        aggregationMap[label.labelID] = {
          key: "count",
          name: "COUNT",
          value: `${this.records[label.labelID].length}`,
        }
      }
    })
    this.aggregationMap = aggregationMap
  }

  getBoardFieldID = (props: DBBoardProp): DBFieldID | undefined => {
    const fieldID = props.FIELD_ID?.[1]
    return fieldID && this.fieldMap[fieldID] ? fieldID : undefined
  }
}

const updateMissingBoardLabels = (
  editor: Editor,
  templateBlockID: BlockID,
  fieldID: DBFieldID,
  delta: BoardLabelsDelta
) => {
  setTimeout(async () => {
    const operator = editor.newOperator()
    operator.setBlockProps(templateBlockID, {
      DB_BOARD: {
        FIELDS: {
          [fieldID]: {
            LABELS: delta,
          },
        },
      },
    } as BlockPropsDelta)
    editor.commit(operator)
  }, 1)
}

type NBDBBoardRecordMap = {[labelID: DBLabelID]: NBDBRecord[]};
type NBDBBoardLabelMap = {[labelID: DBLabelID]: NBDBBoardLabel};
type NBDBBoardAggregation = {
  [labelID: DBLabelID]: NBDBAggregation & {fieldID?: DBFieldID};
};
export type NBDBBoardLabel = NBDBLabel & {
  visible: boolean;
};
