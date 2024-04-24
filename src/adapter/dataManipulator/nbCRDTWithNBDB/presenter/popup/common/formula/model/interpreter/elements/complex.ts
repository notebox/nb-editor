import type {DBFieldID} from "@/domain/entity"
import type {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"
import type {FormulaStringElement} from "./basic"
import type {OperatorSymbol} from "../../helper/types"

import {
  Encoded,
  ReturnType,
  FormulaElementType,
  FormulaElementWithArguments,
  FormulaElement,
  FormulaOperation,
  isFormulaElementWithArguments,
} from "../../helper/types"
import * as Operator from "../../helper/operator"
import * as Function from "../../helper/function"
import {Formula} from "./basic"

export class CommonFormulaElementWithArguments {
  readonly needArguments = true
  formula = new Formula()
  closed = false

  get formulaResult() {
    if (this.pending) throw "Incomplete formula..."
    return this.formula.result
  }

  get hasPendingArgument() {
    return !this.pending && this.formula.isEmpty
  }

  private pending?: FormulaElementWithArguments

  add(arg: FormulaElement) {
    if (this.pending) {
      this.pending.add(arg)
      return
    }
    if (isFormulaElementWithArguments(arg)) {
      this.pending = arg
      return
    }
    this.formula.add(arg)
  }
  addOperation(op: FormulaOperation) {
    (this.pending ?? this.formula).addOperation(op)
  }
  handleCloser() {
    if (this.pending) {
      this.pending.handleCloser()
      if (this.pending.closed) {
        this.formula.add(this.pending)
        delete this.pending
      }
      return
    }
    if (this.closed) throw "Too many [)]."
    this.closed = true
  }
  _handleComma(): FormulaElement | null {
    if (this.pending) {
      this.pending.handleComma()
      return null
    }
    const arg = this.formula.result
    this.formula = new Formula()
    return arg
  }
}

export class FormulaGroupElement
  extends CommonFormulaElementWithArguments
  implements FormulaElementWithArguments
{
  type = FormulaElementType.Group

  returnType() {
    return this.formulaResult.returnType()
  }
  stringify() {
    return `(${this.formulaResult.stringify()})`
  }
  encode(): Encoded {
    switch (this.formulaResult.type) {
    case FormulaElementType.Operation:
      return ["group", this.formulaResult.encode()]
    default:
      return this.formulaResult.encode()
    }
  }
  handleComma() {
    if (super._handleComma()) throw "[()] should have only one argument."
  }
  handleCloser() {
    super.handleCloser()
    if (!this.closed) return
    if (this.formulaResult.type !== FormulaElementType.Operation)
      throw "[()] are overused."
  }
}

export class FormulaBangOperationElement
  extends CommonFormulaElementWithArguments
  implements FormulaOperation
{
  readonly type = FormulaElementType.Operation

  readonly symbol: OperatorSymbol
  readonly operator: Operator.Helper
  get priority() {
    return this.operator.priority
  }

  constructor() {
    super()
    const symbol = "!"
    this.symbol = symbol
    this.operator = Operator.helpers[symbol]
  }

  returnType() {
    return this.operator.returnType
  }
  stringify() {
    return `!${this.formulaResult.stringify()}`
  }
  encode(): [string, Encoded] {
    return [this.symbol, this.formulaResult.encode()]
  }
  handleComma() {
    if (super._handleComma()) throw "[!] should have only one operand."
  }
  handleCloser() {
    super.handleCloser()
    if (!this.closed) return
    throw "[!] cannot have [)]."
  }
}

export class FormulaNormalOperationElement implements FormulaOperation {
  readonly type = FormulaElementType.Operation
  readonly needArguments = true

  readonly symbol: OperatorSymbol
  readonly operator: Operator.Helper
  get priority() {
    return this.operator.priority
  }
  closed = false

  private args: FormulaElement[] = []

  constructor(symbol: OperatorSymbol) {
    this.symbol = symbol
    this.operator = Operator.helpers[symbol]
  }

  returnType() {
    return this.operator.returnType
  }
  stringify() {
    if (this.symbol === "^") {
      return `${this.args[0].stringify()}^${this.args[1].stringify()}`
    } else {
      return `${this.args[0].stringify()} ${
        this.symbol
      } ${this.args[1].stringify()}`
    }
  }
  encode(): [string, ...Encoded[]] {
    return [this.symbol, ...this.args.map(arg => arg.encode())]
  }
  add(arg: FormulaElement) {
    if (this.args.length >= this.operator.argCount) {
      throw `[${this.symbol}] has too many operands.`
    }
    if (!validateType(this.operator.argType, arg.returnType())) {
      throw `[${this.symbol}] only accepts [${
        this.operator.argType
      }] type, but the type of [${arg.stringify()}] is [${arg.returnType()}].`
    }
    this.args.push(arg)
    if (this.args.length == this.operator.argCount) {
      this.closed = true
    }
  }
  addOperation(_: FormulaOperation) {
    throw `Developer error on [${this.symbol}] with operation.`
  }
  handleComma() {
    throw `Developer error on [${this.symbol}] with commas.`
  }
  handleCloser() {
    throw `Developer error on [${this.symbol}] with closer.`
  }
}

export class FormulaFunctionElement
  extends CommonFormulaElementWithArguments
  implements FormulaElementWithArguments
{
  readonly type = FormulaElementType.Function

  readonly name: Function.Name
  readonly fn: Function.Helper

  args: FormulaElement[] = []
  closed = false

  constructor(name: Function.Name) {
    super()
    this.name = name
    this.fn = Function.helpers[name]
    if (!this.fn) throw `Unknown function [${name}]`
  }

  returnType() {
    return this.fn.returnType
  }
  stringify() {
    return `${this.name}(${this.args.map(arg => arg.stringify()).join(", ")})`
  }
  encode(): [string, ...Encoded[]] {
    return [this.name, ...this.args.map(arg => arg.encode())]
  }

  handleComma() {
    const arg = super._handleComma()
    if (!arg) return
    this.addArgument(arg)
  }
  handleCloser() {
    super.handleCloser()
    if (!this.closed) return
    if (!this.hasPendingArgument) {
      this.addArgument(this.formulaResult)
    }
    if (this.args.length < this.fn.args.length)
      throw `[${this.name}] has not enough arguments.`
  }
  private addArgument(arg: FormulaElement) {
    validateArg(this.name, this.fn, this.args.length, arg)
    this.args.push(arg)
  }
}

export class FormulaPropertyElement
  extends CommonFormulaElementWithArguments
  implements FormulaElementWithArguments
{
  readonly type = FormulaElementType.Function

  readonly name: Function.Name
  readonly fn: Function.Helper

  template: NBDBTemplate
  curFieldID?: DBFieldID

  fieldID?: DBFieldID
  fieldName?: string

  constructor(template: NBDBTemplate, name: string, curFieldID?: DBFieldID) {
    super()
    this.template = template
    this.curFieldID = curFieldID
    this.name = name
    this.fn = Function.helpers[name]
  }

  returnType() {
    return this.fn.returnType
  }
  stringify() {
    return `${this.name}(${this.fieldName})})`
  }
  encode(): [string, ...Encoded[]] {
    return [this.name, this.fieldID ?? ""]
  }

  handleComma() {
    if (super._handleComma())
      throw `[${this.name}] should have only one argument.`
  }
  handleCloser() {
    super.handleCloser()
    if (!this.closed) return
    const arg = this.formulaResult
    validateArg(this.name, this.fn, this.fieldID ? 1 : 0, arg)
    if (!this.isFormulaStringElement(arg))
      throw `Developer error on [${this.name}].`

    const value = arg.encode()
    const field =
      this.template.fieldMap[value] ||
      this.template.allFields.find(field => field.name === value)
    if (!field) throw `There is no field for [${this.name}(${value})].`
    if (field.fieldID === this.curFieldID)
      throw `[${this.name}(${value})] is a circular reference to itself.`
    this.fieldID = field.fieldID
    this.fieldName = field.name
  }
  isFormulaStringElement(arg: FormulaElement): arg is FormulaStringElement {
    return arg.type === FormulaElementType.String
  }
}

const validateType = (a: ReturnType, b: ReturnType): boolean => {
  if (a === ReturnType.Any || b === ReturnType.Any) return true
  return a == b
}

const validateArg = (
  name: string,
  helper: Function.Helper,
  curArgsLength: number,
  arg: FormulaElement
): void => {
  if (helper.argsLimit && curArgsLength >= helper.args.length) {
    throw `[${name}] has too many arguments.`
  }
  const validType =
    helper.args[curArgsLength] ?? helper.args[helper.args.length - 1]
  if (!validateType(validType, arg.returnType())) {
    throw `The ${
      curArgsLength + 1
    }-th argument type of [${name}] should be [${validType}] type, but the type of [${arg.stringify()}] is [${arg.returnType()}]`
  }
}
