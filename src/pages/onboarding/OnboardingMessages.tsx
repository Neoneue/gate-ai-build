import { CreditCard, Info, KeyRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
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
import { resolveRowsPerPage } from "@/components/ui/table-pagination";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadIcon } from "@/components/ui/upload";
import { customRangeHours } from "@/data/message-totals";
import { planTierOf } from "@/data/plans";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatChartTooltipDate,
  formatCompactCount,
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelative,
} from "@/lib/formatters";
import { keepInOnboarding } from "@/lib/plan";
import { oldestInWindow, retentionCeilingDays } from "@/lib/retention";
import { ATTACK_MESSAGE, TEST_MESSAGE } from "@/pages/onboarding/improved-data";
import type {
  SetupMessage,
  SetupTraffic,
} from "@/pages/onboarding/onboarding-setup-traffic";
import { useSetupTraffic } from "@/pages/onboarding/use-setup-traffic";
import { RequestsDefault } from "@/pages/RequestsDefault";
import {
  GUARDRAIL_BADGE,
  RANGE_OPTIONS,
  RESPONSE_BADGE,
} from "@/pages/requests/data";
import type {
  CustomRange,
  HeroPoint,
  RangeKey,
  ResponseStatus,
} from "@/pages/requests/types";
import { useViewRole } from "@/pages/teams/teams-store";

/* ─── OnboardingMessages ────────────────────────────────────────────────────
 * The onboarding workspace's Messages (owner 2026-10-13). A brand-new Free
 * workspace: before step 3 passes it has no messages and the page is the
 * Default twin, `RequestsDefault`, unchanged. Once "Check connection"
 * passes it holds the test message, and once the protection demo passes
 * the demo message too: the step 3 messages, one at a time as each lands
 * (`useSetupTraffic`, the one source), and the page is a COPY of the Free
 * Messages page (`RequestsFree` renders `Requests.tsx` +
 * `requests/HeroMetric.tsx` + `requests/RequestsTable.tsx`) with every
 * section and control, fed by those messages: the hero counts them, the
 * table lists them, newest first. A copy, never an import of the Pro tree
 * (no-thrash: separate files), and the range is local state, not the shared
 * `rangeStore`, so the onboarding range never leaks into `/messages`.
 *
 * Status follows the Status x Guardrail combos (requests/types.ts): the
 * blocked prompt injection is `error | block` ("gateway rejected before the
 * provider was hit"); the test message is `success | allow`. So the hero
 * reads 2 total, 1 success, 1 error.
 *
 * Cut from the Free copy, each with its reason:
 * - the hero's DeltaTag: no prior period exists, so any delta would be
 *   synthetic (the phone copy's precedent);
 * - the row drill-in and the Model cell link: MOCK, no Gate record and no
 *   request id exist for these messages, so a row opens nothing
 *   (OnboardingSetupOverview's precedent);
 * - the `req_*` line under each message: no request id exists.
 * Kept with the data's own "missing" shapes: Device name (no device is
 * recorded, em dash + sr-only note) and Latency (not measured, em dash).
 * ───────────────────────────────────────────────────────────────────────── */

const MINUTE_MS = 60_000;

/** What each step 3 message said (improved-data.ts). */
const PROMPT_BY_ID: Record<SetupMessage["id"], string> = {
  test: TEST_MESSAGE,
  demo: ATTACK_MESSAGE,
};

/** A blocked message never reached the provider: `error | block`. */
const statusOf = (message: SetupMessage): ResponseStatus =>
  message.guardrail === "block" ? "error" : "success";

export function OnboardingMessages() {
  const traffic = useSetupTraffic();
  return traffic ? <SetupMessages traffic={traffic} /> : <RequestsDefault />;
}

/* ─── The range window (local state, anchored on the newest message) ────── */

type PresetKey = Exclude<RangeKey, "custom">;

/** Bucket count, bucket size and tick count per preset, as the Pro hero
 *  (hero-data.ts): All 240 x 6h, 24H 96 x 15m, 7D 168 x 1h, 30D 120 x 6h. */
const PRESETS: Record<
  PresetKey,
  { count: number; minutes: number; tickCount: number }
> = {
  all: { count: 240, minutes: 360, tickCount: 7 },
  "24h": { count: 96, minutes: 15, tickCount: 6 },
  "7d": { count: 168, minutes: 60, tickCount: 7 },
  "30d": { count: 120, minutes: 360, tickCount: 7 },
};

/** The newest message's send time: the range anchor (the phone copy's
 *  precedent), so a preset always ends on the latest message. */
function anchorOf(messages: readonly SetupMessage[]): number {
  return Math.max(...messages.map((m) => m.sentAt.getTime()));
}

/** Whether a message falls inside the selected range: the same window the
 *  hero buckets cover, so the hero total and the table rows reconcile. */
function inRange(
  message: SetupMessage,
  range: RangeKey,
  customRange: CustomRange | null,
  anchor: number
): boolean {
  const t = message.sentAt.getTime();
  if (range === "custom" && customRange) {
    return t >= customRange.from.getTime() && t <= customRange.to.getTime();
  }
  const preset = PRESETS[range === "custom" ? "all" : range];
  const sizeMs = preset.minutes * MINUTE_MS;
  const back = Math.floor((anchor - t) / sizeMs);
  return back >= 0 && back < preset.count;
}

/* ─── Hero series (HeroMetric.tsx's view, from the two messages) ────────── */

type SetupHeroView = {
  total: number;
  success: number;
  errors: number;
  data: HeroPoint[];
  ticks: string[];
  domainTop: number;
};

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short" });

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** The Pro buckets' `time` keys: "14:15" on 24H, "Oct 13 14:00" elsewhere
 *  (the spark tick drops the trailing clock). */
function bucketTime(date: Date, clockOnly: boolean): string {
  if (clockOnly) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }
  return `${MONTH_FORMAT.format(date)} ${date.getDate()} ${pad2(date.getHours())}:00`;
}

/** hero-data.ts `deriveTicks`: evenly spaced real data points, first and
 *  last always included, so every tick matches a `time` key. */
function deriveTicks(data: { time: string }[], tickCount: number): string[] {
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

/** One bucket set: each bucket counts its messages and splits them into
 *  success and errors, so Total = Success + Errors on every point and the
 *  per-point errors sum to the headline's. */
function buildHeroView(
  stamps: Date[],
  buckets: SetupMessage[][],
  clockOnly: boolean,
  tickCount: number,
  tipRange: { start: Date; end: Date }
): SetupHeroView {
  const data = stamps.map((stamp, i) => {
    const inBucket = buckets[i] ?? [];
    const errors = inBucket.filter((m) => statusOf(m) === "error").length;
    return {
      time: bucketTime(stamp, clockOnly),
      label: formatChartTooltipDate(stamp, "hour", tipRange),
      requests: inBucket.length,
      success: inBucket.length - errors,
      errors,
    };
  });
  const total = data.reduce((sum, p) => sum + p.requests, 0);
  const errors = data.reduce((sum, p) => sum + p.errors, 0);
  return {
    total,
    success: total - errors,
    errors,
    data,
    ticks: deriveTicks(data, tickCount),
    // hero-data.ts: the tallest bucket plus one.
    domainTop: Math.max(...data.map((p) => p.requests), 1) + 1,
  };
}

function setupHeroView(
  messages: readonly SetupMessage[],
  range: RangeKey,
  customRange: CustomRange | null
): SetupHeroView {
  if (range === "custom" && customRange) {
    const hours = customRangeHours(customRange);
    const sizeHours = hours <= 7 * 24 ? 1 : 6;
    const count = Math.max(24, Math.ceil(hours / sizeHours));
    const sizeMs = sizeHours * 60 * MINUTE_MS;
    const from = customRange.from.getTime();
    const stamps = Array.from(
      { length: count },
      (_, i) => new Date(from + i * sizeMs)
    );
    const buckets: SetupMessage[][] = stamps.map(() => []);
    for (const message of messages) {
      if (inRange(message, range, customRange, from)) {
        const index = Math.min(
          count - 1,
          Math.floor((message.sentAt.getTime() - from) / sizeMs)
        );
        buckets[index]?.push(message);
      }
    }
    return buildHeroView(stamps, buckets, false, 7, {
      start: customRange.from,
      end: customRange.to,
    });
  }

  // A "custom" selection with no dates yet reads as All.
  const preset = PRESETS[range === "custom" ? "all" : range];
  const sizeMs = preset.minutes * MINUTE_MS;
  // Each bucket is stamped with its end instant, as in hero-data.ts: the
  // last one is the anchor itself, the newest message.
  const anchor = anchorOf(messages);
  const stamps = Array.from(
    { length: preset.count },
    (_, i) => new Date(anchor - (preset.count - 1 - i) * sizeMs)
  );
  const buckets: SetupMessage[][] = stamps.map(() => []);
  for (const message of messages) {
    const back = Math.floor((anchor - message.sentAt.getTime()) / sizeMs);
    if (back >= 0 && back < preset.count) {
      buckets[preset.count - 1 - back]?.push(message);
    }
  }
  return buildHeroView(stamps, buckets, range === "24h", preset.tickCount, {
    start: stamps[0] ?? new Date(anchor),
    end: new Date(anchor),
  });
}

/* ─── The page (Requests.tsx) ───────────────────────────────────────────── */

function SetupMessages({ traffic }: { traffic: SetupTraffic }) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  // One clock per mount: the Time cell's relative tooltip and the retention
  // statement's window.
  const [now] = useState(() => new Date());
  // Requests.tsx's range state, minus the shared store. Defaults to `all`,
  // every page's landing range.
  const [range, setRange] = useState<RangeKey>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const handleRangeChange = (next: RangeKey) => {
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
      activeNavId="requests"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      {/* Requests.tsx: the Overview bar and the hero card in one gap-4
          group, so "Overview" reads as the label for the card. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedPill
              onValueChange={(next) => handleRangeChange(next as RangeKey)}
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
        <SetupHeroCard
          customRange={customRange}
          messages={traffic.messages}
          range={range}
        />
      </div>
      <SetupMessagesTable
        customRange={customRange}
        now={now}
        range={range}
        traffic={traffic}
      />
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>Messages</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Every model call across your stack, inspected for injection, PII, and
          credentials before it reaches the model.
        </p>
      </div>
    </div>
  );
}

/* ─── Hero card (HeroMetric.tsx HeroMetricCard) ─────────────────────────── */

const HERO_CHART_CONFIG = {
  requests: { label: "Total", color: "var(--color-chart-1)" },
  success: { label: "Success", color: "var(--color-success-600)" },
  errors: { label: "Errors", color: "var(--destructive)" },
} satisfies ChartConfig;

function SetupHeroCard({
  messages,
  range,
  customRange,
}: {
  messages: readonly SetupMessage[];
  range: RangeKey;
  customRange: CustomRange | null;
}) {
  const view = useMemo(
    () => setupHeroView(messages, range, customRange),
    [messages, range, customRange]
  );

  return (
    <Card className="px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* The Pro recipe minus the DeltaTag: there is no prior period to
            compare the setup messages against. */}
        <div className="flex shrink-0 flex-col gap-2">
          <Eyebrow>Total messages</Eyebrow>
          <HeroNumeric size="lg">{formatCompactCount(view.total)}</HeroNumeric>
        </div>
        <div className="grid shrink-0 grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-2">
          <BreakdownRow
            label="Success"
            tone="success"
            value={formatCompactCount(view.success)}
          />
          <BreakdownRow
            label="Errors"
            tone="danger"
            value={formatCompactCount(view.errors)}
          />
        </div>
      </div>

      <div className="w-full">
        <ChartContainer
          className="aspect-auto h-24 w-full"
          config={HERO_CHART_CONFIG}
        >
          <AreaChart
            accessibilityLayer
            data={view.data}
            margin={SPARK_CHART_MARGIN}
          >
            <defs>
              <linearGradient
                id="onboarding-setup-messages-hero-spark"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
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
            <YAxis
              axisLine={false}
              domain={[0, view.domainTop]}
              tick={false}
              tickLine={false}
              width={0}
            />
            <CartesianGrid
              horizontal
              stroke="var(--color-chart-grid)"
              strokeDasharray="8 5"
              vertical={false}
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
              ticks={view.ticks}
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
              fill="url(#onboarding-setup-messages-hero-spark)"
              isAnimationActive={false}
              stroke="var(--color-chart-1)"
              strokeWidth={1.5}
              type="linear"
            />
            {/* Tooltip-only series, as in the Pro card: no stroke, no fill,
                no active dot; the stroke carries the legend colour. */}
            <Area
              activeDot={false}
              dataKey="success"
              fill="none"
              isAnimationActive={false}
              stroke="var(--color-success-600)"
              strokeWidth={0}
            />
            <Area
              activeDot={false}
              dataKey="errors"
              fill="none"
              isAnimationActive={false}
              stroke="var(--destructive)"
              strokeWidth={0}
            />
          </AreaChart>
        </ChartContainer>
      </div>
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
  tone: "success" | "danger";
}) {
  return (
    <>
      <span className="type-label-12 justify-self-end text-muted-foreground tracking-tight">
        {label}
      </span>
      <StatusDot kind={tone} />
      <span className="type-mono-12 justify-self-end font-medium text-foreground">
        {value}
      </span>
    </>
  );
}

/* ─── Retention statement (requests/RetentionStatement.tsx) ─────────────────
 * The Free page's statement, its strings verbatim, with the window's oldest
 * message read off the two setup messages instead of the Pro mock account's
 * message times. The Settings link stays in the onboarding workspace. */

function SetupRetentionStatement({
  sentAts,
  now,
}: {
  sentAts: readonly Date[];
  now: Date;
}) {
  const { pathname } = useLocation();
  const isAdmin = useViewRole() === "admin";
  const days = retentionCeilingDays(planTierOf(pathname));
  const oldest = oldestInWindow(sentAts, now, days);
  const lead = oldest
    ? `Showing the last ${days} days, back to ${formatDate(oldest)}.`
    : `Showing the last ${days} days.`;

  return (
    <Callout
      action={
        isAdmin ? (
          <Button
            nativeButton={false}
            render={<Link to={keepInOnboarding(pathname, "/settings")} />}
            size="sm"
            variant="info-outline"
          >
            Retention settings
          </Button>
        ) : null
      }
    >
      {lead} Older messages are deleted, and their fingerprints remain
      verifiable.
    </Callout>
  );
}

/* ─── Recent messages (RequestsTable.tsx RequestsTableSection) ──────────── */

type SetupRow = {
  message: SetupMessage;
  prompt: string;
  status: ResponseStatus;
};

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const CLOCK_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** RequestsTable's column sort keys, read off a setup row. Device and
 *  latency have no value, so they sort as null (last). */
function setupSortValue(
  row: SetupRow,
  key: string,
  traffic: SetupTraffic
): string | number | null {
  switch (key) {
    case "time":
      return row.message.sentAt.getTime();
    case "status":
      return row.status;
    case "guardrail":
      return row.message.guardrail;
    case "keyId":
      return traffic.keyLabel;
    case "message":
      return row.prompt;
    case "conversation":
      return traffic.conversation.title;
    case "model":
      return row.message.model.label;
    case "inTokens":
      return row.message.inTokens;
    default:
      return null;
  }
}

function SetupMessagesTable({
  traffic,
  range,
  customRange,
  now,
}: {
  traffic: SetupTraffic;
  range: RangeKey;
  customRange: CustomRange | null;
  now: Date;
}) {
  // The messages in the selected range, newest first: the same window the
  // hero counts, so its total and the footer's count agree.
  const rows = useMemo<SetupRow[]>(() => {
    const anchor = anchorOf(traffic.messages);
    return traffic.messages
      .filter((m) => inRange(m, range, customRange, anchor))
      .map((message) => ({
        message,
        prompt: PROMPT_BY_ID[message.id],
        status: statusOf(message),
      }));
  }, [traffic, range, customRange]);
  const sentAts = useMemo(
    () => traffic.messages.map((m) => m.sentAt),
    [traffic]
  );
  // The Filters dialog's lists, read off the two messages: their key and
  // model. No device is recorded, so Device name offers only "All devices".
  const modelOptions = useMemo(
    () => [
      ...new Map(traffic.messages.map((m) => [m.model.id, m.model])).values(),
    ],
    [traffic]
  );

  const [query, setQuery] = useState("");
  const [model, setModel] = useState("all");
  const [keyId, setKeyId] = useState("all");
  const [device, setDevice] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [guardrailFilter, setGuardrailFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    model,
    keyId,
    device,
    responseFilter,
    guardrailFilter,
  ].filter((v) => v !== "all").length;
  // Staged-Apply drafts, as on the Pro table: the dialog's Selects bind to
  // these, re-seeded from the committed filters on every open.
  const [draftModel, setDraftModel] = useState("all");
  const [draftKeyId, setDraftKeyId] = useState("all");
  const [draftDevice, setDraftDevice] = useState("all");
  const [draftResponseFilter, setDraftResponseFilter] = useState("all");
  const [draftGuardrailFilter, setDraftGuardrailFilter] = useState("all");
  const draftActiveFilterCount = [
    draftModel,
    draftKeyId,
    draftDevice,
    draftResponseFilter,
    draftGuardrailFilter,
  ].filter((v) => v !== "all").length;
  const openFilters = useCallback(() => {
    setDraftModel(model);
    setDraftKeyId(keyId);
    setDraftDevice(device);
    setDraftResponseFilter(responseFilter);
    setDraftGuardrailFilter(guardrailFilter);
    setFiltersOpen(true);
  }, [model, keyId, device, responseFilter, guardrailFilter]);
  const resetFilters = useCallback(() => {
    setDraftModel("all");
    setDraftKeyId("all");
    setDraftDevice("all");
    setDraftResponseFilter("all");
    setDraftGuardrailFilter("all");
  }, []);
  const applyFilters = useCallback(() => {
    setModel(draftModel);
    setKeyId(draftKeyId);
    setDevice(draftDevice);
    setResponseFilter(draftResponseFilter);
    setGuardrailFilter(draftGuardrailFilter);
    setFiltersOpen(false);
  }, [
    draftModel,
    draftKeyId,
    draftDevice,
    draftResponseFilter,
    draftGuardrailFilter,
  ]);

  const [rowsPerPage, setRowsPerPage] = useState("25");
  // A new range or search starts on page 1 (the Pro table's scope key).
  const rangeScopeKey =
    range === "custom"
      ? `${range}:${customRange?.from.getTime() ?? "none"}:${customRange?.to.getTime() ?? "none"}`
      : range;
  const pageScopeKey = `${rangeScopeKey}|${query}`;
  const [paging, setPaging] = useState<{ scopeKey: string; page: number }>(
    () => ({ scopeKey: pageScopeKey, page: 1 })
  );
  const page = paging.scopeKey === pageScopeKey ? paging.page : 1;
  const setPage = useCallback(
    (next: number) => {
      setPaging({ scopeKey: pageScopeKey, page: next });
    },
    [pageScopeKey]
  );

  // The Pro filters, ANDed, then the search over what the row shows: model
  // label, key name and the message text. `slow` matches nothing: no
  // latency is recorded for these messages. No device is recorded either,
  // so a picked device matches nothing.
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesResponse =
        responseFilter === "all" ? true : r.status === responseFilter;
      const matchesGuardrail =
        guardrailFilter === "all"
          ? true
          : r.message.guardrail === guardrailFilter;
      const matchesModel =
        model === "all" ? true : r.message.model.id === model;
      const matchesKey = keyId === "all" ? true : traffic.keyLabel === keyId;
      const matchesDevice = device === "all";
      if (
        !(
          matchesResponse &&
          matchesGuardrail &&
          matchesModel &&
          matchesKey &&
          matchesDevice
        )
      ) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [r.message.model.label, traffic.keyLabel, r.prompt].some((field) =>
        field.toLowerCase().includes(q)
      );
    });
  }, [
    rows,
    traffic,
    responseFilter,
    guardrailFilter,
    model,
    keyId,
    device,
    query,
  ]);

  const { sort, toggle: toggleSort } = useTableSort();
  const sortValue = useCallback(
    (row: SetupRow, key: string) => setupSortValue(row, key, traffic),
    [traffic]
  );
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, sortValue),
    [filteredRows, sort, sortValue]
  );
  const perPage = resolveRowsPerPage(rowsPerPage, sortedRows.length);
  const pagedRows = sortedRows.slice((page - 1) * perPage, page * perPage);
  const isEmpty = filteredRows.length === 0;

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <SectionTitle>Recent messages</SectionTitle>
        {/* RequestsTable.tsx: below the @2xl container width the search
            takes row 1 and the two buttons split row 2 via flex-1. */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            ariaLabel="Search messages"
            className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
            onChange={setQuery}
            placeholder="Search message…"
            surface="elevated"
            value={query}
          />
          <Button
            aria-label={
              activeFilterCount > 0
                ? `Filters (${activeFilterCount} active)`
                : "Filters"
            }
            className="@2xl:flex-none flex-1"
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
          <Dialog onOpenChange={setFiltersOpen} open={filtersOpen}>
            <DialogContent className="w-full gap-4 sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle className="type-heading-20 text-foreground">
                  Filters
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label className="type-label-14 text-muted-foreground">
                  Key
                </Label>
                <Select onValueChange={setDraftKeyId} value={draftKeyId}>
                  <SelectTrigger
                    aria-label="Key"
                    className="w-full border-border bg-card text-foreground"
                    id="onboarding-filter-key"
                  >
                    <SelectValue placeholder="Key" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All keys</SelectItem>
                    <SelectItem value={traffic.keyLabel}>
                      {traffic.keyLabel}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="type-label-14 text-muted-foreground">
                  Device name
                </Label>
                <Select onValueChange={setDraftDevice} value={draftDevice}>
                  <SelectTrigger
                    aria-label="Device name"
                    className="w-full border-border bg-card text-foreground"
                    id="onboarding-filter-device"
                  >
                    <SelectValue placeholder="Device name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All devices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="type-label-14 text-muted-foreground">
                  Model
                </Label>
                <Select onValueChange={setDraftModel} value={draftModel}>
                  <SelectTrigger
                    aria-label="Model"
                    className="w-full border-border bg-card text-foreground"
                    id="onboarding-filter-model"
                  >
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All models</SelectItem>
                    {modelOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <VendorAvatar decorative vendor={m.vendor} />
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="type-label-14 text-muted-foreground">
                  Response
                </Label>
                <Select
                  onValueChange={setDraftResponseFilter}
                  value={draftResponseFilter}
                >
                  <SelectTrigger
                    aria-label="Response"
                    className="w-full border-border bg-card text-foreground"
                    id="onboarding-filter-response"
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
                <Label className="type-label-14 text-muted-foreground">
                  Guardrail
                </Label>
                <Select
                  onValueChange={setDraftGuardrailFilter}
                  value={draftGuardrailFilter}
                >
                  <SelectTrigger
                    aria-label="Guardrail"
                    className="w-full border-border bg-card text-foreground"
                    id="onboarding-filter-guardrail"
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

          <Button
            className="@2xl:ml-auto @2xl:flex-none flex-1"
            size="default"
            type="button"
            variant="outline"
          >
            <UploadIcon aria-hidden data-icon="inline-start" size={16} />
            Export CSV
          </Button>
        </div>
      </div>

      <SetupRetentionStatement now={now} sentAts={sentAts} />

      <Card density="flush">
        {isEmpty ? (
          <TableEmptyState
            body="Individual messages routed through the gateway will appear here."
            title="No messages"
          />
        ) : (
          <>
            {/* The Pro table's columns and widths, verbatim (RequestsTable.tsx
                carries the measured basis): eleven heads summing to 102% over
                a 1612px floor, so every column keeps its Pro pixel width and
                the card side-scrolls below the floor, as on Pro. */}
            <Table className="min-w-[1612px] table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableTableHead
                    className="w-[9.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="time"
                  >
                    Time
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[6%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="status"
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[6.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="guardrail"
                  >
                    Security
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[8.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="keyId"
                  >
                    Key
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[8%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="device"
                  >
                    Device name
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[15.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="message"
                  >
                    Message
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[15.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="conversation"
                  >
                    Conversation
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[12%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="model"
                  >
                    Model
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[8.5%] whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="inTokens"
                  >
                    Tokens In/Out
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[6.5%] whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="latency"
                  >
                    Latency
                  </SortableTableHead>
                  <CostHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((row) => (
                  <SetupMessageRow
                    key={row.message.id}
                    now={now}
                    row={row}
                    traffic={traffic}
                  />
                ))}
              </TableBody>
            </Table>
            <TablePaginationFooter
              minRowsPerPage={25}
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
  );
}

/** RequestsTable's Cost head with its billing tooltip, verbatim. */
function CostHead() {
  return (
    <TableHead className="w-[5.5%] whitespace-nowrap text-right">
      <span className="inline-flex items-center justify-end gap-1">
        Cost
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <span
                {...props}
                aria-label="About the Cost column"
                className="-m-1 inline-flex cursor-help rounded-sm p-1 text-muted-foreground hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                // biome-ignore lint/a11y/noNoninteractiveTabindex: the tooltip trigger must be focusable or its explanation is keyboard-unreachable (WCAG 2.1.1)
                tabIndex={0}
              >
                <Info aria-hidden className="size-4" strokeWidth={1.75} />
              </span>
            )}
          />
          <TooltipContent className="max-w-sm p-2 text-left">
            <span className="flex flex-col gap-2">
              <span className="flex items-start gap-2">
                <span className="flex shrink-0 items-center text-muted-foreground leading-5">
                  <CreditCard
                    aria-hidden
                    className="size-3.5 shrink-0"
                    strokeWidth={1.75}
                  />
                </span>
                <span>
                  <span className="type-label-12">Gateway</span> - Billed by
                  Gate AI; shows the exact charge.
                </span>
              </span>
              <span className="flex items-start gap-2">
                <span className="flex shrink-0 items-center text-muted-foreground leading-5">
                  <KeyRound
                    aria-hidden
                    className="size-3.5 shrink-0"
                    strokeWidth={1.75}
                  />
                </span>
                <span>
                  <span className="type-label-12">BYOK</span>{" "}
                  (Bring-your-own-key) - Billed directly by your provider.
                </span>
              </span>
            </span>
          </TooltipContent>
        </Tooltip>
      </span>
    </TableHead>
  );
}

/** One row in RequestsTable's cell styles. No detail page exists for a
 *  setup message, so the row is not clickable and Model is not a link. */
function SetupMessageRow({
  row,
  traffic,
  now,
}: {
  row: SetupRow;
  traffic: SetupTraffic;
  now: Date;
}) {
  const { message } = row;
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {/* Sans date, mono clock, relative time on hover (RequestsTable). */}
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <span {...props} className="text-foreground">
                <span className="type-copy-14 tabular-nums">
                  {DAY_FORMAT.format(message.sentAt)},
                </span>{" "}
                <span className="type-mono-14">
                  {CLOCK_FORMAT.format(message.sentAt)}
                </span>
              </span>
            )}
          />
          <TooltipContent>{formatRelative(message.sentAt, now)}</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={RESPONSE_BADGE[row.status].variant}>{row.status}</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={GUARDRAIL_BADGE[message.guardrail].variant}>
          {message.guardrail}
        </Badge>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap">
        {/* The key name truncates at the column edge; full value on hover. */}
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <span {...props} className="block truncate text-foreground">
                {traffic.keyLabel}
              </span>
            )}
          />
          <TooltipContent>{traffic.keyLabel}</TooltipContent>
        </Tooltip>
      </TableCell>
      {/* Device name: none is recorded for a setup message, so the Pro
          table's own missing state. */}
      <TableCell className="whitespace-nowrap">
        <span aria-hidden className="type-copy-14 text-muted-foreground">
          —
        </span>
        <span className="sr-only">No device recorded</span>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <span
                {...props}
                className="type-copy-14 block truncate text-foreground"
              >
                {row.prompt}
              </span>
            )}
          />
          <TooltipContent className="max-w-sm text-left">
            {row.prompt}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span
          className="type-copy-14 block truncate text-foreground"
          title={traffic.conversation.title}
        >
          {traffic.conversation.title}
        </span>
        <span className="type-mono-12 block text-muted-foreground">
          {traffic.conversation.id}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="flex w-full min-w-0 items-center gap-2">
          <VendorAvatar vendor={message.model.vendor} />
          <span
            className="type-copy-14 block truncate text-foreground"
            title={message.model.label}
          >
            {message.model.label}
          </span>
        </span>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
        {formatNumber(message.inTokens)}
        <span className="type-mono-12 block text-muted-foreground">
          {formatNumber(message.outTokens)}
        </span>
      </TableCell>
      {/* Latency: not measured for a setup message, so the Pro cell's dash,
          with the icon slot every Pro row reserves. */}
      <TableCell className="type-mono-14 whitespace-nowrap text-right">
        <span className="inline-flex items-center justify-end gap-1">
          <span aria-hidden className="size-3.5 shrink-0" />
          <span className="text-muted-foreground">—</span>
        </span>
      </TableCell>
      {/* Who bills it, as the Pro cost cell shows (RequestsTable.tsx
          isByokKey): Gate credits bill through Gate; Existing subscriptions
          bill through the user's provider, so no Gate charge. */}
      <TableCell className="type-mono-14 whitespace-nowrap text-right">
        {traffic.billing === "payg" ? (
          <span className="inline-flex items-center justify-end gap-2">
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <span
                    {...props}
                    aria-label="Billed by Gate (PAYG)"
                    className="-m-1 inline-flex cursor-help rounded-sm p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    // biome-ignore lint/a11y/noNoninteractiveTabindex: the tooltip trigger must be focusable or its explanation is keyboard-unreachable (WCAG 2.1.1)
                    tabIndex={0}
                  >
                    <CreditCard
                      aria-hidden
                      className="size-3.5 shrink-0"
                      strokeWidth={1.75}
                    />
                  </span>
                )}
              />
              <TooltipContent>Billed by Gate (PAYG)</TooltipContent>
            </Tooltip>
            <span className="text-foreground">
              {formatCurrency(message.costUsd, { minFrac: 4, maxFrac: 4 })}
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center justify-end gap-2">
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <span
                    {...props}
                    aria-label="Billed by your provider (BYOK)"
                    className="-m-1 inline-flex cursor-help rounded-sm p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    // biome-ignore lint/a11y/noNoninteractiveTabindex: the tooltip trigger must be focusable or its explanation is keyboard-unreachable (WCAG 2.1.1)
                    tabIndex={0}
                  >
                    <KeyRound
                      aria-hidden
                      className="size-3.5 shrink-0"
                      strokeWidth={1.75}
                    />
                  </span>
                )}
              />
              <TooltipContent>Billed by your provider (BYOK)</TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground">—</span>
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
