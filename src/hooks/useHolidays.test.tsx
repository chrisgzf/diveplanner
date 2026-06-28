import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHolidays } from './useHolidays'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => {
  useAppStore.setState({ settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('useHolidays', () => {
  it('fetches current and next year into the session slice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-08-09' }] }))
    renderHook(() => useHolidays())
    await waitFor(() => {
      const keys = Object.keys(useAppStore.getState().holidays)
      expect(keys.length).toBe(2)
    })
  })
  it('sets error flag on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    renderHook(() => useHolidays())
    await waitFor(() => expect(useAppStore.getState().holidaysError).toBe(true))
  })
})
