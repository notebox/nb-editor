import {Color, TextPropKey} from "@/domain/entity"
import {sanitizeUrl} from "@braintree/sanitize-url"

export const sanitizeURL = sanitizeUrl
export const sanitizeTextPropKey = (
  unsafe: string
): TextPropKey | undefined => {
  return inlinePropKeyWhitelist[unsafe]
}
const inlinePropKeyWhitelist: {[key: string]: TextPropKey | undefined} = {
  [TextPropKey.Bold]: TextPropKey.Bold,
  [TextPropKey.Italic]: TextPropKey.Italic,
  [TextPropKey.Strike]: TextPropKey.Strike,
  [TextPropKey.Underline]: TextPropKey.Underline,
  [TextPropKey.Code]: TextPropKey.Code,
  [TextPropKey.Link]: TextPropKey.Link,
  [TextPropKey.ForegroundColor]: TextPropKey.ForegroundColor,
  [TextPropKey.BackgroundColor]: TextPropKey.BackgroundColor,
}

export const sanitizeLink = (unsafe: string): string => {
  const unsafeWithProtocol = !/^(?:f|ht)tps?:\/\//.test(unsafe)
    ? `https://${unsafe}`
    : unsafe
  return protocolWhitelist[
    unsafeWithProtocol.slice(0, unsafeWithProtocol.indexOf(":"))
  ]
    ? sanitizeURL(unsafeWithProtocol)
    : "//:0"
}
const protocolWhitelist: {[key: string]: boolean} = {
  "nb-cache": true,
  http: true,
  https: true,
  mailto: true,
}

export const sanitizeColor = (unsafe: string): Color | null =>
  colorWhitelist[unsafe] || null
const colorWhitelist: {[key: string]: Color} = {
  red: Color.Red,
  orange: Color.Orange,
  yellow: Color.Yellow,
  green: Color.Green,
  blue: Color.Blue,
  purple: Color.Purple,
  gray: Color.Gray,
}

export const sanitizeHTMLText = (unsafe: string): string =>
  unsafe.replace(htmlTagsRegex, sanitizeHTMLTags)
const sanitizeHTMLTags = (tag: string): string => htmlTags[tag]!
const htmlTags: {[key: string]: string} = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;",
}
const htmlTagsRegex = /&|<|>|"|'/g
