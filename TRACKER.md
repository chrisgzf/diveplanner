# DivePlanner Implementation Tracker

> **For a resuming agent:** Read this file first. It captures the full execution state. Pick up at the first unchecked task, following the SDD workflow described below.

## How to Resume

1. Read this file top to bottom.
2. **Load the `shadcn` skill (Skill tool) before any UI work** — it is installed in this repo (pinned via `skills-lock.json`). Use it for all shadcn component adds/edits; never hand-write or fetch component source. See Global Constraints.
3. Read `docs/superpowers/plans/2026-06-28-diveplanner-implementation.md` (the implementation plan).
4. Invoke the `superpowers:subagent-driven-development` skill.
5. Check `.superpowers/sdd/progress.md` for the ledger (authoritative commit record).
6. Resume at the first unchecked task below. Do NOT re-do completed tasks.
7. For each task: extract brief → dispatch implementer subagent → generate review package → dispatch reviewer → fix if needed → mark complete → append to ledger → next task.

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
- **shadcn skill is mandatory for UI work.** It is installed in this repo and pinned via `skills-lock.json`. Always load it (Skill tool) before adding or editing shadcn components. Add components with `bunx --bun shadcn@latest add <name>` (preview first with `--dry-run`/`--diff`); never hand-write component source or fetch raw files from GitHub. Project is Tailwind **v3** → register custom colors in `tailwind.config.ts` (not `@theme inline`); CSS variables live in `src/index.css`. If `.agents/skills/shadcn` is missing (e.g. fresh clone), restore with `bunx --bun skills add shadcn/ui`.
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

### Status: ALL 14 TASKS COMPLETE + post-launch bugfixes applied

### UI v2 Task Status (plan: 2026-06-28-ui-v2-implementation.md)

- [x] Task 1: HolidayEntry type + holiday parsing & name-map migration — `cff5784..62c5a1d`
- [x] Task 2: Substitute holiday logic (`applySubstituteHolidays`) — `62c5a1d..c82ada8`
- [x] Task 3: `calendarWindow` replaces `monthsWindow` — `c82ada8..799eed2`
- [x] Task 4: Covered-trip map + full-colour cells + amber holiday underline — `799eed2..1c8d3dd`
- [x] Task 5: Day hover tooltip (`DayMeta` + shadcn Tooltip) — `1c8d3dd..83400e6`
- [x] Task 6: Dark-mode tokens & shadcn variable bridge — `83400e6..c7dc9c0`
- [x] Task 7: Theme setting, App effect & `bg-white` audit — `c7dc9c0..48debde`
- [x] Task 8: Responsive top nav + sticky leave bar + theme toggle — `48debde..53ccd1c`
- [x] Task 9: Compact 3-column calendar grid — `53ccd1c..cb8c8da`
- [x] Task 10: Extract `TripPanel` + inline split panel — `cb8c8da..2b33bb5`
- [x] Task 11: Trip drawer form field improvements — `2b33bb5..d6ede26`
- [x] Task 12: Location "Other" + `customLocation` — `d6ede26..75e4015`
- [x] Task 13: Seasonality panel in the trip drawer — `75e4015..f5550f3`
- [x] Task 14: Segmented leave breakdown — `f5550f3..457d657`

### UI v2 change groups (summary)
1. Layout & nav — sticky header, 3-col compact calendar (currentMonth → Dec currentYear+1), inline split panel, responsive top nav (no bottom tab bar), sun/moon toggle
2. Dark mode — `.dark` CSS variable overrides (ocean palette), `--surface-elevated` token, Shadcn variable bridge, default dark
3. Calendar cells & hover — full trip-colour fill, amber holiday underline, rich hover tooltip (locations/holiday/trip)
4. Trip drawer — TripPanel extract, form fixes (placeholders, status default, location Other + `customLocation`), seasonality panel, segmented leave breakdown
5. Leave & holidays — `applySubstituteHolidays` with chaining, `calendarWindow` replaces `monthsWindow`, `HolidayEntry` type upgrade

## Post-UI v2 Bugfixes (all committed to main, pushed)

| Commit | Fix |
|--------|-----|
| `4eb06e5` | Gate desktop/mobile with `useIsDesktop()` JS hook — Sheet portal escape from `lg:hidden` |
| `6f378e7` | Add `'system'` theme option with `prefers-color-scheme` resolution in App.tsx |
| `c3d7fd2` | Zustand persist `version:1` + `migrate` — backfills `theme:'dark'` for returning users |
| `902c56e` | Fix migration tests to call real `migrate` via `persist.rehydrate()`; narrow type cast |
| `d3907f1` | Tooltip: `bg-popover`/`text-popover-foreground` + `pointer-events-none` (contrast + capture); `TripPanel` replace `SheetHeader`/`SheetTitle` with plain `<h2>` (fixes `DialogTitle` crash on desktop inline render); `max-w-5xl` → `max-w-screen-2xl` everywhere; leave bar `text-xs` → `text-sm` |
| `06738a4` | Mobile UX: `LocationPicker` → shadcn `Select` (no OS full-screen picker); `TripDrawer` flex-col shell with scrollable inner div; `SettingsDialog` `onOpenAutoFocus` prevent (theme select auto-activating) |
| `f860c42` | `LocationsPage` mobile master-detail (show list OR detail, not stacked); `crypto.randomUUID` polyfill via `src/lib/uuid.ts` for HTTP non-secure contexts |
| `07c0d95` | Sheet variants: remove `h-full` from right/left, rely on `inset-y-0` (top:0;bottom:0) for iOS Safari |
| `b9497ee` | `TripDrawer` SheetContent: add `h-[100svh]` for explicit iOS Safari viewport cap |

### Outstanding Issue (in progress)
- **`TripDrawer` still scrollable on iPhone** — sheet panel extends beyond viewport on mobile Safari. `h-[100svh]` + `overflow-hidden` + `flex-1 overflow-y-auto` inner div pushed but not yet confirmed fixed. Chrome browser debugging was in progress (matchMedia patched for mobile emulation) when context ran low.
- **Next debugging step:** Use Chrome DevTools device emulation (Ctrl+Shift+M) on `http://localhost:5173`, click two dates to open the Sheet, inspect the `[data-state=open]` SheetContent element's computed `height`, `overflow`, and whether the inner `flex-1` div is constrained. Check if `100svh` resolves correctly.

## Current git HEAD

```
b9497ee fix: h-[100svh] on Sheet panel for iOS Safari viewport constraint
07c0d95 fix: sheet panel height on iOS Safari — drop h-full, rely on inset-y-0
f860c42 fix: locations master-detail on mobile, crypto.randomUUID polyfill for HTTP
06738a4 fix: mobile UX — Radix location picker, sheet scroll, settings autofocus
d3907f1 fix: tooltip contrast/capture, DialogTitle crash, wider layout, larger leave bar text
902c56e test(store): exercise real migrate via persist.rehydrate(); narrow migrate type cast
c3d7fd2 fix: add persist version/migrate to backfill theme:dark for returning users
6f378e7 feat: add 'system' theme option with prefers-color-scheme resolution
4eb06e5 fix: gate desktop/mobile rendering with JS to prevent Sheet portal leak on desktop
457d657 feat: segmented leave breakdown in the trip drawer
```

## Test Suite State

`bun run test` → 83/83 passing across 23 test files
