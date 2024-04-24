import type {ResizeCallback} from "re-resizable"
import type {FileID, BlockID, Editor, PresenterBlockProps} from "@/domain"

import {Resizable} from "re-resizable"
import {useEffect} from "react"
import {useRecoilValue} from "recoil"
import {uint32MAX, BlockPropKey, NBRange, getMaxEditorWidth} from "@/domain"
import BlockHandleComponent from "@/presenter/blocks/parts/handle"
import DiameterIcon from "@/presenter/common/icon/diameter"
import CaptionComponent from "./caption"

export const IMGBlockComponent = (props: PresenterBlockProps): JSX.Element => {
  const working = useRecoilValue(props.ctx.state.working.atom)
  const isWorking = props.block.blockID === working.blockID
  const isEditingCaption = isWorking && working.caret?.subPath?.type === "caption"

  const fileID = props.block.props.FILE_ID?.[1]
  const isUploading = fileID && props.ctx.editor.emitter.uploader.uploadingFileIDs.has(fileID)

  useEffect(() => {
    selectCaptionIfNotFocused(props.ctx.editor, props.block.blockID, isEditingCaption)
  })

  if (isUploading) {
    return (
      <div className="loading nb-no-editable">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const width = props.block.props.W?.[1]

  let size
  let lockAspectRatio
  if (props.isFullWidth) {
    size = {width: "100vw", height: props.block.props.H?.[1] || "auto"}
    lockAspectRatio = false
  } else {
    /**
     * @issue max-width in not-fill mode is not work.
     * 1. set width under the editor width
     * 2. resize window under the image width
     * 3. then, image width exceeds editor width even if the max-width css is set.
     */
    size = {
      width: props.block.props.W?.[1]
        ? width === uint32MAX
          ? "100%"
          : `${props.block.props.W[1]}px`
        : "auto",
      height: "auto",
    }
    lockAspectRatio = true
  }

  const caption = props.block.props.CAPTION?.[1]

  return (
    <div contentEditable={false}>
      <Resizable
        className="nb-resizer"
        size={size}
        minWidth="64px"
        minHeight="18px" /** @design default font size */
        lockAspectRatio={lockAspectRatio}
        enable={isWorking ? {bottomRight: true} : {}}
        onResize={props.ctx.editor.selector.onSelectionChanged}
        onResizeStart={() => props.ctx.state.working.lock(true)}
        onResizeStop={onResizeStop(props)}
        handleComponent={{bottomRight: <DiameterIcon />}}
        handleClasses={{bottomRight: "nb-resizable-handle"}}
        handleStyles={{
          bottomRight: {
            right: 0,
            bottom: 0,
            width: "3rem",
            height: "3rem",
            margin: "0",
            padding: "0",
            cursor: "default",
          },
        }}
      >
        <div
          className="img-container"
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            props.ctx.state.working.set(props.block.blockID)
          }}
        >
          <img
            src={props.ctx.editor.emitter.fileURL(
              props.block.props.SRC?.[1],
              props.block.props.FILE_ID?.[1]
            )}
          />
          {isWorking ? OpenButton(props.ctx.editor, fileID!, caption) : null}
        </div>
      </Resizable>
      {(caption || isEditingCaption) && (
        <CaptionComponent
          ctx={props.ctx}
          blockID={props.block.blockID}
          caption={props.block.props.CAPTION?.[1]}
        />
      )}
      {props.isFullWidth && <BlockHandleComponent ctx={props.ctx} blockID={props.block.blockID} />}
    </div>
  )
}

const OpenButton = (editor: Editor, fileID: FileID, caption?: string) => (
  <div className="open-img-btn-container nb-no-editable">
    <div
      className="open-img-btn"
      onClick={() => {
        editor.emitter.emitHaptic()
        openFile(editor, fileID, caption)
      }}
    >
      OPEN
    </div>
  </div>
)

const onResizeStop =
  ({ctx, block}: PresenterBlockProps): ResizeCallback =>
    (_e, _dir, ref): void => {
      const operator = ctx.editor.newOperator()

      const editorInnerWidth = getMaxEditorWidth()
      const width = ref.clientWidth
      const isFullWidth = width > editorInnerWidth + 18

      if (isFullWidth) {
        const img = ref.getElementsByTagName("img")[0]
        const {clientWidth, clientHeight, naturalWidth, naturalHeight} = img
        operator.setBlockProp(block.blockID, BlockPropKey.Width, uint32MAX)
        if (clientWidth / clientHeight <= naturalWidth / naturalHeight) {
          operator.setBlockProp(block.blockID, BlockPropKey.Height, null)
        } else {
          operator.setBlockProp(
            block.blockID,
            BlockPropKey.Height,
            ref.clientHeight
          )
        }
      } else {
        if (width > editorInnerWidth - 18) {
          operator.setBlockProp(block.blockID, BlockPropKey.Width, null)
        } else {
          operator.setBlockProp(block.blockID, BlockPropKey.Width, width)
        }
      }

      ctx.editor.commit(operator)
      setTimeout(ctx.editor.selector.onSelectionChanged, 500)
      ctx.state.working.lock(false)
    }

const openFile = (editor: Editor, fileID?: FileID, title?: string): void => {
  if (!fileID) return
  editor.emitter.openFile({fileID, title})
}

const selectCaptionIfNotFocused = (
  editor: Editor,
  blockID: BlockID,
  shouldEditCaption?: boolean
): void => {
  if (!shouldEditCaption) return
  const current = editor.selector.selection?.start
  if (current && current.blockID == blockID && current.subPath?.type === "caption") return

  const range = NBRange.decode({
    blockID,
    subPath: {
      type: "caption",
    },
    offset: editor.dataManipulator.block(blockID).props.CAPTION?.[1]?.length ?? 0,
  })

  editor.state.working.lock(false)
  editor.selector.select(range)
  editor.state.reRender()
}

export default IMGBlockComponent
