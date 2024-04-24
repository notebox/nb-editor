import type {NBBlock} from "@/domain/entity"

const pretext = (offset: number, block?: NBBlock): string => {
  const spans = block?.text?.spans()
  if (!spans) return ""
  const [preSpans] = spans.splitAt(offset)
  return preSpans.toString()
}

export {pretext}
