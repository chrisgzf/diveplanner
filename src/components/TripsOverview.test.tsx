import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('does not render the Copy Summary button in the empty state', () => {
    render(<TripsOverview onSelect={() => {}} />)
    expect(screen.queryByRole('button', { name: /copy summary/i })).not.toBeInTheDocument()
  })
})

describe('TripsOverview copy summary', () => {
  it('copies a formatted, numbered summary with status suffix to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    // Fri 7 Aug - Tue 11 Aug 2026: 3 leave days (see comment above)
    useAppStore.setState({ trips: [baseTrip({ id: 'a', label: 'National Day LWE', status: 'confirmed', estimatedDives: 9 })] })
    render(<TripsOverview onSelect={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /copy summary/i }))
    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0][0]).toBe(
      'Here is my trip plan so far.\n\n1. National Day LWE (confirmed)\n7 Aug 2026 – 11 Aug 2026 · Amed · 9 dives · 3 days leave',
    )
  })

  it('numbers multiple trips in start-date order, separated by a blank line', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    useAppStore.setState({
      trips: [
        baseTrip({ id: 'b', label: 'Italy Trip', status: 'wishlist', type: 'non-dive', startDate: '2026-10-12', endDate: '2026-10-28', customLocation: 'Italy' }),
        baseTrip({ id: 'a', label: 'National Day LWE', status: 'confirmed', estimatedDives: 9 }),
      ],
    })
    render(<TripsOverview onSelect={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /copy summary/i }))
    expect(writeText.mock.calls[0][0]).toBe(
      'Here is my trip plan so far.\n\n' +
        '1. National Day LWE (confirmed)\n7 Aug 2026 – 11 Aug 2026 · Amed · 9 dives · 3 days leave\n\n' +
        '2. Italy Trip (wishlist)\n12 Oct 2026 – 28 Oct 2026 · Italy · 13 days leave',
    )
  })

  it('omits dive count, leave, and location segments per the same rules as the visible rows', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    // Sat 8 Aug - Sun 9 Aug 2026: weekend only (0 leave days), non-dive (no dive count), no location set
    useAppStore.setState({
      trips: [baseTrip({ id: 'c', label: 'Rest days', type: 'non-dive', startDate: '2026-08-08', endDate: '2026-08-09', customLocation: undefined })],
    })
    render(<TripsOverview onSelect={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /copy summary/i }))
    expect(writeText.mock.calls[0][0]).toBe(
      'Here is my trip plan so far.\n\n1. Rest days (planned)\n8 Aug 2026 – 9 Aug 2026',
    )
  })
})
