import { enumerateDays, isWeekday } from './dates'
import type { ISODate, Trip } from '@/types'

export type SegmentKind = 'leave' | 'holiday' | 'weekend'

export interface Segment {
  kind: SegmentKind
  startDate: ISODate
  endDate: ISODate
  label?: string
  days: number
  leaveDays: number
}

export function segmentDays(start: ISODate, end: ISODate, holidayNames: Map<ISODate, string>): Segment[] {
  const out: Segment[] = []
  for (const d of enumerateDays(start, end)) {
    const holidayName = holidayNames.get(d)
    let kind: SegmentKind
    let label: string | undefined
    if (holidayName) { kind = 'holiday'; label = holidayName }
    else if (!isWeekday(d)) kind = 'weekend'
    else kind = 'leave'
    const last = out[out.length - 1]
    // Group consecutive days of the same kind. Holidays never merge (each keeps its own name/day).
    if (last && last.kind === kind && kind !== 'holiday') {
      last.endDate = d
      last.days += 1
      last.leaveDays += kind === 'leave' ? 1 : 0
    } else {
      out.push({ kind, startDate: d, endDate: d, label, days: 1, leaveDays: kind === 'leave' ? 1 : 0 })
    }
  }
  return out
}

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
