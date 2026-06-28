import { getDaysInMonth } from 'date-fns'
import type { ISODate, Location, Trip } from '@/types'

export interface DayMeta {
  holidayName?: string
  trip?: Trip
  goodLocs: string[]
  fairLocs: string[]
}

function iso(year: number, month: number, day: number): ISODate {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function buildDayMetaMap(args: {
  window: { year: number; month: number }[]
  locations: Location[]
  holidayNames: Map<ISODate, string>
  covered: Map<ISODate, Trip>
}): Map<ISODate, DayMeta> {
  const { window, locations, holidayNames, covered } = args
  const map = new Map<ISODate, DayMeta>()
  for (const { year, month } of window) {
    // Month-only seasonality: compute good/fair location names once per month.
    const goodLocs: string[] = []
    const fairLocs: string[] = []
    for (const loc of locations) {
      const rating = loc.seasonality.find((s) => s.month === month)?.rating
      if (rating === 'good') goodLocs.push(loc.name)
      else if (rating === 'fair') fairLocs.push(loc.name)
    }
    const days = getDaysInMonth(new Date(year, month - 1))
    for (let day = 1; day <= days; day++) {
      const d = iso(year, month, day)
      map.set(d, { holidayName: holidayNames.get(d), trip: covered.get(d), goodLocs, fairLocs })
    }
  }
  return map
}
