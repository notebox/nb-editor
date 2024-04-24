import type {Editor, PresenterBlockProps} from "@/domain"

import {useState, useEffect} from "react"

import MoreIcon from "@/presenter/common/icon/more"
import {BlockType} from "@/domain/entity"

export const LinkBlockComponent = (props: PresenterBlockProps): JSX.Element => {
  const url = props.block.props.LINK?.[1] ?? ""
  const [preview, setPreview] = useState<Preview>(getPreview(url))

  useEffect(() => {
    if (!url) {
      props.ctx.editor.popup({
        type: "link-url-setter",
        meta: {
          purpose: {
            to: "block",
            blockID: props.block.blockID,
          },
        },
      })
      return
    }
    setPreview(getPreview(url))
  }, [url])
  useEffect(() => {
    fetchPreview(props.ctx.editor, preview).then(setPreview)
  }, [preview.url])

  return (
    <div
      contentEditable={false}
      className="card"
      onClick={() => props.ctx.editor.emitter.emitNavigate(preview.url)}
    >
      {preview.image && <img src={preview.image} className="preview" />}
      <div className="content">
        <div className="header">
          <div className="title">{preview.title || preview.hostname}</div>
          {props.ctx.state.readOnly ? null : (
            <div
              className="selector"
              onClick={event => {
                props.ctx.editor.popup({
                  type: "block-handle",
                  meta: {
                    blockID: props.block.blockID,
                    blockType: BlockType.Linkblock,
                  },
                }, event)
              }}
            >
              <MoreIcon />
            </div>
          )}
        </div>

        {preview.description && (
          <div className="description">{preview.description}</div>
        )}
        <div className="url">
          {preview.favicon && <img src={preview.favicon} className="favicon" />}
          <span>{preview.url}</span>
        </div>
      </div>
    </div>
  )
}

const getPreview = (url: string): Preview => {
  try {
    const link = new URL(url)
    const hostname = link.hostname
    return {
      url,
      hostname,
    }
  } catch {
    return {
      url,
      hostname: "",
    }
  }
}

const fetchPreview = async (editor: Editor, preview: Preview): Promise<Preview> => {
  const data = await editor.emitter.previewLink(preview.url)

  return data
    ? {
      ...preview,
      title: data.title,
      description: data.description,
      favicon: data.favicon,
      image: data.image,
    }
    : preview
}

type Preview = {
  url: string;
  hostname: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
};

export default LinkBlockComponent
