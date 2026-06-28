import { durationDays } from './dates'
import type { ISODate, TripType } from '@/types'

export const DIVES_PER_DAY: Record<TripType, number> = {
  'fun-dive': 3,
  liveaboard: 4,
  course: 2,
  'non-dive': 0,
}

export function estimatedDives(type: TripType, start: ISODate, end: ISODate): number {
  if (type === 'non-dive') return 0
  const divingDays = durationDays(start, end) - 2 // 1 travel day + 1 no-fly day
  if (divingDays <= 0) return 0
  return divingDays * DIVES_PER_DAY[type]
}
