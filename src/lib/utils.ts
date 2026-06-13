import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — merge conditional class names while de-duplicating conflicting
 * Tailwind utilities (the standard shadcn/ui helper).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Compact a large number into a human-friendly string (12,400 -> "12.4K"). */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format a signed number with a leading + / − and compact magnitude. */
export function formatSigned(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCompact(Math.abs(value))}`;
}

/** Format a USD price point. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
