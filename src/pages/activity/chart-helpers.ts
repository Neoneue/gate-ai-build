/**
 * Shared chart helpers for the Activity page: bucket/axis math for the trend
 * chart's x-axis, and the compact number formatters. Used by both Activity
 * (KPI rail + top-by-axis tables) and TrendCard.
 */
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatTime,
} from "@/lib/formatters";
import {
  type CustomRange,
  daysInRange,
  type PresetRange,
  type Range,
} from "@/lib/range";

export const BUCKET_COUNTS: Record<PresetRange, number> = {
  "24h": 12,
  "7d": 7,
  "30d": 30,
  all: 30,
};

export function getBucketCount(
  range: Range,
  customRange: CustomRange | null
): number {
  if (range === "custom" && customRange) {
    const days = daysInRange(customRange);
    return Math.max(7, Math.min(30, days));
  }
  return BUCKET_COUNTS[range === "custom" ? "7d" : range];
}

export function getBucketLabel(
  range: Range,
  customRange: CustomRange | null
): string {
  if (range === "custom" && customRange) {
    const days = daysInRange(customRange);
    const count = getBucketCount(range, customRange);
    const perBucketDays = Math.max(1, Math.round(days / count));
    return perBucketDays === 1 ? "per day" : `per ~${perBucketDays} days`;
  }
  if (range === "24h") {
    return "per 2 hours";
  }
  if (range === "7d") {
    return "per day";
  }
  if (range === "30d") {
    return "per day";
  }
  if (range === "all") {
    return "per day";
  }
  return "per bucket";
}

export function getRangeDates(
  range: Range,
  customRange: CustomRange | null
): Date[] {
  const count = getBucketCount(range, customRange);
  if (range === "custom" && customRange) {
    const span = customRange.to.getTime() - customRange.from.getTime();
    return Array.from(
      { length: count },
      (_, i) => new Date(customRange.from.getTime() + (span * i) / (count - 1))
    );
  }
  if (range === "all") {
    const lastDay = new Date(2026, 3, 27);
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(lastDay);
      d.setDate(d.getDate() - Math.round(((29 - i) * 59) / 29));
      return d;
    });
  }
  if (range === "24h") {
    const anchor = new Date(2026, 3, 27, 0, 0);
    const dates = Array.from(
      { length: 11 },
      (_, i) => new Date(anchor.getTime() + i * 2 * 60 * 60 * 1000)
    );
    dates.push(new Date(2026, 3, 27, 14, 30));
    return dates;
  }
  if (range === "7d") {
    const anchor = new Date(2026, 3, 27);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  }
  const lastDay = new Date(2026, 3, 27);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(lastDay);
    d.setDate(d.getDate() - (29 - i));
    return d;
  });
}

export function getRangeLabels(
  range: Range,
  customRange: CustomRange | null
): string[] {
  const count = getBucketCount(range, customRange);
  if (range === "custom" && customRange) {
    const labels: string[] = [];
    const span = customRange.to.getTime() - customRange.from.getTime();
    for (let i = 0; i < count; i++) {
      const d = new Date(customRange.from.getTime() + (span * i) / (count - 1));
      labels.push(formatDate(d, { month: "short", day: "numeric" }));
    }
    return labels;
  }
  if (range === "all") {
    // Lifetime cumulative window — 30 buckets spanning the ~60 days of mock
    // history, ending today (Apr 27, per existing fixtures). Each bucket
    // covers ~2 days; labels are the explicit date at the bucket start.
    const labels: string[] = [];
    const lastDay = new Date(2026, 3, 27);
    for (let i = 0; i < 30; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() - Math.round(((29 - i) * 59) / 29));
      labels.push(formatDate(d, { month: "short", day: "numeric" }));
    }
    return labels;
  }
  if (range === "24h") {
    // 12 buckets at 2-hour intervals on the calendar day. Trailing bucket
    // labeled "Now" since it ends at the anchor 14:30 rather than 14:00.
    const anchor = new Date(2026, 3, 27, 0, 0);
    const labels: string[] = [];
    for (let i = 0; i < 11; i++) {
      const d = new Date(anchor.getTime() + i * 2 * 60 * 60 * 1000);
      labels.push(
        formatTime(d, { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    }
    labels.push("Now");
    return labels;
  }
  if (range === "7d") {
    // 7 daily buckets ending Apr 27. Going back 6 days from the anchor.
    const anchor = new Date(2026, 3, 27);
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      labels.push(formatDate(d, { month: "short", day: "numeric" }));
    }
    return labels;
  }
  // 30D — 30 daily labels ending Apr 27 (today, per existing fixtures).
  // Going back 29 days: Mar 29 → Apr 27 inclusive. Last label is the
  // explicit date (matching 7D's pattern, not 1H/24H's "Now").
  const labels: string[] = [];
  const lastDay = new Date(2026, 3, 27);
  for (let i = 0; i < 30; i++) {
    const d = new Date(lastDay);
    d.setDate(d.getDate() - (29 - i));
    labels.push(formatDate(d, { month: "short", day: "numeric" }));
  }
  return labels;
}

export const fmtUsd = (n: number) => formatCurrency(n);

export const fmtInt = (n: number) => formatNumber(n);

export const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K`
      : `${n}`;
