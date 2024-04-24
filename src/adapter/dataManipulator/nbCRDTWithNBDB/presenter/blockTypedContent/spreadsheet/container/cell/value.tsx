import type {DBFieldID, Editor} from "@/domain"

import React from "react"
import type {EditingPath} from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/blockTypedContent/common/editing"

/* eslint-disable @typescript-eslint/no-unused-vars */
const ValueCell = ({editor, fieldID, text, editing, ...attrs}: Props) => {
  const isEditing =
    editing?.subPath.fieldID === fieldID &&
    editor.selector.selection?.start.offset != null
  return (
    <div
      className="nb-ui-content"
      {...attrs}
      contentEditable={!editor.state.readOnly && isEditing}
      suppressContentEditableWarning
    >
      {text + "\n"}
    </div>
  )
}

const MemoizedValueCell = React.memo(ValueCell, (_, next) => {
  return (
    (next.editing?.composing &&
      next.editing.subPath.fieldID === next.fieldID) ||
    false
  )
})

export type Props = {
  editor: Editor;
  fieldID: DBFieldID;
  text: string;
  editing: EditingPath;
} & React.HTMLAttributes<HTMLDivElement>;

export default MemoizedValueCell
