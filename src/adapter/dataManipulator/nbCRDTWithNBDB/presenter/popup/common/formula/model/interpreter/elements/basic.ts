import {
  Encoded,
  ReturnType,
  FormulaElementType,
  FormulaElement,
  FormulaOperation,
  FormulaPolynomial,
} from "../../helper/types"

export class FormulaBoolElement implements FormulaElement {
  type = FormulaElementType.Bool
  needArguments = false
  value: boolean

  constructor(value: boolean) {
    this.value = value
  }

  returnType() {
    return ReturnType.Bool
  }
  stringify() {
    return String(this.value)
  }
  encode(): boolean {
    return this.value
  }
}

export class FormulaNumberElement implements FormulaElement {
  type = FormulaElementType.Number
  needArguments = false
  value: string

  constructor(value: string) {
    this.value = value
  }

  returnType() {
    return ReturnType.Number
  }
  stringify() {
    return this.value
  }
  encode(): Encoded {
    return ["N", this.value]
  }
}

export class FormulaStringElement implements FormulaElement {
  type = FormulaElementType.String
  needArguments = false
  value: string

  constructor(value: string) {
    this.value = value
  }

  returnType() {
    return ReturnType.String
  }
  stringify() {
    return `"${this.value}"`
  }
  encode(): string {
    return this.value
  }
}

export class Formula implements FormulaPolynomial {
  elements: FormulaElement[] = []
  operators: FormulaOperation[] = []

  private closed?: FormulaElement

  get isEmpty() {
    return !this.elements.length
  }

  get result() {
    return this.closed ?? this.close()
  }

  add(arg: FormulaElement) {
    if (this.elements.length !== this.operators.length)
      throw `[${arg.stringify}] need operators.`
    this.elements.push(arg)
  }
  addOperation(op: FormulaOperation) {
    if (this.elements.length === this.operators.length)
      throw `[${op.symbol}] need operands.`
    this.operators.push(op)
  }

  private close(): FormulaElement {
    if (this.closed) return this.closed
    if (this.elements.length === this.operators.length + 1) {
      this.closed = this.operators.length ? this.simplify() : this.elements[0]
      return this.closed
    }
    throw "Incomplete formula..."
  }

  private simplify(): FormulaElement {
    while (this.operators[0]) {
      const index = this.findNextOperatorIndex(this.operators)
      const operation = this.operators.splice(index, 1)[0]
      operation.add(this.elements.splice(index, 1)[0])
      operation.add(this.elements.splice(index, 1)[0])
      this.elements.splice(index, 0, operation)
    }
    return this.elements[0]
  }

  private findNextOperatorIndex(ops: FormulaOperation[]): number {
    let result = 0
    let priority = 0
    ops.forEach((op, index) => {
      if (op.priority > priority) {
        result = index
        priority = op.priority
      }
    })
    return result
  }
}
