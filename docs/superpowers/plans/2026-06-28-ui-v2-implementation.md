# DivePlanner UI v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the second wave of DivePlanner UI changes — responsive top nav, default dark mode, a compact 3-column calendar with full-colour trip cells and hover tooltips, an inline trip panel with seasonality and segmented leave breakdown, and substitute-holiday logic.

**Architecture:** Pure helpers in `src/lib/*` are extended/migrated first (holiday entries, substitute holidays, calendar window, covered-trip map, day metadata, leave segments) so every UI task consumes a stable, tested interface. Components are then migrated bottom-up: calendar cells → tooltip → theming → nav/layout → trip panel content. The holiday data model changes from `ISODate[]` to `HolidayEntry[]` (date + name) across the lib, store, and hook in one early task to keep the build green.

**Tech Stack:** Bun, Vite (stock), React 18, TypeScript strict, Tailwind **v3** (CSS-variable colours registered in `tailwind.config.ts`), shadcn/ui (new-york, radix base), Radix primitives, Zustand (persist), date-fns, Vitest + Testing Library.

## Global Constraints

- **Bun only.** Run scripts with `bun run …`; run a single test file with `bunx vitest run <path>`. Never npm/pnpm/yarn.
- **shadcn skill is mandatory for UI work.** Load it (Skill tool) before adding/editing shadcn components. Add components with `bunx --bun shadcn@latest add <name>` (preview with `--dry-run`/`--diff`). Never hand-write or fetch component source from GitHub.
- **Tailwind v3.** Register every custom colour utility in `tailwind.config.ts` (`colors: { … }`). Do **not** use `@theme inline` (that is v4). CSS variables live in `src/index.css`.
- `@/*` path alias → `src/*`. Utils alias is `@/lib/cn` (not `@/lib/utils`); UI alias is `@/components/ui`.
- Trip date ranges must not overlap. Leave is per calendar year. Seasonality is month-only (12 ratings/site). `non-dive` trips: no booking checklist, 0 estimated dives.
- Leave day = weekday (Mon–Fri) in range minus public holidays on those weekdays.
- Holiday slice is **session-only** (never persisted): `partialize` in the store must continue to exclude `holidays`.
- `calendarWindow(now)` returns every month from the current month through December of `currentYear + 1` (≥13, ≤24 months). The Settings dialog and leave bar derive their years from this window → exactly `currentYear` and `currentYear + 1` (two rows/gauges).
- Default theme is **dark**.
- Share encoding (`lz-string`) is unchanged; new `Trip.customLocation` is naturally included in the serialised state.
- All existing tests must continue to pass (57/57 at plan start); new behaviour gets new tests.
- When you change behaviour relative to a spec, update the corresponding spec doc (`docs/superpowers/specs/2026-06-28-ui-v2-design.md`) in the same commit.
- Commit after every task. Conventional commit messages ending with: `Co-Authored-By: Claude <noreply@anthropic.com>`

## File Structure

**Created:**
- `src/lib/dayMeta.ts` — builds `Map<ISODate, DayMeta>` for calendar hover tooltips (pure, testable).
- `src/lib/dayMeta.test.ts`
- `src/components/ui/tooltip.tsx` — shadcn Tooltip (added via CLI).
- `src/components/TripPanel.tsx` — the trip create/edit form body, shared by the mobile Sheet and the desktop inline split panel.

**Modified (high-level responsibility):**
- `src/types.ts` — add `HolidayEntry`, `Trip.customLocation`, `Settings.theme`.
- `src/lib/holidays.ts` — `parseHolidays`→`HolidayEntry[]`, `holidayNameMap`, widened `holidaySetFromCache`, `applySubstituteHolidays`, `fetchHolidays`→`HolidayEntry[]`.
- `src/lib/dates.ts` — `calendarWindow` replaces `monthsWindow`.
- `src/lib/overlap.ts` — `coveredTripMap` replaces `coveredDays`.
- `src/lib/leave.ts` — `segmentDays` + `Segment`/`SegmentKind`.
- `src/store/useAppStore.ts` — `holidays: Record<string, HolidayEntry[]>`, `setHolidays` signature.
- `src/hooks/useHolidays.ts` — apply substitute holidays, store entries.
- `src/hooks/useLeaveByYear.ts`, `src/components/SettingsDialog.tsx` — consume `calendarWindow`.
- `src/index.css`, `tailwind.config.ts` — dark palette, `--surface-elevated`, shadcn variable bridge + colour registration.
- `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx` — elevated surface (`bg-background`→`bg-card`).
- `src/App.tsx` — theme effect, Nav without `actions`, TooltipProvider context (via CalendarView).
- `src/components/Nav.tsx` — responsive top nav, no bottom tab bar, Settings/Share/theme toggle inline.
- `src/components/LeaveBalanceBar.tsx` — sticky.
- `src/components/calendar/CalendarView.tsx` — 3-col grid, covered-trip map, day-meta map, name map.
- `src/components/calendar/MonthGrid.tsx` — compact mode, pass `coveredByTrip` + `dayMeta`.
- `src/components/calendar/DayCell.tsx` — full-colour fill, range rounding, amber holiday underline, tooltip.
- `src/components/calendar/TripBlock.tsx` — show custom/known location.
- `src/components/TripDrawer.tsx` — thin Sheet wrapper around `TripPanel`.
- `src/components/LocationPicker.tsx` — "Other…" option + custom input.
- `src/components/SettingsDialog.tsx`, `src/components/BookingChecklist.tsx`, `src/components/AddLocationDialog.tsx` — `bg-white`→`bg-surface-elevated`.
- `src/routes/PlannerPage.tsx` — desktop inline split / mobile Sheet.
- `src/routes/SharePage.tsx` — pass `holidays={{}}` typed as `Record<string, HolidayEntry[]>` (no code change needed; empty object stays valid).

---

## Task 1: HolidayEntry type + holiday parsing & name-map migration

Migrate the holiday data model from `ISODate[]` to `HolidayEntry[]` end-to-end (lib → store → hook) so dates carry names. This is one task because the store/hook/lib types must change together to keep the build green.

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/holidays.ts`
- Modify: `src/store/useAppStore.ts:11` (slice type) and `:21,:47` (`setHolidays`)
- Modify: `src/hooks/useHolidays.ts`
- Test: `src/lib/holidays.test.ts`, `src/hooks/useHolidays.test.tsx`

**Interfaces:**
- Produces:
  - `interface HolidayEntry { date: ISODate; name: string }` (in `types.ts`)
  - `parseHolidays(data: unknown): HolidayEntry[]`
  - `holidaySetFromCache(cache: Record<string, HolidayEntry[]>): Set<ISODate>` (return type unchanged)
  - `holidayNameMap(cache: Record<string, HolidayEntry[]>): Map<ISODate, string>`
  - `fetchHolidays(country: string, year: number): Promise<HolidayEntry[]>`
  - Store: `holidays: Record<string, HolidayEntry[]>`; `setHolidays(key: string, entries: HolidayEntry[]): void`

- [ ] **Step 1: Write failing tests for `parseHolidays` + `holidayNameMap`**

Replace the relevant assertions in `src/lib/holidays.test.ts`. The Nager.Date payload uses `{ date, name, localName, ... }`; we keep `date` + `name`.

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { holidayKey, nagerUrl, parseHolidays, fetchHolidays, holidaySetFromCache, holidayNameMap } from './holidays'

afterEach(() => vi.restoreAllMocks())

describe('holiday helpers', () => {
  it('builds cache key and url', () => {
    expect(holidayKey('SG', 2026)).toBe('SG-2026')
    expect(nagerUrl('SG', 2026)).toBe('https://date.nager.at/api/v3/PublicHolidays/2026/SG')
  })
  it('parses holiday entries and ignores malformed ones', () => {
    expect(parseHolidays([{ date: '2026-05-01', name: 'Labour Day' }, { foo: 'bar' }, { date: 123 }]))
      .toEqual([{ date: '2026-05-01', name: 'Labour Day' }])
    expect(parseHolidays(null)).toEqual([])
  })
  it('defaults a missing name to "Holiday"', () => {
    expect(parseHolidays([{ date: '2026-05-01' }])).toEqual([{ date: '2026-05-01', name: 'Holiday' }])
  })
  it('flattens cache dates into a Set', () => {
    const set = holidaySetFromCache({ 'SG-2026': [{ date: '2026-05-01', name: 'Labour Day' }], 'SG-2027': [{ date: '2027-01-01', name: 'New Year' }] })
    expect(set.has('2026-05-01')).toBe(true)
    expect(set.has('2027-01-01')).toBe(true)
  })
  it('builds a date→name map from cache', () => {
    const map = holidayNameMap({ 'SG-2026': [{ date: '2026-05-01', name: 'Labour Day' }] })
    expect(map.get('2026-05-01')).toBe('Labour Day')
  })
  it('fetchHolidays returns parsed entries on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-08-09', name: 'National Day' }] }))
    expect(await fetchHolidays('SG', 2026)).toEqual([{ date: '2026-08-09', name: 'National Day' }])
  })
  it('fetchHolidays throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchHolidays('SG', 2026)).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `bunx vitest run src/lib/holidays.test.ts`
Expected: FAIL — `holidayNameMap` is not exported; `parseHolidays` returns strings.

- [ ] **Step 3: Add `HolidayEntry` to `src/types.ts`**

Add after the `ISODate` type alias (top of file):

```ts
export interface HolidayEntry {
  date: ISODate
  name: string
}
```

- [ ] **Step 4: Rewrite `src/lib/holidays.ts`**

```ts
import type { HolidayEntry, ISODate } from '@/types'

export function holidayKey(country: string, year: number): string {
  return `${country}-${year}`
}

export function nagerUrl(country: string, year: number): string {
  return `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`
}

export function parseHolidays(data: unknown): HolidayEntry[] {
  if (!Array.isArray(data)) return []
  return data
    .filter((d): d is { date: string; name?: unknown } => !!d && typeof (d as { date?: unknown }).date === 'string')
    .map((d) => ({ date: d.date, name: typeof d.name === 'string' ? d.name : 'Holiday' }))
}

export async function fetchHolidays(country: string, year: number): Promise<HolidayEntry[]> {
  const res = await fetch(nagerUrl(country, year))
  if (!res.ok) throw new Error(`Nager.Date HTTP ${res.status}`)
  return parseHolidays(await res.json())
}

export function holidaySetFromCache(cache: Record<string, HolidayEntry[]>): Set<ISODate> {
  const set = new Set<ISODate>()
  for (const entries of Object.values(cache)) for (const e of entries) set.add(e.date)
  return set
}

export function holidayNameMap(cache: Record<string, HolidayEntry[]>): Map<ISODate, string> {
  const map = new Map<ISODate, string>()
  for (const entries of Object.values(cache)) for (const e of entries) map.set(e.date, e.name)
  return map
}
```

- [ ] **Step 5: Update the store slice type and `setHolidays`**

In `src/store/useAppStore.ts`:
- Change the import to include `HolidayEntry`: `import { DEFAULT_SETTINGS, type HolidayEntry, type ISODate, type Location, type Settings, type Trip } from '@/types'`
- Change the interface field: `holidays: Record<string, HolidayEntry[]>`
- Change the action signature: `setHolidays: (key: string, entries: HolidayEntry[]) => void`
- Change the implementation: `setHolidays: (key, entries) => set((s) => ({ holidays: { ...s.holidays, [key]: entries } })),`
- Leave `partialize` unchanged (it already excludes `holidays`).

(If `ISODate` becomes unused after this edit, drop it from the import to satisfy strict mode.)

- [ ] **Step 6: Update `src/hooks/useHolidays.ts` to store entries**

Only the stored value type changes here (substitute logic is Task 2). The existing body already passes `dates` straight through; rename for clarity:

```ts
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { fetchHolidays, holidayKey } from '@/lib/holidays'

export function useHolidays() {
  const country = useAppStore((s) => s.settings.country)
  const setHolidays = useAppStore((s) => s.setHolidays)
  const clearHolidays = useAppStore((s) => s.clearHolidays)
  const setLoading = useAppStore((s) => s.setHolidaysLoading)
  const setError = useAppStore((s) => s.setHolidaysError)

  useEffect(() => {
    let cancelled = false
    const year = new Date().getFullYear()
    const years = [year, year + 1]
    clearHolidays()
    setLoading(true); setError(false)

    Promise.all(years.map((y) => fetchHolidays(country, y).then((entries) => ({ y, entries }))))
      .then((results) => {
        if (cancelled) return
        for (const { y, entries } of results) setHolidays(holidayKey(country, y), entries)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        toast.warning('Could not load public holidays — leave counts weekdays only.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [country, setHolidays, clearHolidays, setLoading, setError])
}
```

- [ ] **Step 7: Update `useHolidays.test.tsx` fetch mock to include names**

In `src/hooks/useHolidays.test.tsx`, update the success mock payload so it parses to entries:

```ts
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-08-09', name: 'National Day' }] }))
```

(The assertions — 2 keys present / error flag — are unchanged.)

- [ ] **Step 8: Run the full suite**

Run: `bun run test`
Expected: PASS — 57/57 (holiday tests updated; everything else still green because `holidaySetFromCache` return type is unchanged and consumers read it the same way).

- [ ] **Step 9: Commit**

```bash
git add src/types.ts src/lib/holidays.ts src/lib/holidays.test.ts src/store/useAppStore.ts src/hooks/useHolidays.ts src/hooks/useHolidays.test.tsx
git commit -m "feat: migrate holidays to HolidayEntry (date + name)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Substitute holiday logic

Add `applySubstituteHolidays` and apply it in `useHolidays` after each successful fetch.

**Files:**
- Modify: `src/lib/holidays.ts`
- Modify: `src/hooks/useHolidays.ts`
- Test: `src/lib/holidays.test.ts`

**Interfaces:**
- Consumes: `HolidayEntry` (Task 1)
- Produces: `applySubstituteHolidays(entries: HolidayEntry[]): HolidayEntry[]`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/holidays.test.ts`:

```ts
import { applySubstituteHolidays } from './holidays'

describe('applySubstituteHolidays', () => {
  it('moves a Saturday holiday to the following Monday', () => {
    // 2026-05-02 is a Saturday.
    const out = applySubstituteHolidays([{ date: '2026-05-02', name: 'Labour Day' }])
    expect(out).toContainEqual({ date: '2026-05-02', name: 'Labour Day' }) // original kept
    expect(out).toContainEqual({ date: '2026-05-04', name: 'Labour Day (substitute)' }) // Monday
  })
  it('chains substitutes for a Sat+Sun pair (Sat→Mon, Sun→Tue)', () => {
    // 2026-08-15 Sat, 2026-08-16 Sun.
    const out = applySubstituteHolidays([
      { date: '2026-08-15', name: 'A' },
      { date: '2026-08-16', name: 'B' },
    ])
    expect(out).toContainEqual({ date: '2026-08-17', name: 'A (substitute)' }) // Mon
    expect(out).toContainEqual({ date: '2026-08-18', name: 'B (substitute)' }) // Tue
  })
  it('skips a weekday already occupied by an original holiday', () => {
    // 2026-08-15 Sat; Mon 2026-08-17 is already a holiday → substitute lands on Tue.
    const out = applySubstituteHolidays([
      { date: '2026-08-15', name: 'A' },
      { date: '2026-08-17', name: 'Existing Monday' },
    ])
    expect(out).toContainEqual({ date: '2026-08-18', name: 'A (substitute)' })
  })
  it('leaves weekday holidays untouched', () => {
    const out = applySubstituteHolidays([{ date: '2026-05-01', name: 'Labour Day' }]) // Friday
    expect(out).toEqual([{ date: '2026-05-01', name: 'Labour Day' }])
  })
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/lib/holidays.test.ts`
Expected: FAIL — `applySubstituteHolidays` not exported.

- [ ] **Step 3: Implement `applySubstituteHolidays`**

Add to `src/lib/holidays.ts` (and extend the date-fns import):

```ts
import { parseISO, addDays, isWeekend, format } from 'date-fns'

export function applySubstituteHolidays(entries: HolidayEntry[]): HolidayEntry[] {
  const occupied = new Set(entries.map((e) => e.date))
  const subs: HolidayEntry[] = []
  const weekend = entries
    .filter((e) => isWeekend(parseISO(e.date)))
    .sort((a, b) => a.date.localeCompare(b.date))
  for (const e of weekend) {
    let d = addDays(parseISO(e.date), 1)
    let iso = format(d, 'yyyy-MM-dd')
    while (isWeekend(d) || occupied.has(iso)) {
      d = addDays(d, 1)
      iso = format(d, 'yyyy-MM-dd')
    }
    occupied.add(iso)
    subs.push({ date: iso, name: `${e.name} (substitute)` })
  }
  return [...entries, ...subs]
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `bunx vitest run src/lib/holidays.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into `useHolidays`**

In `src/hooks/useHolidays.ts`, import and apply before storing:

```ts
import { fetchHolidays, holidayKey, applySubstituteHolidays } from '@/lib/holidays'
```
```ts
for (const { y, entries } of results) setHolidays(holidayKey(country, y), applySubstituteHolidays(entries))
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/holidays.ts src/lib/holidays.test.ts src/hooks/useHolidays.ts
git commit -m "feat: add substitute public holidays for weekend dates

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: `calendarWindow` replaces `monthsWindow`

The calendar shows current month → December next year. Replace `monthsWindow` and update its three consumers.

**Files:**
- Modify: `src/lib/dates.ts`
- Modify: `src/components/calendar/CalendarView.tsx`, `src/hooks/useLeaveByYear.ts`, `src/components/SettingsDialog.tsx`
- Test: `src/lib/dates.test.ts`, `src/components/calendar/CalendarView.test.tsx`

**Interfaces:**
- Produces: `calendarWindow(now: Date): { year: number; month: number }[]` — months from `{ now.getFullYear(), now.getMonth() + 1 }` through `{ now.getFullYear() + 1, 12 }`, inclusive.
- Removes: `monthsWindow`.

- [ ] **Step 1: Write failing test for `calendarWindow`**

Replace the `monthsWindow` test in `src/lib/dates.test.ts` and update the import:

```ts
import { enumerateDays, isWeekday, durationDays, calendarWindow, formatISO } from './dates'
```
```ts
it('calendarWindow runs from the current month through Dec next year', () => {
  const w = calendarWindow(new Date(2026, 5, 28)) // June 2026 (month index 5)
  expect(w[0]).toEqual({ year: 2026, month: 6 })
  expect(w[w.length - 1]).toEqual({ year: 2027, month: 12 })
  // Jun 2026..Dec 2026 = 7, Jan..Dec 2027 = 12 → 19 months.
  expect(w).toHaveLength(19)
})
it('calendarWindow from December gives 13 months', () => {
  const w = calendarWindow(new Date(2026, 11, 1)) // December 2026
  expect(w[0]).toEqual({ year: 2026, month: 12 })
  expect(w[w.length - 1]).toEqual({ year: 2027, month: 12 })
  expect(w).toHaveLength(13)
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/lib/dates.test.ts`
Expected: FAIL — `calendarWindow` not exported.

- [ ] **Step 3: Implement `calendarWindow`, remove `monthsWindow`**

In `src/lib/dates.ts`, replace the `monthsWindow` function (and drop the now-unused `addMonths` import if nothing else uses it):

```ts
export function calendarWindow(now: Date): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = []
  const startY = now.getFullYear()
  const startM = now.getMonth() + 1 // 1-12
  const endY = startY + 1
  const endM = 12
  let y = startY
  let m = startM
  while (y < endY || (y === endY && m <= endM)) {
    out.push({ year: y, month: m })
    if (m === 12) { m = 1; y += 1 } else { m += 1 }
  }
  return out
}
```

- [ ] **Step 4: Update consumers**

`src/components/calendar/CalendarView.tsx`:
- Import: `import { calendarWindow, formatISO, enumerateDays } from '@/lib/dates'`
- `const window = useMemo(() => calendarWindow(new Date()), [])`

`src/hooks/useLeaveByYear.ts`:
- Import: `import { calendarWindow } from '@/lib/dates'`
- `const years = [...new Set(calendarWindow(new Date()).map((m) => m.year))]`

`src/components/SettingsDialog.tsx`:
- Import: `import { calendarWindow } from '@/lib/dates'`
- `const years = [...new Set(calendarWindow(new Date()).map((m) => m.year))]`

- [ ] **Step 5: Update the CalendarView month-count test**

In `src/components/calendar/CalendarView.test.tsx`, the heading count is now window-length-dependent. Import the helper and compute it:

```ts
import { calendarWindow } from '@/lib/dates'
```
```ts
it('renders one month heading per calendar-window month', () => {
  render(<CalendarView />)
  expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(calendarWindow(new Date()).length)
})
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts src/components/calendar/CalendarView.tsx src/hooks/useLeaveByYear.ts src/components/SettingsDialog.tsx src/components/calendar/CalendarView.test.tsx
git commit -m "feat: replace monthsWindow with calendarWindow (current month → Dec next year)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Covered-trip map + full-colour day cells + holiday underline

Replace the `coveredDays` Set with a `coveredTripMap` (date → owning trip) so cells can be filled with the trip's colour, and replace the holiday dot with an amber underline.

**Files:**
- Modify: `src/lib/overlap.ts`
- Modify: `src/components/calendar/CalendarView.tsx`, `src/components/calendar/MonthGrid.tsx`, `src/components/calendar/DayCell.tsx`
- Test: `src/lib/overlap.test.ts`

**Interfaces:**
- Consumes: `Trip` (`type`, `status`), `coveredTripMap` keys are ISO dates.
- Produces: `coveredTripMap(trips: Trip[], excludeId?: string): Map<ISODate, Trip>`. Removes `coveredDays`.
- DayCell new prop: `coveredByTrip?: Trip` (replaces `isCovered: boolean`). `isHoliday` retained; tooltip props added in Task 5.

- [ ] **Step 1: Write failing test for `coveredTripMap`**

Replace the `coveredDays` block in `src/lib/overlap.test.ts`:

```ts
import { rangesOverlap, hasOverlap, coveredTripMap } from './overlap'
```
```ts
describe('coveredTripMap', () => {
  it('maps every covered day to its owning trip, minus excluded', () => {
    const map = coveredTripMap(trips)
    expect(map.get('2026-05-17')?.id).toBe('a')
    expect(map.size).toBe(6) // 15th–20th inclusive
    expect(coveredTripMap(trips, 'a').size).toBe(0)
  })
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/lib/overlap.test.ts`
Expected: FAIL — `coveredTripMap` not exported.

- [ ] **Step 3: Implement `coveredTripMap`, remove `coveredDays`**

In `src/lib/overlap.ts`:

```ts
import { enumerateDays } from './dates'
import type { ISODate, Trip } from '@/types'

export function rangesOverlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

export function hasOverlap(trips: Trip[], start: ISODate, end: ISODate, excludeId?: string): boolean {
  return trips.some((t) => t.id !== excludeId && rangesOverlap(t.startDate, t.endDate, start, end))
}

export function coveredTripMap(trips: Trip[], excludeId?: string): Map<ISODate, Trip> {
  const out = new Map<ISODate, Trip>()
  for (const t of trips) {
    if (t.id === excludeId) continue
    for (const d of enumerateDays(t.startDate, t.endDate)) out.set(d, t)
  }
  return out
}
```

- [ ] **Step 4: Update CalendarView to build & pass the map**

In `src/components/calendar/CalendarView.tsx`:
- Import: `import { coveredTripMap } from '@/lib/overlap'`
- `const covered = useMemo(() => coveredTripMap(trips), [trips])` (`covered` is now a `Map`; `covered.has(d)` still works for `previewValid`).
- Pass `covered={covered}` to `MonthGrid` (prop type changes below).

- [ ] **Step 5: Update MonthGrid prop type + DayCell wiring**

In `src/components/calendar/MonthGrid.tsx`:
- Change the `covered` prop type to `Map<string, Trip>`.
- Replace the `isCovered={covered.has(d)}` prop on `DayCell` with `coveredByTrip={covered.get(d)}`.

```tsx
export default function MonthGrid({ year, month, trips, holidays, covered, today, selection, readOnly, onDayEnter, onDayClick, onTripClick }: {
  year: number; month: number; trips: Trip[]; holidays: Set<string>; covered: Map<string, Trip>; today: string
  selection: { start: string | null; end: string | null }; readOnly: boolean
  onDayEnter: (iso: string) => void; onDayClick: (iso: string) => void; onTripClick: (trip: Trip) => void
}) {
```
```tsx
            <DayCell key={d} iso={d} day={day}
              inRange={inRange(d)} isStart={selection.start === d} isEnd={selection.end === d}
              isHoliday={holidays.has(d)} coveredByTrip={covered.get(d)} isToday={today === d} readOnly={readOnly}
              onMouseEnter={() => onDayEnter(d)} onClick={() => onDayClick(d)} />
```

- [ ] **Step 6: Rewrite DayCell with colour fill, range rounding, amber underline**

`src/components/calendar/DayCell.tsx`:

```tsx
import { cn } from '@/lib/cn'
import type { Trip } from '@/types'

const fill: Record<Trip['type'], string> = {
  'fun-dive': 'bg-fun-dive/80 text-white',
  liveaboard: 'bg-liveaboard/80 text-white',
  course: 'bg-course/80 text-white',
  'non-dive': 'bg-non-dive/60 text-ink',
}

export default function DayCell({ iso, day, inRange, isStart, isEnd, isHoliday, coveredByTrip, isToday, readOnly, onMouseEnter, onClick }: {
  iso: string; day: number; inRange: boolean; isStart: boolean; isEnd: boolean
  isHoliday: boolean; coveredByTrip?: Trip; isToday: boolean; readOnly: boolean
  onMouseEnter: () => void; onClick: () => void
}) {
  const isCovered = coveredByTrip !== undefined
  // Trip-edge rounding: round the start day on the left, the end day on the right.
  let rounding = 'rounded-md'
  if (isCovered) {
    const isTripStart = coveredByTrip.startDate === iso
    const isTripEnd = coveredByTrip.endDate === iso
    if (isTripStart && isTripEnd) rounding = 'rounded-md'
    else if (isTripStart) rounding = 'rounded-l-md rounded-r-none'
    else if (isTripEnd) rounding = 'rounded-r-md rounded-l-none'
    else rounding = 'rounded-none'
  }
  return (
    <button
      type="button"
      aria-label={`day ${iso}`}
      disabled={readOnly || isCovered}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'relative aspect-square text-sm transition-colors disabled:cursor-default',
        rounding,
        isCovered ? fill[coveredByTrip.type] : 'rounded-md hover:bg-line/60',
        inRange && !isCovered && 'bg-primary/15',
        (isStart || isEnd) && 'bg-primary text-white hover:bg-primary',
        isToday && !isStart && !isEnd && 'ring-1 ring-inset ring-primary',
      )}
    >
      <span className={cn(isHoliday && 'border-b-2 border-fair')}>{day}</span>
    </button>
  )
}
```

- [ ] **Step 7: Run the full suite**

Run: `bun run test`
Expected: PASS — the CalendarView selection tests still pass (covered map empty when no trips; `covered.has`/`.get` behave). Build is type-clean (`coveredByTrip` typed).

- [ ] **Step 8: Commit**

```bash
git add src/lib/overlap.ts src/lib/overlap.test.ts src/components/calendar/CalendarView.tsx src/components/calendar/MonthGrid.tsx src/components/calendar/DayCell.tsx
git commit -m "feat: fill calendar cells with trip colour, amber holiday underline

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Day hover tooltip (DayMeta)

Add a `buildDayMetaMap` helper and render a Radix tooltip per day cell showing good/fair locations for the month, the holiday name, and the planned trip.

**Files:**
- Create: `src/lib/dayMeta.ts`, `src/lib/dayMeta.test.ts`
- Add (CLI): `src/components/ui/tooltip.tsx`
- Modify: `src/components/calendar/CalendarView.tsx`, `src/components/calendar/MonthGrid.tsx`, `src/components/calendar/DayCell.tsx`

**Interfaces:**
- Consumes: `Location` (`seasonality`), `holidayNameMap` (Task 1), `coveredTripMap` (Task 4), `calendarWindow` (Task 3).
- Produces:
  - `interface DayMeta { holidayName?: string; trip?: Trip; goodLocs: string[]; fairLocs: string[] }`
  - `buildDayMetaMap(args: { window: { year: number; month: number }[]; locations: Location[]; holidayNames: Map<ISODate, string>; covered: Map<ISODate, Trip> }): Map<ISODate, DayMeta>`
  - DayCell new prop: `meta?: DayMeta`.

- [ ] **Step 1: Add the shadcn Tooltip component (CLI, preview first)**

Run (Bun runner; preview, then add):
```bash
bunx --bun shadcn@latest add tooltip --dry-run
bunx --bun shadcn@latest add tooltip
```
Expected: creates `src/components/ui/tooltip.tsx`, installs `@radix-ui/react-tooltip`. If the CLI cannot resolve config, confirm `components.json` aliases (`ui` → `@/components/ui`, `utils` → `@/lib/cn`).

- [ ] **Step 2: Write failing test for `buildDayMetaMap`**

`src/lib/dayMeta.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildDayMetaMap } from './dayMeta'
import type { Location, Trip } from '@/types'

const loc = (id: string, name: string, mayRating: 'good' | 'fair'): Location => ({
  id, name, country: 'XX', difficulty: 'beginner', highlights: [],
  seasonality: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, rating: i + 1 === 5 ? mayRating : 'poor' })),
})

describe('buildDayMetaMap', () => {
  const window = [{ year: 2026, month: 5 }]
  const locations = [loc('a', 'Tioman', 'good'), loc('b', 'Koh Tao', 'fair')]

  it('groups good/fair locations by month for each day', () => {
    const map = buildDayMetaMap({ window, locations, holidayNames: new Map(), covered: new Map() })
    const meta = map.get('2026-05-10')!
    expect(meta.goodLocs).toEqual(['Tioman'])
    expect(meta.fairLocs).toEqual(['Koh Tao'])
  })

  it('attaches holiday name and covering trip', () => {
    const trip: Trip = { id: 't', label: 'Tioman LW', startDate: '2026-05-10', endDate: '2026-05-12', type: 'liveaboard', status: 'planned', bookings: [] }
    const map = buildDayMetaMap({
      window, locations,
      holidayNames: new Map([['2026-05-10', 'Labour Day']]),
      covered: new Map([['2026-05-10', trip]]),
    })
    const meta = map.get('2026-05-10')!
    expect(meta.holidayName).toBe('Labour Day')
    expect(meta.trip?.id).toBe('t')
  })
})
```

- [ ] **Step 3: Run, verify it fails**

Run: `bunx vitest run src/lib/dayMeta.test.ts`
Expected: FAIL — `buildDayMetaMap` not found.

- [ ] **Step 4: Implement `src/lib/dayMeta.ts`**

```ts
import { getDaysInMonth } from 'date-fns'
import type { ISODate, Location, Trip } from '@/types'

export interface DayMeta {
  holidayName?: string
  trip?: Trip
  goodLocs: string[]
  fairLocs: string[]
}

function iso(year: number, month: number, day: number): ISODate {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function buildDayMetaMap(args: {
  window: { year: number; month: number }[]
  locations: Location[]
  holidayNames: Map<ISODate, string>
  covered: Map<ISODate, Trip>
}): Map<ISODate, DayMeta> {
  const { window, locations, holidayNames, covered } = args
  const map = new Map<ISODate, DayMeta>()
  for (const { year, month } of window) {
    // Month-only seasonality: compute good/fair location names once per month.
    const goodLocs: string[] = []
    const fairLocs: string[] = []
    for (const loc of locations) {
      const rating = loc.seasonality.find((s) => s.month === month)?.rating
      if (rating === 'good') goodLocs.push(loc.name)
      else if (rating === 'fair') fairLocs.push(loc.name)
    }
    const days = getDaysInMonth(new Date(year, month - 1))
    for (let day = 1; day <= days; day++) {
      const d = iso(year, month, day)
      map.set(d, { holidayName: holidayNames.get(d), trip: covered.get(d), goodLocs, fairLocs })
    }
  }
  return map
}
```

- [ ] **Step 5: Run, verify it passes**

Run: `bunx vitest run src/lib/dayMeta.test.ts`
Expected: PASS.

- [ ] **Step 6: Build the maps in CalendarView and pass them down**

In `src/components/calendar/CalendarView.tsx`:
- Imports:
```tsx
import { holidaySetFromCache, holidayNameMap } from '@/lib/holidays'
import { coveredTripMap } from '@/lib/overlap'
import { buildDayMetaMap } from '@/lib/dayMeta'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import { TooltipProvider } from '@/components/ui/tooltip'
```
- Inside the component:
```tsx
const locations = useMergedLocations()
const names = useMemo(() => holidayNameMap(holidays), [holidays])
const dayMeta = useMemo(
  () => buildDayMetaMap({ window, locations, holidayNames: names, covered }),
  [window, locations, names, covered],
)
```
- Wrap the returned month list in `<TooltipProvider delayDuration={150}>…</TooltipProvider>` and pass `dayMeta={dayMeta}` to each `MonthGrid`.

Note: in read-only share view, `holidays` is `{}` and overrides come from the local store via `useMergedLocations` — acceptable (tooltips show the viewer's seasonality data).

- [ ] **Step 7: Thread `dayMeta` through MonthGrid → DayCell**

`MonthGrid.tsx`: add prop `dayMeta: Map<string, DayMeta>` (import the type from `@/lib/dayMeta`) and pass `meta={dayMeta.get(d)}` to each `DayCell`.

`DayCell.tsx`: accept `meta?: DayMeta`, and wrap the `<button>` in a tooltip when meta is non-empty:

```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { DayMeta } from '@/lib/dayMeta'
```
```tsx
const hasTooltip = !!meta && (!!meta.holidayName || !!meta.trip || meta.goodLocs.length > 0 || meta.fairLocs.length > 0)
const button = ( /* the existing <button> element */ )
if (!hasTooltip) return button
return (
  <Tooltip>
    <TooltipTrigger asChild>{button}</TooltipTrigger>
    <TooltipContent className="max-w-xs space-y-1 text-xs">
      {meta!.goodLocs.length > 0 && (
        <div><div className="font-semibold text-good">Good for diving</div><div className="text-muted-foreground">· {meta!.goodLocs.join(' · ')}</div></div>
      )}
      {meta!.fairLocs.length > 0 && (
        <div><div className="font-semibold text-fair">Fair</div><div className="text-muted-foreground">· {meta!.fairLocs.join(' · ')}</div></div>
      )}
      {meta!.holidayName && <div>Holiday: {meta!.holidayName}</div>}
      {meta!.trip && <div>Planned: {meta!.trip.label.slice(0, 30)}</div>}
    </TooltipContent>
  </Tooltip>
)
```

To keep the `button` reference clean, assign the existing `<button>…</button>` JSX to a `const button` before the early return.

- [ ] **Step 8: Run the full suite**

Run: `bun run test`
Expected: PASS. (Existing CalendarView tests query `getByRole('button', { name: /^day / })`; the tooltip `TooltipTrigger asChild` renders the same button, so role queries still match.)

- [ ] **Step 9: Verify the build**

Run: `bun run build`
Expected: type-clean, build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/lib/dayMeta.ts src/lib/dayMeta.test.ts src/components/ui/tooltip.tsx src/components/calendar/CalendarView.tsx src/components/calendar/MonthGrid.tsx src/components/calendar/DayCell.tsx package.json bun.lock
git commit -m "feat: add per-day hover tooltip with seasonality, holiday, and trip

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Dark-mode tokens & shadcn variable bridge

Add the `--surface-elevated` token and the dark palette, register every bridge colour as a Tailwind utility (required for the vendored shadcn components to render), and point Dialog/Sheet at the elevated surface.

**Files:**
- Modify: `src/index.css`, `tailwind.config.ts`
- Modify: `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`
- Modify: `docs/superpowers/specs/2026-06-28-ui-v2-design.md` (record the bridge/registration + bg-card clarifications)

**Interfaces:**
- Produces: Tailwind utilities `bg-surface-elevated`, `bg-background`, `bg-card`, `text-card-foreground`, `bg-popover`, `text-popover-foreground`, `border-border`, `border-input`, `ring-ring`, `text-muted-foreground`, plus `text-primary-foreground` (white) used by Button. CSS `.dark` overrides on `<html>`.

- [ ] **Step 1: Replace `src/index.css` with tokens + dark overrides + bridge**

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --surface: #F2F7F8;
  --surface-elevated: #FFFFFF;
  --ink: #0B1F2A;
  --muted: #5B7682;
  --line: #D7E3E6;
  --primary: #0E7C86;
  --good: #0E9F6E;
  --fair: #D9A406;
  --poor: #E05A3B;
  --closed: #8595A0;
  --fun-dive: #2563EB;
  --course: #0E9F6E;
  --liveaboard: #7C3AED;
  --non-dive: #8595A0;

  /* Shadcn variable bridge → our semantic tokens. */
  --background: var(--surface);
  --foreground: var(--ink);
  --card: var(--surface-elevated);
  --card-foreground: var(--ink);
  --popover: var(--surface-elevated);
  --popover-foreground: var(--ink);
  --primary-foreground: #FFFFFF;
  --border: var(--line);
  --input: var(--line);
  --ring: var(--primary);
  --muted-foreground: var(--muted);
}

.dark {
  --surface: #0D1E27;
  --surface-elevated: #122B38;
  --ink: #E8F4F6;
  --muted: #7BA3AE;
  --line: #1E3545;
  --primary: #14A8B5;
  --fair: #F5C030;
  /* --good, --poor, --closed, and trip-type colours are readable on both backgrounds. */
}

@layer base {
  html { color-scheme: light dark; }
  body {
    @apply bg-surface text-ink font-body antialiased;
  }
  h1, h2, h3 { @apply font-display; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: Register the bridge colours in `tailwind.config.ts`**

Extend the `colors` map (Tailwind v3 reads the CSS vars at runtime — no `<alpha-value>` needed for these flat tokens; opacity utilities like `/80` still work because the var is a hex colour):

```ts
colors: {
  surface: 'var(--surface)',
  'surface-elevated': 'var(--surface-elevated)',
  ink: 'var(--ink)',
  muted: 'var(--muted)',
  line: 'var(--line)',
  primary: 'var(--primary)',
  good: 'var(--good)',
  fair: 'var(--fair)',
  poor: 'var(--poor)',
  closed: 'var(--closed)',
  'fun-dive': 'var(--fun-dive)',
  course: 'var(--course)',
  liveaboard: 'var(--liveaboard)',
  'non-dive': 'var(--non-dive)',
  // Shadcn bridge utilities (consumed by vendored ui/* components).
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  card: 'var(--card)',
  'card-foreground': 'var(--card-foreground)',
  popover: 'var(--popover)',
  'popover-foreground': 'var(--popover-foreground)',
  'primary-foreground': 'var(--primary-foreground)',
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
  'muted-foreground': 'var(--muted-foreground)',
},
```

- [ ] **Step 3: Point Dialog & Sheet at the elevated surface**

In `src/components/ui/dialog.tsx`, change the `DialogContent` class `bg-background` → `bg-card`.
In `src/components/ui/sheet.tsx`, change the `sheetVariants` base class `bg-background` → `bg-card`.

(These are the only surfaces that should read as "elevated". Other `bg-background` usages, e.g. Button outline, stay as-is.)

- [ ] **Step 4: Record the clarification in the spec doc**

In `docs/superpowers/specs/2026-06-28-ui-v2-design.md`, under §2.3/§2.4, add a note: the bridge variables are also registered as Tailwind colour utilities in `tailwind.config.ts` (required in Tailwind v3 for the utilities to exist), and Dialog/Sheet use `bg-card` (changed from the default `bg-background`) to read as elevated.

- [ ] **Step 5: Verify build + tests**

Run: `bun run build && bun run test`
Expected: build type-clean; tests still 57+/passing (no behavioural test depends on colour).

- [ ] **Step 6: Commit**

```bash
git add src/index.css tailwind.config.ts src/components/ui/dialog.tsx src/components/ui/sheet.tsx docs/superpowers/specs/2026-06-28-ui-v2-design.md
git commit -m "feat: add dark palette, surface-elevated token, and shadcn colour bridge

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Theme setting, App effect & bg-white audit

Add `Settings.theme` (default dark), apply it on `<html>`, and replace hardcoded `bg-white` on form controls with `bg-surface-elevated`.

**Files:**
- Modify: `src/types.ts`, `src/App.tsx`
- Modify: `src/components/TripDrawer.tsx`, `src/components/SettingsDialog.tsx`, `src/components/BookingChecklist.tsx`, `src/components/AddLocationDialog.tsx`
- Test: `src/store/useAppStore.test.ts` (assert default theme)

**Interfaces:**
- Produces: `Settings.theme: 'dark' | 'light'`; `DEFAULT_SETTINGS.theme = 'dark'`.

- [ ] **Step 1: Write failing test for the default theme**

Add to `src/store/useAppStore.test.ts` (a `DEFAULT_SETTINGS` assertion):

```ts
import { DEFAULT_SETTINGS } from '@/types'

it('defaults theme to dark', () => {
  expect(DEFAULT_SETTINGS.theme).toBe('dark')
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/store/useAppStore.test.ts`
Expected: FAIL — `theme` is undefined.

- [ ] **Step 3: Add `theme` to `Settings` + default**

In `src/types.ts`:
```ts
export interface Settings {
  country: string // ISO 3166-1 alpha-2
  leaveBudget: Record<number, number> // days available per calendar year (includes any carryover)
  theme: 'dark' | 'light'
}
```
```ts
export const DEFAULT_SETTINGS: Settings = {
  country: 'SG',
  leaveBudget: { [_year]: 25, [_year + 1]: 25 },
  theme: 'dark',
}
```

- [ ] **Step 4: Apply the theme in `App.tsx`**

```tsx
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'
import LeaveBalanceBar from '@/components/LeaveBalanceBar'
import { Toaster } from '@/components/ui/sonner'
import { useHolidays } from '@/hooks/useHolidays'
import { useAppStore } from '@/store/useAppStore'

export default function App() {
  useHolidays()
  const theme = useAppStore((s) => s.settings.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav />
      <LeaveBalanceBar />
      <Outlet />
      <Toaster />
    </div>
  )
}
```

(Note: `Nav` no longer takes `actions`; Settings/Share move into Nav in Task 8. Until Task 8 lands, Settings/Share are temporarily unreachable from the shell — acceptable mid-sequence, restored next task. If implementing strictly green between tasks, keep `<Nav actions={<><SettingsDialog /><ShareButton /></>} />` here and remove the prop in Task 8.)

- [ ] **Step 5: Audit `bg-white` → `bg-surface-elevated`**

Replace every `bg-white` occurrence in these files:
- `src/components/TripDrawer.tsx` (trip name input, both date inputs, type select, status select, notes textarea, the leave/dives summary box `bg-white` → `bg-surface-elevated`).
- `src/components/SettingsDialog.tsx` (none currently use `bg-white`; the country select and number inputs use only `border-line` — add `bg-surface-elevated` to each so they read as elevated in dark mode).
- `src/components/BookingChecklist.tsx` (category select + label input).
- `src/components/AddLocationDialog.tsx` (name/country inputs, difficulty select, month-rating selects — these use `border-line` with no bg; add `bg-surface-elevated`).
- `src/components/LocationPicker.tsx` (the `bg-white` on the select → `bg-surface-elevated`).

Use Grep to find them: `bg-white` across `src/**`. Replace all with `bg-surface-elevated`.

- [ ] **Step 6: Run tests + build**

Run: `bun run test && bun run build`
Expected: PASS, build clean.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/App.tsx src/store/useAppStore.test.ts src/components/TripDrawer.tsx src/components/SettingsDialog.tsx src/components/BookingChecklist.tsx src/components/AddLocationDialog.tsx src/components/LocationPicker.tsx
git commit -m "feat: add theme setting (default dark) and audit elevated surfaces

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Responsive top nav + sticky leave bar + theme toggle

Remove the mobile bottom tab bar; put all nav items (Planner, Locations, Settings, Share, theme toggle) in the top bar — icon+text on desktop, icon-only on mobile. Make the leave bar sticky.

**Files:**
- Modify: `src/components/Nav.tsx`, `src/App.tsx` (drop `actions` prop if not already), `src/components/LeaveBalanceBar.tsx`
- Test: `src/components/Nav.test.tsx`

**Interfaces:**
- Consumes: `SettingsDialog`, `ShareButton`, `useAppStore` theme + `updateSettings`.
- `Nav` no longer accepts `actions`.

- [ ] **Step 1: Update `Nav.test.tsx` expectations**

Read the current `src/components/Nav.test.tsx` first; adjust any assertion that relies on the bottom bar or `actions`. Add an assertion that the Settings and Share controls render within the nav and that a theme-toggle button exists:

```ts
it('renders nav items including settings, share, and a theme toggle', () => {
  render(<MemoryRouter><Nav /></MemoryRouter>)
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/settings/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/share/i)).toBeInTheDocument()
})
```

(Keep existing Planner/Locations link assertions. Wrap in the same router the existing test uses.)

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/components/Nav.test.tsx`
Expected: FAIL — no theme toggle; Settings/Share not in Nav.

- [ ] **Step 3: Rewrite `Nav.tsx`**

```tsx
import { NavLink } from 'react-router-dom'
import { CalendarDays, MapPin, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'
import SettingsDialog from '@/components/SettingsDialog'
import ShareButton from '@/components/ShareButton'

const links = [
  { to: '/', label: 'Planner', icon: CalendarDays, end: true },
  { to: '/locations', label: 'Locations', icon: MapPin, end: false },
]

export default function Nav() {
  const theme = useAppStore((s) => s.settings.theme)
  const updateSettings = useAppStore((s) => s.updateSettings)
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <span className="font-display text-lg font-bold text-primary">DivePlanner</span>
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted hover:text-ink md:px-3', isActive && 'bg-line/60 text-ink')}>
              <Icon className="h-4 w-4" /> <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
          <SettingsDialog />
          <ShareButton />
          <button type="button" aria-label="Toggle theme"
            onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
            className="flex items-center rounded-md px-2.5 py-1.5 text-muted hover:text-ink md:px-3">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Make SettingsDialog & ShareButton labels icon-only on mobile**

In `src/components/SettingsDialog.tsx`, wrap the trigger's text in a responsive span:
```tsx
<SettingsIcon className="h-4 w-4" /> <span className="hidden md:inline">Settings</span>
```
In `src/components/ShareButton.tsx`, likewise:
```tsx
<Share2 className="h-4 w-4" /> <span className="hidden md:inline">Share</span>
```

- [ ] **Step 5: Make the leave bar sticky**

In `src/components/LeaveBalanceBar.tsx`, change the outer wrapper:
```tsx
<div className="sticky top-14 z-10 border-b border-line bg-surface">
```

- [ ] **Step 6: Ensure `App.tsx` renders `<Nav />` without `actions`**

If Task 7 left `actions` in place, remove it now and delete the `SettingsDialog`/`ShareButton` imports from `App.tsx` (they live in `Nav` now).

- [ ] **Step 7: Run tests + build**

Run: `bun run test && bun run build`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/Nav.tsx src/components/Nav.test.tsx src/App.tsx src/components/LeaveBalanceBar.tsx src/components/SettingsDialog.tsx src/components/ShareButton.tsx
git commit -m "feat: responsive top nav with theme toggle, sticky leave bar

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Compact 3-column calendar grid

Render all months in a responsive grid and shrink `MonthGrid` to a compact layout.

**Files:**
- Modify: `src/components/calendar/CalendarView.tsx`, `src/components/calendar/MonthGrid.tsx`
- Test: `src/components/calendar/CalendarView.test.tsx` (heading count already window-based — unchanged)

**Interfaces:** none new.

- [ ] **Step 1: Wrap the month list in a grid**

In `src/components/calendar/CalendarView.tsx`, change the container that maps `window` from `<div>` to:
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
```
(Keep it inside the `TooltipProvider` from Task 5.)

- [ ] **Step 2: Compact `MonthGrid`**

In `src/components/calendar/MonthGrid.tsx`:
- Section margin: `className="mb-2"` (was `mb-8`; the grid `gap-4` now provides spacing).
- Heading: `className="mb-1.5 font-display text-sm font-semibold"` (was `text-lg`).
- Day grid: keep `grid grid-cols-7 gap-0.5 text-center text-[0.7rem] text-muted` (tighter gap + smaller text; was `gap-1 text-xs`).
- The `DayCell` already uses `aspect-square text-sm`; tighten to `text-xs` by passing no change to DayCell — instead set the cell text via the grid's `text-[0.7rem]` is for the weekday header row; keep DayCell readable. (Do **not** change DayCell font here; compactness comes from the grid gap and smaller heading.)

- [ ] **Step 3: Run tests + build**

Run: `bun run test && bun run build`
Expected: PASS — heading count test still matches `calendarWindow(new Date()).length`.

- [ ] **Step 4: Commit**

```bash
git add src/components/calendar/CalendarView.tsx src/components/calendar/MonthGrid.tsx
git commit -m "feat: compact 3-column calendar grid

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Extract `TripPanel` + inline split panel

Move the drawer body into a reusable `TripPanel`; render it inside a `Sheet` on mobile and inline as a right column on desktop.

**Files:**
- Create: `src/components/TripPanel.tsx`
- Modify: `src/components/TripDrawer.tsx` (thin Sheet wrapper), `src/routes/PlannerPage.tsx`
- Test: `src/components/TripDrawer.test.tsx` (must still pass), add `src/components/TripPanel.test.tsx` optional smoke

**Interfaces:**
- Produces: `TripPanel` props `{ mode: 'create' | 'edit'; initialRange?: { start: string; end: string }; trip?: Trip; defaultLocationId?: string; onClose: () => void }` — identical form behaviour to today's `TripDrawer` body.
- `TripDrawer` keeps its current props `{ open, mode, initialRange, trip, defaultLocationId, onClose }` and renders `<TripPanel … />` inside `<SheetContent>`.

- [ ] **Step 1: Create `TripPanel.tsx` by moving the drawer body verbatim**

Move everything currently between `<SheetContent>`'s opening tag and closing tag in `TripDrawer.tsx` (the `<SheetHeader>` + the `<div className="space-y-4 py-4">…</div>`) into a new `TripPanel` component. `TripPanel` owns all the state/effects/`save` that `TripDrawer` has today (the `useEffect` keyed on `open` becomes keyed on mount + the same deps; since the panel only mounts when shown, drop `open` from the guard and run on `[mode, trip, initialRange, defaultLocationId]`).

```tsx
import { useMemo, useState, useEffect } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import BookingChecklist from './BookingChecklist'
import LocationPicker from './LocationPicker'
import { useAppStore } from '@/store/useAppStore'
import { hasOverlap } from '@/lib/overlap'
import { leaveDaysByYear } from '@/lib/leave'
import { estimatedDives } from '@/lib/dives'
import { holidaySetFromCache } from '@/lib/holidays'
import type { BookingItem, Trip, TripStatus, TripType } from '@/types'

const TYPES: TripType[] = ['fun-dive', 'course', 'liveaboard', 'non-dive']
const STATUSES: TripStatus[] = ['wishlist', 'planned', 'confirmed']

function seedBookings(type: TripType): BookingItem[] {
  if (type === 'non-dive') return []
  return [
    { id: crypto.randomUUID(), category: 'dive-shop', label: '', booked: false },
    { id: crypto.randomUUID(), category: 'accommodation', label: '', booked: false },
  ]
}

export default function TripPanel({ mode, initialRange, trip, defaultLocationId, onClose }: {
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  onClose: () => void
}) {
  const { addTrip, updateTrip, deleteTrip, trips, holidays } = useAppStore()
  const [label, setLabel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [type, setType] = useState<TripType>('fun-dive')
  const [status, setStatus] = useState<TripStatus>('wishlist')
  const [locationId, setLocationId] = useState<string | undefined>(undefined)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [notes, setNotes] = useState('')
  const [diveOverride, setDiveOverride] = useState<number | undefined>(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'edit' && trip) {
      setLabel(trip.label); setStart(trip.startDate); setEnd(trip.endDate); setType(trip.type)
      setStatus(trip.status); setLocationId(trip.locationId); setBookings(trip.bookings)
      setNotes(trip.notes ?? ''); setDiveOverride(trip.estimatedDives)
    } else if (initialRange) {
      setLabel(''); setStart(initialRange.start); setEnd(initialRange.end); setType('fun-dive')
      setStatus('wishlist'); setLocationId(defaultLocationId); setBookings(seedBookings('fun-dive'))
      setNotes(''); setDiveOverride(undefined)
    }
    setError('')
  }, [mode, trip, initialRange, defaultLocationId])

  const holidaySet = useMemo(() => holidaySetFromCache(holidays), [holidays])
  const leaveByYear = start && end ? leaveDaysByYear(start, end, holidaySet) : {}
  const autoDives = start && end ? estimatedDives(type, start, end) : 0
  const allBooked = bookings.length > 0 && bookings.every((b) => b.booked)

  const onTypeChange = (t: TripType) => {
    setType(t)
    if (t === 'non-dive') setBookings([])
    else if (bookings.length === 0) setBookings(seedBookings(t))
  }

  const save = () => {
    if (!start || !end || start > end) { setError('Please enter a valid date range.'); return }
    const id = mode === 'edit' && trip ? trip.id : crypto.randomUUID()
    if (hasOverlap(trips, start, end, id)) { setError('This range overlaps another trip.'); return }
    const next: Trip = {
      id, label: label.trim() || 'Untitled trip', startDate: start, endDate: end, type, status,
      locationId, bookings: type === 'non-dive' ? [] : bookings, notes: notes.trim() || undefined,
      estimatedDives: diveOverride,
    }
    mode === 'edit' ? updateTrip(next) : addTrip(next)
    onClose()
  }

  return (
    <>
      <SheetHeader><SheetTitle>{mode === 'edit' ? 'Edit trip' : 'New trip'}</SheetTitle></SheetHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-1">
          <label htmlFor="trip-name" className="text-sm font-medium">Trip name</label>
          <input id="trip-name" value={label} onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" placeholder="Malapascua May 2026" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="start" className="text-sm font-medium">Start</label>
            <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label htmlFor="end" className="text-sm font-medium">End</label>
            <input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
          </div>
        </div>

        <LocationPicker value={locationId} onChange={setLocationId} />

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="type" className="text-sm font-medium">Trip type</label>
            <select id="type" value={type} onChange={(e) => onTypeChange(e.target.value as TripType)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as TripStatus)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {type !== 'non-dive' && <BookingChecklist items={bookings} onChange={setBookings} />}

        {allBooked && status !== 'confirmed' && (
          <button type="button" onClick={() => setStatus('confirmed')} className="text-sm text-primary">
            All booked — mark as confirmed?
          </button>
        )}

        <div className="space-y-1">
          <label htmlFor="notes" className="text-sm font-medium">Notes</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
        </div>

        <div className="rounded-md border border-line bg-surface-elevated p-3 font-mono text-xs">
          <div>Leave: {Object.entries(leaveByYear).map(([y, n]) => `${y}: ${n}d`).join('  ·  ') || '0d'}</div>
          <div className="mt-1 flex items-center gap-2">
            <span>Dives: {diveOverride ?? autoDives}</span>
            <input type="number" min={0} value={diveOverride ?? autoDives}
              onChange={(e) => setDiveOverride(e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-16 rounded border border-line px-1 py-0.5" aria-label="estimated dives" />
          </div>
        </div>

        {error && <p className="text-sm text-poor">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={save} className="flex-1">Save</Button>
          {mode === 'edit' && trip && (
            <Button variant="destructive" onClick={() => { deleteTrip(trip.id); onClose() }}>Delete</Button>
          )}
        </div>
      </div>
    </>
  )
}
```

(Status default is now `'wishlist'` — this absorbs Task 11's status-default change; keep the placeholder/label tweaks for Task 11.)

- [ ] **Step 2: Slim `TripDrawer.tsx` to a Sheet wrapper**

```tsx
import { Sheet, SheetContent } from '@/components/ui/sheet'
import TripPanel from './TripPanel'
import type { Trip } from '@/types'

export default function TripDrawer({ open, mode, initialRange, trip, defaultLocationId, onClose }: {
  open: boolean
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  onClose: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <TripPanel mode={mode} initialRange={initialRange} trip={trip} defaultLocationId={defaultLocationId} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  )
}
```

(`{open && …}` ensures `TripPanel` remounts each open, so its mount effect re-seeds the form — replicating the old `open`-keyed effect.)

- [ ] **Step 3: Desktop inline split in `PlannerPage.tsx`**

```tsx
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import TripPanel from '@/components/TripPanel'
import type { Trip } from '@/types'

export default function PlannerPage() {
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)
  const open = pending !== null || editing !== null
  const [params] = useSearchParams()
  const defaultLocationId = params.get('location') ?? undefined
  const mode = editing ? 'edit' : 'create'
  const close = () => { setPending(null); setEditing(null) }
  const calendar = (
    <CalendarView
      onRangeSelected={(start, end) => { setEditing(null); setPending({ start, end }) }}
      onTripClick={(t) => { setPending(null); setEditing(t) }}
    />
  )
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Desktop: inline split. Calendar narrows to ~60% when the panel is open. */}
      <div className="hidden lg:flex lg:gap-6">
        <div className={open ? 'lg:w-3/5' : 'w-full'}>{calendar}</div>
        {open && (
          <aside className="lg:w-2/5">
            <div className="sticky top-32 rounded-lg border border-line bg-surface-elevated p-4">
              <TripPanel key={editing?.id ?? `${pending?.start}-${pending?.end}`}
                mode={mode} initialRange={pending ?? undefined} trip={editing ?? undefined}
                defaultLocationId={defaultLocationId} onClose={close} />
            </div>
          </aside>
        )}
      </div>
      {/* Mobile/tablet: calendar + Sheet overlay. */}
      <div className="lg:hidden">
        {calendar}
        <TripDrawer open={open} mode={mode} initialRange={pending ?? undefined}
          trip={editing ?? undefined} defaultLocationId={defaultLocationId} onClose={close} />
      </div>
    </main>
  )
}
```

(The `key` on the inline `TripPanel` forces a remount when the selection changes, matching the Sheet's remount semantics.)

- [ ] **Step 4: Run tests + build**

Run: `bun run test && bun run build`
Expected: PASS — `TripDrawer.test.tsx` renders `TripDrawer open …`, which now mounts `TripPanel`; the `trip name` field, `save`, overlap error, and booking checklist all still resolve. Note one behavioural change: status now defaults to `wishlist` (was `planned`); no existing test asserts the default, so green.

- [ ] **Step 5: Commit**

```bash
git add src/components/TripPanel.tsx src/components/TripDrawer.tsx src/routes/PlannerPage.tsx
git commit -m "refactor: extract TripPanel; inline split panel on desktop

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Trip drawer form field improvements

Apply the placeholder/label refinements (status default already moved in Task 10).

**Files:**
- Modify: `src/components/TripPanel.tsx`, `src/components/BookingChecklist.tsx`
- Test: `src/components/TripDrawer.test.tsx`

**Interfaces:** none new.

- [ ] **Step 1: Write a failing test for the new placeholders/labels**

Add to `src/components/TripDrawer.test.tsx`:

```ts
it('uses the new placeholders, inclusive date labels, and wishlist default', () => {
  render(<TripDrawer open mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={() => {}} />)
  expect(screen.getByPlaceholderText('e.g. Malapascua May 2026')).toBeInTheDocument()
  expect(screen.getByText('Start (inclusive)')).toBeInTheDocument()
  expect(screen.getByText('End (inclusive)')).toBeInTheDocument()
  expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('wishlist')
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/components/TripDrawer.test.tsx`
Expected: FAIL — placeholder/label text not present.

- [ ] **Step 3: Apply the field changes in `TripPanel.tsx`**

- Trip name input: `placeholder="e.g. Malapascua May 2026"`.
- Start label text: `Start (inclusive)`.
- End label text: `End (inclusive)`.
- Status `<select>` already defaults to `'wishlist'` (Task 10). Ensure the select has an accessible name — it already uses `<label htmlFor="status">Status</label>`, so `getByLabelText('Status')` resolves.

In `src/components/BookingChecklist.tsx`, the accommodation/dive-shop placeholder is shared (`"e.g. Blahblah Divers"`). Per spec the dive-shop placeholder is already correct; leave the generic item placeholder as-is (booking rows are not per-category in this UI).

- [ ] **Step 4: Run, verify it passes**

Run: `bunx vitest run src/components/TripDrawer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/TripPanel.tsx src/components/TripDrawer.test.tsx
git commit -m "feat: refine trip form placeholders and inclusive date labels

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Location "Other" + `customLocation`

Add a free-text "Other…" option to the location picker, persist it as `Trip.customLocation`, and display it.

**Files:**
- Modify: `src/types.ts`, `src/components/LocationPicker.tsx`, `src/components/TripPanel.tsx`, `src/components/calendar/TripBlock.tsx`
- Test: `src/components/LocationPicker.test.tsx` (new), `src/components/TripDrawer.test.tsx`

**Interfaces:**
- Produces: `Trip.customLocation?: string`.
- `LocationPicker` props change to `{ value?: string; customValue?: string; onChange: (id: string | undefined, custom: string | undefined) => void }`.

- [ ] **Step 1: Add `customLocation` to `Trip`**

In `src/types.ts`, add to `interface Trip` after `locationId?`:
```ts
  customLocation?: string // used when no known locationId is selected
```

- [ ] **Step 2: Write a failing test for LocationPicker "Other…"**

`src/components/LocationPicker.test.tsx`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationPicker from './LocationPicker'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {} })
})

describe('LocationPicker', () => {
  it('reveals a custom input when "Other…" is selected and emits customValue', async () => {
    const onChange = vi.fn()
    render(<LocationPicker onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Location'), '__other__')
    expect(onChange).toHaveBeenLastCalledWith(undefined, '')
    const input = await screen.findByLabelText(/custom location/i)
    await userEvent.type(input, 'Secret Reef')
    expect(onChange).toHaveBeenLastCalledWith(undefined, 'Secret Reef')
  })
})
```

- [ ] **Step 3: Run, verify it fails**

Run: `bunx vitest run src/components/LocationPicker.test.tsx`
Expected: FAIL — no `__other__` option / custom input.

- [ ] **Step 4: Rewrite `LocationPicker.tsx`**

```tsx
import { useMergedLocations } from '@/hooks/useMergedLocations'

const OTHER = '__other__'

export default function LocationPicker({ value, customValue, onChange }: {
  value?: string
  customValue?: string
  onChange: (id: string | undefined, custom: string | undefined) => void
}) {
  const locations = useMergedLocations()
  const isOther = value === undefined && customValue !== undefined
  return (
    <div className="space-y-1">
      <label htmlFor="location" className="text-sm font-medium">Location</label>
      <select id="location" value={isOther ? OTHER : value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          if (v === OTHER) onChange(undefined, '')
          else onChange(v || undefined, undefined)
        }}
        className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm">
        <option value="">— none —</option>
        {locations.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.country}</option>)}
        <option value={OTHER}>Other…</option>
      </select>
      {isOther && (
        <input aria-label="custom location" value={customValue ?? ''} placeholder="Custom location name"
          onChange={(e) => onChange(undefined, e.target.value)}
          className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Wire `customLocation` into `TripPanel`**

In `src/components/TripPanel.tsx`:
- Add state: `const [customLocation, setCustomLocation] = useState<string | undefined>(undefined)`.
- In the edit branch of the mount effect: `setCustomLocation(trip.customLocation)`. In the create branch: `setCustomLocation(undefined)`.
- Replace the `LocationPicker` usage:
```tsx
<LocationPicker value={locationId} customValue={customLocation}
  onChange={(id, custom) => { setLocationId(id); setCustomLocation(custom) }} />
```
- In `save`, include `customLocation: customLocation?.trim() || undefined` in the `next` object.

- [ ] **Step 6: Display custom/known location in `TripBlock`**

`src/components/calendar/TripBlock.tsx` — resolve a location label and show it as a faint suffix:

```tsx
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import type { Trip } from '@/types'

const typeColor: Record<Trip['type'], string> = {
  'fun-dive': 'bg-fun-dive', course: 'bg-course', liveaboard: 'bg-liveaboard', 'non-dive': 'bg-non-dive',
}

export default function TripBlock({ trip, onClick, readOnly }: { trip: Trip; onClick?: () => void; readOnly?: boolean }) {
  const locations = useMergedLocations()
  const place = trip.locationId ? locations.find((l) => l.id === trip.locationId)?.name : trip.customLocation
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-1.5 truncate rounded-md px-2 py-1 text-left text-xs font-medium text-white',
        typeColor[trip.type],
        trip.status === 'wishlist' && 'border border-dashed border-white/70 bg-opacity-60',
        trip.status === 'confirmed' && 'ring-1 ring-white/40',
      )}
    >
      {trip.status === 'confirmed' && <Check className="h-3 w-3 shrink-0" />}
      <span className="truncate">{trip.label}</span>
      {place && <span className="truncate text-white/70">· {place}</span>}
    </button>
  )
}
```

- [ ] **Step 7: Add a TripPanel save test for customLocation**

Add to `src/components/TripDrawer.test.tsx`:

```ts
it('saves a custom location when "Other…" is chosen', async () => {
  render(<TripDrawer open mode="create" initialRange={{ start: '2026-07-01', end: '2026-07-03' }} onClose={() => {}} />)
  await userEvent.selectOptions(screen.getByLabelText('Location'), '__other__')
  await userEvent.type(screen.getByLabelText(/custom location/i), 'Secret Reef')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))
  expect(useAppStore.getState().trips[0].customLocation).toBe('Secret Reef')
  expect(useAppStore.getState().trips[0].locationId).toBeUndefined()
})
```

- [ ] **Step 8: Run tests + build**

Run: `bun run test && bun run build`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/types.ts src/components/LocationPicker.tsx src/components/LocationPicker.test.tsx src/components/TripPanel.tsx src/components/calendar/TripBlock.tsx src/components/TripDrawer.test.tsx
git commit -m "feat: add custom 'Other' location option (customLocation)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 13: Seasonality panel in the trip drawer

Show "Dive conditions" (good/fair locations) for the trip's months when `type !== 'non-dive'`.

**Files:**
- Modify: `src/lib/dates.ts` (add `monthsInRange`), `src/components/TripPanel.tsx`
- Test: `src/lib/dates.test.ts`

**Interfaces:**
- Produces: `monthsInRange(start: ISODate, end: ISODate): number[]` — sorted unique 1–12 month numbers spanned by the inclusive range.

- [ ] **Step 1: Write a failing test for `monthsInRange`**

Add to `src/lib/dates.test.ts`:

```ts
import { monthsInRange } from './dates'

it('monthsInRange returns the unique months a range spans', () => {
  expect(monthsInRange('2026-04-29', '2026-05-02')).toEqual([4, 5])
  expect(monthsInRange('2026-05-10', '2026-05-12')).toEqual([5])
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/lib/dates.test.ts`
Expected: FAIL — `monthsInRange` not exported.

- [ ] **Step 3: Implement `monthsInRange`**

Add to `src/lib/dates.ts`:

```ts
export function monthsInRange(start: ISODate, end: ISODate): number[] {
  const set = new Set<number>()
  for (const d of enumerateDays(start, end)) set.add(Number(d.slice(5, 7)))
  return [...set].sort((a, b) => a - b)
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `bunx vitest run src/lib/dates.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the "Dive conditions" section to `TripPanel.tsx`**

Imports:
```tsx
import { monthsInRange } from '@/lib/dates'
import { useMergedLocations } from '@/hooks/useMergedLocations'
```
Inside the component (after `autoDives`):
```tsx
const allLocations = useMergedLocations()
const conditions = useMemo(() => {
  if (type === 'non-dive' || !start || !end) return { good: [] as string[], fair: [] as string[] }
  const months = monthsInRange(start, end)
  const good: string[] = []
  const fair: string[] = []
  for (const loc of allLocations) {
    const ratings = months.map((m) => loc.seasonality.find((s) => s.month === m)?.rating)
    if (ratings.includes('good')) good.push(loc.name)
    else if (ratings.includes('fair')) fair.push(loc.name)
  }
  return { good, fair }
}, [type, start, end, allLocations])
```
Render below the date inputs (before or after `LocationPicker`), only when `type !== 'non-dive'`:
```tsx
{type !== 'non-dive' && (conditions.good.length > 0 || conditions.fair.length > 0) && (
  <div className="rounded-md border border-line bg-surface-elevated p-3 text-xs">
    <div className="mb-1 font-medium">Dive conditions</div>
    {conditions.good.length > 0 && (
      <div className="mb-1"><span className="font-semibold text-good">Good for diving</span><div className="text-muted">· {conditions.good.join(' · ')}</div></div>
    )}
    {conditions.fair.length > 0 && (
      <div><span className="font-semibold text-fair">Fair</span><div className="text-muted">· {conditions.fair.join(' · ')}</div></div>
    )}
  </div>
)}
```

- [ ] **Step 6: Run tests + build**

Run: `bun run test && bun run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts src/components/TripPanel.tsx
git commit -m "feat: show seasonality (dive conditions) panel in the trip drawer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 14: Segmented leave breakdown

Replace the single-line leave readout with a per-segment breakdown.

**Files:**
- Modify: `src/lib/leave.ts`, `src/components/TripPanel.tsx`
- Test: `src/lib/leave.test.ts`

**Interfaces:**
- Consumes: `holidayNameMap` output (`Map<ISODate, string>`), `isWeekday`/`enumerateDays`.
- Produces:
  - `type SegmentKind = 'leave' | 'holiday' | 'weekend'`
  - `interface Segment { kind: SegmentKind; startDate: ISODate; endDate: ISODate; label?: string; days: number; leaveDays: number }`
  - `segmentDays(start: ISODate, end: ISODate, holidayNames: Map<ISODate, string>): Segment[]`

- [ ] **Step 1: Write failing tests for `segmentDays`**

Add to `src/lib/leave.test.ts`:

```ts
import { segmentDays } from './leave'

describe('segmentDays', () => {
  it('classifies each day and groups consecutive runs', () => {
    // 2026-05-01 Fri (holiday Labour Day), 05-02 Sat, 05-03 Sun, 05-04 Mon (leave).
    const names = new Map([['2026-05-01', 'Labour Day']])
    const segs = segmentDays('2026-05-01', '2026-05-04', names)
    expect(segs).toEqual([
      { kind: 'holiday', startDate: '2026-05-01', endDate: '2026-05-01', label: 'Labour Day', days: 1, leaveDays: 0 },
      { kind: 'weekend', startDate: '2026-05-02', endDate: '2026-05-03', days: 2, leaveDays: 0 },
      { kind: 'leave', startDate: '2026-05-04', endDate: '2026-05-04', days: 1, leaveDays: 1 },
    ])
  })

  it('treats weekday holidays distinctly from leave', () => {
    const segs = segmentDays('2026-05-04', '2026-05-05', new Map([['2026-05-05', 'X']]))
    expect(segs.map((s) => s.kind)).toEqual(['leave', 'holiday'])
  })
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `bunx vitest run src/lib/leave.test.ts`
Expected: FAIL — `segmentDays` not exported.

- [ ] **Step 3: Implement `segmentDays`**

Add to `src/lib/leave.ts`:

```ts
import type { ISODate, Trip } from '@/types'

export type SegmentKind = 'leave' | 'holiday' | 'weekend'

export interface Segment {
  kind: SegmentKind
  startDate: ISODate
  endDate: ISODate
  label?: string
  days: number
  leaveDays: number
}

export function segmentDays(start: ISODate, end: ISODate, holidayNames: Map<ISODate, string>): Segment[] {
  const out: Segment[] = []
  for (const d of enumerateDays(start, end)) {
    const holidayName = holidayNames.get(d)
    let kind: SegmentKind
    let label: string | undefined
    if (holidayName) { kind = 'holiday'; label = holidayName }
    else if (!isWeekday(d)) kind = 'weekend'
    else kind = 'leave'
    const last = out[out.length - 1]
    // Group consecutive days of the same kind. Holidays never merge (each keeps its own name/day).
    if (last && last.kind === kind && kind !== 'holiday') {
      last.endDate = d
      last.days += 1
      last.leaveDays += kind === 'leave' ? 1 : 0
    } else {
      out.push({ kind, startDate: d, endDate: d, label, days: 1, leaveDays: kind === 'leave' ? 1 : 0 })
    }
  }
  return out
}
```

(`enumerateDays` and `isWeekday` are already imported at the top of `leave.ts`; the new `ISODate`/`Trip` import line merges with the existing `import type { ISODate, Trip } from '@/types'` — do not duplicate it.)

- [ ] **Step 4: Run, verify it passes**

Run: `bunx vitest run src/lib/leave.test.ts`
Expected: PASS.

- [ ] **Step 5: Render the breakdown in `TripPanel.tsx`**

Imports:
```tsx
import { leaveDaysByYear, segmentDays } from '@/lib/leave'
import { holidaySetFromCache, holidayNameMap } from '@/lib/holidays'
import { parseISO, format } from 'date-fns'
```
Compute:
```tsx
const names = useMemo(() => holidayNameMap(holidays), [holidays])
const segments = start && end && start <= end ? segmentDays(start, end, names) : []
const totalLeave = segments.reduce((n, s) => n + s.leaveDays, 0)
const totalDays = segments.reduce((n, s) => n + s.days, 0)
```
Helper for a segment's date range label:
```tsx
const fmt = (d: string) => format(parseISO(d), 'EEE d MMM')
const segLabel = (s: typeof segments[number]) =>
  s.startDate === s.endDate ? fmt(s.startDate) : `${fmt(s.startDate)} – ${fmt(s.endDate)}`
const kindLabel = (s: typeof segments[number]) =>
  s.kind === 'holiday' ? `Holiday${s.label ? ` (${s.label})` : ''}`
  : s.kind === 'weekend' ? 'Weekend'
  : `${s.leaveDays} day${s.leaveDays === 1 ? '' : 's'} leave`
```
Replace the existing leave summary box's `<div>Leave: …</div>` line with the segment list (keep the dives override row beneath it):
```tsx
<div className="rounded-md border border-line bg-surface-elevated p-3 font-mono text-xs">
  {segments.length === 0 && <div>Leave: 0d</div>}
  {segments.map((s) => (
    <div key={s.startDate} className="flex justify-between gap-3">
      <span className="text-muted">{segLabel(s)}</span>
      <span className={s.kind === 'leave' ? 'text-ink' : 'text-muted'}>{kindLabel(s)}</span>
    </div>
  ))}
  {segments.length > 0 && (
    <div className="mt-1 border-t border-line pt-1">Total: {totalLeave} day{totalLeave === 1 ? '' : 's'} leave · {totalDays} days trip</div>
  )}
  <div className="mt-1 flex items-center gap-2">
    <span>Dives: {diveOverride ?? autoDives}</span>
    <input type="number" min={0} value={diveOverride ?? autoDives}
      onChange={(e) => setDiveOverride(e.target.value === '' ? undefined : Number(e.target.value))}
      className="w-16 rounded border border-line px-1 py-0.5" aria-label="estimated dives" />
  </div>
</div>
```
The previous `leaveByYear` / `leaveDaysByYear` computation can be removed from `TripPanel` if now unused (the segment totals replace it). Keep `leaveDaysByYear` exported in `leave.ts` — `useLeaveByYear` still uses it.

- [ ] **Step 6: Run tests + build**

Run: `bun run test && bun run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/leave.ts src/lib/leave.test.ts src/components/TripPanel.tsx
git commit -m "feat: segmented leave breakdown in the trip drawer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Final Integration & Verification

After Task 14:

- [ ] **Step 1: Full suite + build**

Run: `bun run test && bun run build`
Expected: all tests pass; production build type-clean.

- [ ] **Step 2: Manual smoke (optional, via `/run` or `bun run dev`)**

Verify: dark mode default; theme toggle flips palette; calendar is 3 columns and collapses to 2 when the desktop panel opens; trip cells show full colour with rounded ends; holiday days show an amber underline; hovering a day shows the seasonality/holiday/trip tooltip; "Other…" location reveals a text input; the drawer shows dive conditions and a segmented leave breakdown; substitute holidays appear for weekend public holidays.

- [ ] **Step 3: Update TRACKER.md**

Mark UI v2 complete, record commits, and update the test-suite count.

## Self-Review Notes (spec coverage)

- §1.1 sticky bars → Task 8. §1.2 responsive nav / no bottom bar → Task 8. §1.3 3-col grid + compact MonthGrid → Task 9. §1.4 calendarWindow → Task 3. §1.5 inline split + TripPanel → Task 10.
- §2.1 `.dark` + default dark → Tasks 6–7. §2.2 tokens + `--surface-elevated` → Task 6. §2.3 bridge (+ Tailwind registration, the spec gap) → Task 6. §2.4 bg-white audit + Dialog/Sheet bg-card → Tasks 6–7.
- §3.1 full-colour cells + `coveredTripMap` → Task 4. §3.2 amber underline → Task 4. §3.3 `HolidayEntry` + `holidayNameMap` → Task 1; `DayMeta`/`buildDayMetaMap` → Task 5. §3.4 hover tooltip → Task 5.
- §4.1 form fields → Task 11 (status default folded into Task 10). §4.2 Other/`customLocation` → Task 12. §4.3 seasonality panel → Task 13. §4.4 `segmentDays` breakdown → Task 14.
- §5.1 `applySubstituteHolidays` → Task 2. §5.2 `calendarWindow` → Task 3.
- §6 unchanged: share encoding naturally includes `customLocation`; locations explorer untouched.
