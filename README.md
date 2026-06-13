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

## 🔌 Going live (real data)

The app reads everything through a single ingestion function:
[`fetchRawTrends()`](src/lib/mockData.ts). Replace its mock body with real
`fetch()` calls to your providers (Netrows, Bright Data Amazon SERP, TikTok
Creative Center) and map each payload into the `TrendItem` interface — inline
examples are provided in that file. Nothing else in the codebase changes.

Set provider tokens as environment variables (e.g. on Vercel):

```
NETROWS_API_KEY=...
BRIGHTDATA_API_KEY=...
TIKTOK_CC_TOKEN=...
```

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
│  ├─ derivatives.ts        # velocity / acceleration / momentum
│  ├─ mockData.ts           # data seeding engine
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
