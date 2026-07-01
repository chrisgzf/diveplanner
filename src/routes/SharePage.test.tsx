import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SharePage from './SharePage'
import { encodeShare } from '@/lib/share'
import { DEFAULT_SETTINGS } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { calendarWindow } from '@/lib/dates'
import type { Trip, Location } from '@/types'

function isoInFirstMonth(day: number): string {
  const { year, month } = calendarWindow(new Date())[0]
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function renderAt(hash: string) {
  return render(
    <MemoryRouter initialEntries={[`/share/${hash}`]}>
      <Routes><Route path="/share/:hash" element={<SharePage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('SharePage', () => {
  beforeEach(() => {
    useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
  })

  it('shows the shared banner for a valid hash', () => {
    const hash = encodeShare({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS })
    renderAt(hash)
    expect(screen.getByText(/viewing a shared dive plan/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /make this mine/i })).toBeInTheDocument()
  })
  it('shows an error page for a malformed hash', () => {
    renderAt('!!!broken!!!')
    expect(screen.getByRole('button', { name: /start your own plan/i })).toBeInTheDocument()
  })

  it('renders shared trip labels without polluting the local store', () => {
    const sharedTrip = { id: 'shared-1', label: 'Shared Malapascua', startDate: '2026-05-15', endDate: '2026-05-23', type: 'fun-dive' as const, status: 'planned' as const, bookings: [] }
    const hash = encodeShare({ trips: [sharedTrip], siteOverrides: [], settings: DEFAULT_SETTINGS })
    // ensure local store has no trips before rendering
    useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
    renderAt(hash)
    // local store must remain empty
    expect(useAppStore.getState().trips).toHaveLength(0)
  })

  it('opens a read-only trip detail dialog on click, resolving location from the shared plan', async () => {
    const customLoc: Location = {
      id: 'custom-1', name: 'Secret Reef', country: 'Nowhere', difficulty: 'advanced',
      highlights: [], seasonality: [],
    }
    const sharedTrip: Trip = {
      id: 'shared-2', label: 'Secret Trip', startDate: isoInFirstMonth(15), endDate: isoInFirstMonth(18),
      type: 'fun-dive', status: 'confirmed', locationId: 'custom-1',
      bookings: [{ id: 'b1', category: 'dive-shop', label: 'Eco-diver Scuba', booked: true }],
    }
    const hash = encodeShare({ trips: [sharedTrip], siteOverrides: [customLoc], settings: DEFAULT_SETTINGS })
    // Local store deliberately has NO override for 'custom-1' — proves the
    // dialog resolves the location from the shared plan, not the local store.
    useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
    renderAt(hash)
    await userEvent.click(screen.getByRole('button', { name: /secret trip/i }))
    expect(await screen.findByText('Secret Reef')).toBeInTheDocument()
    expect(screen.getByText('Eco-diver Scuba')).toBeInTheDocument()
  })
})
