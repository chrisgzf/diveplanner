# Calendar click-through, nav logo, notes contrast, share-page trip detail — Design Spec
**Date:** 2026-07-02
**Status:** Approved

---

## Overview

Four small, independent fixes/features from user feedback after using the app:

1. Clicking a trip's highlighted date cells in the calendar does nothing — only the trip bar below the month does.
2. The "DivePlanner" logo in the nav bar isn't a link.
3. The location detail "current conditions" note box is hardcoded `bg-white`, unreadable in dark mode.
4. Shared links show trip date ranges on the calendar but no way to see trip details (booking checklist, notes, etc.) — the calendar is fully read-only and nothing is clickable.

---

## 1. Click-through on covered day cells

**Files:** `src/components/calendar/MonthGrid.tsx`, `src/components/calendar/DayCell.tsx`

`MonthGrid` currently gives every `DayCell` the same `onClick={() => onDayClick(d)}`, used for range selection. `TripBlock` (the bar under each month) already calls `onTripClick(trip)` and `PlannerPage` already wires `onTripClick` to open the edit `TripPanel` — so the block works today, but the day cells covering that same trip's dates do not, because `DayCell` is `disabled={readOnly || isCovered}`.

**Change:**
- In `MonthGrid`, when building the `onClick` passed to `DayCell`, branch on coverage:
  ```ts
  onClick={() => {
    const trip = covered.get(d)
    if (trip) onTripClick(trip)
    else onDayClick(d)
  }}
  ```
- In `DayCell`, change `disabled={readOnly || isCovered}` to `disabled={readOnly && !isCovered}`. A covered day is always clickable (it always has an action — view or edit the trip); a non-covered day is only disabled when the calendar is read-only (no range selection allowed there).

No changes needed in `PlannerPage.tsx` — `onTripClick` is already wired to open the edit panel there.

---

## 2. Nav logo links to Planner

**File:** `src/components/Nav.tsx`

Wrap the `<span>DivePlanner</span>` in a react-router `<Link to="/">`, keeping the existing classes.

---

## 3. Fix hardcoded white note box in dark mode

**File:** `src/routes/LocationsPage.tsx` (line ~91)

`currentNote` box uses `bg-white`, a leftover the earlier dark-mode audit missed (everywhere else uses `bg-surface-elevated`, e.g. the identical-purpose "Dive conditions" box in `TripPanel`). Change `bg-white` → `bg-surface-elevated`.

---

## 4. Read-only trip detail view on shared links

### 4.1 Enabling clicks in read-only mode

**File:** `src/components/calendar/TripBlock.tsx`

`TripBlock` is `disabled={readOnly}`, which blocks all clicks on the share page. The button itself never mutates any state — it only calls the `onClick` its parent gave it — so disabling it based on `readOnly` is unnecessary. Drop the `readOnly` prop and the `disabled` attribute entirely from `TripBlock`. `MonthGrid` stops passing `readOnly` to it.

(`DayCell` keeps its own `readOnly` handling from §1 — that one still matters, since a non-covered day's default action is starting a new range selection, which should stay blocked when read-only.)

### 4.2 New component: `TripDetailDialog`

**File:** `src/components/TripDetailDialog.tsx` (new)

A read-only, presentational `Dialog` (shadcn) that displays a single `Trip`:

- Trip name (`trip.label`)
- Dates: `start – end`, inclusive, each with weekday (reuse `formatWeekday` from `lib/dates`)
- Location: resolved name if `locationId` is set, else `customLocation`, else nothing
- Type and status (small colored dot + text, matching the dot style already used in `TripsOverview`)
- Booking checklist: read-only rows — category + label, with a check icon (booked) or a plain circle/dash (not booked). No inputs, no delete buttons.
- Notes, if present

No leave/holiday breakdown — that needs live holiday data for the plan owner's country, which isn't part of the share payload and isn't worth fetching for a read-only view (per user decision).

Props:
```ts
{ trip: Trip | null; locations: Location[]; onClose: () => void }
```

`locations` is passed in by the caller (not read from a hook) so the component doesn't assume where the location list comes from — see §4.3 for why that matters on the share page.

### 4.3 Wiring in `SharePage`

**File:** `src/routes/SharePage.tsx`

- `SharedCalendar` gains local state `viewingTrip: Trip | null` and passes `onTripClick={setViewingTrip}` into `CalendarView`.
- Renders `<TripDetailDialog trip={viewingTrip} locations={mergeLocations(shared.siteOverrides)} onClose={() => setViewingTrip(null)} />`.
- **Bug fixed as part of this:** location names must resolve against the *shared plan's own* `siteOverrides`, not the viewer's local store. `useMergedLocations()` reads from the local Zustand store's `siteOverrides`, which would show a blank/wrong name for a shared trip that references a custom location the viewer doesn't have. `TripDetailDialog` takes `locations` as a prop specifically so `SharePage` can pass `mergeLocations(shared.siteOverrides)` (the shared plan's own data) instead.

### 4.4 View-only guarantee (verified, no change needed)

Confirmed `decodeShare` only parses the hash into a local `useMemo` — it never calls any store setter. `settings`/`trips`/`siteOverrides` are only overwritten if the viewer explicitly clicks "Make this mine" → "Overwrite" (`replaceAll`). `useSyncTheme` (used on `SharePage`) reads the *viewer's own* local `settings.theme`, not the shared plan's settings. No fetch of the shared plan's country/holidays happens anywhere (`useHolidays()` is only called from `App.tsx`, which `SharePage` is a sibling route to, not a child of). This existing behavior already satisfies "shared links are view-only and never override the viewer's settings" — nothing to change here, just confirming it holds.

---

## Testing

- Existing test suite (`bun run test`) must stay green; `TripDrawer.test.tsx`'s Select mock and any `readOnly`/click assertions should be re-checked against the `TripBlock`/`DayCell` prop changes.
- New tests: `MonthGrid`/`DayCell` — clicking a covered day fires `onTripClick` with the right trip, not `onDayClick`; a non-covered day still fires `onDayClick` when not read-only, and is inert when read-only. `TripDetailDialog` — renders trip fields, booking checklist read-only rows, no leave breakdown, calls `onClose`.
