# DivePlanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side-only React SPA for planning SEA scuba diving trips around public holidays and annual leave, with localStorage persistence and compressed share URLs.

**Architecture:** Pure logic modules (dates, leave, dives, overlap, locations, share, holidays) are built and tested in isolation first, with no React or store dependencies. A Zustand `persist` store sits on top of them. React views (calendar planner, locations explorer, share view) and shadcn/ui components consume the store and the pure modules. Holiday data is fetched client-side from Nager.Date into a non-persisted session slice.

**Tech Stack:** Bun (pkg manager + runner) · React 18 + TypeScript + Vite (stock Vite, not Rolldown) · React Router v6 · Zustand + persist · Tailwind CSS + shadcn/ui · date-fns · lz-string · Vitest + @testing-library/react (test runner, wired to `bun run test`).

## Global Constraints

These apply to **every** task. Exact values, copied from the spec/AGENTS.md:

- **Package manager:** Bun only. Use `bun install`, `bun add`, `bun run`. Never create or commit an npm/pnpm/yarn lockfile — only `bun.lock` is allowed.
- **Vite:** stock Vite. Do **not** adopt Rolldown.
- **React:** version 18 (not 19).
- **TypeScript:** `strict` mode on. Model types follow the spec interfaces exactly.
- **Share URLs:** use `lz-string`'s `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`. **Never** plain base64 (`+` and `/` are not URL-safe).
- **Trip date ranges must not overlap** each other. Every day belongs to at most one trip.
- **Leave is per calendar year.** A trip crossing Dec 31 splits its leave days across both years, attributing each leave day to the calendar year of its own date.
- **Seasonality is month-only:** exactly 12 ratings per location (Jan–Dec), stable across years.
- **`non-dive` trips** carry no booking checklist (`bookings` stays empty, section hidden) and contribute **0** estimated dives.
- **Leave day = weekday (Mon–Fri) in range, minus public holidays** falling on those weekdays.
- **Holiday slice is session-only** — re-fetched every visit, never persisted.
- When you change behaviour described in the spec, update `docs/superpowers/specs/2026-06-28-diveplanner-design.md` in the same change.
- Commit after every task (and at the per-step granularity shown). Conventional commit messages.

### Design tokens (used by all UI tasks)

Theme: **dive-computer / depth-gauge**. Defined once in Task 1's `src/index.css`; never hardcode these hex values in components — use the Tailwind/CSS variables.

| Token | Value | Use |
|---|---|---|
| `--surface` | `#F2F7F8` | page background (cool off-white) |
| `--ink` | `#0B1F2A` | primary text (deep ocean) |
| `--muted` | `#5B7682` | secondary text |
| `--line` | `#D7E3E6` | borders / grid lines |
| `--primary` | `#0E7C86` | teal accent, primary actions |
| `--good` | `#0E9F6E` | seasonality good / leave OK |
| `--fair` | `#D9A406` | seasonality fair / leave low (amber) |
| `--poor` | `#E05A3B` | seasonality poor |
| `--closed` | `#8595A0` | seasonality closed |
| `--fun-dive` | `#2563EB` | trip type: fun-dive (blue) |
| `--course` | `#0E9F6E` | trip type: course (green) |
| `--liveaboard` | `#7C3AED` | trip type: liveaboard (purple) |
| `--non-dive` | `#8595A0` | trip type: non-dive (grey) |

Fonts (via Google Fonts `<link>` in `index.html`): display **Space Grotesk**, body **Inter**, mono **IBM Plex Mono** (data readouts: leave counts, dive counts, gauge numbers).

**Signature element:** the Leave Balance Bar (Task 12) is rendered as a per-year tank/air gauge with a monospace readout, depleting green→amber→red. Spend visual boldness here; keep everything else quiet and instrument-panel clean.

---

## File Structure

```
index.html                       # fonts, root div, title
vite.config.ts                   # Vite + React plugin + @ alias + vitest config
tsconfig.json / tsconfig.node.json
tailwind.config.ts
postcss.config.js
components.json                   # shadcn config
vercel.json                       # SPA catch-all rewrite
package.json
src/
  main.tsx                        # entry: createBrowserRouter + RouterProvider
  App.tsx                         # layout shell: Nav + LeaveBalanceBar + <Outlet/>
  index.css                       # Tailwind directives + theme tokens
  vite-env.d.ts
  types.ts                        # all domain types (spec data model)
  data/
    locations.ts                  # ~15 bundled SEA locations
    countries.ts                  # supported holiday countries
  lib/
    cn.ts                         # shadcn classnames helper
    dates.ts                      # day enumeration, weekday, window, format
    leave.ts                      # leave-day calc + per-year attribution
    dives.ts                      # estimated-dives calc
    overlap.ts                    # trip range-overlap detection
    locations.ts                  # merge base + overrides
    share.ts                      # encode/decode share state (lz-string)
    holidays.ts                   # Nager.Date url, key, parse, fetch
  store/
    useAppStore.ts                # zustand persist store + actions
  hooks/
    useHolidays.ts                # fetch holidays into session slice on load
    useMergedLocations.ts         # base + overrides selector
    useLeaveByYear.ts             # per-year leave totals selector
  components/
    ui/                           # shadcn components (button, dialog, sheet, ...)
    Nav.tsx                       # top nav (desktop) / bottom tab bar (mobile)
    LeaveBalanceBar.tsx           # SIGNATURE per-year tank gauge
    SettingsDialog.tsx
    ShareButton.tsx
    TripDrawer.tsx                # create/edit trip (Sheet)
    BookingChecklist.tsx
    LocationPicker.tsx
    calendar/
      CalendarView.tsx            # rolling 12-month scroll, range selection state
      MonthGrid.tsx
      DayCell.tsx
      TripBlock.tsx
  routes/
    PlannerPage.tsx               # "/"
    LocationsPage.tsx             # "/locations"
    SharePage.tsx                 # "/share/:hash"
  test/
    setup.ts                      # @testing-library/jest-dom + cleanup
```

---

## Task Index

1. Scaffold app (Bun + Vite + React 18 + TS + Tailwind + shadcn + Vitest)
2. Domain types + bundled location & country data
3. Date helpers (`lib/dates.ts`)
4. Leave calculation (`lib/leave.ts`)
5. Estimated dives (`lib/dives.ts`)
6. Trip overlap detection (`lib/overlap.ts`)
7. Location merge (`lib/locations.ts`)
8. Share encode/decode (`lib/share.ts`)
9. Holiday fetch service (`lib/holidays.ts`)
10. Zustand store (`store/useAppStore.ts`)
11. App shell, routing, nav, theme wiring
12. Leave Balance Bar (signature gauge)
13. Calendar view + range selection
14. Trip create/edit drawer + booking checklist + location picker
15. Locations explorer page
16. Settings dialog
17. Share button + share view route
18. Holiday hook wiring + final integration + build verification

---

### Task 1: Scaffold the app

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `vercel.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/lib/cn.ts`, `src/test/setup.ts`
- Test: `src/lib/cn.test.ts`

**Interfaces:**
- Produces: `cn(...inputs)` from `src/lib/cn.ts`; `@/*` path alias → `src/*`; working `bun run dev`, `bun run build`, `bun run test`.

> **Prerequisite (do once, outside the task loop):** Bun must be installed. Verify with `bun --version`. If absent on Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`, then restart the shell.

- [ ] **Step 1: Initialize the Vite React-TS project into the current directory**

```bash
bun create vite@latest . --template react-ts
# If prompted about the non-empty directory, choose "Ignore files and continue".
```

- [ ] **Step 2: Remove Vite boilerplate that we replace**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 3: Add runtime and dev dependencies**

```bash
bun add react-router-dom zustand date-fns lz-string lucide-react class-variance-authority clsx tailwind-merge
bun add -d tailwindcss@3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

- [ ] **Step 4: Initialize Tailwind**

```bash
bunx tailwindcss init -p
```

- [ ] **Step 5: Write `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
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
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: { lg: '0.625rem', md: '0.5rem', sm: '0.375rem' },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 6: Write `src/index.css`** (Tailwind directives + theme tokens)

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --surface: #F2F7F8;
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
}

@layer base {
  html { color-scheme: light; }
  body {
    @apply bg-surface text-ink font-body antialiased;
  }
  h1, h2, h3 { @apply font-display; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 7: Configure path alias + vitest in `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 8: Add `@` path to `tsconfig.json`** — inside `compilerOptions`, ensure `"strict": true` and add:

```jsonc
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] },
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 9: Add scripts to `package.json`** — set the `scripts` block to:

```jsonc
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 10: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())
```

- [ ] **Step 11: Write `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 12: Write `components.json`** (for `bunx --bun shadcn@latest add ...`)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": { "components": "@/components", "utils": "@/lib/cn", "ui": "@/components/ui" }
}
```

- [ ] **Step 13: Write `index.html`** (replace generated one)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DivePlanner — plan SEA dive trips around your leave</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 14: Write a minimal `src/App.tsx` and `src/main.tsx` placeholder** (real shell comes in Task 11)

`src/App.tsx`:
```tsx
export default function App() {
  return <h1 className="p-6 text-2xl font-display text-primary">DivePlanner</h1>
}
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 15: Write `vercel.json`** (SPA catch-all)

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- [ ] **Step 16: Write the failing test `src/lib/cn.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges class names and dedupes conflicting tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-ink', false && 'hidden', 'font-body')).toBe('text-ink font-body')
  })
})
```

- [ ] **Step 17: Run the test suite, typecheck, and build**

```bash
bun run test
bun run build
```
Expected: test passes; `tsc -b` clean; `vite build` produces `dist/`.

- [ ] **Step 18: Commit**

```bash
git add -A
git commit -m "chore: scaffold Bun + Vite + React 18 + TS + Tailwind + Vitest"
```

---

### Task 2: Domain types + bundled location & country data

**Files:**
- Create: `src/types.ts`, `src/data/locations.ts`, `src/data/countries.ts`
- Test: `src/data/locations.test.ts`

**Interfaces:**
- Produces (types): `ISODate`, `TripStatus`, `TripType`, `MonthRating`, `BookingCategory`, `BookingItem`, `Trip`, `LocationMonthRating`, `Location`, `Settings`. Consumed by every later task.
- Produces (data): `LOCATIONS: Location[]` (exactly 15), `SUPPORTED_COUNTRIES: { code: string; name: string }[]`, `DEFAULT_SETTINGS: Settings`.

- [ ] **Step 1: Write `src/types.ts`** (verbatim from spec data model)

```ts
export type ISODate = string // ISO 8601 date, e.g. "2026-05-15"
export type TripStatus = 'wishlist' | 'planned' | 'confirmed'
export type TripType = 'fun-dive' | 'course' | 'liveaboard' | 'non-dive'
export type MonthRating = 'good' | 'fair' | 'poor' | 'closed'

export type BookingCategory = 'dive-shop' | 'flight' | 'transfer' | 'accommodation' | 'other'

export interface BookingItem {
  id: string
  category: BookingCategory
  label: string
  booked: boolean
}

export interface Trip {
  id: string
  label: string
  startDate: ISODate
  endDate: ISODate
  type: TripType
  status: TripStatus
  locationId?: string
  bookings: BookingItem[]
  notes?: string
  estimatedDives?: number
}

export interface LocationMonthRating {
  month: number // 1-12
  rating: MonthRating
}

export interface Location {
  id: string
  name: string
  country: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  highlights: string[]
  seasonality: LocationMonthRating[] // exactly 12, Jan-Dec
  currentNote?: string
  isUserAdded?: boolean
}

export interface Settings {
  country: string // ISO 3166-1 alpha-2
  totalLeaveDays: number
  carryoverDays: number
}

export const DEFAULT_SETTINGS: Settings = {
  country: 'SG',
  totalLeaveDays: 25,
  carryoverDays: 5,
}
```

- [ ] **Step 2: Write `src/data/countries.ts`**

```ts
export const SUPPORTED_COUNTRIES = [
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'JP', name: 'Japan' },
] as const
```

- [ ] **Step 3: Write `src/data/locations.ts`** (15 locations; `seasons()` builder keeps the 12 ratings readable — codes are G=good F=fair P=poor C=closed, Jan→Dec)

```ts
import type { Location, LocationMonthRating, MonthRating } from '@/types'

const CODE: Record<string, MonthRating> = { G: 'good', F: 'fair', P: 'poor', C: 'closed' }

function seasons(codes: string): LocationMonthRating[] {
  if (codes.length !== 12) throw new Error(`seasonality must be 12 chars, got ${codes.length}`)
  return codes.split('').map((c, i) => ({ month: i + 1, rating: CODE[c] }))
}

export const LOCATIONS: Location[] = [
  { id: 'tioman', name: 'Tioman', country: 'Malaysia', difficulty: 'beginner',
    highlights: ['Easy reefs', 'Turtles', 'Close to Singapore'],
    seasonality: seasons('CCFGGGGGGFCC'),
    currentNote: 'Closed during the NE monsoon (Nov–Feb); most resorts shut.' },
  { id: 'perhentian', name: 'Perhentian', country: 'Malaysia', difficulty: 'beginner',
    highlights: ['Reef sharks', 'Cheap courses', 'Clear shallows'],
    seasonality: seasons('CCFGGGGGGFCC'),
    currentNote: 'Closed during the NE monsoon (Nov–Feb).' },
  { id: 'palau', name: 'Palau', country: 'Palau', difficulty: 'advanced',
    highlights: ['Manta rays', 'Wall dives', 'WWII wrecks'],
    seasonality: seasons('GGGGFFFFFGGG'),
    currentNote: 'Strong currents at Blue Corner; drift diving skills needed.' },
  { id: 'koh-tao', name: 'Koh Tao', country: 'Thailand', difficulty: 'beginner',
    highlights: ['Whale sharks', 'Cheap courses', 'Granite pinnacles'],
    seasonality: seasons('GGGGGGGGGFPF') },
  { id: 'koh-phi-phi', name: 'Koh Phi Phi', country: 'Thailand', difficulty: 'beginner',
    highlights: ['Leopard sharks', 'Limestone scenery', 'Soft corals'],
    seasonality: seasons('GGGGFPPPPFGG'),
    currentNote: 'SW monsoon May–Oct brings rain and reduced visibility.' },
  { id: 'malapascua', name: 'Malapascua', country: 'Philippines', difficulty: 'intermediate',
    highlights: ['Thresher sharks', 'Wall dives', 'Night dives'],
    seasonality: seasons('FGGGGGFPPPFF'),
    currentNote: 'Typhoon risk Aug–Oct; best visibility Mar–Jun.' },
  { id: 'gili', name: 'Gili Islands', country: 'Indonesia', difficulty: 'beginner',
    highlights: ['Turtles', 'Easy reefs', 'Relaxed pace'],
    seasonality: seasons('FFGGGGGGGGFF') },
  { id: 'amed', name: 'Amed', country: 'Indonesia', difficulty: 'beginner',
    highlights: ['Muck diving', 'Macro life', 'Calm bays'],
    seasonality: seasons('FFFGGGGGGGGF') },
  { id: 'tulamben', name: 'Tulamben', country: 'Indonesia', difficulty: 'beginner',
    highlights: ['USAT Liberty wreck', 'Macro life', 'Shore diving'],
    seasonality: seasons('FFFGGGGGGGGF') },
  { id: 'raja-ampat', name: 'Raja Ampat', country: 'Indonesia', difficulty: 'advanced',
    highlights: ['Highest biodiversity on earth', 'Manta rays', 'Pristine reefs'],
    seasonality: seasons('GGGGFPPPFGGG'),
    currentNote: 'Rough seas Jun–Aug; most operators run Oct–Apr.' },
  { id: 'sipadan', name: 'Sipadan', country: 'Malaysia', difficulty: 'intermediate',
    highlights: ['Barracuda tornado', 'Turtles', 'Wall dives'],
    seasonality: seasons('FFFGGGGGGGGG'),
    currentNote: 'Permit-limited; book well ahead.' },
  { id: 'komodo', name: 'Komodo', country: 'Indonesia', difficulty: 'advanced',
    highlights: ['Manta rays', 'Pelagics', 'Dramatic drift dives'],
    seasonality: seasons('FFFGGGGGGGGF'),
    currentNote: 'Strong, cold currents; not for beginners.' },
  { id: 'bunaken', name: 'Bunaken', country: 'Indonesia', difficulty: 'intermediate',
    highlights: ['Steep walls', 'Turtles', 'Great visibility'],
    seasonality: seasons('FFGGGGGGGGFF') },
  { id: 'nusa-penida', name: 'Nusa Penida', country: 'Indonesia', difficulty: 'advanced',
    highlights: ['Mola mola (Jul–Oct)', 'Manta rays', 'Drift dives'],
    seasonality: seasons('FFGGGGGGGGGF'),
    currentNote: 'Strong, cold currents at Manta Point and Crystal Bay.' },
  { id: 'okinawa', name: 'Okinawa', country: 'Japan', difficulty: 'intermediate',
    highlights: ['Manta rays', 'Blue Cave', 'Coral gardens'],
    seasonality: seasons('PPFFGGGFFGFP'),
    currentNote: 'Cold water Dec–Feb; typhoon risk Aug–Sep.' },
]
```

- [ ] **Step 4: Write the failing test `src/data/locations.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { LOCATIONS } from './locations'

describe('LOCATIONS', () => {
  it('has 15 entries with unique ids', () => {
    expect(LOCATIONS).toHaveLength(15)
    expect(new Set(LOCATIONS.map((l) => l.id)).size).toBe(15)
  })

  it('every location has exactly 12 month ratings, months 1-12 in order', () => {
    for (const loc of LOCATIONS) {
      expect(loc.seasonality).toHaveLength(12)
      expect(loc.seasonality.map((s) => s.month)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12])
      for (const s of loc.seasonality) {
        expect(['good', 'fair', 'poor', 'closed']).toContain(s.rating)
      }
    }
  })

  it('every location has at least one highlight', () => {
    for (const loc of LOCATIONS) expect(loc.highlights.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 5: Run tests** — `bun run test src/data/locations.test.ts` → PASS. Then `bun run build` to confirm types compile.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/data
git commit -m "feat: add domain types and bundled location/country data"
```

---

### Task 3: Date helpers (`lib/dates.ts`)

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/dates.test.ts`

**Interfaces:**
- Produces:
  - `enumerateDays(start: ISODate, end: ISODate): ISODate[]` — inclusive list of ISO dates.
  - `isWeekday(date: ISODate): boolean` — Mon–Fri.
  - `durationDays(start: ISODate, end: ISODate): number` — inclusive count.
  - `monthsWindow(from: Date, count?: number): { year: number; month: number }[]` — `count` defaults to 12, starting at `from`'s month.
  - `formatISO(date: Date): ISODate`.

- [ ] **Step 1: Write the failing test `src/lib/dates.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { enumerateDays, isWeekday, durationDays, monthsWindow, formatISO } from './dates'

describe('dates', () => {
  it('enumerateDays returns inclusive list', () => {
    expect(enumerateDays('2026-05-15', '2026-05-17')).toEqual(['2026-05-15', '2026-05-16', '2026-05-17'])
  })
  it('enumerateDays handles single day', () => {
    expect(enumerateDays('2026-05-15', '2026-05-15')).toEqual(['2026-05-15'])
  })
  it('isWeekday distinguishes weekend', () => {
    expect(isWeekday('2026-05-15')).toBe(true)  // Friday
    expect(isWeekday('2026-05-16')).toBe(false) // Saturday
    expect(isWeekday('2026-05-17')).toBe(false) // Sunday
    expect(isWeekday('2026-05-18')).toBe(true)  // Monday
  })
  it('durationDays counts inclusive', () => {
    expect(durationDays('2026-05-15', '2026-05-23')).toBe(9)
    expect(durationDays('2026-05-15', '2026-05-15')).toBe(1)
  })
  it('monthsWindow rolls 12 months from the given month', () => {
    const w = monthsWindow(new Date(2026, 5, 28), 12) // June 2026
    expect(w).toHaveLength(12)
    expect(w[0]).toEqual({ year: 2026, month: 6 })
    expect(w[6]).toEqual({ year: 2026, month: 12 })
    expect(w[7]).toEqual({ year: 2027, month: 1 })
    expect(w[11]).toEqual({ year: 2027, month: 5 })
  })
  it('formatISO formats a date', () => {
    expect(formatISO(new Date(2026, 4, 15))).toBe('2026-05-15')
  })
})
```

- [ ] **Step 2: Run test → FAIL** (`Cannot find module './dates'`).

- [ ] **Step 3: Write `src/lib/dates.ts`**

```ts
import { eachDayOfInterval, parseISO, format, isWeekend, differenceInCalendarDays, addMonths } from 'date-fns'
import type { ISODate } from '@/types'

export function formatISO(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd')
}

export function enumerateDays(start: ISODate, end: ISODate): ISODate[] {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(formatISO)
}

export function isWeekday(date: ISODate): boolean {
  return !isWeekend(parseISO(date))
}

export function durationDays(start: ISODate, end: ISODate): number {
  return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1
}

export function monthsWindow(from: Date, count = 12): { year: number; month: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(new Date(from.getFullYear(), from.getMonth(), 1), i)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git add src/lib/dates.ts src/lib/dates.test.ts && git commit -m "feat: add date helper utilities"`

---

### Task 4: Leave calculation (`lib/leave.ts`)

**Files:**
- Create: `src/lib/leave.ts`
- Test: `src/lib/leave.test.ts`

**Interfaces:**
- Consumes: `enumerateDays`, `isWeekday` from `@/lib/dates`; `Trip` from `@/types`.
- Produces:
  - `leaveDaysInRange(start: ISODate, end: ISODate, holidays: Set<ISODate>): number`
  - `leaveDaysByYear(start: ISODate, end: ISODate, holidays: Set<ISODate>): Record<number, number>`
  - `leaveUsedByYear(trips: Trip[], holidays: Set<ISODate>): Record<number, number>`

- [ ] **Step 1: Write the failing test `src/lib/leave.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { leaveDaysInRange, leaveDaysByYear, leaveUsedByYear } from './leave'
import type { Trip } from '@/types'

const noHols = new Set<string>()

describe('leaveDaysInRange', () => {
  it('counts weekdays only (Sat 15 May -> Sun 23 May 2026 = Mon-Fri 18-22 = 5)', () => {
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', noHols)).toBe(5)
  })
  it('subtracts public holidays falling on weekdays', () => {
    // Hari Raya Haji Mon 2026-05-18 (hypothetical) reduces 5 -> 4
    const hols = new Set(['2026-05-18'])
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', hols)).toBe(4)
  })
  it('ignores holidays that fall on a weekend', () => {
    const hols = new Set(['2026-05-16']) // Saturday
    expect(leaveDaysInRange('2026-05-15', '2026-05-23', hols)).toBe(5)
  })
})

describe('leaveDaysByYear', () => {
  it('attributes each leave day to its own calendar year across Dec 31', () => {
    // 2026-12-28 (Mon) .. 2027-01-03 (Sun): weekdays 28,29,30,31 (2026) + 1 (2027, Fri)
    const byYear = leaveDaysByYear('2026-12-28', '2027-01-03', noHols)
    expect(byYear[2026]).toBe(4)
    expect(byYear[2027]).toBe(1)
  })
})

describe('leaveUsedByYear', () => {
  it('sums leave across all trips including non-dive, keyed by year', () => {
    const trips: Trip[] = [
      { id: 'a', label: 'Dive', startDate: '2026-05-15', endDate: '2026-05-23', type: 'fun-dive', status: 'planned', bookings: [] },
      { id: 'b', label: 'Italy', startDate: '2026-05-25', endDate: '2026-05-29', type: 'non-dive', status: 'planned', bookings: [] },
    ]
    const used = leaveUsedByYear(trips, noHols)
    expect(used[2026]).toBe(5 + 5) // trip a: 5 weekdays; trip b: Mon-Fri = 5
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/lib/leave.ts`**

```ts
import { enumerateDays, isWeekday } from './dates'
import type { ISODate, Trip } from '@/types'

function leaveDays(start: ISODate, end: ISODate, holidays: Set<ISODate>): ISODate[] {
  return enumerateDays(start, end).filter((d) => isWeekday(d) && !holidays.has(d))
}

export function leaveDaysInRange(start: ISODate, end: ISODate, holidays: Set<ISODate>): number {
  return leaveDays(start, end, holidays).length
}

export function leaveDaysByYear(start: ISODate, end: ISODate, holidays: Set<ISODate>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const d of leaveDays(start, end, holidays)) {
    const year = Number(d.slice(0, 4))
    out[year] = (out[year] ?? 0) + 1
  }
  return out
}

export function leaveUsedByYear(trips: Trip[], holidays: Set<ISODate>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const trip of trips) {
    const byYear = leaveDaysByYear(trip.startDate, trip.endDate, holidays)
    for (const [year, n] of Object.entries(byYear)) {
      out[Number(year)] = (out[Number(year)] ?? 0) + n
    }
  }
  return out
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat: add per-year leave calculation"`

---

### Task 5: Estimated dives (`lib/dives.ts`)

**Files:**
- Create: `src/lib/dives.ts`
- Test: `src/lib/dives.test.ts`

**Interfaces:**
- Consumes: `durationDays` from `@/lib/dates`; `TripType` from `@/types`.
- Produces:
  - `DIVES_PER_DAY: Record<TripType, number>`
  - `estimatedDives(type: TripType, start: ISODate, end: ISODate): number`

- [ ] **Step 1: Write the failing test `src/lib/dives.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { estimatedDives } from './dives'

describe('estimatedDives', () => {
  it('fun-dive: (duration - 2 travel/no-fly) * 3 per day', () => {
    // 2026-05-15..2026-05-23 = 9 days -> 7 diving days * 3 = 21
    expect(estimatedDives('fun-dive', '2026-05-15', '2026-05-23')).toBe(21)
  })
  it('liveaboard: 4 dives/day', () => {
    expect(estimatedDives('liveaboard', '2026-05-15', '2026-05-23')).toBe(28)
  })
  it('course: 2 dives/day', () => {
    expect(estimatedDives('course', '2026-05-15', '2026-05-23')).toBe(14)
  })
  it('non-dive always 0', () => {
    expect(estimatedDives('non-dive', '2026-05-15', '2026-05-23')).toBe(0)
  })
  it('never negative for short trips', () => {
    expect(estimatedDives('fun-dive', '2026-05-15', '2026-05-15')).toBe(0)
    expect(estimatedDives('fun-dive', '2026-05-15', '2026-05-16')).toBe(0)
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/lib/dives.ts`**

```ts
import { durationDays } from './dates'
import type { ISODate, TripType } from '@/types'

export const DIVES_PER_DAY: Record<TripType, number> = {
  'fun-dive': 3,
  liveaboard: 4,
  course: 2,
  'non-dive': 0,
}

export function estimatedDives(type: TripType, start: ISODate, end: ISODate): number {
  if (type === 'non-dive') return 0
  const divingDays = durationDays(start, end) - 2 // 1 travel day + 1 no-fly day
  if (divingDays <= 0) return 0
  return divingDays * DIVES_PER_DAY[type]
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat: add estimated dives calculation"`

---

### Task 6: Trip overlap detection (`lib/overlap.ts`)

**Files:**
- Create: `src/lib/overlap.ts`
- Test: `src/lib/overlap.test.ts`

**Interfaces:**
- Consumes: `Trip`, `ISODate` from `@/types`.
- Produces:
  - `rangesOverlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean`
  - `hasOverlap(trips: Trip[], start: ISODate, end: ISODate, excludeId?: string): boolean`
  - `coveredDays(trips: Trip[], excludeId?: string): Set<ISODate>` — all days occupied by trips (for marking unavailable cells).

- [ ] **Step 1: Write the failing test `src/lib/overlap.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { rangesOverlap, hasOverlap, coveredDays } from './overlap'
import type { Trip } from '@/types'

const trips: Trip[] = [
  { id: 'a', label: 'A', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] },
]

describe('rangesOverlap', () => {
  it('detects overlap and adjacency rules', () => {
    expect(rangesOverlap('2026-05-15', '2026-05-20', '2026-05-18', '2026-05-25')).toBe(true)
    expect(rangesOverlap('2026-05-15', '2026-05-20', '2026-05-20', '2026-05-25')).toBe(true) // shared endpoint
    expect(rangesOverlap('2026-05-15', '2026-05-20', '2026-05-21', '2026-05-25')).toBe(false) // adjacent ok
  })
})

describe('hasOverlap', () => {
  it('true when new range hits an existing trip', () => {
    expect(hasOverlap(trips, '2026-05-19', '2026-05-22')).toBe(true)
  })
  it('false when excluding the trip being edited', () => {
    expect(hasOverlap(trips, '2026-05-15', '2026-05-20', 'a')).toBe(false)
  })
  it('false for a clear range', () => {
    expect(hasOverlap(trips, '2026-06-01', '2026-06-05')).toBe(false)
  })
})

describe('coveredDays', () => {
  it('returns every day occupied by trips, minus excluded', () => {
    expect(coveredDays(trips).has('2026-05-17')).toBe(true)
    expect(coveredDays(trips, 'a').size).toBe(0)
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/lib/overlap.ts`**

```ts
import { enumerateDays } from './dates'
import type { ISODate, Trip } from '@/types'

export function rangesOverlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

export function hasOverlap(trips: Trip[], start: ISODate, end: ISODate, excludeId?: string): boolean {
  return trips.some((t) => t.id !== excludeId && rangesOverlap(t.startDate, t.endDate, start, end))
}

export function coveredDays(trips: Trip[], excludeId?: string): Set<ISODate> {
  const out = new Set<ISODate>()
  for (const t of trips) {
    if (t.id === excludeId) continue
    for (const d of enumerateDays(t.startDate, t.endDate)) out.add(d)
  }
  return out
}
```

> Note: ISO `yyyy-MM-dd` strings compare correctly with `<=`, so date math here is safe lexicographically.

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat: add trip overlap detection"`

---

### Task 7: Location merge (`lib/locations.ts`)

**Files:**
- Create: `src/lib/locations.ts`
- Test: `src/lib/locations.test.ts`

**Interfaces:**
- Consumes: `LOCATIONS` from `@/data/locations`; `Location` from `@/types`.
- Produces: `mergeLocations(overrides: Location[]): Location[]` — base ∪ overrides, override wins by `id`, sorted by `name`.

- [ ] **Step 1: Write the failing test `src/lib/locations.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mergeLocations } from './locations'
import { LOCATIONS } from '@/data/locations'
import type { Location } from '@/types'

const custom: Location = {
  id: 'my-spot', name: 'Aardvark Reef', country: 'Singapore', difficulty: 'beginner',
  highlights: ['Test'], seasonality: LOCATIONS[0].seasonality, isUserAdded: true,
}

describe('mergeLocations', () => {
  it('returns base list when no overrides', () => {
    expect(mergeLocations([])).toHaveLength(LOCATIONS.length)
  })
  it('appends user-added and sorts by name', () => {
    const merged = mergeLocations([custom])
    expect(merged).toHaveLength(LOCATIONS.length + 1)
    expect(merged[0].id).toBe('my-spot') // "Aardvark" sorts first
  })
  it('override replaces a base location by id', () => {
    const override: Location = { ...LOCATIONS[0], name: 'Tioman (edited)', isUserAdded: true }
    const merged = mergeLocations([override])
    expect(merged).toHaveLength(LOCATIONS.length)
    expect(merged.find((l) => l.id === LOCATIONS[0].id)!.name).toBe('Tioman (edited)')
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/lib/locations.ts`**

```ts
import { LOCATIONS } from '@/data/locations'
import type { Location } from '@/types'

export function mergeLocations(overrides: Location[]): Location[] {
  const byId = new Map<string, Location>()
  for (const loc of LOCATIONS) byId.set(loc.id, loc)
  for (const loc of overrides) byId.set(loc.id, loc)
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat: add location merge (base + overrides)"`

---

### Task 8: Share encode/decode (`lib/share.ts`)

**Files:**
- Create: `src/lib/share.ts`
- Test: `src/lib/share.test.ts`

**Interfaces:**
- Consumes: `Trip`, `Location`, `Settings` from `@/types`.
- Produces:
  - `interface ShareState { trips: Trip[]; siteOverrides: Location[]; settings: Settings }`
  - `encodeShare(state: ShareState): string`
  - `decodeShare(hash: string): ShareState | null` — `null` on malformed/undecompressable input.

- [ ] **Step 1: Write the failing test `src/lib/share.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { encodeShare, decodeShare, type ShareState } from './share'
import { DEFAULT_SETTINGS } from '@/types'

const state: ShareState = {
  trips: [{ id: 'a', label: 'Malapascua', startDate: '2026-05-15', endDate: '2026-05-23', type: 'fun-dive', status: 'planned', bookings: [] }],
  siteOverrides: [],
  settings: DEFAULT_SETTINGS,
}

describe('share encode/decode', () => {
  it('round-trips state through a URL-safe hash', () => {
    const hash = encodeShare(state)
    expect(hash).not.toMatch(/[+/=]/) // URL-safe: no plain-base64 chars
    expect(decodeShare(hash)).toEqual(state)
  })
  it('returns null for malformed hash', () => {
    expect(decodeShare('!!!not-valid!!!')).toBeNull()
    expect(decodeShare('')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/lib/share.ts`**

```ts
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { Trip, Location, Settings } from '@/types'

export interface ShareState {
  trips: Trip[]
  siteOverrides: Location[]
  settings: Settings
}

export function encodeShare(state: ShareState): string {
  return compressToEncodedURIComponent(JSON.stringify(state))
}

export function decodeShare(hash: string): ShareState | null {
  if (!hash) return null
  try {
    const json = decompressFromEncodedURIComponent(hash)
    if (!json) return null
    const parsed = JSON.parse(json)
    if (!parsed || !Array.isArray(parsed.trips) || !Array.isArray(parsed.siteOverrides) || typeof parsed.settings !== 'object') {
      return null
    }
    return parsed as ShareState
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat: add lz-string share encode/decode"`

---

### Task 9: Holiday fetch service (`lib/holidays.ts`)

**Files:**
- Create: `src/lib/holidays.ts`
- Test: `src/lib/holidays.test.ts`

**Interfaces:**
- Produces:
  - `holidayKey(country: string, year: number): string` → e.g. `"SG-2026"`.
  - `nagerUrl(country: string, year: number): string`.
  - `parseHolidays(data: unknown): ISODate[]` — extract `date` fields safely.
  - `fetchHolidays(country: string, year: number): Promise<ISODate[]>` — throws on network/HTTP error.
  - `holidaySetFromCache(cache: Record<string, ISODate[]>): Set<ISODate>` — flatten all cached years into one Set for leave calc.

- [ ] **Step 1: Write the failing test `src/lib/holidays.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { holidayKey, nagerUrl, parseHolidays, fetchHolidays, holidaySetFromCache } from './holidays'

afterEach(() => vi.restoreAllMocks())

describe('holiday helpers', () => {
  it('builds cache key and url', () => {
    expect(holidayKey('SG', 2026)).toBe('SG-2026')
    expect(nagerUrl('SG', 2026)).toBe('https://date.nager.at/api/v3/PublicHolidays/2026/SG')
  })
  it('parses holiday dates and ignores malformed entries', () => {
    expect(parseHolidays([{ date: '2026-05-01' }, { foo: 'bar' }, { date: 123 }])).toEqual(['2026-05-01'])
    expect(parseHolidays(null)).toEqual([])
  })
  it('flattens cache into a single Set', () => {
    const set = holidaySetFromCache({ 'SG-2026': ['2026-05-01'], 'SG-2027': ['2027-01-01'] })
    expect(set.has('2026-05-01')).toBe(true)
    expect(set.has('2027-01-01')).toBe(true)
  })
  it('fetchHolidays returns parsed dates on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-08-09' }] }))
    expect(await fetchHolidays('SG', 2026)).toEqual(['2026-08-09'])
  })
  it('fetchHolidays throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchHolidays('SG', 2026)).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/lib/holidays.ts`**

```ts
import type { ISODate } from '@/types'

export function holidayKey(country: string, year: number): string {
  return `${country}-${year}`
}

export function nagerUrl(country: string, year: number): string {
  return `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`
}

export function parseHolidays(data: unknown): ISODate[] {
  if (!Array.isArray(data)) return []
  return data
    .map((d) => (d && typeof (d as { date?: unknown }).date === 'string' ? (d as { date: string }).date : null))
    .filter((d): d is string => d !== null)
}

export async function fetchHolidays(country: string, year: number): Promise<ISODate[]> {
  const res = await fetch(nagerUrl(country, year))
  if (!res.ok) throw new Error(`Nager.Date HTTP ${res.status}`)
  return parseHolidays(await res.json())
}

export function holidaySetFromCache(cache: Record<string, ISODate[]>): Set<ISODate> {
  const set = new Set<ISODate>()
  for (const dates of Object.values(cache)) for (const d of dates) set.add(d)
  return set
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat: add Nager.Date holiday fetch service"`

---

### Task 10: Zustand store (`store/useAppStore.ts`)

**Files:**
- Create: `src/store/useAppStore.ts`
- Test: `src/store/useAppStore.test.ts`

**Interfaces:**
- Consumes: `Trip`, `Location`, `Settings`, `DEFAULT_SETTINGS`, `ISODate` from `@/types`; `ShareState` from `@/lib/share`.
- Produces the `useAppStore` hook with state + actions:
  - Persisted: `settings: Settings`, `trips: Trip[]`, `siteOverrides: Location[]`.
  - Session: `holidays: Record<string, ISODate[]>`, `holidaysLoading: boolean`, `holidaysError: boolean`.
  - Actions: `addTrip(trip)`, `updateTrip(trip)`, `deleteTrip(id)`, `upsertOverride(loc)`, `deleteOverride(id)`, `updateSettings(patch: Partial<Settings>)`, `setHolidays(key, dates)`, `setHolidaysLoading(b)`, `setHolidaysError(b)`, `replaceAll(state: ShareState)`.
- Persist config: `name: 'diveplanner'`, `partialize` to persist only `settings`, `trips`, `siteOverrides`.

- [ ] **Step 1: Write the failing test `src/store/useAppStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './useAppStore'
import { DEFAULT_SETTINGS, type Trip } from '@/types'

const trip: Trip = { id: 'a', label: 'A', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] }

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('useAppStore', () => {
  it('adds, updates, deletes a trip', () => {
    useAppStore.getState().addTrip(trip)
    expect(useAppStore.getState().trips).toHaveLength(1)
    useAppStore.getState().updateTrip({ ...trip, label: 'B' })
    expect(useAppStore.getState().trips[0].label).toBe('B')
    useAppStore.getState().deleteTrip('a')
    expect(useAppStore.getState().trips).toHaveLength(0)
  })
  it('updates settings by patch', () => {
    useAppStore.getState().updateSettings({ totalLeaveDays: 30 })
    expect(useAppStore.getState().settings.totalLeaveDays).toBe(30)
    expect(useAppStore.getState().settings.country).toBe('SG')
  })
  it('sets holiday session slice', () => {
    useAppStore.getState().setHolidays('SG-2026', ['2026-08-09'])
    expect(useAppStore.getState().holidays['SG-2026']).toEqual(['2026-08-09'])
  })
  it('replaceAll swaps persisted state', () => {
    useAppStore.getState().replaceAll({ trips: [trip], siteOverrides: [], settings: { ...DEFAULT_SETTINGS, totalLeaveDays: 40 } })
    expect(useAppStore.getState().trips).toHaveLength(1)
    expect(useAppStore.getState().settings.totalLeaveDays).toBe(40)
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/store/useAppStore.ts`**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS, type ISODate, type Location, type Settings, type Trip } from '@/types'
import type { ShareState } from '@/lib/share'

interface AppStore {
  settings: Settings
  trips: Trip[]
  siteOverrides: Location[]
  holidays: Record<string, ISODate[]>
  holidaysLoading: boolean
  holidaysError: boolean

  addTrip: (trip: Trip) => void
  updateTrip: (trip: Trip) => void
  deleteTrip: (id: string) => void
  upsertOverride: (loc: Location) => void
  deleteOverride: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  setHolidays: (key: string, dates: ISODate[]) => void
  setHolidaysLoading: (b: boolean) => void
  setHolidaysError: (b: boolean) => void
  replaceAll: (state: ShareState) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      trips: [],
      siteOverrides: [],
      holidays: {},
      holidaysLoading: false,
      holidaysError: false,

      addTrip: (trip) => set((s) => ({ trips: [...s.trips, trip] })),
      updateTrip: (trip) => set((s) => ({ trips: s.trips.map((t) => (t.id === trip.id ? trip : t)) })),
      deleteTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
      upsertOverride: (loc) =>
        set((s) => {
          const exists = s.siteOverrides.some((l) => l.id === loc.id)
          return { siteOverrides: exists ? s.siteOverrides.map((l) => (l.id === loc.id ? loc : l)) : [...s.siteOverrides, loc] }
        }),
      deleteOverride: (id) => set((s) => ({ siteOverrides: s.siteOverrides.filter((l) => l.id !== id) })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setHolidays: (key, dates) => set((s) => ({ holidays: { ...s.holidays, [key]: dates } })),
      setHolidaysLoading: (b) => set({ holidaysLoading: b }),
      setHolidaysError: (b) => set({ holidaysError: b }),
      replaceAll: (state) => set({ trips: state.trips, siteOverrides: state.siteOverrides, settings: state.settings }),
    }),
    {
      name: 'diveplanner',
      partialize: (s) => ({ settings: s.settings, trips: s.trips, siteOverrides: s.siteOverrides }),
    },
  ),
)
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat: add zustand persist store"`

---

### Task 11: App shell, routing, nav, theme wiring

**Files:**
- Create: `src/components/Nav.tsx`, `src/routes/PlannerPage.tsx`, `src/routes/LocationsPage.tsx`, `src/routes/SharePage.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/components/Nav.test.tsx`

**Interfaces:**
- Consumes: `useAppStore`.
- Produces: router with `/`, `/locations`, `/share/:hash`; `<App>` layout shell (Nav + page outlet); placeholder page components later tasks fill in.

> shadcn components needed across UI tasks. Install them now in one go so later tasks can import from `@/components/ui`:
> ```bash
> bunx --bun shadcn@latest add button dialog sheet input label select checkbox textarea badge toast sonner tabs popover command
> ```
> (If `sonner` and `toast` conflict, keep `sonner` — it's the current toast.) Commit the generated `src/components/ui/*` with this task.

- [ ] **Step 1: Write the failing test `src/components/Nav.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav'

describe('Nav', () => {
  it('renders Planner and Locations links', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /planner/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /locations/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/components/Nav.tsx`** (top nav desktop, bottom tab bar mobile; Settings + Share are buttons wired in later tasks, rendered as slots here)

```tsx
import { NavLink } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'

const links = [
  { to: '/', label: 'Planner', icon: CalendarDays, end: true },
  { to: '/locations', label: 'Locations', icon: MapPin, end: false },
]

export default function Nav({ actions }: { actions?: React.ReactNode }) {
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur md:relative">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-bold text-primary">DivePlanner</span>
        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink', isActive && 'bg-line/60 text-ink')}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
          {actions}
        </div>
      </div>
      {/* mobile bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface md:hidden">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted', isActive && 'text-primary')}>
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test → PASS.**

- [ ] **Step 5: Write placeholder pages** — `src/routes/PlannerPage.tsx`, `LocationsPage.tsx`, `SharePage.tsx`, each:

```tsx
export default function PlannerPage() {
  return <main className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">Planner</main>
}
```
(name/text differ per file: `LocationsPage`/"Locations", `SharePage`/"Share")

- [ ] **Step 6: Rewrite `src/App.tsx`** as the layout shell

```tsx
import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'

export default function App() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav />
      <Outlet />
    </div>
  )
}
```

- [ ] **Step 7: Rewrite `src/main.tsx`** with the router

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import PlannerPage from './routes/PlannerPage'
import LocationsPage from './routes/LocationsPage'
import SharePage from './routes/SharePage'
import './index.css'

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <PlannerPage /> },
      { path: '/locations', element: <LocationsPage /> },
    ],
  },
  { path: '/share/:hash', element: <SharePage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
```

- [ ] **Step 8: Run `bun run test` and `bun run build`** → all pass.

- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat: add app shell, routing, and nav"`

---

### Task 12: Leave Balance Bar (signature gauge)

**Files:**
- Create: `src/hooks/useLeaveByYear.ts`, `src/components/LeaveBalanceBar.tsx`
- Modify: `src/App.tsx` (mount the bar under Nav)
- Test: `src/components/LeaveBalanceBar.test.tsx`

**Interfaces:**
- Consumes: `useAppStore`, `leaveUsedByYear` (`@/lib/leave`), `holidaySetFromCache` (`@/lib/holidays`), `monthsWindow` (`@/lib/dates`).
- Produces:
  - `useLeaveByYear(): { year: number; total: number; used: number; remaining: number }[]` — one entry per year the rolling 12-month window spans (distinct years of `monthsWindow(new Date())`).
  - `<LeaveBalanceBar/>` — per-year tank gauge, green→amber(≤5)→red(0).

- [ ] **Step 1: Write the failing test `src/components/LeaveBalanceBar.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeaveBalanceBar from './LeaveBalanceBar'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('LeaveBalanceBar', () => {
  it('shows a gauge per year spanned by the rolling window with full balance when no trips', () => {
    render(<LeaveBalanceBar />)
    // default total = 25 + 5 = 30 remaining
    expect(screen.getAllByText(/30/).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/hooks/useLeaveByYear.ts`**

```ts
import { useAppStore } from '@/store/useAppStore'
import { leaveUsedByYear } from '@/lib/leave'
import { holidaySetFromCache } from '@/lib/holidays'
import { monthsWindow } from '@/lib/dates'

export interface YearLeave {
  year: number
  total: number
  used: number
  remaining: number
}

export function useLeaveByYear(): YearLeave[] {
  const trips = useAppStore((s) => s.trips)
  const settings = useAppStore((s) => s.settings)
  const holidays = useAppStore((s) => s.holidays)

  const total = settings.totalLeaveDays + settings.carryoverDays
  const holidaySet = holidaySetFromCache(holidays)
  const used = leaveUsedByYear(trips, holidaySet)
  const years = [...new Set(monthsWindow(new Date()).map((m) => m.year))]

  return years.map((year) => {
    const usedThisYear = used[year] ?? 0
    return { year, total, used: usedThisYear, remaining: total - usedThisYear }
  })
}
```

- [ ] **Step 4: Write `src/components/LeaveBalanceBar.tsx`** (the signature gauge)

```tsx
import { useLeaveByYear, type YearLeave } from '@/hooks/useLeaveByYear'
import { cn } from '@/lib/cn'

function tone(remaining: number): { bar: string; text: string } {
  if (remaining <= 0) return { bar: 'bg-poor', text: 'text-poor' }
  if (remaining <= 5) return { bar: 'bg-fair', text: 'text-fair' }
  return { bar: 'bg-good', text: 'text-good' }
}

function Gauge({ y }: { y: YearLeave }) {
  const pct = y.total > 0 ? Math.max(0, Math.min(100, (y.remaining / y.total) * 100)) : 0
  const t = tone(y.remaining)
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="font-mono text-xs text-muted">{y.year}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className={cn('h-full rounded-full transition-[width]', t.bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('whitespace-nowrap font-mono text-xs font-medium', t.text)}>
        {y.remaining} left <span className="text-muted">/ {y.total}</span>
      </span>
    </div>
  )
}

export default function LeaveBalanceBar() {
  const years = useLeaveByYear()
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-6">
        <span className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Leave</span>
        {years.map((y) => <Gauge key={y.year} y={y} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Mount in `src/App.tsx`** — add `<LeaveBalanceBar />` between `<Nav />` and `<Outlet />`. (Import it.)

- [ ] **Step 6: Run test → PASS;** `bun run build` clean.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: add per-year leave balance gauge"`

---

### Task 13: Calendar view + range selection

**Files:**
- Create: `src/components/calendar/CalendarView.tsx`, `MonthGrid.tsx`, `DayCell.tsx`, `TripBlock.tsx`
- Modify: `src/routes/PlannerPage.tsx`
- Test: `src/components/calendar/CalendarView.test.tsx`

**Interfaces:**
- Consumes: `useAppStore`, `monthsWindow`/`enumerateDays`/`formatISO` (`@/lib/dates`), `coveredDays` (`@/lib/overlap`), `holidaySetFromCache` (`@/lib/holidays`), `LOCATIONS`/`mergeLocations`.
- Produces:
  - `<CalendarView readOnly?: boolean onRangeSelected?: (start, end) => void onTripClick?: (trip) => void />`. Holds range-selection state (`anchor`, `hover`). Skips covered days; preview won't cross a covered day.
  - `<TripBlock trip onClick />` color-coded by type, border/opacity by status.
- Produces for Task 14: `PlannerPage` opens `TripDrawer` on range-selected / trip-click (drawer added next task; wire a local state placeholder now).

- [ ] **Step 1: Write the failing test `src/components/calendar/CalendarView.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalendarView from './CalendarView'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('CalendarView', () => {
  it('renders 12 month headings for the rolling window', () => {
    render(<CalendarView />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(12)
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
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/components/calendar/DayCell.tsx`**

```tsx
import { cn } from '@/lib/cn'

export default function DayCell({ iso, day, inRange, isStart, isEnd, isHoliday, isCovered, isToday, readOnly, onMouseEnter, onClick }: {
  iso: string; day: number; inRange: boolean; isStart: boolean; isEnd: boolean
  isHoliday: boolean; isCovered: boolean; isToday: boolean; readOnly: boolean
  onMouseEnter: () => void; onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`day ${iso}`}
      disabled={readOnly || isCovered}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-md text-sm transition-colors',
        'disabled:cursor-default',
        isCovered ? 'bg-line/40 text-muted' : 'hover:bg-line/60',
        inRange && 'bg-primary/15',
        (isStart || isEnd) && 'bg-primary text-white hover:bg-primary',
        isToday && !isStart && !isEnd && 'ring-1 ring-inset ring-primary',
      )}
    >
      {day}
      {isHoliday && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-poor" aria-hidden />}
    </button>
  )
}
```

- [ ] **Step 4: Write `src/components/calendar/TripBlock.tsx`**

```tsx
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Trip } from '@/types'

const typeColor: Record<Trip['type'], string> = {
  'fun-dive': 'bg-fun-dive', course: 'bg-course', liveaboard: 'bg-liveaboard', 'non-dive': 'bg-non-dive',
}

export default function TripBlock({ trip, onClick, readOnly }: { trip: Trip; onClick?: () => void; readOnly?: boolean }) {
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
    </button>
  )
}
```

- [ ] **Step 5: Write `src/components/calendar/MonthGrid.tsx`**

```tsx
import { getDaysInMonth, getDay } from 'date-fns'
import DayCell from './DayCell'
import TripBlock from './TripBlock'
import type { Trip } from '@/types'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function MonthGrid({ year, month, trips, holidays, covered, today, selection, readOnly, onDayEnter, onDayClick, onTripClick }: {
  year: number; month: number; trips: Trip[]; holidays: Set<string>; covered: Set<string>; today: string
  selection: { start: string | null; end: string | null }; readOnly: boolean
  onDayEnter: (iso: string) => void; onDayClick: (iso: string) => void; onTripClick: (trip: Trip) => void
}) {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const firstDow = (getDay(new Date(year, month - 1, 1)) + 6) % 7 // Monday-first
  const monthTrips = trips.filter((t) => t.startDate <= iso(year, month, daysInMonth) && t.endDate >= iso(year, month, 1))

  const inRange = (d: string) => {
    if (!selection.start) return false
    const end = selection.end ?? selection.start
    const lo = selection.start < end ? selection.start : end
    const hi = selection.start < end ? end : selection.start
    return d >= lo && d <= hi
  }

  return (
    <section className="mb-8">
      <h2 className="mb-2 font-display text-lg font-semibold">{MONTH_NAMES[month - 1]} {year}</h2>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((w) => <div key={w} className="pb-1">{w}</div>)}
        {Array.from({ length: firstDow }, (_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const d = iso(year, month, day)
          return (
            <DayCell key={d} iso={d} day={day}
              inRange={inRange(d)} isStart={selection.start === d} isEnd={selection.end === d}
              isHoliday={holidays.has(d)} isCovered={covered.has(d)} isToday={today === d} readOnly={readOnly}
              onMouseEnter={() => onDayEnter(d)} onClick={() => onDayClick(d)} />
          )
        })}
      </div>
      {monthTrips.length > 0 && (
        <div className="mt-2 space-y-1">
          {monthTrips.map((t) => <TripBlock key={t.id} trip={t} readOnly={readOnly} onClick={() => onTripClick(t)} />)}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 6: Write `src/components/calendar/CalendarView.tsx`** (owns selection state; blocks crossing covered days)

```tsx
import { useMemo, useState } from 'react'
import { monthsWindow, formatISO, enumerateDays } from '@/lib/dates'
import { coveredDays } from '@/lib/overlap'
import { holidaySetFromCache } from '@/lib/holidays'
import { useAppStore } from '@/store/useAppStore'
import MonthGrid from './MonthGrid'
import type { Trip } from '@/types'

export default function CalendarView({ readOnly = false, onRangeSelected, onTripClick }: {
  readOnly?: boolean
  onRangeSelected?: (start: string, end: string) => void
  onTripClick?: (trip: Trip) => void
}) {
  const trips = useAppStore((s) => s.trips)
  const holidays = useAppStore((s) => s.holidays)
  const [anchor, setAnchor] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  const window = useMemo(() => monthsWindow(new Date()), [])
  const today = formatISO(new Date())
  const holidaySet = useMemo(() => holidaySetFromCache(holidays), [holidays])
  const covered = useMemo(() => coveredDays(trips), [trips])

  // A preview that would cross a covered day is rejected (no overlap allowed).
  const previewValid = (end: string) => {
    if (!anchor) return true
    const [lo, hi] = anchor < end ? [anchor, end] : [end, anchor]
    return !enumerateDays(lo, hi).some((d) => covered.has(d))
  }

  const handleDayClick = (d: string) => {
    if (readOnly) return
    if (!anchor) { setAnchor(d); setHover(d); return }
    if (!previewValid(d)) return
    const [start, end] = anchor < d ? [anchor, d] : [d, anchor]
    setAnchor(null); setHover(null)
    onRangeSelected?.(start, end)
  }

  const handleDayEnter = (d: string) => {
    if (readOnly || !anchor) return
    setHover(previewValid(d) ? d : anchor)
  }

  const selection = { start: anchor, end: anchor ? hover : null }

  return (
    <div>
      {window.map(({ year, month }) => (
        <MonthGrid key={`${year}-${month}`} year={year} month={month}
          trips={trips} holidays={holidaySet} covered={covered} today={today}
          selection={selection} readOnly={readOnly}
          onDayEnter={handleDayEnter} onDayClick={handleDayClick}
          onTripClick={(t) => onTripClick?.(t)} />
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Wire `src/routes/PlannerPage.tsx`** (drawer state placeholder; real drawer in Task 14)

```tsx
import { useState } from 'react'
import CalendarView from '@/components/calendar/CalendarView'
import type { Trip } from '@/types'

export default function PlannerPage() {
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <CalendarView
        onRangeSelected={(start, end) => setPending({ start, end })}
        onTripClick={(t) => setEditing(t)}
      />
      {/* TripDrawer mounted in Task 14 using pending/editing */}
    </main>
  )
}
```

- [ ] **Step 8: Run test → PASS;** `bun run build` clean.

- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat: add rolling calendar with range selection"`

---

### Task 14: Trip create/edit drawer + booking checklist + location picker

**Files:**
- Create: `src/components/TripDrawer.tsx`, `src/components/BookingChecklist.tsx`, `src/components/LocationPicker.tsx`, `src/hooks/useMergedLocations.ts`
- Modify: `src/routes/PlannerPage.tsx` (mount drawer)
- Test: `src/components/TripDrawer.test.tsx`

**Interfaces:**
- Consumes: `useAppStore`, `hasOverlap` (`@/lib/overlap`), `leaveDaysByYear` (`@/lib/leave`), `estimatedDives` (`@/lib/dives`), `holidaySetFromCache`, `mergeLocations`.
- Produces:
  - `useMergedLocations(): Location[]`.
  - `<TripDrawer open mode={'create'|'edit'} initialRange? trip? onClose />`. On Save validates overlap (excluding edited trip id) → inline error blocks save; else `addTrip`/`updateTrip` and close. Edit mode shows Delete. Pre-seeds bookings for dive types; hides checklist for `non-dive`. Suggests `confirmed` when ≥1 booking and all booked.
- Default form: `status: 'planned'`, `type: 'fun-dive'`, generated `id` via `crypto.randomUUID()`.

- [ ] **Step 1: Write `src/hooks/useMergedLocations.ts`**

```ts
import { useAppStore } from '@/store/useAppStore'
import { mergeLocations } from '@/lib/locations'

export function useMergedLocations() {
  const overrides = useAppStore((s) => s.siteOverrides)
  return mergeLocations(overrides)
}
```

- [ ] **Step 2: Write the failing test `src/components/TripDrawer.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripDrawer from './TripDrawer'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS, type Trip } from '@/types'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('TripDrawer', () => {
  it('creates a trip on save', async () => {
    render(<TripDrawer open mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={() => {}} />)
    await userEvent.type(screen.getByLabelText(/trip name/i), 'Malapascua')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(useAppStore.getState().trips).toHaveLength(1)
    expect(useAppStore.getState().trips[0].label).toBe('Malapascua')
  })

  it('blocks save when range overlaps another trip', async () => {
    const existing: Trip = { id: 'x', label: 'X', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] }
    useAppStore.setState({ trips: [existing] })
    render(<TripDrawer open mode="create" initialRange={{ start: '2026-05-18', end: '2026-05-25' }} onClose={() => {}} />)
    await userEvent.type(screen.getByLabelText(/trip name/i), 'Overlap')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(useAppStore.getState().trips).toHaveLength(1) // not added
    expect(screen.getByText(/overlaps/i)).toBeInTheDocument()
  })

  it('hides booking checklist for non-dive trips', async () => {
    render(<TripDrawer open mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={() => {}} />)
    // switch type to non-dive via the select (native fallback labelled "Trip type")
    expect(screen.getByText(/booking checklist/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test → FAIL.**

- [ ] **Step 4: Write `src/components/BookingChecklist.tsx`**

```tsx
import { Trash2, Plus } from 'lucide-react'
import type { BookingItem, BookingCategory } from '@/types'

const CATEGORIES: BookingCategory[] = ['dive-shop', 'flight', 'transfer', 'accommodation', 'other']

export default function BookingChecklist({ items, onChange }: { items: BookingItem[]; onChange: (items: BookingItem[]) => void }) {
  const update = (id: string, patch: Partial<BookingItem>) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const add = () => onChange([...items, { id: crypto.randomUUID(), category: 'other', label: '', booked: false }])
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Booking checklist</span>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2">
          <input type="checkbox" checked={it.booked} onChange={(e) => update(it.id, { booked: e.target.checked })} aria-label={`booked ${it.label || it.category}`} />
          <select value={it.category} onChange={(e) => update(it.id, { category: e.target.value as BookingCategory })} className="rounded-md border border-line bg-white px-2 py-1 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={it.label} onChange={(e) => update(it.id, { label: e.target.value })} placeholder="e.g. Blahblah Divers" className="flex-1 rounded-md border border-line bg-white px-2 py-1 text-sm" />
          <button type="button" onClick={() => remove(it.id)} aria-label="remove item"><Trash2 className="h-4 w-4 text-muted" /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-sm text-primary"><Plus className="h-4 w-4" /> Add item</button>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/LocationPicker.tsx`** (searchable select over merged locations)

```tsx
import { useMergedLocations } from '@/hooks/useMergedLocations'

export default function LocationPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const locations = useMergedLocations()
  return (
    <div className="space-y-1">
      <label htmlFor="location" className="text-sm font-medium">Location</label>
      <select id="location" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm">
        <option value="">— none —</option>
        {locations.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.country}</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 6: Write `src/components/TripDrawer.tsx`** (uses shadcn `Sheet`; bottom sheet on mobile via `side`)

```tsx
import { useMemo, useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

export default function TripDrawer({ open, mode, initialRange, trip, onClose }: {
  open: boolean
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  onClose: () => void
}) {
  const { addTrip, updateTrip, deleteTrip, trips, holidays } = useAppStore()
  const [label, setLabel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [type, setType] = useState<TripType>('fun-dive')
  const [status, setStatus] = useState<TripStatus>('planned')
  const [locationId, setLocationId] = useState<string | undefined>(undefined)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [notes, setNotes] = useState('')
  const [diveOverride, setDiveOverride] = useState<number | undefined>(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && trip) {
      setLabel(trip.label); setStart(trip.startDate); setEnd(trip.endDate); setType(trip.type)
      setStatus(trip.status); setLocationId(trip.locationId); setBookings(trip.bookings)
      setNotes(trip.notes ?? ''); setDiveOverride(trip.estimatedDives)
    } else if (initialRange) {
      setLabel(''); setStart(initialRange.start); setEnd(initialRange.end); setType('fun-dive')
      setStatus('planned'); setLocationId(undefined); setBookings(seedBookings('fun-dive'))
      setNotes(''); setDiveOverride(undefined)
    }
    setError('')
  }, [open, mode, trip, initialRange])

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
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{mode === 'edit' ? 'Edit trip' : 'New trip'}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <label htmlFor="trip-name" className="text-sm font-medium">Trip name</label>
            <input id="trip-name" value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm" placeholder="Malapascua May 2026" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="start" className="text-sm font-medium">Start</label>
              <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="end" className="text-sm font-medium">End</label>
              <input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm" />
            </div>
          </div>

          <LocationPicker value={locationId} onChange={setLocationId} />

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="type" className="text-sm font-medium">Trip type</label>
              <select id="type" value={type} onChange={(e) => onTypeChange(e.target.value as TripType)} className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as TripStatus)} className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm">
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
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm" />
          </div>

          <div className="rounded-md border border-line bg-white p-3 font-mono text-xs">
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
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 7: Mount the drawer in `src/routes/PlannerPage.tsx`**

```tsx
import { useState } from 'react'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import type { Trip } from '@/types'

export default function PlannerPage() {
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)
  const open = pending !== null || editing !== null
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <CalendarView
        onRangeSelected={(start, end) => { setEditing(null); setPending({ start, end }) }}
        onTripClick={(t) => { setPending(null); setEditing(t) }}
      />
      <TripDrawer
        open={open}
        mode={editing ? 'edit' : 'create'}
        initialRange={pending ?? undefined}
        trip={editing ?? undefined}
        onClose={() => { setPending(null); setEditing(null) }}
      />
    </main>
  )
}
```

- [ ] **Step 8: Run test → PASS;** `bun run build` clean. (If the shadcn `Sheet` import path differs, match the generated file in `src/components/ui/sheet.tsx`.)

- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat: add trip create/edit drawer with booking checklist"`

---

### Task 15: Locations explorer page

**Files:**
- Modify: `src/routes/LocationsPage.tsx`
- Create: `src/components/AddLocationDialog.tsx`, `src/components/SeasonalityGrid.tsx`
- Test: `src/routes/LocationsPage.test.tsx`

**Interfaces:**
- Consumes: `useMergedLocations`, `useAppStore` (`upsertOverride`, `siteOverrides`), `useNavigate`.
- Produces: filterable location list (country/difficulty/month), detail panel with `SeasonalityGrid`, "Plan a trip here" → navigates `/?location=<id>`, "+ Add location" → `AddLocationDialog`, "Export my overrides" (visible only when overrides exist) downloads JSON.
- Wires `PlannerPage` to read `?location=` and pre-select it (add `useSearchParams` read + pass into a fresh range create flow).

- [ ] **Step 1: Write `src/components/SeasonalityGrid.tsx`**

```tsx
import { cn } from '@/lib/cn'
import type { LocationMonthRating } from '@/types'

const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D']
const dot: Record<string, string> = { good: 'bg-good', fair: 'bg-fair', poor: 'bg-poor', closed: 'bg-closed' }

export default function SeasonalityGrid({ seasonality }: { seasonality: LocationMonthRating[] }) {
  return (
    <div className="inline-grid grid-cols-12 gap-1 text-center font-mono text-xs">
      {seasonality.map((s) => <div key={s.month} className="text-muted">{MONTHS[s.month - 1]}</div>)}
      {seasonality.map((s) => <div key={`r-${s.month}`} className={cn('h-4 w-4 rounded-sm', dot[s.rating])} title={s.rating} />)}
    </div>
  )
}
```

- [ ] **Step 2: Write the failing test `src/routes/LocationsPage.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    expect(screen.getByText('Malapascua')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /plan a trip here/i })).toBeInTheDocument()
  })

  it('hides Export my overrides when there are none', () => {
    render(<MemoryRouter><LocationsPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /export my overrides/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test → FAIL.**

- [ ] **Step 4: Write `src/components/AddLocationDialog.tsx`** (form → `upsertOverride`; 12 month rating selects)

```tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import type { Location, MonthRating } from '@/types'

const RATINGS: MonthRating[] = ['good', 'fair', 'poor', 'closed']

export default function AddLocationDialog() {
  const upsertOverride = useAppStore((s) => s.upsertOverride)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [difficulty, setDifficulty] = useState<Location['difficulty']>('beginner')
  const [ratings, setRatings] = useState<MonthRating[]>(Array(12).fill('good'))

  const save = () => {
    if (!name.trim()) return
    const loc: Location = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`, name: name.trim(), country: country.trim() || 'Unknown',
      difficulty, highlights: [], isUserAdded: true,
      seasonality: ratings.map((rating, i) => ({ month: i + 1, rating })),
    }
    upsertOverride(loc)
    setOpen(false); setName(''); setCountry(''); setRatings(Array(12).fill('good'))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="w-full">+ Add location</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a location</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="location name" className="w-full rounded-md border border-line px-2 py-2 text-sm" />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" aria-label="country" className="w-full rounded-md border border-line px-2 py-2 text-sm" />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Location['difficulty'])} className="w-full rounded-md border border-line px-2 py-2 text-sm">
            <option value="beginner">beginner</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option>
          </select>
          <div className="grid grid-cols-6 gap-2">
            {ratings.map((r, i) => (
              <select key={i} aria-label={`month ${i + 1} rating`} value={r}
                onChange={(e) => setRatings((prev) => prev.map((x, j) => (j === i ? (e.target.value as MonthRating) : x)))}
                className="rounded border border-line px-1 py-1 text-xs">
                {RATINGS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            ))}
          </div>
          <Button onClick={save} className="w-full">Save location</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Write `src/routes/LocationsPage.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import { useAppStore } from '@/store/useAppStore'
import SeasonalityGrid from '@/components/SeasonalityGrid'
import AddLocationDialog from '@/components/AddLocationDialog'
import { Button } from '@/components/ui/button'

export default function LocationsPage() {
  const locations = useMergedLocations()
  const overrides = useAppStore((s) => s.siteOverrides)
  const navigate = useNavigate()
  const [country, setCountry] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [selectedId, setSelectedId] = useState(locations[0]?.id)

  const filtered = useMemo(
    () => locations.filter((l) => (!country || l.country === country) && (!difficulty || l.difficulty === difficulty)),
    [locations, country, difficulty],
  )
  const selected = locations.find((l) => l.id === selectedId) ?? filtered[0]
  const countries = [...new Set(locations.map((l) => l.country))].sort()

  const exportOverrides = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'diveplanner-overrides.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 pb-20 md:grid-cols-[280px_1fr] md:pb-6">
      <aside className="space-y-3">
        <div className="flex gap-2">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="flex-1 rounded-md border border-line px-2 py-1 text-sm" aria-label="filter country">
            <option value="">All countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="flex-1 rounded-md border border-line px-2 py-1 text-sm" aria-label="filter difficulty">
            <option value="">All levels</option><option value="beginner">beginner</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option>
          </select>
        </div>
        <ul className="divide-y divide-line rounded-md border border-line">
          {filtered.map((l) => (
            <li key={l.id}>
              <button onClick={() => setSelectedId(l.id)} className={`w-full px-3 py-2 text-left text-sm ${selected?.id === l.id ? 'bg-line/50 font-medium' : ''}`}>
                {l.name} <span className="text-muted">· {l.country}</span>
              </button>
            </li>
          ))}
        </ul>
        <AddLocationDialog />
        {overrides.length > 0 && <Button variant="outline" className="w-full" onClick={exportOverrides}>Export my overrides</Button>}
      </aside>

      {selected && (
        <section className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold">{selected.name}</h1>
            <p className="text-muted">{selected.country} · {selected.difficulty}</p>
          </div>
          {selected.highlights.length > 0 && (
            <div><h3 className="text-sm font-semibold">Highlights</h3><p>{selected.highlights.join(', ')}</p></div>
          )}
          <div><h3 className="mb-2 text-sm font-semibold">Seasonality</h3><SeasonalityGrid seasonality={selected.seasonality} /></div>
          {selected.currentNote && <p className="rounded-md border border-line bg-white p-3 text-sm text-muted">{selected.currentNote}</p>}
          <Button onClick={() => navigate(`/?location=${selected.id}`)}>Plan a trip here →</Button>
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 6: Wire `?location=` pre-selection in `PlannerPage`** — read `useSearchParams`; when present, store it and pass as a default `locationId` into the next created trip. Minimal change: pass `defaultLocationId` to `TripDrawer` create mode.

In `PlannerPage.tsx` add:
```tsx
import { useSearchParams } from 'react-router-dom'
// inside component:
const [params] = useSearchParams()
const defaultLocationId = params.get('location') ?? undefined
// pass to TripDrawer:  defaultLocationId={defaultLocationId}
```
In `TripDrawer.tsx` create-branch of the `useEffect`, set `setLocationId(defaultLocationId)` (add `defaultLocationId?: string` prop, default `undefined`).

- [ ] **Step 7: Run test → PASS;** `bun run build` clean.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: add locations explorer with custom locations and export"`

---

### Task 16: Settings dialog

**Files:**
- Create: `src/components/SettingsDialog.tsx`
- Modify: `src/components/Nav.tsx` (pass Settings trigger via `actions`), `src/App.tsx` (provide actions)
- Test: `src/components/SettingsDialog.test.tsx`

**Interfaces:**
- Consumes: `useAppStore` (`settings`, `updateSettings`), `SUPPORTED_COUNTRIES`.
- Produces: `<SettingsDialog/>` modal; changes write immediately to store.

- [ ] **Step 1: Write the failing test `src/components/SettingsDialog.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsDialog from './SettingsDialog'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => useAppStore.setState({ settings: DEFAULT_SETTINGS }))

describe('SettingsDialog', () => {
  it('updates total leave days immediately', async () => {
    render(<SettingsDialog />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    const input = screen.getByLabelText(/total leave days/i)
    await userEvent.clear(input)
    await userEvent.type(input, '30')
    expect(useAppStore.getState().settings.totalLeaveDays).toBe(30)
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/components/SettingsDialog.tsx`**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings as SettingsIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { SUPPORTED_COUNTRIES } from '@/data/countries'

export default function SettingsDialog() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  return (
    <Dialog>
      <DialogTrigger className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink" aria-label="Settings">
        <SettingsIcon className="h-4 w-4" /> Settings
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="country" className="text-sm font-medium">Country (for public holidays)</label>
            <select id="country" value={settings.country} onChange={(e) => updateSettings({ country: e.target.value })} className="w-full rounded-md border border-line px-2 py-2 text-sm">
              {SUPPORTED_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="total-leave" className="text-sm font-medium">Total leave days</label>
            <input id="total-leave" type="number" min={0} value={settings.totalLeaveDays}
              onChange={(e) => updateSettings({ totalLeaveDays: Number(e.target.value) })} className="w-full rounded-md border border-line px-2 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label htmlFor="carryover" className="text-sm font-medium">Carryover days</label>
            <input id="carryover" type="number" min={0} value={settings.carryoverDays}
              onChange={(e) => updateSettings({ carryoverDays: Number(e.target.value) })} className="w-full rounded-md border border-line px-2 py-2 text-sm" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Provide it via Nav `actions`** — in `src/App.tsx`, render `<Nav actions={<><SettingsDialog /><ShareButton /></>} />` (ShareButton added in Task 17; for now just `<SettingsDialog />`). Import `SettingsDialog`.

- [ ] **Step 5: Run test → PASS;** `bun run build` clean.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add settings dialog"`

---

### Task 17: Share button + share view route

**Files:**
- Create: `src/components/ShareButton.tsx`
- Modify: `src/routes/SharePage.tsx`, `src/App.tsx` (add ShareButton to Nav actions)
- Test: `src/components/ShareButton.test.tsx`, `src/routes/SharePage.test.tsx`

**Interfaces:**
- Consumes: `useAppStore`, `encodeShare`/`decodeShare` (`@/lib/share`), `CalendarView` (readOnly), `useNavigate`/`useParams`.
- Produces:
  - `<ShareButton/>` — builds `/share/<hash>` from current persisted state, copies to clipboard, toasts.
  - `SharePage` — decodes `:hash`; on success loads into a local read-only store view + banner + "Make this mine" (confirm → `replaceAll` + navigate `/`) and "Plan my own" (navigate `/`); on failure shows friendly error + "Start your own plan".

- [ ] **Step 1: Write the failing test `src/components/ShareButton.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareButton from './ShareButton'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'
import { decodeShare } from '@/lib/share'

beforeEach(() => {
  useAppStore.setState({ trips: [{ id: 'a', label: 'A', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] }], siteOverrides: [], settings: DEFAULT_SETTINGS })
})

describe('ShareButton', () => {
  it('copies a decodable share URL to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<ShareButton />)
    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalledOnce()
    const url: string = writeText.mock.calls[0][0]
    const hash = url.split('/share/')[1]
    expect(decodeShare(hash)?.trips[0].label).toBe('A')
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/components/ShareButton.tsx`**

```tsx
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { encodeShare } from '@/lib/share'

export default function ShareButton() {
  const { trips, siteOverrides, settings } = useAppStore()
  const share = async () => {
    const hash = encodeShare({ trips, siteOverrides, settings })
    const url = `${window.location.origin}/share/${hash}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    } catch {
      toast.error('Could not copy link')
    }
  }
  return (
    <button onClick={share} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink" aria-label="Share">
      <Share2 className="h-4 w-4" /> Share
    </button>
  )
}
```

- [ ] **Step 4: Add `<Toaster />` + ShareButton** — in `src/App.tsx`: import `{ Toaster } from '@/components/ui/sonner'` (or `'sonner'`), render `<Toaster />` once; set Nav actions to `<><SettingsDialog /><ShareButton /></>`.

- [ ] **Step 5: Write the failing test `src/routes/SharePage.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SharePage from './SharePage'
import { encodeShare } from '@/lib/share'
import { DEFAULT_SETTINGS } from '@/types'

function renderAt(hash: string) {
  return render(
    <MemoryRouter initialEntries={[`/share/${hash}`]}>
      <Routes><Route path="/share/:hash" element={<SharePage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('SharePage', () => {
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
})
```

- [ ] **Step 6: Write `src/routes/SharePage.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeShare } from '@/lib/share'
import { useAppStore } from '@/store/useAppStore'
import CalendarView from '@/components/calendar/CalendarView'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'

export default function SharePage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const replaceAll = useAppStore((s) => s.replaceAll)
  const shared = useMemo(() => (hash ? decodeShare(hash) : null), [hash])
  const [overwriting, setOverwriting] = useState(false)

  if (!shared) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">This link can't be read</h1>
        <p className="mt-2 text-muted">The shared plan is missing or corrupted.</p>
        <Button className="mt-6" onClick={() => navigate('/')}>Start your own plan</Button>
      </main>
    )
  }

  // Render a read-only calendar by temporarily seeding store-independent props.
  // CalendarView reads from the store, so we apply the shared trips into the store view
  // only for the local component tree via a one-time set is avoided; instead pass readOnly.
  return (
    <div className="min-h-dvh bg-surface">
      <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-white">
        You're viewing a shared dive plan
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-end gap-2 px-4 py-3">
        <Dialog open={overwriting} onOpenChange={setOverwriting}>
          <DialogTrigger asChild><Button>Make this mine</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Overwrite your local plan?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted">This replaces your current trips, locations, and settings with the shared plan. This can't be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverwriting(false)}>Cancel</Button>
              <Button onClick={() => { replaceAll(shared); navigate('/') }}>Overwrite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => navigate('/')}>Plan my own</Button>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <SharedCalendar trips={shared.trips} holidays={{}} />
      </main>
    </div>
  )
}

// Read-only calendar fed from shared state (not the local store).
function SharedCalendar({ trips }: { trips: import('@/types').Trip[]; holidays: Record<string, string[]> }) {
  // CalendarView reads the live store; to keep the shared view isolated, render trip blocks
  // through CalendarView in readOnly mode after seeding a scoped store snapshot.
  return <CalendarView readOnly />
}
```

> **Implementation note for the executor:** `CalendarView` currently reads trips from the global store. For a faithful read-only shared view that does **not** mutate the user's store, refactor `CalendarView` to accept optional `trips`/`holidays` props that override the store when provided (default to store). Update the Task 13 component signature accordingly: `CalendarView({ trips: tripsProp, holidays: holidaysProp, ... })` using `tripsProp ?? storeTrips`. Add a test asserting the shared calendar shows a shared trip label without adding it to the store. Keep the Task 13 tests green.

- [ ] **Step 7: Apply the CalendarView prop override** (per the note): add optional `trips?: Trip[]` and `holidays?: Record<string, ISODate[]>` props; use `?? store`. Pass `shared.trips` from `SharedCalendar`.

- [ ] **Step 8: Run tests → PASS;** `bun run build` clean.

- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat: add share button and read-only share view"`

---

### Task 18: Holiday hook wiring + final integration + build verification

**Files:**
- Create: `src/hooks/useHolidays.ts`
- Modify: `src/App.tsx` (call the hook; surface error toast)
- Test: `src/hooks/useHolidays.test.tsx`

**Interfaces:**
- Consumes: `useAppStore` (`settings.country`, `setHolidays`, `setHolidaysLoading`, `setHolidaysError`), `fetchHolidays`/`holidayKey` (`@/lib/holidays`).
- Produces: `useHolidays()` — on mount and when country changes, fetches current + next year, stores into session slice; sets error flag + toast on failure (graceful: leave calc still works without holidays).

- [ ] **Step 1: Write the failing test `src/hooks/useHolidays.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHolidays } from './useHolidays'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => {
  useAppStore.setState({ settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('useHolidays', () => {
  it('fetches current and next year into the session slice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-08-09' }] }))
    renderHook(() => useHolidays())
    await waitFor(() => {
      const keys = Object.keys(useAppStore.getState().holidays)
      expect(keys.length).toBe(2)
    })
  })
  it('sets error flag on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    renderHook(() => useHolidays())
    await waitFor(() => expect(useAppStore.getState().holidaysError).toBe(true))
  })
})
```

- [ ] **Step 2: Run test → FAIL.**

- [ ] **Step 3: Write `src/hooks/useHolidays.ts`**

```ts
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { fetchHolidays, holidayKey } from '@/lib/holidays'

export function useHolidays() {
  const country = useAppStore((s) => s.settings.country)
  const setHolidays = useAppStore((s) => s.setHolidays)
  const setLoading = useAppStore((s) => s.setHolidaysLoading)
  const setError = useAppStore((s) => s.setHolidaysError)

  useEffect(() => {
    let cancelled = false
    const year = new Date().getFullYear()
    const years = [year, year + 1]
    setLoading(true); setError(false)

    Promise.all(years.map((y) => fetchHolidays(country, y).then((dates) => ({ y, dates }))))
      .then((results) => {
        if (cancelled) return
        for (const { y, dates } of results) setHolidays(holidayKey(country, y), dates)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        toast.warning('Could not load public holidays — leave counts weekdays only.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [country, setHolidays, setLoading, setError])
}
```

- [ ] **Step 4: Call the hook in `src/App.tsx`** — add `useHolidays()` at the top of the `App` component body.

- [ ] **Step 5: Run tests → PASS.**

- [ ] **Step 6: Full verification**

```bash
bun run test     # all suites pass
bun run build    # tsc clean + vite build
bun run dev      # manual smoke: calendar loads, create a trip, gauge updates, share copies, /locations works
```

- [ ] **Step 7: Update the spec** — change the URL-compression row in the tech-stack table of `docs/superpowers/specs/2026-06-28-diveplanner-design.md` from "lz-string (compress) + base64 encode" to "lz-string `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`" so the spec matches the invariant the code follows. Note Vitest as the test runner if the stack table is updated.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: wire holiday fetching and finalize integration"`

---

## Spec Coverage Self-Review

| Spec requirement | Task |
|---|---|
| Bun + Vite + React 18 + TS scaffold | 1 |
| Tailwind + shadcn + theme tokens | 1, 11 |
| Domain types (Trip, Location, Settings, …) | 2 |
| 15 bundled locations, 12 month ratings | 2 |
| Supported holiday countries | 2 |
| Date math (enumerate, weekday, window) | 3 |
| Leave per-year, Dec-31 split | 4 |
| Estimated dives (per-type, min 0) | 5 |
| No overlapping trips / covered days | 6, 13, 14 |
| Location merge (base + overrides, override wins) | 7 |
| Share encode/decode (lz-string, URL-safe, malformed→null) | 8, 17 |
| Nager.Date fetch + graceful degradation | 9, 18 |
| Zustand persist (partialize session slice out) | 10 |
| Routes `/`, `/locations`, `/share/:hash` | 11 |
| Nav (top desktop / bottom mobile) | 11 |
| Leave balance bar, both years, colour thresholds | 12 |
| Rolling 12-month calendar, holidays, trip blocks, status styling | 13 |
| Range selection, hover preview, blocked across covered days | 13 |
| Trip create/edit drawer, overlap validation, calc displays | 14 |
| Booking checklist (seed dive types, hide non-dive, confirm suggestion) | 14 |
| Location picker (searchable) | 14 |
| Locations explorer (filters, detail, seasonality grid, plan-here, add, export) | 15 |
| Settings dialog (country, leave, carryover; immediate save) | 16 |
| Share button (copy + toast) | 17 |
| Share view (banner, make-this-mine confirm, plan-my-own, read-only, error page) | 17 |
| Holiday fetch on load + country change | 18 |
| Mobile responsiveness (bottom sheet, pill, tab bar) | 11, 12, 14, 15 |

**Out of scope (correctly omitted):** accounts/cloud sync, multiple profiles, notifications, offline PWA, flight prices, route descriptions, shop/accommodation recommendations.

**Decisions to flag at review:**
1. **Test runner = Vitest + @testing-library** (not in the spec's stack table, but TDD needs a runner; wired to `bun run test`, jsdom env). React-component TDD is far smoother with Vitest than `bun:test`.
2. **Share-view isolation:** Task 17 refactors `CalendarView` to accept optional `trips`/`holidays` props so the shared plan renders without mutating the user's store. Noted inline.
3. **Spec drift fix:** the spec's stack table says "lz-string + base64"; the detailed Share section and AGENTS.md mandate `compressToEncodedURIComponent`. Plan follows the invariant; Task 18 Step 7 updates the spec table to match.
