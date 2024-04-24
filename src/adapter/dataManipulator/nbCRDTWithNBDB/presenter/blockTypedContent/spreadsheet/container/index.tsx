import type {UIHandler} from "@/domain"
import type {NBDBSpreadsheet} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import {useRecoilValue} from "recoil"

import Header from "./header"
import DBRecords from "./records"
import Footer from "./footer"

const Container = (props: {ctx: UIHandler, state: NBDBSpreadsheet}) => {
  const isDragging =
    useRecoilValue(props.ctx.state.drag.atom).isDragging &&
    props.ctx.state.drag.dragging?.container?.blockID === props.state.templateBlockID

  return (
    <div className="nb-db-container" data-nb-dragging-container={isDragging}>
      <div className="nb-db-content">
        <table className="nb-db-table">
          <Header ctx={props.ctx} state={props.state} />
          <DBRecords ctx={props.ctx} state={props.state} />
          <Footer state={props.state} />
        </table>
      </div>
      <div className="nb-ui-footer">&nbsp;</div>
    </div>
  )
}

export default Container
