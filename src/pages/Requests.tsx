import { CreditCard, Info, KeyRound, TriangleAlert } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DeltaTag } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/ui/page-title";
import { RowActionButton } from "@/components/ui/row-action-button";
import { SearchInput } from "@/components/ui/search-input";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontalIcon } from "@/components/ui/sliders-horizontal";
import { StatusDot } from "@/components/ui/status-dot";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadIcon } from "@/components/ui/upload";
import { isByokKey, REQUEST_ROWS_ALL, requestRowId } from "@/data/requests";
import type {
  CustomRange,
  HeroView,
  RangeKey,
  RequestRow,
} from "./requests/types";

// Re-export for external importers of `@/pages/Requests`.
export type { RequestRow } from "./requests/types";

import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatSparkLabel } from "@/lib/formatters";
import {
  conversationTitle,
  GUARDRAIL_BADGE,
  MODEL_FILTER_OPTIONS,
  RANGE_OPTIONS,
  RANGE_ROWS,
  requestSortValue,
  responseLabel,
  responseVariant,
} from "./requests/data";
import { RequestDetailDialog } from "./requests/RequestDetailModal";

/* CMP-013 — Requests (Observability) */

export function Requests() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Range state lifted from RequestsTableSection so PageHeader can also
  // drive it (the data selector + Custom range button live in the top-
  // right page-header chrome now). rangeStore stays the single source of
  // truth for HeroMetricCard and other useRange()/useCustomRange()
  // subscribers — the effects below keep it in lockstep.
  // Defaults to `all` on load — the intended landing state for every
  // page's range selector (matches the Events page).
  const [range, setRange] = useState<RangeKey>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  // Hydrate the store with the initial state once on mount. After that
  // the handlers below keep the store in lockstep — no effect-as-event.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only store hydration; later changes flow through the handlers, not this effect
  useEffect(() => {
    rangeStore.set(range);
    rangeStore.setCustom(customRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = (next: RangeKey) => {
    setRange(next);
    setCustomRange(null);
    rangeStore.set(next);
    rangeStore.setCustom(null);
  };
  const handleCustomRangeChange = (next: CustomRange | null) => {
    if (next) {
      setCustomRange(next);
      setRange("custom");
      rangeStore.set("custom");
      rangeStore.setCustom(next);
    } else {
      setCustomRange(null);
      setRange("all");
      rangeStore.set("all");
      rangeStore.setCustom(null);
    }
  };

  return (
    <DashboardChrome
      activeNavId="requests"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      {/* Overview label + range controls group with the hero card
              (gap-4 internal) rather than floating equidistant between
              sections — the chrome content pane spaces its direct children
              at gap-6, so wrapping the bar + card in one tighter-gapped
              child reads the "Overview" heading as the label FOR the card it
              sits above. Mirrors AuditTrail's OverviewBar + KPI rail. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedPill
              onValueChange={(next) => handleRangeChange(next as RangeKey)}
              options={RANGE_OPTIONS}
              size="sm"
              // Empty string when a custom range is active so no preset
              // reads as selected — see segmented-pill internal notes for
              // why empty string deselects all items.
              value={range === "custom" ? "" : range}
            />
            <DateRangePicker
              onChange={handleCustomRangeChange}
              size="sm"
              value={customRange}
            />
          </div>
        </div>
        <HeroMetricCard />
      </div>
      <RequestsTableSection customRange={customRange} range={range} />
    </DashboardChrome>
  );
}

/* ─── Page header (title + range selector + custom date) ──────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-1/2 flex-col gap-2">
        {/* h2 — see CMP012 PageHeader note. */}
        <PageTitle>Messages</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Every model call across your stack, inspected for injection, PII, and
          credentials before it reaches the model.
        </p>
      </div>
    </div>
  );
}

/* ─── Hero metric (REQUESTS / range + line chart + breakdown) ────────────── */

// Module-scoped range store. RequestsTableSection writes via the existing
// SegmentedPill onValueChange; HeroMetricCard subscribes via useRange().
// This keeps Requests() untouched (no state lifting) and avoids a context
// Provider mismatch (Hero and Table are siblings, not ancestor/descendant).
const rangeStore = {
  current: "all" as RangeKey,
  // Populated alongside `current = 'custom'` when the user applies a
  // custom range. Reading both from a single store keeps Hero and Table
  // pinned to the same source of truth.
  customRange: null as CustomRange | null,
  listeners: new Set<() => void>(),
  set(next: RangeKey) {
    this.current = next;
    this.listeners.forEach((l) => {
      l();
    });
  },
  setCustom(next: CustomRange | null) {
    this.customRange = next;
    this.listeners.forEach((l) => {
      l();
    });
  },
  subscribe(l: () => void) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  },
};

function useRange(): RangeKey {
  return useSyncExternalStore(
    (cb) => rangeStore.subscribe(cb),
    () => rangeStore.current,
    () => rangeStore.current
  );
}

function useCustomRange(): CustomRange | null {
  return useSyncExternalStore(
    (cb) => rangeStore.subscribe(cb),
    () => rangeStore.customRange,
    () => rangeStore.customRange
  );
}

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
const HERO_ALL_TICKS = [
  "Mar 14 00:00",
  "Mar 24 00:00",
  "Apr 3 00:00",
  "Apr 13 00:00",
  "Apr 23 00:00",
  "May 3 00:00",
  "May 12 00:00",
];

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
const HERO_24H_TICKS = ["15:00", "20:00", "01:00", "06:00", "11:00", "14:30"];

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
const HERO_7D_TICKS = [
  "May 6 00:00",
  "May 7 00:00",
  "May 8 00:00",
  "May 9 00:00",
  "May 10 00:00",
  "May 11 00:00",
  "May 12 00:00",
];

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
const HERO_30D_TICKS = [
  "Apr 13 00:00",
  "Apr 18 00:00",
  "Apr 23 00:00",
  "Apr 28 00:00",
  "May 3 00:00",
  "May 8 00:00",
  "May 12 00:00",
];

const HERO_VIEWS: Record<RangeKey, HeroView> = {
  all: {
    eyebrow: "REQUESTS",
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
    bucketLabel: "Requests/6h",
    domainTop: Math.max(...HERO_ALL_BUCKETS, 1) + 1,
  },
  "24h": {
    eyebrow: "REQUESTS",
    total: 48,
    success: 46,
    errors: 2,
    delta: "+8.2%",
    deltaNote: "vs prior day",
    data: HERO_24H_DATA,
    ticks: HERO_24H_TICKS,
    bucketLabel: "Requests/15m",
    domainTop: Math.max(...HERO_24H_BUCKETS, 1) + 1,
  },
  "7d": {
    eyebrow: "REQUESTS",
    total: 468,
    success: 455,
    errors: 13,
    delta: "+5.4%",
    deltaNote: "vs prior week",
    data: HERO_7D_DATA,
    ticks: HERO_7D_TICKS,
    bucketLabel: "Requests/hr",
    domainTop: Math.max(...HERO_7D_BUCKETS, 1) + 1,
  },
  "30d": {
    eyebrow: "REQUESTS",
    total: 2248,
    success: 2188,
    errors: 60,
    delta: "+14.6%",
    deltaNote: "vs prior month",
    data: HERO_30D_DATA,
    ticks: HERO_30D_TICKS,
    bucketLabel: "Requests/6h",
    domainTop: Math.max(...HERO_30D_BUCKETS, 1) + 1,
  },
  // Placeholder. HeroMetricCard derives the real `'custom'` view from
  // the active customRange via useMemo — the static entry exists only
  // so the `Record<RangeKey, HeroView>` type is total.
  custom: {
    eyebrow: "REQUESTS",
    total: 0,
    success: 0,
    errors: 0,
    delta: "+0.0%",
    deltaNote: "vs prior range",
    data: [],
    ticks: [],
    bucketLabel: "Requests/hr",
    domainTop: 1,
  },
};

/** Synthesize a HeroView for an arbitrary user-picked range. Mock-only:
 *  scales the total off a ~80 req/hr base rate, reuses the weekly LCG
 *  bucket generator so the chart stays spiky and seeded (no drift across
 *  renders), and picks a bucket label proportional to range length. */
function buildCustomHeroView(custom: CustomRange | null): HeroView {
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

  // 4–7 evenly spaced ticks from start to end, formatted "Mon D" (the
  // existing axis renderer strips the trailing " HH:00" segment).
  const tickCount = Math.min(7, Math.max(4, Math.min(bucketCount, 7)));
  const ticks: string[] = [];
  for (let i = 0; i < tickCount; i++) {
    const t = Math.round((i * (bucketCount - 1)) / (tickCount - 1));
    ticks.push(data[t]?.time ?? "");
  }

  // Two disjoint buckets summing to total: Success (HTTP-success, slow
  // and fast pooled) + Errors. ~1% errors, remainder success. Slow rows
  // are no longer broken out in the breakdown per CTO direction
  // (2026-05-20); they're still flagged per-row via the latency cell.
  const errors = Math.max(0, Math.round(total * 0.01));
  const success = Math.max(0, total - errors);

  return {
    eyebrow: "REQUESTS",
    total,
    success,
    errors,
    delta: "+0.0%",
    deltaNote: "vs prior range",
    data,
    ticks,
    bucketLabel: bucketSizeHours === 1 ? "Requests/hr" : "Requests/6h",
    domainTop: Math.max(...buckets, 1) + 1,
  };
}

function ChartXAxisTick(props: {
  x: string | number;
  y: string | number;
  payload: { value: string };
  firstTick: string;
  lastTick: string;
}) {
  const { x, y, payload, firstTick, lastTick } = props;
  const value = payload.value;
  const spaceIdx = value.indexOf(" ");
  const display =
    spaceIdx === -1 ? value : value.slice(0, value.lastIndexOf(" "));
  const anchor =
    value === firstTick ? "start" : value === lastTick ? "end" : "middle";
  return (
    <text
      dy="0.71em"
      fill="var(--color-neutral-500)"
      fontSize={11}
      textAnchor={anchor}
      x={x}
      y={y}
    >
      {display}
    </text>
  );
}

function HeroMetricCard() {
  const range = useRange();
  const customRange = useCustomRange();
  // Custom view is synthesized on the fly so the chart, headline number
  // and breakdown stay coherent with whatever range the user picked.
  // The four preset views remain static (cheap; no recompute on render).
  const customView = useMemo<HeroView>(
    () => buildCustomHeroView(customRange),
    [customRange]
  );
  const view = range === "custom" ? customView : HERO_VIEWS[range];
  const config = {
    requests: {
      label: view.bucketLabel,
      color: "var(--color-chart-1)",
    },
  } satisfies ChartConfig;
  const firstTick = view.ticks[0];
  const lastTick = view.ticks[view.ticks.length - 1];
  const renderTick = useCallback(
    (tickProps: {
      x: string | number;
      y: string | number;
      payload: { value: string };
    }) => (
      <ChartXAxisTick
        {...tickProps}
        firstTick={firstTick}
        lastTick={lastTick}
      />
    ),
    [firstTick, lastTick]
  );

  return (
    <Card className="px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex shrink-0 flex-col gap-2">
          <Eyebrow>{view.eyebrow}</Eyebrow>
          <div className="flex items-baseline gap-3">
            <HeroNumeric size="lg">{view.total.toLocaleString()}</HeroNumeric>
            <DeltaTag delta={view.delta} note={view.deltaNote} size="md" />
          </div>
        </div>

        {/* Right-aligned mono breakdown — grid (not stacked flex) so the
            rows share the same label / dot / value column tracks. Each
            BreakdownRow returns three grid cells; the dot column is
            fixed-width so dots align across rows regardless of label or
            value length. Slow row removed 2026-05-20 per CTO direction:
            slow successes now roll into Success so Success + Errors =
            Total reconciles; surface for slow is the latency cell. */}
        <div className="grid shrink-0 grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-2">
          <BreakdownRow
            label="Success"
            tone="success"
            value={view.success.toLocaleString()}
          />
          <BreakdownRow
            label="Errors"
            tone="danger"
            value={view.errors.toLocaleString()}
          />
        </div>
      </div>

      {/* Full-width line chart with range-aware axis + per-point tooltip */}
      <ChartContainer className="aspect-auto h-24 w-full" config={config}>
        <AreaChart
          accessibilityLayer
          data={view.data}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cmp013-hero-spark" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-chart-1)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-chart-1)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          {/* Dynamic domain: top is `max(values) + 1` so the tallest
              spike never touches the chart ceiling and the y-axis
              scales with whatever data the gateway is producing. */}
          <YAxis
            axisLine={false}
            domain={[0, view.domainTop]}
            tick={false}
            tickLine={false}
            width={0}
          />
          {/* Dashed horizontal gridlines — matches the Security events chart. */}
          <CartesianGrid
            horizontal
            stroke="var(--color-neutral-200)"
            strokeDasharray="8 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="time"
            height={24}
            interval={0}
            tick={renderTick}
            tickLine={false}
            tickMargin={8}
            ticks={view.ticks}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="gap-1"
                formatter={(value) => (
                  <span className="type-label-14 text-foreground">
                    {Number(value).toLocaleString("en-US")}
                  </span>
                )}
                hideIndicator
                labelClassName="font-normal text-muted-foreground"
                labelFormatter={(_label, items) =>
                  (items?.[0]?.payload as { label?: string } | undefined)
                    ?.label ?? ""
                }
              />
            }
            cursor={{
              stroke: "var(--color-neutral-500)",
              strokeDasharray: "3 3",
            }}
          />
          <Area
            dataKey="requests"
            fill="url(#cmp013-hero-spark)"
            isAnimationActive={false}
            stroke="var(--color-chart-1)"
            strokeWidth={1.5}
            type="linear"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}

function BreakdownRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "warning";
}) {
  // Returns three grid cells (no wrapper element). Parent is a 3-col grid
  // so dots and values align across rows. `justify-self-end` right-aligns
  // text-flow cells within their tracks.
  return (
    <>
      <span className="type-label-12 justify-self-end text-muted-foreground tracking-tight">
        {label}
      </span>
      <StatusDot kind={tone} />
      <span className="justify-self-end font-medium font-mono text-foreground text-xs tabular-nums">
        {value}
      </span>
    </>
  );
}

/* ─── Table section (toolbar + table in one card · pagination below) ─────
 *
 * Shape lifted from CMP-011.1 (SORTABLE TABLE):
 *   <div rounded-sm bg-white border …>      ← single card
 *     <toolbar>                              ← search · segmented · selects
 *     <Table>                                ← header + rows
 *   </div>
 *   <pagination footer>                      ← sibling, sits in the gray well
 *
 * Holding the toolbar and table together inside one rounded card keeps
 * the SORTABLE TABLE rhythm (same border, same divider between toolbar
 * and header). Pagination becomes a sibling so the gray well shows
 * through the rows-per-page / page-nav strip — matches the reference. */

/* ─── Requests log table ─────────────────────────────────────────────────── */

function RequestsTableSection({
  range,
  customRange,
}: {
  range: RangeKey;
  customRange: CustomRange | null;
}) {
  // Looked up per render. Pill change → new rows + new total; page resets
  // so a deep-paged All state doesn't carry over into a 24H view that
  // doesn't have those pages. When the user picks a custom range, the
  // total comes from buildCustomHeroView so the pagination footer stays
  // in lock-step with the hero card's headline number.
  const rows = RANGE_ROWS[range] ?? REQUEST_ROWS_ALL;
  const [model, setModel] = useState("all");
  const [keyId, setKeyId] = useState("all");
  // Response + guardrail filters are independent (split out of the single
  // status filter per CTO direction). 'slow' in the response filter is an
  // alias for `row.slow === true` rather than a status value.
  const [responseFilter, setResponseFilter] = useState("all");
  const [guardrailFilter, setGuardrailFilter] = useState("all");
  // PROTOTYPE — Filters dialog. Collapses the four section-header
  // dropdowns (Model/Key/Response/Guardrail) into one modal Dialog to
  // de-cram the toolbar row; the modal gives each Select room to breathe.
  // Reversible: drop this state, restore the inline <Select>s, remove the
  // Filters Dialog block and the SlidersHorizontalIcon import.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    model,
    keyId,
    responseFilter,
    guardrailFilter,
  ].filter((v) => v !== "all").length;
  // Staged-Apply drafts. The modal's <Select>s bind to these, never to the
  // committed state, so changing a select doesn't touch the table. Drafts
  // re-sync from committed every time the modal opens (see effect below), so
  // an abandoned draft (Cancel / X / Esc / overlay) never leaks into a later
  // open. Apply commits draft → committed; Cancel just closes.
  const [draftModel, setDraftModel] = useState("all");
  const [draftKeyId, setDraftKeyId] = useState("all");
  const [draftResponseFilter, setDraftResponseFilter] = useState("all");
  const [draftGuardrailFilter, setDraftGuardrailFilter] = useState("all");
  const draftActiveFilterCount = [
    draftModel,
    draftKeyId,
    draftResponseFilter,
    draftGuardrailFilter,
  ].filter((v) => v !== "all").length;
  // Seed draft ← committed in the open handler (opening is a user event, not
  // derived state). Committed filters can't change while the modal is open
  // (Apply closes it), so this is the only moment a re-seed is needed —
  // avoids the redundant double-render an effect would cause on every open.
  const openFilters = useCallback(() => {
    setDraftModel(model);
    setDraftKeyId(keyId);
    setDraftResponseFilter(responseFilter);
    setDraftGuardrailFilter(guardrailFilter);
    setFiltersOpen(true);
  }, [model, keyId, responseFilter, guardrailFilter]);
  // Reset clears the DRAFT only (staged); committed state is untouched until
  // Apply.
  const resetFilters = useCallback(() => {
    setDraftModel("all");
    setDraftKeyId("all");
    setDraftResponseFilter("all");
    setDraftGuardrailFilter("all");
  }, []);
  const applyFilters = useCallback(() => {
    setModel(draftModel);
    setKeyId(draftKeyId);
    setResponseFilter(draftResponseFilter);
    setGuardrailFilter(draftGuardrailFilter);
    setFiltersOpen(false);
  }, [draftModel, draftKeyId, draftResponseFilter, draftGuardrailFilter]);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  const pageScopeKey =
    range === "custom"
      ? `${range}:${customRange?.from.getTime() ?? "none"}:${customRange?.to.getTime() ?? "none"}`
      : range;
  const [paging, setPaging] = useState<{ scopeKey: string; page: number }>(
    () => ({
      scopeKey: pageScopeKey,
      page: 1,
    })
  );
  const page = paging.scopeKey === pageScopeKey ? paging.page : 1;
  const setPage = useCallback(
    (next: number) => {
      setPaging({ scopeKey: pageScopeKey, page: next });
    },
    [pageScopeKey]
  );
  // Row-click drill-in now navigates to the /requests-findings/:id page
  // (URL-addressable, shareable, multi-tab — the GitHub model). The modal
  // below is kept for `?open=` deep-links (e.g. Security events) but is no
  // longer the row-click target.
  const navigate = useNavigate();
  const openRow = (row: RequestRow) =>
    navigate(`/requests-findings/${requestRowId(row)}`);

  // `selectedRow` still drives the (stored) modal for `?open=` deep-links.
  const [selectedRow, setSelectedRow] = useState<RequestRow | null>(null);

  // Deep-link support: ?open=req_* opens the matching row's modal. Mirrors
  // the Conversations page pattern — a useState guard (prevOpenId) gates the
  // sync so the effect is URL-driven, not state-driven. Without the guard,
  // closing the modal (which clears selectedRow) and the URL strip (which
  // happens in onOpenChangeComplete) race on different renders and the modal
  // re-opens itself.
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const [prevOpenId, setPrevOpenId] = useState<string | null>(null);
  if (openId !== prevOpenId) {
    setPrevOpenId(openId);
    if (openId) {
      const match = REQUEST_ROWS_ALL.find((r) => r.requestId === openId);
      if (match) {
        setSelectedRow(match);
      }
    }
  }

  // Two independent filters, ANDed. `slow` in the response filter is the
  // facet alias (matches `row.slow === true`); the other values match
  // `row.status` directly. Guardrail filter matches `row.guardrail`.
  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const matchesResponse =
          responseFilter === "all"
            ? true
            : responseFilter === "slow"
              ? r.slow === true
              : r.status === responseFilter;
        const matchesGuardrail =
          guardrailFilter === "all" ? true : r.guardrail === guardrailFilter;
        const matchesModel = model === "all" ? true : r.model === model;
        const matchesKey = keyId === "all" ? true : r.keyId === keyId;
        return (
          matchesResponse && matchesGuardrail && matchesModel && matchesKey
        );
      }),
    [rows, responseFilter, guardrailFilter, model, keyId]
  );

  // Click-to-sort on column headers. No sort by default → rows stay in their
  // authored (chronological) order; picking a column sorts client-side.
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, requestSortValue),
    [filteredRows, sort]
  );

  // Page the visible rows by the footer's rows-per-page selector. Without this
  // the table rendered every row and the 10/25/50/100 control did nothing.
  const perPage = Number(rowsPerPage) || sortedRows.length || 1;
  const pagedRows = useMemo(
    () =>
      sortedRows.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
    [sortedRows, page, perPage]
  );

  const isEmpty = filteredRows.length === 0;

  return (
    <>
      <div className="mt-2 flex flex-col gap-4">
        {/* Recent requests — section header on the page background, mirroring
          AuditTrail's EventLog. The search + filter set live here as
          page-level section controls, so they always render (a query that
          returns zero results never hides them). isEmpty governs only the
          Card interior below. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Recent messages</SectionTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              ariaLabel="Search requests"
              className="min-w-0 flex-1 shrink"
              placeholder="Search request…"
              surface="elevated"
            />

            {/* PROTOTYPE — four section-header filters collapsed into one
              modal Dialog to de-cram the toolbar row. The <Select>s are
              moved verbatim (same value/onValueChange + option lists), each
              laid out as a labeled full-width row with room to breathe.
              Active-count badge on the trigger; Reset clears all four.
              Reversible: restore the inline <Select>s and delete this Dialog. */}
            <Button
              aria-label={
                activeFilterCount > 0
                  ? `Filters (${activeFilterCount} active)`
                  : "Filters"
              }
              className="border-border bg-card font-normal text-foreground"
              onClick={openFilters}
              size="sm"
              type="button"
              variant="outline"
            >
              <SlidersHorizontalIcon
                aria-hidden
                data-icon="inline-start"
                size={16}
              />
              Filters
              {activeFilterCount > 0 ? (
                <Badge
                  aria-hidden
                  className="h-4 min-w-4 justify-center px-1 leading-none"
                >
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
            <Dialog onOpenChange={setFiltersOpen} open={filtersOpen}>
              <DialogContent className="w-full gap-4 sm:max-w-[440px]">
                <DialogHeader>
                  <DialogTitle className="type-heading-18 text-foreground">
                    Filters
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">
                    Model
                  </Label>
                  <Select onValueChange={setDraftModel} value={draftModel}>
                    <SelectTrigger
                      aria-label="Model"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-model"
                    >
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All models</SelectItem>
                      {MODEL_FILTER_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <VendorAvatar decorative vendor={m.vendor} />
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">Key</Label>
                  <Select onValueChange={setDraftKeyId} value={draftKeyId}>
                    <SelectTrigger
                      aria-label="Key"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-key"
                    >
                      <SelectValue placeholder="Key" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All keys</SelectItem>
                      <SelectItem value="prod-web">prod-web</SelectItem>
                      <SelectItem value="prod-agent">prod-agent</SelectItem>
                      <SelectItem value="development">development</SelectItem>
                      <SelectItem value="openclaw">openclaw</SelectItem>
                      <SelectItem value="hermes-agent">hermes-agent</SelectItem>
                      <SelectItem value="nova-chat">nova-chat</SelectItem>
                      <SelectItem value="test-key">test-key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">
                    Response
                  </Label>
                  <Select
                    onValueChange={setDraftResponseFilter}
                    value={draftResponseFilter}
                  >
                    <SelectTrigger
                      aria-label="Response"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-response"
                    >
                      <SelectValue placeholder="Response" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All responses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="slow">{"Slow > 10s"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">
                    Guardrail
                  </Label>
                  <Select
                    onValueChange={setDraftGuardrailFilter}
                    value={draftGuardrailFilter}
                  >
                    <SelectTrigger
                      aria-label="Guardrail"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-guardrail"
                    >
                      <SelectValue placeholder="Guardrail" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All guardrails</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="redacted">Redacted</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="sm:justify-between">
                  <Button
                    disabled={draftActiveFilterCount === 0}
                    onClick={resetFilters}
                    type="button"
                    variant="ghost"
                  >
                    Reset
                  </Button>
                  <div className="flex items-center gap-2">
                    <DialogClose
                      render={<Button type="button" variant="outline" />}
                    >
                      Cancel
                    </DialogClose>
                    <Button onClick={applyFilters} type="button">
                      Apply
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              className="ml-auto"
              size="sm"
              type="button"
              variant="outline"
            >
              <UploadIcon aria-hidden data-icon="inline-start" size={16} />
              Export CSV
            </Button>
          </div>
        </div>

        <Card density="flush">
          {isEmpty ? (
            <TableEmptyState
              body="Individual API requests routed through the gateway will appear here."
              title="No requests"
            />
          ) : (
            <>
              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="time"
                    >
                      Time
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="status"
                    >
                      Status
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="guardrail"
                    >
                      Security
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="model"
                    >
                      Model
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="conversation"
                    >
                      Conversation
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="keyId"
                    >
                      Key
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="inTokens"
                    >
                      In
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="outTokens"
                    >
                      Out
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="latency"
                    >
                      Latency
                    </SortableTableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      <span className="inline-flex items-center justify-end gap-1">
                        Cost
                        <Tooltip>
                          <TooltipTrigger
                            render={(props) => (
                              <span
                                {...props}
                                aria-label="About the Cost column"
                                className="-m-1 inline-flex cursor-help rounded-sm p-1 text-muted-foreground hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                              >
                                <Info
                                  aria-hidden
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                              </span>
                            )}
                          />
                          <TooltipContent className="max-w-sm p-2 text-left">
                            <span className="flex flex-col gap-2">
                              <span className="flex items-start gap-2">
                                <span className="flex shrink-0 items-center text-neutral-400 leading-5">
                                  <CreditCard
                                    aria-hidden
                                    className="size-3.5 shrink-0"
                                    strokeWidth={1.75}
                                  />
                                </span>
                                <span>
                                  <span className="font-medium">Gateway</span> -
                                  Billed by Gate AI; shows the exact charge.
                                </span>
                              </span>
                              <span className="flex items-start gap-2">
                                <span className="flex shrink-0 items-center text-neutral-400 leading-5">
                                  <KeyRound
                                    aria-hidden
                                    className="size-3.5 shrink-0"
                                    strokeWidth={1.75}
                                  />
                                </span>
                                <span>
                                  <span className="font-medium">BYOK</span>{" "}
                                  (Bring-your-own-key) - Billed directly by your
                                  provider.
                                </span>
                              </span>
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((row, i) => {
                    const isMissing = row.inTokens === "—";
                    const numericCls = isMissing
                      ? "text-right whitespace-nowrap font-mono tabular-nums text-neutral-400"
                      : "text-right whitespace-nowrap font-mono tabular-nums text-foreground";
                    // Slow rows: leading amber TriangleAlert + neutral-900 (one step
                    // darker than the neutral-800 default). Same weight as non-slow rows
                    // so `tabular-nums` keeps the column tracks aligned — font-medium
                    // would widen the digits and leave the column ragged. The icon
                    // sits in a fixed-width slot reserved on every row (slow or not)
                    // so the digit column stays anchored at the cell's right edge
                    // regardless of slow state — value owns the alignment edge, icon
                    // qualifies it from the left.
                    const isSlow = row.slow && row.latency !== "—";
                    const latencyTextCls =
                      row.latency === "—"
                        ? "text-neutral-400"
                        : isSlow
                          ? "text-foreground"
                          : "text-foreground";
                    const conversationName = conversationTitle(
                      row.conversation
                    );
                    return (
                      <TableRow
                        className="cursor-pointer transition-colors duration-150 ease-out hover-fine:bg-neutral-50 motion-reduce:transition-none"
                        key={`${row.time}-${i}`}
                        // Mouse-only convenience: the keyboard/AT target is the real
                        // <a href> drill-in in the model cell (RowActionButton href).
                        // A <tr> can't legally carry role="button"/tabIndex.
                        onClick={() => openRow(row)}
                      >
                        <TableCell className="w-48 whitespace-nowrap">
                          {/* Absolute timestamp is the primary scan target — relative
                        ("just now", "3h ago") doesn't scale once the table
                        holds hundreds of rows. The relative phrasing lives in
                        a hover tooltip for the moments it's actually useful
                        (recent activity glance). `w-px` is the table-shrink-fit
                        idiom — the cell collapses to the content's intrinsic
                        width and the surrounding columns absorb the freed
                        space; without it the browser pads the column. */}
                          <Tooltip>
                            <TooltipTrigger
                              render={(props) => (
                                <span
                                  {...props}
                                  className="font-mono text-foreground text-sm tabular-nums"
                                >
                                  {row.day}, {row.time}
                                </span>
                              )}
                            />
                            <TooltipContent>{row.relative}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="w-28 whitespace-nowrap">
                          <Badge variant={responseVariant(row)}>
                            {responseLabel(row)}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-28 whitespace-nowrap">
                          <Badge
                            variant={GUARDRAIL_BADGE[row.guardrail].variant}
                          >
                            {row.guardrail}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-60 whitespace-nowrap">
                          <RowActionButton
                            aria-label={`Inspect ${row.code} request to ${row.model} at ${row.time}`}
                            href={`/requests-findings/${requestRowId(row)}`}
                          >
                            <VendorAvatar vendor={row.vendor} />
                            <span
                              className="truncate font-mono text-foreground text-sm"
                              title={row.model}
                            >
                              {row.model}
                            </span>
                          </RowActionButton>
                        </TableCell>
                        <TableCell className="max-w-[320px] whitespace-nowrap">
                          {conversationName ? (
                            <>
                              <span
                                className="type-copy-14 block truncate text-foreground"
                                title={conversationName}
                              >
                                {conversationName}
                              </span>
                              <span className="block font-mono text-muted-foreground text-xs">
                                {row.conversation}
                              </span>
                            </>
                          ) : (
                            <span
                              className="block max-w-full truncate font-mono text-foreground text-sm tabular-nums"
                              title={row.conversation}
                            >
                              {row.conversation}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono">
                          <span className="text-foreground">{row.keyId}</span>
                        </TableCell>
                        <TableCell className={numericCls}>
                          {row.inTokens}
                        </TableCell>
                        <TableCell className={numericCls}>
                          {row.outTokens}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono tabular-nums">
                          <span className="inline-flex items-center justify-end gap-1">
                            {isSlow ? (
                              <TriangleAlert
                                aria-hidden
                                className="size-3.5 shrink-0 text-warning-600"
                                strokeWidth={1.75}
                              />
                            ) : (
                              <span aria-hidden className="size-3.5 shrink-0" />
                            )}
                            {isSlow ? (
                              <span className="sr-only">slow</span>
                            ) : null}
                            <span className={latencyTextCls}>
                              {row.latency}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono tabular-nums">
                          {isByokKey(row.keyId) ? (
                            <span className="inline-flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger
                                  render={(props) => (
                                    <span
                                      {...props}
                                      aria-label="Billed by your provider (BYOK)"
                                      className="inline-flex cursor-help rounded-sm text-neutral-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                    >
                                      <KeyRound
                                        aria-hidden
                                        className="size-3.5 shrink-0"
                                        strokeWidth={1.75}
                                      />
                                    </span>
                                  )}
                                />
                                <TooltipContent>
                                  Billed by your provider (BYOK)
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-neutral-400">—</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger
                                  render={(props) => (
                                    <span
                                      {...props}
                                      aria-label="Billed by Gate (PAYG)"
                                      className="inline-flex cursor-help rounded-sm text-neutral-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                    >
                                      <CreditCard
                                        aria-hidden
                                        className="size-3.5 shrink-0"
                                        strokeWidth={1.75}
                                      />
                                    </span>
                                  )}
                                />
                                <TooltipContent>
                                  Billed by Gate (PAYG)
                                </TooltipContent>
                              </Tooltip>
                              <span
                                className={
                                  isMissing
                                    ? "text-neutral-400"
                                    : "text-foreground"
                                }
                              >
                                {row.cost}
                              </span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <TablePaginationFooter
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                page={page}
                rowsPerPage={rowsPerPage}
                total={sortedRows.length}
              />
            </>
          )}
        </Card>
      </div>
      <RequestDetailDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
          }
        }}
        onOpenChangeComplete={(open) => {
          // Strip ?open= AFTER the exit animation finishes — stripping it
          // inside onOpenChange triggers a router re-render mid-animation,
          // which reads as a flicker. Base UI fires this once the close
          // transition has fully completed. Same pattern as Conversations.
          if (!open && searchParams.has("open")) {
            const next = new URLSearchParams(searchParams);
            next.delete("open");
            setSearchParams(next, { replace: true });
          }
        }}
        row={selectedRow}
      />
    </>
  );
}
