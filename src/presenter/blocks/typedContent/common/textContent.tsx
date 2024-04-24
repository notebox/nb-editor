import type {NBSpanContent, NBSpanContentLeaf} from "@/domain/entity"

import {TextPropKey} from "@/domain/entity"
import * as sanitizer from "@/domain/usecase/sanitizer"

export const htmlFromTextContent = (content: NBSpanContent): string => {
  let index = 0
  let acc = ""

  if (content.isMeta()) {
    return "<span class=\"nb-no-editable\">�</span>"
  }

  const text = content.toTextWithMetaPlaceholder()
  content.attributes.leaves.forEach((leaf: NBSpanContentLeaf) => {
    let content: string = sanitizer.sanitizeHTMLText(
      text.substring(index, index + leaf.length)
    )
    index += leaf.length

    const propKeys = leaf.props && Object.keys(leaf.props)
    if (propKeys && propKeys.length > 0) {
      const className: string[] = []
      let href = ""

      propKeys.forEach(propKey => {
        switch (propKey) {
        case TextPropKey.ForegroundColor:
          className.push(
            `nb-color-${sanitizer.sanitizeColor(
                leaf.props![propKey] as string
            )}`
          )
          return
        case TextPropKey.BackgroundColor:
          className.push(
            `nb-bgcolor-${sanitizer.sanitizeColor(
                leaf.props![propKey] as string
            )}`
          )
          return
        case TextPropKey.Code:
          className.push("nb-inline-code")
          return
        case TextPropKey.Link:
          href = leaf.props![propKey] as string
          return
        case TextPropKey.Bold:
        case TextPropKey.Italic:
        case TextPropKey.Strike:
        case TextPropKey.Underline:
          content = `<${propKey}>${content}</${propKey}>`
          return
        default: {
          return
        }
        }
      })

      /** @issue vulnerable */
      if (href) {
        const sanitizedURL = sanitizer.sanitizeLink(href)
        content = `<a href="${sanitizedURL}" onclick="notebox.navigate('${sanitizedURL}');" class="${className.join(
          " "
        )}">${content}</a>`
      } else {
        content = `<span class="${className.join(" ")}">${content}</span>`
      }
    } else {
      content = `<span>${content}</span>`
    }

    acc += content
  })
  return acc
}
