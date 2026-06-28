# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, etc.) working in this repository.
`CLAUDE.md` points here — keep all agent guidance in this one file.

## What this project is

DivePlanner is a **client-side-only** React web app for planning SEA scuba diving trips
around public holidays and annual leave. No backend, no accounts — all state lives in
the browser (localStorage) and plans are shared via compressed URLs.

Read these before doing design or implementation work:

- **Design spec:** `docs/superpowers/specs/2026-06-28-diveplanner-design.md` — the source of
  truth for data model, routes, views, and calculation logic. Keep it in sync with the code.
- **Product brief:** `docs/prompt.md` — the original goals and user flow.

## Status

Design phase — no application code exists yet. The first implementation step is to
scaffold the Bun + Vite + React + TypeScript app per the spec.

## Tech stack (decided)

- **Bun** as package manager and script runner (`bun install`, `bun run …`).
- **React 18 + TypeScript + Vite** (stock Vite; do not adopt Rolldown yet).
- **Zustand** with the `persist` middleware → localStorage for app state.
- **Shadcn/ui + Tailwind CSS** for UI.
- **date-fns** for all date math.
- **lz-string** (`compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`) for share URLs — never plain base64 (`+` / `/` aren't URL-safe).
- **Nager.Date** public API for holidays, fetched client-side and session-cached.
- Deployed as a static SPA on Vercel.

## Conventions

- Prefer Bun for everything (`bun add`, `bun run dev/build/test`); don't introduce npm/pnpm/yarn lockfiles.
- TypeScript strict mode; model types follow the interfaces in the design spec.
- Keep modules small and single-purpose with clear interfaces (calendar, leave calc, dive
  calc, share encode/decode, location data, store).
- Match existing file patterns and the spec's naming before inventing new ones.
- When you change behaviour described in the spec, update the spec in the same change.

## Workflow

This repo uses the Superpowers workflow: **brainstorm → spec → plan → implement**.
Specs live in `docs/superpowers/specs/`. Don't jump to implementation without an
approved spec and plan.

## Key invariants (from the spec)

- Trip date ranges **must not overlap** each other.
- Leave is tracked **per calendar year**; a trip crossing Dec 31 splits its leave days
  between the two years.
- Dive-site seasonality is **month-only** (12 ratings per site), stable across years.
- `non-dive` trips carry no booking checklist and contribute 0 estimated dives.
