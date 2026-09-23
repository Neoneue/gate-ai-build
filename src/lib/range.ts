/**
 * Shared time-range primitives used by the Activity, Conversations, and
 * Security pages. Extracted verbatim from those pages (the definitions were
 * byte-identical) so the range types, selector options, and scale math live in
 * one place. Page-specific spark/bucket helpers intentionally stay in their
 * pages; only the common primitives live here.
 */

import { DEMO_NOW } from "./demo-clock";

export type PresetRange = "all" | "24h" | "7d" | "30d";
export type Range = PresetRange | "custom";
export type CustomRange = { from: Date; to: Date };

export const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
  { value: "all", label: "All" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

/** Multiplier applied to base (7d) values to fabricate plausible per-range
 *  totals on this static artboard. Real implementation would aggregate from
 *  the gateway event stream per the PRD acceptance criterion (chart-by-key
 *  total === per-key-table total for the same range). `all` is the lifetime
 *  cumulative window — ~60 days of history for this mock workspace, so it
 *  sits above 30d (8.5 ≈ 60/7 weeks, keeping the 7d day-rate consistent). */
export const RANGE_SCALE: Record<PresetRange, number> = {
  "24h": 0.16,
  "7d": 1,
  "30d": 4.2,
  all: 8.5,
};

export function daysInRange(r: CustomRange): number {
  return Math.max(
    1,
    Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000) + 1
  );
}

export function effectiveScale(
  range: Range,
  customRange: CustomRange | null
): number {
  if (range === "custom" && customRange) {
    return daysInRange(customRange) / 7;
  }
  return RANGE_SCALE[range === "custom" ? "7d" : range];
}

/** The instant window a range selects, or `null` for the lifetime range
 *  ("All"), which selects everything ever recorded.
 *
 *  This is the honest counterpart to `RANGE_SCALE` above. Rather than
 *  multiplying a base figure to fabricate a per-range total, filter the rows by
 *  their real dates and count what survives — the KPI, its sparkline, its table
 *  and its pagination footer then describe one window and cannot disagree.
 *
 *  Anchored to `DEMO_NOW`, the same instant the pages' sparklines end on, so a
 *  tile and the line under it share a right edge. Conversations is the first
 *  page to filter this way (2026-09-23); Activity, Security events and the rest
 *  still scale. */
export function rangeWindow(
  range: Range,
  customRange: CustomRange | null
): CustomRange | null {
  if (range === "custom") {
    return customRange;
  }
  if (range === "all") {
    return null;
  }
  const from = new Date(DEMO_NOW);
  if (range === "24h") {
    from.setHours(from.getHours() - 24);
  } else {
    from.setDate(from.getDate() - (range === "30d" ? 30 : 7));
  }
  return { from, to: new Date(DEMO_NOW) };
}

/** True when `d` falls inside `window`. A null window (the lifetime range)
 *  admits everything. Both ends are inclusive: the custom picker hands back an
 *  explicit 23:55 end instant, not an exclusive midnight. */
export function inRangeWindow(d: Date, window: CustomRange | null): boolean {
  if (!window) {
    return true;
  }
  const t = d.getTime();
  return t >= window.from.getTime() && t <= window.to.getTime();
}
