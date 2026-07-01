# Calendar Click-Through, Nav Logo, Notes Contrast, Share Trip Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make trip date-range cells in the calendar clickable (not just the bar below), link the nav logo to the Planner page, fix a hardcoded white note box that's blinding in dark mode, and add a read-only trip-detail dialog so viewers of a shared link can see booking-checklist details instead of just a colored date range.

**Architecture:** Four independent fixes against the existing DivePlanner React app (Bun + Vite + TS strict + Zustand + Tailwind + shadcn/Radix). Three are small, targeted edits to existing components. The fourth (share-page trip detail) adds one new presentational component (`TripDetailDialog`) and wires it into `SharePage`, reusing the existing `CalendarView`/`MonthGrid`/`TripBlock` click-handling plumbing (`onTripClick` already exists as a prop end-to-end; it's just not fully wired up yet).

**Tech Stack:** React 18, TypeScript strict, Vitest + @testing-library/react + @testing-library/user-event, Zustand, date-fns, shadcn/ui (Radix) `Dialog`, Tailwind v3 semantic color tokens.

## Global Constraints

- Bun only — use `bun run test`, `bun run build`, never npm/pnpm/yarn.
- Platform is Windows 11 — use the Bash tool (POSIX) for all shell commands, not PowerShell.
- TypeScript strict mode — no `any`, no unchecked nulls.
- `@/*` path alias → `src/*`.
- Semantic Tailwind color tokens only (`bg-surface-elevated`, `border-line`, `text-muted`, etc.) — never hardcoded colors like `bg-white`.
- shadcn components (`Dialog`, etc.) are already installed in this repo — never hand-write replacement markup for an installed primitive; import from `@/components/ui/*`.
- Commit after every task, conventional commit message ending with `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Spec reference: `docs/superpowers/specs/2026-07-02-calendar-nav-share-fixes-design.md`.

---

### Task 1: Click-through on covered day cells opens the trip

**Files:**
- Modify: `src/components/calendar/DayCell.tsx`
- Modify: `src/components/calendar/MonthGrid.tsx`
- Test: `src/components/calendar/CalendarView.test.tsx`

**Interfaces:**
- Consumes: `calendarWindow(now: Date): { year: number; month: number }[]` from `@/lib/dates` (already imported in the test file).
- Produces: a test helper `isoInFirstMonth(day: number): string` and a `trip: Trip` fixture, both defined at the top of `CalendarView.test.tsx` — later tasks (Task 4) reuse both by name.

- [ ] **Step 1: Write the failing tests**

Open `src/components/calendar/CalendarView.test.tsx` and replace its full contents with:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalendarView from './CalendarView'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'
import { calendarWindow } from '@/lib/dates'
import type { Trip } from '@/types'

function isoInFirstMonth(day: number): string {
  const { year, month } = calendarWindow(new Date())[0]
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const trip: Trip = {
  id: 'trip-1',
  label: 'Test Trip',
  startDate: isoInFirstMonth(5),
  endDate: isoInFirstMonth(6),
  type: 'fun-dive',
  status: 'planned',
  bookings: [],
}

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('CalendarView', () => {
  it('renders one month heading per calendar-window month', () => {
    render(<CalendarView />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(calendarWindow(new Date()).length)
  })

  it('clicking a start then an end day fires onRangeSelected', async () => {
    const onRangeSelected = vi.fn()
    render(<CalendarView onRangeSelected={onRangeSelected} />)
    const days = screen.getAllByRole('button', { name: /^day / })
    await userEvent.click(days[10])
    await userEvent.click(days[12])
    expect(onRangeSelected).toHaveBeenCalledTimes(1)
  })

  it('readOnly disables day selection', async () => {
    const onRangeSelected = vi.fn()
    render(<CalendarView readOnly onRangeSelected={onRangeSelected} />)
    const days = screen.getAllByRole('button', { name: /^day / })
    await userEvent.click(days[10])
    await userEvent.click(days[12])
    expect(onRangeSelected).not.toHaveBeenCalled()
  })

  it('clicking a day covered by a trip fires onTripClick, not onRangeSelected', async () => {
    useAppStore.setState({ trips: [trip] })
    const onTripClick = vi.fn()
    const onRangeSelected = vi.fn()
    render(<CalendarView onTripClick={onTripClick} onRangeSelected={onRangeSelected} />)
    await userEvent.click(screen.getByRole('button', { name: `day ${trip.startDate}` }))
    expect(onTripClick).toHaveBeenCalledWith(trip)
    expect(onRangeSelected).not.toHaveBeenCalled()
  })

  it('clicking a covered day still fires onTripClick when the calendar is read-only', async () => {
    useAppStore.setState({ trips: [trip] })
    const onTripClick = vi.fn()
    render(<CalendarView readOnly onTripClick={onTripClick} />)
    await userEvent.click(screen.getByRole('button', { name: `day ${trip.startDate}` }))
    expect(onTripClick).toHaveBeenCalledWith(trip)
  })
})
```

- [ ] **Step 2: Run tests to verify the two new ones fail**

Run: `bun run test -- CalendarView`
Expected: the two new tests ("clicking a day covered by a trip..." and "...still fires onTripClick when read-only") FAIL — currently, covered days are `disabled`, so the click never reaches any handler and `onTripClick` is never called. The three pre-existing tests still PASS.

- [ ] **Step 3: Fix `DayCell`'s disabled condition**

In `src/components/calendar/DayCell.tsx`, find:

```tsx
      disabled={readOnly || isCovered}
```

Replace with:

```tsx
      disabled={readOnly && !isCovered}
```

A covered day always has an action (view/edit the trip), so it's never disabled. A non-covered day is only disabled when the calendar is read-only (no new range selection allowed there).

- [ ] **Step 4: Wire `MonthGrid`'s day-click handler to branch on trip coverage**

In `src/components/calendar/MonthGrid.tsx`, find:

```tsx
              onMouseEnter={() => onDayEnter(d)} onClick={() => onDayClick(d)}
```

Replace with:

```tsx
              onMouseEnter={() => onDayEnter(d)}
              onClick={() => {
                const trip = covered.get(d)
                if (trip) onTripClick(trip)
                else onDayClick(d)
              }}
```

- [ ] **Step 5: Run tests to verify all five pass**

Run: `bun run test -- CalendarView`
Expected: all 5 tests PASS.

- [ ] **Step 6: Run the full suite and build**

Run: `bun run test`
Expected: all test files pass (88 tests, up from 86 — 2 new tests added this task).

Run: `bun run build`
Expected: clean `tsc -b && vite build`, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/calendar/DayCell.tsx src/components/calendar/MonthGrid.tsx src/components/calendar/CalendarView.test.tsx
git commit -m "$(cat <<'EOF'
fix: clicking a trip's date cells in the calendar opens the trip

The bar under each month already opened the trip on click; the highlighted
date cells covering the same trip did nothing because DayCell disabled
itself whenever a day was covered. MonthGrid now routes a covered day's
click to onTripClick instead of the range-selection handler, in both
editable and read-only calendars.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: "DivePlanner" nav logo links to the Planner page

**Files:**
- Modify: `src/components/Nav.tsx`
- Test: `src/components/Nav.test.tsx`

**Interfaces:** none — self-contained, no dependency on other tasks.

- [ ] **Step 1: Write the failing test**

Open `src/components/Nav.test.tsx` and add a new `it` inside the existing `describe('Nav', ...)` block, after the last one:

```tsx
  it('links the DivePlanner logo to the planner page', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'DivePlanner' })).toHaveAttribute('href', '/')
  })
```

The full file should now read:

```tsx
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
    expect(screen.getByRole('link', { name: /planner/i })).toBeInTheDocument()
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- Nav.test`
Expected: FAIL — no element with role `link` and accessible name `DivePlanner` exists yet (it's a plain `<span>`).

- [ ] **Step 3: Make the logo a link**

In `src/components/Nav.tsx`, change the import:

```tsx
import { NavLink } from 'react-router-dom'
```

to:

```tsx
import { Link, NavLink } from 'react-router-dom'
```

Then find:

```tsx
        <span className="font-display text-xl font-bold text-primary">DivePlanner</span>
```

Replace with:

```tsx
        <Link to="/" className="font-display text-xl font-bold text-primary">DivePlanner</Link>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test -- Nav.test`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.tsx src/components/Nav.test.tsx
git commit -m "$(cat <<'EOF'
fix: link the DivePlanner nav logo to the planner page

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Fix hardcoded white note box in dark mode

**Files:**
- Modify: `src/routes/LocationsPage.tsx`
- Test: `src/routes/LocationsPage.test.tsx`

**Interfaces:** none — self-contained, no dependency on other tasks.

- [ ] **Step 1: Write the failing test**

Open `src/routes/LocationsPage.test.tsx` and replace its full contents with:

```tsx
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
    await userEvent.click(screen.getByText('Malapascua'))
    const note = screen.getByText(/typhoon risk/i)
    expect(note.className).toContain('bg-surface-elevated')
    expect(note.className).not.toContain('bg-white')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- LocationsPage.test`
Expected: the new test FAILS on `expect(note.className).not.toContain('bg-white')` (it currently does contain `bg-white`).

- [ ] **Step 3: Fix the hardcoded background**

In `src/routes/LocationsPage.tsx`, find:

```tsx
      {selected.currentNote && <p className="rounded-md border border-line bg-white p-3 text-base text-muted">{selected.currentNote}</p>}
```

Replace with:

```tsx
      {selected.currentNote && <p className="rounded-md border border-line bg-surface-elevated p-3 text-base text-muted">{selected.currentNote}</p>}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test -- LocationsPage.test`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/routes/LocationsPage.tsx src/routes/LocationsPage.test.tsx
git commit -m "$(cat <<'EOF'
fix: hardcoded bg-white on location note box unreadable in dark mode

A leftover the earlier dark-mode audit missed. Swapped to bg-surface-elevated,
matching the identical-purpose "Dive conditions" box in TripPanel.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Trip blocks are clickable on read-only calendars

**Files:**
- Modify: `src/components/calendar/TripBlock.tsx`
- Modify: `src/components/calendar/MonthGrid.tsx`
- Test: `src/components/calendar/CalendarView.test.tsx`

**Interfaces:**
- Consumes: `trip: Trip` fixture and `isoInFirstMonth` helper from Task 1 (already present at the top of `CalendarView.test.tsx` — do not redefine them).
- Produces: `TripBlock`'s public props become `{ trip: Trip; onClick?: () => void }` (the `readOnly` prop is removed). No other task consumes `TripBlock` directly (`MonthGrid` is the only caller), so this is safe to change.

- [ ] **Step 1: Write the failing test**

Open `src/components/calendar/CalendarView.test.tsx` and add a new `it` inside `describe('CalendarView', ...)`, after the last one added in Task 1:

```tsx
  it('trip block click fires onTripClick even when the calendar is read-only', async () => {
    useAppStore.setState({ trips: [trip] })
    const onTripClick = vi.fn()
    render(<CalendarView readOnly onTripClick={onTripClick} />)
    await userEvent.click(screen.getByRole('button', { name: /test trip/i }))
    expect(onTripClick).toHaveBeenCalledWith(trip)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- CalendarView`
Expected: the new test FAILS — `TripBlock` is currently `disabled={readOnly}`, so clicking it does nothing.

- [ ] **Step 3: Remove the `readOnly` disable from `TripBlock`**

In `src/components/calendar/TripBlock.tsx`, find:

```tsx
export default function TripBlock({ trip, onClick, readOnly }: { trip: Trip; onClick?: () => void; readOnly?: boolean }) {
  const locations = useMergedLocations()
  const place = trip.locationId ? locations.find((l) => l.id === trip.locationId)?.name : trip.customLocation
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={onClick}
```

Replace with:

```tsx
export default function TripBlock({ trip, onClick }: { trip: Trip; onClick?: () => void }) {
  const locations = useMergedLocations()
  const place = trip.locationId ? locations.find((l) => l.id === trip.locationId)?.name : trip.customLocation
  return (
    <button
      type="button"
      onClick={onClick}
```

- [ ] **Step 4: Stop passing `readOnly` into `TripBlock` from `MonthGrid`**

In `src/components/calendar/MonthGrid.tsx`, find:

```tsx
          {monthTrips.map((t) => <TripBlock key={t.id} trip={t} readOnly={readOnly} onClick={() => onTripClick(t)} />)}
```

Replace with:

```tsx
          {monthTrips.map((t) => <TripBlock key={t.id} trip={t} onClick={() => onTripClick(t)} />)}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `bun run test -- CalendarView`
Expected: PASS, all 6 tests.

- [ ] **Step 6: Run the full suite and build**

Run: `bun run test`
Expected: all tests pass.

Run: `bun run build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/calendar/TripBlock.tsx src/components/calendar/MonthGrid.tsx src/components/calendar/CalendarView.test.tsx
git commit -m "$(cat <<'EOF'
fix: trip blocks stay clickable on read-only calendars

TripBlock never mutates state itself, it only calls the onClick its parent
gave it, so disabling it based on readOnly served no purpose beyond
blocking the click entirely. This clears the way for the share page to
open a read-only trip detail view on click.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `TripDetailDialog` — read-only trip detail component

**Files:**
- Create: `src/components/TripDetailDialog.tsx`
- Create: `src/components/TripDetailDialog.test.tsx`

**Interfaces:**
- Produces: `export default function TripDetailDialog({ trip, locations, onClose }: { trip: Trip | null; locations: Location[]; onClose: () => void })`. Task 6 imports this exact component and prop shape from `@/components/TripDetailDialog`.
- Consumes: `formatWeekday(date: ISODate): string` from `@/lib/dates` (existing), `typeColor: Record<Trip['type'], string>` exported from `@/components/calendar/TripBlock` (existing, already exported), shadcn `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle` from `@/components/ui/dialog` (existing), `cn` from `@/lib/cn` (existing).

- [ ] **Step 1: Write the failing test**

Create `src/components/TripDetailDialog.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- TripDetailDialog`
Expected: FAIL — `src/components/TripDetailDialog.tsx` doesn't exist yet (module not found).

- [ ] **Step 3: Create the component**

Create `src/components/TripDetailDialog.tsx`:

```tsx
import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/cn'
import { formatWeekday } from '@/lib/dates'
import { typeColor } from '@/components/calendar/TripBlock'
import type { Trip, Location } from '@/types'

function fullDate(date: string): string {
  return `${formatWeekday(date)}, ${format(parseISO(date), 'd MMM yyyy')}`
}

export default function TripDetailDialog({ trip, locations, onClose }: {
  trip: Trip | null
  locations: Location[]
  onClose: () => void
}) {
  if (!trip) return null
  const place = trip.locationId ? locations.find((l) => l.id === trip.locationId)?.name : trip.customLocation

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{trip.label}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-base">
          <div>
            <div>{fullDate(trip.startDate)}</div>
            <div>{fullDate(trip.endDate)}</div>
          </div>
          {place && <div className="text-muted">{place}</div>}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', typeColor[trip.type])} />
              {trip.type}
            </span>
            <span className="flex items-center gap-1.5">
              {trip.status === 'confirmed' && <Check className="h-3.5 w-3.5" />}
              {trip.status}
            </span>
          </div>
          {trip.bookings.length > 0 && (
            <div className="space-y-1">
              <div className="font-semibold">Booking checklist</div>
              {trip.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-2">
                  {b.booked
                    ? <Check className="h-4 w-4 shrink-0 text-good" />
                    : <span className="h-4 w-4 shrink-0 rounded-full border border-line" />}
                  <span className="text-muted">{b.category}</span>
                  {b.label && <span>{b.label}</span>}
                </div>
              ))}
            </div>
          )}
          {trip.notes && (
            <div className="rounded-md border border-line bg-surface-elevated p-3 text-muted">{trip.notes}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test -- TripDetailDialog`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Run the full suite and build**

Run: `bun run test`
Expected: all tests pass.

Run: `bun run build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/TripDetailDialog.tsx src/components/TripDetailDialog.test.tsx
git commit -m "$(cat <<'EOF'
feat: add read-only TripDetailDialog component

Presentational dialog showing a trip's dates, location, type/status,
booking checklist, and notes with no editable controls. No leave/holiday
breakdown — that needs live holiday data for the plan owner's country,
which isn't part of the share payload and isn't worth fetching for a
read-only view.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Wire `TripDetailDialog` into the share page

**Files:**
- Modify: `src/routes/SharePage.tsx`
- Test: `src/routes/SharePage.test.tsx`

**Interfaces:**
- Consumes: `TripDetailDialog` from Task 5 (`@/components/TripDetailDialog`), `mergeLocations(overrides: Location[]): Location[]` from `@/lib/locations` (existing).

- [ ] **Step 1: Write the failing test**

Open `src/routes/SharePage.test.tsx` and add these imports at the top (after the existing ones):

```tsx
import type { Trip, Location } from '@/types'
```

Then add a new `it` inside `describe('SharePage', ...)`, after the last one:

```tsx
  it('opens a read-only trip detail dialog on click, resolving location from the shared plan', async () => {
    const customLoc: Location = {
      id: 'custom-1', name: 'Secret Reef', country: 'Nowhere', difficulty: 'advanced',
      highlights: [], seasonality: [],
    }
    const sharedTrip: Trip = {
      id: 'shared-2', label: 'Secret Trip', startDate: '2026-05-15', endDate: '2026-05-18',
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
```

The full `SharePage.test.tsx` file should now read:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SharePage from './SharePage'
import { encodeShare } from '@/lib/share'
import { DEFAULT_SETTINGS } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import type { Trip, Location } from '@/types'

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
      id: 'shared-2', label: 'Secret Trip', startDate: '2026-05-15', endDate: '2026-05-18',
      type: 'fun-dive', status: 'confirmed', locationId: 'custom-1',
      bookings: [{ id: 'b1', category: 'dive-shop', label: 'Eco-diver Scuba', booked: true }],
    }
    const hash = encodeShare({ trips: [sharedTrip], siteOverrides: [customLoc], settings: DEFAULT_SETTINGS })
    useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
    renderAt(hash)
    await userEvent.click(screen.getByRole('button', { name: /secret trip/i }))
    expect(await screen.findByText('Secret Reef')).toBeInTheDocument()
    expect(screen.getByText('Eco-diver Scuba')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- SharePage.test`
Expected: the new test FAILS — clicking the trip block does nothing yet (`onTripClick` isn't wired on `SharePage`, and even if it were, there's no dialog to show).

- [ ] **Step 3: Wire `TripDetailDialog` into `SharePage`**

In `src/routes/SharePage.tsx`, change the imports at the top from:

```tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeShare } from '@/lib/share'
import { useAppStore } from '@/store/useAppStore'
import { useSyncTheme } from '@/hooks/useSyncTheme'
import CalendarView from '@/components/calendar/CalendarView'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import type { Trip } from '@/types'
```

to:

```tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeShare } from '@/lib/share'
import { useAppStore } from '@/store/useAppStore'
import { useSyncTheme } from '@/hooks/useSyncTheme'
import { mergeLocations } from '@/lib/locations'
import CalendarView from '@/components/calendar/CalendarView'
import TripDetailDialog from '@/components/TripDetailDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import type { Trip, Location } from '@/types'
```

Then find:

```tsx
      <main className="mx-auto max-w-5xl px-4 py-6">
        <SharedCalendar trips={shared.trips} />
      </main>
    </div>
  )
}

function SharedCalendar({ trips }: { trips: Trip[] }) {
  return <CalendarView readOnly trips={trips} holidays={{}} />
}
```

Replace with:

```tsx
      <main className="mx-auto max-w-5xl px-4 py-6">
        <SharedCalendar trips={shared.trips} siteOverrides={shared.siteOverrides} />
      </main>
    </div>
  )
}

function SharedCalendar({ trips, siteOverrides }: { trips: Trip[]; siteOverrides: Location[] }) {
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null)
  const locations = mergeLocations(siteOverrides)
  return (
    <>
      <CalendarView readOnly trips={trips} holidays={{}} onTripClick={setViewingTrip} />
      <TripDetailDialog trip={viewingTrip} locations={locations} onClose={() => setViewingTrip(null)} />
    </>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test -- SharePage.test`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Run the full suite and build**

Run: `bun run test`
Expected: all tests pass.

Run: `bun run build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/routes/SharePage.tsx src/routes/SharePage.test.tsx
git commit -m "$(cat <<'EOF'
feat: read-only trip detail dialog on shared links

Clicking a trip's date cells or its bar on a shared link now opens a
read-only detail dialog (name, dates, location, type/status, booking
checklist, notes). Location names resolve against the shared plan's own
siteOverrides via mergeLocations(), not the viewer's local store, so a
custom location the viewer's own store doesn't have still resolves
correctly.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Manual Verification (after all tasks)

Run the dev server and check in a browser:

```bash
bun run dev
```

1. On the Planner page, create/view a trip that spans several days. Click on one of the highlighted date cells (not the bar below) — it should open the trip's edit panel, same as clicking the bar.
2. Click the "DivePlanner" text in the top-left of the nav bar from any page — it should navigate to the Planner page (`/`).
3. Go to Locations, pick a location that has a note (e.g. Malapascua, Tioman, Sipadan), and confirm the note box is no longer a jarring white box in dark mode.
4. Use the Share button to generate a share link, open it (in a new tab/incognito so the local store differs), and click a trip's date cells or its bar — a read-only dialog should open showing the trip's dates, location, type/status, booking checklist, and notes, with no inputs or checkboxes. Confirm "Make this mine" still works and that merely viewing the link didn't change your own settings.
