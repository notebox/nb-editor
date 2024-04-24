import type {DBTemplates, UIHandler} from "@/domain"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import {BlockPropKey} from "@/presenter"
import {NBDBBoard} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import MoreIcon from "@/presenter/common/icon/more"
import BlockHandle from "@/presenter/blocks/parts/handle"
import TableIcon from "@/presenter/common/icon/table"
import BoardIcon from "@/presenter/common/icon/board"
import TitleComponent from "./title"

const Controller = (props: {ctx: UIHandler, state: NBDBTemplate}) => (
  <div className="nb-db-controller">
    <BlockHandle ctx={props.ctx} blockID={props.state.templateBlockID} />
    <div className="nb-db-panes">
      <div className="nb-db-pane">
        <TemplateButton state={props.state} template={props.state.type} />
        <TitleComponent
          ctx={props.ctx}
          templateBlockID={props.state.templateBlockID}
          caption={props.state.caption}
        />
      </div>
      <div className="nb-db-pane">
        <div className="nb-db-btns">
          {props.state.sort ? (
            <div
              className="nb-db-btn"
              onClick={event => props.state.presentSettings(event, "sort")}
            >
              <div>Sorted</div>
            </div>
          ) : null}
          {props.state.filter ? (
            <div
              className="nb-db-btn"
              onClick={event => props.state.presentSettings(event, "filter")}
            >
              <div>Filtered</div>
            </div>
          ) : null}
          {props.state.type === "DB_BOARD" &&
          !(props.state as NBDBBoard).boardFieldID ? (
              <div
                className="nb-ui-btn style-label"
                onClick={event => {
                  event.preventDefault()
                  event.stopPropagation()
                  props.state.addNewLabeledField()
                }}
              >
              Create New Labeled Field
              </div>
            ) : (
              <div
                className="nb-db-btn"
                onClick={event => props.state.presentSettings(event, "all")}
              >
                <MoreIcon />
              </div>
            )}
        </div>
      </div>
    </div>
  </div>
)

const TemplateButton = (props: {
  state: NBDBTemplate;
  template: DBTemplates;
}) => {
  let icon: JSX.Element | undefined

  switch (props.template) {
  case BlockPropKey.DBSpreadsheet:
    icon = <TableIcon />
    break
  case BlockPropKey.DBBoard:
    icon = <BoardIcon />
    break
  default:
    break
  }

  if (icon) {
    return (
      <div className="nb-db-template-btn" onClick={props.state.onClickTemplate}>
        {icon}
      </div>
    )
  }

  return null
}

export default Controller
