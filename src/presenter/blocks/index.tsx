import type {NBBlock} from "@/domain/entity"
import type {PresenterBlockProps} from "@/domain/usecase"

import {BlockType, uint32MAX} from "@/domain/entity"
import BlockHandleComponent from "./parts/handle"
import BlockTypedContentComponent, {allowChildBlocks} from "./typedContent"

const BlockComponent = (props: PresenterBlockProps): JSX.Element => (
  <div
    data-nb-dom-type="block"
    data-nb-block={props.block.blockID}
    data-nb-block-type={props.block.type}
    key={props.block.blockID}
    className={props.isFullWidth ? "fill" : undefined}
    onMouseEnter={event =>
      props.ctx.mouse.onMouseEnterToBlock(event, props.block.blockID)
    }
    onMouseLeave={event =>
      props.ctx.mouse.onMouseLeaveFromBlock(event, props.block.blockID)
    }
    tabIndex={props.block.text ? undefined : -1}
  >
    {needsBlockLevelHandle(
      props.isFullWidth,
      props.block.type as BlockType
    ) && (
      <div className="nb-block-handle-container">
        <BlockHandleComponent ctx={props.ctx} blockID={props.block.blockID} />
      </div>
    )}
    <div className="nb-block-body">
      <div className="nb-block-content">
        {BlockTypedContentComponent(props)}
      </div>
      {BlockChildrenComponent(props)}
    </div>
  </div>
)

export const BlockChildrenComponent = (props: PresenterBlockProps, fromNoteBlock?: boolean) => {
  if (!allowChildBlocks[props.block.type]) return null
  const children = props.ctx.editor.dataManipulator.childBlocks(props.block.blockID)
  if (!children.length) return null

  let order = 0
  return (
    <div className="nb-block-indent">
      {children.map(block => {
        if (block.type === BlockType.OrderedList) {
          order++
        } else if (!props.block.props?.GLOBAL_COUNT?.[1]) {
          order = 0
        }

        return (
          <BlockComponent
            key={block.blockID}
            ctx={props.ctx}
            block={block}
            order={order}
            isFullWidth={fromNoteBlock && isFill(block)}
          />
        )
      })}
    </div>
  )
}

const isFill = (block: NBBlock): boolean => {
  switch (block.type) {
  case "DATABASE":
    return true
  case "IMG":
    return block.props?.W?.[1] === uint32MAX
  default:
    return false
  }
}

const needsBlockLevelHandle = (
  isFullWidth?: boolean,
  type?: BlockType
): boolean => {
  return !isFullWidth && type !== "DATABASE"
}
