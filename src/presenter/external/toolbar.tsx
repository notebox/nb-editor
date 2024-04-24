import type {UIHandler} from "../../domain"

import {BlockType, BlockPropKey, TextPropKey, Color} from "../../domain"

import React, {useState} from "react"
import "./style.scss"

export const Toolbar = ({ctx}: {ctx: UIHandler}) => {
  const [modal, setModal] = useState<ModalType>(null)

  return (
    <div className="toolbar-btn">
      <div style={{display: "flex", flexWrap: "wrap", gap: "0.5em", padding: "0.5em"}}>
        <BTNsBase ctx={ctx} setModel={setModal} />
        <dialog open={!!modal}>
          <div style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
            <Button label="Close" onClick={() => setModal(null)} />
            {modal === "block" ? <>
              <h5>basic</h5>
              <BTNsBlock ctx={ctx} />
              <h5>embed</h5>
              <BTNsBlockEmbed ctx={ctx} />
            </> : modal === "color" ? 
              <>
                <h5>foreground</h5>
                <ColorPicker ctx={ctx} textPropKey={TextPropKey.ForegroundColor} />
                <h5>background</h5>
                <ColorPicker ctx={ctx} textPropKey={TextPropKey.BackgroundColor} />
              </>
              : null}
          </div>
        </dialog>
      </div>
    </div>
  )
}

const BTNsBase = ({ctx, setModel}: {ctx: UIHandler, setModel: (modalType: ModalType) => void}) => {
  return <>
    <Button label="Block" onClick={() => setModel("block")} />
    <Button label="Indent" onClick={(event) => {
      event.preventDefault()
      event.stopPropagation()
      ctx.external.indent()
    }} />
    <Button label="Dedent" onClick={() => ctx.external.dedent()} />
    <Button label="Undo" onClick={() => ctx.external.undo()} />
    <Button label="Redo" onClick={() => ctx.external.redo()} />
    <Button label="B" onClick={() => formatText(ctx, TextPropKey.Bold, true)} />
    <Button label="I" onClick={() => formatText(ctx, TextPropKey.Italic, true)} />
    <Button label="U" onClick={() => formatText(ctx, TextPropKey.Underline, true)} />
    <Button label="S" onClick={() => formatText(ctx, TextPropKey.Strike, true)} />
    <Button label="C" onClick={() => formatText(ctx, TextPropKey.Code, true)} />
    <Button label="Link" onClick={() => formatText(ctx, TextPropKey.Link, true)} />
    <Button label="Color" onClick={() => setModel("color")} />
  </>
}

const BTNsBlock = ({ctx}: {ctx: UIHandler}) => {
  return <>
    <Button label="H1" onClick={() => ctx.external.setBlockType(BlockType.Header1)} />
    <Button label="H2" onClick={() => ctx.external.setBlockType(BlockType.Header2)} />
    <Button label="H3" onClick={() => ctx.external.setBlockType(BlockType.Header3)} />
    <Button label="CL" onClick={() => ctx.external.setBlockType(BlockType.CheckList)} />
    <Button label="UL" onClick={() => ctx.external.setBlockType(BlockType.UnorderedList)} />
    <Button label="OL" onClick={() => ctx.external.setBlockType(BlockType.OrderedList)} />
    <Button label="BLOCKQUOTE" onClick={() => ctx.external.setBlockType(BlockType.Blockquote)} />
    <Button label="HR" onClick={() => ctx.external.insertBlock({TYPE: BlockType.Divider})} />
    <Button label="LINK" onClick={() => ctx.external.insertBlock({TYPE: BlockType.Linkblock})} />
    <Button label="IMG" onClick={() => ctx.external.insertBlock({TYPE: BlockType.Image, SRC: "https://picsum.photos/seed/picsum/2048/1024"})} />
    <Button label="CODEBLOCK" onClick={() => ctx.external.insertBlock({TYPE: BlockType.Codeblock})} />
  </>
}

const BTNsBlockEmbed = ({ctx}: {ctx: UIHandler}) => {
  return <>
    <Button label="SPREADSHEET" onClick={() => ctx.external.insertBlock({TYPE: BlockType.Database, DB_TEMPLATE: BlockPropKey.DBBoard})} />
    <Button label="BOARD" onClick={() => ctx.external.insertBlock({TYPE: BlockType.Database, DB_TEMPLATE: BlockPropKey.DBSpreadsheet})} />
    <Button label="MERMAID" onClick={() => ctx.external.insertBlock({TYPE: BlockType.Mermaid})} />
  </>
}

const ColorPicker = ({ctx, textPropKey}: {ctx: UIHandler, textPropKey: TextPropKey.ForegroundColor | TextPropKey.BackgroundColor}) => {
  return <>
    <Button label="Red" onClick={() => formatText(ctx, textPropKey, Color.Red)} />
    <Button label="Orange" onClick={() => formatText(ctx, textPropKey, Color.Orange)} />
    <Button label="Yellow" onClick={() => formatText(ctx, textPropKey, Color.Yellow)} />
    <Button label="Green" onClick={() => formatText(ctx, textPropKey, Color.Green)} />
    <Button label="Blue" onClick={() => formatText(ctx, textPropKey, Color.Blue)} />
    <Button label="Purple" onClick={() => formatText(ctx, textPropKey, Color.Purple)} />
    <Button label="Gray" onClick={() => formatText(ctx, textPropKey, Color.Gray)} />
  </>
}

const formatText = (ctx: UIHandler, textPropKey: TextPropKey, value: string | true) => {
  ctx.external.formatText(textPropKey, ctx.editor.selector.textProps[textPropKey] === value ? null : value)
}

const Button = ({label, onClick}: {label: string, onClick?: React.MouseEventHandler}) => {
  return (<div
    className="ui-btn"
    style={{
      padding: "2px",
      minWidth: "2em",
      lineHeight: "1.5em",
      textAlign: "center",
      border: "1px solid black",
      borderRadius: "0.5em",
      cursor: "pointer",
    }}
    onClick={onClick}
  >{label}</div>)
}

type ModalType = "block" | "color" | null