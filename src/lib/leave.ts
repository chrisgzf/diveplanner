import { enumerateDays, isWeekday } from './dates'
import type { ISODate, Trip } from '@/types'
import { parseISO, format, addDays } from 'date-fns'

function leaveDays(start: ISODate, end: ISODate, holidays: Set<ISODate>): ISODate[] {
  let adjustedStart = start
  const startDate = parseISO(start)
  const dayOfWeek = startDate.getDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  // If start is Friday (5), Saturday (6), or Sunday (0), advance to next day
  if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
    adjustedStart = format(addDays(startDate, 1), 'yyyy-MM-dd') as ISODate
  }

  return enumerateDays(adjustedStart, end).filter((d) => isWeekday(d) && !holidays.has(d))
}

export function leaveDaysInRange(start: ISODate, end: ISODate, holidays: Set<ISODate>): number {
  return leaveDays(start, end, holidays).length
}

export function leaveDaysByYear(start: ISODate, end: ISODate, holidays: Set<ISODate>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const d of leaveDays(start, end, holidays)) {
    const year = Number(d.slice(0, 4))
    out[year] = (out[year] ?? 0) + 1
  }
  return out
}

export function leaveUsedByYear(trips: Trip[], holidays: Set<ISODate>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const trip of trips) {
    const byYear = leaveDaysByYear(trip.startDate, trip.endDate, holidays)
    for (const [year, n] of Object.entries(byYear)) {
      out[Number(year)] = (out[Number(year)] ?? 0) + n
    }
  }
  return out
}
