import type {NBBlock, BlockPropKey} from "@/domain/entity"
import type {UIHandler} from "../uiHandler"

export type PresenterBlockProps<Context = UIHandler> = {
  ctx: Context;
  block: NBBlock;
  order: number;
  propKey?: BlockPropKey;
  offset?: number;
  isFullWidth?: boolean;
};

export type PresenterBlockHandler = {
  render: (props: PresenterBlockProps) => JSX.Element
}