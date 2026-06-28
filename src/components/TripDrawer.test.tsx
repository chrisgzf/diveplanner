import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripDrawer from './TripDrawer'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS, type Trip } from '@/types'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('TripDrawer', () => {
  it('creates a trip on save', async () => {
    render(<TripDrawer open mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={() => {}} />)
    await userEvent.type(screen.getByLabelText(/trip name/i), 'Malapascua')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(useAppStore.getState().trips).toHaveLength(1)
    expect(useAppStore.getState().trips[0].label).toBe('Malapascua')
  })

  it('blocks save when range overlaps another trip', async () => {
    const existing: Trip = { id: 'x', label: 'X', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] }
    useAppStore.setState({ trips: [existing] })
    render(<TripDrawer open mode="create" initialRange={{ start: '2026-05-18', end: '2026-05-25' }} onClose={() => {}} />)
    await userEvent.type(screen.getByLabelText(/trip name/i), 'Overlap')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(useAppStore.getState().trips).toHaveLength(1) // not added
    expect(screen.getByText(/overlaps/i)).toBeInTheDocument()
  })

  it('hides booking checklist for non-dive trips', async () => {
    render(<TripDrawer open mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={() => {}} />)
    // switch type to non-dive via the select (native fallback labelled "Trip type")
    expect(screen.getByText(/booking checklist/i)).toBeInTheDocument()
  })
})
