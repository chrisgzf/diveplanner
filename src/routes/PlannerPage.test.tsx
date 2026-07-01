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

// Mock TripPanel so it doesn't need the full store/form setup; capture props for assertions
let tripPanelProps: Record<string, unknown> | null = null
vi.mock('@/components/TripPanel', () => ({
  default: (props: Record<string, unknown>) => {
    tripPanelProps = props
    return <div data-testid="trip-panel">TripPanel</div>
  },
}))

// Mock TripsOverview so mobile tab tests can select a trip without real store/location data
vi.mock('@/components/TripsOverview', () => ({
  default: ({ onSelect }: { onSelect: (t: unknown) => void }) => (
    <button
      onClick={() =>
        onSelect({
          id: 'trip-1',
          label: 'Test Trip',
          startDate: '2026-07-01',
          endDate: '2026-07-02',
          type: 'fun-dive',
          status: 'planned',
          bookings: [],
        })
      }
    >
      Select Trip From Overview
    </button>
  ),
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

  it('passes showClose to TripPanel on desktop', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: makeMatchMedia(true),
    })

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>,
    )

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Select Range' }))
    })

    expect(tripPanelProps?.showClose).toBe(true)
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

  it('mobile: defaults to Planner tab, switches to Trips tab, and selecting a trip opens the drawer without changing the active tab', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: makeMatchMedia(false),
    })

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>,
    )

    // Defaults to Planner: calendar's mocked button is visible, Trips tab content is not mounted
    expect(screen.getByRole('button', { name: 'Select Range' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Select Trip From Overview' })).not.toBeInTheDocument()

    // Switch to Trips tab
    await userEvent.click(screen.getByRole('tab', { name: 'Trips' }))
    expect(screen.getByRole('tab', { name: 'Trips' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('button', { name: 'Select Trip From Overview' })).toBeInTheDocument()

    // Selecting a trip from the Trips tab opens the drawer; tab stays on Trips.
    // The Sheet's Radix Dialog marks the rest of the page aria-hidden while open,
    // so this query needs `hidden: true` to still find the (visually present) tab.
    await userEvent.click(screen.getByRole('button', { name: 'Select Trip From Overview' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Trips', hidden: true })).toHaveAttribute('data-state', 'active')
  })
})
