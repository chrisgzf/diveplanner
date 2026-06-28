import { describe, it, expect } from 'vitest'
import { estimatedDives } from './dives'

describe('estimatedDives', () => {
  it('fun-dive: (duration - 2 travel/no-fly) * 3 per day', () => {
    // 2026-05-15..2026-05-23 = 9 days -> 7 diving days * 3 = 21
    expect(estimatedDives('fun-dive', '2026-05-15', '2026-05-23')).toBe(21)
  })
  it('liveaboard: 4 dives/day', () => {
    expect(estimatedDives('liveaboard', '2026-05-15', '2026-05-23')).toBe(28)
  })
  it('course: 2 dives/day', () => {
    expect(estimatedDives('course', '2026-05-15', '2026-05-23')).toBe(14)
  })
  it('non-dive always 0', () => {
    expect(estimatedDives('non-dive', '2026-05-15', '2026-05-23')).toBe(0)
  })
  it('never negative for short trips', () => {
    expect(estimatedDives('fun-dive', '2026-05-15', '2026-05-15')).toBe(0)
    expect(estimatedDives('fun-dive', '2026-05-15', '2026-05-16')).toBe(0)
  })
})
