import type {BlockID} from "@/domain/entity"
import type {UIHandler} from "@/domain/usecase"
import type {Draggable} from "@/domain/usecase/uiHandler/drag/block"

import {useRecoilValue} from "recoil"
import {DragTypeBlockHandle} from "@/domain/usecase/state/drag"

export default (props: Props) => {
  const editor = props.ctx.editor
  const working = useRecoilValue(editor.state.working.atom)
  return !editor.state.readOnly &&
    !editor.state.drag.dragging &&
    working.blockID === props.blockID ? (
      <div
        contentEditable={false}
        className="nb-block-handle nb-no-editable"
        onClick={event => {
          editor.popup({
            type: "block-handle",
            meta: {
              blockID: props.blockID,
              blockType: editor.dataManipulator.block(props.blockID).type,
              draggable: props.draggable ||
              ({
                type: DragTypeBlockHandle,
                blockID: props.blockID,
              } as Draggable),
            },
          }, event)
        }}
        onDragStart={event => {
          event.preventDefault()
          event.stopPropagation()
          props.ctx.drag.onBlockDraggingStart(
            props.draggable ||
            ({
              type: DragTypeBlockHandle,
              blockID: props.blockID,
            } as Draggable),
            {
              left: event.clientX,
              top: event.clientY,
            }
          )
        }}
        draggable={true}
      >
        <div className="dragger">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1.5em"
            viewBox="0 0 24 32"
            preserveAspectRatio=""
          >
            <path d="M9.9999 8.4001C9.9999 9.39421 9.19401 10.2001 8.1999 10.2001C7.20579 10.2001 6.3999 9.39421 6.3999 8.4001C6.3999 7.40599 7.20579 6.6001 8.1999 6.6001C9.19401 6.6001 9.9999 7.40599 9.9999 8.4001Z" />
            <path d="M17.5999 8.4001C17.5999 9.39421 16.794 10.2001 15.7999 10.2001C14.8058 10.2001 13.9999 9.39421 13.9999 8.4001C13.9999 7.40599 14.8058 6.6001 15.7999 6.6001C16.794 6.6001 17.5999 7.40599 17.5999 8.4001Z" />
            <path d="M9.9999 16.0001C9.9999 16.9942 9.19401 17.8001 8.1999 17.8001C7.20579 17.8001 6.3999 16.9942 6.3999 16.0001C6.3999 15.006 7.20579 14.2001 8.1999 14.2001C9.19401 14.2001 9.9999 15.006 9.9999 16.0001Z" />
            <path d="M17.5999 16.0001C17.5999 16.9942 16.794 17.8001 15.7999 17.8001C14.8058 17.8001 13.9999 16.9942 13.9999 16.0001C13.9999 15.006 14.8058 14.2001 15.7999 14.2001C16.794 14.2001 17.5999 15.006 17.5999 16.0001Z" />
            <path d="M9.9999 23.6001C9.9999 24.5942 9.19401 25.4001 8.1999 25.4001C7.20579 25.4001 6.3999 24.5942 6.3999 23.6001C6.3999 22.606 7.20579 21.8001 8.1999 21.8001C9.19401 21.8001 9.9999 22.606 9.9999 23.6001Z" />
            <path d="M17.5999 23.6001C17.5999 24.5942 16.794 25.4001 15.7999 25.4001C14.8058 25.4001 13.9999 24.5942 13.9999 23.6001C13.9999 22.606 14.8058 21.8001 15.7999 21.8001C16.794 21.8001 17.5999 22.606 17.5999 23.6001Z" />
          </svg>
        </div>
      </div>
    ) : (
      <div
        contentEditable={false}
        className="nb-block-handle nb-no-editable"
      ></div>
    )
}

type Props = {
  ctx: UIHandler;
  blockID: BlockID;
  draggable?: {type: string; blockID: string};
};
