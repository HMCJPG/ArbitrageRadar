"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Radar,
  RefreshCw,
  SearchX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPanel } from "@/components/dashboard/filter-panel";
import { ProductCard } from "@/components/dashboard/product-card";
import { StatsBar } from "@/components/dashboard/stats-bar";
import type {
  EnrichedTrendItem,
  PlatformFilter,
  SortKey,
} from "@/types/trends";

interface TrendsResponse {
  data: EnrichedTrendItem[];
  meta: { generatedAt: string; count: number };
}

/** Resolve the numeric value a given sort key maps to. */
function sortValue(item: EnrichedTrendItem, key: SortKey): number {
  switch (key) {
    case "volume":
      return item.currentVolume;
    case "velocity":
      return item.metrics.velocity;
    case "acceleration":
      return item.metrics.acceleration;
    case "score":
    default:
      return item.metrics.score;
  }
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="h-[380px] animate-pulse bg-card/50" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [items, setItems] = useState<EnrichedTrendItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  // Filter / sort state.
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [search, setSearch] = useState("");

  const loadTrends = useCallback(async () => {
    setStatus("loading");
    try {
      // The /api/trends route also supports ?platform / ?sort / ?q for
      // programmatic use; here we pull the full set once and filter on the
      // client for instant, flicker-free interactivity.
      const res = await fetch("/api/trends", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json: TrendsResponse = await res.json();
      setItems(json.data);
      setGeneratedAt(json.meta?.generatedAt ?? null);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load trends:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadTrends();
  }, [loadTrends]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (platform !== "all" && item.sourcePlatform !== platform) return false;
      if (query) {
        const haystack = [item.title, item.category, ...item.keywords]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    return [...filtered].sort(
      (a, b) => sortValue(b, sort) - sortValue(a, sort),
    );
  }, [items, platform, sort, search]);

  return (
    <main className="container mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-xl border border-border bg-card">
            <Radar className="h-6 w-6 text-primary text-glow-emerald" />
            <span className="absolute inset-0 -z-10 rounded-xl bg-primary/20 animate-pulse-ring" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Arbitrage<span className="text-primary">Radar</span>
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Cross-platform product trend intelligence · velocity &amp;
              acceleration analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {generatedAt ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Updated{" "}
              {new Date(generatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadTrends()}
            disabled={status === "loading"}
          >
            <RefreshCw
              className={status === "loading" ? "animate-spin" : undefined}
            />
            Refresh
          </Button>
        </div>
      </header>

      {/* Stats */}
      <section className="mt-6">
        <StatsBar items={visibleItems} />
      </section>

      {/* Controls */}
      <section className="mt-6">
        <FilterPanel
          platform={platform}
          onPlatformChange={setPlatform}
          sort={sort}
          onSortChange={setSort}
          search={search}
          onSearchChange={setSearch}
        />
      </section>

      {/* Results */}
      <section className="mt-6">
        {status === "loading" ? (
          <LoadingGrid />
        ) : status === "error" ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium">Couldn&apos;t load trend data</p>
              <p className="text-sm text-muted-foreground">
                The intelligence feed is unavailable right now.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadTrends()}>
              <Loader2 className="h-4 w-4" />
              Try again
            </Button>
          </Card>
        ) : visibleItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No products match your filters</p>
              <p className="text-sm text-muted-foreground">
                Try a different platform tab or clear your search.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {visibleItems.length}
                </span>{" "}
                {visibleItems.length === 1 ? "product" : "products"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleItems.map((item, index) => (
                <ProductCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        ArbitrageRadar · Demo dataset seeded locally. Swap{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">
          src/lib/mockData.ts
        </code>{" "}
        for live Netrows / Bright Data feeds to go production.
      </footer>
    </main>
  );
}
