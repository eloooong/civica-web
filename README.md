# Civica

Philippine government data, made easier to understand. Explore national
budgets, legislation, and government datasets — with unified search across
all three.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4, Lucide icons, Bklit UI charts (visx-based) + KPI blocks
- No database, no auth, no env vars — all data comes from public read-only APIs

## Public data sources (attributed in-app)

| Section | Source | Base URL |
|---|---|---|
| Budget | BetterGov.PH Budget API (GAA FY2020–2026) | `https://budget.bettergov.ph/api/v1` |
| Budget hearings | BetterGov.PH Budget API (House Committee on Appropriations, FY2027) | `https://budget.bettergov.ph/api/v1` |
| Congress | Open Congress API (bills, legislators) | `https://open-congress-api.bettergov.ph/api` |
| Data | Open Data Portal (dataset catalog) | `https://data.bettergov.ph/api/v1` |

API clients live in `lib/api/` (one module per source, uniqueness enforced by a
single base-URL constant each). UI components never fetch directly.
API response bodies and their actual retrieval timestamps are cached together
(`revalidate: 3600`). They become eligible for refresh on a later request after
one hour. Failed refreshes can leave older responses visible, with their original
timestamps. Retrieval times use Philippine time and are separate from source
publication dates. Sources without a recorded timestamp explicitly say it is
unavailable. The homepage shows “Unavailable” when no national budget figure
can be retrieved; it does not substitute an illustrative amount.

## Getting started

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # eslint
npx tsc --noEmit # typecheck
npm run build
npm start        # serve the production build
```

## Project structure

```text
app/
  page.tsx                 homepage (hero, explore cards, popular searches)
  search/                  unified search (budget + congress + data)
  budget/                  GAA explorer
  budget/compare/          two departments side by side (?a=&b=&year=)
  budget/hearings/         House budget hearing index
  budget/hearings/[id]/    topic records, plus timeline/ and transcript/ sub-routes
  budget/[id]/             department detail
  congress/ bills/[id]/ people/[id]/   bill explorer + bill + legislator pages
  data/    data/[id]/      dataset catalog + dataset detail
  sitemap.ts  robots.ts    SEO
components/
  layout/  ui/  search/  budget/  congress/  data/
lib/
  api/        per-source clients (budget, congress, datasets)
  search/     unified search (normalize → rank → sections)
  utils.ts  congress.ts  datasets.ts  placeholder.ts  (display helpers)
types/        per-source API shapes + normalized SearchResult
```

## Accessibility

Skip-to-content link, semantic landmarks/headings, labeled form controls,
visible focus states, keyboard-operable navigation and pagination, captioned
tables, screen-reader summaries for charts (chart SVGs are decorative),
AA-passing text contrast.

Motion runs unconditionally: the `prefers-reduced-motion` branches were
removed on purpose, so the OS-level setting has no effect here.

## Charts (Bklit UI)

Budget charts and KPI cards use [Bklit UI](https://bklit.com) components
(installed via the shadcn registry into `components/charts/` and
`components/blocks/`). Notes for maintainers:

- Bklit files are vendored upstream code — excluded from ESLint
  (see `eslint.config.mjs`). Review diffs on every registry update.
- The shadcn CLI wants to overwrite `lib/utils.ts` and
  `components/ui/Badge.tsx` — always refuse; our versions are API-compatible
  where Bklit needs them (`cn`) and intentionally different otherwise.
- One vendor import was fixed: `chart-loading-label.tsx` referenced a
  non-existent `../components/shimmering-text` path.
- `--chart-*` CSS variables in `app/globals.css` are mapped to the Civica
  brand palette (including a fix to the registry's `var(----chart-*)`
  typos in the `@theme inline` bridge).
- Bklit's line chart is time-series-only (axis labels render "Jan 1" style),
  so fiscal-year trends use categorical bar charts instead.
- Expense-class mix uses horizontal Bklit bars with a peso plus share
  tooltip and a full name legend; loading routes render `BarChartLoading`
  skeletons shaped like the real charts.
- Chart pairs share one minimum height per row and stretch through a full
  height flex shell, so a taller chart no longer leaves whitespace beside
  its neighbor. KPI cards (`StatCard`, `BudgetStatCard`) all stretch to
  equal height in shared grids.

## Budget hearings (FY2027)

`/budget/hearings` indexes every House Committee on Appropriations hearing on
the FY2027 proposed budget. Three notes for maintainers:

- `GET /hearings` reports `limit`, `offset`, and `returned` but **no
  whole-result total**, so the index fetches the season in one request
  (`listHearings`) and filters and paginates the array itself. If a future
  season outgrows one page, switch to offset pagination with a next link.
- `GET /hearings/{id}/topics?thread=0` returns every topic record for one
  hearing in a single call, which is what the detail page uses. The
  moment-by-moment thread is omitted there and served on demand by
  `/transcript?t=` instead.
- `GET /hearings/{id}/timeline` is about 250 KB for a seven hour hearing, so
  it has its own route under `[videoId]/timeline` and never loads on the
  detail page. Its sections render inside `<details>`, so a 39 section hearing
  stays scannable with no client state.

Every hearing record is machine-generated from the hearing audio. Speaker
names, figures, and summaries are best effort, so each page repeats the
source's own confidence note and every timestamp deep links to the video.

## Known limitations (honest by design)

- The Open Congress API publishes **no bill statuses or legislative stages**,
  so no progress timelines are shown — only source-provided facts.
- Hearing transcripts, topic records, and timelines are machine-generated, so
  speaker names and figures are as heard rather than as said. Every page that
  shows them carries the source's confidence note and timestamped video links.
- Unknown detail IDs render the correct not-found UI but return HTTP 200 when
  streamed (documented Next.js App Router behavior for segments with
  `loading.tsx`); truly unknown routes return 404.
- The Open Data Portal's `/categories` counts are stale (all zero), so
  category counts are derived from one cached full-catalog fetch.
- Dataset row previews are best-effort (small text files only); large files
  offer download links instead.
- Upstream data is manually/community encoded in places — every record links
  back to its source; verify before citing formally.

## Deployment

Standard Next.js deployment (e.g. Vercel: framework preset, `npm run build`,
no environment variables required). Any Node 20+ host works with
`npm run build` + `npm start`.
