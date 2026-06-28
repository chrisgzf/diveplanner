import { enumerateDays } from './dates'
import type { ISODate, Trip } from '@/types'

export function rangesOverlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

export function hasOverlap(trips: Trip[], start: ISODate, end: ISODate, excludeId?: string): boolean {
  return trips.some((t) => t.id !== excludeId && rangesOverlap(t.startDate, t.endDate, start, end))
}

export function coveredTripMap(trips: Trip[], excludeId?: string): Map<ISODate, Trip> {
  const out = new Map<ISODate, Trip>()
  for (const t of trips) {
    if (t.id === excludeId) continue
    for (const d of enumerateDays(t.startDate, t.endDate)) out.set(d, t)
  }
  return out
}
