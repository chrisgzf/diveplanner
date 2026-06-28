import { describe, it, expect } from 'vitest'
import { leaveDaysInRange, leaveDaysByYear, leaveUsedByYear } from './leave'
import type { Trip } from '@/types'

const noHols = new Set<string>()

describe('leaveDaysInRange', () => {
  it('counts weekdays only (Sat 15 May -> Sun 23 May 2026 = Mon-Fri 18-22 = 5)', () => {
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', noHols)).toBe(5)
  })
  it('subtracts public holidays falling on weekdays', () => {
    // Hari Raya Haji Mon 2026-05-18 (hypothetical) reduces 5 -> 4
    const hols = new Set(['2026-05-18'])
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', hols)).toBe(4)
  })
  it('ignores holidays that fall on a weekend', () => {
    const hols = new Set(['2026-05-16']) // Saturday
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', hols)).toBe(5)
  })
})

describe('leaveDaysByYear', () => {
  it('attributes each leave day to its own calendar year across Dec 31', () => {
    // 2026-12-28 (Mon) .. 2027-01-03 (Sun): weekdays 28,29,30,31 (2026) + 1 (2027, Fri)
    const byYear = leaveDaysByYear('2026-12-28', '2027-01-03', noHols)
    expect(byYear[2026]).toBe(4)
    expect(byYear[2027]).toBe(1)
  })
})

describe('leaveUsedByYear', () => {
  it('sums leave across all trips including non-dive, keyed by year', () => {
    const trips: Trip[] = [
      { id: 'a', label: 'Dive', startDate: '2026-05-15', endDate: '2026-05-23', type: 'fun-dive', status: 'planned', bookings: [] },
      { id: 'b', label: 'Italy', startDate: '2026-05-25', endDate: '2026-05-29', type: 'non-dive', status: 'planned', bookings: [] },
    ]
    const used = leaveUsedByYear(trips, noHols)
    expect(used[2026]).toBe(5 + 5) // trip a: 5 weekdays; trip b: Mon-Fri = 5
  })
})
