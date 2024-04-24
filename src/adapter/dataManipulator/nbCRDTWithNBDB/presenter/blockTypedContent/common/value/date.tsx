import type {DBDateTime, DBDateRange} from "@/domain/entity"

import dayjs from "dayjs"

export const renderDateRange = (range: DBDateRange | null) => {
  if (!range) return null

  const start = stringifyDate(range.start, range.time)
  const end = range.end && stringifyDate(range.end, range.time)

  return (
    <div className="nb-db-date-value">
      <div className="nb-db-date-range">
        <div className="nb-db-date-start">{start}</div>
        {end && <div className="nb-db-date-end">{end}</div>}
      </div>
    </div>
  )
}

const stringifyDate = (
  value: DBDateTime | number,
  time: boolean | undefined
): string => {
  const date = dayjs(value)
  return time ? date.format("YYYY.MM.DD. A HH:mm") : date.format("YYYY.MM.DD.")
}
