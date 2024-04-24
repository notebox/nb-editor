import type {TextPropsContent, DBDataValue, DBDateRange, DBFieldID, DBFieldType} from "@/domain"
import type {NBDBLabelMap, NBDBLabel} from "./label"

import {isDateDataType, isLabelsDataType} from "@/domain"
import {sortLabels} from "./label"
import BN from "decimal.js"
import dayjs from "dayjs"

export enum NBDBValueType {
  B = "BOOLEAN",
  S = "STRING",
  N = "NUMBER",
  D = "DATE",
  L = "LABELS",
}

export type NBDBValue = {isError?: true} & (
  | NBDBBoolean
  | NBDBString
  | NBDBNumber
  | NBDBDate
  | NBDBLabels
);

export type NBDBEvaluatedValue = {
  fieldID: DBFieldID;
  fieldType: DBFieldType;
  format?: TextPropsContent;
  value: NBDBValue;
};

interface NBDBValueInterface {
  dataType: NBDBValueType;
  calculated: boolean;
  isError?: true;
  B: boolean;
  S: string;
  D: DBDateRange | null;
  L: NBDBLabel[];
}

export class NBDBBoolean implements NBDBValueInterface {
  calculated: boolean

  dataType = NBDBValueType.B
  data: boolean

  S!: string
  D!: DBDateRange | null
  L!: NBDBLabel[]
  get B() {
    return this.data
  }

  private constructor(data: boolean, calculated: boolean) {
    this.calculated = calculated
    this.data = data
  }

  static fromDB(rawValue: DBDataValue | undefined) {
    return new NBDBBoolean(rawValue === true ? true : false, false)
  }

  static fromFormula(data: boolean) {
    return new NBDBBoolean(data, true)
  }

  static toData(value: NBDBValue): boolean {
    switch (value.dataType) {
    case NBDBValueType.B:
      return (value as NBDBBoolean).data
    case NBDBValueType.S:
    case NBDBValueType.D:
      return !!value.data
    case NBDBValueType.N:
      return !(value.data as BN).equals(0)
    case NBDBValueType.L:
      return !!(value.data as NBDBLabel[]).length
    }
  }
}

export class NBDBString implements NBDBValueInterface {
  calculated: boolean

  dataType = NBDBValueType.S
  data: string
  isError?: true

  B!: boolean
  D!: DBDateRange | null
  L!: NBDBLabel[]
  get S() {
    return this.data
  }

  private constructor(data: string, calculated: boolean) {
    this.calculated = calculated
    this.data = data
  }

  static fromDB(rawValue: DBDataValue | undefined) {
    return new NBDBString(typeof rawValue === "string" ? rawValue : "", false)
  }

  static fromFormula(data: string) {
    return new NBDBString(data, true)
  }

  static toData(value: NBDBValue): string {
    switch (value.dataType) {
    case NBDBValueType.S:
      return (value as NBDBString).data
    case NBDBValueType.B:
      return (value as NBDBBoolean).data.toString()
    case NBDBValueType.D:
      return (value as NBDBDate).data?.start.format("YYYY-MM-DDTHH:mm") || ""
    case NBDBValueType.N:
      return (value as NBDBNumber).data.toString()
    case NBDBValueType.L:
      return (value as NBDBLabels).data.map(label => label.name).join(", ")
    }
  }

  static asError(message: string): NBDBString {
    const result = NBDBString.fromFormula(message)
    result.isError = true
    return result
  }
}

export class NBDBNumber implements NBDBValueInterface {
  calculated: boolean

  dataType = NBDBValueType.N
  data: BN

  B!: boolean
  D!: DBDateRange | null
  L!: NBDBLabel[]
  get S() {
    if (this._string === undefined) {
      this._string = this.data.toString()
    }
    return this._string
  }
  private _string?: string

  private constructor(data: BN, calculated: boolean) {
    this.data = data
    this.calculated = calculated
  }

  static fromDB = (rawValue: DBDataValue | undefined): NBDBNumber => {
    try {
      return new NBDBNumber(
        typeof rawValue === "string" ? new BN(rawValue) : new BN(0),
        false
      )
    } catch {
      return new NBDBNumber(new BN(0), false)
    }
  }

  static fromFormula = (numberable: BN | string | number): NBDBNumber => {
    if (BN.isDecimal(numberable)) return new NBDBNumber(numberable as BN, true)
    try {
      return new NBDBNumber(new BN(numberable), true)
    } catch {
      return new NBDBNumber(new BN(0), true)
    }
  }

  static toData(value: NBDBValue): BN {
    try {
      switch (value.dataType) {
      case NBDBValueType.N:
        return (value as NBDBNumber).data
      case NBDBValueType.B:
        return new BN((value as NBDBBoolean).data ? 1 : 0)
      case NBDBValueType.D:
        return new BN((value as NBDBDate).data?.start.unix() ?? 0)
      case NBDBValueType.S:
        return new BN((value as NBDBString).data)
      case NBDBValueType.L:
        return new BN((value as NBDBLabels).data.length)
      }
    } catch {
      return new BN(0)
    }
  }
}

type NBDBDateData = {
  start: dayjs.Dayjs;
  end?: dayjs.Dayjs;
  time?: boolean;
} | null;
export class NBDBDate implements NBDBValueInterface {
  calculated: boolean

  dataType = NBDBValueType.D
  data: NBDBDateData

  B!: boolean
  S!: string
  L!: NBDBLabel[]
  get D() {
    if (this._range === undefined) {
      this._range =
        this.data &&
        ({
          start: this.data.start.format(),
          end: this.data.end?.format(),
          time: this.data.time,
        } as DBDateRange)
    }
    return this._range
  }
  _range?: DBDateRange | null

  private constructor(data: NBDBDateData, calculated: boolean) {
    this.data = data
    this.calculated = calculated
  }

  static fromDB = (rawValue: DBDataValue | undefined): NBDBDate => {
    if (isDateDataType(rawValue)) {
      return new NBDBDate(
        {
          start: dayjs(rawValue[1].start),
          end: rawValue[1].end && dayjs(rawValue[1].end),
          time: rawValue[1].time,
        },
        false
      )
    } else {
      return new NBDBDate(null, false)
    }
  }

  static fromFormula = (
    data: dayjs.Dayjs | string | number | null
  ): NBDBDate => {
    if (dayjs.isDayjs(data)) return new NBDBDate({start: data}, true)
    try {
      return new NBDBDate(data === null ? data : {start: dayjs(data)}, true)
    } catch {
      return new NBDBDate(null, true)
    }
  }

  static toData(value: NBDBValue): dayjs.Dayjs | null {
    switch (value.dataType) {
    case NBDBValueType.D:
      return value.data ? (value as NBDBDate).data!.start : null
    case NBDBValueType.N:
      return dayjs((value as NBDBNumber).data.toNumber())
    case NBDBValueType.S:
      return dayjs((value as NBDBString).data)
    case NBDBValueType.B:
    case NBDBValueType.L:
      return null
    }
  }
}

export class NBDBLabels implements NBDBValueInterface {
  calculated: boolean

  dataType = NBDBValueType.L
  data: NBDBLabel[]

  B!: boolean
  S!: string
  D!: DBDateRange | null
  get L() {
    return this.data
  }

  private constructor(
    data: NBDBLabel[],
    multiple: boolean,
    calculated: boolean
  ) {
    this.data = multiple ? data : data.length > 1 ? [data[0]] : data
    this.calculated = calculated
  }

  static fromDB = (
    rawValue: DBDataValue | undefined,
    multiple: boolean,
    labelMap?: NBDBLabelMap
  ): NBDBLabels => {
    if (rawValue && isLabelsDataType(rawValue) && labelMap) {
      const data = rawValue[1].reduce<NBDBLabel[]>((acc, cur) => {
        const label = labelMap[cur]
        if (label) {
          acc.push(label)
        }
        return acc
      }, [])
      return new NBDBLabels(sortLabels(data), multiple, false)
    }
    return new NBDBLabels([], multiple, false)
  }
}
