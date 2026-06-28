import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './useAppStore'
import { DEFAULT_SETTINGS, type Trip, type HolidayEntry } from '@/types'

const trip: Trip = { id: 'a', label: 'A', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] }

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('useAppStore', () => {
  it('adds, updates, deletes a trip', () => {
    useAppStore.getState().addTrip(trip)
    expect(useAppStore.getState().trips).toHaveLength(1)
    useAppStore.getState().updateTrip({ ...trip, label: 'B' })
    expect(useAppStore.getState().trips[0].label).toBe('B')
    useAppStore.getState().deleteTrip('a')
    expect(useAppStore.getState().trips).toHaveLength(0)
  })
  it('updates settings by patch', () => {
    useAppStore.getState().updateSettings({ leaveBudget: { 2026: 30 } })
    expect(useAppStore.getState().settings.leaveBudget[2026]).toBe(30)
    expect(useAppStore.getState().settings.country).toBe('SG')
  })
  it('sets holiday session slice', () => {
    const entry: HolidayEntry = { date: '2026-08-09', name: 'National Day' }
    useAppStore.getState().setHolidays('SG-2026', [entry])
    expect(useAppStore.getState().holidays['SG-2026']).toEqual([entry])
  })
  it('replaceAll swaps persisted state', () => {
    useAppStore.getState().replaceAll({ trips: [trip], siteOverrides: [], settings: { ...DEFAULT_SETTINGS, leaveBudget: { 2026: 40 } } })
    expect(useAppStore.getState().trips).toHaveLength(1)
    expect(useAppStore.getState().settings.leaveBudget[2026]).toBe(40)
  })
})

it('defaults theme to dark', () => {
  expect(DEFAULT_SETTINGS.theme).toBe('dark')
})
