import type {NBRange} from "./range"
import type {BlockType, TextProps} from "./block/props"

export type NBSelection = {
  blockType?: BlockType | undefined;
  range?: NBRange | undefined;
  history: {
    isUndoable: boolean;
    isRedoable: boolean;
  };
  indentation: {
    isIndentable: boolean;
    isDedentable: boolean;
  };
  textProps: TextProps;
};
