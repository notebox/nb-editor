import {ReturnType} from "./types"

export type Helper = {
  name: string;
  priority: number;
  argCount: number;
  argType: ReturnType;
  returnType: ReturnType;
};

// 15
export const helpers: {[symbol: string]: Helper} = {
  "!": {
    name: "not",
    priority: 17,
    argCount: 1,
    argType: ReturnType.Bool,
    returnType: ReturnType.Bool,
  },
  "^": {
    name: "pow",
    priority: 16,
    argCount: 2,
    argType: ReturnType.Number,
    returnType: ReturnType.Number,
  },
  "*": {
    name: "multiply",
    priority: 15,
    argCount: 2,
    argType: ReturnType.Number,
    returnType: ReturnType.Number,
  },
  "/": {
    name: "divide",
    priority: 15,
    argCount: 2,
    argType: ReturnType.Number,
    returnType: ReturnType.Number,
  },
  "%": {
    name: "mod",
    priority: 15,
    argCount: 2,
    argType: ReturnType.Number,
    returnType: ReturnType.Number,
  },
  "+": {
    name: "add",
    priority: 14,
    argCount: 2,
    argType: ReturnType.Number,
    returnType: ReturnType.Number,
  },
  "-": {
    name: "subtract",
    priority: 14,
    argCount: 2,
    argType: ReturnType.Number,
    returnType: ReturnType.Number,
  },
  ">": {
    name: "greater",
    priority: 12,
    argCount: 2,
    argType: ReturnType.Any,
    returnType: ReturnType.Bool,
  },
  "<": {
    name: "less",
    priority: 12,
    argCount: 2,
    argType: ReturnType.Any,
    returnType: ReturnType.Bool,
  },
  ">=": {
    name: "notLess",
    priority: 12,
    argCount: 2,
    argType: ReturnType.Any,
    returnType: ReturnType.Bool,
  },
  "<=": {
    name: "notGreater",
    priority: 12,
    argCount: 2,
    argType: ReturnType.Any,
    returnType: ReturnType.Bool,
  },
  "==": {
    name: "equal",
    priority: 11,
    argCount: 2,
    argType: ReturnType.Any,
    returnType: ReturnType.Bool,
  },
  "!=": {
    name: "unequal",
    priority: 11,
    argCount: 2,
    argType: ReturnType.Any,
    returnType: ReturnType.Bool,
  },
  "&&": {
    name: "and",
    priority: 6,
    argCount: 2,
    argType: ReturnType.Bool,
    returnType: ReturnType.Bool,
  },
  "||": {
    name: "or",
    priority: 5,
    argCount: 2,
    argType: ReturnType.Bool,
    returnType: ReturnType.Bool,
  },
}
