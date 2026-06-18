/**
 * serpapiGoogleTrends.ts — LIVE data provider
 * -----------------------------------------------------------------------------
 * Pulls a real demand time-series from Google Trends via SerpApi's documented
 * Google Trends API (https://serpapi.com/google-trends-api).
 *
 * Why Google Trends: the whole engine is built on a *time-series* (7 daily
 * points -> velocity -> acceleration). Google Trends "interest over time" is a
 * real, public, historical series — unlike Amazon/TikTok product endpoints,
 * which only return a current snapshot. SerpApi wraps it behind a single
 * api_key parameter and works on Vercel's serverless runtime.
 *
 * Request:
 *   GET https://serpapi.com/search.json
 *       ?engine=google_trends
 *       &q=<keyword>
 *       &data_type=TIMESERIES
 *       &date=today 1-m          (past 30 days, daily granularity)
 *       &geo=US
 *       &api_key=<SERPAPI_KEY>
 *
 * Response (relevant slice):
 *   {
 *     "interest_over_time": {
 *       "timeline_data": [
 *         { "timestamp": "1718064000",
 *           "date": "Jun 10, 2026",
 *           "values": [{ "query": "...", "value": "73", "extracted_value": 73 }] },
 *         ...
 *       ]
 *     }
 *   }
 */

import type { HistoricalDataPoint } from "@/types/trends";

const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";

export interface GoogleTrendsOptions {
  /** Geo code, e.g. "US". Defaults to worldwide when omitted by Google. */
  geo?: string;
  /** Google Trends date window. "today 1-m" => past 30 days, daily points. */
  date?: string;
  /** Keep only the trailing N daily points (the dashboard shows 7). */
  points?: number;
  /**
   * Upstream cache TTL in seconds for Next.js' data cache. Google Trends is
   * daily-granularity, so caching for hours conserves the SerpApi quota
   * (free tier = 100 searches/month) without losing freshness.
   */
  revalidateSeconds?: number;
}

interface SerpApiTimelineValue {
  query: string;
  value: string;
  extracted_value: number;
}

interface SerpApiTimelinePoint {
  date: string;
  timestamp: string;
  values: SerpApiTimelineValue[];
}

interface SerpApiTrendsResponse {
  error?: string;
  interest_over_time?: {
    timeline_data?: SerpApiTimelinePoint[];
  };
}

/** True when a SerpApi key is configured in the environment. */
export function isLiveDataEnabled(): boolean {
  return Boolean(process.env.SERPAPI_KEY && process.env.SERPAPI_KEY.trim());
}

/**
 * Fetch a real Google Trends interest-over-time series for a single keyword
 * and map it into the app's {@link HistoricalDataPoint} shape.
 *
 * Throws on misconfiguration, network failure, SerpApi errors, or empty data
 * so callers can decide how to fall back (see `src/lib/ingest.ts`).
 */
export async function fetchGoogleTrendsSeries(
  query: string,
  options: GoogleTrendsOptions = {},
): Promise<HistoricalDataPoint[]> {
  const apiKey = process.env.SERPAPI_KEY?.trim();
  if (!apiKey) {
    throw new Error("SERPAPI_KEY is not set");
  }

  const {
    geo = "US",
    date = "today 1-m",
    points = 7,
    revalidateSeconds = 21_600, // 6 hours
  } = options;

  const url = new URL(SERPAPI_ENDPOINT);
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("q", query);
  url.searchParams.set("data_type", "TIMESERIES");
  url.searchParams.set("date", date);
  if (geo) url.searchParams.set("geo", geo);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    // Cache the upstream response in Next's data cache to conserve quota.
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`SerpApi HTTP ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as SerpApiTrendsResponse;
  if (json.error) {
    throw new Error(`SerpApi error: ${json.error}`);
  }

  const timeline = json.interest_over_time?.timeline_data ?? [];

  const series: HistoricalDataPoint[] = timeline
    .map((point) => {
      const primary = point.values?.[0];
      const rawValue =
        typeof primary?.extracted_value === "number"
          ? primary.extracted_value
          : Number(primary?.value ?? Number.NaN);
      const unixSeconds = Number(point.timestamp);
      const timestamp = Number.isFinite(unixSeconds)
        ? new Date(unixSeconds * 1000).toISOString()
        : new Date(point.date).toISOString();
      return { timestamp, volume: rawValue };
    })
    .filter((point) => Number.isFinite(point.volume));

  if (series.length === 0) {
    throw new Error(`No Google Trends data returned for "${query}"`);
  }

  // Keep only the trailing daily points the dashboard renders.
  return series.slice(-points);
}
