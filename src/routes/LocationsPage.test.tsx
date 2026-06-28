import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LocationsPage from './LocationsPage'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('LocationsPage', () => {
  it('lists bundled locations and shows detail on select', () => {
    render(<MemoryRouter><LocationsPage /></MemoryRouter>)
    expect(screen.getByText('Malapascua')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /plan a trip here/i })).toBeInTheDocument()
  })

  it('hides Export my overrides when there are none', () => {
    render(<MemoryRouter><LocationsPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /export my overrides/i })).not.toBeInTheDocument()
  })
})
