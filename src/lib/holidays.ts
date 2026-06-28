import type { ISODate } from '@/types'

export function holidayKey(country: string, year: number): string {
  return `${country}-${year}`
}

export function nagerUrl(country: string, year: number): string {
  return `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`
}

export function parseHolidays(data: unknown): ISODate[] {
  if (!Array.isArray(data)) return []
  return data
    .map((d) => (d && typeof (d as { date?: unknown }).date === 'string' ? (d as { date: string }).date : null))
    .filter((d): d is string => d !== null)
}

export async function fetchHolidays(country: string, year: number): Promise<ISODate[]> {
  const res = await fetch(nagerUrl(country, year))
  if (!res.ok) throw new Error(`Nager.Date HTTP ${res.status}`)
  return parseHolidays(await res.json())
}

export function holidaySetFromCache(cache: Record<string, ISODate[]>): Set<ISODate> {
  const set = new Set<ISODate>()
  for (const dates of Object.values(cache)) for (const d of dates) set.add(d)
  return set
}
