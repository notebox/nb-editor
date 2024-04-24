export type DBFieldAggregationKey =
  /** @category common */
  | "count"
  | "countEmpty"
  | "countNotEmpty"
  | "percentEmpty"
  | "percentNotEmpty"
  /** @category date exclusive */
  | "countUnique"
  /** @category date and number exclusive */
  | "countTruthy"
  | "countFalsy"
  | "percentTruthy"
  | "percentFalsy"
  /** @category number */
  | "sum"
  | "average"
  | "median"
  | "min"
  | "max"
  | "range";

export type DBFormulaFunctionName = string;
