import { formatSparkLabel } from "@/lib/formatters";
import type { CustomRange, HeroView, RangeKey } from "./types";

/* ─── Hero metric (REQUESTS / range + line chart + breakdown) ────────────── */

// Deterministic LCG-seeded bucket generator. At low totals (48 / 468 /
// 2,248) the output stays spiky and sparse — many empty buckets, a few
// clear spikes — instead of smoothing into a curve. Seeded per range so
// the chart is stable across renders.
function makeHeroBuckets(
  count: number,
  totalTarget: number,
  shape: "daily" | "weekly" | "monthly",
  seed: number
): number[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 0xff_ff_ff_ff;
  };
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    let base: number;
    if (shape === "daily") {
      base = 0.15 + 0.85 * Math.exp(-(((t - 0.55) * 2.2) ** 2));
    } else if (shape === "weekly") {
      const day = (t * 7) % 1;
      const dailyShape = 0.15 + 0.85 * Math.exp(-(((day - 0.55) * 2.2) ** 2));
      const dayIndex = Math.floor(t * 7);
      const weekend = dayIndex >= 5 ? 0.5 : 1.0;
      base = dailyShape * weekend;
    } else {
      const day = (t * 30) % 1;
      const dailyShape = 0.2 + 0.8 * Math.exp(-(((day - 0.55) * 2.2) ** 2));
      const trend = 0.6 + 0.8 * t;
      const dayIndex = Math.floor(t * 30);
      const weekend = dayIndex % 7 >= 5 ? 0.55 : 1.0;
      base = dailyShape * trend * weekend;
    }
    const r = rand();
    // Always-positive trace: low rolls get a small baseline ripple
    // instead of flat zero, mid rolls get small bumps, high rolls get
    // clear spikes. Prevents the chart from sitting on the x-axis for
    // long stretches at views where zero-volume is implausible.
    const spike =
      r > 0.9 ? 1 + r * 3 : r > 0.55 ? 0.4 + r * 0.6 : 0.15 + r * 0.2;
    weights.push(base * spike);
  }
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const rounded = weights.map((w) =>
    Math.max(0, Math.round((w / sumW) * totalTarget))
  );

  // Floor pass: if the average bucket count is >= 1, no bucket should
  // round to 0 — at that volume, "zero requests in this window" reads as
  // a data error, not a quiet period. Bump each zero to 1 and decrement
  // the tallest bucket to keep the total stable. Skipped for low-volume
  // views (e.g. 24H 15-min buckets) where zeros are realistic.
  const avg = totalTarget / count;
  if (avg >= 1) {
    for (let i = 0; i < rounded.length; i++) {
      if (rounded[i] === 0) {
        let maxIdx = 0;
        for (let j = 1; j < rounded.length; j++) {
          if (rounded[j] > rounded[maxIdx]) {
            maxIdx = j;
          }
        }
        if (rounded[maxIdx] > 1) {
          rounded[maxIdx]--;
          rounded[i] = 1;
        }
      }
    }
  }
  return rounded;
}

// Anchor "now" for the mock = May 12 14:30 (today's date in fixtures).
// Stable constant — never use `new Date()` here, the chart must not drift
// across renders or test runs.
const ANCHOR = { month: 4 /* May, 0-indexed */, day: 12, hour: 14, minute: 30 };
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Compute a date `minutesAgo` before the anchor, returning month/day/hour/minute.
function minutesBeforeAnchor(minutesAgo: number): {
  month: number;
  day: number;
  hour: number;
  minute: number;
  date: Date;
} {
  // Use Date arithmetic with year 2026 as scaffolding only — we read the
  // calendar fields back out, never the year. This handles month boundaries
  // (e.g. Apr ↔ May) correctly without a hand-rolled days-per-month table.
  const d = new Date(
    2026,
    ANCHOR.month,
    ANCHOR.day,
    ANCHOR.hour,
    ANCHOR.minute
  );
  d.setMinutes(d.getMinutes() - minutesAgo);
  return {
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    date: d,
  };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

// Derive axis ticks from REAL data points at evenly-spaced indices, so every
// tick value exactly matches a data-point `time` string. recharts only renders
// a tick from an explicit `ticks` array when the value matches a data point;
// hardcoding "nice" values (e.g. midnight "May 12 00:00") that never occur in
// the 6h-bucket data (hours land on 14/08/02/20, never 00) renders zero ticks.
// Picking real data points guarantees they show. First and last data points are
// always included; the XAxis then width-thins via interval="preserveStartEnd".
function deriveTicks(data: { time: string }[], tickCount = 7): string[] {
  const n = data.length;
  if (n === 0) {
    return [];
  }
  const count = Math.min(tickCount, Math.max(2, n));
  const ticks: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i * (n - 1)) / (count - 1));
    const t = data[idx]?.time;
    if (t && !ticks.includes(t)) {
      ticks.push(t);
    }
  }
  return ticks;
}

// ── All-time view (240 × 6-hour buckets ≈ 60-day lifetime window) ─────────
// The widest preset: the lifetime cumulative request volume for this mock
// account. Sits above 30D — same 6-hour bucketing as 30D extended back to
// ~60 days. `HERO_ALL_TOTAL` (4,860) is the single source of truth for
// the all-time total; the breakdown and table pagination derive from it.
const HERO_ALL_TOTAL = 4860;
const HERO_ALL_BUCKETS = makeHeroBuckets(
  240,
  HERO_ALL_TOTAL,
  "monthly",
  0xa1_1d_ca_fe
);
const HERO_ALL_DATA = HERO_ALL_BUCKETS.map((requests, i) => {
  // Bucket 239 = current 6h window (anchor); bucket 0 = 239*6h earlier.
  const minutesAgo = (239 - i) * 360;
  const { month, day, hour, date } = minutesBeforeAnchor(minutesAgo);
  return {
    time: `${MONTH_NAMES[month]} ${day} ${pad2(hour)}:00`,
    label: formatSparkLabel(date, true),
    requests,
  };
});
const HERO_ALL_TICKS = deriveTicks(HERO_ALL_DATA);

// ── 24H view (96 × 15-minute buckets) ─────────────────────────────────────
const HERO_24H_BUCKETS = makeHeroBuckets(96, 48, "daily", 0xc5_7e_11_a7);
const HERO_24H_DATA = HERO_24H_BUCKETS.map((requests, i) => {
  // Bucket 0 = 14:30 yesterday; bucket 95 = 14:15 today (15-min buckets).
  const minutesAgo = (95 - i) * 15;
  const { hour, minute, date } = minutesBeforeAnchor(minutesAgo);
  return {
    time: `${pad2(hour)}:${pad2(minute)}`,
    label: formatSparkLabel(date, true),
    requests,
  };
});
const HERO_24H_TICKS = deriveTicks(HERO_24H_DATA, 6);

// ── 7D view (168 × 1-hour buckets) ────────────────────────────────────────
const HERO_7D_BUCKETS = makeHeroBuckets(168, 468, "weekly", 0x7d_c0_ff_ee);
const HERO_7D_DATA = HERO_7D_BUCKETS.map((requests, i) => {
  // Bucket 167 = current hour (14:00 today); bucket 0 = 167h before that.
  const minutesAgo = (167 - i) * 60;
  const { month, day, hour, date } = minutesBeforeAnchor(minutesAgo);
  return {
    time: `${MONTH_NAMES[month]} ${day} ${pad2(hour)}:00`,
    label: formatSparkLabel(date, true),
    requests,
  };
});
const HERO_7D_TICKS = deriveTicks(HERO_7D_DATA);

// ── 30D view (120 × 6-hour buckets) ───────────────────────────────────────
const HERO_30D_BUCKETS = makeHeroBuckets(120, 2248, "monthly", 0x30_dc_af_e0);
const HERO_30D_DATA = HERO_30D_BUCKETS.map((requests, i) => {
  // Bucket 119 = current 6h window (anchor); bucket 0 = 119*6h earlier.
  const minutesAgo = (119 - i) * 360;
  const { month, day, hour, date } = minutesBeforeAnchor(minutesAgo);
  return {
    time: `${MONTH_NAMES[month]} ${day} ${pad2(hour)}:00`,
    label: formatSparkLabel(date, true),
    requests,
  };
});
const HERO_30D_TICKS = deriveTicks(HERO_30D_DATA);

export const HERO_VIEWS: Record<RangeKey, HeroView> = {
  all: {
    eyebrow: "MESSAGES",
    total: HERO_ALL_TOTAL,
    // Two disjoint buckets summing to total: Success (HTTP-success, slow
    // and fast pooled) + Errors. Slow rows display Status = Success in the
    // table per CTO direction (2026-05-20); the breakdown rolls slow into
    // Success accordingly so Total = Success + Errors (4,730 + 130 = 4,860).
    // The Latency-cell TriangleAlert is the surface for spotting slow rows.
    success: 4730,
    errors: 130,
    delta: "+18.2%",
    deltaNote: "All time",
    data: HERO_ALL_DATA,
    ticks: HERO_ALL_TICKS,
    bucketLabel: "Messages/6h",
    domainTop: Math.max(...HERO_ALL_BUCKETS, 1) + 1,
  },
  "24h": {
    eyebrow: "MESSAGES",
    total: 48,
    success: 46,
    errors: 2,
    delta: "+8.2%",
    deltaNote: "vs prior day",
    data: HERO_24H_DATA,
    ticks: HERO_24H_TICKS,
    bucketLabel: "Messages/15m",
    domainTop: Math.max(...HERO_24H_BUCKETS, 1) + 1,
  },
  "7d": {
    eyebrow: "MESSAGES",
    total: 468,
    success: 455,
    errors: 13,
    delta: "+5.4%",
    deltaNote: "vs prior week",
    data: HERO_7D_DATA,
    ticks: HERO_7D_TICKS,
    bucketLabel: "Messages/hr",
    domainTop: Math.max(...HERO_7D_BUCKETS, 1) + 1,
  },
  "30d": {
    eyebrow: "MESSAGES",
    total: 2248,
    success: 2188,
    errors: 60,
    delta: "+14.6%",
    deltaNote: "vs prior month",
    data: HERO_30D_DATA,
    ticks: HERO_30D_TICKS,
    bucketLabel: "Messages/6h",
    domainTop: Math.max(...HERO_30D_BUCKETS, 1) + 1,
  },
  // Placeholder. HeroMetricCard derives the real `'custom'` view from
  // the active customRange via useMemo — the static entry exists only
  // so the `Record<RangeKey, HeroView>` type is total.
  custom: {
    eyebrow: "MESSAGES",
    total: 0,
    success: 0,
    errors: 0,
    delta: "+0.0%",
    deltaNote: "vs prior range",
    data: [],
    ticks: [],
    bucketLabel: "Messages/hr",
    domainTop: 1,
  },
};

/** Synthesize a HeroView for an arbitrary user-picked range. Mock-only:
 *  scales the total off a ~80 req/hr base rate, reuses the weekly LCG
 *  bucket generator so the chart stays spiky and seeded (no drift across
 *  renders), and picks a bucket label proportional to range length. */
export function buildCustomHeroView(custom: CustomRange | null): HeroView {
  if (!custom) {
    return HERO_VIEWS["custom"];
  }

  const ms = custom.to.getTime() - custom.from.getTime();
  // `+1` so a same-day range still spans one bucket / one tick instead of zero.
  const hours = Math.max(1, Math.round(ms / 36e5) + 1);
  // Pick bucket count: hourly buckets for short windows, 6h buckets for long ones.
  // Brief asks `clamp(hoursInRange, 24, 168)` for the count itself when hourly.
  const useHourly = hours <= 7 * 24;
  const bucketSizeHours = useHourly ? 1 : 6;
  const bucketCount = Math.max(
    24,
    Math.min(168, Math.ceil(hours / bucketSizeHours))
  );

  // ~80 req/hr base rate × hours-in-range, rounded down to a tidy number.
  const rawTotal = 80 * hours;
  const total = Math.max(1, Math.round(rawTotal / 10) * 10);

  const buckets = makeHeroBuckets(bucketCount, total, "weekly", 0xca_fe_f0_0d);

  // Build per-bucket data points anchored at custom.from.
  const data = buckets.map((requests, i) => {
    const bucketStart = new Date(custom.from);
    bucketStart.setHours(bucketStart.getHours() + i * bucketSizeHours);
    const m = bucketStart.getMonth();
    const d = bucketStart.getDate();
    const hh = pad2(bucketStart.getHours());
    return {
      time: `${MONTH_NAMES[m]} ${d} ${hh}:00`,
      label: formatSparkLabel(bucketStart, true),
      requests,
    };
  });

  // Up-to-7 evenly spaced ticks from real data points (the axis renderer
  // strips the trailing " HH:00" segment down to "Mon D"). Same derivation as
  // the preset views, so tick values always match a data point and render.
  const ticks = deriveTicks(data);

  // Two disjoint buckets summing to total: Success (HTTP-success, slow
  // and fast pooled) + Errors. ~1% errors, remainder success. Slow rows
  // are no longer broken out in the breakdown per CTO direction
  // (2026-05-20); they're still flagged per-row via the latency cell.
  const errors = Math.max(0, Math.round(total * 0.01));
  const success = Math.max(0, total - errors);

  return {
    eyebrow: "MESSAGES",
    total,
    success,
    errors,
    delta: "+0.0%",
    deltaNote: "vs prior range",
    data,
    ticks,
    bucketLabel: bucketSizeHours === 1 ? "Messages/hr" : "Messages/6h",
    domainTop: Math.max(...buckets, 1) + 1,
  };
}
