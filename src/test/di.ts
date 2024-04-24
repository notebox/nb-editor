import "@/domain/entity/global/window"

import type {ReadOnlyOptions} from "@/domain/usecase/state"
import type {ReplicaData} from "@/adapter/dataManipulator/nbCRDT/crdt"

import {Editor, State} from "@/domain/usecase"
import {DebugEmitter} from "@/adapter/device/debug"
import {NBDBDataManipulator} from "@/adapter/dataManipulator/nbCRDTWithNBDB"
import {Templates} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

export const testDI = (data: ReplicaData, readOnly: ReadOnlyOptions | false = false) => {
  const emitter = new DebugEmitter()
  const editor = new Editor(emitter, new State)
  const templates = new Templates(editor)
  const manipulator = new NBDBDataManipulator(editor, data, templates)
  editor.load(manipulator, readOnly)
  return editor
}
