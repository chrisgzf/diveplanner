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
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 (`createBrowserRouter`) |
| State | Zustand with `persist` middleware → localStorage |
| UI | Shadcn/ui + Tailwind CSS |
| Date math | `date-fns` |
| URL compression | `lz-string` (compress) + base64 encode |
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
interface Trip {
  id: string
  label: string             // user-given name, e.g. "Malapascua May 2026"
  startDate: ISODate
  endDate: ISODate
  type: TripType
  status: TripStatus
  locationId?: string       // links to a Location
  notes?: string            // freeform booking metadata (flights, dive shop, etc.)
  estimatedDives?: number   // auto-calculated but user-overridable
}
```

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
  seasonality: {
    [year: number]: LocationMonthRating[]
  }
  currentNote?: string      // e.g. "Strong currents Mar–May"
  isUserAdded?: boolean     // true for user-created overrides
}
```

### Settings

```ts
interface Settings {
  country: string           // ISO 3166-1 alpha-2, default "SG"
  totalLeaveDays: number    // default 25
  carryoverDays: number     // default 5
}
```

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
- Seasonality per year (year-aware — good months for 2026 may differ from 2028)
- A note on currents or conditions where relevant

User overrides (`siteOverrides`) are merged with the hardcoded base at runtime; user records take precedence by `id`. An **"Export my overrides"** button (visible only when overrides exist) downloads a JSON file formatted to match the hardcoded data structure, with a comment pointing to the GitHub repo for contribution.

---

## Main Calendar View (`/`)

### Layout

```
┌────────────────────────────────────────────────────┐
│  18 days leave remaining  (30 total · 12 used)     │
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

### Trip Creation Drawer

Fields: label, location picker (searchable), trip type, status, notes (freeform).

Displays calculated:
- Leave days consumed (weekdays minus public holidays in range)
- Estimated dives (auto-calculated, user can override)

### Leave Balance Bar

- Total = `totalLeaveDays + carryoverDays` (default 30)
- Used = sum of leave days across all trips + non-dive leave blocks for the current calendar year
- Remaining = Total − Used
- Colour: green → amber (≤5 days) → red (0 days)
- On mobile: condensed to a pill `"18 days left"`

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
│ Nusa Penida ●●● │  Seasonality 2026:               │
│ ...             │  J F M A M J J A S O N D        │
│                 │  ✗ ✗ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✗ ✗      │
│ + Add location  │  [2026 ▾]                        │
│                 │                                  │
│                 │  [Plan a trip here →]            │
└─────────────────┴──────────────────────────────────┘
```

- Left panel: filterable/searchable list of all locations (hardcoded + overrides)
- Right panel / full-screen on mobile: selected location detail
- **Year selector** on seasonality grid (ratings are year-aware)
- **"Plan a trip here"** → navigates to `/` with location pre-selected and range selection mode active
- **"+ Add location"** → opens form to create a custom location with user-defined seasonality
- **"Export my overrides"** → downloads JSON for OSS contribution (visible only when overrides exist)

---

## Settings

Accessible via the "Settings" nav item. Rendered as a Shadcn Dialog (modal) rather than a dedicated route — settings are simple enough that a full page is unnecessary.

Fields:
- **Country** — dropdown of supported countries for holiday data (Singapore default; includes Malaysia, Philippines, Indonesia, Thailand, Japan as initial set)
- **Total leave days** — number input (default 25)
- **Carryover days** — number input (default 5)

Changes are saved immediately to the Zustand store (and therefore localStorage). The leave balance bar and all leave calculations update reactively.

---

## Share View (`/share/:hash`)

### Encoding

1. Serialize: `{ trips, siteOverrides, settings }` → JSON string
2. Compress: `lz-string.compressToBase64(json)` → hash string
3. URL: `https://diveplanner.vercel.app/share/<hash>`
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
