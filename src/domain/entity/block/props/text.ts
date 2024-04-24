import {Color} from "./color"

export enum TextPropKey {
  Bold = "B",
  Italic = "I",
  Strike = "S",
  Underline = "U",
  Code = "CODE",
  Link = "A",
  ForegroundColor = "FCOL",
  BackgroundColor = "BCOL",
}

export type TextPropValue = true | string;

export const strToColor: {[key: string]: Color | undefined} = {
  red: Color.Red,
  orange: Color.Orange,
  yellow: Color.Yellow,
  green: Color.Green,
  blue: Color.Blue,
  purple: Color.Purple,
  gray: Color.Gray,
}

export const tagToTextPropKey: {[key: string]: TextPropKey | undefined} = {
  B: TextPropKey.Bold,
  I: TextPropKey.Italic,
  S: TextPropKey.Strike,
  U: TextPropKey.Underline,
  CODE: TextPropKey.Code,
  A: TextPropKey.Link,
  /** @verbose belows are the adopted tags */
  STRONG: TextPropKey.Bold,
}

declare module "@notebox/nb-crdt" {
  interface TextPropsContent extends Dictionary {
    [TextPropKey.Bold]?: true;
    [TextPropKey.Italic]?: true;
    [TextPropKey.Strike]?: true;
    [TextPropKey.Underline]?: true;
    [TextPropKey.Code]?: true;
    [TextPropKey.Link]?: string;
    [TextPropKey.ForegroundColor]?: Color;
    [TextPropKey.BackgroundColor]?: Color;
  }
}

export {TextPropsContent} from "@notebox/nb-crdt"
