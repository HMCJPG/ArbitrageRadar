/**
 * derivatives.ts
 * -----------------------------------------------------------------------------
 * Numerical engine that turns a raw demand time-series into trend analytics.
 *
 *   • Velocity      (1st derivative)  — how fast demand is changing now.
 *   • Acceleration  (2nd derivative)  — whether the change is speeding up.
 *   • Momentum score                  — a normalized 0–100 breakout index.
 *
 * All functions are pure and side-effect free, which keeps them trivially
 * unit-testable and safe to run inside a serverless function.
 */

import type { CalculatedMetrics, HistoricalDataPoint } from "@/types/trends";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Time delta between two ISO timestamps, expressed in days.
 * Guards against zero / negative / malformed deltas (which would otherwise
 * produce Infinity or NaN) by clamping to a single day.
 */
function deltaDays(fromIso: string, toIso: string): number {
  const delta = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY;
  return Number.isFinite(delta) && delta > 0 ? delta : 1;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

/** Logistic squashing function mapping (-∞, ∞) -> (0, 1). */
function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * First-derivative series.
 *
 * For each adjacent pair of points returns the slope:
 *     v[i] = (volume[i] - volume[i-1]) / Δt
 * Result length is points.length - 1. v[last] is the *current* velocity.
 */
export function computeVelocitySeries(points: HistoricalDataPoint[]): number[] {
  if (points.length < 2) return [];

  const series: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dt = deltaDays(prev.timestamp, curr.timestamp);
    series.push((curr.volume - prev.volume) / dt);
  }
  return series;
}

/**
 * Second-derivative series — the rate of change of velocity.
 *
 *     a[i] = (v[i] - v[i-1]) / Δt
 *
 * The Δt for each second difference is the *centered* span across the three
 * raw samples that produced the two velocities, i.e. (t[i+1] - t[i-1]) / 2.
 * For daily data this resolves to ~1 day, but it stays correct for irregular
 * sampling. Result length is points.length - 2.
 */
export function computeAccelerationSeries(points: HistoricalDataPoint[]): number[] {
  const velocity = computeVelocitySeries(points);
  if (velocity.length < 2) return [];

  const series: number[] = [];
  for (let i = 1; i < velocity.length; i++) {
    // velocity[i]   spans points[i]   -> points[i+1]
    // velocity[i-1] spans points[i-1] -> points[i]
    const dt = deltaDays(points[i - 1].timestamp, points[i + 1].timestamp) / 2;
    series.push((velocity[i] - velocity[i - 1]) / dt);
  }
  return series;
}

/** Current (most-recent) velocity — Δv/Δt. */
export function computeVelocity(points: HistoricalDataPoint[]): number {
  const series = computeVelocitySeries(points);
  return series.length > 0 ? series[series.length - 1] : 0;
}

/** Current (most-recent) acceleration — Δ²v/Δt. */
export function computeAcceleration(points: HistoricalDataPoint[]): number {
  const series = computeAccelerationSeries(points);
  return series.length > 0 ? series[series.length - 1] : 0;
}

/**
 * Combined Momentum Score (0–100).
 *
 * The intent: surface breakout products *before* they saturate. A product
 * whose growth is accelerating should outrank a product that already has huge
 * volume but is flattening out.
 *
 * Method:
 *   1. Convert velocity & acceleration into dimensionless daily growth rates by
 *      dividing by the series' mean volume. This makes a small niche product
 *      and a mega-viral product directly comparable.
 *   2. Squash each rate through a logistic curve into (0, 1). Acceleration uses
 *      a steeper gain so early inflections register strongly.
 *   3. Fold in raw volume on a log scale (lightly) so genuine scale still
 *      counts for something.
 *   4. Blend with acceleration-dominant weights and rescale to 0–100.
 */
export function computeMomentumScore(points: HistoricalDataPoint[]): number {
  if (points.length < 2) return 0;

  const volumes = points.map((p) => p.volume);
  const avgVolume = Math.max(mean(volumes), 1);
  const latestVolume = volumes[volumes.length - 1];

  const velocity = computeVelocity(points);
  const acceleration = computeAcceleration(points);

  // Dimensionless daily growth rates relative to typical volume.
  const velocityRate = velocity / avgVolume;
  const accelerationRate = acceleration / avgVolume;

  // Squash into (0, 1). Acceleration is intentionally more sensitive.
  const velocityScore = logistic(velocityRate * 6);
  const accelerationScore = logistic(accelerationRate * 12);

  // Raw scale, log-normalized so 1M volume ≈ 1.0, contributes lightly.
  const volumeScore = Math.min(1, Math.log10(latestVolume + 1) / 6);

  // Acceleration-dominant weighting — the core thesis of the engine.
  const W_ACCELERATION = 0.5;
  const W_VELOCITY = 0.3;
  const W_VOLUME = 0.2;

  const composite =
    W_ACCELERATION * accelerationScore +
    W_VELOCITY * velocityScore +
    W_VOLUME * volumeScore;

  return round(composite * 100, 1);
}

/**
 * Convenience entry point: compute the full {@link CalculatedMetrics} payload
 * for a single product's history in one pass.
 */
export function calculateMetrics(points: HistoricalDataPoint[]): CalculatedMetrics {
  return {
    velocity: round(computeVelocity(points), 1),
    acceleration: round(computeAcceleration(points), 1),
    score: computeMomentumScore(points),
  };
}
