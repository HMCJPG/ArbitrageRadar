/**
 * ingest.ts — data ingestion orchestrator
 * -----------------------------------------------------------------------------
 * Single entry point the API route calls. Decides between LIVE and SEED data:
 *
 *   • LIVE  — when `SERPAPI_KEY` is set, each product's demand series is the
 *             real Google Trends "interest over time" for its primary keyword.
 *             Product metadata (title, image, category, price) stays from the
 *             curated catalog since Trends doesn't provide those.
 *   • SEED  — when no key is set (or every live fetch fails), the curated
 *             offline dataset is served so the app never breaks.
 *
 * Per-item fetches are isolated with Promise.allSettled: one keyword failing
 * falls back to that item's seed series without taking down the whole feed.
 */

import { seedCatalog, trendsQueryFor } from "@/lib/mockData";
import {
  fetchGoogleTrendsSeries,
  isLiveDataEnabled,
} from "@/lib/providers/serpapiGoogleTrends";
import type { TrendItem } from "@/types/trends";

export type DataSource = "live-google-trends" | "seed";

export interface IngestResult {
  items: TrendItem[];
  source: DataSource;
  /** Number of items whose series came back live (vs. fell back to seed). */
  liveItemCount: number;
  /** Human-readable notes (missing key, per-item fallbacks) for diagnostics. */
  warnings: string[];
}

export async function ingestTrends(): Promise<IngestResult> {
  const catalog = seedCatalog();

  if (!isLiveDataEnabled()) {
    return {
      items: catalog,
      source: "seed",
      liveItemCount: 0,
      warnings: ["SERPAPI_KEY not set — serving curated demo dataset."],
    };
  }

  const warnings: string[] = [];

  const results = await Promise.allSettled(
    catalog.map(async (item) => {
      const query = trendsQueryFor(item);
      const series = await fetchGoogleTrendsSeries(query, {
        geo: "US",
        date: "today 1-m",
        points: 7,
      });
      // Need at least 3 points for a meaningful second derivative.
      if (series.length < 3) {
        throw new Error(`insufficient Google Trends data for "${query}"`);
      }
      const enriched: TrendItem = {
        ...item,
        historicalDataPoints: series,
        currentVolume: series[series.length - 1].volume,
      };
      return enriched;
    }),
  );

  let liveItemCount = 0;
  const items = results.map((result, index) => {
    if (result.status === "fulfilled") {
      liveItemCount += 1;
      return result.value;
    }
    const reason =
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
    warnings.push(
      `"${trendsQueryFor(catalog[index])}": ${reason} — using seed series.`,
    );
    return catalog[index];
  });

  return {
    items,
    // If literally every fetch failed (e.g. bad key, quota exhausted), report
    // honestly that we're effectively on seed data.
    source: liveItemCount > 0 ? "live-google-trends" : "seed",
    liveItemCount,
    warnings,
  };
}
