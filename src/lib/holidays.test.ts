import { describe, it, expect, vi, afterEach } from 'vitest'
import { holidayKey, nagerUrl, parseHolidays, fetchHolidays, holidaySetFromCache, holidayNameMap, applySubstituteHolidays } from './holidays'

afterEach(() => vi.restoreAllMocks())

describe('holiday helpers', () => {
  it('builds cache key and url', () => {
    expect(holidayKey('SG', 2026)).toBe('SG-2026')
    expect(nagerUrl('SG', 2026)).toBe('https://date.nager.at/api/v3/PublicHolidays/2026/SG')
  })
  it('parses holiday entries and ignores malformed ones', () => {
    expect(parseHolidays([{ date: '2026-05-01', name: 'Labour Day' }, { foo: 'bar' }, { date: 123 }]))
      .toEqual([{ date: '2026-05-01', name: 'Labour Day' }])
    expect(parseHolidays(null)).toEqual([])
  })
  it('defaults a missing name to "Holiday"', () => {
    expect(parseHolidays([{ date: '2026-05-01' }])).toEqual([{ date: '2026-05-01', name: 'Holiday' }])
  })
  it('flattens cache dates into a Set', () => {
    const set = holidaySetFromCache({ 'SG-2026': [{ date: '2026-05-01', name: 'Labour Day' }], 'SG-2027': [{ date: '2027-01-01', name: 'New Year' }] })
    expect(set.has('2026-05-01')).toBe(true)
    expect(set.has('2027-01-01')).toBe(true)
  })
  it('builds a date→name map from cache', () => {
    const map = holidayNameMap({ 'SG-2026': [{ date: '2026-05-01', name: 'Labour Day' }] })
    expect(map.get('2026-05-01')).toBe('Labour Day')
  })
  it('fetchHolidays returns parsed entries on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-08-09', name: 'National Day' }] }))
    expect(await fetchHolidays('SG', 2026)).toEqual([{ date: '2026-08-09', name: 'National Day' }])
  })
  it('fetchHolidays throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchHolidays('SG', 2026)).rejects.toThrow()
  })
})

describe('applySubstituteHolidays', () => {
  it('moves a Saturday holiday to the following Monday', () => {
    // 2026-05-02 is a Saturday.
    const out = applySubstituteHolidays([{ date: '2026-05-02', name: 'Labour Day' }])
    expect(out).toContainEqual({ date: '2026-05-02', name: 'Labour Day' }) // original kept
    expect(out).toContainEqual({ date: '2026-05-04', name: 'Labour Day (substitute)' }) // Monday
  })
  it('chains substitutes for a Sat+Sun pair (Sat→Mon, Sun→Tue)', () => {
    // 2026-08-15 Sat, 2026-08-16 Sun.
    const out = applySubstituteHolidays([
      { date: '2026-08-15', name: 'A' },
      { date: '2026-08-16', name: 'B' },
    ])
    expect(out).toContainEqual({ date: '2026-08-17', name: 'A (substitute)' }) // Mon
    expect(out).toContainEqual({ date: '2026-08-18', name: 'B (substitute)' }) // Tue
  })
  it('skips a weekday already occupied by an original holiday', () => {
    // 2026-08-15 Sat; Mon 2026-08-17 is already a holiday → substitute lands on Tue.
    const out = applySubstituteHolidays([
      { date: '2026-08-15', name: 'A' },
      { date: '2026-08-17', name: 'Existing Monday' },
    ])
    expect(out).toContainEqual({ date: '2026-08-18', name: 'A (substitute)' })
  })
  it('leaves weekday holidays untouched', () => {
    const out = applySubstituteHolidays([{ date: '2026-05-01', name: 'Labour Day' }]) // Friday
    expect(out).toEqual([{ date: '2026-05-01', name: 'Labour Day' }])
  })
})
