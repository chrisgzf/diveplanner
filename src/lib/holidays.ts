import type { HolidayEntry, ISODate } from '@/types'

export function holidayKey(country: string, year: number): string {
  return `${country}-${year}`
}

export function nagerUrl(country: string, year: number): string {
  return `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`
}

export function parseHolidays(data: unknown): HolidayEntry[] {
  if (!Array.isArray(data)) return []
  return data
    .filter((d): d is { date: string; name?: unknown } => !!d && typeof (d as { date?: unknown }).date === 'string')
    .map((d) => ({ date: d.date, name: typeof d.name === 'string' ? d.name : 'Holiday' }))
}

export async function fetchHolidays(country: string, year: number): Promise<HolidayEntry[]> {
  const res = await fetch(nagerUrl(country, year))
  if (!res.ok) throw new Error(`Nager.Date HTTP ${res.status}`)
  return parseHolidays(await res.json())
}

export function holidaySetFromCache(cache: Record<string, HolidayEntry[]>): Set<ISODate> {
  const set = new Set<ISODate>()
  for (const entries of Object.values(cache)) for (const e of entries) set.add(e.date)
  return set
}

export function holidayNameMap(cache: Record<string, HolidayEntry[]>): Map<ISODate, string> {
  const map = new Map<ISODate, string>()
  for (const entries of Object.values(cache)) for (const e of entries) map.set(e.date, e.name)
  return map
}
