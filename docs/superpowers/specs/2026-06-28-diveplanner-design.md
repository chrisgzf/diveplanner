# DivePlanner — Design Spec
**Date:** 2026-06-28
**Status:** Approved

---

## Overview

DivePlanner is a client-side-only React webapp for planning scuba diving trips around Southeast Asia. It helps users discover good dive windows that align with public holidays, track annual leave consumption, manage trip lifecycle from wishlist to confirmed, and share plans with friends via a compressed URL.

Hosted on Vercel. No backend. All state persisted in localStorage.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Package manager + runtime | Bun (1.2.x) — `bun install`, `bun run`; Vercel auto-detects `bun.lock` |
| Framework | React 18 + TypeScript + Vite (stock Vite; Rolldown deferred) |
| Routing | React Router v6 (`createBrowserRouter`) |
| State | Zustand with `persist` middleware → localStorage |
| UI | Shadcn/ui + Tailwind CSS |
| Date math | `date-fns` |
| URL compression | `lz-string` `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent` |
| Test runner | Vitest + @testing-library/react (jsdom env; `bun run test`) |
| Holiday data | Nager.Date public API (client-side fetch, session-cached) |
| Deploy | Vercel (static SPA with catch-all → `index.html`) |

---

## Routes

| Route | View |
|---|---|
| `/` | Rolling 12-month calendar planner (primary view) |
| `/locations` | Location explorer (dive-site-first planning mode) |
| `/share/:hash` | Read-only shared plan view |

---

## Data Model

### Type aliases

```ts
type ISODate = string // ISO 8601 date string, e.g. "2026-05-15"
type TripStatus = 'wishlist' | 'planned' | 'confirmed'
type TripType = 'fun-dive' | 'course' | 'liveaboard' | 'non-dive'
type MonthRating = 'good' | 'fair' | 'poor' | 'closed'
```

### Trip

```ts
type BookingCategory = 'dive-shop' | 'flight' | 'transfer' | 'accommodation' | 'other'

interface BookingItem {
  id: string
  category: BookingCategory
  label: string             // e.g. "Blahblah Divers", "AB123 outbound", "Bus to Mersing"
  booked: boolean
}

interface Trip {
  id: string
  label: string             // user-given name, e.g. "Malapascua May 2026"
  startDate: ISODate
  endDate: ISODate
  type: TripType
  status: TripStatus
  locationId?: string       // links to a Location
  bookings: BookingItem[]   // user-managed list — add only what this trip needs
  notes?: string            // freeform notes (anything not covered above)
  estimatedDives?: number   // auto-calculated but user-overridable
}
```

**Booking checklist behaviour:**
- The list is fully user-managed. Each trip adds only the items it actually needs, so flights are optional (a Tioman trip from Singapore might have only transfers + accommodation) and transfers can repeat (one item per leg, e.g. "Bus to Mersing" + "Ferry to Tioman").
- When creating a `fun-dive`, `course`, or `liveaboard` trip, the drawer pre-seeds a couple of suggested items (dive shop, accommodation) that the user can rename, remove, or add to. Nothing is mandatory.
- `non-dive` trips carry no booking checklist — the section is hidden and `bookings` stays empty. They exist purely to consume leave.
- When a trip has at least one booking item and **all** items are booked, the UI suggests flipping status to `confirmed`. It never forces the change, and trips with no booking items are driven by manual status only.

### Location

```ts
interface LocationMonthRating {
  month: number             // 1–12
  rating: MonthRating
}

interface Location {
  id: string
  name: string              // e.g. "Malapascua"
  country: string           // e.g. "Philippines"
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  highlights: string[]      // e.g. ["Thresher sharks", "Wall dives"]
  seasonality: LocationMonthRating[]  // exactly 12 entries, one per month (Jan–Dec); stable across years
  currentNote?: string      // e.g. "Strong currents Mar–May"
  isUserAdded?: boolean     // true for user-created overrides
}
```

### Settings

```ts
interface Settings {
  country: string                   // ISO 3166-1 alpha-2, default "SG"
  leaveBudget: Record<number, number> // days available per calendar year (includes any carryover)
                                    // default: { [currentYear]: 25, [currentYear+1]: 25 }
}
```

> **Design note (2026-06-28):** `leaveBudget` replaces the former `totalLeaveDays` + `carryoverDays` flat fields. Per-year budgets let users model different entitlements across years (e.g. 25 days in 2026, 28 in 2027 after a promotion, plus carryover already folded in). If a year has no entry, `useLeaveByYear` treats it as 0 days budgeted.

### Zustand Store Structure

```ts
interface AppStore {
  // Persisted to localStorage
  settings: Settings
  trips: Trip[]
  siteOverrides: Location[]  // user-added or user-modified locations

  // Session-only (not persisted, re-fetched each visit)
  holidays: Record<string, ISODate[]>  // keyed by "SG-2026", "SG-2027", etc.
  holidaysLoading: boolean
  holidaysError: boolean
}
```

---

## Bundled Location Data

~15 SEA dive locations are hardcoded in `src/data/locations.ts`:

Tioman, Perhentian, Palau, Koh Tao, Koh Phi Phi, Malapascua, Gili, Amed, Tulamben, Raja Ampat, Sipadan, Komodo, Bunaken, Nusa Penida, Okinawa.

Each includes:
- Difficulty rating
- Highlights (marine life, dive style)
- Seasonality (12 month ratings, stable across years — captures monsoon/visibility windows)
- A note on currents or conditions where relevant

User overrides (`siteOverrides`) are merged with the hardcoded base at runtime; user records take precedence by `id`. An **"Export my overrides"** button (visible only when overrides exist) downloads a JSON file formatted to match the hardcoded data structure, with a comment pointing to the GitHub repo for contribution.

---

## Main Calendar View (`/`)

### Layout

```
┌────────────────────────────────────────────────────┐
│  2026: 18 left (30·12 used)  ·  2027: 30 left      │
├────────────────────────────────────────────────────┤
│  Nav: [Planner] [Locations] [Settings] [Share]     │
├────────────────────────────────────────────────────┤
│  July 2026                                         │
│  Mo Tu We Th Fr Sa Su                              │
│  .. .. 01 02 03 04 05   ← [PH] National Day badge  │
│  06 07 [MALAPASCUA — fun-dive ████████████] 12     │
│  ...                                               │
├────────────────────────────────────────────────────┤
│  August 2026                                       │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

- Months stack vertically; user scrolls through the rolling 12-month window (starting from the current calendar month)
- Public holidays show as small badges on their dates (country-specific, from Nager.Date)
- Trip blocks span across their date range, colour-coded by type:
  - fun-dive = blue
  - course = green
  - liveaboard = purple
  - non-dive leave = grey
- Trip status reflected by opacity/border: wishlist = dashed border, planned = solid, confirmed = solid + checkmark

### Date Range Selection

1. **Click/tap** a date → sets range start; date highlights
2. **Hover** (desktop) / **tap** (mobile) subsequent dates → range preview grows; tooltip shows which locations are rated `good` or `fair` for those months
3. **Click/tap** end date → finalizes range; trip creation bottom sheet / right drawer opens

**No overlapping trips:** trip date ranges may not overlap each other. Days already covered by an existing trip are visually marked as unavailable, and the range preview will not extend across them. This keeps leave accounting unambiguous (every day belongs to at most one trip).

### Trip Creation / Edit Drawer

The same drawer handles both creating a new trip and editing an existing one — clicking a trip block on the calendar reopens it pre-filled, with **Save** and **Delete** actions. Creating starts from a fresh range selection. On Save, the date range is validated to not overlap any other trip (excluding the trip being edited); an overlap blocks the save with an inline error.

Fields: label, date range (editable), location picker (searchable), trip type, status, booking checklist, notes (freeform).

Booking checklist:
- A list of booking items (dive shop, flight, transfer, accommodation, other). Each row: category, label, booked toggle.
- Dive trips pre-seed suggested items (dive shop, accommodation); user can rename, remove, or add rows. Flights/transfers are added as needed (transfers can repeat per leg).
- Hidden entirely for `non-dive` trips.

Displays calculated:
- Leave days consumed (weekdays minus public holidays in range), broken down by year if the range crosses Dec 31
- Estimated dives (auto-calculated, user can override)

### Leave Balance Bar

Leave is tracked **per calendar year** (it resets and carries over annually). The rolling 12-month window usually spans two years, so the bar shows both years it currently overlaps, side by side.

For each shown year:
- Total = `settings.leaveBudget[year] ?? 0`
- Used = sum of leave days **falling within that year** across all trips and non-dive blocks. A trip crossing Dec 31 contributes its pre-Jan-1 leave days to the earlier year and the rest to the later year.
- Remaining = Total − Used
- Colour: green → amber (≤5 days) → red (0 days), evaluated per year

On mobile: condensed to a two-segment pill, e.g. `"’26: 18 · ’27: 30"`.

---

## Location Explorer (`/locations`)

### Layout

```
┌─────────────────┬──────────────────────────────────┐
│ Filter:         │  Malapascua                      │
│ [Country ▾]     │  Philippines · Intermediate      │
│ [Difficulty ▾]  │                                  │
│ [Month ▾]       │  Highlights:                     │
│                 │  Thresher sharks, wall dives,     │
│ Malapascua  ●●● │  night dives                     │
│ Tioman      ●●○ │                                  │
│ Nusa Penida ●●● │  Seasonality:                    │
│ ...             │  J F M A M J J A S O N D        │
│                 │  ✗ ✗ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✗ ✗      │
│ + Add location  │                                  │
│                 │  [Plan a trip here →]            │
└─────────────────┴──────────────────────────────────┘
```

- Left panel: filterable/searchable list of all locations (hardcoded + overrides)
- Right panel / full-screen on mobile: selected location detail
- Seasonality grid shows the 12 monthly ratings (no year selector — ratings are month-based and stable across years)
- **"Plan a trip here"** → navigates to `/` with location pre-selected and range selection mode active
- **"+ Add location"** → opens form to create a custom location with user-defined seasonality
- **"Export my overrides"** → downloads JSON for OSS contribution (visible only when overrides exist)

---

## Settings

Accessible via the "Settings" nav item. Rendered as a Shadcn Dialog (modal) rather than a dedicated route — settings are simple enough that a full page is unnecessary.

Fields:
- **Country** — dropdown of supported countries for holiday data (Singapore default; includes Malaysia, Philippines, Indonesia, Thailand, Japan as initial set)
- **Leave budget** — per-year number inputs, one row per year in the rolling 12-month window (e.g. "2026: [25]  2027: [25]"). User sets the total available days for each year (carryover is folded into this figure).

Changes are saved immediately to the Zustand store (and therefore localStorage). The leave balance bar and all leave calculations update reactively.

---

## Share View (`/share/:hash`)

### Encoding

1. Serialize: `{ trips, siteOverrides, settings }` → JSON string
2. Compress: `lz-string.compressToEncodedURIComponent(json)` → URL-safe hash string (decode with `decompressFromEncodedURIComponent`; plain base64 is avoided because `+` and `/` are not URL-safe)
3. URL: `https://diveplanner.christopher.sg/share/<hash>`
4. Copy to clipboard with success toast on "Share" button click

### Shared View Behaviour

- Full read-only calendar planner — same rolling 12-month layout
- Persistent top banner: `"You're viewing a shared dive plan"`
- Two CTA buttons:
  - **"Make this mine"** — confirmation dialog warning that this overwrites local data → on confirm, writes shared state to localStorage and redirects to `/`
  - **"Plan my own"** → navigates to `/` without touching local state
- All calendar interactions disabled (no date selection, no trip editing)
- Malformed or undecompressable hash → friendly error page with "Start your own plan" CTA

---

## Leave & Dive Calculation Logic

### Leave days consumed (per trip/block)

1. Enumerate all calendar days in `[startDate, endDate]`
2. Filter to weekdays (Mon–Fri)
3. Subtract public holidays falling on those weekdays (from holiday cache)
4. Result = leave days consumed

**Attribution to year:** each remaining leave day is attributed to the calendar year of its own date. A trip spanning Dec 31 therefore contributes some leave to the earlier year and the rest to the later year, which is what the per-year leave balance bar sums.

### Estimated dives (auto, overridable)

```
divingDays = tripDurationDays - 1 (travel) - 1 (no-fly day)
estimatedDives = divingDays × divesPerDay
```

Where `divesPerDay` is:
- `fun-dive`: 3
- `liveaboard`: 4 (assumes multi-dive liveaboard days including night dives)
- `course`: 2
- `non-dive`: 0

Minimum 0. User can override the final number on the trip card.

### Holiday fetch strategy

- Fetch Nager.Date API on app load for `country + currentYear` and `country + nextYear`
- Cache results in Zustand session slice (not persisted — re-fetched every visit)
- On API failure: show warning toast; leave calc degrades gracefully (counts weekdays, skips holiday subtraction)

---

## Mobile Responsiveness

- Calendar grid: single-column scrollable, full-width month grids
- Trip creation drawer: bottom sheet (Shadcn Sheet with responsive `side` prop)
- Location explorer: list and detail are separate full-screen panels with back navigation
- Leave balance bar: condensed pill
- Navigation: bottom tab bar on mobile, top nav on desktop

---

## Future Scope (not in v1)

The following are noted as future implementation ideas and are explicitly out of scope for this spec:

- Flight price estimates
- Travel route descriptions (e.g. Singapore → Tioman: 4hr bus + 2hr boat)
- Dive shop recommendations
- Accommodation recommendations with cost estimates

The data model and component boundaries should not be designed around these now.

---

## Out of Scope for v1

- User accounts / cloud sync
- Multiple user profiles
- Notifications or reminders
- Offline PWA support
