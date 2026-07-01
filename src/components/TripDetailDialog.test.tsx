import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripDetailDialog from './TripDetailDialog'
import type { Trip, Location } from '@/types'

const location: Location = {
  id: 'loc-1', name: 'Malapascua', country: 'Philippines', difficulty: 'intermediate',
  highlights: [], seasonality: [],
}

const trip: Trip = {
  id: 't1',
  label: 'Malapascua May 2026',
  startDate: '2026-05-15',
  endDate: '2026-05-18',
  type: 'fun-dive',
  status: 'confirmed',
  locationId: 'loc-1',
  bookings: [
    { id: 'b1', category: 'dive-shop', label: 'Eco-diver Scuba', booked: true },
    { id: 'b2', category: 'flight', label: '', booked: false },
  ],
  notes: 'Bring reef-safe sunscreen',
}

describe('TripDetailDialog', () => {
  it('renders nothing when trip is null', () => {
    render(<TripDetailDialog trip={null} locations={[location]} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders trip details read-only, with no editable controls', () => {
    render(<TripDetailDialog trip={trip} locations={[location]} onClose={() => {}} />)
    expect(screen.getByText('Malapascua May 2026')).toBeInTheDocument()
    expect(screen.getByText('Friday, 15 May 2026')).toBeInTheDocument()
    expect(screen.getByText('Monday, 18 May 2026')).toBeInTheDocument()
    expect(screen.getByText('Malapascua')).toBeInTheDocument()
    expect(screen.getByText('fun-dive')).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()
    expect(screen.getByText('Eco-diver Scuba')).toBeInTheDocument()
    expect(screen.getByText('flight')).toBeInTheDocument()
    expect(screen.getByText(/reef-safe sunscreen/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('resolves a custom location when there is no locationId', () => {
    const customTrip: Trip = { ...trip, locationId: undefined, customLocation: 'Secret Reef' }
    render(<TripDetailDialog trip={customTrip} locations={[location]} onClose={() => {}} />)
    expect(screen.getByText('Secret Reef')).toBeInTheDocument()
  })

  it('calls onClose when the dialog is dismissed', async () => {
    const onClose = vi.fn()
    render(<TripDetailDialog trip={trip} locations={[location]} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
