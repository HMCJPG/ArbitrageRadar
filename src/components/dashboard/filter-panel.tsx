"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlatformFilter, SortKey } from "@/types/trends";

interface FilterPanelProps {
  platform: PlatformFilter;
  onPlatformChange: (platform: PlatformFilter) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const PLATFORM_TABS: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tiktok", label: "TikTok Shop" },
  { value: "instagram", label: "Instagram Reels" },
  { value: "amazon", label: "Amazon Best Sellers" },
  { value: "google", label: "Google Trends" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Momentum Score" },
  { value: "acceleration", label: "Acceleration (Δ²v)" },
  { value: "velocity", label: "Velocity (Δv)" },
  { value: "volume", label: "Current Volume" },
];

export function FilterPanel({
  platform,
  onPlatformChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
}: FilterPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Platform tabs — horizontally scrollable on mobile. */}
        <Tabs
          value={platform}
          onValueChange={(value) => onPlatformChange(value as PlatformFilter)}
          className="min-w-0"
        >
          <TabsList className="no-scrollbar h-auto w-full max-w-full flex-nowrap justify-start overflow-x-auto">
            {PLATFORM_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search + sort. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search products or keywords…"
              className="pl-9"
              aria-label="Search products"
            />
          </div>

          <Select value={sort} onValueChange={(value) => onSortChange(value as SortKey)}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
