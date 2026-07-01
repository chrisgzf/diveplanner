import { eachDayOfInterval, parseISO, format, isWeekend, differenceInCalendarDays, getDate, getMonth } from 'date-fns'
import type { ISODate } from '@/types'

export function formatISO(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd')
}

// Whether the runtime's locale writes day before month (e.g. 20/7) or month
// before day (e.g. 7/20) in a short numeric date — detected once from
// Intl rather than hardcoded, so US-locale users see 7/20 not 20/7.
const dayBeforeMonth = (() => {
  const parts = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'numeric' }).formatToParts(new Date(2000, 0, 20))
  return parts.findIndex((p) => p.type === 'day') < parts.findIndex((p) => p.type === 'month')
})()

// Compact "EEE d/M" (or "EEE M/d" for month-first locales) — used where
// space is tight (e.g. the leave breakdown) and "EEE d MMM" wraps.
export function formatShortDate(date: ISODate): string {
  const d = parseISO(date)
  const day = getDate(d)
  const month = getMonth(d) + 1
  const numeric = dayBeforeMonth ? `${day}/${month}` : `${month}/${day}`
  return `${format(d, 'EEE')} ${numeric}`
}

// "Friday" — a native date input already shows the full date, so this only
// adds the one thing it can't: the day of week.
export function formatWeekday(date: ISODate): string {
  return format(parseISO(date), 'EEEE')
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

export function monthsInRange(start: ISODate, end: ISODate): number[] {
  const set = new Set<number>()
  for (const d of enumerateDays(start, end)) set.add(Number(d.slice(5, 7)))
  return [...set].sort((a, b) => a - b)
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
