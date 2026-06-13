/**
 * Core domain types for ArbitrageRadar.
 *
 * Every payload that crosses a boundary (seeding engine -> API route ->
 * frontend) is described here so the entire pipeline is strictly typed.
 */

/** The platforms we ingest cross-platform demand signals from. */
export type SourcePlatform = "tiktok" | "instagram" | "amazon" | "google";

/** A single point in a product's demand time-series. */
export interface HistoricalDataPoint {
  /** ISO-8601 timestamp (e.g. "2026-06-13T00:00:00.000Z"). */
  timestamp: string;
  /** Aggregate demand signal (mentions / searches / units) at this timestamp. */
  volume: number;
}

/**
 * A raw trend record as produced by the data seeding engine (or, in
 * production, a real marketplace / social provider).
 */
export interface TrendItem {
  /** Stable unique identifier. */
  id: string;
  /** Human-readable product name. */
  title: string;
  /**
   * Thumbnail. In this build we use an emoji glyph rendered over a gradient,
   * which keeps the bundle self-contained and free of external image hosts.
   * In production this can be swapped for a CDN URL.
   */
  image: string;
  /** Product category, e.g. "Tech Gadgets", "Lifestyle", "Home Decor". */
  category: string;
  /** Which platform this signal originated from. */
  sourcePlatform: SourcePlatform;
  /** Latest demand volume (mirrors the final historical data point). */
  currentVolume: number;
  /** Typical retail price point in USD. */
  pricePoint: number;
  /** Associated search / hashtag keywords. */
  keywords: string[];
  /** Chronologically-ascending demand history (>= 7 daily points). */
  historicalDataPoints: HistoricalDataPoint[];
}

/**
 * Derived analytics computed from a TrendItem's historical data.
 */
export interface CalculatedMetrics {
  /**
   * First derivative — velocity (Δv/Δt). How fast demand is changing *right
   * now*, in volume units per day. Positive = growing, negative = fading.
   */
  velocity: number;
  /**
   * Second derivative — acceleration (Δ²v/Δt). Whether the trend is catching
   * fire (positive) or losing steam (negative), in volume units per day².
   */
  acceleration: number;
  /**
   * Weighted momentum index in the range 0–100. Heavily weights acceleration
   * so breakout products surface before they saturate.
   */
  score: number;
}

/** A TrendItem enriched with its computed analytics — the API response shape. */
export interface EnrichedTrendItem extends TrendItem {
  metrics: CalculatedMetrics;
}

/** Sort keys exposed by the API and the dashboard. */
export type SortKey = "volume" | "velocity" | "acceleration" | "score";

/** Platform filter, including the "all" pseudo-value. */
export type PlatformFilter = SourcePlatform | "all";
