import type {NBDBTemplateField} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"

export enum FormulaReturnType {
  Bool = "bool",
  Date = "date",
  Number = "number",
  String = "string",
  Any = "any",
}

export type PredefinedSelectorSection = {
  title: string;
  keys: string[];
  map: {[key: string]: SelectorOption};
};

export type SelectorOption = {
  returnType: FormulaReturnType;
  name: string;
  value: string;
  description: string;
  syntax: string;
  example: string;
};

export const fnProp = (field: NBDBTemplateField): SelectorOption => {
  const value = `prop("${field.name}")`
  let returnType: FormulaReturnType
  let example: string
  switch (field.type) {
  case "VALUE":
  case "LABEL":
  case "LABELS":
    returnType = FormulaReturnType.String
    example = `contains(${value}, "some")`
    break
  case "BOOLEAN":
    returnType = FormulaReturnType.Bool
    example = `if(${value}, "sun", "moon")`
    break
  case "NUMBER":
    returnType = FormulaReturnType.Number
    example = `${value} == 108`
    break
  case "FORMULA":
    returnType = FormulaReturnType.Any
    example = `${value} * 8`
    break
  case "DATE":
    returnType = FormulaReturnType.Date
    example = `${value} < "2100-01-01"`
    break
  }

  return {
    returnType,
    name: field.name,
    value,
    description: `Returns the value of "${field.name}" field for each record.`,
    syntax: `prop(<span class="nb-formula-string">"${field.name}"</span>)`,
    example,
  }
}
export const fnConstants = ["pi", "e", "true", "false"]
export const fnOperators = [
  "not",
  "add",
  "subtract",
  "multiply",
  "divide",
  "pow",
  "mod",
  "greater",
  "less",
  "notLess",
  "notGreater",
  "equal",
  "unequal",
  "and",
  "or",
]
export const fnFunctions = [
  "if",
  "concat",
  "join",
  "substring",
  "length",
  "contains",
  "replace",
  "replaceAll",
  "abs",
  "cbrt",
  "ceil",
  "exp",
  "floor",
  "ln",
  "log10",
  "log2",
  "max",
  "min",
  "round",
  "sqrt",
  "startDate",
  "endDate",
  "now",
  "timestamp",
  "fromTimestamp",
  "dateAdd",
  "dateSubtract",
  "dateBetween",
  "formatDate",
  "minute",
  "hour",
  "day",
  "date",
  "month",
  "year",
]

export const fnConstant = {
  pi: {
    returnType: FormulaReturnType.Number,
    name: "pi",
    value: "pi()",
    description:
      "The <b><i>approximate</b></i> ratio of a circle's circumference to its diameter.",
    syntax: "pi()",
    example: "pi() == 3.141592653589793",
  },
  e: {
    returnType: FormulaReturnType.Number,
    name: "e",
    value: "e()",
    description: "The <b><i>approximate</b></i> base of the natural logarithm.",
    syntax: "e()",
    example: "e() == 2.718281828459045",
  },
  true: {
    returnType: FormulaReturnType.Bool,
    name: "true",
    value: "true",
    description: "Truthy value of boolean data.",
    syntax: "<span class=\"nb-formula-bool\">true</span>",
    example: "if(true, \"yes\", \"no\") == \"yes\"",
  },
  false: {
    returnType: FormulaReturnType.Bool,
    name: "false",
    value: "false",
    description: "Falsy value of boolean data.",
    syntax: "<span class=\"nb-formula-bool\">false</span>",
    example: "if(false, \"yes\", \"no\") == \"no\"",
  },
}

export const fnOperator = {
  not: {
    returnType: FormulaReturnType.Bool,
    name: "not",
    value: "not(",
    description: "Convert boolean to negated boolean.",
    syntax:
      "!<span class=\"nb-formula-bool\">boolean</span><br />not(<span class=\"nb-formula-bool\">boolean</span>)",
    example: "!true == false<br />not(false) == true",
  },
  add: {
    returnType: FormulaReturnType.Number,
    name: "add",
    value: "add(",
    description:
      "Adds two numbers and returns their sum, or concatenates two strings.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> + <span class=\"nb-formula-number\">number</span><br />add(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "3 + 5 == 8<br />add(3, 5) == 8",
  },
  subtract: {
    returnType: FormulaReturnType.Number,
    name: "subtract",
    value: "subtract(",
    description: "Subtracts two numbers and returns their difference.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> - <span class=\"nb-formula-number\">number</span><br />subtract(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "8 - 5 == 3<br />subtract(8, 5) == 3",
  },
  multiply: {
    returnType: FormulaReturnType.Number,
    name: "multiply",
    value: "multiply(",
    description: "Multiplies two numbers and returns their product.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> * <span class=\"nb-formula-number\">number</span><br />multiply(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "3 * 5 == 15<br />multiply(3, 5) == 15",
  },
  divide: {
    returnType: FormulaReturnType.Number,
    name: "divide",
    value: "divide(",
    description: "Divides two numbers and returns their quotient.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> * <span class=\"nb-formula-number\">number</span><br />divide(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "15 / 5 == 3<br />divide(15, 5) == 3",
  },
  pow: {
    returnType: FormulaReturnType.Number,
    name: "pow",
    value: "pow(",
    description: "Returns base to the exponent power.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> ^ <span class=\"nb-formula-number\">number</span><br />pow(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "5 ^ 3 == 125<br />pow(5, 3) == 125",
  },
  mod: {
    returnType: FormulaReturnType.Number,
    name: "mod",
    value: "mod(",
    description: "Divides two numbers and returns their remainder.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> % <span class=\"nb-formula-number\">number</span><br />mod(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "5 % 3 == 2<br />mod(5, 3) == 2",
  },
  greater: {
    returnType: FormulaReturnType.Bool,
    name: "greater",
    value: "greater(",
    description:
      "Returns true if the first argument is greater than the second.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> > <span class=\"nb-formula-number\">number</span><br />greater(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "5 > 3 == true<br />greater(5, 3) == true",
  },
  less: {
    returnType: FormulaReturnType.Bool,
    name: "less",
    value: "less(",
    description: "Returns true if the first argument is less than the second.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> < <span class=\"nb-formula-number\">number</span><br />less(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "5 < 3 == false<br />less(5, 3) == false",
  },
  notLess: {
    returnType: FormulaReturnType.Bool,
    name: "notLess",
    value: "notLess(",
    description:
      "Returns true if the first argument is not less than the second.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> >= <span class=\"nb-formula-number\">number</span><br />notLess(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "5 >= 3 == false<br />notLess(5, 3) == true",
  },
  notGreater: {
    returnType: FormulaReturnType.Bool,
    name: "notGreater",
    value: "notGreater(",
    description:
      "Returns true if the first argument is not greater than the second.",
    syntax:
      "<span class=\"nb-formula-number\">number</span> <= <span class=\"nb-formula-number\">number</span><br />notGreater(<span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "5 <= 3 == false<br />notGreater(5, 3) == false",
  },
  equal: {
    returnType: FormulaReturnType.Bool,
    name: "equal",
    value: "equal(",
    description: "Returns true if its arguments are equal.",
    syntax:
      "<i>value</i> == <i>value</i><br />equal(<i>value</i>, <i>value</i>)",
    example: "(3 * 5 == 15) == true<br />equal(3 * 5, 15) == true",
  },
  unequal: {
    returnType: FormulaReturnType.Bool,
    name: "unequal",
    value: "unequal(",
    description: "Returns true if its arguments are not equal.",
    syntax:
      "<i>value</i> != <i>value</i><br />unequal(<i>value</i>, <i>value</i>)",
    example: "(3 * 5 != 15) == false<br />unequal(3 * 5, 15) == false",
  },
  and: {
    returnType: FormulaReturnType.Bool,
    name: "and",
    value: "and(",
    description: "Returns the logical AND of its two arguments.",
    syntax:
      "<span class=\"nb-formula-bool\">boolean</span> && <span class=\"nb-formula-bool\">boolean</span><br />and(<span class=\"nb-formula-bool\">boolean</span>, <span class=\"nb-formula-bool\">boolean</span>)",
    example: "true && false == false<br />and(true, false) == false",
  },
  or: {
    returnType: FormulaReturnType.Bool,
    name: "or",
    value: "or(",
    description: "Returns the logical OR of its two arguments.",
    syntax:
      "<span class=\"nb-formula-bool\">boolean</span> || <span class=\"nb-formula-bool\">boolean</span><br />or(<span class=\"nb-formula-bool\">boolean</span>, <span class=\"nb-formula-bool\">boolean</span>)",
    example: "true || false == true<br />or(true, false) == true",
  },
}

export const fnFunction = {
  if: {
    returnType: FormulaReturnType.Any,
    name: "if",
    value: "if(",
    description:
      "Returns one of two values, depending on the evaluated boolean.",
    syntax:
      "if(<span class=\"nb-formula-bool\">boolean</span>, <i>if-true-value</i>, <i>if-false-value</i>)",
    example: "if(false, \"yes\", \"no\") == \"no\"",
  },
  concat: {
    returnType: FormulaReturnType.String,
    name: "concat",
    value: "concat(",
    description: "Concatenates its text arguments.",
    syntax: "concat(<span class=\"nb-formula-string\">text</span>...)",
    example: "concat(\"note\", \"box\", \"!\") == \"notebox!\"",
  },
  join: {
    returnType: FormulaReturnType.String,
    name: "join",
    value: "join(",
    description:
      "Inserts the first argument between the rest and returns their concatenation.",
    syntax: "join(<span class=\"nb-formula-string\">text</span>...)",
    example: "join(\"-\", \"a\", \"b\", \"c\") == \"a-b-c\"",
  },
  substring: {
    returnType: FormulaReturnType.String,
    name: "substring",
    value: "substring(",
    description:
      "Extracts a substring from a string from the start index (inclusively) to the end index (exclusively).",
    syntax:
      "substring(<span class=\"nb-formula-string\">text</span>, <span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-number\">number</span>)",
    example: "substring(\"notebox\", 3, 5) == \"eb\"",
  },
  length: {
    returnType: FormulaReturnType.Number,
    name: "length",
    value: "length(",
    description: "Returns the length of a string.",
    syntax: "length(<span class=\"nb-formula-string\">text</span>)",
    example: "length(\"notebox\") == 7",
  },
  contains: {
    returnType: FormulaReturnType.Bool,
    name: "contains",
    value: "contains(",
    description: "Returns true if the first argument contains the second.",
    syntax:
      "contains(<span class=\"nb-formula-string\">text</span>, <span class=\"nb-formula-string\">text</span>)",
    example: "contains(\"notebox\", \"box\") == true",
  },
  replace: {
    returnType: FormulaReturnType.String,
    name: "replace",
    value: "replace(",
    description: "Replaces the first match of text with a new text.",
    syntax:
      "replace(<span class=\"nb-formula-string\">text</span>, <span class=\"nb-formula-string\">text</span>, <span class=\"nb-formula-string\">text</span>)",
    example: "replace(\"a-b-c\", \"-\", \"+\") == \"a+b-c\"",
  },
  replaceAll: {
    returnType: FormulaReturnType.String,
    name: "replaceAll",
    value: "replaceAll(",
    description: "Replaces all matches of text with a new text.",
    syntax:
      "replaceAll(<span class=\"nb-formula-string\">text</span>, <span class=\"nb-formula-string\">text</span>, <span class=\"nb-formula-string\">text</span>)",
    example: "replace(\"a-b-c\", \"-\", \"+\") == \"a+b+c\"",
  },
  abs: {
    returnType: FormulaReturnType.Number,
    name: "abs",
    value: "abs(",
    description: "Returns the absolute value of a number.",
    syntax: "abs(<span class=\"nb-formula-number\">number</span>)",
    example: "abs(-9) == 9",
  },
  cbrt: {
    returnType: FormulaReturnType.Number,
    name: "cbrt",
    value: "cbrt(",
    description: "Returns the cube root of a number.",
    syntax: "cbrt(<span class=\"nb-formula-number\">number</span>)",
    example: "cbrt(8) == 2",
  },
  ceil: {
    returnType: FormulaReturnType.Number,
    name: "ceil",
    value: "ceil(",
    description:
      "Returns the smallest integer greater than or equal to a number.",
    syntax: "ceil(<span class=\"nb-formula-number\">number</span>)",
    example: "ceil(4.2) == 5",
  },
  exp: {
    returnType: FormulaReturnType.Number,
    name: "exp",
    value: "exp(",
    description:
      "Returns E^x, where x is the argument, and E is Euler's constant (2.718…), the base of the natural logarithm.",
    syntax: "exp(<span class=\"nb-formula-number\">number</span>)",
    example: "exp(1) == 2.718281828459045",
  },
  floor: {
    returnType: FormulaReturnType.Number,
    name: "floor",
    value: "floor(",
    description: "Returns the largest integer less than or equal to a number.",
    syntax: "floor(<span class=\"nb-formula-number\">number</span>)",
    example: "floor(3.9) == 3",
  },
  ln: {
    returnType: FormulaReturnType.Number,
    name: "ln",
    value: "ln(",
    description: "Returns the natural logarithm of a number.",
    syntax: "ln(<span class=\"nb-formula-number\">number</span>)",
    example: "ln(e) == 1",
  },
  log10: {
    returnType: FormulaReturnType.Number,
    name: "log10",
    value: "log10(",
    description: "Returns the base 10 logarithm of a number.",
    syntax: "log10(<span class=\"nb-formula-number\">number</span>)",
    example: "log10(1000) == 3",
  },
  log2: {
    returnType: FormulaReturnType.Number,
    name: "log2",
    value: "log2(",
    description: "Returns the base 2 logarithm of a number.",
    syntax: "log2(<span class=\"nb-formula-number\">number</span>)",
    example: "log2(512) == 9",
  },
  max: {
    returnType: FormulaReturnType.Number,
    name: "max",
    value: "max(",
    description: "Returns the largest of numbers.",
    syntax: "max(<span class=\"nb-formula-number\">number</span>...)",
    example: "max(5, 2, 9, 3) == 9",
  },
  min: {
    returnType: FormulaReturnType.Number,
    name: "min",
    value: "min(",
    description: "Returns the smallest of numbers.",
    syntax: "min(<span class=\"nb-formula-number\">number</span>...)",
    example: "min(4, 1, 5, 3) == 1",
  },
  round: {
    returnType: FormulaReturnType.Number,
    name: "round",
    value: "round(",
    description:
      "Returns the value of a number rounded to the nearest integer.",
    syntax: "round(<span class=\"nb-formula-number\">number</span>)",
    example: "round(3.4) == 3<br />round(3.5) == 4",
  },
  sqrt: {
    returnType: FormulaReturnType.Number,
    name: "sqrt",
    value: "sqrt(",
    description: "Returns the square root of a number.",
    syntax: "sqrt(<span class=\"nb-formula-number\">number</span>)",
    example: "sqrt(144) == 12",
  },
  startDate: {
    returnType: FormulaReturnType.Date,
    name: "startDate",
    value: "startDate(",
    description: "Returns the start of a date range.",
    syntax: "startDate(<span class=\"nb-formula-date\">date</span>)",
    example: "startDate(prop(\"Date\")) == \"May 9, 1987\"",
  },
  endDate: {
    returnType: FormulaReturnType.Date,
    name: "endDate",
    value: "endDate(",
    description: "Returns the end of a date range.",
    syntax: "endDate(<span class=\"nb-formula-date\">date</span>)",
    example: "endDate(prop(\"Date\")) == \"May 9, 1987\"",
  },
  now: {
    returnType: FormulaReturnType.Date,
    name: "now",
    value: "now()",
    description: "Returns the current date and time.",
    syntax: "now()",
    example: "now() == \"2022-01-04T21:54\"",
  },
  timestamp: {
    returnType: FormulaReturnType.Number,
    name: "timestamp",
    value: "timestamp(",
    description:
      "Returns an integer number from a Unix millisecond timestamp, corresponding to the number of milliseconds since January 1, 1970.",
    syntax: "timestamp(<span class=\"nb-formula-date\">date</span>)",
    example: "timestamp(now()) == 1641300863123",
  },
  fromTimestamp: {
    returnType: FormulaReturnType.Date,
    name: "fromTimestamp",
    value: "fromTimestamp(",
    description:
      "Returns a date constructed from a Unix millisecond timestamp, corresponding to the number of milliseconds since January 1, 1970.",
    syntax: "fromTimestamp(<span class=\"nb-formula-number\">number</span>)",
    example: "fromTimestamp(1641300863123) == \"2022-01-04T21:54\"",
  },
  dateAdd: {
    returnType: FormulaReturnType.Date,
    name: "dateAdd",
    value: "dateAdd(",
    description:
      "Add to a date. The last argument, unit, can be one of: \"year\", \"month\", \"week\", \"day\", \"hour\", or \"minute\".",
    syntax:
      "dateAdd(<span class=\"nb-formula-date\">date</span>, <span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-string\">text</span>)",
    example:
      "dateAdd(date, 3, \"year\")<br />dateAdd(date, 3, \"month\")<br />dateAdd(date, 3, \"week\")<br />dateAdd(date, 3, \"day\")<br />dateAdd(date, 3, \"hour\")<br />dateAdd(date, 3, \"minute\")",
  },
  dateSubtract: {
    returnType: FormulaReturnType.Date,
    name: "dateSubtract",
    value: "dateSubtract(",
    description:
      "Subtract from a date. The last argument, unit, can be one of: \"year\", \"month\", \"week\", \"day\", \"hour\", or \"minute\".",
    syntax:
      "dateSubtract(<span class=\"nb-formula-date\">date</span>, <span class=\"nb-formula-number\">number</span>, <span class=\"nb-formula-string\">text</span>)",
    example:
      "dateSubtract(date, 3, \"year\")<br />dateSubtract(date, 3, \"month\")<br />dateSubtract(date, 3, \"week\")<br />dateSubtract(date, 3, \"day\")<br />dateSubtract(date, 3, \"hour\")<br />dateSubtract(date, 3, \"minute\")",
  },
  dateBetween: {
    returnType: FormulaReturnType.Number,
    name: "dateBetween",
    value: "dateBetween(",
    description:
      "Returns the time between two dates. The last argument, unit, can be one of: \"year\", \"month\", \"week\", \"day\", \"hour\", or \"minute\".",
    syntax:
      "dateBetween(<span class=\"nb-formula-date\">date</span>, <span class=\"nb-formula-date\">date</span>, <span class=\"nb-formula-string\">text</span>)",
    example:
      "dateBetween(date, date2, \"year\")<br />dateBetween(date, date2, \"month\")<br />dateBetween(date, date2, \"week\")<br />dateBetween(date, date2, \"day\")<br />dateBetween(date, date2, \"hour\")<br />dateBetween(date, date2, \"minute\")",
  },
  formatDate: {
    returnType: FormulaReturnType.String,
    name: "formatDate",
    value: "formatDate(",
    description: "Format a date using standard time format string.",
    syntax:
      "formatDate(<span class=\"nb-formula-date\">date</span>, <span class=\"nb-formula-string\">text</span>)",
    example:
      "formatDate(now(), \"MMMM D YYYY, HH:mm\") == \"Jan 4, 2022, 21:54\"<br />formatDate(now(), \"YYYY/MM/DD, HH:mm\") == \"2022/01/04, 21:54\"<br />formatDate(now(), \"MM/DD/YYYY, HH:mm\") == \"01/04/2022, 21:54\"<br />formatDate(now(), \"hh:mm A\") == \"09:54 PM\"<br />formatDate(now(), \"M/D/YY\") == \"1/4/22\"",
  },
  minute: {
    returnType: FormulaReturnType.Number,
    name: "minute",
    value: "minute(",
    description:
      "Returns an integer number, between 0 and 59, corresponding to minutes in the given date.",
    syntax: "minute(<span class=\"nb-formula-date\">date</span>)",
    example: "minute(now()) == 54",
  },
  hour: {
    returnType: FormulaReturnType.Number,
    name: "hour",
    value: "hour(",
    description:
      "Returns an integer number, between 0 and 23, corresponding to hour for the given date.",
    syntax: "hour(<span class=\"nb-formula-date\">date</span>)",
    example: "hour(now()) == 21",
  },
  day: {
    returnType: FormulaReturnType.Number,
    name: "day",
    value: "day(",
    description:
      "Returns an integer number corresponding to the day of the week for the given date: 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on.",
    syntax: "day(<span class=\"nb-formula-date\">date</span>)",
    example: "day(now()) == 2",
  },
  date: {
    returnType: FormulaReturnType.Number,
    name: "date",
    value: "date(",
    description:
      "Returns an integer number, between 1 and 31, corresponding to day of the month for the given.",
    syntax: "date(<span class=\"nb-formula-date\">date</span>)",
    example: "date(now()) == 4",
  },
  month: {
    returnType: FormulaReturnType.Number,
    name: "month",
    value: "month(",
    description: "Returns an integer number, between 1 and 12.",
    syntax: "month(<span class=\"nb-formula-date\">date</span>)",
    example: "month(now()) == 12",
  },
  year: {
    returnType: FormulaReturnType.Number,
    name: "year",
    value: "year(",
    description:
      "Returns a number corresponding to the year of the given date.",
    syntax: "year(<span class=\"nb-formula-date\">date</span>)",
    example: "year(now()) == 2022",
  },
}

export const predefinedSelectorSection: PredefinedSelectorSection[] = [
  {
    title: "Constants",
    keys: fnConstants,
    map: fnConstant,
  },
  {
    title: "Operators",
    keys: fnOperators,
    map: fnOperator,
  },
  {
    title: "Functions",
    keys: fnFunctions,
    map: fnFunction,
  },
]
