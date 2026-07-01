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

### Resolved: `TripDrawer` scrollable-on-iPhone issue (2026-07-01)
Root-caused via a real 390×844 viewport (embedded same-origin iframe trick, since window resize/device-toolbar emulation wasn't controllable from this session):
- **Real bug found:** `BookingChecklist.tsx`'s label `<input className="flex-1 ...">` had no `min-w-0`, so it couldn't shrink below its intrinsic width in the flex row — it overflowed the sheet by ~48px, producing a horizontal scrollbar. This was reproducible in plain Chrome, not iOS-specific. Fixed by adding `min-w-0`.
- **Secondary gap found:** `document.scrollingElement` is `<html>` in standards mode, but Radix's scroll lock only touches `<body>` — so the page behind the sheet could still be dragged. Added `useLockHtmlScroll` in `TripDrawer.tsx` (toggles `document.documentElement.style.overflow` while open) plus `overscroll-contain` on the inner scroll div as iOS rubber-band hardening.
- User confirmed on-device: "on mobile the scroll is fixed."

### Other fixes/changes this session (2026-07-01, uncommitted — not yet asked to commit)
- **Split-pane planner layout:** `PlannerPage` desktop view is now a static 60/40 split (was a conditional width that caused a layout shift when the trip panel opened). Right pane now always renders — shows `TripsOverview` (all trips, sorted, click-to-edit) when nothing is selected, `TripPanel` otherwise. Spec updated in `docs/superpowers/specs/2026-06-28-ui-v2-design.md` §1.5.
- **Light-mode calendar/UI colour bug:** root cause was `tailwind.config.ts` mapping colours straight to hex-valued CSS vars (`var(--fun-dive)` etc.) — Tailwind silently emits no CSS for any `/NN` opacity modifier on such colours (`bg-fun-dive/80`, `bg-non-dive/60`, `bg-line/60`, `bg-primary/15`, badges, buttons, Nav, LocationsPage all affected), so those elements rendered fully transparent and only `text-white` showed — invisible on a light background. Fixed by converting all tokens in `src/index.css` to space-separated RGB triples and wrapping the Tailwind color mapping in `rgb(var(--x) / <alpha-value>)`.
  - Note: required a dev-server restart — Vite/PostCSS had a stale `@apply` cache for `body` after the config edit; also found and deleted a stale gitignored `vite.config.js`/`vite.config.d.ts` build artifact that was shadowing `vite.config.ts`.
- **Shared-link theme bug:** `/share/:hash` is a sibling route to `<App>` in `main.tsx`, not a child, so `App`'s theme-sync effect never ran there — shared links always ignored the viewer's theme/system preference. Extracted the effect into `src/hooks/useSyncTheme.ts`, called from both `App.tsx` and `SharePage.tsx`.
- **Sheet border:** removed the `border-l`/`border-r`/`border-t`/`border-b` from all `sheetVariants` sides in `src/components/ui/sheet.tsx` per user request (was only ever visible on one edge by design, user preferred no border — `shadow-lg` still provides separation).
- **Settings leave-days input:** `SettingsDialog.tsx`'s per-year leave input was a controlled `<input type="number">` bound straight to the numeric store value, so it could never pass through an empty state while editing (backspacing "25" got stuck re-snapping to "0"). Added local `leaveDrafts` string state per year; store only commits on valid parse, field clears properly on blur.
- **Dev server LAN access:** `vite.config.ts` now sets `server: { host: true }` so `bun run dev` also binds `0.0.0.0` (prints LAN URLs) for testing from a phone.

### Done: per-day leave exclusion (2026-07-01, uncommitted)
User wants to exclude specific weekdays within a trip from leave-day tabulation (e.g. flying out after work on a Friday — that day shouldn't consume a leave day). Initial design (split every leave day into its own row) was rejected by the user — they want multi-day leave blocks to stay collapsed into one row by default (e.g. "Mon–Fri: 5 days leave" as a single checkbox), only expanding to per-day checkboxes on demand. Implemented:
- `Trip.excludedLeaveDates?: ISODate[]` (types.ts).
- `lib/leave.ts`: `leaveDays`/`leaveDaysInRange`/`leaveDaysByYear` take an optional `excluded: Set<ISODate>`; `leaveUsedByYear` reads it from each trip. New tests added, all passing (85/85 total).
- `src/components/LeaveBreakdown.tsx` (new): renders each leave segment as one row with a checkbox (toggles the whole block) plus a `▸`/`▾` expand affordance for multi-day blocks that reveals one checkbox per individual date. Weekend/holiday segments unchanged (no checkbox).
- `TripPanel.tsx`: added `excludedLeaveDates` state (seeded from `trip.excludedLeaveDates` on edit, `[]` on create), `totalLeave` now subtracts excluded days, `save()` prunes stale excluded dates that fall outside the current range before persisting.
- Verified in-browser end-to-end: Fri 21 Aug – Fri 28 Aug trip → unchecking "Fri 21 Aug" drops total from 6→5 days leave live; expanding "Mon 24 – Fri 28 Aug" reveals 5 individually-checkable day rows.
- Spec updated: `docs/superpowers/specs/2026-06-28-ui-v2-design.md` §4.5 (new).

### Booking checklist categories expanded (2026-07-01, uncommitted)
Added `'insurance'` and `'equipment'` to `BookingCategory` (`types.ts`) and `CATEGORIES`/`PLACEHOLDERS` in `BookingChecklist.tsx` — placeholders: `insurance` → "e.g. DAN dive travel insurance", `equipment` → "e.g. Prescription dive mask". Changed `other`'s placeholder from "e.g. Dive travel insurance" (now redundant with the new `insurance` category) to "e.g. Private dive guide". No other files reference `BookingCategory`, so no migration needed for existing saved trips (old categories are still valid members of the union).

### Post-font-bump mobile fixes (2026-07-01, uncommitted)
The text-size bump above surfaced real layout regressions on an actual iPhone (17 Pro, latest Safari) that Chrome's own `input[type=date]` rendering doesn't reproduce:
- **`input[type="date"]` protruding past its container** — confirmed on-device this was NOT fixed by `width/box-sizing/max-width` alone (verified via a first attempt that only Chrome-tested clean, since Chrome's date input already respects width). Root cause: iOS Safari draws these with native chrome sized from internal content, which CSS box-model properties on the element don't constrain. Fix (confirmed working on-device): `-webkit-appearance: none` on `input[type=date/time/datetime-local]` in `index.css` — this is what actually stops Safari from doing its own native intrinsic-width layout; the box-sizing/width rules are kept alongside it. This became visible specifically because the recent font-size bump grew the rendered date string past whatever margin previously existed.
- **Booking checklist**: free-text placeholder is now per-category (`e.g. Eco-diver Scuba` for dive-shop, distinct examples for flight/transfer/accommodation/other) via a `PLACEHOLDERS` map in `BookingChecklist.tsx`; increased vertical spacing (`space-y-3` outer, `py-1`/`space-y-1.5` per item) since the two-row layout felt cramped.
- **Start/End weekday hint simplified**: was showing the full date redundantly ("Sunday, 26 Jul 2026") next to a native date input that already shows the full date — changed `lib/dates.ts`'s helper (renamed `formatWithWeekday`→`formatWeekday`) to return just the weekday name ("Sunday").
- Verified: 86/86 tests, clean `tsc --noEmit`, clean `bun run build`, and **confirmed by user on real iPhone 17 Pro / iOS Safari** — the date-input fix actually resolved it on-device (first CSS-only attempt didn't; the appearance-reset did).

### Typography pass (2026-07-01, uncommitted)
- **iOS zoom-on-input-focus fixed** — iOS Safari auto-zooms whenever a focused field's computed font-size is under 16px; our fields used `text-sm` (14px). Added a `max-width: 639px { input, select, textarea { font-size: 16px !important } }` rule in `index.css` (needs `!important` — a plain element selector loses to Tailwind's `.text-sm` class on specificity regardless of source order).
- **Global text-size bump (both desktop and mobile)** — per user feedback that text felt small overall (e.g. the "Dive conditions" block). Mechanically bumped every Tailwind text-size utility one step up (`text-xs`→`text-sm`, `text-sm`→`text-base`, `text-lg`→`text-xl`, `text-2xl`→`text-3xl`, `MonthGrid`'s `text-[0.7rem]` weekday header →`text-xs`) across all 26 files that used them, via a placeholder-swap sed pass (to avoid double-bumping former `text-xs` items when the `text-sm`→`text-base` substitution ran). `components/ui/input.tsx`/`textarea.tsx` handled separately since they already encoded the shadcn `text-base md:text-sm` mobile/desktop split — bumped to `text-lg md:text-base`. This also incidentally satisfies the iOS zoom fix for every hand-rolled form field (now `text-base`/16px baseline), independent of the media-query safety net above.
- Verified: 85/85 tests, clean `tsc --noEmit`, clean `bun run build`, and visually on both desktop and the 390×844 mobile viewport — no overflow anywhere, compact calendar grid still holds up.

### More follow-up fixes this session (2026-07-01, uncommitted)
- **Calendar now Sunday-first** — `MonthGrid.tsx`: `WEEKDAYS` reordered, `firstDow` uses `date-fns getDay()` directly (0 = Sunday) instead of the `+6 % 7` Monday-first shift. Purely presentational; `lib/leave.ts`/`lib/dates.ts` weekday logic is unaffected (uses date-fns `isWeekend`, independent of display order).
- **`LeaveBreakdown` tap targets & alignment** — checkboxes were small/cramped and weekend/holiday rows weren't left-aligned with the checkbox rows. Added a fixed-width `LEADING_SLOT` (`h-4 w-4`) used both by real checkboxes and as an invisible spacer on non-checkable rows so all row text starts at the same left edge; added `py-1.5`/`py-1` vertical padding per row (bigger tap target + breathing room) and `space-y-0.5` between rows.
- **Recurring `vite.config.js` shadow bug fixed at the root** — `tsconfig.node.json` had `composite: true` with no output isolation, so every `bun run build` (`tsc -b`) regenerated a stale `vite.config.js`/`.d.ts` next to `vite.config.ts`, and Vite's config loader silently prefers the `.js` — reverting any `.ts`-only setting (e.g. the LAN `host: true`) after every build. Fixed by adding `outDir`/`declarationDir: "./node_modules/.tmp/tsconfig.node"` to `tsconfig.node.json` (composite projects must emit *something*, so `noEmit` isn't an option — redirecting the output is). Confirmed `bun run build` no longer touches `vite.config.js`.

### Other follow-up fixes this session (2026-07-01, uncommitted)
- **Sheet border removed** (`src/components/ui/sheet.tsx`) — was only ever visible on one edge by design (`border-l`/`border-r` on the side facing the overlay); user found it looked like a glitch and preferred no border. `shadow-lg` still separates the sheet from the page.
- **Settings leave-days input fixed** (`SettingsDialog.tsx`) — was a controlled `<input type="number">` bound straight to the numeric store value, so it couldn't pass through an empty state while editing (backspacing "25" re-snapped to "0", forcing an awkward "25→210→10" workaround). Added local per-year draft string state; store commits only on valid parse, clears on blur.

**Note:** all "uncommitted" sections above (split-pane layout, light-mode colour bug, shared-link theme bug, settings leave-days input, per-day leave exclusion, booking checklist categories, post-font-bump mobile fixes, typography pass, Sunday-first calendar, `vite.config.js` shadow bug, sheet border) landed in `1a6aae9` — "fix: mobile/iOS UX pass, split-pane layout, leave exclusion, typography bump".

## Session: 2026-07-02 — shadcn cleanup + dialog/select fixes (committed)

- `d70639f` — fix: theme-aware selects, searchable country picker, rounded dialog on mobile
  - `DialogContent` (`src/components/ui/dialog.tsx`): rounds on all breakpoints (was `sm:` and up only), border replaced with an all-sides black shadow (`shadow-[0_0_40px_rgba(0,0,0,0.5)]`), matching the border-removal already applied to `Sheet`.
  - `LocationsPage.tsx` country/level filters: native `<select>` → shadcn `Select` (native selects only follow OS `color-scheme`, not the app's manual dark/light toggle — they stayed dark after switching to light mode).
  - `SettingsDialog.tsx` country field: replaced the 6-country hardcoded `<select>` with a searchable Popover+Command combobox over the full ISO 3166-1 country list (`src/data/countries.ts`, names via `Intl.DisplayNames`). SEA dive countries (Singapore, Malaysia, Philippines, Indonesia, Thailand) pinned at the top, Singapore first; everything else alphabetical. Fixes "can't add Latvia" and case-insensitive substring search.
- `f61c7ad` — refactor: migrate remaining native form elements to shadcn components
  - Audit (via subagent) found more raw `<select>`/`<input type=checkbox>`/`<input>`/`<textarea>` across `BookingChecklist`, `LeaveBreakdown`, `AddLocationDialog`, `SettingsDialog`, `TripPanel`, `LocationPicker`. All migrated to shadcn `Select`/`Checkbox`/`Input`/`Textarea`.
  - `LeaveBreakdown`'s indeterminate-checkbox logic simplified from a manual `ref` + `useEffect` hack to Radix's native `checked="indeterminate"` state.
  - Verified in-browser in both light and dark mode; visual classes (`border-line`/`bg-surface-elevated`) preserved via `className` overrides — no visual change, component-form only.
- `f276386` — docs: add design spec for calendar click-through, nav logo, notes contrast, share trip detail (spec written, not yet implemented — see below).

## Session: 2026-07-02 (cont'd) — calendar/nav/share fixes plan (SDD, all 6 tasks committed)

Plan: `docs/superpowers/plans/2026-07-02-calendar-nav-share-fixes.md`. Executed via `superpowers:subagent-driven-development` — fresh implementer + reviewer subagent per task, then a final whole-branch review. Ledger: `.superpowers/sdd/progress.md`.

- Task 1 `6f7f42c` — fix: clicking a trip's date cells in the calendar opens the trip (`DayCell`/`MonthGrid`). Review clean.
- `726d401` — fix: add vertical gap between stacked `DialogFooter` buttons on mobile (ad hoc bug report mid-session, not part of the plan — the "Make this mine" Overwrite/Cancel buttons had 0 margin when stacked on mobile).
- Task 2 `1e36bae` — fix: link the DivePlanner nav logo to the planner page. Review clean (necessary deviation: narrowed an existing test's `/planner/i` regex to exact `'Planner'` match, since it became ambiguous once "DivePlanner" was also a link).
- Task 3 `67e559a` — fix: hardcoded `bg-white` on location note box → `bg-surface-elevated`. Review clean.
- Task 4 `ccf170e` — fix: trip blocks stay clickable on read-only calendars (`TripBlock`'s `readOnly` disable removed — it never mutated state, so disabling only blocked the click). Review clean.
- Task 5 `6028b7d` — feat: add read-only `TripDetailDialog` component (dates, location, type/status, booking checklist, notes; no leave/holiday breakdown — needs live per-country holiday data not in the share payload). Review clean (minor, plan-mandated: no `DialogDescription`, addressed below).
- Task 6 `14372aa` — feat: wire `TripDetailDialog` into `SharePage` — clicking a trip on `/share/:hash` opens the dialog, location names resolved via `mergeLocations(shared.siteOverrides)` (the *shared plan's* overrides, not the viewer's local store). Review clean.
- Final whole-branch review (opus): **Ready to merge: Yes**, 0 Critical/Important issues. 3 minor recommendations — 2 applied in follow-up commit `06a91cd` (cursor-pointer on now-clickable covered day cells; `sr-only` `DialogDescription` on `TripDetailDialog` to silence Radix's a11y warning). Left as-is: `isoInFirstMonth()` test helper duplicated across `CalendarView.test.tsx`/`SharePage.test.tsx` — reviewer's own call not worth the churn.
- Pushed to `origin/main` through `ccf170e` (mid-session); remaining commits pending push.

## Session: 2026-07-02 (cont'd) — planner page UI polish spec (design approved, not yet planned)

Four more UI polish items from user feedback, brainstormed and written up as a design spec:

1. Desktop calendar range-selection opens the "New trip" panel with no dismiss control (`TripPanel` embedded inline has zero close chrome — mobile's `TripDrawer` Sheet already handles X/click-outside/Escape correctly). Fix: `showClose` prop on `TripPanel` adds an X button + Escape handling, passed from `PlannerPage`'s desktop aside only.
2. Mobile has no access to the "Planned trips" view at all (desktop-only today). Fix: shadcn `Tabs` ("Planner" / "Trips") below the sticky leave bar on mobile, swapping the calendar for `TripsOverview` + new stats strip.
3. Desktop trip rows show only date + location. Fix: append dive count and leave-days-used as plain text on the existing subtitle line (`lg:`-only), reusing `lib/dives.ts`/`lib/leave.ts` helpers already used by `TripPanel`.
4. No aggregated stats. Fix: new `TripStats` component (shadcn `Card`, needs `bunx --bun shadcn@latest add card`) above `TripsOverview` on both desktop and mobile's Trips tab — order: trips planned → dives planned → days until next trip → dives done (only if > 0).

**Spec:** `docs/superpowers/specs/2026-07-02-planner-ui-polish-design.md` — approved by user.

**Plan:** `docs/superpowers/plans/2026-07-02-planner-ui-polish-implementation.md` — written via `superpowers:writing-plans` (2026-07-02). 4 tasks, in dependency order:
1. Dismissible desktop trip panel (`TripPanel` gains `showClose` prop — X button + Escape)
2. Richer desktop trip rows (`TripsOverview` subtitle gains dive count + leave days, `lg:` only)
3. Aggregated stats strip — new `TripStats` component (needs `bunx --bun shadcn@latest add card`, not yet installed)
4. Wire `TripStats` into both call sites + add mobile Planner/Trips `Tabs` to `PlannerPage`

**Known plan deviation (already baked into the plan, not yet applied to code):** spec's `TripStats` props include `holidays`, but none of the 4 stats need it and this repo's `noUnusedParameters: true` would error on an unused prop — plan drops `holidays`, keeping just `{ trips: Trip[] }`, and updates the design spec doc in Task 3's commit.

Baseline confirmed before plan execution: `bun run test` → 96/96 passing, 24 test files (matches tracker). Plan's cumulative expected counts: 101 (after Task 1) → 104 (Task 2) → 109 (Task 3) → 110 (Task 4).

**Executed via `superpowers:subagent-driven-development`** (2026-07-02) — fresh implementer + reviewer subagent per task, then a final whole-branch review. Ledger: `.superpowers/sdd/progress.md`.

- Task 1 `a01f89c` — feat: dismissible close button + Escape handling on desktop trip panel. Review clean.
- Task 2 `a6eb51a` — feat: dive count + leave days on desktop trip rows (`lg:` only). Review clean.
- Task 3 `6cbfad4` — feat: add `TripStats` component + shadcn `Card`. Review clean.
- Task 4 `084ecc9` — feat: wire `TripStats` into both call sites, add mobile Planner/Trips `Tabs`. Review clean (one accepted deviation: `PlannerPage.test.tsx`'s final assertion needed `{ hidden: true }` on a `getByRole('tab', ...)` query, since Radix's modal `Dialog` sets `aria-hidden` on the rest of the page while the trip-editing Sheet is open — confirmed real Radix behavior via `node_modules` inspection, not a masked defect).
- Final whole-branch review (opus): **Ready to merge: Yes**, 0 Critical/Important. 2 Minor: (a) dive-count-resolution logic duplicated across `TripsOverview`/`TripStats`/`TripPanel` — left as-is, cosmetic; (b) `TripPanel`'s Escape handler could close the whole panel through a nested-open Select — confirmed as a real, reproducible bug via in-browser testing (open "New trip" → open Trip type select → Escape closed both at once) and fixed in `dece7d0` (skip the window-level handler when `e.defaultPrevented`, since Radix's `DismissableLayer` calls `preventDefault()` on its own capture-phase Escape handling).

**Five follow-up fixes from live user feedback on the rendered UI** (not part of the original plan, applied directly — same pattern as prior sessions' ad hoc fixes):
- `c64fb7e` — `TripStats` reworked from a shadcn-`Card` grid (left an empty gap below 4 stats, boxy borders) to a single flex row with `divide-x` separators that always fills the width and splits evenly.
- `540dd55` — mobile Planner/Trips `Tabs` had **invisible inactive-tab text** in both themes: root cause was this repo's `--muted-foreground: var(--muted)` bridge in `index.css` (deliberate everywhere else, so hand-written `text-muted` and shadcn's `text-muted-foreground` read the same) colliding with the stock Tabs primitive's `bg-muted`+`text-muted-foreground` pairing on the same element — the two colors were provably identical (confirmed via `getComputedStyle`). Reworked to the app's own `Nav.tsx`-style palette; also fixed clipped trigger text (`h-9` was 4px too short for the `py-1.5`/`text-base` content once padding was accounted for).
- `c29d5fb` — dark-mode active/inactive tab contrast was still too low after the above (`bg-line/60` track and `bg-surface-elevated` active pill are deliberately close tones in this app's dark palette). Switched the track to a transparent `border-line` outline so the active pill contrasts against the page background instead, matching how every other elevated-panel-on-page pairing in the app already reads.
- `0f9f966` — reworded the empty "Planned trips" state copy (was stale placeholder text predating the dedicated Planner/Trips views).
- `dece7d0` — the Escape-propagation fix described above.

All verified via `bun run test` (110/110), `tsc --noEmit`, `bun run build`, and live in-browser testing (Chrome via `claude-in-chrome`) for every visual change, including `getComputedStyle` color checks in both light and dark mode for the Tabs contrast fixes.

## Current git HEAD

```
dece7d0 fix: Escape no longer closes the whole trip panel when a nested popover is open
0f9f966 fix: warmer copy for the empty planned-trips state
c29d5fb fix: increase dark-mode contrast between active and inactive Tabs
540dd55 fix: mobile Planner/Trips tabs had invisible inactive-tab text and clipped triggers
c64fb7e fix: TripStats uses an even-split divider row instead of bordered cards
084ecc9 feat: add mobile Planner/Trips tabs and wire TripStats into both views
6cbfad4 feat: add aggregated TripStats component
a6eb51a feat: show dive count and leave days on desktop trip rows
a01f89c feat: add dismissible close button + Escape handling to desktop trip panel
934cc35 chore: update TRACKER.md — planner UI polish spec approved, next step is planning
```

## Test Suite State

`bun run test` → 110/110 passing across 27 test files
