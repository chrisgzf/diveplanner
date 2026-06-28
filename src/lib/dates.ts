import { eachDayOfInterval, parseISO, format, isWeekend, differenceInCalendarDays } from 'date-fns'
import type { ISODate } from '@/types'

export function formatISO(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd')
}

export function enumerateDays(start: ISODate, end: ISODate): ISODate[] {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(formatISO)
}

export function isWeekday(date: ISODate): boolean {
  return !isWeekend(parseISO(date))
}

export function durationDays(start: ISODate, end: ISODate): number {
  return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1
}

export function calendarWindow(now: Date): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = []
  const startY = now.getFullYear()
  const startM = now.getMonth() + 1 // 1-12
  const endY = startY + 1
  const endM = 12
  let y = startY
  let m = startM
  while (y < endY || (y === endY && m <= endM)) {
    out.push({ year: y, month: m })
    if (m === 12) { m = 1; y += 1 } else { m += 1 }
  }
  return out
}
