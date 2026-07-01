import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.getAllByText('Malapascua').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /plan a trip here/i })).toBeInTheDocument()
  })

  it('hides Export my overrides when there are none', () => {
    render(<MemoryRouter><LocationsPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /export my overrides/i })).not.toBeInTheDocument()
  })

  it('renders the current-conditions note without a hardcoded white background', async () => {
    render(<MemoryRouter><LocationsPage /></MemoryRouter>)
    const malapascuaButton = screen.getAllByText('Malapascua')[0]
    await userEvent.click(malapascuaButton)
    const notes = screen.getAllByText(/typhoon risk/i)
    const note = notes[0]
    expect(note.className).toContain('bg-surface-elevated')
    expect(note.className).not.toContain('bg-white')
  })
})
