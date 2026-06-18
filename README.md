# ArbitrageRadar 📡

A cross-platform **product trend intelligence supercenter**. ArbitrageRadar
ingests social and marketplace demand signals, computes the mathematical
**velocity** (first derivative) and **acceleration** (second derivative) of each
trend, and surfaces breakout dropshipping products in a premium dark-mode
dashboard — before they saturate.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![TS](https://img.shields.io/badge/TypeScript-strict-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8) ![Recharts](https://img.shields.io/badge/Recharts-2-8b5cf6)

## ✨ Features

- **Δv / Δ²v analytics** — pure, unit-testable numerical engine in
  [`src/lib/derivatives.ts`](src/lib/derivatives.ts).
- **Momentum Score** — an acceleration-weighted 0–100 index that ranks
  *breakouts* above already-saturated bestsellers.
- **Cyberpunk Boutique UI** — deep slate canvas, hairline borders, emerald
  (acceleration) and violet (velocity) neon accents.
- **Live filtering & sorting** — platform tabs, free-text search, and sort by
  volume / velocity / acceleration / momentum.
- **Sparkline cards** — 7-day volume vector, signed metric badges with
  directional arrows, and a one-click **Deploy Funnel** action.
- **Fully responsive** down to small mobile viewports.
- **Zero secrets required** — ships with a realistic 15-product seeding engine.

## 🧮 The math

| Metric | Formula | Meaning |
| --- | --- | --- |
| Velocity (Δv) | `(Vₜ − Vₜ₋₁) / Δt` | How fast demand is changing now |
| Acceleration (Δ²v) | `(velocityₜ − velocityₜ₋₁) / Δt` | Whether growth is speeding up |
| Momentum Score | weighted, logistic-normalized blend (acceleration ×0.5, velocity ×0.3, log-volume ×0.2) | Breakout potential, 0–100 |

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

## 🔌 Live data (real Google Trends)

The app ships with a **working live integration** against the
[SerpApi Google Trends API](https://serpapi.com/google-trends-api). Google
Trends is used because it returns a real *time series* (interest over time),
which is exactly what the velocity / acceleration engine consumes — most
product APIs (Amazon, TikTok) only return a current snapshot.

**Turn it on:**

1. Grab a key at <https://serpapi.com/manage-api-key> (free tier = 100
   searches/month).
2. Add it to the environment:
   - Local: copy `.env.example` to `.env.local` and set `SERPAPI_KEY=...`
   - Vercel: Project → Settings → Environment Variables → `SERPAPI_KEY`
3. Restart / redeploy. The header badge flips from **DEMO DATA** to
   **LIVE · Google Trends**, and each card's 7-day vector is the real
   interest-over-time for that product's primary keyword.

**How it works (no key required to run):**

| File | Role |
| --- | --- |
| [`src/lib/providers/serpapiGoogleTrends.ts`](src/lib/providers/serpapiGoogleTrends.ts) | Real HTTP call to SerpApi + response mapping |
| [`src/lib/ingest.ts`](src/lib/ingest.ts) | Picks live vs. seed; per-item fallback |
| [`src/lib/mockData.ts`](src/lib/mockData.ts) | Curated product catalog + offline series |

When `SERPAPI_KEY` is **unset** (or every live fetch fails), the app
automatically serves the curated demo dataset so it never breaks. The API
response reports provenance honestly in `meta.dataSource`
(`"live-google-trends"` or `"seed"`) and `meta.liveItemCount`.

> **Note on units & quota.** In live mode `volume` is Google Trends *search
> interest* (a 0–100 relative index), not raw sales — a legitimate real demand
> signal that the derivative math handles unchanged. Live requests are one
> SerpApi search per product and are cached for 6h (tunable in the provider) to
> conserve the free-tier quota.

### Other providers (Amazon / TikTok)

Real Amazon (Bright Data, Rainforest API) and TikTok endpoints return a
*current snapshot*, not history — so computing velocity from them requires
storing daily snapshots yourself (a database + a daily cron) and accumulating a
window. To add one, write a sibling module under `src/lib/providers/` that
returns `HistoricalDataPoint[]` and call it from `src/lib/ingest.ts`.

## 🗂 Project structure

```
src/
├─ app/
│  ├─ api/trends/route.ts   # GET handler: enrich + filter + sort
│  ├─ globals.css           # design tokens (cyberpunk dark theme)
│  ├─ layout.tsx            # root layout
│  └─ page.tsx              # dashboard (client)
├─ components/
│  ├─ dashboard/            # StatsBar, FilterPanel, ProductCard, Sparkline
│  └─ ui/                   # shadcn/ui primitives
├─ lib/
│  ├─ providers/
│  │  └─ serpapiGoogleTrends.ts  # LIVE Google Trends provider (SerpApi)
│  ├─ derivatives.ts        # velocity / acceleration / momentum
│  ├─ ingest.ts             # live-vs-seed orchestrator
│  ├─ mockData.ts           # curated catalog + offline series
│  └─ utils.ts              # cn() + formatters
└─ types/
   └─ trends.ts             # strict domain interfaces
```

## ▲ Deploy to Vercel

Push to GitHub and import the repo in Vercel — the defaults work out of the box
(no env vars required for the demo dataset).

## 📡 API

```
GET /api/trends?platform=tiktok&sort=acceleration&order=desc&q=magnetic
```

Returns `{ data: EnrichedTrendItem[], meta: {...} }`.
