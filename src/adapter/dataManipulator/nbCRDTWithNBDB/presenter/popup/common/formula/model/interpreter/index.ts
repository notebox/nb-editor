import type {DBFormula, DBFieldID} from "@/domain/entity"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import {
  FormulaBoolElement,
  FormulaNumberElement,
  FormulaStringElement,
  FormulaFunctionElement,
  FormulaGroupElement,
  FormulaPropertyElement,
  FormulaBangOperationElement,
  FormulaNormalOperationElement,
  CommonFormulaElementWithArguments,
} from "./elements"
import * as Operator from "../helper/operator"

export class Interpreter {
  code: string
  result = ""

  readonly writing = new CommonFormulaElementWithArguments()

  private template: NBDBTemplate
  private curFieldID?: DBFieldID

  constructor(template: NBDBTemplate, code: string, curFieldID?: DBFieldID) {
    this.template = template
    this.curFieldID = curFieldID
    this.code = code
    this.trimLeft()
    if (!this.code) {
      return
    }
    this.interpret()
  }

  data(): DBFormula | null {
    return this.writing.formula.isEmpty
      ? null
      : this.writing.formulaResult.encode()
  }

  interpret(): void {
    while (this.code) {
      const syntax = interpretSyntax(this.code)

      switch (syntax[0]) {
      case Syntax.Bool:
        this.writing.add(new FormulaBoolElement(syntax[1] === "true"))
        this.result += `<span class="nb-formula-bool">${syntax[1]}</span>`
        break
      case Syntax.Number:
        this.writing.add(new FormulaNumberElement(syntax[1]))
        this.result += `<span class="nb-formula-number">${syntax[1]}</span>`
        break
      case Syntax.String:
        this.writing.add(new FormulaStringElement(syntax[2]!))
        this.result += `<span class="nb-formula-string">${syntax[1]}</span>`
        break
      case Syntax.Operator: {
        if (syntax[1] === "!") {
          this.writing.add(new FormulaBangOperationElement())
        } else {
          this.writing.addOperation(
            new FormulaNormalOperationElement(syntax[1])
          )
        }
        this.result += `<span class="nb-formula-op">${syntax[1]}</span>`
        break
      }
      case Syntax.Function: {
        const name = syntax[2]!
        const element =
            name === "prop" || name === "props"
              ? new FormulaPropertyElement(this.template, name, this.curFieldID)
              : new FormulaFunctionElement(name)
        this.writing.add(element)
        this.result += `<span class="nb-formula-fn">${syntax[1]}</span>`
        break
      }
      case Syntax.GroupStart:
        this.writing.add(new FormulaGroupElement())
        this.result += "<span class=\"nb-formula-fn\">(</span>"
        break
      case Syntax.GroupEnd: {
        this.writing.handleCloser()
        this.result += "<span class=\"nb-formula-fn\">)</span>"
        break
      }
      case Syntax.NextArgument: {
        if (this.writing._handleComma()) throw "Invalid comma."
        this.result += "<span class=\"nb-formula-fn\">,</span>"
        break
      }
      case Syntax.EOF:
        this.code = ""
        break
      }

      this.code = this.code.substring(syntax[1].length)
      this.trimLeft()
    }
    this.writing.formulaResult
  }

  trimLeft() {
    const trimmed = this.code.trimLeft()
    const pad = this.code.length - trimmed.length
    if (pad) {
      this.result = this.result + this.code.slice(0, pad)
    }
    this.code = trimmed
  }
}

const interpretSyntax = (
  leftTrimmedCode: string
): [syntax: Syntax, value: string, sanitized?: string] => {
  switch (leftTrimmedCode[0]) {
  case Syntax.GroupStart:
    return [Syntax.GroupStart, Syntax.GroupStart]
  case Syntax.GroupEnd:
    return [Syntax.GroupEnd, Syntax.GroupEnd]
  case Syntax.NextArgument:
    return [Syntax.NextArgument, Syntax.NextArgument]
  default:
    break
  }

  let result = leftTrimmedCode.match(regexBool)
  if (result) return [Syntax.Bool, result[0]]

  result = leftTrimmedCode.match(regexNumber)
  if (result) return [Syntax.Number, result[0]]

  result = leftTrimmedCode.match(regexString)
  if (result) return [Syntax.String, result[0], result[1]]

  result = leftTrimmedCode.match(regexFunction)
  if (result) return [Syntax.Function, result[0], result[1]]

  result = leftTrimmedCode.match(regexEOF)
  if (result) return [Syntax.EOF, result[0]]

  let symbol = leftTrimmedCode.substring(0, 2)
  let operator = Operator.helpers[symbol]
  if (operator) return [Syntax.Operator, symbol]
  symbol = leftTrimmedCode.substring(0, 1)
  operator = Operator.helpers[symbol]
  if (operator) return [Syntax.Operator, symbol]

  throw "Unknown syntax."
}

const regexBool = /^(true|false)/
const regexNumber = /^-?\d+(\.\d+)?(e\+\d+|e-\d+)?/
const regexString = /^"([^"]+)"/
const regexFunction = /^([a-zA-Z0-9]+)\(/
const regexEOF = /^\s*$/

enum Syntax {
  GroupStart = "(",
  GroupEnd = ")",
  NextArgument = ",",
  Bool = "bool",
  Number = "number",
  String = "string",
  Function = "function",
  Operator = "operator",
  EOF = "EOF",
}
