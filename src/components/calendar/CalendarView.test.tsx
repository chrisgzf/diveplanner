import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalendarView from './CalendarView'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'
import { calendarWindow } from '@/lib/dates'
import type { Trip } from '@/types'

function isoInFirstMonth(day: number): string {
  const { year, month } = calendarWindow(new Date())[0]
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const trip: Trip = {
  id: 'trip-1',
  label: 'Test Trip',
  startDate: isoInFirstMonth(5),
  endDate: isoInFirstMonth(6),
  type: 'fun-dive',
  status: 'planned',
  bookings: [],
}

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

  it('clicking a day covered by a trip fires onTripClick, not onRangeSelected', async () => {
    useAppStore.setState({ trips: [trip] })
    const onTripClick = vi.fn()
    const onRangeSelected = vi.fn()
    render(<CalendarView onTripClick={onTripClick} onRangeSelected={onRangeSelected} />)
    await userEvent.click(screen.getByRole('button', { name: `day ${trip.startDate}` }))
    expect(onTripClick).toHaveBeenCalledWith(trip)
    expect(onRangeSelected).not.toHaveBeenCalled()
  })

  it('clicking a covered day still fires onTripClick when the calendar is read-only', async () => {
    useAppStore.setState({ trips: [trip] })
    const onTripClick = vi.fn()
    render(<CalendarView readOnly onTripClick={onTripClick} />)
    await userEvent.click(screen.getByRole('button', { name: `day ${trip.startDate}` }))
    expect(onTripClick).toHaveBeenCalledWith(trip)
  })
})
