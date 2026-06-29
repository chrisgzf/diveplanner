import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PlannerPage from './PlannerPage'

// Mock CalendarView so the test can trigger range selection without a full calendar render
vi.mock('@/components/calendar/CalendarView', () => ({
  default: ({
    onRangeSelected,
  }: {
    onRangeSelected: (start: string, end: string) => void
    onTripClick: (t: unknown) => void
  }) => (
    <button onClick={() => onRangeSelected('2026-07-01', '2026-07-05')}>Select Range</button>
  ),
}))

// Mock TripPanel so it doesn't need the full store/form setup
vi.mock('@/components/TripPanel', () => ({
  default: () => <div data-testid="trip-panel">TripPanel</div>,
}))

function makeMatchMedia(matches: boolean) {
  return (query: string) => ({
    matches: query === '(min-width: 1024px)' ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

describe('PlannerPage desktop/mobile gating', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia })
  })

  it('does not mount SheetContent (role="dialog") on desktop', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: makeMatchMedia(true),
    })

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>,
    )

    // Trigger a range selection so open=true (would show TripDrawer on mobile)
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Select Range' }))
    })

    // Desktop: TripPanel should be visible, Sheet dialog should NOT be in document
    expect(screen.getByTestId('trip-panel')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mounts TripDrawer (role="dialog") on mobile when open', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: makeMatchMedia(false),
    })

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>,
    )

    // Before selection: dialog should not be open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Trigger a range selection
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Select Range' }))
    })

    // Mobile: Sheet dialog should be present
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
