import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SparkXAxisTick } from "@/components/ui/chart-axis-ticks";
import {
  CHART_X_AXIS_HEIGHT,
  CHART_X_TICK_MARGIN,
  SPARK_CHART_MARGIN,
} from "@/components/ui/chart-geometry";
import { DeltaTag } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCompactCount } from "@/lib/formatters";
import { type CustomRange, type PresetRange, RANGE_OPTIONS } from "@/lib/range";
import { cn } from "@/lib/utils";
import { EventsTableSection } from "@/pages/security/EventsTable";
import {
  ATTACK_MIX,
  buildEventsChartView,
  EVENT_MIX_TOTAL,
  type EventsRange,
  eventsTotal,
  fmtCount,
  HERO_CHART_CONFIG,
  RANGE_DELTA_NOTE,
  splitEventMix,
} from "@/pages/security/events-data";

const WHITESPACE_GLOBAL_RE = /\s+/g;

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-015 — Security
 *
 * Security overview surface in the same production frame as CMP-012/013/014.
 * Composed entirely from existing primitives — no new components extracted.
 *
 * Sections:
 *   1. PageHeader               (title + actions)
 *   2. HeroMetricCard           (Total events KPI — big number + area chart)
 *   3. MiddleRow                (Attack categories ×2, 50/50 split)
 *
 * Color palette: only ink-* / blue-* / chart-1..8 / success / warning /
 * danger / --destructive. No raw hex.
 * ───────────────────────────────────────────────────────────────────────── */

function HeroMetricCard({
  range,
  customRange,
}: {
  range: EventsRange;
  customRange: CustomRange | null;
}) {
  // Header + breakdown are the "Total events" KPI surfaced at hero scale —
  // driven by the page range selector. `total` is the explicit per-range
  // total (25% of the Requests page total); the breakdown is the
  // largest-remainder split onto the 31:14:2 ratio, so blocked + flagged +
  // redacted sum EXACTLY to `total`. Chart, Action categories card, and
  // table "of N" all derive from the same two functions, so they reconcile.
  const total = eventsTotal(range, customRange);
  const note = RANGE_DELTA_NOTE[range];

  // Chart: total-events trace + date/time axis, driven by the page range.
  // Same buildSpark() math as the KpiRail "Total events" tile. Left unmemoized
  // on purpose — React Compiler caches it on [range, customRange] on its own,
  // and the hand-written useMemo it replaced could not be preserved (the memo
  // used to also carry a tick renderer, which now comes from the shared chart
  // geometry).
  const chart = buildEventsChartView(range, customRange);

  return (
    <Card className="px-4">
      <div className="flex shrink-0 flex-col gap-2">
        <Eyebrow>Total events</Eyebrow>
        {/* Delta rides beside the number on its BASELINE (16px gap), and the
            Blocked / Flagged / Redacted legend is gone (2026-09-01): the
            Action-types card below carries those exact numbers, so the
            legend was a second reading of them. Matches the team Security
            tab's hero. */}
        <div className="flex items-baseline gap-4">
          <HeroNumeric size="lg">{formatCompactCount(total)}</HeroNumeric>
          <DeltaTag delta="+22.4%" note={note} size="md" />
        </div>
      </div>

      {/* Full-width area chart with range-aware axis + per-point tooltip */}
      <div className="w-full">
        <ChartContainer
          className="aspect-auto h-24 w-full"
          config={HERO_CHART_CONFIG}
        >
          <AreaChart
            accessibilityLayer
            data={chart.data}
            margin={SPARK_CHART_MARGIN}
          >
            <defs>
              <linearGradient
                id="cmp015-events-spark"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-danger-500)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-danger-500)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            {/* Dashed baseline + ceiling — `ticks` pinned to [0, domainTop]
              so CartesianGrid draws exactly two horizontal lines (bottom
              and top), matching the old KpiRail sparkline grid. */}
            <CartesianGrid
              horizontal
              stroke="var(--color-chart-grid)"
              strokeDasharray="8 5"
              vertical={false}
            />
            {/* Dynamic domain: top is `max(values) + 1` so the tallest
              spike never touches the chart ceiling and the y-axis
              scales with whatever data the gateway is producing. */}
            <YAxis
              axisLine={false}
              domain={[0, chart.domainTop]}
              tick={false}
              tickLine={false}
              ticks={[0, chart.domainTop]}
              width={0}
            />
            {/* Ticks are real data points (see buildEventsChartView);
              interval="preserveStartEnd" + minTickGap lets recharts width-thin
              the labels natively (always keeping first + last), so narrow
              cards drop labels instead of overlapping — no custom JS hook.
              Tick renderer + type come from the shared chart geometry. */}
            <XAxis
              axisLine={false}
              dataKey="time"
              height={CHART_X_AXIS_HEIGHT}
              interval="preserveStartEnd"
              minTickGap={16}
              tick={SparkXAxisTick}
              tickLine={false}
              tickMargin={CHART_X_TICK_MARGIN}
              ticks={chart.ticks}
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
              fill="url(#cmp015-events-spark)"
              isAnimationActive={false}
              stroke="var(--color-danger-500)"
              strokeWidth={1.5}
              type="linear"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
}

export function Security() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Range lifted so PageHeader can drive the data selector + custom range
  // chrome in the top-right (matches Activity / Requests). EventsTableSection
  // reads it as props; the static 17-row sample doesn't actually filter
  // against it yet (real wiring is a follow-up). Defaults to `all` on load
  // — the intended landing state for every page's range selector.
  const [range, setRange] = useState<EventsRange>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const handleRangeChange = (next: PresetRange) => {
    setRange(next);
    setCustomRange(null);
  };
  const handleCustomRangeChange = (next: CustomRange | null) => {
    if (next) {
      setCustomRange(next);
      setRange("custom");
    } else {
      setCustomRange(null);
      setRange("all");
    }
  };

  return (
    <DashboardChrome
      activeNavId="security-events"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      {/* Overview — range controls group with the two card rows (gap-4
                internal) rather than floating in the PageHeader; mirrors
                AuditTrail / Requests. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedPill
              aria-label="Time range"
              onValueChange={(v) => handleRangeChange(v as PresetRange)}
              options={RANGE_OPTIONS}
              size="sm"
              value={range === "custom" ? "" : range}
            />
            <DateRangePicker
              onChange={handleCustomRangeChange}
              size="sm"
              value={customRange}
            />
          </div>
        </div>
        <HeroMetricCard customRange={customRange} range={range} />
        <MiddleRow customRange={customRange} range={range} />
      </div>
      <EventsTableSection customRange={customRange} range={range} />
    </DashboardChrome>
  );
}

/* ─── Page header ────────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        {/* h2 — see CMP012 PageHeader note. ArtboardHeader emits the outer
            h1; the in-surface page title reads as h2 in the document
            outline so child cards can use h3 without level skips. */}
        <PageTitle>Security events</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Every injection, PII, and credential event your policies caught,
          fingerprinted to Constellation's Digital Evidence layer. Blocked,
          flagged, or redacted.
        </p>
      </div>
    </div>
  );
}

/* ─── Middle row (Attack categories ×2) ──────────────────────────────────── */

function MiddleRow({
  range,
  customRange,
}: {
  range: EventsRange;
  customRange: CustomRange | null;
}) {
  return (
    <div className="grid @3xl:grid-cols-2 grid-cols-1 gap-4">
      <ActionCategoriesCard customRange={customRange} range={range} />
      <AttackCategoriesCard customRange={customRange} range={range} />
    </div>
  );
}

/* ─── Category breakdown cards ──────────────────────────────────────────── */

type AttackCategory = {
  label: string;
  count: number;
  /** Bar fill — the site-wide gradient recipe (darker origin → lighter
   *  leading edge). Chart slots run to their `-soft` twin, semantic families
   *  to their own 400 step. */
  fill: string;
};

// Right card. Mirrors the 3 enforced checks in DETECTION_CHECKS — Prompt
// injection, PII / PHI (combined, since PHI is medical PII), Credential
// leak. No Content Policy / Encoding / Jailbreak buckets: we don't ship
// those detectors yet, so don't show counts we can't back. Baseline units
// come from the shared ATTACK_MIX (events-data.ts) — also the source for
// Activity's "Top attack types" card — with the chart colors mapped here;
// the card scales them proportionally to the range total the same way the
// old model did (per-baseline-unit share of the total).
const ATTACK_FILL: Record<(typeof ATTACK_MIX)[number]["key"], string> = {
  pii: "bg-gradient-to-r from-chart-3 to-chart-3-soft",
  injection: "bg-gradient-to-r from-chart-1 to-chart-1-soft",
  credential: "bg-gradient-to-r from-chart-4 to-chart-4-soft",
};
const ATTACK_CATEGORIES: AttackCategory[] = ATTACK_MIX.map((c) => ({
  label: c.label,
  count: c.units,
  fill: ATTACK_FILL[c.key],
}));

// Static label + fill metadata — counts are range-dependent and injected at
// render time via useMemo.
const ACTION_CATEGORY_META = [
  { label: "Blocked", fill: "bg-gradient-to-r from-danger-500 to-danger-400" },
  {
    label: "Flagged",
    fill: "bg-gradient-to-r from-warning-500 to-warning-400",
  },
  {
    label: "Redacted",
    fill: "bg-gradient-to-r from-warning-500 to-warning-400",
  },
] as const;

// Left card. Blocked / Flagged / Redacted as a horizontal bar breakdown.
// Counts come straight from splitEventMix(eventsTotal(...)) so they are
// the SAME integers as the hero "Total events" KPI breakdown — the two
// surfaces reconcile exactly for every range.
function ActionCategoriesCard({
  range,
  customRange,
}: {
  range: EventsRange;
  customRange: CustomRange | null;
}) {
  const { blocked, flagged, redacted } = splitEventMix(
    eventsTotal(range, customRange)
  );
  const categories = useMemo<AttackCategory[]>(() => {
    const counts = [blocked, flagged, redacted];
    return ACTION_CATEGORY_META.map((meta, i) => ({
      ...meta,
      count: counts[i]!,
    }));
  }, [blocked, flagged, redacted]);
  return (
    <CategoryBreakdownCard
      categories={categories}
      description="Breakdown by action type"
      title="Action types"
    />
  );
}

// Right card. Attack-detection mix, scaled proportionally to the range
// total: each baseline unit is worth (rangeTotal / EVENT_MIX_TOTAL) events,
// matching the old `count × scale` behaviour now that scale is gone.
function AttackCategoriesCard({
  range,
  customRange,
}: {
  range: EventsRange;
  customRange: CustomRange | null;
}) {
  const total = eventsTotal(range, customRange);
  const categories = useMemo<AttackCategory[]>(() => {
    const perUnit = total / EVENT_MIX_TOTAL;
    return ATTACK_CATEGORIES.map((c) => ({
      ...c,
      count: Math.round(c.count * perUnit),
    }));
  }, [total]);
  return (
    <CategoryBreakdownCard
      categories={categories}
      description="Breakdown by detection type"
      title="Attack types"
    />
  );
}

function CategoryBreakdownCard({
  title,
  description,
  categories,
}: {
  title: string;
  description: string;
  categories: AttackCategory[];
}) {
  const max = Math.max(...categories.map((c) => c.count), 1);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="type-heading-16 text-foreground -tracking-[0.25px]">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {/* 3-col grid: label (auto) · track (1fr, all flush) · count (auto —
          sizes to the widest number, right-aligned against the card edge).
          Each row is a `display:contents` wrapper so its three children
          land directly in the shared grid tracks. */}
      <CardContent className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3">
        {categories.map((cat) => {
          const pct = (cat.count / max) * 100;
          const labelId = `cmp015-attack-${cat.label.replace(WHITESPACE_GLOBAL_RE, "-").toLowerCase()}`;
          return (
            <div className="contents" key={cat.label}>
              <span
                className="type-copy-14 w-48 shrink-0 truncate text-foreground"
                id={labelId}
                title={cat.label}
              >
                {cat.label}
              </span>
              <div
                aria-labelledby={labelId}
                aria-valuemax={max}
                aria-valuemin={0}
                aria-valuenow={cat.count}
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="meter"
              >
                <div
                  className={cn("h-full rounded-full", cat.fill)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="type-mono-14 justify-self-end whitespace-nowrap pl-2 text-foreground">
                {fmtCount(cat.count)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Recent security events table ────────────────────────────────────────
 * Mirrors the CMP-013 RequestsTableSection pattern: wrapper card +
 * Search-led filter toolbar + table. No pagination — fixed 17-row sample
 * fits the surface. No drill-in modal yet (row-click is a placeholder).
 * ────────────────────────────────────────────────────────────────────── */

// Per-type drill-in defaults consumed by the threat-event detail modal.
// Each row inherits these by `type`. Detection labels + sample
// prompts/responses are static-per-type — enough surface to demonstrate
// the modal shape without inventing 17 unique payloads.
// Fixed policy set we enforce at the gateway. Every event renders the same
// 4-row Detection grid; the firing check(s) for the event type are marked
// Flag, the rest Pass. Mirrors the Requests modal Security panel so the two
// surfaces agree on what we detect.
