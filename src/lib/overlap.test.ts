import { describe, it, expect } from 'vitest'
import { rangesOverlap, hasOverlap, coveredDays } from './overlap'
import type { Trip } from '@/types'

const trips: Trip[] = [
  { id: 'a', label: 'A', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] },
]

describe('rangesOverlap', () => {
  it('detects overlap and adjacency rules', () => {
    expect(rangesOverlap('2026-05-15', '2026-05-20', '2026-05-18', '2026-05-25')).toBe(true)
    expect(rangesOverlap('2026-05-15', '2026-05-20', '2026-05-20', '2026-05-25')).toBe(true) // shared endpoint
    expect(rangesOverlap('2026-05-15', '2026-05-20', '2026-05-21', '2026-05-25')).toBe(false) // adjacent ok
  })
})

describe('hasOverlap', () => {
  it('true when new range hits an existing trip', () => {
    expect(hasOverlap(trips, '2026-05-19', '2026-05-22')).toBe(true)
  })
  it('false when excluding the trip being edited', () => {
    expect(hasOverlap(trips, '2026-05-15', '2026-05-20', 'a')).toBe(false)
  })
  it('false for a clear range', () => {
    expect(hasOverlap(trips, '2026-06-01', '2026-06-05')).toBe(false)
  })
})

describe('coveredDays', () => {
  it('returns every day occupied by trips, minus excluded', () => {
    expect(coveredDays(trips).has('2026-05-17')).toBe(true)
    expect(coveredDays(trips, 'a').size).toBe(0)
  })
})
