# DivePlanner Implementation Tracker

> **For a resuming agent:** Read this file first. It captures the full execution state. Pick up at the first unchecked task, following the SDD workflow described below.

## How to Resume

1. Read this file top to bottom.
2. Read `docs/superpowers/plans/2026-06-28-diveplanner-implementation.md` (the implementation plan).
3. Invoke the `superpowers:subagent-driven-development` skill.
4. Check `.superpowers/sdd/progress.md` for the ledger (authoritative commit record).
5. Resume at the first unchecked task below. Do NOT re-do completed tasks.
6. For each task: extract brief → dispatch implementer subagent → generate review package → dispatch reviewer → fix if needed → mark complete → append to ledger → next task.

## SDD Workflow Summary

- **Brief extraction:** `bash scripts/task-brief PLAN_FILE N` (scripts are at `C:\Users\Chris\.claude\plugins\cache\claude-plugins-official\superpowers\6.0.3\skills\subagent-driven-development\scripts\`)
- **Review package:** `bash scripts/review-package BASE_SHA HEAD`
- **Ledger file:** `C:\Users\Chris\diveplanner\.superpowers\sdd\progress.md`
- **Brief/report files:** `C:\Users\Chris\diveplanner\.superpowers\sdd\task-N-brief.md` / `task-N-report.md`
- **Plan file:** `docs/superpowers/plans/2026-06-28-diveplanner-implementation.md`
- **Work directory:** `C:\Users\Chris\diveplanner`
- **Platform:** Windows 11 — use **Bash tool** (POSIX) for all shell commands, NOT PowerShell.
- **Package manager:** Bun only. Never npm/pnpm/yarn.

## Global Constraints (apply to every task)

- Bun only. Only `bun.lock` (no npm/pnpm/yarn lockfiles).
- Vite stock (NOT Rolldown). React 18 (not 19). TypeScript strict mode.
- Share URLs: `lz-string` `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent` — never plain base64.
- Trip date ranges must not overlap. Leave is per calendar year (Dec 31 split). Seasonality is month-only (12 ratings/site). `non-dive` trips: no booking checklist, 0 estimated dives.
- Leave day = weekday (Mon–Fri) in range minus public holidays on those weekdays — nothing else excluded.
- Holiday slice is session-only (never persisted).
- `@/*` path alias → `src/*`.
- When you change behaviour in the spec, update `docs/superpowers/specs/2026-06-28-diveplanner-design.md` in the same change.
- Commit after every task. Conventional commit messages ending with: `Co-Authored-By: Claude <noreply@anthropic.com>`

## Known Deviations from Plan (accepted)

- `vite.config.ts` uses `import { defineConfig } from 'vitest/config'` (not `'vite'`). Vitest 4.x requires this — using `from 'vite'` causes TS errors. Accepted as version-compat fix.

## Task Status

### ✅ Task 1: Scaffold the app
- **Commit:** `a43ae6c` — chore: scaffold Bun + Vite + React 18 + TS + Tailwind + Vitest
- **Review:** Clean (vitest/config deviation accepted, see above)
- **Files created:** package.json, vite.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.js, components.json, vercel.json, index.html, src/main.tsx, src/App.tsx, src/index.css, src/vite-env.d.ts, src/lib/cn.ts, src/test/setup.ts, src/lib/cn.test.ts

### ✅ Task 2: Domain types + bundled location & country data
- **Commit:** `f33986b` — feat: add domain types and bundled location/country data
- **Review:** Clean
- **Files created:** src/types.ts, src/data/locations.ts (15 locations), src/data/countries.ts, src/data/locations.test.ts

### ✅ Task 3: Date helpers (lib/dates.ts)
- **Commit:** `2bbe17b` — feat: add date helper utilities
- **Review:** Clean
- **Files created:** src/lib/dates.ts, src/lib/dates.test.ts

### ✅ Task 4: Leave calculation (lib/leave.ts)
- **Commits:** `302ba7e` (initial) + `77cc289` (fix: remove unauthorized start-date mutation)
- **Review:** Bug found and fixed — original impl silently dropped Fridays from leave counts via unauthorized start-date advancement. Fix applied: `leaveDays` is now simply `enumerateDays(start,end).filter(isWeekday && !holidays.has)`. Friday test added. Re-review clean.
- **Files created:** src/lib/leave.ts, src/lib/leave.test.ts (6 tests)

### ✅ Task 5: Estimated dives (lib/dives.ts)
- **Commit:** `2d4c0bf` — feat: add estimated dives calculation
- **Review:** Clean
- **Files created:** src/lib/dives.ts, src/lib/dives.test.ts (5 tests)

### ✅ Task 6: Trip overlap detection (lib/overlap.ts)
- **Commit:** `6337143` — feat: add trip overlap detection
- **Review:** Clean
- **Files created:** src/lib/overlap.ts, src/lib/overlap.test.ts (5 tests)

### ⬜ Task 7: Location merge (lib/locations.ts)
- **Files to create:** src/lib/locations.ts, src/lib/locations.test.ts
- **Key interfaces:** `mergeLocations(overrides: Location[]): Location[]`

### ⬜ Task 8: Share encode/decode (lib/share.ts)
- **Files to create:** src/lib/share.ts, src/lib/share.test.ts
- **Key interfaces:** `ShareState`, `encodeShare`, `decodeShare`
- **CRITICAL:** Must use lz-string `compressToEncodedURIComponent` — never plain base64.

### ⬜ Task 9: Holiday fetch service (lib/holidays.ts)
- **Files to create:** src/lib/holidays.ts, src/lib/holidays.test.ts

### ⬜ Task 10: Zustand store (store/useAppStore.ts)
- **Files to create:** src/store/useAppStore.ts, src/store/useAppStore.test.ts
- **Persist config:** name `'diveplanner'`, partialize to persist only settings/trips/siteOverrides (NOT holidays session slice).

### ⬜ Task 11: App shell, routing, nav, theme wiring
- **shadcn install (do this first in Task 11):** `bunx --bun shadcn@latest add button dialog sheet input label select checkbox textarea badge toast sonner tabs popover command`
- **Files to create:** src/components/Nav.tsx, src/routes/PlannerPage.tsx, src/routes/LocationsPage.tsx, src/routes/SharePage.tsx
- **Files to modify:** src/App.tsx, src/main.tsx

### ⬜ Task 12: Leave Balance Bar (signature gauge)
- **Files to create:** src/hooks/useLeaveByYear.ts, src/components/LeaveBalanceBar.tsx
- **Files to modify:** src/App.tsx (mount bar under Nav)
- **Signature element:** per-year tank gauge, green→amber(≤5 days left)→red(0), monospace readout

### ⬜ Task 13: Calendar view + range selection
- **Files to create:** src/components/calendar/CalendarView.tsx, MonthGrid.tsx, DayCell.tsx, TripBlock.tsx
- **Files to modify:** src/routes/PlannerPage.tsx

### ⬜ Task 14: Trip create/edit drawer + booking checklist + location picker
- **Files to create:** src/components/TripDrawer.tsx, BookingChecklist.tsx, LocationPicker.tsx, src/hooks/useMergedLocations.ts
- **Files to modify:** src/routes/PlannerPage.tsx

### ⬜ Task 15: Locations explorer page
- **Files to create:** src/components/AddLocationDialog.tsx, src/components/SeasonalityGrid.tsx
- **Files to modify:** src/routes/LocationsPage.tsx
- **Test:** src/routes/LocationsPage.test.tsx

### ⬜ Task 16: Settings dialog
- **Files to create:** src/components/SettingsDialog.tsx
- **Files to modify:** src/components/Nav.tsx, src/App.tsx

### ⬜ Task 17: Share button + share view route
- **Files to create:** src/components/ShareButton.tsx
- **Files to modify:** src/routes/SharePage.tsx, src/App.tsx
- **Note (Task 17 Step 7):** Refactor CalendarView to accept optional `trips?` and `holidays?` props that override the store when provided (default to store). This lets SharePage render a read-only shared view without mutating the user's store.

### ⬜ Task 18: Holiday hook wiring + final integration + build verification
- **Files to create:** src/hooks/useHolidays.ts
- **Files to modify:** src/App.tsx
- **Final steps:** `bun run test` (all pass) + `bun run build` (clean) + update spec doc (lz-string table entry)

## Design Decision: Per-year leave budget (RESOLVED)

**Decision (2026-06-28):** Use `Settings.leaveBudget: Record<number, number>` (Option B).
- `totalLeaveDays` and `carryoverDays` removed from `Settings`.
- `leaveBudget` maps calendar year → days available (carryover folded in by user).
- `DEFAULT_SETTINGS.leaveBudget = { [currentYear]: 25, [currentYear+1]: 25 }`.
- `useLeaveByYear` (Task 12): `total = settings.leaveBudget[year] ?? 0`.
- `SettingsDialog` (Task 16): per-year number inputs for each year in rolling window.
- **Commit:** `f7b3ff3` — feat: change Settings to per-year leaveBudget record
- Design spec updated to match.

## Current git HEAD

```
f7b3ff3 feat: change Settings to per-year leaveBudget record
2d4c0bf feat: add estimated dives calculation
77cc289 fix: remove unauthorized start-date mutation from leave calculation
302ba7e feat: add per-year leave calculation
2bbe17b feat: add date helper utilities
f33986b feat: add domain types and bundled location/country data
a43ae6c chore: scaffold Bun + Vite + React 18 + TS + Tailwind + Vitest
5f1d8b8 Add project scaffolding: README, LICENSE, AGENTS.md, gitignore
```

## Test Suite State (as of Task 4 complete)

`bun run test` → 16/16 passing across:
- src/lib/cn.test.ts (1)
- src/data/locations.test.ts (3)
- src/lib/dates.test.ts (6)
- src/lib/leave.test.ts (6)
