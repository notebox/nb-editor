import type {UIHandler} from "@/domain"

import React from "react"
import {createRoot} from "react-dom/client"
import {RecoilRoot} from "recoil"
import {RecoilExternalStatePortal} from "@/domain/usecase/state/common"

import {useRecoilValue} from "recoil"
import {isEditableDOM, DOMElement} from "@/domain"

import ViewModel from "@/presenter/common/ViewModel"

import {EditorLayer, DraggingLayer, PopupLayer, SelectionLayer} from "./layer"

export const render = (target: HTMLElement, ctx: UIHandler) => {
  createRoot(target).render(
    <React.StrictMode>
      <RecoilRoot>
        <NoteboxEditor ctx={ctx} />
        <RecoilExternalStatePortal />
      </RecoilRoot>
    </React.StrictMode>,
  )
}

export const Component = ({ctx}: {ctx: UIHandler}) => (
  <div className="nb-root">
    <RecoilRoot>
      <NoteboxEditor ctx={ctx} />
      <RecoilExternalStatePortal />
    </RecoilRoot>
  </div>
)

const NoteboxEditor = ({ctx}: {ctx: UIHandler}) => {
  const dragging = useRecoilValue(ctx.state.drag.atom)
  useRecoilValue(ctx.state.edited.atom)

  ctx.addWindowEventListeners()
  if (!ctx.editor.loaded) return null

  const isCardView = !ctx.editor.dataManipulator.childBlocks(ctx.editor.rootBlockID)
    .length

  return (
    <>
      <EditorLayer
        ctx={ctx}
        autoFocus={false}
        isCardView
        /** @purpose dragging */
        className={className(dragging.isDragging, isCardView)}
        onContextMenu={preventContextMenuOnUI}
      />
      <DraggingLayer state={ctx.state} />
      <PopupLayer ctx={ctx} />
      <SelectionLayer ctx={ctx} />
    </>
  )
}

const className = (isDragging: boolean, isCardView: boolean): string => {
  const result = isDragging ? "nb-editor dragging" : "nb-editor"
  return isCardView ? result + " card" : result
}

const preventContextMenuOnUI = (event: React.MouseEvent) => {
  if (isEditableDOM(event.target as DOMElement)) return
  event.preventDefault()
  event.stopPropagation()
}

export {useState, useEffect, useLayoutEffect} from "react"
export {useRecoilValue} from "recoil"
export * from "../domain/entity"
export * from "../domain/usecase"
export {ViewModel}
