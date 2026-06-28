import { describe, it, expect } from 'vitest'
import { enumerateDays, isWeekday, durationDays, monthsWindow, formatISO } from './dates'

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
  it('monthsWindow rolls 12 months from the given month', () => {
    const w = monthsWindow(new Date(2026, 5, 28), 12) // June 2026
    expect(w).toHaveLength(12)
    expect(w[0]).toEqual({ year: 2026, month: 6 })
    expect(w[6]).toEqual({ year: 2026, month: 12 })
    expect(w[7]).toEqual({ year: 2027, month: 1 })
    expect(w[11]).toEqual({ year: 2027, month: 5 })
  })
  it('formatISO formats a date', () => {
    expect(formatISO(new Date(2026, 4, 15))).toBe('2026-05-15')
  })
})
