import type {DBFormula} from "@/domain/entity"

export type OperatorSymbol = string;
export enum ReturnType {
  Bool = "bool",
  Date = "date",
  Number = "number",
  String = "string",
  Any = "any",
}

export enum FormulaElementType {
  Bool = "bool",
  Number = "number",
  String = "string",
  Group = "group",
  Function = "function",
  Operation = "operation",
}

export type Encoded = DBFormula;

export interface FormulaElement {
  type: FormulaElementType;
  needArguments: boolean;
  returnType: () => ReturnType;
  stringify: () => string;
  encode: () => Encoded;
}

export type FormulaOperation = FormulaElementWithArguments & {
  type: FormulaElementType.Operation;
  symbol: OperatorSymbol;
  priority: number;
};

export interface FormulaWritable {
  add: (arg: FormulaElement) => void;
  addOperation: (op: FormulaOperation) => void;
}

export interface FormulaPolynomial extends FormulaWritable {
  isEmpty: boolean;
}

export interface FormulaElementWithArguments
  extends FormulaElement,
    FormulaWritable {
  closed: boolean;
  handleComma: () => void;
  handleCloser: () => void;
}

export const isFormulaElementWithArguments = (
  el: FormulaElement
): el is FormulaElementWithArguments => {
  return el.needArguments
}
