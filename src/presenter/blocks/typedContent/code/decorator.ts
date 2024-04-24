import type {BlockID, NBBlock, TextBlock} from "@/domain"
import type {State} from "@/domain/usecase/state"

import Prism, {list} from "./prismjs"
import * as sanitizer from "@/domain/usecase/sanitizer"

export class CodeblockDecorator {
  tokenized: string

  readonly blockID: BlockID
  private code: string

  constructor(blockID: BlockID) {
    this.blockID = blockID
    this.code = ""
    this.tokenized = ""
  }

  tokenize(
    code: string,
    language: string | undefined = "plain",
    force: boolean
  ): void {
    if (!force && code === this.code) return

    this.code = code
    const tokenized = tokensToHTML(
      Prism.tokenize(code, Prism.languages[list[language] ?? "plain"])
    )

    this.tokenized = tokenized
  }

  static tokenize(state: State, block: NBBlock): string {
    const blockID = `${state.id}+${block.blockID}`
    const force = state.changed.extract(blockID)

    const code = (block as TextBlock).text.toString()
    let instance = instances[blockID]

    if (!instance) {
      instance = new CodeblockDecorator(blockID)
      instances[blockID] = instance
    }
    instance.tokenize(code, block.props.LANG?.[1], force)

    return instance.tokenized
  }
}

const tokensToHTML = (tokens: (Prism.Token | string)[]): string => {
  return tokens.reduce((acc, cur) => acc + tokenToHTML(cur), "") as string
}

const tokenToHTML = (token: Prism.Token | string): string => {
  if (typeof token === "string") {
    return sanitizer.sanitizeHTMLText(token)
  }
  const content =
    typeof token.content === "string"
      ? sanitizer.sanitizeHTMLText(token.content)
      : tokensToHTML(token.content as (string | Prism.Token)[])
  return `<span class="token ${token.type}">${content}</span>`
}

const instances: {[key: string]: CodeblockDecorator} = {}
