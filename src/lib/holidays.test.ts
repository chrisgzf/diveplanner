import { describe, it, expect, vi, afterEach } from 'vitest'
import { holidayKey, nagerUrl, parseHolidays, fetchHolidays, holidaySetFromCache } from './holidays'

afterEach(() => vi.restoreAllMocks())

describe('holiday helpers', () => {
  it('builds cache key and url', () => {
    expect(holidayKey('SG', 2026)).toBe('SG-2026')
    expect(nagerUrl('SG', 2026)).toBe('https://date.nager.at/api/v3/PublicHolidays/2026/SG')
  })
  it('parses holiday dates and ignores malformed entries', () => {
    expect(parseHolidays([{ date: '2026-05-01' }, { foo: 'bar' }, { date: 123 }])).toEqual(['2026-05-01'])
    expect(parseHolidays(null)).toEqual([])
  })
  it('flattens cache into a single Set', () => {
    const set = holidaySetFromCache({ 'SG-2026': ['2026-05-01'], 'SG-2027': ['2027-01-01'] })
    expect(set.has('2026-05-01')).toBe(true)
    expect(set.has('2027-01-01')).toBe(true)
  })
  it('fetchHolidays returns parsed dates on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-08-09' }] }))
    expect(await fetchHolidays('SG', 2026)).toEqual(['2026-08-09'])
  })
  it('fetchHolidays throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchHolidays('SG', 2026)).rejects.toThrow()
  })
})
