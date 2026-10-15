import { useCallback, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { resolveRowsPerPage } from "@/components/ui/table-pagination";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Timestamp } from "@/components/ui/timestamp";
import { UploadIcon } from "@/components/ui/upload";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatChartTooltipDate,
  formatCompactCount,
  formatDateTime,
  formatTime,
} from "@/lib/formatters";
import {
  type CustomRange,
  daysInRange,
  inRangeWindow,
  type PresetRange,
  RANGE_OPTIONS,
} from "@/lib/range";
import { cn } from "@/lib/utils";
import {
  NO_KEY,
  type WorkspaceTraffic,
} from "@/pages/onboarding/onboarding-workspace-traffic";
import { useWorkspaceTraffic } from "@/pages/onboarding/use-workspace-traffic";
import { SecurityDefault } from "@/pages/SecurityDefault";
import {
  ATTACK_MIX,
  type EventsChartView,
  type EventsRange,
  fmtCount,
  HERO_CHART_CONFIG,
} from "@/pages/security/events-data";
import {
  ACTION_BADGE,
  type EventCategory,
  TYPE_META,
} from "@/pages/security-data";

const WHITESPACE_GLOBAL_RE = /\s+/g;

/* ─── OnboardingSecurity ────────────────────────────────────────────────────
 * The onboarding workspace's Security events page (owner 2026-10-13). Before
 * step 3's blocked message landed (no traffic, or the test message only) it
 * is `SecurityDefault`, unchanged. After it, a COPY of the Free page (`SecurityFree` renders
 * `Security.tsx` and `security/EventsTable.tsx`, both unchanged) fed by the
 * one security event step 3 produced: the protection demo message, a prompt
 * injection Gate blocked. The test message passed the guardrail, so it is
 * not a security event. Every section and control is kept; every count
 * (hero, chart, Action types, Attack types, the table and its "of N") comes
 * from that one event in the picked range, so they reconcile.
 *
 * Gate Chat replies of the run (owner 2026-10-14, `useWorkspaceTraffic`)
 * all pass the guardrail (Allow), so they are not security events either;
 * they only move the range anchor, the newest message.
 *
 * The range is local state, anchored on the newest message's real send time
 * (the phone Messages precedent), so the event sits in the last bucket of
 * every preset. Left out of the Free copy:
 *   - The hero's delta: a brand-new workspace has no prior period.
 *   - The threat-event detail dialog: no Gate record exists for a mock
 *     message, so the row opens nothing (OnboardingSetupOverview's rows).
 *   - The Manager "User" filter and team scoping: a Free workspace has no
 *     teams or managers.
 * The Status column keeps the verdict every event starts with (Unreviewed);
 * the verdict is set in the cut dialog, so it cannot change here.
 * ───────────────────────────────────────────────────────────────────────── */

/** One security event from the setup traffic. MOCK: no request id. */
type SetupEvent = {
  id: string;
  sentAt: Date;
  type: EventCategory;
  action: keyof typeof ACTION_BADGE;
  key: string;
  conversationId: string;
};

/** The blocked messages as events: step 3's demo message, a prompt
 *  injection (the step's whole point), blocked by the guardrail. */
function setupEvents(traffic: WorkspaceTraffic): SetupEvent[] {
  return traffic.messages
    .filter((m) => m.guardrail === "block")
    .map((m) => ({
      id: m.id,
      sentAt: m.sentAt,
      type: "injection",
      action: "blocked",
      key: m.keyLabel ?? NO_KEY,
      conversationId: m.conversationId,
    }));
}

/** The picked window: presets end on the newest message's send time; a
 *  custom range is the picker's own (inclusive 23:55 end); All is null. */
function setupWindow(
  range: EventsRange,
  customRange: CustomRange | null,
  anchor: Date
): CustomRange | null {
  if (range === "custom") {
    return customRange;
  }
  if (range === "all") {
    return null;
  }
  const from = new Date(anchor);
  if (range === "24h") {
    from.setHours(from.getHours() - 24);
  } else {
    from.setDate(from.getDate() - (range === "30d" ? 30 : 7));
  }
  return { from, to: new Date(anchor) };
}

/** Bucket count and span per range, as the Free chart draws them
 *  (`buildSpark` buckets over `buildEventsChartView` spans): All 30 over 60
 *  days, 24H 24 hourly, 7D 14 half days, 30D 30 days, custom 7 to 30 over
 *  the picked span. */
function bucketPlan(
  range: EventsRange,
  customRange: CustomRange | null
): { buckets: number; totalMinutes: number; hourly: boolean } {
  if (range === "custom" && customRange) {
    const totalMinutes = Math.max(
      60,
      Math.round((customRange.to.getTime() - customRange.from.getTime()) / 6e4)
    );
    return {
      buckets: Math.min(30, Math.max(7, daysInRange(customRange))),
      totalMinutes,
      hourly: totalMinutes <= 24 * 60,
    };
  }
  if (range === "24h") {
    return { buckets: 24, totalMinutes: 24 * 60, hourly: true };
  }
  if (range === "7d") {
    return { buckets: 14, totalMinutes: 7 * 24 * 60, hourly: false };
  }
  if (range === "30d") {
    return { buckets: 30, totalMinutes: 30 * 24 * 60, hourly: false };
  }
  return { buckets: 30, totalMinutes: 60 * 24 * 60, hourly: false };
}

/** The Free hero chart's view (`buildEventsChartView`) over real events:
 *  each bucket counts the events sent in it, split by action, so the trace
 *  sums to the hero number. Buckets end on the window's end instant. */
function setupEventsChartView(
  range: EventsRange,
  customRange: CustomRange | null,
  events: readonly SetupEvent[],
  anchor: Date
): EventsChartView {
  const { buckets, totalMinutes, hourly } = bucketPlan(range, customRange);
  const end =
    range === "custom" && customRange
      ? customRange.to.getTime()
      : anchor.getTime();
  const bucketMs = (totalMinutes / buckets) * 6e4;
  const counts = Array.from({ length: buckets }, () => ({
    blocked: 0,
    flagged: 0,
    redacted: 0,
  }));
  for (const event of events) {
    const back = Math.floor((end - event.sentAt.getTime()) / bucketMs);
    if (back < 0) {
      continue;
    }
    const bucket = counts[buckets - 1 - Math.min(back, buckets - 1)];
    if (bucket) {
      bucket[event.action] += 1;
    }
  }
  const stamps = counts.map(
    (_, i) => new Date(end - Math.round((buckets - 1 - i) * bucketMs))
  );
  const tipGranularity = bucketMs < 24 * 36e5 ? "hour" : "day";
  const tipRange = {
    start: stamps[0] ?? new Date(end),
    end: new Date(end),
  };
  const data = counts.map((c, i) => {
    const d = stamps[i] ?? new Date(end);
    return {
      time: hourly
        ? formatTime(d, { hour: "2-digit", minute: "2-digit", hour12: false })
        : formatDateTime(d, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
      label: formatChartTooltipDate(d, tipGranularity, tipRange),
      requests: c.blocked + c.flagged + c.redacted,
      blocked: c.blocked,
      flagged: c.flagged,
      redacted: c.redacted,
    };
  });
  // 4 to 7 evenly spaced ticks across the series, de-duplicated (Free).
  const tickCount = Math.min(7, Math.max(4, Math.min(buckets, 7)));
  const ticks: string[] = [];
  for (let i = 0; i < tickCount; i++) {
    const label = data[Math.round((i * (buckets - 1)) / (tickCount - 1))]?.time;
    if (label && !ticks.includes(label)) {
      ticks.push(label);
    }
  }
  return {
    data,
    ticks,
    domainTop: Math.max(...data.map((p) => p.requests), 1) + 1,
  };
}

export function OnboardingSecurity() {
  const traffic = useWorkspaceTraffic();
  // The test message is not a security event: until the blocked message
  // lands (owner 2026-10-13: messages land one at a time) the page keeps
  // its empty state.
  return traffic && setupEvents(traffic).length > 0 ? (
    <SetupSecurity traffic={traffic} />
  ) : (
    <SecurityDefault />
  );
}

function SetupSecurity({ traffic }: { traffic: WorkspaceTraffic }) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Security.tsx's range state, local: the demo range never leaks into the
  // other pages.
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

  const events = useMemo(() => setupEvents(traffic), [traffic]);
  const anchor = traffic.messages[0]?.sentAt ?? new Date();
  const picked = setupWindow(range, customRange, anchor);
  const inRange = events.filter((e) => inRangeWindow(e.sentAt, picked));
  const chart = setupEventsChartView(range, customRange, inRange, anchor);

  return (
    <DashboardChrome
      activeNavId="security-events"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
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
        <HeroMetricCard chart={chart} total={inRange.length} />
        <div className="grid @3xl:grid-cols-2 grid-cols-1 gap-4">
          <ActionCategoriesCard events={inRange} />
          <AttackCategoriesCard events={inRange} />
        </div>
      </div>
      <EventsTableSection events={events} inRange={inRange} />
    </DashboardChrome>
  );
}

/* ─── Page header (Security.tsx, verbatim) ─────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
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

/* ─── Hero: Total events (Security.tsx, minus the delta) ───────────────── */

function HeroMetricCard({
  total,
  chart,
}: {
  total: number;
  chart: EventsChartView;
}) {
  return (
    <Card className="px-4">
      <div className="flex shrink-0 flex-col gap-2">
        <Eyebrow>Total events</Eyebrow>
        <div className="flex items-baseline gap-4">
          <HeroNumeric size="lg">{formatCompactCount(total)}</HeroNumeric>
        </div>
      </div>

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
                id="onboarding-security-events-spark"
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
            <CartesianGrid
              horizontal
              stroke="var(--color-chart-grid)"
              strokeDasharray="8 5"
              vertical={false}
            />
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
                  className="min-w-36"
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
              fill="url(#onboarding-security-events-spark)"
              isAnimationActive={false}
              stroke="var(--color-danger-500)"
              strokeWidth={1.5}
              type="linear"
            />
            {/* Tooltip-only series, as in the Free card: no stroke, no fill,
                no active dot; the stroke carries the tooltip dot colour. */}
            <Area
              activeDot={false}
              dataKey="blocked"
              fill="none"
              isAnimationActive={false}
              stroke="var(--color-danger-500)"
              strokeWidth={0}
            />
            <Area
              activeDot={false}
              dataKey="flagged"
              fill="none"
              isAnimationActive={false}
              stroke="var(--color-warning-500)"
              strokeWidth={0}
            />
            <Area
              activeDot={false}
              dataKey="redacted"
              fill="none"
              isAnimationActive={false}
              stroke="var(--color-neutral-400)"
              strokeWidth={0}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
}

/* ─── Category breakdown cards (Security.tsx) ──────────────────────────── */

type AttackCategory = {
  label: string;
  count: number;
  fill: string;
};

const ATTACK_FILL: Record<(typeof ATTACK_MIX)[number]["key"], string> = {
  pii: "bg-gradient-to-r from-chart-3 to-chart-3-soft",
  injection: "bg-gradient-to-r from-chart-1 to-chart-1-soft",
  credential: "bg-gradient-to-r from-chart-4 to-chart-4-soft",
};

/** Event type -> the Attack types bucket it counts in (PHI is medical PII,
 *  combined as on the Free card). */
const ATTACK_KEY_OF: Record<EventCategory, (typeof ATTACK_MIX)[number]["key"]> =
  {
    injection: "injection",
    pii: "pii",
    phi: "pii",
    credential: "credential",
  };

const ACTION_CATEGORY_META = [
  {
    action: "blocked",
    label: "Blocked",
    fill: "bg-gradient-to-r from-danger-500 to-danger-400",
  },
  {
    action: "flagged",
    label: "Flagged",
    fill: "bg-gradient-to-r from-warning-500 to-warning-400",
  },
  {
    action: "redacted",
    label: "Redacted",
    fill: "bg-gradient-to-r from-warning-500 to-warning-400",
  },
] as const;

function ActionCategoriesCard({ events }: { events: readonly SetupEvent[] }) {
  const categories = ACTION_CATEGORY_META.map((meta) => ({
    label: meta.label,
    fill: meta.fill,
    count: events.filter((e) => e.action === meta.action).length,
  }));
  return (
    <CategoryBreakdownCard
      categories={categories}
      description="Breakdown by action type"
      title="Action types"
    />
  );
}

function AttackCategoriesCard({ events }: { events: readonly SetupEvent[] }) {
  const categories = ATTACK_MIX.map((c) => ({
    label: c.label,
    fill: ATTACK_FILL[c.key],
    count: events.filter((e) => ATTACK_KEY_OF[e.type] === c.key).length,
  }));
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

      <CardContent className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3">
        {categories.map((cat) => {
          const pct = (cat.count / max) * 100;
          const labelId = `onboarding-security-${cat.label.replace(WHITESPACE_GLOBAL_RE, "-").toLowerCase()}`;
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

/* ─── Recent security events (EventsTable.tsx, one event) ──────────────── */

/** Sort value per column (events-data.ts `eventSortValue`, on SetupEvent). */
function setupEventSortValue(
  event: SetupEvent,
  key: string
): string | number | null {
  switch (key) {
    case "time":
      return event.sentAt.getTime();
    case "type":
      return TYPE_META[event.type].label;
    case "conversation":
      return event.conversationId;
    case "key":
      return event.key.split(" (")[0] ?? event.key;
    case "action":
      return ACTION_BADGE[event.action].label;
    default:
      return null;
  }
}

function EventsTableSection({
  events,
  inRange,
}: {
  /** Every event, for the Key filter's options. */
  events: readonly SetupEvent[];
  /** The events in the page range: the table's rows and its "of N". */
  inRange: readonly SetupEvent[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [keyFilter, setKeyFilter] = useState("all");
  const [action, setAction] = useState("all");
  const keyOptions = useMemo(
    () => [...new Set(events.map((e) => e.key))],
    [events]
  );
  // Staged-Apply filters dialog, as on the Free page.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftType, setDraftType] = useState("all");
  const [draftKeyFilter, setDraftKeyFilter] = useState("all");
  const [draftAction, setDraftAction] = useState("all");
  const activeFilterCount = [type, action, keyFilter].filter(
    (v) => v !== "all"
  ).length;
  const draftActiveFilterCount = [
    draftType,
    draftAction,
    draftKeyFilter,
  ].filter((v) => v !== "all").length;
  const openFilters = useCallback(() => {
    setDraftType(type);
    setDraftAction(action);
    setDraftKeyFilter(keyFilter);
    setFiltersOpen(true);
  }, [type, action, keyFilter]);
  const resetFilters = useCallback(() => {
    setDraftType("all");
    setDraftAction("all");
    setDraftKeyFilter("all");
  }, []);
  const applyFilters = useCallback(() => {
    setType(draftType);
    setAction(draftAction);
    setKeyFilter(draftKeyFilter);
    setFiltersOpen(false);
  }, [draftType, draftAction, draftKeyFilter]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  const { sort, toggle: toggleSort } = useTableSort();

  // Reset to page 1 whenever filters or range change (render-time pattern).
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${inRange.map((e) => e.id).join(",")}|${query}|${type}|${keyFilter}|${action}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inRange.filter((e) => {
      if (type !== "all" && e.type !== type) {
        return false;
      }
      if (keyFilter !== "all" && e.key !== keyFilter) {
        return false;
      }
      if (action !== "all" && e.action !== action) {
        return false;
      }
      if (!q) {
        return true;
      }
      return e.key.toLowerCase().includes(q);
    });
  }, [query, type, keyFilter, action, inRange]);

  const sortedRows = useMemo(
    () => sortRows([...filtered], sort, setupEventSortValue),
    [filtered, sort]
  );

  const isEmpty = filtered.length === 0;
  const total = filtered.length;
  const perPage = resolveRowsPerPage(rowsPerPage, total);
  const pageRows = sortedRows.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <SectionTitle>Recent security events</SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            ariaLabel="Search events"
            className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
            onChange={setQuery}
            placeholder="Search events…"
            surface="elevated"
            value={query}
          />

          <Button
            aria-label={
              activeFilterCount > 0
                ? `Filters (${activeFilterCount} active)`
                : "Filters"
            }
            className="@2xl:flex-none flex-1 border-border bg-card text-foreground"
            onClick={openFilters}
            size="default"
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

          <Button
            className="@2xl:flex-none flex-1"
            size="default"
            type="button"
            variant="outline"
          >
            <UploadIcon aria-hidden data-icon="inline-start" size={16} />
            Export CSV
          </Button>
        </div>
      </div>

      <Dialog onOpenChange={setFiltersOpen} open={filtersOpen}>
        <DialogContent className="w-full gap-4 sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="type-heading-20 text-foreground">
              Filters
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label className="type-label-14 text-muted-foreground">Type</Label>
            <Select onValueChange={setDraftType} value={draftType}>
              <SelectTrigger
                aria-label="Type"
                className="w-full border-border bg-card text-foreground"
                id="filter-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="injection">Injection</SelectItem>
                <SelectItem value="pii">PII</SelectItem>
                <SelectItem value="phi">PHI</SelectItem>
                <SelectItem value="credential">Credential</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="type-label-14 text-muted-foreground">
              Action
            </Label>
            <Select onValueChange={setDraftAction} value={draftAction}>
              <SelectTrigger
                aria-label="Action"
                className="w-full border-border bg-card text-foreground"
                id="filter-action"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="redacted">Redacted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="type-label-14 text-muted-foreground">Key</Label>
            <Select onValueChange={setDraftKeyFilter} value={draftKeyFilter}>
              <SelectTrigger
                aria-label="API key"
                className="w-full border-border bg-card text-foreground"
                id="filter-key"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All keys</SelectItem>
                {keyOptions.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <Button
              disabled={draftActiveFilterCount === 0}
              onClick={resetFilters}
              size="default"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
            <div className="flex items-center gap-2">
              <DialogClose
                render={
                  <Button size="default" type="button" variant="outline" />
                }
              >
                Cancel
              </DialogClose>
              <Button onClick={applyFilters} size="default" type="button">
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card density="flush">
        {isEmpty ? (
          <TableEmptyState
            body="Prompt injection, PII, and credential leak events flagged by your policies will appear here."
            title="No security events"
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
                    sortKey="time"
                  >
                    Time
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="type"
                  >
                    Type
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
                    sortKey="key"
                  >
                    Key
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="action"
                  >
                    Action
                  </SortableTableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((event) => {
                  const typeMeta = TYPE_META[event.type];
                  const actionMeta = ACTION_BADGE[event.action];
                  const TypeIcon = typeMeta.Icon;
                  // No Gate record exists for a mock event: the row opens
                  // nothing (OnboardingSetupOverview's rows).
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="whitespace-nowrap">
                        <Timestamp
                          className="type-mono-14 text-foreground"
                          date={event.sentAt}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-middle">
                        <span className="inline-flex items-center gap-2 align-middle">
                          <TypeIcon
                            aria-hidden
                            className="size-4 shrink-0"
                            strokeWidth={1.75}
                            style={{ color: typeMeta.color }}
                          />
                          <span className="type-copy-14 text-foreground">
                            {typeMeta.label}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] whitespace-nowrap">
                        <span
                          className="type-mono-14 block max-w-full truncate text-foreground"
                          title={event.conversationId}
                        >
                          {event.conversationId}
                        </span>
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap">
                        <span className="text-foreground">
                          {event.key.split(" (")[0]}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={actionMeta.variant}>
                          {actionMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="neutral">Unreviewed</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <TablePaginationFooter
              minRowsPerPage={25}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              total={total}
            />
          </>
        )}
      </Card>
    </div>
  );
}
