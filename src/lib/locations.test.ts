import { describe, it, expect } from 'vitest'
import { mergeLocations } from './locations'
import { LOCATIONS } from '@/data/locations'
import type { Location } from '@/types'

const custom: Location = {
  id: 'my-spot', name: 'Aardvark Reef', country: 'Singapore', difficulty: 'beginner',
  highlights: ['Test'], seasonality: LOCATIONS[0].seasonality, isUserAdded: true,
}

describe('mergeLocations', () => {
  it('returns base list when no overrides', () => {
    expect(mergeLocations([])).toHaveLength(LOCATIONS.length)
  })
  it('appends user-added and sorts by name', () => {
    const merged = mergeLocations([custom])
    expect(merged).toHaveLength(LOCATIONS.length + 1)
    expect(merged[0].id).toBe('my-spot') // "Aardvark" sorts first
  })
  it('override replaces a base location by id', () => {
    const override: Location = { ...LOCATIONS[0], name: 'Tioman (edited)', isUserAdded: true }
    const merged = mergeLocations([override])
    expect(merged).toHaveLength(LOCATIONS.length)
    expect(merged.find((l) => l.id === LOCATIONS[0].id)!.name).toBe('Tioman (edited)')
  })
})
