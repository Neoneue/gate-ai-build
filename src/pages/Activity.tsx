import { Info, Key } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import type { Vendor } from "@/components/icons/vendor-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
import { Monogram } from "@/components/ui/monogram";
import type { AvatarTone } from "@/components/ui/monogram-types";
import { PageTitle } from "@/components/ui/page-title";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { parseNumeric, sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatSparkLabel,
  formatTime,
} from "@/lib/formatters";
import {
  API_KEY_ROWS,
  type Dimension,
  distributeSeries,
  SPEND_SERIES,
  SPEND_TOTALS_7D,
  seriesColor,
  TOKENS_TOTALS_7D,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_REQUESTS,
  TOTAL_7D_BASE_TOKENS,
} from "@/pages/activity-data";

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-019 — Activity (workspace usage analytics)
 *
 * Built to the Observability PRD's Activity spec (O6, §Activity) and the
 * mockup shared 2026-05-11:
 *   • Header: title + subtitle on left, range pill (24h / 7d / 30d / 90d)
 *     on the right. Custom is intentionally cut — see Open Question below.
 *   • KPI rail: Spend / Requests / Tokens (3-up). PRD calls for 5 cards
 *     (adding Active keys + Active models); the mockup elides both. Active
 *     models is implicit in the spend chart's stacked legend; key sprawl is
 *     surfaced in the Usage-by-key panel instead.
 *   • Spend chart: stacked by Model / Provider / API key (toggle). Compressed
 *     vs prior iteration so it reads as transitional rather than dominant.
 *   • Three Top-by-axis cards: Top spend / Top request / Top token models.
 *     Axis is the card identity — no sort dropdown.
 *   • Usage-by-key panel: per-key spend-share bars across all workspace keys.
 *
 * Open Question (Activity range — Custom): PRD §Activity lists "Custom" as
 * a fifth preset. Cut from this surface pending a real date-range popover.
 * Spec gap acknowledged; do not re-add as a non-functional segment.
 *
 * AG-44 resolved: no exports section on Activity. Raw-data export of audit
 * events is covered by Audit Trail PRD R12.
 * ───────────────────────────────────────────────────────────────────────── */

type PresetRange = "all" | "24h" | "7d" | "30d";
type Range = PresetRange | "custom";
type CustomRange = { from: Date; to: Date };

/** Page-level metric lens — drives the trend chart + the 3 Top-by-axis
 *  cards (not the KPI rail, which always shows all metrics). Default is
 *  `tokens`. */
type Metric = "tokens" | "spend";

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "tokens", label: "Tokens" },
  { value: "spend", label: "Spend" },
];

const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
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
const RANGE_SCALE: Record<PresetRange, number> = {
  "24h": 0.16,
  "7d": 1,
  "30d": 4.2,
  all: 8.5,
};

function daysInRange(r: CustomRange): number {
  return Math.max(
    1,
    Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000) + 1
  );
}

function effectiveScale(range: Range, customRange: CustomRange | null): number {
  if (range === "custom" && customRange) {
    return daysInRange(customRange) / 7;
  }
  return RANGE_SCALE[range === "custom" ? "7d" : range];
}

export function Activity() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Deep-link support: `?range=24h|7d|30d|all` lets Overview's KPI tiles
  // drop the user into the right slice in one click. Read once via a lazy
  // initializer, then ignore: manual range changes do not sync back to the
  // URL (one-way), mirroring the Conversations `?open=` pattern. Defaults to
  // `all`, the intended landing state for every page's range selector.
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<Range>(() => {
    const r = searchParams.get("range");
    return r === "24h" || r === "7d" || r === "30d" || r === "all" ? r : "all";
  });
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  return (
    <DashboardChrome
      activeNavId="activity"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader
        customRange={customRange}
        onCustomRangeChange={(r) => {
          if (r) {
            setCustomRange(r);
            setRange("custom");
          } else {
            setCustomRange(null);
            setRange("all");
          }
        }}
        onRangeChange={(r) => {
          setRange(r);
          setCustomRange(null);
        }}
        range={range}
      />
      <KpiRail customRange={customRange} range={range} />
      <TrendCard customRange={customRange} range={range} />
      <TopByAxisRow customRange={customRange} range={range} />
      <UsageByKey customRange={customRange} range={range} />
    </DashboardChrome>
  );
}

/* ─── Page header — title + subtitle on left, range pill on right ───────── */

function PageHeader({
  range,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: {
  range: Range;
  customRange: CustomRange | null;
  onRangeChange: (r: PresetRange) => void;
  onCustomRangeChange: (r: CustomRange | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-1/2 flex-col gap-2">
        <PageTitle>Activity</PageTitle>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-snug">
          Cost, requests, and tokens across the workspace.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedPill
          onValueChange={(v) => onRangeChange(v as PresetRange)}
          options={RANGE_OPTIONS}
          value={range === "custom" ? "" : range}
        />
        <DateRangePicker
          onChange={onCustomRangeChange}
          size="default"
          value={customRange}
        />
      </div>
    </div>
  );
}

/* ─── KPI rail (3-up, range-aware) ──────────────────────────────────────── */

// Only `delta` is hand-authored per range; the KPI value and sparkline are
// both computed in getKpiSpec from TOTAL_7D_BASE_* × effectiveScale, so the
// KPI rail cannot drift from the Spend / Requests / Tokens over-time charts.
type KpiSpec = { delta: string };

const KPI_DATA: Record<
  PresetRange,
  { spend: KpiSpec; requests: KpiSpec; tokens: KpiSpec }
> = {
  all: {
    spend: { delta: "+24.8%" },
    requests: { delta: "+19.3%" },
    tokens: { delta: "+17.6%" },
  },
  "24h": {
    spend: { delta: "+4.1%" },
    requests: { delta: "+2.6%" },
    tokens: { delta: "+3.2%" },
  },
  "7d": {
    spend: { delta: "+12.6%" },
    requests: { delta: "+8.2%" },
    tokens: { delta: "+8.7%" },
  },
  "30d": {
    spend: { delta: "+18.4%" },
    requests: { delta: "+14.7%" },
    tokens: { delta: "+13.2%" },
  },
};

/** KPI spec for the active range. All three metrics computed: value from
 *  the canonical 7d base × scale; sparkline by distributing that scaled
 *  total across the range's bucket count via distributeSeries — same
 *  generator the Spend over time chart uses, so spark shapes track real
 *  per-bucket variation (upward trend + ±10% jitter, deterministic). */
function getKpiSpec(range: Range, customRange: CustomRange | null) {
  const scale = effectiveScale(range, customRange);
  const count = getBucketCount(range, customRange);
  const spendDollars = TOTAL_7D_BASE_DOLLARS * scale;
  const requestsCount = TOTAL_7D_BASE_REQUESTS * scale;
  const tokensCount = TOTAL_7D_BASE_TOKENS * scale;

  // Each metric gets its own seed so adjacent sparklines in the rail
  // don't share the same jitter pattern. Range-aware seed so ranges with
  // matching bucket counts don't produce identical shapes at different scales.
  const rangeSeed =
    range === "all"
      ? 11
      : range === "24h"
        ? 47
        : range === "7d"
          ? 77
          : range === "30d"
            ? 303
            : 99;
  const spendSpark = distributeSeries(spendDollars, count, rangeSeed * 31 + 1);
  const requestsSpark = distributeSeries(
    requestsCount,
    count,
    rangeSeed * 31 + 2
  );
  const tokensSpark = distributeSeries(tokensCount, count, rangeSeed * 31 + 3);

  const base = KPI_DATA[range === "custom" ? "7d" : range];
  return {
    spend: {
      value: fmtUsd(spendDollars),
      delta: base.spend.delta,
      spark: spendSpark,
    },
    requests: {
      value: fmtInt(Math.round(requestsCount)),
      delta: base.requests.delta,
      spark: requestsSpark,
    },
    tokens: {
      value: fmtTokens(Math.round(tokensCount)),
      delta: base.tokens.delta,
      spark: tokensSpark,
    },
  };
}

// Delta trailing copy tied to the active range.
const RANGE_DELTA_NOTE: Record<Range, string> = {
  all: "All time",
  "24h": "vs prior day",
  "7d": "vs prior week",
  "30d": "vs prior month",
  custom: "vs prior range",
};

function KpiRail({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const k = getKpiSpec(range, customRange);
  const sparkLabels = getRangeDates(range, customRange).map((d) =>
    formatSparkLabel(d, range === "24h")
  );
  const note = RANGE_DELTA_NOTE[range];
  return (
    <KpiRailShell columns={3}>
      <CompactKpi
        delta={k.spend.delta}
        deltaNote={note}
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={k.spend.spark}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => fmtUsd(v)}
          />
        }
        title="Total Spend"
        value={k.spend.value}
      />
      <CompactKpi
        delta={k.requests.delta}
        deltaNote={note}
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-neutral-500)"
            data={k.requests.spark}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => fmtInt(Math.round(v))}
          />
        }
        title="Total Requests"
        value={k.requests.value}
      />
      <CompactKpi
        delta={k.tokens.delta}
        deltaNote={note}
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-3)"
            data={k.tokens.spark}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => fmtTokens(Math.round(v))}
          />
        }
        title="Tokens Used"
        value={k.tokens.value}
      />
    </KpiRailShell>
  );
}

/* ─── Spend trend — stacked bars, Model / Provider / API key toggle ─────── */

const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: "model", label: "Model" },
  { value: "provider", label: "Provider" },
  { value: "apiKey", label: "API key" },
];

/** Bar count per range. The Spend over time chart distributes each
 *  series's 7d total across this many buckets, so 24H = 12 bars at 2h
 *  each, 30D = 30 daily bars, etc. Custom range derives count from the
 *  span (daily up to 30 days, then capped). */
const BUCKET_COUNTS: Record<PresetRange, number> = {
  "24h": 12,
  "7d": 7,
  "30d": 30,
  all: 30,
};

function getBucketCount(range: Range, customRange: CustomRange | null): number {
  if (range === "custom" && customRange) {
    const days = daysInRange(customRange);
    return Math.max(7, Math.min(30, days));
  }
  return BUCKET_COUNTS[range === "custom" ? "7d" : range];
}

/** Human-readable bucket period for the SpendTrendCard description.
 *  Tells the reader what one bar covers so they can reconcile sum(bars)
 *  against the Total Spend KPI without doing the arithmetic. */
function getBucketLabel(range: Range, customRange: CustomRange | null): string {
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

/** Generate N evenly-spaced labels for the chart x-axis. Each preset has
 *  its own anchoring (1H → minute marks ending at "Now"; 24H → 2-hour
 *  marks on the calendar; 7D → daily; 30D → daily ending today). */
/** Bucket start dates per range — anchored at the mock "today" (Apr 27, 2026);
 *  24H's trailing bucket is the 14:30 anchor. Kept in lockstep with
 *  getRangeLabels below (same anchor + stepping); getRangeLabels renders the
 *  short axis labels, the KPI rail renders these via formatSparkLabel. */
function getRangeDates(range: Range, customRange: CustomRange | null): Date[] {
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

function getRangeLabels(
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

/** Synthetic key used for the "Others" rollup series when a dimension has
 *  more than 6 real series. This value must never collide with a real series
 *  key — the double-underscore prefix keeps it isolated from any workspace
 *  entity key. */
const OTHERS_KEY = "__others";

/** Ink-300 — visually subordinate to the saturated CHART_PALETTE slots but
 *  still clearly distinguishable from the card background. Used for the
 *  Others rollup bar segment and panel swatch. */
const OTHERS_COLOR = "var(--color-neutral-300)";

/** Hoisted BarChart prop literals. Recharts treats inline objects as new
 *  props each render and re-runs layout/style work it could otherwise skip.
 *  Module-level constants keep referential identity stable across renders. */
const TREND_CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 } as const;
const TREND_CHART_XAXIS_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

/** Right-panel breakdown: renders up to 6 pre-sorted rows. Caller is
 *  responsible for sorting and injecting the synthetic "Others" entry. */
function TrendBreakdownPanel({
  metric,
  series,
  seriesTotals,
}: {
  metric: Metric;
  series: readonly {
    key: string;
    label: string;
    slot: number;
    color?: string;
  }[];
  /** Aggregated totals for this range — keyed by series key. */
  seriesTotals: Record<string, number>;
}) {
  const isSpend = metric === "spend";
  const grandTotal =
    Object.values(seriesTotals).reduce((a, b) => a + b, 0) || 1;
  const fmtValue = isSpend ? fmtUsd : (n: number) => fmtTokens(Math.round(n));

  return (
    <div className="flex flex-col gap-1">
      {series.map((s) => {
        const total = seriesTotals[s.key] ?? 0;
        const pctStr = fmtPct(total / grandTotal);
        const color = s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s);

        // Right-side value cluster: cumulative value · pct. Tokens in/out
        // live in the UsageByKey table below — duplicating the split here
        // adds noise without information. Single shape for both metrics so
        // toggling the lens doesn't reflow the panel.
        return (
          <div
            className="flex min-w-0 items-center gap-2 rounded-xs px-2 py-1"
            key={s.key}
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-xs"
              style={{ backgroundColor: color }}
            />
            <span className="min-w-0 flex-1 truncate font-sans text-foreground text-sm">
              {s.label}
            </span>
            <div
              className="grid shrink-0 items-center gap-x-2 font-mono text-sm tabular-nums"
              style={{ gridTemplateColumns: "9ch min-content 4ch" }}
            >
              <span className="text-right text-foreground">
                {fmtValue(total)}
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-right text-foreground">{pctStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Maximum number of individually-named series in the trend chart/panel.
 *  When a dimension has more entries, the remainder collapse into "Others". */
const TREND_SERIES_CAP = 6;

function TrendCard({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const [dimension, setDimension] = useState<Dimension>("model");
  // Local metric lens — independent from the other three surfaces.
  const [metric, setMetric] = useState<Metric>("tokens");
  const rawSeries = SPEND_SERIES[dimension];
  const isSpend = metric === "spend";

  const data = useMemo(() => {
    const count = getBucketCount(range, customRange);
    const labels = getRangeLabels(range, customRange);
    const scale = effectiveScale(range, customRange);
    const totals = (isSpend ? SPEND_TOTALS_7D : TOKENS_TOTALS_7D)[dimension];

    // Distribute each series's range-scaled total across N buckets via
    // distributeSeries (trend + spike/dip noise). Each series gets its
    // own seed so adjacent series don't sync into matching ripples —
    // keeps stacked bars looking organic. Range-aware base seed so ranges
    // with matching bucket counts don't produce identical shapes.
    const rangeSeed =
      range === "all"
        ? 11
        : range === "24h"
          ? 47
          : range === "7d"
            ? 77
            : range === "30d"
              ? 303
              : 99;
    const seriesBuckets: Record<string, number[]> = {};
    let seedOffset = 0;
    for (const [key, total7d] of Object.entries(totals)) {
      seedOffset++;
      seriesBuckets[key] = distributeSeries(
        total7d * scale,
        count,
        rangeSeed * 31 + seedOffset
      );
    }

    // Per-bucket sum equals scaled 7d total by construction (distributeSeries
    // sums each series exactly, then sums across series).
    return Array.from({ length: count }, (_, i) => {
      const row: Record<string, number | string> = { date: labels[i] ?? "" };
      for (const [key, buckets] of Object.entries(seriesBuckets)) {
        row[key] = buckets[i] ?? 0;
      }
      return row;
    });
  }, [dimension, range, customRange, isSpend]);

  /** Aggregate each raw series's total across all buckets in the active range.
   *  Derived from `data` so it's always in sync with what the chart shows. */
  const rawSeriesTotals = useMemo<Record<string, number>>(() => {
    const acc: Record<string, number> = {};
    for (const row of data) {
      for (const s of rawSeries) {
        acc[s.key] = (acc[s.key] ?? 0) + (Number(row[s.key]) || 0);
      }
    }
    return acc;
  }, [data, rawSeries]);

  /** Sort raw series desc by aggregate total, then apply the 6-series cap.
   *  This is the single source of truth for both the chart render loop and
   *  the breakdown panel. When rawSeries.length > TREND_SERIES_CAP:
   *    - visible = top (TREND_SERIES_CAP - 1) real series
   *    - 6th entry = synthetic __others rollup
   *  Otherwise all real series pass through unchanged. */
  const { cappedSeries, cappedTotals, dataWithOthers } = useMemo(() => {
    // Sort desc by aggregate total in the active metric.
    const sorted = [...rawSeries].sort(
      (a, b) => (rawSeriesTotals[b.key] ?? 0) - (rawSeriesTotals[a.key] ?? 0)
    );

    if (sorted.length <= TREND_SERIES_CAP) {
      return {
        cappedSeries: sorted,
        cappedTotals: rawSeriesTotals,
        dataWithOthers: data,
      };
    }

    // Split: top (CAP-1) named + everything else rolls into Others.
    const namedCount = TREND_SERIES_CAP - 1;
    const named = sorted.slice(0, namedCount);
    const overflow = sorted.slice(namedCount);

    // Synthetic Others entry — no slot (uses OTHERS_COLOR directly).
    const othersSeries = {
      key: OTHERS_KEY,
      label: "Others",
      slot: 0,
      color: OTHERS_COLOR,
    } as const;
    const series = [...named, othersSeries];

    // Totals: named keys unchanged; __others = sum of overflow keys.
    const totals: Record<string, number> = {};
    for (const s of named) {
      totals[s.key] = rawSeriesTotals[s.key] ?? 0;
    }
    totals[OTHERS_KEY] = overflow.reduce(
      (sum, s) => sum + (rawSeriesTotals[s.key] ?? 0),
      0
    );

    // Project __others into each data row = sum of overflow series values.
    const overflowKeys = overflow.map((s) => s.key);
    const projected = data.map((row) => {
      const othersVal = overflowKeys.reduce(
        (sum, k) => sum + (Number(row[k]) || 0),
        0
      );
      return { ...row, [OTHERS_KEY]: +othersVal.toFixed(2) };
    });

    return {
      cappedSeries: series,
      cappedTotals: totals,
      dataWithOthers: projected,
    };
  }, [rawSeries, rawSeriesTotals, data]);

  const bucketLabel = getBucketLabel(range, customRange);

  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        cappedSeries.map((s) => [
          s.key,
          {
            label: s.label,
            color: s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s),
          },
        ])
      ) as ChartConfig,
    [cappedSeries]
  );

  // Metric-aware value formatter — drives the tooltip rows. YAxis ticks
  // use fmtTokens directly under the tokens metric so the axis reads in
  // "1 M" / "5 M" units that match the tooltip.
  const valueFormatter = (v: number) =>
    isSpend ? fmtUsd(v) : fmtTokens(Math.round(v));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isSpend ? "Spend over time" : "Tokens over time"}
        </CardTitle>
        <CardDescription>
          Stacked by{" "}
          {DIMENSION_OPTIONS.find(
            (d) => d.value === dimension
          )?.label.toLowerCase()}
          {" · "}
          {bucketLabel}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v: string) => setDimension(v as Dimension)}
              value={dimension}
            >
              <SelectTrigger
                aria-label="Group spend by"
                className="border-border bg-card font-normal text-foreground"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    By {d.label.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SegmentedPill
              onValueChange={(v) => setMetric(v as Metric)}
              options={METRIC_OPTIONS}
              size="sm"
              value={metric}
            />
          </div>
        </CardAction>
      </CardHeader>

      {/* Two-pane layout: chart left (8/12 cols), breakdown panel right (4/12 cols).
          Collapses to single column below md breakpoint (panel below chart). */}
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Left pane — chart */}
        <div className="md:col-span-8">
          {/* 184px gives the stacked layers enough vertical room to read as
              distinct bands without the chart taking over the page. YAxis
              ticks are left-aligned (custom tick renderer below) so they
              share their left edge with the title. */}
          <ChartContainer
            className="aspect-auto h-[184px] w-full"
            config={chartConfig}
          >
            <BarChart
              accessibilityLayer
              barCategoryGap="20%"
              data={dataWithOthers}
              margin={TREND_CHART_MARGIN}
            >
              <CartesianGrid
                horizontal
                stroke="var(--color-neutral-200)"
                strokeDasharray="8 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="date"
                height={24}
                // Target ~7 visible labels regardless of bucket count:
                //   7 bars  → interval 0 (show all)
                //   12 bars → interval 1 (every other, ~6 visible)
                //   30 bars → interval 4 (every 5th, ~6 visible)
                interval={Math.max(0, Math.ceil(data.length / 7) - 1)}
                tick={TREND_CHART_XAXIS_TICK}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tick={(props: {
                  y?: string | number;
                  payload?: { value?: string | number };
                }) => {
                  // Left-align every tick at x=0 of the chart container so the
                  // left edges of all ticks sit at the same x — and that x
                  // lines up with the title left edge. Default recharts tick is
                  // right-anchored to the tick line, which makes "0" sit
                  // visibly further right than the max tick.
                  // Spend ticks get a `$` prefix; token ticks use fmtTokens
                  // (compact "M"/"k") so the axis matches the tooltip rows.
                  const raw = Number(props.payload?.value ?? 0);
                  const label = isSpend
                    ? `$${props.payload?.value}`
                    : fmtTokens(raw);
                  return (
                    <text
                      dy={4}
                      fill="var(--muted-foreground)"
                      fontSize={11}
                      textAnchor="start"
                      x={0}
                      y={props.y}
                    >
                      {label}
                    </text>
                  );
                }}
                tickLine={false}
                tickMargin={0}
                width={44}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const cfg = chartConfig[name as string];
                      return (
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="flex items-center gap-1">
                            <span
                              aria-hidden
                              className="size-2 shrink-0 rounded-xs"
                              style={{ backgroundColor: cfg?.color }}
                            />
                            <span className="text-muted-foreground">
                              {cfg?.label ?? name}
                            </span>
                          </span>
                          <span className="font-mono text-foreground tabular-nums">
                            {valueFormatter(Number(value))}
                          </span>
                        </div>
                      );
                    }}
                    indicator="dot"
                    labelFormatter={(_, payload) =>
                      String(payload?.[0]?.payload?.date ?? "")
                    }
                  />
                }
                cursor={false}
              />
              {cappedSeries.map((s) => {
                const color =
                  s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s);
                return (
                  <Bar
                    dataKey={s.key}
                    fill={color}
                    isAnimationActive={false}
                    key={s.key}
                    stackId="spend"
                  />
                );
              })}
            </BarChart>
          </ChartContainer>
        </div>

        {/* Right pane — breakdown panel */}
        <div className="md:col-span-4 md:border-border md:border-l md:pl-3">
          <TrendBreakdownPanel
            metric={metric}
            series={cappedSeries}
            seriesTotals={cappedTotals}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Top X models — 3-up, one card per axis (no sort dropdown) ─────────── */

const fmtUsd = (n: number) => formatCurrency(n);
const fmtInt = (n: number) => formatNumber(n);
const fmtPct = (frac: number) => {
  const pct = frac * 100;
  return pct < 10 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;
};
const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K`
      : `${n}`;

type ModelRow = {
  key: string;
  label: string;
  vendor: Vendor;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  spend: number;
};

/** Numbers are tuned so the three Top-by-axis cards diverge realistically.
 *  Price-per-token differs by ~60× between Haiku and Opus, and tokens-per-
 *  request differs by ~5× between short-classification (Haiku) and long-
 *  context (Llama). Sums reconcile with the 7d KPI rail (~$1,248 spend,
 *  ~48,293 requests, ~18.4M tokens).
 *
 *  Resulting top-5 leaders:
 *    Spend     → Opus, Sonnet, GPT, Gemini, Llama
 *    Requests  → Haiku, Sonnet, Gemini, GPT, Llama
 *    Tokens    → Sonnet, Llama, Haiku, Gemini, GPT */
// MODEL_ROWS is the source of truth for the Top Models card. tokensIn /
// tokensOut are the per-model workspace aggregates; the card computes total
// tokens at the call site (tokensIn + tokensOut). The trend breakdown panel
// no longer reads in/out — cumulative only; see TrendBreakdownPanel. The
// table at the bottom (UsageByKey) is where in/out lives. Production reads
// these from real traffic; replace the rows.
const MODEL_ROWS: ModelRow[] = [
  {
    key: "opus",
    label: "Claude Opus 4.7",
    vendor: "anthropic",
    requests: 34_400,
    tokensIn: 7_370_000,
    tokensOut: 6_030_000,
    spend: 120.6,
  },
  {
    key: "sonnet",
    label: "Claude Sonnet 4.5",
    vendor: "anthropic",
    requests: 14_900,
    tokensIn: 5_371_000,
    tokensOut: 1_179_000,
    spend: 35.4,
  },
  {
    key: "haiku",
    label: "Claude Haiku",
    vendor: "anthropic",
    requests: 25_030,
    tokensIn: 2_676_000,
    tokensOut: 1_784_000,
    spend: 8.5,
  },
  {
    key: "gpt",
    label: "GPT-5.1",
    vendor: "openai",
    requests: 6670,
    tokensIn: 1_859_000,
    tokensOut: 1_001_000,
    spend: 14.0,
  },
  {
    key: "gemini",
    label: "Gemini 3 Pro",
    vendor: "google",
    requests: 8720,
    tokensIn: 2_835_000,
    tokensOut: 1_215_000,
    spend: 9.5,
  },
  {
    key: "llama",
    label: "Llama 4.2 405B",
    vendor: "meta",
    requests: 5280,
    tokensIn: 936_000,
    tokensOut: 264_000,
    spend: 6.0,
  },
  {
    key: "mistral",
    label: "Mistral Large 3",
    vendor: "mistral",
    requests: 690,
    tokensIn: 247_000,
    tokensOut: 133_000,
    spend: 2.3,
  },
];

/* Three cards, one per entity — CTO 2026-05-13: "no reason to have 3 stat
 * sections about [models]. Make one about models, one about api keys, one
 * about users." Axes chosen so each card carries a distinct lens (and
 * doesn't duplicate the chart above): models by tokens, keys by requests,
 * users by spend. User aggregation groups API_KEY_ROWS by owner — owners
 * mirror Team.tsx MEMBER_ROWS so the workspace user list reconciles. */

/** Matches Team.tsx MEMBER_ROWS. Workspace users come from the team roster. */
const USER_TONE: Record<string, AvatarTone> = {
  "Chad Ponticas": "blue",
  "Kira Tan": "rose",
  "Mateus Silva": "emerald",
  "Jordan Lee": "amber",
};

type TopRow = {
  rowKey: string;
  label: string;
  labelClassName?: string;
  value: string;
  avatar: React.ReactNode;
};

function TopList({
  title,
  subtitle,
  rows,
  metric,
  onMetricChange,
}: {
  title: string;
  subtitle: string;
  rows: TopRow[];
  metric: Metric;
  onMetricChange: (m: Metric) => void;
}) {
  return (
    <Card density="flush">
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="m-0 font-heading font-medium text-base text-foreground leading-snug">
            {title}
          </h3>
          <p className="m-0 font-sans text-muted-foreground text-sm/5">
            {subtitle}
          </p>
        </div>
        <SegmentedPill
          onValueChange={(v) => onMetricChange(v as Metric)}
          options={METRIC_OPTIONS}
          size="sm"
          value={metric}
        />
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {rows.map((row) => (
          <div className="flex min-w-0 items-center gap-2" key={row.rowKey}>
            {row.avatar}
            <span
              className={`min-w-0 flex-1 truncate text-foreground text-sm ${row.labelClassName ?? "font-sans"}`}
              title={row.label}
            >
              {row.label}
            </span>
            <span className="whitespace-nowrap font-mono text-foreground text-sm tabular-nums">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Hoisted: identical for every keyRow. Avoids re-creating the same JSX
 *  element inside the keyRows useMemo on every metric/scale change. */
const KEY_AVATAR = (
  <Key
    aria-hidden
    className="size-4 shrink-0 text-muted-foreground"
    strokeWidth={2}
  />
);

function TopByAxisRow({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const scale = effectiveScale(range, customRange);

  // Each card owns its own metric lens — no shared state across the three.
  const [modelMetric, setModelMetric] = useState<Metric>("tokens");
  const [keyMetric, setKeyMetric] = useState<Metric>("tokens");
  const [userMetric, setUserMetric] = useState<Metric>("tokens");

  // Spend → fmtUsd, with 2dp scaled values; tokens → fmtTokens (compact
  // "M"/"k") on rounded integers. Each card computes from its own metric.
  const modelRows: TopRow[] = useMemo(() => {
    const isSpend = modelMetric === "spend";
    return MODEL_ROWS.map((m) => ({
      key: m.key,
      label: m.label,
      vendor: m.vendor,
      axis: isSpend ? m.spend * scale : (m.tokensIn + m.tokensOut) * scale,
    }))
      .sort((a, b) => b.axis - a.axis)
      .slice(0, 4)
      .map((m) => ({
        rowKey: m.key,
        label: m.label,
        value: isSpend
          ? fmtUsd(+m.axis.toFixed(2))
          : fmtTokens(Math.round(m.axis)),
        avatar: <VendorAvatar vendor={m.vendor} />,
      }));
  }, [scale, modelMetric]);

  const keyRows: TopRow[] = useMemo(() => {
    const isSpend = keyMetric === "spend";
    return API_KEY_ROWS.map((k) => ({
      key: k.key,
      label: k.label,
      axis: isSpend ? k.spend * scale : (k.tokensIn + k.tokensOut) * scale,
    }))
      .sort((a, b) => b.axis - a.axis)
      .slice(0, 4)
      .map((k) => ({
        rowKey: k.key,
        label: k.label,
        labelClassName: "font-mono",
        value: isSpend
          ? fmtUsd(+k.axis.toFixed(2))
          : fmtTokens(Math.round(k.axis)),
        avatar: KEY_AVATAR,
      }));
  }, [scale, keyMetric]);

  const userRows: TopRow[] = useMemo(() => {
    const isSpend = userMetric === "spend";
    // Spend leaderboard counts workspace ("Gate") spend only. A member who
    // owns ANY BYOK key isn't a workspace spender — their token usage runs
    // on their own provider keys, so excluding them from Spend is the
    // honest read. Token volume aggregates across every key the member
    // owns (Gate + BYOK), so all four members appear under Tokens.
    const memberHasByok = new Set<string>();
    if (isSpend) {
      for (const k of API_KEY_ROWS) {
        if (k.path === "BYOK") {
          memberHasByok.add(k.owner);
        }
      }
    }
    const agg = new Map<string, { owner: string; axis: number }>();
    for (const k of API_KEY_ROWS) {
      if (isSpend && memberHasByok.has(k.owner)) {
        continue;
      }
      const existing = agg.get(k.owner) ?? { owner: k.owner, axis: 0 };
      existing.axis += (isSpend ? k.spend : k.tokensIn + k.tokensOut) * scale;
      agg.set(k.owner, existing);
    }
    return [...agg.values()]
      .sort((a, b) => b.axis - a.axis)
      .slice(0, 4)
      .map((u) => ({
        rowKey: u.owner,
        label: u.owner,
        value: isSpend
          ? fmtUsd(+u.axis.toFixed(2))
          : fmtTokens(Math.round(u.axis)),
        avatar: (
          <Monogram
            initials={(
              u.owner.trim().split(/\s+/)[0]?.[0] ?? "?"
            ).toUpperCase()}
            size="sm"
            tone={USER_TONE[u.owner] ?? "ink"}
          />
        ),
      }));
  }, [scale, userMetric]);

  const subtitleFor = (m: Metric) =>
    m === "spend" ? "By total spend" : "By total tokens used";

  return (
    <div className="grid grid-cols-3 gap-4">
      <TopList
        metric={modelMetric}
        onMetricChange={setModelMetric}
        rows={modelRows}
        subtitle={subtitleFor(modelMetric)}
        title="Top models"
      />
      <TopList
        metric={keyMetric}
        onMetricChange={setKeyMetric}
        rows={keyRows}
        subtitle={subtitleFor(keyMetric)}
        title="Top API keys"
      />
      <TopList
        metric={userMetric}
        onMetricChange={setUserMetric}
        rows={userRows}
        subtitle={subtitleFor(userMetric)}
        title="Top users"
      />
    </div>
  );
}

/* ─── Usage by key — org-wide admin table, sortable ─────────────────────── */

/** Scaled key row — the shape rendered in the table (and fed to the sort
 *  accessor). Spend on BYOK rows renders "—"; the accessor returns null for
 *  it so BYOK always sorts last when ranking by spend (matches the prior
 *  dropdown's explicit BYOK-last rule). */
type ScaledKeyRow = (typeof API_KEY_ROWS)[number] & {
  spend: number;
  requests: number;
  tokensIn: number;
  tokensOut: number;
};

function keySortValue(row: ScaledKeyRow, key: string): string | number | null {
  switch (key) {
    case "label":
      return row.label;
    case "owner":
      return row.owner;
    case "requests":
      return parseNumeric(row.requests);
    case "tokensIn":
      return parseNumeric(row.tokensIn);
    case "tokensOut":
      return parseNumeric(row.tokensOut);
    // BYOK has no Gateway spend ("—") → null so those rows sort last.
    case "spend":
      return row.path === "BYOK" ? null : parseNumeric(row.spend);
    default:
      return null;
  }
}

function UsageByKey({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  // Click-to-sort headers replace the former sort <Select>. Default ordering
  // (key=null) preserves API_KEY_ROWS' authored order.
  const { sort, toggle: toggleSort } = useTableSort();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  // Land on page 1 whenever the underlying ordering or window changes.
  // Without this you sit on page 3 of "Highest spend / 30d," switch to
  // "Member (A–Z) / 24h," and stare at page 3 of an entirely different
  // ranking — possibly past the last page. Rows-per-page already resets
  // inside TablePaginationFooter.
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${range}|${customRange?.from}|${customRange?.to}|${sort.key}|${sort.dir}|${query}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const scaledRows = useMemo<ScaledKeyRow[]>(() => {
    const scale = effectiveScale(range, customRange);
    return API_KEY_ROWS.map((k) => ({
      ...k,
      spend: +(k.spend * scale).toFixed(2),
      requests: Math.round(k.requests * scale),
      tokensIn: Math.round(k.tokensIn * scale),
      tokensOut: Math.round(k.tokensOut * scale),
    }));
  }, [range, customRange]);

  const searchedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return scaledRows;
    }
    return scaledRows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)
    );
  }, [scaledRows, query]);

  // Sort AFTER filtering, BEFORE the pagination slice.
  const filteredRows = useMemo(
    () => sortRows(searchedRows, sort, keySortValue),
    [searchedRows, sort]
  );

  const perPage = Number.parseInt(rowsPerPage, 10);
  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * perPage, page * perPage),
    [filteredRows, page, perPage]
  );

  const isEmpty = filteredRows.length === 0;

  return (
    <Card density="flush" id="usage-by-key">
      {isEmpty ? null : (
        <FilterToolbar>
          <SearchInput
            ariaLabel="Search keys"
            onChange={setQuery}
            placeholder="Search key or member…"
            value={query}
          />

          <Button className="ml-auto" size="sm" type="button" variant="outline">
            <UploadIcon aria-hidden data-icon="inline-start" size={16} />
            Export CSV
          </Button>
        </FilterToolbar>
      )}

      {isEmpty ? (
        <TableEmptyState
          body="No keys match your search or filter. Try a different name or clear the filter."
          title="No keys match"
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead
                  className="whitespace-nowrap"
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="label"
                >
                  Key
                </SortableTableHead>
                <SortableTableHead
                  className="whitespace-nowrap"
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="owner"
                >
                  Member
                </SortableTableHead>
                <TableHead className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    Billing
                    <Tooltip>
                      <TooltipTrigger
                        render={(props) => (
                          <button
                            {...props}
                            aria-label="What's the difference between Gate and BYOK?"
                            className="relative inline-flex items-center justify-center rounded-xs text-neutral-400 after:absolute after:-inset-2 after:content-[''] hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            type="button"
                          />
                        )}
                      >
                        <Info
                          aria-hidden
                          className="size-3.5"
                          strokeWidth={2}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <div>
                            <span className="font-medium font-mono text-foreground">
                              Gate
                            </span>
                            {": "}debits the workspace prepaid Gateway balance.
                          </div>
                          <div>
                            <span className="font-medium font-mono text-foreground">
                              BYOK
                            </span>
                            {": "}bills the customer's own provider account
                            directly; Gateway sees $0.
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                </TableHead>
                <SortableTableHead
                  className="whitespace-nowrap"
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="requests"
                >
                  Requests
                </SortableTableHead>
                <SortableTableHead
                  className="whitespace-nowrap"
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="tokensIn"
                >
                  Tokens in
                </SortableTableHead>
                <SortableTableHead
                  className="whitespace-nowrap"
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="tokensOut"
                >
                  Tokens out
                </SortableTableHead>
                <SortableTableHead
                  className="whitespace-nowrap"
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="spend"
                >
                  Spend
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow className="hover:bg-transparent" key={row.key}>
                  <TableCell className="whitespace-nowrap font-mono">
                    <span className="text-neutral-800">{row.label}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-sans text-neutral-800 text-sm">
                      {row.owner}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline">{row.path}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 tabular-nums">
                    {fmtInt(row.requests)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 tabular-nums">
                    {fmtTokens(row.tokensIn)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 tabular-nums">
                    {fmtTokens(row.tokensOut)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-mono text-foreground tabular-nums">
                    {row.path === "BYOK" ? (
                      <>
                        <span aria-hidden className="text-neutral-400">
                          —
                        </span>
                        <span className="sr-only">No Gateway spend (BYOK)</span>
                      </>
                    ) : (
                      fmtUsd(row.spend)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePaginationFooter
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            page={page}
            rowsPerPage={rowsPerPage}
            total={filteredRows.length}
          />
        </>
      )}
    </Card>
  );
}
