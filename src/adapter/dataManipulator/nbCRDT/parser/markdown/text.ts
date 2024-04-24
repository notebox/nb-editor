import type {
  TextPropsContent,
} from "@/domain/entity"
import type {
  Text,
  Leaf,
  INSContent,
  Spans,
} from "@/adapter/dataManipulator/nbCRDT/crdt"

export const markdownFromText = (text?: Text): string => {
  const spans = text?.spans()
  return spans ? markdownFromSpans(spans) : ""
}

const markdownFromSpans = (spans: Spans): string => {
  let context: TextPropsContext = {markdown: ""}

  spans.forEach(span => {
    context = markdownFromSpan(span.content, context)
  })

  let closing = ""
  if (context.A) {
    closing = `] (${context.A})`
  }
  if (context.B) {
    closing = "**" + closing
  }
  if (context.I) {
    closing = "*" + closing
  }
  if (context.S) {
    closing = "~~" + closing
  }
  if (context.CODE) {
    closing = "`" + closing
  }

  return context.markdown + closing
}

const markdownFromSpan = (
  content: INSContent,
  context: TextPropsContext
): TextPropsContext => {
  if (content.isMeta()) {
    return {...context, markdown: context.markdown + " "}
  }

  const text = content.toTextWithMetaPlaceholder()

  let preProps: TextPropsContent = context
  let markdown = context.markdown
  let index = 0

  content.attributes.leaves.forEach((leaf: Leaf) => {
    const subtext = text.substring(index, index + leaf.length)
    index += leaf.length

    let closing = ""
    let opening = ""
    const props: TextPropsContent = leaf.props ?? {}

    if (props.A !== preProps.A) {
      if (preProps.A) {
        closing = `] (${preProps.A})`
      }
      if (props.A) {
        opening = "["
      }
    }
    if (props.B !== preProps.B) {
      if (props.B) {
        opening += "**"
      } else {
        closing = "**" + closing
      }
    }
    if (props.I !== preProps.I) {
      if (props.I) {
        opening += "*"
      } else {
        closing = "*" + closing
      }
    }
    if (props.S !== preProps.S) {
      if (props.S) {
        opening += "~~"
      } else {
        closing = "~~" + closing
      }
    }
    if (props.CODE !== preProps.CODE) {
      if (props.CODE) {
        opening += "`"
      } else {
        closing = "`" + closing
      }
    }

    markdown += closing + opening + subtext
    preProps = props
  })

  return {...preProps, markdown}
}

type TextPropsContext = TextPropsContent & {
  markdown: string;
};
