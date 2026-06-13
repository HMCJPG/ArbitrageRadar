import {
  Globe,
  Instagram,
  Music2,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

import type { SourcePlatform } from "@/types/trends";

export interface PlatformMeta {
  /** Short label used on cards. */
  label: string;
  /** Long label used in filter tabs. */
  longLabel: string;
  icon: LucideIcon;
  /** Tailwind text color class for the icon. */
  colorClass: string;
}

/**
 * Lucide ships no first-party brand glyphs for these platforms, so we map each
 * source to the closest semantic icon and a distinct accent color.
 */
export const PLATFORM_META: Record<SourcePlatform, PlatformMeta> = {
  tiktok: {
    label: "TikTok",
    longLabel: "TikTok Shop",
    icon: Music2,
    colorClass: "text-pink-400",
  },
  instagram: {
    label: "Instagram",
    longLabel: "Instagram Reels",
    icon: Instagram,
    colorClass: "text-fuchsia-400",
  },
  amazon: {
    label: "Amazon",
    longLabel: "Amazon Best Sellers",
    icon: ShoppingBag,
    colorClass: "text-amber-400",
  },
  google: {
    label: "Google",
    longLabel: "Google Trends",
    icon: Globe,
    colorClass: "text-sky-400",
  },
};

/** A small gradient palette keyed by category for thumbnail backdrops. */
export const CATEGORY_GRADIENT: Record<string, string> = {
  "Tech Gadgets": "from-violet-500/30 via-indigo-500/15 to-transparent",
  Lifestyle: "from-emerald-500/30 via-teal-500/15 to-transparent",
  "Home Decor": "from-amber-500/30 via-orange-500/15 to-transparent",
};

export function categoryGradient(category: string): string {
  return (
    CATEGORY_GRADIENT[category] ??
    "from-slate-500/30 via-slate-500/10 to-transparent"
  );
}
