"use client";

import { Activity, Flame, Radar, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn, formatCompact, formatSigned } from "@/lib/utils";
import type { EnrichedTrendItem } from "@/types/trends";

interface StatsBarProps {
  items: EnrichedTrendItem[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: "neutral" | "velocity" | "acceleration";
}

const ACCENT_RING: Record<StatCardProps["accent"], string> = {
  neutral: "ring-border",
  velocity: "ring-[hsl(var(--velocity)/0.35)]",
  acceleration: "ring-[hsl(var(--acceleration)/0.35)]",
};

const ACCENT_TEXT: Record<StatCardProps["accent"], string> = {
  neutral: "text-foreground",
  velocity: "text-[hsl(var(--velocity))] text-glow-violet",
  acceleration: "text-[hsl(var(--acceleration))] text-glow-emerald",
};

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5 ring-1 transition-colors",
        ACCENT_RING[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 truncate text-2xl font-semibold tracking-tight",
              ACCENT_TEXT[accent],
            )}
          >
            {value}
          </p>
          {sub ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-lg border border-border bg-muted/40 p-2 text-muted-foreground">
          {icon}
        </div>
      </div>
    </Card>
  );
}

/**
 * Aggregate intelligence strip:
 *  • total items tracked
 *  • highest-velocity product
 *  • fastest-accelerating breakout category
 *  • average momentum across the current view
 */
export function StatsBar({ items }: StatsBarProps) {
  const total = items.length;

  const topVelocity =
    items.length > 0
      ? items.reduce((best, item) =>
          item.metrics.velocity > best.metrics.velocity ? item : best,
        )
      : null;

  // Average acceleration per category -> the breakout category.
  const byCategory = new Map<string, { sum: number; count: number }>();
  for (const item of items) {
    const bucket = byCategory.get(item.category) ?? { sum: 0, count: 0 };
    bucket.sum += item.metrics.acceleration;
    bucket.count += 1;
    byCategory.set(item.category, bucket);
  }
  let breakoutCategory: { name: string; avg: number } | null = null;
  for (const [name, { sum, count }] of byCategory) {
    const avg = sum / count;
    if (!breakoutCategory || avg > breakoutCategory.avg) {
      breakoutCategory = { name, avg };
    }
  }

  const avgScore =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.metrics.score, 0) / items.length
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<Radar className="h-5 w-5" />}
        label="Items Tracked"
        value={total.toString()}
        sub="Across all live sources"
        accent="neutral"
      />
      <StatCard
        icon={<Zap className="h-5 w-5 text-[hsl(var(--velocity))]" />}
        label="Highest Velocity"
        value={
          topVelocity ? `${formatSigned(topVelocity.metrics.velocity)}/d` : "—"
        }
        sub={topVelocity ? topVelocity.title : "No data"}
        accent="velocity"
      />
      <StatCard
        icon={<Flame className="h-5 w-5 text-[hsl(var(--acceleration))]" />}
        label="Breakout Category"
        value={breakoutCategory ? breakoutCategory.name : "—"}
        sub={
          breakoutCategory
            ? `${formatSigned(Math.round(breakoutCategory.avg))}/d² avg acceleration`
            : "No data"
        }
        accent="acceleration"
      />
      <StatCard
        icon={<Activity className="h-5 w-5" />}
        label="Avg Momentum"
        value={avgScore.toFixed(1)}
        sub={`Weighted index · ${formatCompact(
          items.reduce((sum, item) => sum + item.currentVolume, 0),
        )} total volume`}
        accent="neutral"
      />
    </div>
  );
}
