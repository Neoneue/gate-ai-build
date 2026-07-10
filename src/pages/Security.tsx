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
import { DeltaTag } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { type CustomRange, type PresetRange, RANGE_OPTIONS } from "@/lib/range";
import { EventsTableSection } from "@/pages/security/EventsTable";
import {
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
      fill="var(--muted-foreground)"
      fontSize={11}
      textAnchor={anchor}
      x={x}
      y={y}
    >
      {display}
    </text>
  );
}

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
  const { blocked, flagged, redacted } = splitEventMix(total);
  const note = RANGE_DELTA_NOTE[range];

  // Chart: total-events trace + date/time axis, driven by the page range.
  // Same buildSpark() math as the KpiRail "Total events" tile.
  // chart + renderTick share one memo boundary keyed on [range, customRange] so
  // the compiler can trace the full derivation chain (the firstTick/lastTick
  // reads happen inside the memo, not as a leak between useMemo and useCallback).
  const { chart, renderTick } = useMemo(() => {
    const view = buildEventsChartView(range, customRange);
    const ft = view.ticks[0];
    const lt = view.ticks[view.ticks.length - 1];
    return {
      chart: view,
      renderTick: (tickProps: {
        x: string | number;
        y: string | number;
        payload: { value: string };
      }) => <ChartXAxisTick {...tickProps} firstTick={ft} lastTick={lt} />,
    };
  }, [range, customRange]);

  return (
    <Card className="px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex shrink-0 flex-col gap-2">
          <Eyebrow>Total events</Eyebrow>
          <div className="flex items-baseline gap-3">
            <HeroNumeric size="lg">{fmtCount(total)}</HeroNumeric>
            <DeltaTag delta="+22.4%" note={note} size="md" />
          </div>
        </div>

        {/* Right-aligned mono breakdown — grid (not stacked flex) so all
            three rows share the same label / dot / value column tracks.
            Each BreakdownRow returns three grid cells; the dot column is
            fixed-width so dots align across rows regardless of label or
            value length. Maps to the Action categories: Blocked / Flagged
            / Redacted. */}
        <div className="grid shrink-0 grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-2">
          <BreakdownRow
            label="Blocked"
            tone="danger"
            value={fmtCount(blocked)}
          />
          <BreakdownRow
            label="Flagged"
            tone="warning"
            value={fmtCount(flagged)}
          />
          <BreakdownRow
            label="Redacted"
            tone="warning"
            value={fmtCount(redacted)}
          />
        </div>
      </div>

      {/* Full-width area chart with range-aware axis + per-point tooltip */}
      <ChartContainer
        className="aspect-auto h-24 w-full"
        config={HERO_CHART_CONFIG}
      >
        <AreaChart
          accessibilityLayer
          data={chart.data}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
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
          <XAxis
            axisLine={false}
            dataKey="time"
            height={24}
            interval={0}
            tick={renderTick}
            tickLine={false}
            tickMargin={8}
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
    </Card>
  );
}

// Indicator dot colors — one stop lighter than the StatusDot defaults so
// the Total events breakdown matches the lightened Action Categories bars.
const BREAKDOWN_DOT: Record<"success" | "danger" | "warning" | "info", string> =
  {
    success: "var(--color-success-500)",
    danger: "var(--color-danger-500)",
    warning: "var(--color-warning-500)",
    info: "var(--color-blue-500)",
  };

function BreakdownRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "warning" | "info";
}) {
  // Returns three grid cells (no wrapper element). Parent is a 3-col grid
  // so dots and values align across rows. `justify-self-end` right-aligns
  // text-flow cells within their tracks.
  return (
    <>
      <span className="type-label-12 justify-self-end text-muted-foreground tracking-tight">
        {label}
      </span>
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: BREAKDOWN_DOT[tone] }}
      />
      <span className="justify-self-end font-medium font-mono text-foreground text-xs tabular-nums">
        {value}
      </span>
    </>
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
      <div className="flex max-w-1/2 flex-col gap-2">
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
    <div className="grid grid-cols-2 gap-4">
      <ActionCategoriesCard customRange={customRange} range={range} />
      <AttackCategoriesCard customRange={customRange} range={range} />
    </div>
  );
}

/* ─── Category breakdown cards ──────────────────────────────────────────── */

type AttackCategory = {
  label: string;
  count: number;
  /** Chart palette CSS var. */
  color: string;
};

// Right card. Mirrors the 3 enforced checks in DETECTION_CHECKS — Prompt
// injection, PII / PHI (combined, since PHI is medical PII), Credential
// leak. No Content Policy / Encoding / Jailbreak buckets: we don't ship
// those detectors yet, so don't show counts we can't back. These are a
// 1× baseline mix; the card scales them proportionally to the range total
// the same way the old model did (per-baseline-unit share of the total).
const ATTACK_CATEGORIES: AttackCategory[] = [
  { label: "PII / PHI", count: 8, color: "var(--color-chart-3)" },
  { label: "Prompt injection", count: 5, color: "var(--color-chart-1)" },
  { label: "Credential leak", count: 3, color: "var(--color-chart-4)" },
];

// Static label + color metadata — counts are range-dependent and injected at
// render time via useMemo.
const ACTION_CATEGORY_META = [
  { label: "Blocked", color: "var(--color-danger-500)" },
  { label: "Flagged", color: "var(--color-warning-500)" },
  { label: "Redacted", color: "var(--color-warning-500)" },
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
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                />
              </div>
              <span className="justify-self-end whitespace-nowrap pl-2 font-mono text-foreground text-sm tabular-nums">
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
