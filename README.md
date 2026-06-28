# DivePlanner

A client-side-only web app for planning scuba diving trips around Southeast Asia.

DivePlanner helps you find good dive windows that line up with public holidays, track how much annual leave each trip costs, manage a trip from wishlist to confirmed, and share a plan with friends via a compressed URL — all with no backend and no account.

## Why

Planning dive trips means juggling three calendars at once: when each site actually dives well (visibility, monsoon, currents), when your country's public holidays fall, and how much annual leave you have left. DivePlanner overlays all three so you can book early — while flights are cheap — and see at a glance how many leave days and dives a trip is worth.

## Features

- **Rolling 12-month calendar planner** with public-holiday badges (country-aware, default Singapore).
- **Per-year leave tracking** — set your annual allowance and carryover; see remaining balance for each year the window spans.
- **Dive-site seasonality** — a month-by-month "good / fair / poor / closed" map for ~15 SEA sites (Tioman, Malapascua, Raja Ampat, Sipadan, Komodo, and more), with difficulty and highlights (what you'll see).
- **Trip lifecycle** — wishlist → planned → confirmed, with a per-trip booking checklist (dive shop, flights, transfers, accommodation).
- **Non-dive leave blocks** — mark unrelated holidays so your dive-available leave balance stays honest.
- **Estimated dives** per trip, auto-calculated and overridable.
- **Share by URL** — your whole plan is compressed into a link; no server involved.

## Status

🚧 **Design phase.** The full design spec lives at
[`docs/superpowers/specs/2026-06-28-diveplanner-design.md`](docs/superpowers/specs/2026-06-28-diveplanner-design.md).
The original product brief is at [`docs/prompt.md`](docs/prompt.md). Implementation has not started yet.

## Tech Stack

- **Bun** — package manager + script runner
- **React 18 + TypeScript + Vite**
- **Zustand** (with `persist`) for state → localStorage
- **Shadcn/ui + Tailwind CSS**
- **date-fns** for date math
- **lz-string** for URL-safe plan sharing
- **Nager.Date** public API for holiday data
- Deployed as a static SPA on **Vercel**

## Development

> Requires [Bun](https://bun.sh). Commands below will work once implementation begins.

```sh
bun install      # install dependencies
bun run dev      # start the Vite dev server
bun run build    # produce a static build in dist/
bun run preview  # preview the production build locally
```

## Contributing

Dive-site data (seasonality, highlights, difficulty) is bundled in the app. If you add or correct a location through the UI, use **Export my overrides** to download a JSON file matching the bundled format, then open a PR.

## License

[MIT](LICENSE) © 2026 Christopher Goh
