import { enumerateDays, isWeekday } from './dates'
import type { ISODate, Trip } from '@/types'

function leaveDays(start: ISODate, end: ISODate, holidays: Set<ISODate>): ISODate[] {
  return enumerateDays(start, end).filter((d) => isWeekday(d) && !holidays.has(d))
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
