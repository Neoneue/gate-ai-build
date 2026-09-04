// Token savings — the KPI series the Token savings page renders, kept out of
// the component file so the team-scoped Token savings tab can read the SAME
// numbers (react-refresh/only-export-components: non-component exports live
// in their own module). Relocated verbatim from `TokenSavings.tsx`
// 2026-09-02; nothing here is new data.

import { DEMO_NOW } from "@/lib/demo-clock";
import { formatSparkLabel } from "@/lib/formatters";
import { TOKEN_SAVINGS_RATE_7D } from "@/pages/activity-data";

export type PresetRange = "all" | "24h" | "7d" | "30d";
export type Range = PresetRange | "custom";
export type CustomRange = { from: Date; to: Date };

export const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
  { value: "all", label: "All" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

export const RANGE_DELTA_NOTE: Record<Range, string> = {
  all: "All time",
  "24h": "vs prior day",
  "7d": "vs prior week",
  "30d": "vs prior month",
  custom: "vs prior range",
};

// Savings is a RATE, so it stays roughly stable across windows (it does not
// accumulate like a total). Each window shows a slightly different rate, and
// every tile's sparkline ENDS at its headline value so the trend reconciles.
// Total saved === caching + compression (rounded): all 0.15+13.7≈13.9,
// 7d 0.18+14.0≈14.2, 30d 0.14+13.4≈13.5, 24h 0.11+12.7≈12.8.
export const KPI_COLORS = {
  total: "var(--color-chart-1)",
  caching: "var(--color-chart-3)",
  compression: "var(--color-chart-7)",
} as const;
export type SavingsKpi = {
  title: string;
  value: string;
  colorVar: string;
  spark: number[];
};
export const KPI_BY_RANGE: Record<PresetRange, SavingsKpi[]> = {
  // All time / 30d show the lifetime ramp: savings start near 0% and climb
  // steeply as the cache warms and compression heuristics learn the workload,
  // then begin to plateau near the steady-state rate (ease-out curve). The
  // shorter windows (24h / 7d) sit in the plateau, so they barely move.
  all: [
    {
      title: "Total saved",
      value: "13.9",
      colorVar: KPI_COLORS.total,
      spark: [0.4, 2.9, 6.4, 9.6, 11.9, 13.3, 13.9],
    },
    {
      title: "Caching",
      value: "0.15",
      colorVar: KPI_COLORS.caching,
      spark: [0.0, 0.02, 0.05, 0.09, 0.12, 0.14, 0.15],
    },
    {
      title: "Compression",
      value: "13.7",
      colorVar: KPI_COLORS.compression,
      spark: [0.4, 2.7, 6.1, 9.3, 11.7, 13.1, 13.7],
    },
  ],
  "24h": [
    {
      title: "Total saved",
      value: "12.8",
      colorVar: KPI_COLORS.total,
      spark: [12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.8],
    },
    {
      title: "Caching",
      value: "0.11",
      colorVar: KPI_COLORS.caching,
      spark: [0.09, 0.09, 0.1, 0.1, 0.11, 0.11, 0.11],
    },
    {
      title: "Compression",
      value: "12.7",
      colorVar: KPI_COLORS.compression,
      spark: [12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.7],
    },
  ],
  "7d": [
    {
      title: "Total saved",
      // Reconciles with Overview's Tokens Saved tile — both derive from
      // TOKEN_SAVINGS_RATE_7D (activity-data.ts).
      value: (TOKEN_SAVINGS_RATE_7D * 100).toFixed(1),
      colorVar: KPI_COLORS.total,
      spark: [12.4, 12.8, 13.2, 13.5, 13.8, 14.0, 14.2],
    },
    {
      title: "Caching",
      value: "0.18",
      colorVar: KPI_COLORS.caching,
      spark: [0.13, 0.14, 0.15, 0.16, 0.17, 0.17, 0.18],
    },
    {
      title: "Compression",
      value: "14.0",
      colorVar: KPI_COLORS.compression,
      spark: [12.3, 12.7, 13.1, 13.4, 13.7, 13.9, 14.0],
    },
  ],
  "30d": [
    {
      title: "Total saved",
      value: "13.5",
      colorVar: KPI_COLORS.total,
      spark: [0.5, 3.1, 6.7, 9.8, 12.0, 13.1, 13.5],
    },
    {
      title: "Caching",
      value: "0.14",
      colorVar: KPI_COLORS.caching,
      spark: [0.0, 0.02, 0.05, 0.08, 0.11, 0.13, 0.14],
    },
    {
      title: "Compression",
      value: "13.4",
      colorVar: KPI_COLORS.compression,
      spark: [0.5, 2.9, 6.3, 9.5, 11.7, 13.0, 13.4],
    },
  ],
};

// Delta = change across the displayed window (last point − first point), so the
// tag can never contradict the sparkline. Sub-1-point moves keep 2 decimals
// (caching), larger moves 1 decimal. Always a percentage-point delta.
export function sparkDelta(spark: number[]): string {
  const d = spark[spark.length - 1] - spark[0];
  const decimals = Math.abs(d) < 1 ? 2 : 1;
  return `${d >= 0 ? "+" : "-"}${Math.abs(d).toFixed(decimals)}%`;
}

// Sparkline density + tooltip dates. The KPI sparklines are illustrative
// trends (authored as 7 points) with no real timestamps. We resample each onto
// a denser, range-appropriate set of stops (the line is linear, so this only
// adds hover points without changing its shape) and derive evenly-spaced bucket
// dates ending at the mock "today" — the values stay illustrative.
export const SPARK_STOPS: Record<PresetRange, number> = {
  all: 7,
  "24h": 12, // one stop per 2-hour block
  "7d": 7, // one stop per day
  "30d": 14,
};
// Step per stop, in the range's native unit (hours for 24h, days otherwise).
export const SPARK_STEP: Record<PresetRange, number> = {
  all: 1, // months
  "24h": 2, // hours
  "7d": 1, // days
  "30d": 2, // days
};
// Sparkline axis anchor = the demo clock's "now". Consumers copy this Date
// before stepping it back; never mutate it in place.
export const SPARK_TODAY = DEMO_NOW;

// Resample an authored trend onto `count` evenly-spaced stops via linear
// interpolation. Endpoints are preserved exactly; intermediate stops sit on the
// existing line segments, rounded to 2 decimals.
export function resampleSpark(values: number[], count: number): number[] {
  if (count <= values.length) {
    return [...values];
  }
  const last = values.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const pos = (i / (count - 1)) * last;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, last);
    const v = values[lo] + (values[hi] - values[lo]) * (pos - lo);
    return Math.round(v * 100) / 100;
  });
}

export function sparkDates(range: PresetRange, count: number): string[] {
  const step = SPARK_STEP[range];
  return Array.from({ length: count }, (_, i) => {
    const stepsBack = count - 1 - i;
    const d = new Date(SPARK_TODAY);
    if (range === "24h") {
      d.setHours(d.getHours() - stepsBack * step);
    } else if (range === "all") {
      d.setMonth(d.getMonth() - stepsBack * step);
    } else {
      d.setDate(d.getDate() - stepsBack * step);
    }
    return formatSparkLabel(d, range === "24h");
  });
}
