# Planner Page UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four independent UI polish fixes on the Planner page: a dismissible desktop trip panel, mobile access to the "Planned trips" list via tabs, richer desktop trip rows (dive count + leave days), and a new aggregated stats strip (trips/dives planned, days to next trip, dives done).

**Architecture:** All four fixes live in the existing DivePlanner React app (Bun + Vite + TS strict + Zustand + Tailwind v3 + shadcn/Radix). Task 1 adds a `showClose` prop to the existing `TripPanel`. Task 2 extends `TripsOverview`'s existing subtitle line. Task 3 adds one new presentational component, `TripStats` (built on a newly-added shadcn `Card`). Task 4 wires `TripStats` into both call sites and adds a shadcn `Tabs` control to `PlannerPage`'s mobile branch so mobile can reach the trips list for the first time.

**Tech Stack:** React 18, TypeScript strict, Vitest + @testing-library/react + @testing-library/user-event, Zustand, date-fns, shadcn/ui (Radix) `Tabs`/`Card`/`Button`, Tailwind v3 semantic color tokens.

## Global Constraints

- Bun only — use `bun run test`, `bun run build`, never npm/pnpm/yarn.
- Platform is Windows 11 — use the Bash tool (POSIX) for all shell commands, not PowerShell.
- TypeScript strict mode (`noUnusedLocals`/`noUnusedParameters` are both on — no unused props or variables).
- `@/*` path alias → `src/*`.
- **shadcn skill is mandatory for UI work** — load it (Skill tool) before adding/editing shadcn components. Add new components with `bunx --bun shadcn@latest add <name>` (preview first with `--dry-run`), never hand-write component source.
- Semantic Tailwind color tokens only (`bg-surface-elevated`, `border-line`, `text-muted`, etc.) — never hardcoded colors like `bg-white`.
- Commit after every task, conventional commit message ending with `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Spec reference: `docs/superpowers/specs/2026-07-02-planner-ui-polish-design.md`.

**Known deviation from spec (apply in Task 3):** the spec's §4 gives `TripStats` the props `{ trips: Trip[]; holidays: Record<string, HolidayEntry[]> }`. None of the four stats it computes (trips planned, dives planned, days until next trip, dives done) need holiday data — only `trips`. Under this repo's `noUnusedParameters: true`, an accepted-but-unread `holidays` prop is a type error, not a warning. Task 3 drops `holidays` from the props and updates the spec file in the same commit, per the "update the spec when you change behaviour" global rule.

---

### Task 1: Dismissible desktop trip panel

**Files:**
- Modify: `src/components/TripPanel.tsx`
- Modify: `src/routes/PlannerPage.tsx`
- Modify: `src/routes/PlannerPage.test.tsx`
- Test: `src/components/TripPanel.test.tsx` (new)

**Interfaces:**
- Produces: `TripPanel` gains prop `showClose?: boolean` (default `false`). When `true`, renders a close button and an Escape-key handler that both call the existing `onClose: () => void` prop.

- [ ] **Step 1: Write the failing tests**

Create `src/components/TripPanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripPanel from './TripPanel'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

vi.mock('@/components/ui/select', async () => {
  const { Children } = await import('react')
  const SelectTrigger = (_props: any) => null
  const SelectValue = () => null
  const SelectContent = ({ children }: any) => <>{children}</>
  const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>
  const Select = ({ value, onValueChange, children }: any) => {
    const arr = Children.toArray(children)
    const trigger = arr.find((c: any) => c.type === SelectTrigger) as any
    return (
      <select id={trigger?.props?.id} value={value} onChange={(e: any) => onValueChange(e.target.value)}>
        {arr.filter((c: any) => c.type !== SelectTrigger)}
      </select>
    )
  }
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('TripPanel showClose', () => {
  it('renders no close button by default', () => {
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('renders a close button that calls onClose when showClose is true', async () => {
    const onClose = vi.fn()
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={onClose} showClose />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on Escape when showClose is false', async () => {
    const onClose = vi.fn()
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on Escape when showClose is true', async () => {
    const onClose = vi.fn()
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={onClose} showClose />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- TripPanel`
Expected: all 4 tests FAIL — `TripPanel` has no `showClose` prop yet, so no close button exists and no Escape handler is attached.

- [ ] **Step 3: Add the `showClose` prop, close button, and Escape handler**

In `src/components/TripPanel.tsx`, add the `X` icon import at the top (after the existing `Select` import):

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
```

Find the component signature:

```tsx
export default function TripPanel({ mode, initialRange, trip, defaultLocationId, onClose }: {
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  onClose: () => void
}) {
```

Replace with:

```tsx
export default function TripPanel({ mode, initialRange, trip, defaultLocationId, showClose = false, onClose }: {
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  showClose?: boolean
  onClose: () => void
}) {
```

Find the first `useEffect` (the one seeding form state from `trip`/`initialRange`) and add a second `useEffect` immediately after it, before `const names = ...`:

```tsx
  useEffect(() => {
    if (!showClose) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showClose, onClose])
```

Find the header row:

```tsx
      <div className="mb-2"><h2 className="text-xl font-semibold">{mode === 'edit' ? 'Edit trip' : 'New trip'}</h2></div>
```

Replace with:

```tsx
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{mode === 'edit' ? 'Edit trip' : 'New trip'}</h2>
        {showClose && (
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- TripPanel`
Expected: all 4 tests PASS.

- [ ] **Step 5: Wire `showClose` from `PlannerPage`'s desktop aside**

In `src/routes/PlannerPage.tsx`, find:

```tsx
                <TripPanel key={editing?.id ?? `${pending?.start}-${pending?.end}`}
                  mode={mode} initialRange={pending ?? undefined} trip={editing ?? undefined}
                  defaultLocationId={defaultLocationId} onClose={close} />
```

Replace with:

```tsx
                <TripPanel key={editing?.id ?? `${pending?.start}-${pending?.end}`}
                  mode={mode} initialRange={pending ?? undefined} trip={editing ?? undefined}
                  defaultLocationId={defaultLocationId} showClose onClose={close} />
```

The `TripDrawer` (mobile) call site is untouched — it doesn't pass `showClose`, so it stays `false` there, and the mobile Sheet keeps handling its own dismiss chrome.

- [ ] **Step 6: Update `PlannerPage.test.tsx` to assert the prop is passed**

In `src/routes/PlannerPage.test.tsx`, find:

```tsx
// Mock TripPanel so it doesn't need the full store/form setup
vi.mock('@/components/TripPanel', () => ({
  default: () => <div data-testid="trip-panel">TripPanel</div>,
}))
```

Replace with:

```tsx
// Mock TripPanel so it doesn't need the full store/form setup; capture props for assertions
let tripPanelProps: Record<string, unknown> | null = null
vi.mock('@/components/TripPanel', () => ({
  default: (props: Record<string, unknown>) => {
    tripPanelProps = props
    return <div data-testid="trip-panel">TripPanel</div>
  },
}))
```

Then, inside `describe('PlannerPage desktop/mobile gating', ...)`, add a new test after `'does not mount SheetContent (role="dialog") on desktop'`:

```tsx
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
```

- [ ] **Step 7: Run the full suite and build**

Run: `bun run test -- PlannerPage`
Expected: all tests in this file PASS (3 existing + 1 new).

Run: `bun run test`
Expected: all test files pass (101 tests, up from 96 — 4 new in `TripPanel.test.tsx`, 1 new in `PlannerPage.test.tsx`).

Run: `bun run build`
Expected: clean `tsc -b && vite build`, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/TripPanel.tsx src/components/TripPanel.test.tsx src/routes/PlannerPage.tsx src/routes/PlannerPage.test.tsx
git commit -m "$(cat <<'EOF'
feat: add dismissible close button + Escape handling to desktop trip panel

Desktop's inline TripPanel had no way to back out of a range selection
short of saving or deleting. showClose (wired from PlannerPage's desktop
aside only) adds an X button and Escape handler; mobile's Sheet-wrapped
TripDrawer already handles this via Radix and is unaffected.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Richer desktop trip rows

**Files:**
- Modify: `src/components/TripsOverview.tsx`
- Test: `src/components/TripsOverview.test.tsx` (new)

**Interfaces:**
- Consumes: `estimatedDives(type: TripType, start: ISODate, end: ISODate): number` from `@/lib/dives`; `leaveDaysInRange(start: ISODate, end: ISODate, holidays: Set<ISODate>, excluded?: Set<ISODate>): number` from `@/lib/leave`; `holidaySetFromCache(cache: Record<string, HolidayEntry[]>): Set<ISODate>` from `@/lib/holidays`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/TripsOverview.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
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
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- TripsOverview`
Expected: all 3 tests FAIL — the subtitle line currently only renders date range + location.

- [ ] **Step 3: Extend `TripsOverview`'s subtitle line**

Replace the full contents of `src/components/TripsOverview.tsx` with:

```tsx
import { useMemo } from 'react'
import { parseISO, format } from 'date-fns'
import { cn } from '@/lib/cn'
import { typeColor } from '@/components/calendar/TripBlock'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import { useAppStore } from '@/store/useAppStore'
import { estimatedDives } from '@/lib/dives'
import { leaveDaysInRange } from '@/lib/leave'
import { holidaySetFromCache } from '@/lib/holidays'
import type { Trip } from '@/types'

export default function TripsOverview({ onSelect }: { onSelect: (trip: Trip) => void }) {
  const trips = useAppStore((s) => s.trips)
  const holidays = useAppStore((s) => s.holidays)
  const locations = useMergedLocations()
  const holidaySet = useMemo(() => holidaySetFromCache(holidays), [holidays])
  const sorted = [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate))

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-base text-muted">
        Select a date range on the calendar, or click an existing trip, to see details here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Planned trips</h2>
      <div className="space-y-2">
        {sorted.map((t) => {
          const place = t.locationId ? locations.find((l) => l.id === t.locationId)?.name : t.customLocation
          const dives = t.type === 'non-dive' ? undefined : t.estimatedDives ?? estimatedDives(t.type, t.startDate, t.endDate)
          const excluded = t.excludedLeaveDates ? new Set(t.excludedLeaveDates) : undefined
          const leave = leaveDaysInRange(t.startDate, t.endDate, holidaySet, excluded)
          const lgParts = [
            dives !== undefined ? `${dives} dive${dives === 1 ? '' : 's'}` : null,
            leave > 0 ? `${leave} day${leave === 1 ? '' : 's'} leave` : null,
          ].filter((p): p is string => p !== null)
          return (
            <button key={t.id} type="button" onClick={() => onSelect(t)}
              className="flex w-full flex-col gap-0.5 rounded-md border border-line px-3 py-2 text-left transition-colors hover:border-primary">
              <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', typeColor[t.type])} />
                <span className="truncate text-base font-medium">{t.label}</span>
              </span>
              <span className="pl-4 text-sm text-muted">
                {format(parseISO(t.startDate), 'd MMM yyyy')} – {format(parseISO(t.endDate), 'd MMM yyyy')}
                {place && ` · ${place}`}
                {lgParts.length > 0 && <span className="hidden lg:inline"> · {lgParts.join(' · ')}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- TripsOverview`
Expected: all 3 tests PASS.

- [ ] **Step 5: Run the full suite and build**

Run: `bun run test`
Expected: all test files pass (104 tests, up from 101 — 3 new in `TripsOverview.test.tsx`).

Run: `bun run build`
Expected: clean `tsc -b && vite build`, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/TripsOverview.tsx src/components/TripsOverview.test.tsx
git commit -m "$(cat <<'EOF'
feat: show dive count and leave days on desktop trip rows

Extends TripsOverview's existing date+location subtitle with per-trip
dive count and leave-days-used, reusing the same lib/dives.ts and
lib/leave.ts helpers TripPanel already relies on. lg: breakpoint only —
mobile rows are unchanged.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Aggregated stats strip (`TripStats`)

**Files:**
- Create: `src/components/TripStats.tsx`
- Test: `src/components/TripStats.test.tsx` (new)
- Create (via shadcn skill): `src/components/ui/card.tsx`
- Modify: `docs/superpowers/specs/2026-07-02-planner-ui-polish-design.md`

**Interfaces:**
- Produces: `TripStats({ trips: Trip[] })` — a presentational component with no store access of its own (see the "Known deviation" note at the top of this plan: `holidays` is dropped from the props the spec originally specified, since none of the four stats need it).

- [ ] **Step 1: Load the shadcn skill and add the `Card` component**

Invoke the `shadcn` skill (Skill tool). Then preview and add:

```bash
bunx --bun shadcn@latest add card --dry-run
bunx --bun shadcn@latest add card
```

This creates `src/components/ui/card.tsx` exporting `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

- [ ] **Step 2: Write the failing tests**

Create `src/components/TripStats.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TripStats from './TripStats'
import type { Trip } from '@/types'

const baseTrip = (overrides: Partial<Trip>): Trip => ({
  id: 'id',
  label: 'Trip',
  startDate: '2026-07-01',
  endDate: '2026-07-02',
  type: 'fun-dive',
  status: 'planned',
  bookings: [],
  ...overrides,
})

describe('TripStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts trips/dives planned from upcoming trips only, excluding past trips', () => {
    const trips: Trip[] = [
      baseTrip({ id: 'a', startDate: '2026-07-10', endDate: '2026-07-12', estimatedDives: 5 }),
      baseTrip({ id: 'b', startDate: '2026-08-01', endDate: '2026-08-03', estimatedDives: 3 }),
      baseTrip({ id: 'c', startDate: '2026-06-01', endDate: '2026-06-05', estimatedDives: 100 }), // past
    ]
    render(<TripStats trips={trips} />)
    expect(screen.getByText('Trips planned').previousElementSibling?.textContent).toBe('2')
    expect(screen.getByText('Dives planned').previousElementSibling?.textContent).toBe('8')
  })

  it('shows days until the next upcoming trip', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-07-10', endDate: '2026-07-12' })]
    render(<TripStats trips={trips} />)
    expect(screen.getByText('Days until next trip').previousElementSibling?.textContent).toBe('8')
  })

  it('omits the "days until next trip" card when there are no upcoming trips', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-05' })]
    render(<TripStats trips={trips} />)
    expect(screen.queryByText('Days until next trip')).not.toBeInTheDocument()
  })

  it('omits the "dives done" card when past dives sum to 0', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-05', type: 'non-dive' })]
    render(<TripStats trips={trips} />)
    expect(screen.queryByText('Dives done')).not.toBeInTheDocument()
  })

  it('sums dives done from past trips when greater than 0', () => {
    const trips: Trip[] = [baseTrip({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-05', estimatedDives: 7 })]
    render(<TripStats trips={trips} />)
    expect(screen.getByText('Dives done').previousElementSibling?.textContent).toBe('7')
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `bun run test -- TripStats`
Expected: FAIL — `src/components/TripStats.tsx` does not exist yet.

- [ ] **Step 4: Implement `TripStats`**

Create `src/components/TripStats.tsx`:

```tsx
import { useMemo } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { formatISO } from '@/lib/dates'
import { estimatedDives } from '@/lib/dives'
import type { Trip } from '@/types'

function diveCount(trip: Trip): number {
  if (trip.type === 'non-dive') return 0
  return trip.estimatedDives ?? estimatedDives(trip.type, trip.startDate, trip.endDate)
}

export default function TripStats({ trips }: { trips: Trip[] }) {
  const today = formatISO(new Date())

  const stats = useMemo(() => {
    const upcoming = trips.filter((t) => t.startDate >= today)
    const past = trips.filter((t) => t.endDate < today)
    const nextTrip = [...upcoming].sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
    return {
      tripsPlanned: upcoming.length,
      divesPlanned: upcoming.reduce((n, t) => n + diveCount(t), 0),
      daysUntilNext: nextTrip ? differenceInCalendarDays(parseISO(nextTrip.startDate), parseISO(today)) : undefined,
      divesDone: past.reduce((n, t) => n + diveCount(t), 0),
    }
  }, [trips, today])

  const cards: { label: string; value: number }[] = [
    { label: 'Trips planned', value: stats.tripsPlanned },
    { label: 'Dives planned', value: stats.divesPlanned },
  ]
  if (stats.daysUntilNext !== undefined) cards.push({ label: 'Days until next trip', value: stats.daysUntilNext })
  if (stats.divesDone > 0) cards.push({ label: 'Dives done', value: stats.divesDone })

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-semibold">{c.value}</div>
            <div className="text-sm text-muted">{c.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `bun run test -- TripStats`
Expected: all 5 tests PASS.

- [ ] **Step 6: Update the design spec for the props deviation**

In `docs/superpowers/specs/2026-07-02-planner-ui-polish-design.md`, find (in §4, "Aggregated stats strip"):

```
Props: `{ trips: Trip[]; holidays: Record<string, HolidayEntry[]> }` — takes data as props (not read from the store internally) so both call sites (which already have this data on hand) can pass it directly, and so the component itself stays presentational/testable in isolation.
```

Replace with:

```
Props: `{ trips: Trip[] }` — takes data as a prop (not read from the store internally) so both call sites (which already have `trips` on hand) can pass it directly, and so the component itself stays presentational/testable in isolation. (Deviation from initial design: `holidays` was dropped — none of the four stats below use holiday data, and this repo's `noUnusedParameters` strict-mode setting turns an accepted-but-unread prop into a build error.)
```

- [ ] **Step 7: Run the full suite and build**

Run: `bun run test`
Expected: all test files pass (109 tests, up from 104 — 5 new in `TripStats.test.tsx`).

Run: `bun run build`
Expected: clean `tsc -b && vite build`, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/TripStats.tsx src/components/TripStats.test.tsx src/components/ui/card.tsx components.json docs/superpowers/specs/2026-07-02-planner-ui-polish-design.md
git commit -m "$(cat <<'EOF'
feat: add aggregated TripStats component

New presentational component summarizing trips planned, dives planned,
days until next trip, and dives done (each card omitted per the rules
in the design spec). Not wired into any route yet — that's Task 4.
Drops the spec's `holidays` prop (unused by any of the four stats;
kept `tsc --noEmit` clean under noUnusedParameters) and updates the
design spec to match.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Wire `TripStats` in and add mobile Planner/Trips tabs

**Files:**
- Modify: `src/routes/PlannerPage.tsx`
- Modify: `src/routes/PlannerPage.test.tsx`

**Interfaces:**
- Consumes: `TripStats({ trips: Trip[] })` (Task 3), `TripsOverview({ onSelect: (trip: Trip) => void })` (existing), `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` from `@/components/ui/tabs` (already installed — no shadcn add needed).

- [ ] **Step 1: Write the failing test**

In `src/routes/PlannerPage.test.tsx`, add a mock for `TripsOverview` near the top, after the existing `TripPanel` mock:

```tsx
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
```

Then add a new test inside `describe('PlannerPage desktop/mobile gating', ...)`, after the existing `'mounts TripDrawer (role="dialog") on mobile when open'` test:

```tsx
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

    // Selecting a trip from the Trips tab opens the drawer; tab stays on Trips
    await userEvent.click(screen.getByRole('button', { name: 'Select Trip From Overview' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Trips' })).toHaveAttribute('data-state', 'active')
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- PlannerPage`
Expected: the new mobile-tabs test FAILS — there is no `role="tab"` named "Trips" yet (mobile currently renders only the bare calendar + `TripDrawer`).

- [ ] **Step 3: Wire `TripStats` and mobile Tabs into `PlannerPage`**

Replace the full contents of `src/routes/PlannerPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import TripPanel from '@/components/TripPanel'
import TripsOverview from '@/components/TripsOverview'
import TripStats from '@/components/TripStats'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore } from '@/store/useAppStore'
import type { Trip } from '@/types'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export default function PlannerPage() {
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)
  const [mobileTab, setMobileTab] = useState<'planner' | 'trips'>('planner')
  const open = pending !== null || editing !== null
  const [params] = useSearchParams()
  const defaultLocationId = params.get('location') ?? undefined
  const mode = editing ? 'edit' : 'create'
  const close = () => { setPending(null); setEditing(null) }
  const isDesktop = useIsDesktop()
  const trips = useAppStore((s) => s.trips)
  const selectTrip = (t: Trip) => { setPending(null); setEditing(t) }
  const calendar = (
    <CalendarView
      onRangeSelected={(start, end) => { setEditing(null); setPending({ start, end }) }}
      onTripClick={selectTrip}
    />
  )
  if (isDesktop) {
    return (
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        {/* Desktop: static 60/40 split so opening the panel never reflows the calendar. */}
        <div className="flex gap-6">
          <div className="w-3/5">{calendar}</div>
          <aside className="w-2/5">
            <div className="sticky top-32 rounded-lg border border-line bg-surface-elevated p-4">
              {open ? (
                <TripPanel key={editing?.id ?? `${pending?.start}-${pending?.end}`}
                  mode={mode} initialRange={pending ?? undefined} trip={editing ?? undefined}
                  defaultLocationId={defaultLocationId} showClose onClose={close} />
              ) : (
                <div className="space-y-4">
                  <TripStats trips={trips} />
                  <TripsOverview onSelect={selectTrip} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      {/* Mobile/tablet: Planner/Trips tabs, calendar + Sheet overlay. */}
      <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'planner' | 'trips')}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
        </TabsList>
        <TabsContent value="planner">{calendar}</TabsContent>
        <TabsContent value="trips" className="space-y-4">
          <TripStats trips={trips} />
          <TripsOverview onSelect={selectTrip} />
        </TabsContent>
      </Tabs>
      <TripDrawer open={open} mode={mode} initialRange={pending ?? undefined}
        trip={editing ?? undefined} defaultLocationId={defaultLocationId} onClose={close} />
    </main>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test -- PlannerPage`
Expected: all tests in this file PASS (4 existing + 1 new).

- [ ] **Step 5: Run the full suite and build**

Run: `bun run test`
Expected: all test files pass (110 tests, up from 109 — 1 new in `PlannerPage.test.tsx`).

Run: `bun run build`
Expected: clean `tsc -b && vite build`, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/routes/PlannerPage.tsx src/routes/PlannerPage.test.tsx
git commit -m "$(cat <<'EOF'
feat: add mobile Planner/Trips tabs and wire TripStats into both views

Mobile previously had no way to see the trips list at all. A shadcn
Tabs control now switches mobile's main content between the existing
calendar and TripStats + TripsOverview; desktop's aside gains the same
TripStats block above its existing TripsOverview. Tab state is local
and unpersisted, and independent of the trip-editing Sheet overlay.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

After Task 4, run the full suite once more and confirm the design spec's testing checklist (§Testing) is fully covered:

- [ ] `bun run test` → 110/110 passing.
- [ ] `bun run build` → clean.
- [ ] Manually verify in-browser (both light/dark, desktop and a mobile viewport): the desktop panel's X button and Escape both dismiss it; mobile's Planner/Trips tabs switch content and selecting a trip from Trips opens the drawer without losing the active tab; desktop trip rows show dive/leave text at `lg:` and up; the stats strip appears above "Planned trips" on both desktop and mobile, with cards correctly omitted per the rules (no upcoming trip → no countdown card; 0 dives done → no dives-done card).
