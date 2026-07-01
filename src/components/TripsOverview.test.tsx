import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import TripsOverview from './TripsOverview'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS, type Trip } from '@/types'

const baseTrip = (overrides: Partial<Trip>): Trip => ({
  id: 'id',
  label: 'Trip',
  startDate: '2026-08-07',
  endDate: '2026-08-11',
  type: 'fun-dive',
  status: 'planned',
  bookings: [],
  customLocation: 'Amed',
  ...overrides,
})

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('TripsOverview rich rows', () => {
  it('appends dive count and leave days to the subtitle', () => {
    // Fri 7 Aug - Tue 11 Aug 2026: Fri/Mon/Tue are weekdays (3 leave days), Sat/Sun are weekend
    useAppStore.setState({ trips: [baseTrip({ id: 'a', estimatedDives: 9 })] })
    const { container } = render(<TripsOverview onSelect={() => {}} />)
    expect(container.textContent).toContain('9 dives')
    expect(container.textContent).toContain('3 days leave')
  })

  it('omits the dive count for non-dive trips', () => {
    useAppStore.setState({ trips: [baseTrip({ id: 'b', type: 'non-dive' })] })
    const { container } = render(<TripsOverview onSelect={() => {}} />)
    expect(container.textContent).not.toMatch(/dive/)
  })

  it('omits the leave segment for a trip with zero leave days', () => {
    // Sat 8 Aug - Sun 9 Aug 2026: both weekend days, 0 leave days
    useAppStore.setState({ trips: [baseTrip({ id: 'c', startDate: '2026-08-08', endDate: '2026-08-09', estimatedDives: 6 })] })
    const { container } = render(<TripsOverview onSelect={() => {}} />)
    expect(container.textContent).toContain('6 dives')
    expect(container.textContent).not.toMatch(/leave/)
  })
})
