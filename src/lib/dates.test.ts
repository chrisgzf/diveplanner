import { describe, it, expect } from 'vitest'
import { enumerateDays, isWeekday, durationDays, calendarWindow, formatISO, monthsInRange } from './dates'

describe('dates', () => {
  it('enumerateDays returns inclusive list', () => {
    expect(enumerateDays('2026-05-15', '2026-05-17')).toEqual(['2026-05-15', '2026-05-16', '2026-05-17'])
  })
  it('enumerateDays handles single day', () => {
    expect(enumerateDays('2026-05-15', '2026-05-15')).toEqual(['2026-05-15'])
  })
  it('isWeekday distinguishes weekend', () => {
    expect(isWeekday('2026-05-15')).toBe(true)  // Friday
    expect(isWeekday('2026-05-16')).toBe(false) // Saturday
    expect(isWeekday('2026-05-17')).toBe(false) // Sunday
    expect(isWeekday('2026-05-18')).toBe(true)  // Monday
  })
  it('durationDays counts inclusive', () => {
    expect(durationDays('2026-05-15', '2026-05-23')).toBe(9)
    expect(durationDays('2026-05-15', '2026-05-15')).toBe(1)
  })
  it('calendarWindow runs from the current month through Dec next year', () => {
    const w = calendarWindow(new Date(2026, 5, 28)) // June 2026 (month index 5)
    expect(w[0]).toEqual({ year: 2026, month: 6 })
    expect(w[w.length - 1]).toEqual({ year: 2027, month: 12 })
    // Jun 2026..Dec 2026 = 7, Jan..Dec 2027 = 12 → 19 months.
    expect(w).toHaveLength(19)
  })
  it('calendarWindow from December gives 13 months', () => {
    const w = calendarWindow(new Date(2026, 11, 1)) // December 2026
    expect(w[0]).toEqual({ year: 2026, month: 12 })
    expect(w[w.length - 1]).toEqual({ year: 2027, month: 12 })
    expect(w).toHaveLength(13)
  })
  it('formatISO formats a date', () => {
    expect(formatISO(new Date(2026, 4, 15))).toBe('2026-05-15')
  })
})

it('monthsInRange returns the unique months a range spans', () => {
  expect(monthsInRange('2026-04-29', '2026-05-02')).toEqual([4, 5])
  expect(monthsInRange('2026-05-10', '2026-05-12')).toEqual([5])
})
