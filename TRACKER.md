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

### ✅ Task 7: Location merge (lib/locations.ts)
- **Commit:** `9bfbfea` — feat: add location merge (base + overrides)
- **Review:** Clean
- **Files created:** src/lib/locations.ts, src/lib/locations.test.ts (3 tests)

### ✅ Task 8: Share encode/decode (lib/share.ts)
- **Commit:** `cd56fc9` — feat: add lz-string share encode/decode
- **Review:** Clean

### ✅ Task 9: Holiday fetch service (lib/holidays.ts)
- **Commit:** `e96ded1` — feat: add Nager.Date holiday fetch service
- **Review:** Clean

### ✅ Task 10: Zustand store (store/useAppStore.ts)
- **Commit:** `80797d7` — feat: add zustand persist store
- **Review:** Clean (leaveBudget deviation from brief applied correctly)

### ✅ Task 11: App shell, routing, nav, theme wiring
- **Commit:** `658e3ff` — feat: add app shell, routing, and nav
- **Review:** Clean (minor: aria-hidden mobile nav for jsdom compat, shadcn artifacts)

### ✅ Task 12: Leave Balance Bar (signature gauge)
- **Commit:** `2084f8c` — feat: add per-year leave balance gauge
- **Review:** Clean (leaveBudget deviation from brief applied correctly)

### ✅ Task 13: Calendar view + range selection
- **Commit:** `d0c9f45` — feat: add rolling calendar with range selection
- **Review:** Clean (minor: _pending/_editing names, window shadow, today memo)

### ✅ Task 14: Trip create/edit drawer + booking checklist + location picker
- **Commit:** `36f9eec` — feat: add trip create/edit drawer with booking checklist
- **Review:** Clean (minor: test 3 spec debt)

### ✅ Task 15: Locations explorer page
- **Commit:** `8b14f61` — feat: add locations explorer with custom locations and export
- **Review:** Clean

### ✅ Task 16: Settings dialog
- **Commit:** `c53777c` — feat: add settings dialog
- **Review:** Clean (per-year leaveBudget inputs, deviation from brief accepted)

### ✅ Task 17: Share button + share view route
- **Commits:** `9a3584d` + `7daab04` (fix: store-isolation test)
- **Review:** Clean after fix (CalendarView prop override, SharePage read-only)

### ✅ Task 18: Holiday hook wiring + final integration + build verification
- **Commit:** `079248b` — feat: wire holiday fetching and finalize integration
- **Review:** Clean; 57/57 tests; build clean; spec doc updated

### ✅ Final review fixes
- **Commit:** `b8d0fa0` — fix: clear stale holidays on country change, add date validation to trip save
- **Final whole-branch review:** ✅ Ready to merge

## Design Decision: Per-year leave budget (RESOLVED)

**Decision (2026-06-28):** Use `Settings.leaveBudget: Record<number, number>` (Option B).
- `totalLeaveDays` and `carryoverDays` removed from `Settings`.
- `leaveBudget` maps calendar year → days available (carryover folded in by user).
- `DEFAULT_SETTINGS.leaveBudget = { [currentYear]: 25, [currentYear+1]: 25 }`.
- `useLeaveByYear` (Task 12): `total = settings.leaveBudget[year] ?? 0`.
- `SettingsDialog` (Task 16): per-year number inputs for each year in rolling window.
- **Commit:** `f7b3ff3` — feat: change Settings to per-year leaveBudget record
- Design spec updated to match.

## UI v2 — Next Steps

### Status: Design complete → Plan needed

- **Spec:** `docs/superpowers/specs/2026-06-28-ui-v2-design.md` (committed `b2164d5`)
- **Next action:** Invoke `superpowers:writing-plans` skill to produce an implementation plan for the UI v2 spec. The plan should decompose the work into SDD-compatible tasks and live at `docs/superpowers/plans/2026-06-28-ui-v2-implementation.md`.
- **Then:** Resume SDD workflow using that plan (update this tracker with task entries as each task is dispatched and completed).

### UI v2 change groups (summary)
1. Layout & nav — sticky header, 3-col compact calendar (currentMonth → Dec currentYear+1), inline split panel, responsive top nav (no bottom tab bar), sun/moon toggle
2. Dark mode — `.dark` CSS variable overrides (ocean palette), `--surface-elevated` token, Shadcn variable bridge, default dark
3. Calendar cells & hover — full trip-colour fill, amber holiday underline, rich hover tooltip (locations/holiday/trip)
4. Trip drawer — TripPanel extract, form fixes (placeholders, status default, location Other + `customLocation`), seasonality panel, segmented leave breakdown
5. Leave & holidays — `applySubstituteHolidays` with chaining, `calendarWindow` replaces `monthsWindow`, `HolidayEntry` type upgrade

## Current git HEAD

```
b2164d5 docs: add UI v2 design spec (layout, dark mode, calendar, drawer, leave)
b8d0fa0 fix: clear stale holidays on country change, add date validation to trip save
079248b feat: wire holiday fetching and finalize integration
7daab04 test: add CalendarView store-isolation test for SharePage
9a3584d feat: add share button and read-only share view
c53777c feat: add settings dialog
8b14f61 feat: add locations explorer with custom locations and export
```

## Test Suite State (as of Task 18 + final fixes complete)

`bun run test` → 57/57 passing across 19 test files (all tasks complete)
- src/lib/leave.test.ts (6)
