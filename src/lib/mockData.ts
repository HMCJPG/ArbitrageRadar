/**
 * mockData.ts — Data Seeding Engine
 * -----------------------------------------------------------------------------
 * Third-party trend providers (TikTok Creative Center, Netrows social SERP,
 * Bright Data Amazon Best-Sellers) all sit behind premium API tokens. To keep
 * ArbitrageRadar fully runnable and deployable without secrets, this module
 * seeds a realistic dataset that mirrors the exact shape of those providers.
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  SWITCHING TO LIVE DATA                                                │
 *  │                                                                        │
 *  │  Every consumer calls `fetchRawTrends()`. To go live, replace the      │
 *  │  body of that function with real `fetch()` calls (examples are inline  │
 *  │  at the bottom of this file) and map each provider's payload into the  │
 *  │  `TrendItem` interface. Nothing else in the codebase has to change.    │
 *  └──────────────────────────────────────────────────────────────────────┘
 */

import type { HistoricalDataPoint, TrendItem } from "@/types/trends";

/* -------------------------------------------------------------------------- */
/*  Time-series helpers                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Build an ascending array of ISO timestamps for the last `count` days,
 * anchored to "now" so the dashboard always shows a fresh 7-day window.
 * `dayOffset` lets us pin everything to UTC midnight for clean daily buckets.
 */
function recentDailyTimestamps(count: number): string[] {
  const stamps: string[] = [];
  const now = new Date();
  const anchor = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = count - 1; i >= 0; i--) {
    stamps.push(new Date(anchor - i * dayMs).toISOString());
  }
  return stamps;
}

/** Zip a volume array with the matching trailing daily timestamps. */
function toSeries(volumes: number[]): HistoricalDataPoint[] {
  const timestamps = recentDailyTimestamps(volumes.length);
  return volumes.map((volume, i) => ({ timestamp: timestamps[i], volume }));
}

/* -------------------------------------------------------------------------- */
/*  Seed catalog                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Each entry encodes a distinct demand pattern so the analytics engine has
 * something meaningful to differentiate:
 *
 *   • exponential — accelerating breakout (high positive acceleration)
 *   • linear      — steady climb (high velocity, ~zero acceleration)
 *   • plateau     — rising then flattening (decaying velocity, negative accel)
 *   • declining   — saturated / fading (negative velocity)
 *   • volatile    — choppy, hype-cycle behavior
 */
interface SeedSpec {
  id: string;
  title: string;
  image: string;
  category: string;
  sourcePlatform: TrendItem["sourcePlatform"];
  pricePoint: number;
  keywords: string[];
  /** 7 daily demand values, oldest -> newest. */
  volumes: number[];
}

const SEED_SPECS: SeedSpec[] = [
  /* ---------------------------- Tech Gadgets ---------------------------- */
  {
    id: "tg-magsafe-car-mount",
    title: "MagSafe Magnetic Car Vent Mount",
    image: "🧲",
    category: "Tech Gadgets",
    sourcePlatform: "tiktok",
    pricePoint: 24.99,
    keywords: ["magsafe mount", "magnetic car mount", "phone holder"],
    // Exponential breakout — catching fire.
    volumes: [1850, 2600, 4100, 6900, 11800, 21400, 38800],
  },
  {
    id: "tg-ai-translator-buds",
    title: "AI Real-Time Translator Earbuds",
    image: "🎧",
    category: "Tech Gadgets",
    sourcePlatform: "instagram",
    pricePoint: 79.0,
    keywords: ["ai earbuds", "live translation", "travel tech"],
    // Steep exponential ramp.
    volumes: [3200, 4000, 5300, 7600, 11900, 19800, 34100],
  },
  {
    id: "tg-posture-clip",
    title: "Smart Posture Corrector Clip",
    image: "🧍",
    category: "Tech Gadgets",
    sourcePlatform: "amazon",
    pricePoint: 32.5,
    keywords: ["posture corrector", "back health", "wearable"],
    // Linear, steady climb.
    volumes: [5400, 9100, 12800, 16500, 20200, 23900, 27600],
  },
  {
    id: "tg-solar-powerbank",
    title: "50,000mAh Solar Fast-Charge Power Bank",
    image: "🔋",
    category: "Tech Gadgets",
    sourcePlatform: "amazon",
    pricePoint: 45.99,
    keywords: ["solar power bank", "fast charge", "camping gear"],
    // Plateauing — rose then flattened (saturating).
    volumes: [8200, 14300, 19600, 22800, 24100, 24600, 24850],
  },
  {
    id: "tg-mini-projector",
    title: "Palm-Size 1080p Smart Projector",
    image: "📽️",
    category: "Tech Gadgets",
    sourcePlatform: "tiktok",
    pricePoint: 89.99,
    keywords: ["mini projector", "portable cinema", "smart projector"],
    // Re-accelerating after a dip (volatile breakout).
    volumes: [6100, 7400, 6800, 8900, 13200, 19500, 29700],
  },

  /* ------------------------------ Lifestyle ----------------------------- */
  {
    id: "lf-leather-tech-pouch",
    title: "Minimalist Leather Tech Pouch",
    image: "👝",
    category: "Lifestyle",
    sourcePlatform: "instagram",
    pricePoint: 38.0,
    keywords: ["tech organizer", "leather pouch", "edc"],
    // Linear riser, mid scale.
    volumes: [4200, 6300, 8500, 10600, 12800, 14900, 17100],
  },
  {
    id: "lf-self-stir-mug",
    title: "Self-Stirring Insulated Travel Mug",
    image: "🥤",
    category: "Lifestyle",
    sourcePlatform: "tiktok",
    pricePoint: 27.99,
    keywords: ["self stirring mug", "protein shaker", "travel mug"],
    // Plateau after viral spike.
    volumes: [12400, 21800, 28600, 32100, 33400, 33900, 34050],
  },
  {
    id: "lf-adjustable-dumbbells",
    title: "Quick-Lock Adjustable Dumbbell Set 2.0",
    image: "🏋️",
    category: "Lifestyle",
    sourcePlatform: "amazon",
    pricePoint: 149.0,
    keywords: ["adjustable dumbbells", "home gym", "strength"],
    // Declining / fading — post-resolution slump.
    volumes: [31200, 28400, 25100, 21300, 18600, 16400, 15200],
  },
  {
    id: "lf-sunrise-alarm",
    title: "Sunrise Wake-Up Light Alarm",
    image: "🌅",
    category: "Lifestyle",
    sourcePlatform: "google",
    pricePoint: 41.5,
    keywords: ["sunrise alarm", "wake up light", "sleep wellness"],
    // Gentle, decelerating riser.
    volumes: [9100, 11800, 14000, 15700, 17000, 17900, 18500],
  },
  {
    id: "lf-collagen-creamer",
    title: "Collagen Peptide Coffee Creamer",
    image: "☕",
    category: "Lifestyle",
    sourcePlatform: "tiktok",
    pricePoint: 29.95,
    keywords: ["collagen creamer", "gut health", "coffee hack"],
    // Strong exponential breakout.
    volumes: [2900, 3800, 5400, 8200, 13500, 23100, 41600],
  },

  /* ----------------------------- Home Decor ----------------------------- */
  {
    id: "hd-moon-lamp",
    title: "Levitating LED Moon Lamp",
    image: "🌙",
    category: "Home Decor",
    sourcePlatform: "amazon",
    pricePoint: 34.99,
    keywords: ["moon lamp", "levitating lamp", "ambient light"],
    // Saturated and declining.
    volumes: [27600, 26100, 23800, 21000, 18900, 17500, 16800],
  },
  {
    id: "hd-aroma-diffuser",
    title: "Cordless Smart Aroma Diffuser",
    image: "🌫️",
    category: "Home Decor",
    sourcePlatform: "instagram",
    pricePoint: 52.0,
    keywords: ["aroma diffuser", "smart home", "aromatherapy"],
    // Accelerating mid-tier.
    volumes: [5600, 7200, 9600, 13100, 18200, 25600, 36100],
  },
  {
    id: "hd-levitating-planter",
    title: "Magnetic Levitating Plant Pot",
    image: "🪴",
    category: "Home Decor",
    sourcePlatform: "tiktok",
    pricePoint: 64.0,
    keywords: ["levitating planter", "floating plant", "desk decor"],
    // Sharp exponential breakout — newest viral object.
    volumes: [1600, 2300, 3600, 6200, 11100, 20800, 39400],
  },
  {
    id: "hd-sunset-lamp",
    title: "Sunset Projection Lamp 2.0",
    image: "🌇",
    category: "Home Decor",
    sourcePlatform: "google",
    pricePoint: 22.99,
    keywords: ["sunset lamp", "mood lighting", "tiktok room"],
    // Plateau — long-tail evergreen.
    volumes: [18900, 24200, 27800, 29600, 30400, 30700, 30850],
  },
  {
    id: "hd-felt-wall-panels",
    title: "Acoustic Felt Wall Panels (Self-Adhesive)",
    image: "🧱",
    category: "Home Decor",
    sourcePlatform: "google",
    pricePoint: 58.0,
    keywords: ["acoustic panels", "soundproofing", "studio decor"],
    // Linear climb, lower velocity.
    volumes: [6800, 8600, 10500, 12300, 14100, 15800, 17600],
  },
];

/* -------------------------------------------------------------------------- */
/*  Public seeding API                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Materialize the seed specs into fully-formed {@link TrendItem}s.
 *
 * This is the real product catalog (titles, images, categories, prices,
 * keywords). When a live data key is configured, the demand *series* of each
 * item is replaced with real Google Trends data in `src/lib/ingest.ts`; the
 * mock `volumes` here are the offline fallback for demo deployments.
 */
export function seedCatalog(): TrendItem[] {
  return SEED_SPECS.map((spec) => ({
    id: spec.id,
    title: spec.title,
    image: spec.image,
    category: spec.category,
    sourcePlatform: spec.sourcePlatform,
    currentVolume: spec.volumes[spec.volumes.length - 1],
    pricePoint: spec.pricePoint,
    keywords: spec.keywords,
    historicalDataPoints: toSeries(spec.volumes),
  }));
}

/**
 * The primary search keyword used to query a live trend provider for a product.
 * Falls back to the title when no keywords are present.
 */
export function trendsQueryFor(item: TrendItem): string {
  return item.keywords[0] ?? item.title;
}

/*
 * Ingestion (mock vs. live) is orchestrated in `src/lib/ingest.ts`, which calls
 * the real Google Trends provider in `src/lib/providers/serpapiGoogleTrends.ts`
 * when `SERPAPI_KEY` is set and falls back to this seeded catalog otherwise.
 */
