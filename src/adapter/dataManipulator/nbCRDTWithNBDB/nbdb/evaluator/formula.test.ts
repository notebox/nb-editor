import {NBDBDate, NBDBString} from "@/adapter/dataManipulator/nbCRDTWithNBDB/nbdb"
import {stateData} from "@/demo/basics"
import {testDI} from "@/test/di"
import {FormulaEvaluator} from "./formula"

describe("formula evaluator", () => {
  let subject!: FormulaEvaluator

  beforeAll(() => {
    testDI(stateData)
    subject = new FormulaEvaluator()
  })

  describe("constant", () => {
    it("pi", () => {
      expect(subject.pi().S).toBe("3.141592653589793")
    })

    it("e", () => {
      expect(subject.e().S).toBe("2.718281828459045")
    })

    it("not", () => {
      expect(subject.not(["not", true]).B).toBe(false)
      expect(subject.not(["not", false]).B).toBe(true)
      expect(subject.not(["not", " "]).B).toBe(false)
      expect(subject.not(["not", ""]).B).toBe(true)
    })

    it("pow", () => {
      expect(subject.pow(["pow", "2", "3"]).S).toBe("8")
    })

    it("add", () => {
      expect(subject.add(["", "2", "7"]).S).toBe("9")
      expect(subject.add(["", "2"]).S).toBe("2")
      expect(subject.add(["", "2", true]).S).toBe("3")
      expect(subject.add(["", "2", false]).S).toBe("2")
    })

    it("subtract", () => {
      expect(subject.subtract(["", "2", "7"]).S).toBe("-5")
    })

    it("multiply", () => {
      expect(subject.multiply(["", "2", "3"]).S).toBe("6")
    })

    it("divide", () => {
      expect(subject.divide(["", "6", "3"]).S).toBe("2")
    })

    it("mod", () => {
      expect(subject.mod(["", "7", "5"]).S).toBe("2")
    })

    it("greater", () => {
      expect(subject.greater(["", "7", "6"]).B).toBe(true)
      expect(subject.greater(["", "7", "7"]).B).toBe(false)
      expect(subject.greater(["", "7", "8"]).B).toBe(false)
      // expect(subject.greater(['', 'b', 'a'])).toBe(true);
      // expect(subject.greater(['', 'b', 'b'])).toBe(false);
      // expect(subject.greater(['', 'b', 'c'])).toBe(false);
    })

    it("less", () => {
      expect(subject.less(["", "6", "7"]).B).toBe(true)
      expect(subject.less(["", "7", "7"]).B).toBe(false)
      expect(subject.less(["", "8", "7"]).B).toBe(false)
    })

    it("notGreater", () => {
      expect(subject.notGreater(["", "7", "6"]).B).toBe(false)
      expect(subject.notGreater(["", "7", "7"]).B).toBe(true)
      expect(subject.notGreater(["", "7", "8"]).B).toBe(true)
    })

    it("notLess", () => {
      expect(subject.notLess(["", "6", "7"]).B).toBe(false)
      expect(subject.notLess(["", "7", "7"]).B).toBe(true)
      expect(subject.notLess(["", "8", "7"]).B).toBe(true)
    })

    it("equal", () => {
      expect(subject.equal(["", "8", "8"]).B).toBe(true)
      expect(subject.equal(["", "8", "9"]).B).toBe(false)
    })

    it("unequal", () => {
      expect(subject.unequal(["", "8", "8"]).B).toBe(false)
      expect(subject.unequal(["", "8", "9"]).B).toBe(true)
    })

    it("and", () => {
      expect(subject.and(["", true, true]).B).toBe(true)
      expect(subject.and(["", true, false]).B).toBe(false)
      expect(subject.and(["", false, true]).B).toBe(false)
      expect(subject.and(["", false, false]).B).toBe(false)
    })

    it("or", () => {
      expect(subject.or(["", true, true]).B).toBe(true)
      expect(subject.or(["", true, false]).B).toBe(true)
      expect(subject.or(["", false, true]).B).toBe(true)
      expect(subject.or(["", false, false]).B).toBe(false)
    })

    it("if", () => {
      expect(subject.if(["", true, "a", "b"]).S).toBe("a")
      expect(subject.if(["", false, "a", "b"]).S).toBe("b")
    })

    it("concat", () => {
      expect(subject.concat(["", "a", true, "b"]).S).toBe("atrueb")
    })

    it("join", () => {
      expect(subject.join(["", "-", "a", "b", "c"]).S).toBe("a-b-c")
      expect(subject.join(["", true, "a", "b", "c"]).S).toBe("atruebtruec")
    })

    it("substring", () => {
      expect(subject.substring(["", "helloworld", "2", "5"]).S).toBe("llo")
      // expect(subject.substring(['', 'helloworld', '2']).S).toBe('he');
      // expect(subject.substring(['', true]).S).toBe('');
    })

    it("length", () => {
      expect(subject.length(["", "helloworld"]).S).toBe("10")
      // expect(subject.length(['', true]).S).toBe('0');
    })

    it("contains", () => {
      expect(subject.contains(["", "helloworld", "lo"]).B).toBe(true)
      expect(subject.contains(["", "helloworld", "lw"]).B).toBe(false)
      expect(subject.contains(["", true, "lo"]).B).toBe(false)
      expect(subject.contains(["", "helloworld", true]).B).toBe(false)
    })

    it("replace", () => {
      expect(subject.replace(["", "foo bar baz", "ba", "xy"]).S).toBe(
        "foo xyr baz"
      )
      expect(subject.replace(["", true, "ba", "xy"]).S).toBe("true")
      expect(subject.replace(["", "foo bar baz", true, "xy"]).S).toBe(
        "foo bar baz"
      )
      expect(subject.replace(["", "foo bar baz", "ba", true]).S).toBe(
        "foo truer baz"
      )
    })

    it("replaceAll", () => {
      expect(subject.replaceAll(["", "foo bar baz", "ba", "xy"]).S).toBe(
        "foo xyr xyz"
      )
      expect(subject.replaceAll(["", true, "ba", "xy"]).S).toBe("true")
      expect(subject.replaceAll(["", "foo bar baz", true, "xy"]).S).toBe(
        "foo bar baz"
      )
      expect(subject.replaceAll(["", "foo bar baz", "ba", true]).S).toBe(
        "foo truer truez"
      )
    })

    it("abs", () => {
      expect(subject.abs(["", "-8"]).S).toBe("8")
      expect(subject.abs(["", "8"]).S).toBe("8")
    })

    it("cbrt", () => {
      expect(subject.cbrt(["", "-8"]).S).toBe("-2")
      expect(subject.cbrt(["", "8"]).S).toBe("2")
    })

    it("ceil", () => {
      expect(subject.ceil(["", "2.1"]).S).toBe("3")
      expect(subject.ceil(["", "2"]).S).toBe("2")
    })

    it("exp", () => {
      expect(subject.exp(["", "2"]).S).toBe("7.3890560989306502272")
    })

    it("floor", () => {
      expect(subject.floor(["", "2.9"]).S).toBe("2")
      expect(subject.floor(["", "2"]).S).toBe("2")
    })

    it("ln", () => {
      expect(subject.ln(["", "7.3890560989306502272"]).S).toBe("2")
    })

    it("log10", () => {
      expect(subject.log10(["", "100"]).S).toBe("2")
    })

    it("log2", () => {
      expect(subject.log2(["", "4"]).S).toBe("2")
    })

    it("max", () => {
      expect(subject.max(["", "3", "5", "1"]).S).toBe("5")
    })

    it("min", () => {
      expect(subject.min(["", "3", "1", "5"]).S).toBe("1")
    })

    it("round", () => {
      expect(subject.round(["", "2"]).S).toBe("2")
      expect(subject.round(["", "2.4"]).S).toBe("2")
      expect(subject.round(["", "2.5"]).S).toBe("3")
      expect(subject.round(["", "2.9"]).S).toBe("3")
      expect(subject.round(["", "3"]).S).toBe("3")
    })

    it("sqrt", () => {
      expect(subject.sqrt(["", "4"]).S).toBe("2")
      expect(subject.sqrt(["", "-4"]).S).toBe("NaN")
    })

    it("startDate", () => {
      expect(
        NBDBString.toData(
          subject.startDate(["", ["fromTimestamp", "1641300863123"]])
        )
      ).toBe("2022-01-04T21:54")
      expect(subject.startDate(["", true]).D).toBe(null)
    })

    it("endDate", () => {
      (subject as any).prop = () =>
        NBDBDate.fromDB([
          "DATE",
          {start: "2020-01-01T21:54", end: "2022-01-04T21:54"},
        ])

      expect(NBDBString.toData(subject.endDate(["", ["prop", "foobar"]]))).toBe(
        "2022-01-04T21:54"
      )
      expect(subject.endDate(["", ["now"]]).D).toBe(null)
    })

    it("now", () => {
      const result = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d$/.test(
        NBDBString.toData(subject.now())
      )
      expect(result).toBe(true)
    })

    it("timestamp", () => {
      expect(subject.timestamp(["", "2022-01-08T01:02"]).S).toBe(
        "1641571320000"
      )
    })

    it("fromTimestamp", () => {
      expect(
        NBDBString.toData(subject.fromTimestamp(["", "1641571320000"]))
      ).toBe("2022-01-08T01:02")
    })

    it("dateAdd", () => {
      expect(NBDBString.toData(subject.dateAdd(["", true, "1", "year"]))).toBe(
        ""
      )
      expect(
        NBDBString.toData(
          subject.dateAdd(["", "2022-05-05T05:05", "1", "year"])
        )
      ).toBe("2023-05-05T05:05")
      expect(
        NBDBString.toData(
          subject.dateAdd(["", "2022-05-05T05:05", "1", "month"])
        )
      ).toBe("2022-06-05T05:05")
      expect(
        NBDBString.toData(
          subject.dateAdd(["", "2022-05-05T05:05", "1", "week"])
        )
      ).toBe("2022-05-12T05:05")
      expect(
        NBDBString.toData(subject.dateAdd(["", "2022-05-05T05:05", "1", "day"]))
      ).toBe("2022-05-06T05:05")
      expect(
        NBDBString.toData(
          subject.dateAdd(["", "2022-05-05T05:05", "1", "hour"])
        )
      ).toBe("2022-05-05T06:05")
      expect(
        NBDBString.toData(
          subject.dateAdd(["", "2022-05-05T05:05", "1", "minute"])
        )
      ).toBe("2022-05-05T05:06")
    })

    it("dateSubtract", () => {
      expect(
        NBDBString.toData(subject.dateSubtract(["", true, "1", "year"]))
      ).toBe("")
      expect(
        NBDBString.toData(
          subject.dateSubtract(["", "2022-05-05T05:05", "1", "year"])
        )
      ).toBe("2021-05-05T05:05")
      expect(
        NBDBString.toData(
          subject.dateSubtract(["", "2022-05-05T05:05", "1", "month"])
        )
      ).toBe("2022-04-05T05:05")
      expect(
        NBDBString.toData(
          subject.dateSubtract(["", "2022-05-05T05:05", "1", "week"])
        )
      ).toBe("2022-04-28T05:05")
      expect(
        NBDBString.toData(
          subject.dateSubtract(["", "2022-05-05T05:05", "1", "day"])
        )
      ).toBe("2022-05-04T05:05")
      expect(
        NBDBString.toData(
          subject.dateSubtract(["", "2022-05-05T05:05", "1", "hour"])
        )
      ).toBe("2022-05-05T04:05")
      expect(
        NBDBString.toData(
          subject.dateSubtract(["", "2022-05-05T05:05", "1", "minute"])
        )
      ).toBe("2022-05-05T05:04")
    })

    it("dateBetween", () => {
      expect(
        subject.dateBetween(["", true, "2021-05-05T05:05", "year"]).S
      ).toBe("0")
      expect(
        subject.dateBetween(["", "2022-05-05T05:05", true, "year"]).S
      ).toBe("0")
      expect(
        subject.dateBetween(["", "2022-05-05T05:05", "2021-05-05T05:05", true])
          .S
      ).toBe("31536000000")
      expect(
        subject.dateBetween([
          "",
          "2022-05-05T05:05",
          "2021-05-05T05:05",
          "year",
        ]).S
      ).toBe("1")
      expect(
        subject.dateBetween([
          "",
          "2022-05-05T05:05",
          "2022-04-05T05:05",
          "month",
        ]).S
      ).toBe("1")
      expect(
        subject.dateBetween([
          "",
          "2022-05-05T05:05",
          "2022-04-28T05:05",
          "week",
        ]).S
      ).toBe("1")
      expect(
        subject.dateBetween(["", "2022-05-05T05:05", "2022-05-04T05:05", "day"])
          .S
      ).toBe("1")
      expect(
        subject.dateBetween([
          "",
          "2022-05-05T05:05",
          "2022-05-05T04:05",
          "hour",
        ]).S
      ).toBe("1")
      expect(
        subject.dateBetween([
          "",
          "2022-05-05T05:05",
          "2022-05-05T05:04",
          "minute",
        ]).S
      ).toBe("1")
    })

    it("formatDate", () => {
      expect(subject.formatDate(["", true, "dd/DD/mm/YY hh:mm"]).S).toBe("")
      expect(subject.formatDate(["", "2022-05-05T05:05", true]).S).toBe("true")
      expect(
        subject.formatDate(["", "2022-05-05T05:05", "dd/DD/mm/YY hh:mm"]).S
      ).toBe("Th/05/05/22 05:05")
    })

    it("minute", () => {
      expect(subject.minute(["", true]).S).toBe("0")
      expect(subject.minute(["", "2022-05-07T08:09"]).S).toBe("9")
    })

    it("hour", () => {
      expect(subject.hour(["", true]).S).toBe("0")
      expect(subject.hour(["", "2022-05-07T08:09"]).S).toBe("8")
    })

    it("day", () => {
      expect(subject.day(["", true]).S).toBe("0")
      expect(subject.day(["", "2022-05-07T08:09"]).S).toBe("6")
    })

    it("date", () => {
      expect(subject.date(["", true]).S).toBe("0")
      expect(subject.date(["", "2022-05-07T08:09"]).S).toBe("7")
    })

    it("month", () => {
      expect(subject.month(["", true]).S).toBe("1")
      expect(subject.month(["", "2022-05-07T08:09"]).S).toBe("5")
    })

    it("year", () => {
      expect(subject.year(["", true]).S).toBe("0")
      expect(subject.year(["", "2022-05-07T08:09"]).S).toBe("2022")
    })
  })
})
