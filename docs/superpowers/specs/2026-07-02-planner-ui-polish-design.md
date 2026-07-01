# Planner page UI polish — Design Spec
**Date:** 2026-07-02
**Status:** Approved

---

## Overview

Four independent UI polish items on the Planner page, from user feedback after using the app:

1. Selecting a date range on the desktop calendar opens the "New trip" panel with no way to dismiss it — the user is stuck unless they save or (in edit mode) delete.
2. Desktop shows a "Planned trips" list (`TripsOverview`) in its split-pane layout; mobile has no way to see it at all.
3. Desktop trip rows show only date range and location — there's room to show more.
4. No aggregated at-a-glance stats (trip counts, dive counts, next-trip countdown) anywhere on the page.

---

## 1. Dismissible desktop trip panel

**Files:** `src/components/TripPanel.tsx`, `src/routes/PlannerPage.tsx`

**Root cause:** `TripDrawer.tsx` (mobile) already wraps `TripPanel` in a shadcn `Sheet`, which ships a working X button, click-outside, and Escape (`src/components/ui/sheet.tsx:67-70`, via Radix `onOpenChange`). But `PlannerPage.tsx`'s desktop branch renders `TripPanel` bare, inline in a static 60/40-split `<aside>` (lines 37-56) — no Sheet, no dismiss chrome at all. Confirmed: `TripPanel`'s `onClose` prop is currently only ever invoked from `save()` and `delete()`, never from a close control.

**Change:**
- `TripPanel` gains a new optional prop `showClose?: boolean` (default `false`).
- When `true`, render an X button (shadcn `Button variant="ghost" size="icon"`, `lucide-react` `X` icon, styled to match `SheetContent`'s close button) in the header row, to the right of the existing "New trip"/"Edit trip" `<h2>`. Clicking it calls `onClose`.
- When `true`, also attach a `useEffect` `keydown` listener for `Escape` that calls `onClose`, cleaned up on unmount. Gated behind `showClose` specifically so the mobile Sheet path (which already handles Escape via Radix) doesn't get a second, redundant handler.
- `PlannerPage.tsx`'s desktop `<aside>` passes `showClose` to `TripPanel`. The `TripDrawer` (mobile) call site is unchanged — it omits the prop, so it defaults to `false`.

No change to `TripDrawer.tsx` or `ui/sheet.tsx`.

---

## 2. Mobile Planner/Trips tabs

**File:** `src/routes/PlannerPage.tsx`

Mobile currently has no access to `TripsOverview` at all. Add a shadcn `Tabs` control (already installed) at the top of the mobile `<main>`, directly below the app-wide sticky `LeaveBalanceBar` (rendered once in `App.tsx`, above the route `<Outlet>`).

- `Tabs` with two `TabsTrigger`s: "Planner" and "Trips". Local `useState<'planner' | 'trips'>('planner')` — not persisted, resets to "Planner" on navigation/reload.
- `TabsContent value="planner"` renders the existing calendar.
- `TabsContent value="trips"` renders `<TripStats />` (see §4) followed by `<TripsOverview onSelect={...} />`, reusing the same `onSelect` handler already wired to `setEditing`.
- Selecting a trip (from either tab, or the calendar) still opens `TripDrawer` as an overlay Sheet on top of whichever tab is active. Closing the drawer does not change the active tab — e.g. selecting a trip from "Trips" and closing the drawer lands back on "Trips".

`Tabs` was chosen over `ToggleGroup`: this switches the page's main content between two views, which is what `Tabs` is semantically for; `ToggleGroup` is for value pickers (e.g. alignment).

---

## 3. Richer desktop trip rows

**File:** `src/components/TripsOverview.tsx`

Extend the existing subtitle line (currently `{dateRange}{place && ' · ' + place}`) to also append dive count and leave days, using the same `·` separator — plain text, no new component:

```
7 Aug 2026 – 11 Aug 2026 · Amed · 9 dives · 1 day leave
12 Oct 2026 – 28 Oct 2026 · Italy · 15 days leave
```

- Dive count: `trip.estimatedDives ?? estimatedDives(trip.type, trip.startDate, trip.endDate)` (from `lib/dives.ts`; a manual override on the trip takes precedence, same logic `TripPanel` already uses). Omitted when `trip.type === 'non-dive'`.
- Leave days: `leaveDaysInRange(trip.startDate, trip.endDate, holidaySet, excludedSet)` (from `lib/leave.ts`), where `holidaySet = holidaySetFromCache(holidays)` (store holidays, same pattern as `CalendarView.tsx`) and `excludedSet = trip.excludedLeaveDates ? new Set(trip.excludedLeaveDates) : undefined`. Omitted when the result is `0`.
- Singular/plural: "1 dive"/"N dives", "1 day leave"/"N days leave".
- Shown at `lg:` breakpoint and up only — mobile rows (including the new "Trips" tab from §2) keep the current date + location line, no room for more.

---

## 4. Aggregated stats strip

**File:** `src/components/TripStats.tsx` (new)

A small stats block rendered above `TripsOverview` in both the desktop `<aside>` (`PlannerPage.tsx`) and the mobile "Trips" tab content (§2). Built from shadcn `Card` (not yet installed — add via `bunx --bun shadcn@latest add card`) in a compact grid.

**Order:** Trips planned → Dives planned → Days until next trip → Dives done.

- **Trips planned:** count of `trips` with `startDate >= today`.
- **Dives planned:** sum of (per-trip dive count, same computation as §3) over the same upcoming-trip set.
- **Days until next trip:** `differenceInCalendarDays(nextTrip.startDate, today)`, where `nextTrip` is the soonest trip (any type) with `startDate >= today`. Card omitted entirely if there are no upcoming trips.
- **Dives done:** sum of per-trip dive count over trips with `endDate < today`. Card shown only when this sum is `> 0`.

`today` = `formatISO(new Date())` (existing helper, matches `CalendarView.tsx`'s usage).

Props: `{ trips: Trip[]; holidays: Record<string, HolidayEntry[]> }` — takes data as props (not read from the store internally) so both call sites (which already have this data on hand) can pass it directly, and so the component itself stays presentational/testable in isolation.

---

## Testing

- Existing test suite (`bun run test`) must stay green.
- New/updated tests:
  - `TripPanel.test.tsx`: `showClose` renders an X button that calls `onClose`; Escape key calls `onClose` only when `showClose` is true.
  - `PlannerPage.test.tsx`: desktop aside passes `showClose`; mobile renders the Planner/Trips tabs, defaults to Planner, switches content on tab click, selecting a trip from Trips opens the drawer without changing the active tab.
  - `TripsOverview.test.tsx`: dive/leave text appended correctly, non-dive trips omit dive count, zero-leave trips omit the leave segment.
  - `TripStats.test.tsx` (new): correct counts/sums for planned vs done, next-trip countdown, card omission when count is 0 (next trip) or not `> 0` (dives done).
