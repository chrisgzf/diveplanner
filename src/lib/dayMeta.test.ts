import { describe, it, expect } from 'vitest'
import { buildDayMetaMap } from './dayMeta'
import type { Location, Trip } from '@/types'

const loc = (id: string, name: string, mayRating: 'good' | 'fair'): Location => ({
  id, name, country: 'XX', difficulty: 'beginner', highlights: [],
  seasonality: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, rating: i + 1 === 5 ? mayRating : 'poor' })),
})

describe('buildDayMetaMap', () => {
  const window = [{ year: 2026, month: 5 }]
  const locations = [loc('a', 'Tioman', 'good'), loc('b', 'Koh Tao', 'fair')]

  it('groups good/fair locations by month for each day', () => {
    const map = buildDayMetaMap({ window, locations, holidayNames: new Map(), covered: new Map() })
    const meta = map.get('2026-05-10')!
    expect(meta.goodLocs).toEqual(['Tioman'])
    expect(meta.fairLocs).toEqual(['Koh Tao'])
  })

  it('attaches holiday name and covering trip', () => {
    const trip: Trip = { id: 't', label: 'Tioman LW', startDate: '2026-05-10', endDate: '2026-05-12', type: 'liveaboard', status: 'planned', bookings: [] }
    const map = buildDayMetaMap({
      window, locations,
      holidayNames: new Map([['2026-05-10', 'Labour Day']]),
      covered: new Map([['2026-05-10', trip]]),
    })
    const meta = map.get('2026-05-10')!
    expect(meta.holidayName).toBe('Labour Day')
    expect(meta.trip?.id).toBe('t')
  })
})
