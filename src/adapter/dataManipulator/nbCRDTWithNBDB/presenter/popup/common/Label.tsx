import type {DBLabelID} from "@/domain/entity"

import {Color} from "@/domain/entity"

export default ({
  index,
  labelID,
  name,
  isHoverable,
  draggable,
  color,
  onClick,
  onDragStart,
  onTouchStart,
}: {
  index?: number;
  labelID: DBLabelID;
  name: string;
  isHoverable: boolean;
  draggable?: boolean;
  color?: Color;
  onClick?: () => void;
  onDragStart?: React.DragEventHandler<HTMLSpanElement>;
  onTouchStart?: React.TouchEventHandler<HTMLSpanElement>;
}) => (
  <span
    className={`nbdb-label ${isHoverable ? "hoverable" : ""} nb-bgcolor-${
      color ?? Color.Gray
    }`}
    onClick={onClick}
    data-nbdb-label-id={labelID}
    data-nbdb-label-index={index}
    draggable={draggable}
    onDragStart={onDragStart}
    onTouchStart={onTouchStart}
  >
    {name}
  </span>
)
