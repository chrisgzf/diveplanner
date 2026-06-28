import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalendarView from './CalendarView'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'
import { calendarWindow } from '@/lib/dates'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('CalendarView', () => {
  it('renders one month heading per calendar-window month', () => {
    render(<CalendarView />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(calendarWindow(new Date()).length)
  })

  it('clicking a start then an end day fires onRangeSelected', async () => {
    const onRangeSelected = vi.fn()
    render(<CalendarView onRangeSelected={onRangeSelected} />)
    const days = screen.getAllByRole('button', { name: /^day / })
    await userEvent.click(days[10])
    await userEvent.click(days[12])
    expect(onRangeSelected).toHaveBeenCalledTimes(1)
  })

  it('readOnly disables day selection', async () => {
    const onRangeSelected = vi.fn()
    render(<CalendarView readOnly onRangeSelected={onRangeSelected} />)
    const days = screen.getAllByRole('button', { name: /^day / })
    await userEvent.click(days[10])
    await userEvent.click(days[12])
    expect(onRangeSelected).not.toHaveBeenCalled()
  })
})
