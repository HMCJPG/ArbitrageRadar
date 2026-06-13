"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/dashboard/sparkline";
import {
  PLATFORM_META,
  categoryGradient,
} from "@/components/dashboard/platform-meta";
import { cn, formatCompact, formatPrice, formatSigned } from "@/lib/utils";
import type { EnrichedTrendItem } from "@/types/trends";

interface ProductCardProps {
  item: EnrichedTrendItem;
  /** Animation stagger index for the fade-up entrance. */
  index?: number;
}

const VELOCITY_COLOR = "hsl(var(--velocity))";
const ACCELERATION_COLOR = "hsl(var(--acceleration))";
const DANGER_COLOR = "hsl(var(--danger))";

interface MetricBadgeProps {
  label: string;
  symbol: string;
  value: number;
  /** Color channel used when the value is non-negative. */
  positiveColor: string;
  suffix: string;
}

function MetricBadge({
  label,
  symbol,
  value,
  positiveColor,
  suffix,
}: MetricBadgeProps) {
  const isPositive = value >= 0;
  const color = isPositive ? positiveColor : DANGER_COLOR;
  const Arrow = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex-1 rounded-lg border border-border bg-muted/30 p-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label} <span className="font-mono">({symbol})</span>
      </p>
      <div className="mt-1 flex items-center gap-1" style={{ color }}>
        <Arrow className="h-4 w-4 shrink-0" />
        <span className="text-base font-semibold tabular-nums">
          {formatSigned(value)}
        </span>
        <span className="text-[10px] text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

export function ProductCard({ item, index = 0 }: ProductCardProps) {
  const [deployed, setDeployed] = useState(false);
  const platform = PLATFORM_META[item.sourcePlatform];
  const PlatformIcon = platform.icon;

  const { velocity, acceleration, score } = item.metrics;
  const sparkColor = acceleration >= 0 ? ACCELERATION_COLOR : DANGER_COLOR;

  function handleDeploy() {
    // In production this would POST to the dropshipping pipeline. Here we log a
    // fully-structured payload that downstream mapping can consume directly.
    const payload = {
      action: "DEPLOY_FUNNEL",
      productId: item.id,
      title: item.title,
      sourcePlatform: item.sourcePlatform,
      category: item.category,
      pricePoint: item.pricePoint,
      currentVolume: item.currentVolume,
      keywords: item.keywords,
      metrics: item.metrics,
      deployedAt: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console.log("[ArbitrageRadar] Deploy Funnel payload →", payload);

    setDeployed(true);
    window.setTimeout(() => setDeployed(false), 2200);
  }

  return (
    <Card
      className="group flex animate-fade-up flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      {/* Header: thumbnail + identity */}
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br text-3xl",
            categoryGradient(item.category),
          )}
          aria-hidden
        >
          {item.image}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <PlatformIcon className={cn("h-3.5 w-3.5", platform.colorClass)} />
            <span className="text-muted-foreground">{platform.label}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
            {item.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="muted">{item.category}</Badge>
            <span className="text-xs font-medium text-muted-foreground">
              {formatPrice(item.pricePoint)}
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline: 7-day volume vector */}
      <div className="px-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>7-Day Volume</span>
          <span className="tabular-nums text-foreground">
            {formatCompact(item.currentVolume)}
          </span>
        </div>
        <Sparkline data={item.historicalDataPoints} color={sparkColor} />
      </div>

      {/* Metric badges */}
      <div className="flex gap-2 px-4 pt-1">
        <MetricBadge
          label="Velocity"
          symbol="Δv"
          value={velocity}
          positiveColor={VELOCITY_COLOR}
          suffix="/d"
        />
        <MetricBadge
          label="Acceleration"
          symbol="Δ²v"
          value={acceleration}
          positiveColor={ACCELERATION_COLOR}
          suffix="/d²"
        />
      </div>

      {/* Momentum score meter */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Momentum Score</span>
          <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
            {score.toFixed(1)}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--velocity))] to-[hsl(var(--acceleration))] transition-all"
            style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
          />
        </div>
      </div>

      {/* Action */}
      <div className="mt-auto p-4 pt-4">
        <Button
          onClick={handleDeploy}
          variant={deployed ? "violet" : "default"}
          className="w-full"
          aria-live="polite"
        >
          {deployed ? (
            <>
              <Check className="h-4 w-4" />
              Funnel Deployed
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Deploy Funnel
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
