import type {DBFormula, DBFormulaWithArgs} from "@/domain"

import {
  NBDBLabel,
  NBDBValue,
  NBDBBoolean,
  NBDBString,
  NBDBNumber,
  NBDBDate,
  NBDBValueType,
} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import dayjs from "dayjs"
import BN from "decimal.js"
import _ from "lodash"

export class FormulaEvaluator {
  evaluate = (data: DBFormula): NBDBValue => {
    return this.value(data)
  }

  N = (data: ["N", string]): NBDBNumber => {
    return NBDBNumber.fromFormula(data[1])
  }

  // constant
  pi = (): NBDBNumber => {
    return NBDBNumber.fromFormula(Math.PI)
  }

  e = (): NBDBNumber => {
    return NBDBNumber.fromFormula(Math.E)
  }

  // operator
  group = (data: DBFormulaWithArgs): NBDBValue => {
    return this.value(data[1])
  }

  not = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(!this.asBoolean(data[1]))
  };
  ["!"] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.not(data)
  }

  pow = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(
      this.asNumber(data[1]).pow(this.asNumber(data[2]))
    )
  };
  ["^"] = (data: DBFormulaWithArgs): NBDBNumber => {
    return this.pow(data)
  }

  add = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(
      data
        .slice(2)
        .reduce(
          (acc, cur) => acc.add(this.asNumber(cur)),
          this.asNumber(data[1])
        )
    )
  };
  ["+"] = (data: DBFormulaWithArgs): NBDBNumber => {
    return this.add(data)
  }

  subtract = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(
      data
        .slice(2)
        .reduce(
          (acc, cur) => acc.sub(this.asNumber(cur)),
          this.asNumber(data[1])
        )
    )
  };
  ["-"] = (data: DBFormulaWithArgs): NBDBNumber => {
    return this.subtract(data)
  }

  multiply = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(
      data
        .slice(2)
        .reduce(
          (acc, cur) => acc.times(this.asNumber(cur)),
          this.asNumber(data[1])
        )
    )
  };
  ["*"] = (data: DBFormulaWithArgs): NBDBNumber => {
    return this.multiply(data)
  }

  divide = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(
      data
        .slice(2)
        .reduce(
          (acc, cur) => acc.dividedBy(this.asNumber(cur)),
          this.asNumber(data[1])
        )
    )
  };
  ["/"] = (data: DBFormulaWithArgs): NBDBNumber => {
    return this.divide(data)
  }

  mod = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(
      data
        .slice(2)
        .reduce(
          (acc, cur) => acc.mod(this.asNumber(cur)),
          this.asNumber(data[1])
        )
    )
  };
  ["%"] = (data: DBFormulaWithArgs): NBDBNumber => {
    return this.mod(data)
  }

  greater = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(
      this.asNumber(data[1]).greaterThan(this.asNumber(data[2]))
    )
  };
  [">"] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.greater(data)
  }

  less = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(
      this.asNumber(data[1]).lessThan(this.asNumber(data[2]))
    )
  };
  ["<"] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.less(data)
  }

  notGreater = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(
      this.asNumber(data[1]).lessThanOrEqualTo(this.asNumber(data[2]))
    )
  };
  ["<="] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.notGreater(data)
  }

  notLess = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(
      this.asNumber(data[1]).greaterThanOrEqualTo(this.asNumber(data[2]))
    )
  };
  [">="] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.notLess(data)
  }

  equal = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(this.asBooleanIfEquals(data))
  };
  ["=="] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.equal(data)
  }

  unequal = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(!this.asBooleanIfEquals(data))
  };
  ["!="] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.unequal(data)
  }

  and = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(
      this.asBoolean(data[1]) && this.asBoolean(data[2])
    )
  };
  ["&&"] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.and(data)
  }

  or = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(
      this.asBoolean(data[1]) || this.asBoolean(data[2])
    )
  };
  ["||"] = (data: DBFormulaWithArgs): NBDBBoolean => {
    return this.or(data)
  }

  // function
  if = (data: DBFormulaWithArgs): NBDBValue => {
    return this.asBoolean(data[1]) ? this.value(data[2]) : this.value(data[3])
  }

  concat = (data: DBFormulaWithArgs): NBDBString => {
    return NBDBString.fromFormula(
      "".concat(...data.slice(1).map(this.asString))
    )
  }

  join = (data: DBFormulaWithArgs): NBDBString => {
    return NBDBString.fromFormula(
      data.slice(2).map(this.asString).join(this.asString(data[1]))
    )
  }

  substring = (data: DBFormulaWithArgs): NBDBString => {
    return NBDBString.fromFormula(
      this.asString(data[1]).substring(
        this.asNumber(data[2]).toNumber(),
        this.asNumber(data[3]).toNumber()
      )
    )
  }

  length = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asString(data[1]).length)
  }

  contains = (data: DBFormulaWithArgs): NBDBBoolean => {
    return NBDBBoolean.fromFormula(
      this.asString(data[1]).includes(this.asString(data[2]))
    )
  }

  replace = (data: DBFormulaWithArgs): NBDBString => {
    return NBDBString.fromFormula(
      this.asString(data[1]).replace(
        this.asString(data[2]),
        this.asString(data[3])
      )
    )
  }

  replaceAll = (data: DBFormulaWithArgs): NBDBString => {
    return NBDBString.fromFormula(
      this.asString(data[1]).replaceAll(
        this.asString(data[2]),
        this.asString(data[3])
      )
    )
  }

  abs = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).abs())
  }

  cbrt = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).cbrt())
  }

  ceil = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).ceil())
  }

  exp = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).exp())
  }

  floor = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).floor())
  }

  ln = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).ln())
  }

  log10 = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(BN.log10(this.asNumber(data[1])))
  }

  log2 = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(BN.log2(this.asNumber(data[1])))
  }

  max = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(BN.max(...data.slice(1).map(this.asNumber)))
  }

  min = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(BN.min(...data.slice(1).map(this.asNumber)))
  }

  round = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).round())
  }

  sqrt = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asNumber(data[1]).sqrt())
  }

  startDate = (data: DBFormulaWithArgs): NBDBDate => {
    const value = this.value(data[1])
    return NBDBDate.fromFormula(
      value.dataType === NBDBValueType.D && value.data
        ? (value as NBDBDate).data!.start
        : null
    )
  }

  endDate = (data: DBFormulaWithArgs): NBDBDate => {
    const value = this.value(data[1])
    return NBDBDate.fromFormula(
      value.dataType === NBDBValueType.D && value.data
        ? (value as NBDBDate).data!.end || null
        : null
    )
  }

  now = (): NBDBDate => {
    return NBDBDate.fromFormula(dayjs())
  }

  timestamp = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asDate(data[1])?.valueOf() ?? 0)
  }

  fromTimestamp = (data: DBFormulaWithArgs): NBDBDate => {
    return NBDBDate.fromFormula(dayjs(this.asNumber(data[1]).toNumber()))
  }

  dateAdd = (data: DBFormulaWithArgs): NBDBDate => {
    return NBDBDate.fromFormula(
      this.asDate(data[1])?.add(
        this.asNumber(data[2]).toNumber(),
        this.asString(data[3]) as dayjs.ManipulateType | undefined
      ) ?? null
    )
  }

  dateSubtract = (data: DBFormulaWithArgs): NBDBDate => {
    return NBDBDate.fromFormula(
      this.asDate(data[1])?.subtract(
        this.asNumber(data[2]).toNumber(),
        this.asString(data[3]) as dayjs.ManipulateType | undefined
      ) ?? null
    )
  }

  dateBetween = (data: DBFormulaWithArgs): NBDBNumber => {
    const a = this.asDate(data[1])
    if (!a) return NBDBNumber.fromFormula(0)
    const b = this.asDate(data[2])
    if (!b) return NBDBNumber.fromFormula(0)
    const unit = this.asString(data[3])
    if (!unit) return NBDBNumber.fromFormula(0)

    return NBDBNumber.fromFormula(a.diff(b, unit as DateUnit))
  }

  formatDate = (data: DBFormulaWithArgs): NBDBString => {
    return NBDBString.fromFormula(
      this.asDate(data[1])?.format(this.asString(data[2])) ?? ""
    )
  }

  minute = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asDate(data[1])?.minute() ?? 0)
  }

  hour = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asDate(data[1])?.hour() ?? 0)
  }

  day = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asDate(data[1])?.day() ?? 0)
  }

  date = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asDate(data[1])?.date() ?? 0)
  }

  month = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(1 + (this.asDate(data[1])?.month() ?? 0)) // ignore dayjs rules
  }

  year = (data: DBFormulaWithArgs): NBDBNumber => {
    return NBDBNumber.fromFormula(this.asDate(data[1])?.year() ?? 0)
  }

  private asBooleanIfEquals = (data: DBFormulaWithArgs): boolean => {
    const a = this.value(data[1])
    const b = this.value(data[2])

    if (a.dataType !== b.dataType) return false

    switch (a.dataType) {
    case NBDBValueType.B:
    case NBDBValueType.S:
      return a.data === b.data
    case NBDBValueType.D:
      return _.isEqual(a.data, b.data)
    case NBDBValueType.N:
      return (a.data as BN).equals(b.data as BN)
    case NBDBValueType.L: {
      const aLabels = a.data as NBDBLabel[]
      const bLabels = b.data as NBDBLabel[]
      if (aLabels.length !== bLabels.length) return false
      const bSet = new Set(bLabels) // should have same references
      return aLabels.every(label => bSet.has(label))
    }
    }
  }

  private asBoolean = (data: DBFormula): boolean => {
    return NBDBBoolean.toData(this.value(data))
  }

  private asNumber = (data: DBFormula): BN => {
    return NBDBNumber.toData(this.value(data))
  }

  private asString = (data: DBFormula): string => {
    return NBDBString.toData(this.value(data))
  }

  private asDate = (data: DBFormula): dayjs.Dayjs | null => {
    return NBDBDate.toData(this.value(data))
  }

  private value = (data: DBFormula): NBDBValue => {
    if (Array.isArray(data)) {
      if (data[0] === "FORMULA") {
        return this.value(data[1])
      }
      return (this as any)[data[0]](data)
    }
    switch (typeof data) {
    case "boolean":
      return NBDBBoolean.fromFormula(data)
    case "string":
      return NBDBString.fromFormula(data)
    }
  }
}

type DateUnit =
  | "year"
  | "quarter"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";
