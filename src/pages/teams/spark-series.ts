import {
  type CustomRange,
  daysInRange,
  RANGE_SCALE,
  type Range,
} from "@/lib/range";
import { distributeSeries } from "@/pages/activity-data";

/* ─────────────────────────────────────────────────────────────────────────
 * Team sparkline series — one underlying daily curve per team + metric.
 *
 * Every range's sparkline renders a WINDOW of the same daily backbone, so
 * the All chart's tail and the 7D chart describe the same days and cannot
 * contradict each other (the first cut seeded an independent random series
 * per range, and All ended in a plunge while 7D climbed). Each window is
 * rescaled onto its own KPI, so sum(spark) stays the number on the card
 * (charts-must-reconcile) while the shape is shared.
 *
 * Its own module rather than a helper inside `TeamDetailEnterprise.tsx` so
 * the reconciliation suite can import it and the page keeps exporting
 * components only (repo convention: split, don't disable — see
 * `teams/budget-band.ts`).
 * ───────────────────────────────────────────────────────────────────────── */

/** Days of history behind the "All" range. RANGE_SCALE.all = 8.5 weeks —
 *  the mock workspace's lifetime — which getRangeDates also spans. */
export const ALL_SPAN_DAYS = 60;

/** The canonical daily curve: the metric's lifetime total spread across the
 *  All span. Seed carries team + metric only — NEVER the range; a per-range
 *  seed is exactly the incoherence this module exists to remove. */
export function teamDailySeries(total7d: number, seed: number): number[] {
  return distributeSeries(total7d * RANGE_SCALE.all, ALL_SPAN_DAYS, seed);
}

function windowDays(range: Range, customRange: CustomRange | null): number {
  if (range === "custom" && customRange) {
    return Math.min(ALL_SPAN_DAYS, daysInRange(customRange));
  }
  if (range === "30d") {
    return 30;
  }
  if (range === "7d") {
    return 7;
  }
  return ALL_SPAN_DAYS;
}

/** Integrate the daily step function over `count` equal sub-intervals.
 *  Mass-preserving in both directions: 60 days fold into 30 two-day buckets
 *  for All, and a short custom window splits days across sub-day buckets. */
function resample(days: number[], count: number): number[] {
  const span = days.length;
  if (span === count) {
    return [...days];
  }
  const out: number[] = Array.from({ length: count }, () => 0);
  for (let j = 0; j < count; j++) {
    const start = (j * span) / count;
    const end = ((j + 1) * span) / count;
    for (let d = Math.floor(start); d < Math.ceil(end) && d < span; d++) {
      const overlap = Math.min(end, d + 1) - Math.max(start, d);
      if (overlap > 0) {
        out[j] = (out[j] ?? 0) + (days[d] ?? 0) * overlap;
      }
    }
  }
  return out;
}

/** A range's sparkline: the backbone's trailing window, resampled to the
 *  range's bucket count and settled onto the KPI the card shows.
 *
 *  `total7d` is the UNSCALED metric (it shapes the backbone); `scaledTotal`
 *  is the settled KPI for the selected range (it sizes the window). 24H is
 *  the one range with no daily constraint — it renders intraday buckets no
 *  other range can contradict — so it keeps its own distribution. */
export function teamSparkSeries(
  total7d: number,
  scaledTotal: number,
  range: Range,
  customRange: CustomRange | null,
  count: number,
  seed: number
): number[] {
  if (range === "24h") {
    return distributeSeries(scaledTotal, count, seed);
  }
  const tail = teamDailySeries(total7d, seed).slice(
    -windowDays(range, customRange)
  );
  const buckets = resample(tail, count);
  const sum = buckets.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return buckets.map(() => 0);
  }
  const factor = scaledTotal / sum;
  const out: number[] = [];
  let accumulated = 0;
  for (let i = 0; i < buckets.length - 1; i++) {
    const v = +((buckets[i] ?? 0) * factor).toFixed(2);
    out.push(v);
    accumulated += v;
  }
  out.push(+(scaledTotal - accumulated).toFixed(2));
  return out;
}
