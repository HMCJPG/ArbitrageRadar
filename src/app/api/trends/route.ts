/**
 * GET /api/trends
 * -----------------------------------------------------------------------------
 * Pulls raw demand records from the seeding engine, enriches each one with
 * velocity / acceleration / momentum analytics, then applies optional filter &
 * sort query parameters before returning a structured JSON array.
 *
 * Query parameters (all optional):
 *   ?platform=tiktok|instagram|amazon|google   — filter by source platform
 *   ?category=Tech%20Gadgets                    — filter by category (exact)
 *   ?q=magnetic                                 — free-text search (title/keywords)
 *   ?sort=volume|velocity|acceleration|score    — sort key (default: score)
 *   ?order=asc|desc                             — sort direction (default: desc)
 *
 * Example: /api/trends?platform=tiktok&sort=acceleration&order=desc
 */

import { NextResponse } from "next/server";

import { calculateMetrics } from "@/lib/derivatives";
import { ingestTrends } from "@/lib/ingest";
import type {
  EnrichedTrendItem,
  PlatformFilter,
  SortKey,
  SourcePlatform,
} from "@/types/trends";

// Always run fresh on the server (the seeding engine is dynamic). When wired to
// a cached upstream provider, swap to `export const revalidate = 1800`.
export const dynamic = "force-dynamic";

const VALID_PLATFORMS: SourcePlatform[] = [
  "tiktok",
  "instagram",
  "amazon",
  "google",
];
const VALID_SORT_KEYS: SortKey[] = [
  "volume",
  "velocity",
  "acceleration",
  "score",
];

function parsePlatform(raw: string | null): PlatformFilter {
  if (raw && VALID_PLATFORMS.includes(raw as SourcePlatform)) {
    return raw as SourcePlatform;
  }
  return "all";
}

function parseSort(raw: string | null): SortKey {
  if (raw && VALID_SORT_KEYS.includes(raw as SortKey)) {
    return raw as SortKey;
  }
  return "score";
}

/** Resolve the numeric value an item should be sorted by for a given key. */
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const platform = parsePlatform(searchParams.get("platform"));
    const category = searchParams.get("category")?.trim() ?? "";
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const sort = parseSort(searchParams.get("sort"));
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // 1. Ingest raw records — real Google Trends data when SERPAPI_KEY is set,
    //    otherwise the curated seed catalog (see src/lib/ingest.ts).
    const { items: rawItems, source, liveItemCount, warnings } =
      await ingestTrends();

    if (warnings.length > 0) {
      console.warn("[/api/trends] ingest warnings:", warnings);
    }

    // 2. Enrich every item with first- and second-derivative analytics.
    let items: EnrichedTrendItem[] = rawItems.map((item) => ({
      ...item,
      metrics: calculateMetrics(item.historicalDataPoints),
    }));

    // 3. Apply filters.
    if (platform !== "all") {
      items = items.filter((item) => item.sourcePlatform === platform);
    }
    if (category) {
      items = items.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase(),
      );
    }
    if (query) {
      items = items.filter((item) => {
        const haystack = [item.title, item.category, ...item.keywords]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    // 4. Sort.
    items.sort((a, b) => {
      const delta = sortValue(a, sort) - sortValue(b, sort);
      return order === "asc" ? delta : -delta;
    });

    // 5. Return a structured payload (array under `data` plus useful meta).
    return NextResponse.json(
      {
        data: items,
        meta: {
          count: items.length,
          platform,
          category: category || null,
          query: query || null,
          sort,
          order,
          // Honest provenance: "live-google-trends" or "seed", plus how many
          // items actually came back live this request.
          dataSource: source,
          liveItemCount,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[/api/trends] failed to build trend payload:", error);
    return NextResponse.json(
      { error: "Failed to load trend intelligence." },
      { status: 500 },
    );
  }
}
