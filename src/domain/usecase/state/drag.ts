import type {RecoilState} from "recoil"
import type {BlockID, Editor} from "@/domain"

import {atom as genAtom} from "recoil"
import {setRecoilExternalState} from "./common"

export class DragStateHandler {
  readonly atom: RecoilState<DragState>
  dragging?: Dragging

  constructor(id: string) {
    this.atom = genAtom<DragState>({
      key: id + "drag",
      default: {
        isDragging: false,
      },
    })
  }

  update(position?: Position, style?: React.CSSProperties) {
    setRecoilExternalState(this.atom, {
      isDragging: !!this.dragging,
      position,
      style,
    })
  }
}

export type CustomDragHandlers = {
  [type: string]: Handler
};

export type Handler = {
  start: (editor: Editor, draggable: Draggable) => Dragging | undefined;
  move: (
    editor: Editor,
    pointer: PointerPosition,
    dragging: Dragging
  ) => DraggingMoved | undefined;
  end: (editor: Editor, dragging: Dragging, destination: DraggingDestination) => void;
};

/** @category payload */
export type DragType = string
export const DragTypeBlockHandle = "BLOCK"

export type PointerPosition = {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
};

export type Draggable = {type: string};
export type Dragging = {type: string; container?: DraggableContainer};
export type DraggingDestination = {type: string};

export type DraggingMoved = {
  destination: DraggingDestination | null;
  position: Position;
  style?: React.CSSProperties;
};

/** @category ui */
export type DraggableContainer = {
  blockID?: BlockID;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** @category recoil */
export type DragState = {
  isDragging: boolean;
  position?: Position;
  style?: React.CSSProperties;
};

export type Position = {
  left: number;
  top: number;
};