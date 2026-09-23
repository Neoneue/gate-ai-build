import { useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { VENDOR_META } from "@/components/icons/vendor-meta";
import { Card } from "@/components/ui/card";
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
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
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { resolveRowsPerPage } from "@/components/ui/table-pagination";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Timestamp } from "@/components/ui/timestamp";
import {
  avgCostPerConversation,
  getConversationView,
} from "@/data/conversationDetail";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { parseNumeric, sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { DEMO_NOW } from "@/lib/demo-clock";
import {
  formatChartTooltipDate,
  formatCompactCount,
  formatNumber,
} from "@/lib/formatters";
import { withTierOf } from "@/lib/plan";
import {
  type CustomRange,
  effectiveScale,
  inRangeWindow,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
  rangeWindow,
} from "@/lib/range";
import { ConversationDetailDialog } from "./conversations/ConversationDetail";
import { MODEL_FILTER_OPTIONS } from "./conversations/data";
import type { ConversationRow } from "./conversations/types";
import { inScope, useViewScope, type ViewScope } from "./teams/view-scope";

/** The conversations the signed-in user may read: Admin every one, a
 *  Manager or Member those their own keys initiated (view-scope.ts). */
function scopedSeeds(scope: ViewScope): ConversationRow[] {
  return CONVERSATION_ROWS.filter((c) => inScope(scope, c.initiator));
}

/** Those same conversations, narrowed to the selected range.
 *
 *  The range pills are a FILTER on each conversation's real `updated` date, not
 *  a multiplier. This one array is the single source for the KPI count, all
 *  three sparklines, the table and the pagination footer, so those numbers
 *  cannot disagree with each other. Until 2026-09-23 the pills changed nothing
 *  here — they scaled a synthetic total by `RANGE_SCALE`, which is how the page
 *  came to advertise 850 conversations over a table that owned 8. */
function rangedSeeds(
  scope: ViewScope,
  range: Range,
  customRange: CustomRange | null
): ConversationRow[] {
  const window = rangeWindow(range, customRange);
  return scopedSeeds(scope).filter((c) => inRangeWindow(c.updated, window));
}

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-014 — Conversations (Observability)
 *
 * Conversation-grouped view of gateway traffic. Each row is a chain of
 * requests sharing session context (agent runs, multi-turn chats, tool
 * loops). Production-shell chrome — sidebar + screen-head + topbar —
 * comes from `_shared/DashboardChrome` and is shared with CMP-012 /
 * CMP-013. This file owns the page-internal pieces only: PageHeader,
 * KpiRail, ConversationsTableSection.
 * ───────────────────────────────────────────────────────────────────────── */

// Sparkline bucket anchors. Nine evenly-spaced instants ending at the demo
// clock's "now", spanning the selected range. The rail buckets its rows against
// this array and labels that same array with `labelDates`, so the value a hover
// card shows belongs to the day the hover card names. There is deliberately no
// separate label function to drift out of step with it. Consumers copy these
// Dates before stepping them; never mutate.
const SPARK_POINTS = 9;
const SPARK_TODAY = DEMO_NOW;

function sparkBucketDates(
  range: Range,
  customRange: CustomRange | null
): Date[] {
  const last = SPARK_POINTS - 1;
  const dates: Date[] = [];

  if (range === "custom" && customRange) {
    const span = customRange.to.getTime() - customRange.from.getTime();
    for (let i = 0; i < SPARK_POINTS; i++) {
      dates.push(new Date(customRange.from.getTime() + (span * i) / last));
    }
    return dates;
  }

  const preset: PresetRange = range === "custom" ? "all" : range;
  for (let i = 0; i < SPARK_POINTS; i++) {
    const stepsBack = last - i;
    const d = new Date(SPARK_TODAY);
    if (preset === "24h") {
      d.setHours(d.getHours() - stepsBack * 3);
    } else if (preset === "all") {
      d.setMonth(d.getMonth() - stepsBack);
    } else {
      d.setDate(d.getDate() - stepsBack * (preset === "30d" ? 4 : 1));
    }
    dates.push(d);
  }
  return dates;
}

/** Tooltip date strings for a bucket list — one shape site-wide (design.md
 *  "Chart tooltip & legend"); the year appears only when the window spans
 *  two of them, which the lifetime range does. The rail labels the very same
 *  array it buckets its rows against, so a point's date and its value can
 *  never describe different slices of time. */
function labelDates(dates: Date[], granularity: "hour" | "day"): string[] {
  const span = {
    start: dates[0] ?? new Date(),
    end: dates.at(-1) ?? new Date(),
  };
  return dates.map((d) => formatChartTooltipDate(d, granularity, span));
}

// The Conversations KPI is the COUNT of conversations in the range; its
// sparkline shows per-bucket volume that must SUM to that KPI total (mirrors the
// backend getStats, where the daily buckets and the count agree). That used to
// be forced — an authored 9-point trend shape rescaled onto the total by
// largest-remainder rounding. It is now free, because the buckets ARE the
// count: every conversation is dropped into the bucket its real `updated` date
// falls in, and the bucket heights are how many landed there.
//
// `boundaries[i]` is the END of bucket i. Anything older than the first
// boundary lands in bucket 0 and anything newer than the last lands in the
// last; those two clamps are what guarantee the sum, whatever window the row
// filter used.
function bucketOf(d: Date, boundaries: Date[]): number {
  const t = d.getTime();
  for (let i = 0; i < boundaries.length; i += 1) {
    if (t <= boundaries[i].getTime()) {
      return i;
    }
  }
  return boundaries.length - 1;
}

/** The filtered rows split across the sparkline's buckets, oldest bucket first. */
function bucketRows(
  rows: ConversationRow[],
  boundaries: Date[]
): ConversationRow[][] {
  const buckets: ConversationRow[][] = boundaries.map(() => []);
  for (const row of rows) {
    buckets[bucketOf(row.updated, boundaries)].push(row);
  }
  return buckets;
}

/** A running statistic across those buckets: point i is `stat` applied to every
 *  row up to and including bucket i. The LAST point is therefore the KPI beside
 *  it, by construction — the tile's number and the end of its line are one
 *  fact. `avgCostSeries` used to fake that by rescaling an authored shape until
 *  its terminal point landed on the KPI.
 *
 *  `stat` returns null while it has nothing to average: no rows yet, or no
 *  Gate-metered row yet. Leading nulls hold at the first value the data can
 *  prove rather than drawing a zero nothing recorded. If the window never
 *  yields one, the series is flat at 0 and the tooltip reads "—". */
function runningSeries(
  buckets: ConversationRow[][],
  stat: (rows: ConversationRow[]) => number | null
): number[] {
  const seen: ConversationRow[] = [];
  const points = buckets.map((bucket) => {
    seen.push(...bucket);
    return stat(seen);
  });
  const first = points.find((v) => v !== null) ?? 0;
  return points.map((v) => v ?? first);
}

/** A mean with no rows behind it is not 0, it is unknown — the tiles and their
 *  tooltips print an em dash for it, the same mark the Cost column already uses
 *  for a conversation Gate could not meter. */
const NO_VALUE = "—";

export function Conversations() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [range, setRange] = useState<Range>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  return (
    <DashboardChrome
      activeNavId="conversations"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      <div className="flex flex-col gap-4">
        <OverviewBar
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
      </div>
      <ConversationsTableSection customRange={customRange} range={range} />
    </DashboardChrome>
  );
}

/* ─── Overview bar — heading + range controls, label FOR the KPI rail ─────
 * Mirrors AuditTrail's OverviewBar verbatim. The range state lives in
 * Conversations(); the SegmentedPill + DateRangePicker are wired to the same
 * handlers, sized sm (32px) to sit tight above the rail. */
function OverviewBar({
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
    <div className="flex flex-wrap items-center justify-between gap-4">
      <SectionTitle>Overview</SectionTitle>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedPill
          aria-label="Time range"
          onValueChange={(v) => onRangeChange(v as PresetRange)}
          options={RANGE_OPTIONS}
          size="sm"
          value={range === "custom" ? "" : range}
        />
        <DateRangePicker
          onChange={onCustomRangeChange}
          size="sm"
          value={customRange}
        />
      </div>
    </div>
  );
}

/* ─── Page header — eyebrow + title + description + actions ──────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        {/* h2 — see CMP012 PageHeader note. */}
        <PageTitle>Conversations</PageTitle>
        <p className="type-copy-18 m-0 text-pretty text-muted-foreground tracking-snug">
          A conversation is a chain of messages that share session context:
          agent runs, multi-turn chats, tool-calling loops. Click any row to see
          its message thread.
        </p>
      </div>
    </div>
  );
}

/* ─── KPI Rail (4 cards — Spend / 24h omitted per request) ────────────── */

function KpiRail({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const scope = useViewScope();
  // ONE read of the conversations this viewer may see IN THIS RANGE, shared by
  // the count, by the per-conversation means, and by all three sparklines. The
  // table below filters the same array, so the headline cannot advertise rows
  // the table does not own — it used to multiply a synthetic 100 by the range
  // scale and claim 850 over 8 rows.
  //
  // Every role reads the same arithmetic now. Admin used to fall back to a
  // literal 14.2 turns and a lifetime-wide cost constant, which is why its
  // tiles described a workspace the table never showed.
  const rail = useMemo(() => {
    const seeds = rangedSeeds(scope, range, customRange);
    const rows = seeds.map((seed) =>
      getConversationView(seed, REQUEST_ROWS_ALL)
    );
    const boundaries = sparkBucketDates(range, customRange);
    const buckets = bucketRows(rows, boundaries);
    const meanTurns = (of: ConversationRow[]) =>
      of.length === 0 ? null : of.reduce((a, r) => a + r.turns, 0) / of.length;
    // BYOK sessions carry no Gate-metered cost at all, so a window holding only
    // BYOK conversations has no mean to report — `avgCostPerConversation`
    // returns 0 for an empty metered set, and $0.000 is not what happened.
    const meanCost = (of: ConversationRow[]) =>
      of.some((r) => r.cost.trim() !== NO_VALUE)
        ? avgCostPerConversation(of, REQUEST_ROWS_ALL)
        : null;
    return {
      count: rows.length,
      avgTurns: meanTurns(rows),
      avgCost: meanCost(rows),
      labels: labelDates(boundaries, range === "24h" ? "hour" : "day"),
      countSpark: buckets.map((b) => b.length),
      turnsSpark: runningSeries(buckets, meanTurns),
      costSpark: runningSeries(buckets, meanCost),
    };
  }, [scope, range, customRange]);
  return (
    <KpiRailShell columns={3}>
      {/* No deltas anywhere on this rail. The three tiles used to carry a
          hardcoded "+6.4%", "+1.8" and "-3.1%" — against a range-filtered count
          of 1 or 8 those imply prior periods this mock has no rows for, and the
          real build shows none. Each tile states what it can prove.

          The sparks are real histograms now: every conversation is dropped into
          the bucket its own `updated` date falls in, so the buckets sum to the
          count because they ARE the count, and the hover names the day the row
          actually landed on. A sparse window reads sparse — 24H is one dot,
          because one conversation ran. */}
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-7)"
            data={rail.countSpark}
            labels={rail.labels}
            tooltip
            valueFormatter={(v) => formatNumber(Math.round(v))}
          />
        }
        title="Conversations"
        value={formatCompactCount(rail.count)}
      />
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-3)"
            data={rail.turnsSpark}
            labels={rail.labels}
            tooltip
            valueFormatter={(v) => (v === 0 ? NO_VALUE : v.toFixed(1))}
          />
        }
        title="Avg turns"
        value={rail.avgTurns === null ? NO_VALUE : rail.avgTurns.toFixed(1)}
      />
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={rail.costSpark}
            endDot
            labels={rail.labels}
            tooltip
            valueFormatter={(v) => (v === 0 ? NO_VALUE : `$${v.toFixed(3)}`)}
          />
        }
        title="Avg cost / conv"
        value={rail.avgCost === null ? NO_VALUE : `$${rail.avgCost.toFixed(3)}`}
      />
    </KpiRailShell>
  );
}

/* ─── Conversations table section (toolbar + table + pagination) ─────── */

// Sort accessor for the conversations table. Numeric columns parse the raw
// (unscaled) row value — the proportional scale applied at render preserves
// ordering, so sorting on the base figure matches what the user sees. Models
// is intentionally absent (vendor-avatar set has no clean comparable value).
function conversationSortValue(
  row: ConversationRow,
  key: string
): string | number | null {
  switch (key) {
    case "title":
      return row.title;
    case "initiator":
      return row.initiator;
    // Models column is a multi-vendor set rendered as icons; sort by the
    // alphabetically-first vendor label so the column orders by the brand shown.
    case "vendors": {
      let minLabel: string | null = null;
      for (const v of row.vendors) {
        const label = VENDOR_META[v].label;
        if (minLabel === null || label < minLabel) {
          minLabel = label;
        }
      }
      return minLabel;
    }
    case "turns":
      return row.turns;
    case "reqs":
      return row.reqs;
    case "inTokens":
      return parseNumeric(row.inTokens);
    case "outTokens":
      return parseNumeric(row.outTokens);
    case "cost":
      return parseNumeric(row.cost);
    case "updated":
      return row.updated.getTime();
    default:
      return null;
  }
}

function scaleTokenStr(s: string, scale: number): string {
  return formatNumber(Math.round(Number(s.replace(/,/g, "")) * scale));
}
function scaleCostStr(s: string, scale: number): string {
  const parsed = Number.parseFloat(s.replace("$", "")) * scale;
  if (!Number.isFinite(parsed)) {
    return "—";
  }
  return "$" + parsed.toFixed(4);
}

function ConversationsTableSection({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tracePath = (id: string) =>
    withTierOf(pathname, `/conversations-trace/${id}`);
  const scale = effectiveScale(range, customRange);
  const scope = useViewScope();
  const keyOptions = scope.keyNames
    ? [...scope.keyNames]
    : ["prod-web", "prod-agent", "test-key"];
  const [keyId, setKeyId] = useState("all");
  const [model, setModel] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  // Reset to page 1 whenever a filter changes — render-time derived state, not
  // a useEffect (see security/EventsTable for the canonical shape). Without it
  // a narrowing filter can strand the user on a page that no longer exists.
  // The range belongs in this key now that it narrows rows rather than scaling
  // them: pressing 24H from page 2 of the lifetime list would otherwise land on
  // an empty page.
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${range}|${customRange?.from.getTime() ?? ""}|${customRange?.to.getTime() ?? ""}|${keyId}|${model}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }
  const { sort, toggle: toggleSort } = useTableSort();
  // The range filter runs FIRST, so the Key and Model selects narrow what the
  // range already left standing — and the rail above reads the identical array.
  const viewRows = useMemo(
    () =>
      rangedSeeds(scope, range, customRange).map((seed) =>
        getConversationView(seed, REQUEST_ROWS_ALL)
      ),
    [scope, range, customRange]
  );
  const filteredRows = useMemo(
    () =>
      viewRows.filter((row) => {
        if (keyId !== "all" && row.initiator !== keyId) {
          return false;
        }
        if (model !== "all" && !row.models.includes(model)) {
          return false;
        }
        return true;
      }),
    [viewRows, keyId, model]
  );
  // Sort AFTER filtering, BEFORE render. Default (key=null) preserves authored order.
  const visibleRows = useMemo(
    () => sortRows(filteredRows, sort, conversationSortValue),
    [filteredRows, sort]
  );
  const paginationTotal = visibleRows.length;
  // Slice for the current page. `resolveRowsPerPage` owns the page math, the
  // same helper the footer uses for its "Showing N–M of T" line, so the two
  // cannot drift. Until this landed the table rendered every row regardless
  // of the Rows select, which made the control a no-op.
  const perPage = resolveRowsPerPage(rowsPerPage, paginationTotal);
  const pagedRows = visibleRows.slice((page - 1) * perPage, page * perPage);
  const isEmpty = visibleRows.length === 0;
  // Row-click drill-in. `selectedRow` doubles as the sheet's `open` signal —
  // null = closed, a row = open. Mirrors CMP-013's RequestDetailSheet.
  const [selectedRow, setSelectedRow] = useState<ConversationRow | null>(null);

  // Deep-link support: `?open=cnv_xxx` opens that conversation on mount.
  // Used by the Requests page to navigate here with a specific row pre-opened.
  // Closing the modal strips the param so the URL reflects state.
  //
  // The ref tracks the last openId we acted on. Without it, the close path
  // hits a reopen-loop: setSelectedRow(null) and setSearchParams() commit on
  // different renders, so for one frame selectedRow is null but openId still
  // points at the row — the effect would re-open the modal the user just
  // dismissed. Gating on lastProcessedOpenId makes the effect URL-driven
  // only, not state-driven.
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const [prevOpenId, setPrevOpenId] = useState<string | null>(null);
  if (openId !== prevOpenId) {
    setPrevOpenId(openId);
    if (openId) {
      // Searched against the viewer's whole scoped set, not the ranged one: a
      // deep link names one conversation by id and must open it whatever the
      // range pills happen to be showing.
      const seed = scopedSeeds(scope).find((r) => r.conversationId === openId);
      if (seed) {
        setSelectedRow(getConversationView(seed, REQUEST_ROWS_ALL));
      }
    }
  }

  return (
    <>
      <div className="mt-2 flex flex-col gap-4">
        {/* Recent conversations — section header on the page background,
          mirroring Requests' "Recent requests". The search + filter set
          live here as page-level section controls, so they always render
          (a query that returns zero results never hides them). isEmpty
          governs only the Card interior below. */}
        <div className="flex flex-col gap-4">
          <SectionTitle>Recent conversations</SectionTitle>
          {/* Container queries, not viewport ones — same conversion as
              RequestsTable. The Ask AI panel narrows this column without
              touching the viewport, so `md:` kept all three controls on one
              line and truncated the search to "Search by id, pr…".
              `<main>` declares `@container`, so `@2xl:` (672px inline-size)
              reads the column the toolbar actually lives in: below it the
              search takes row 1 full-width and the two Selects split row 2
              evenly via `min-w-0 flex-1` (the `min-w-0` is load-bearing —
              a SelectTrigger's intrinsic label width would otherwise stop
              the two cells landing on an even 50/50). */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              ariaLabel="Search conversations"
              className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
              placeholder="Search by id, prompt, user, key…"
              surface="elevated"
            />
            <Select onValueChange={setKeyId} value={keyId}>
              <SelectTrigger
                aria-label="Key"
                className="min-w-0 @2xl:flex-none flex-1 border-border bg-card text-foreground"
              >
                <SelectValue placeholder="Key" />
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
            <Select onValueChange={setModel} value={model}>
              <SelectTrigger
                aria-label="Model"
                className="min-w-0 @2xl:flex-none flex-1 border-border bg-card text-foreground"
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
        </div>

        <Card density="flush">
          {isEmpty ? (
            <TableEmptyState
              body="Multi-turn conversations grouped by key and model will appear here as your workspace routes traffic."
              title="No conversations"
            />
          ) : (
            <>
              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableTableHead
                      className="w-[24%] whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="title"
                    >
                      Conversation
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[10%] whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="initiator"
                    >
                      Key
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[5%] whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="vendors"
                    >
                      Models
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[5%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="turns"
                    >
                      Turns
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[5%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="reqs"
                    >
                      Reqs
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[9%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="inTokens"
                    >
                      Tokens in
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[9%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="outTokens"
                    >
                      Tokens out
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[8%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="cost"
                    >
                      Cost
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[11%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="updated"
                    >
                      Updated
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((row) => (
                    <TableRow
                      className="cursor-pointer transition-[background-color] duration-150 ease-out motion-reduce:transition-none"
                      key={row.conversationId}
                      onClick={() => navigate(tracePath(row.conversationId))}
                    >
                      <TableCell className="max-w-0 whitespace-nowrap">
                        <RowActionButton
                          aria-label={`Inspect conversation ${row.title}`}
                          href={tracePath(row.conversationId)}
                          layout="stack"
                        >
                          <span
                            className="type-label-14 truncate text-foreground"
                            title={row.title}
                          >
                            {row.title}
                          </span>
                          <span className="type-mono-12 text-muted-foreground">
                            {row.conversationId}
                          </span>
                        </RowActionButton>
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap">
                        <span className="text-foreground">{row.initiator}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div
                          aria-label={`Models: ${row.vendors.map((v) => VENDOR_META[v].label).join(", ")}`}
                          className="flex items-center gap-1"
                          role="img"
                        >
                          {row.vendors.map((v) => (
                            <VendorAvatar decorative key={v} vendor={v} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                        {row.turns}
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                        {row.reqs}
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                        {scaleTokenStr(row.inTokens, scale)}
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                        {scaleTokenStr(row.outTokens, scale)}
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                        {scaleCostStr(row.cost, scale)}
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                        <Timestamp date={row.updated} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePaginationFooter
                minRowsPerPage={25}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                page={page}
                rowsPerPage={rowsPerPage}
                total={paginationTotal}
              />
            </>
          )}
        </Card>
      </div>
      <ConversationDetailDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
          }
        }}
        onOpenChangeComplete={(open) => {
          // Strip ?open= AFTER the exit animation finishes — stripping it
          // inside onOpenChange triggers a router re-render mid-animation,
          // which reads as a flicker. Base UI fires this once the close
          // transition has fully completed.
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
