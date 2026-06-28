import { describe, it, expect } from 'vitest'
import { encodeShare, decodeShare, type ShareState } from './share'
import { DEFAULT_SETTINGS } from '@/types'

const state: ShareState = {
  trips: [{ id: 'a', label: 'Malapascua', startDate: '2026-05-15', endDate: '2026-05-23', type: 'fun-dive', status: 'planned', bookings: [] }],
  siteOverrides: [],
  settings: DEFAULT_SETTINGS,
}

describe('share encode/decode', () => {
  it('round-trips state through a URL-safe hash', () => {
    const hash = encodeShare(state)
    expect(hash).not.toMatch(/[+/=]/) // URL-safe: no plain-base64 chars
    expect(decodeShare(hash)).toEqual(state)
  })
  it('returns null for malformed hash', () => {
    expect(decodeShare('!!!not-valid!!!')).toBeNull()
    expect(decodeShare('')).toBeNull()
  })
})
