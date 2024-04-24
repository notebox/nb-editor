import type {
  BlockID,
  BlockPropsDelta,
  Operator,
  DBBoardProp,
  DBFieldID,
  DBFieldType,
  DBFormula,
  DBRecordPointsProp,
  DBSort,
  DBTemplateFieldsPropDelta,
  DBTemplateProp,
  DBTemplates,
  DBTableProp,
  Editor,
  PresenterBlockProps,
} from "@/domain"
import type {Operator as NBOperator} from "@/adapter/dataManipulator/nbCRDT/operator"
import type {Block} from "@/adapter/dataManipulator/nbCRDT/crdt"
import type {NBDBTemplateSettingsPopup} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/popup"
import type {
  NBDBField,
  NBDBFieldMap,
  NBDBLabeledRecordIDSet,
  NBDBTemplateField,
  NBDBTemplateFieldMap,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import type {NBDBContext} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import type {NBDBRecord} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"

import {BlockPropKey, NBRange} from "@/domain"
import {sortFields, parseFieldMap} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import {Popup} from "@/domain/usecase/state/popup"
import * as Command from "@/adapter/dataManipulator/nbCRDTWithNBDB/operator"

import React from "react"
import {DBRecordEvaluator} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb/evaluator/record"

export class NBDBTemplate {
  readonly editor: Editor
  readonly type!: DBTemplates
  readonly templateBlockID: BlockID
  readonly tableBlockID: BlockID

  visibleFields: NBDBTemplateField[] = []

  private _allFields: NBDBTemplateField[] = []
  private _recordMap: NBDBRecordMap = {}
  private _fieldMap: NBDBTemplateFieldMap = {}
  private _sort?: DBSort
  private _filter?: DBFormula
  private _labeledRecordIDSet?: NBDBLabeledRecordIDSet

  constructor(props: PresenterBlockProps) {
    this.editor = props.ctx.editor
    this.templateBlockID = props.block.blockID
    this.tableBlockID = props.block.props[BlockPropKey.DBTableID]?.[1] ?? this.templateBlockID;
    (props.ctx as NBDBContext).templates.add(this.templateBlockID, this)
  }

  get templateBlock(): Block {
    return this.editor.dataManipulator.block(this.templateBlockID) as Block
  }
  get templateProps(): DBTemplateProp {
    return this.templateBlock.props[this.type] as DBTemplateProp
  }
  get templatePoints(): DBRecordPointsProp | undefined {
    if (this.type === BlockPropKey.DBBoard) {
      return (this.templateProps as DBBoardProp).RECORD_POINTS || {}
    }
    return
  }
  get allFields(): NBDBTemplateField[] {
    return this._allFields
  }
  get sort(): DBSort | undefined {
    return this._sort
  }
  get filter(): DBFormula | undefined {
    return this._filter
  }
  get fieldMap(): NBDBTemplateFieldMap {
    return this._fieldMap
  }
  get recordMap(): NBDBRecordMap {
    return this._recordMap
  }
  get labeledRecordIDSet(): NBDBLabeledRecordIDSet | undefined {
    return this._labeledRecordIDSet
  }
  set labeledRecordIDSet(value: NBDBLabeledRecordIDSet | undefined) {
    this._labeledRecordIDSet = value
  }

  get caption(): string | undefined {
    return this.templateBlock.props.CAPTION?.[1]
  }

  /** @category on click */
  onClickTemplate = (event: React.MouseEvent): void => {
    this.editor.popup(
      {
        type: "db-template",
        meta: {
          tableBlockID: this.tableBlockID,
          templateBlockID: this.templateBlockID,
        },
      },
      event
    )
  }

  onClickAddField = (event: React.MouseEvent) => {
    event.preventDefault()
    this.editor.emitter.emitHaptic()

    this.editor.operate(operator =>
      this.addNewFieldWithoutCommit(operator, "", "VALUE")
    )
    this.updateAll(this.templateProps)
  }

  addNewLabeledField = (): DBFieldID | null => {
    const operator = this.editor.newOperator()
    const fieldID = this.addNewFieldWithoutCommit(
      operator,
      "New Labeled Field",
      "LABEL"
    )
    if (fieldID) {
      Command.setNBDBBoardLabeledField(operator as NBOperator, {
        templateBlockID: this.templateBlockID,
        fieldID,
      })
    }
    this.editor.commit(operator)
    this.updateAll(this.templateProps)
    return fieldID
  }

  private addNewFieldWithoutCommit = (
    operator: Operator,
    NAME: string,
    TYPE: DBFieldType
  ): DBFieldID | null => {
    return Command.addDataField(
      operator as NBOperator,
      this.tableBlockID,
      this.templateBlockID,
      {NAME, TYPE},
      this._allFields.length
    )
  }

  editValue = async (recordBlockID: BlockID, fieldID: DBFieldID) => {
    const field = this.fieldMap[fieldID]
    if (!field) return

    let payload: Omit<Popup, "editor">
    switch (field.type) {
    case "VALUE":
    case "NUMBER": {
      const evaluated = this.recordMap[recordBlockID]?.fieldMap[fieldID]
      this.editor.selector.select(
        NBRange.decode({
          blockID: this.templateBlockID,
          subPath: {
            type: "db",
            recordBlockID,
            fieldID,
          },
          offset: evaluated?.value.S.length ?? 0,
        })
      )
      this.editor.state.reRender()
      return
    }
    case "FORMULA":
      payload = {
        type: "nbdb-field",
        meta: {
          tableBlockID: this.tableBlockID,
          templateBlockID: this.templateBlockID,
          fieldID: field.fieldID,
        },
      }
      break
    case "DATE":
      payload = {
        type: "nbdb-date",
        meta: {
          blockID: recordBlockID,
          fieldID,
        },
      }
      break
    case "LABEL":
    case "LABELS": {
      payload = {
        type: "nbdb-labels",
        meta: {
          templateBlockID: this.templateBlockID,
          blockID: recordBlockID,
          fieldID,
          multiple: field.type === "LABELS",
        },
      }
      break
    }
    case "BOOLEAN": {
      this.editor.emitter.emitHaptic()
      this.editor.operate(operator =>
        Command.setBlockDBRecordValue(
          operator as NBOperator,
          recordBlockID,
          fieldID,
          !this.recordMap[recordBlockID]?.fieldMap[fieldID].value.B
        )
      )
      return
    }
    default:
      return
    }
    this.editor.popup(payload)
  }

  presentSettings = (
    event: React.MouseEvent,
    purpose: NBDBTemplateSettingsPopup["meta"]["purpose"]
  ): void => {
    this.editor.popup({
      type: "nbdb-template-settings",
      meta: {
        templateBlockID: this.templateBlockID,
        purpose,
      },
    }, event)
  }

  presentField = (
    event: React.MouseEvent,
    field: NBDBField,
    enableWidthChanging?: boolean
  ): void => {
    this.editor.popup({
      type: "nbdb-field",
      meta: {
        tableBlockID: this.tableBlockID,
        templateBlockID: this.templateBlockID,
        fieldID: field.fieldID,
        enableWidthChanging,
      },
    }, event)
  }

  /** @category lifecycle */
  beforeUpdate(props: DBTemplateProp): void {
    this.evaluateSortAndFilter(props)
    this.evaluateFields(this.tableBlockID, props)
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  afterUpdate(_props?: DBTemplateProp): void {
    this.visibleFields = this.allFields.filter(field => field.visible)
  }

  update(set: Set<BlockID>): void {
    const props = this.templateProps
    if (set.has(this.tableBlockID) || set.has(this.templateBlockID)) {
      this.updateAll(this.templateProps)
      set.delete(this.templateBlockID)
    } else if (this.updateChangedRecords(set)) {
      this.afterUpdate(props)
    }
  }

  updateAll(props: DBTemplateProp) {
    this.beforeUpdate(props)
    this.evaluateRecords(
      this.tableBlockID,
      this.fieldMap,
      this.filter,
      this.labeledRecordIDSet
    )
    this.afterUpdate(props)
  }

  /** @category select */
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

  selectAndFocus(recordBlockID: BlockID, fieldID?: DBFieldID): void {
    if (fieldID) {
      const type = this.fieldMap[fieldID]?.type
      this.select(
        recordBlockID,
        fieldID,
        type === "VALUE" || type === "NUMBER" ? 0 : undefined
      )
      return
    }

    const firstTextFieldID = this.allFields.find(
      field =>
        field.visible && (field.type === "VALUE" || field.type === "NUMBER")
    )?.fieldID

    if (firstTextFieldID) {
      this.select(recordBlockID, firstTextFieldID, 0)
    } else {
      this.select(recordBlockID)
    }
  }

  /** @category private - lifecycle */
  private updateChangedRecords(set: Set<BlockID>): boolean {
    const changedDBRecordBlockIDs = new Set<BlockID>()
    set.forEach(recordBlockID => {
      if (this.recordMap[recordBlockID]) {
        changedDBRecordBlockIDs.add(recordBlockID)
      }
    })

    if (changedDBRecordBlockIDs.size) {
      changedDBRecordBlockIDs.forEach(recordBlockID => {
        this.evaluateRecord(
          this.recordMap,
          this.editor.dataManipulator.block(recordBlockID) as Block,
          this.fieldMap,
          this.filter,
          this.labeledRecordIDSet
        )
        set.delete(recordBlockID)
      })
      return true
    }
    return false
  }

  private evaluateSortAndFilter(props: DBTemplateProp) {
    this._sort = props?.SORT?.[1]
    this._filter = props?.FILTER?.[1]
  }

  private evaluateFields(tableBlockID: BlockID, props: DBTemplateProp) {
    const fieldMap: NBDBTemplateFieldMap = {}
    const fields: NBDBTemplateField[] = []
    const tableFieldMap = parseFieldMap(
      (this.editor.dataManipulator.block(tableBlockID).props.DB_TABLE ?? {}) as DBTableProp
    )

    let hasDelta = false
    const delta: DBTemplateFieldsPropDelta = {}
    Object.entries(tableFieldMap).forEach(([fieldID, tableField], index) => {
      const templateField = props.FIELDS?.[fieldID]
      let order: number
      let visible: boolean
      let width: number | undefined
      if (templateField) {
        order = templateField.ORDER[1] ?? index
        visible = templateField.VISIBLE[1] ?? false
        width = templateField.WIDTH?.[1]
      } else {
        hasDelta = true
        order = index
        visible = true
        delta[fieldID] = {
          ORDER: order,
          VISIBLE: visible,
        }
      }
      const field = {...tableField, order, visible, width}
      fieldMap[fieldID] = field
      fields.push(field)
    })

    this._fieldMap = fieldMap
    this._allFields = sortFields(fields)

    if (hasDelta) {
      updateMissingFieldOrder(this.editor, this.type, this.templateBlockID, delta!)
    }
  }

  private evaluateRecords(
    tableBlockID: BlockID,
    fieldMap: NBDBFieldMap,
    filter?: DBFormula,
    labeledRecordIDSet?: NBDBLabeledRecordIDSet
  ) {
    this._recordMap = this.editor.dataManipulator
      .childBlocks(tableBlockID)
      .reduce<NBDBRecordMap>((acc, cur) => {
        this.evaluateRecord(acc, cur as Block, fieldMap, filter, labeledRecordIDSet)
        return acc
      }, {})
  }

  private evaluateRecord(
    recordMap: NBDBRecordMap,
    recordBlock: Block,
    fieldMap: NBDBFieldMap,
    filter?: DBFormula,
    labeledRecordIDSet?: NBDBLabeledRecordIDSet
  ): void {
    if (recordBlock.isDeleted) {
      recordMap[recordBlock.blockID] = null
      return
    }
    const evaluator = new DBRecordEvaluator(
      recordBlock,
      fieldMap,
      filter,
      labeledRecordIDSet,
      this.templatePoints
    )
    recordMap[recordBlock.blockID] = evaluator.evaluateAll()
  }
}

const updateMissingFieldOrder = (
  editor: Editor,
  templateKey: DBTemplates,
  templateBlockID: BlockID,
  delta: DBTemplateFieldsPropDelta
) => {
  setTimeout(async () => {
    const operator = editor.newOperator()
    operator.setBlockProps(templateBlockID, {
      [templateKey]: {
        FIELDS: delta,
      },
    } as BlockPropsDelta)
    editor.commit(operator)
  }, 1)
}

type NBDBRecordMap = {
  [recordBlockID: BlockID]: NBDBRecord | null;
};
