import type { CustomRange, PresetRange, Range } from "@/lib/range";

/* ─────────────────────────────────────────────────────────────────────────
 * Message totals: the ONE count of messages per time range.
 *
 * The Messages page hero authored these first (24H 48, 7D 468, 30D 2,248,
 * All 4,860) and every other surface that prints a message count reads them
 * from here: Activity's Total messages KPI and its per-key column, Overview's
 * Messages tile, the Teams usage and security tabs, the Token savings
 * summary, and the Security events canon (25% of these). Before 2026-09-25
 * Activity scaled its own 63,793-per-week figure instead and printed 112x to
 * 213x more messages than the Messages page listed for the same range.
 *
 * Kept free of imports beyond range types so the Messages hero, Activity and
 * the team modules can all read it without pulling each other in.
 * ───────────────────────────────────────────────────────────────────────── */

/** Messages the workspace sent in each preset range (the Messages hero). */
export const MESSAGE_TOTALS: Record<PresetRange, number> = {
  "24h": 48,
  "7d": 468,
  "30d": 2248,
  all: 4860,
};

/** Base rate behind a custom range's estimate, in messages per hour. */
const CUSTOM_MESSAGES_PER_HOUR = 80;

/** Hours a custom range spans. `+1` so a same-day range still spans one
 *  bucket instead of zero. The Messages hero sizes its buckets off this. */
export function customRangeHours(custom: CustomRange): number {
  const ms = custom.to.getTime() - custom.from.getTime();
  return Math.max(1, Math.round(ms / 36e5) + 1);
}

/** The Messages hero's total for a user-picked range: the hourly base rate
 *  times the hours in range, rounded to a tidy ten. */
export function customMessageTotal(custom: CustomRange): number {
  const raw = CUSTOM_MESSAGES_PER_HOUR * customRangeHours(custom);
  return Math.max(1, Math.round(raw / 10) * 10);
}

/** Message total for any range selection. A "custom" selection with no dates
 *  yet reads as 7D, the same fallback `effectiveScale` uses. */
export function messageTotalFor(
  range: Range,
  customRange: CustomRange | null
): number {
  if (range === "custom" && customRange) {
    return customMessageTotal(customRange);
  }
  return MESSAGE_TOTALS[range === "custom" ? "7d" : range];
}
