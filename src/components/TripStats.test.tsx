import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TripStats from './TripStats'
import type { Trip } from '@/types'

const baseTrip = (overrides: Partial<Trip>): Trip => ({
  id: 'id',
  label: 'Trip',
  startDate: '2026-07-01',
  endDate: '2026-07-02',
  type: 'fun-dive',
  status: 'planned',
  bookings: [],
  ...overrides,
})

describe('TripStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts trips/dives planned from upcoming trips only, excluding past trips', () => {
    const trips: Trip[] = [
      baseTrip({ id: 'a', startDate: '2026-07-10', endDate: '2026-07-12', estimatedDives: 5 }),
      baseTrip({ id: 'b', startDate: '2026-08-01', endDate: '2026-08-03', estimatedDives: 3 }),
      baseTrip({ id: 'c', startDate: '2026-06-01', endDate: '2026-06-05', estimatedDives: 100 }), // past
    ]
    render(<TripStats trips={trips} />)
    expect(screen.getByText('Trips planned').previousElementSibling?.textContent).toBe('2')
    expect(screen.getByText('Dives planned').previousElementSibling?.textContent).toBe('8')
  })

  it('shows days until the next upcoming trip', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-07-10', endDate: '2026-07-12' })]
    render(<TripStats trips={trips} />)
    expect(screen.getByText('Days until next trip').previousElementSibling?.textContent).toBe('8')
  })

  it('omits the "days until next trip" card when there are no upcoming trips', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-05' })]
    render(<TripStats trips={trips} />)
    expect(screen.queryByText('Days until next trip')).not.toBeInTheDocument()
  })

  it('omits the "dives done" card when past dives sum to 0', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-05', type: 'non-dive' })]
    render(<TripStats trips={trips} />)
    expect(screen.queryByText('Dives done')).not.toBeInTheDocument()
  })

  it('sums dives done from past trips when greater than 0', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-05', estimatedDives: 7 })]
    render(<TripStats trips={trips} />)
    expect(screen.getByText('Dives done').previousElementSibling?.textContent).toBe('7')
  })
})
