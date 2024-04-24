import type {BlockID, SubPath, Editor} from "@/domain"
import type {WorkingCaret} from "@/domain/usecase/state/working"

export const getEditingPathFromWorkingCaret = (
  editor: Editor,
  templateBlockID: BlockID,
  workingCaret?: WorkingCaret
): EditingPath => {
  if (
    workingCaret?.blockID !== templateBlockID ||
    workingCaret.subPath?.type !== "db"
  )
    return null

  return {
    subPath: workingCaret.subPath,
    composing: !!editor.state.working.composing,
  }
}

export type EditingPath = {
  subPath: SubPath;
  composing: boolean;
} | null;
