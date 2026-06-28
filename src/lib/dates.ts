import { eachDayOfInterval, parseISO, format, isWeekend, differenceInCalendarDays, addMonths } from 'date-fns'
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

export function monthsWindow(from: Date, count = 12): { year: number; month: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(new Date(from.getFullYear(), from.getMonth(), 1), i)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
}
