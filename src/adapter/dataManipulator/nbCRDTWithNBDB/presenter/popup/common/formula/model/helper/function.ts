import {ReturnType} from "./types"

export type Name = string;
export type Helper = {
  args: ReturnType[];
  argsLimit: boolean;
  returnType: ReturnType;
};

export const helpers: {[name: Name]: Helper} = {
  // Conditional
  if: {
    returnType: ReturnType.Any,
    args: [ReturnType.Bool, ReturnType.Any, ReturnType.Any],
    argsLimit: true,
  },
  // Property
  prop: {
    returnType: ReturnType.Any,
    args: [ReturnType.String],
    argsLimit: true,
  },
  props: {
    returnType: ReturnType.Any,
    args: [ReturnType.String],
    argsLimit: true,
  },
  // Operator
  not: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Bool],
    argsLimit: true,
  },
  pow: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number, ReturnType.Number],
    argsLimit: true,
  },
  multiply: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number, ReturnType.Number],
    argsLimit: false,
  },
  divide: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number, ReturnType.Number],
    argsLimit: false,
  },
  mod: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number, ReturnType.Number],
    argsLimit: false,
  },
  add: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number, ReturnType.Number],
    argsLimit: false,
  },
  subtract: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number, ReturnType.Number],
    argsLimit: false,
  },
  greater: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Any, ReturnType.Any],
    argsLimit: true,
  },
  less: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Any, ReturnType.Any],
    argsLimit: true,
  },
  notLess: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Any, ReturnType.Any],
    argsLimit: true,
  },
  notGreater: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Any, ReturnType.Any],
    argsLimit: true,
  },
  equal: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Any, ReturnType.Any],
    argsLimit: true,
  },
  unequal: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Any, ReturnType.Any],
    argsLimit: true,
  },
  and: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Bool, ReturnType.Bool],
    argsLimit: true,
  },
  or: {
    returnType: ReturnType.Bool,
    args: [ReturnType.Bool, ReturnType.Bool],
    argsLimit: true,
  },
  // Constant
  pi: {returnType: ReturnType.Number, args: [], argsLimit: true},
  e: {returnType: ReturnType.Number, args: [], argsLimit: true},
  // String
  concat: {
    returnType: ReturnType.String,
    args: [ReturnType.String],
    argsLimit: false,
  },
  join: {
    returnType: ReturnType.String,
    args: [ReturnType.String],
    argsLimit: false,
  },
  substring: {
    returnType: ReturnType.String,
    args: [ReturnType.String, ReturnType.Number, ReturnType.Number],
    argsLimit: true,
  },
  length: {
    returnType: ReturnType.Number,
    args: [ReturnType.String],
    argsLimit: true,
  },
  contains: {
    returnType: ReturnType.Bool,
    args: [ReturnType.String, ReturnType.String],
    argsLimit: true,
  },
  replace: {
    returnType: ReturnType.String,
    args: [ReturnType.String, ReturnType.String, ReturnType.String],
    argsLimit: true,
  },
  replaceAll: {
    returnType: ReturnType.String,
    args: [ReturnType.String, ReturnType.String, ReturnType.String],
    argsLimit: true,
  },
  // Number
  abs: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  cbrt: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  ceil: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  exp: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  floor: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  ln: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  log10: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  log2: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  max: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: false,
  },
  min: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: false,
  },
  round: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  sqrt: {
    returnType: ReturnType.Number,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  // Date
  startDate: {
    returnType: ReturnType.Date,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  endDate: {
    returnType: ReturnType.Date,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  now: {returnType: ReturnType.Date, args: [], argsLimit: true},
  timestamp: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  fromTimestamp: {
    returnType: ReturnType.Date,
    args: [ReturnType.Number],
    argsLimit: true,
  },
  dateAdd: {
    returnType: ReturnType.Date,
    args: [ReturnType.Date, ReturnType.Number, ReturnType.String],
    argsLimit: true,
  },
  dateSubtract: {
    returnType: ReturnType.Date,
    args: [ReturnType.Date, ReturnType.Number, ReturnType.String],
    argsLimit: true,
  },
  dateBetween: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date, ReturnType.Date, ReturnType.String],
    argsLimit: true,
  },
  formatDate: {
    returnType: ReturnType.String,
    args: [ReturnType.Date, ReturnType.String],
    argsLimit: true,
  },
  minute: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  hour: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  day: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  date: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  month: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date],
    argsLimit: true,
  },
  year: {
    returnType: ReturnType.Number,
    args: [ReturnType.Date],
    argsLimit: true,
  },
}
