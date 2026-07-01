import { describe, it, expect } from 'vitest'
import { leaveDaysInRange, leaveDaysByYear, leaveUsedByYear, segmentDays } from './leave'
import type { Trip } from '@/types'

const noHols = new Set<string>()

describe('leaveDaysInRange', () => {
  it('counts weekdays only (Fri 15 May -> Sat 23 May 2026 = Fri 15, Mon-Fri 18-22 = 6)', () => {
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', noHols)).toBe(6)
  })
  it('subtracts public holidays falling on weekdays', () => {
    // Hari Raya Haji Mon 2026-05-18 (hypothetical) reduces 6 -> 5
    const hols = new Set(['2026-05-18'])
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', hols)).toBe(5)
  })
  it('ignores holidays that fall on a weekend', () => {
    const hols = new Set(['2026-05-16']) // Saturday
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', hols)).toBe(6)
  })
  it('counts Friday as a leave day when trip starts on Friday', () => {
    // 2026-05-22 is a Friday; single-day trip = 1 leave day
    expect(leaveDaysInRange('2026-05-22', '2026-05-22', noHols)).toBe(1)
  })
  it('subtracts explicitly excluded weekdays (e.g. a travel day not taken as leave)', () => {
    const excluded = new Set(['2026-05-15']) // Friday
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', noHols, excluded)).toBe(5)
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

describe('segmentDays', () => {
  it('classifies each day and groups consecutive runs', () => {
    // 2026-05-01 Fri (holiday Labour Day), 05-02 Sat, 05-03 Sun, 05-04 Mon (leave).
    const names = new Map([['2026-05-01', 'Labour Day']])
    const segs = segmentDays('2026-05-01', '2026-05-04', names)
    expect(segs).toEqual([
      { kind: 'holiday', startDate: '2026-05-01', endDate: '2026-05-01', label: 'Labour Day', days: 1, leaveDays: 0 },
      { kind: 'weekend', startDate: '2026-05-02', endDate: '2026-05-03', days: 2, leaveDays: 0 },
      { kind: 'leave', startDate: '2026-05-04', endDate: '2026-05-04', days: 1, leaveDays: 1 },
    ])
  })

  it('treats weekday holidays distinctly from leave', () => {
    const segs = segmentDays('2026-05-04', '2026-05-05', new Map([['2026-05-05', 'X']]))
    expect(segs.map((s) => s.kind)).toEqual(['leave', 'holiday'])
  })
})

describe('leaveUsedByYear', () => {
  it('sums leave across all trips including non-dive, keyed by year', () => {
    const trips: Trip[] = [
      { id: 'a', label: 'Dive', startDate: '2026-05-15', endDate: '2026-05-23', type: 'fun-dive', status: 'planned', bookings: [] },
      { id: 'b', label: 'Italy', startDate: '2026-05-25', endDate: '2026-05-29', type: 'non-dive', status: 'planned', bookings: [] },
    ]
    const used = leaveUsedByYear(trips, noHols)
    expect(used[2026]).toBe(6 + 5) // trip a: 6 weekdays (Fri 15 + Mon-Fri 18-22); trip b: Mon-Fri = 5
  })

  it('excludes a trip\'s excludedLeaveDates from the tally (e.g. a fly-out-after-work day)', () => {
    const trips: Trip[] = [
      { id: 'a', label: 'Dive', startDate: '2026-05-15', endDate: '2026-05-23', type: 'fun-dive', status: 'planned', bookings: [], excludedLeaveDates: ['2026-05-15'] },
    ]
    const used = leaveUsedByYear(trips, noHols)
    expect(used[2026]).toBe(5) // Fri 15 excluded; Mon-Fri 18-22 still counted
  })
})
