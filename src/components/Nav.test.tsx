import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => useAppStore.setState({ settings: DEFAULT_SETTINGS }))

describe('Nav', () => {
  it('renders Planner and Locations links', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Planner' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /locations/i })).toBeInTheDocument()
  })

  it('renders nav items including settings, share, and a theme toggle', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/share/i)).toBeInTheDocument()
  })

  it('links the DivePlanner logo to the planner page', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'DivePlanner' })).toHaveAttribute('href', '/')
  })
})
