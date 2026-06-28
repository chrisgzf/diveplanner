import { describe, it, expect } from 'vitest'
import { LOCATIONS } from './locations'

describe('LOCATIONS', () => {
  it('has 15 entries with unique ids', () => {
    expect(LOCATIONS).toHaveLength(15)
    expect(new Set(LOCATIONS.map((l) => l.id)).size).toBe(15)
  })

  it('every location has exactly 12 month ratings, months 1-12 in order', () => {
    for (const loc of LOCATIONS) {
      expect(loc.seasonality).toHaveLength(12)
      expect(loc.seasonality.map((s) => s.month)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12])
      for (const s of loc.seasonality) {
        expect(['good', 'fair', 'poor', 'closed']).toContain(s.rating)
      }
    }
  })

  it('every location has at least one highlight', () => {
    for (const loc of LOCATIONS) expect(loc.highlights.length).toBeGreaterThan(0)
  })
})
