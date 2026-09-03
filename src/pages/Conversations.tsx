import { useMemo, useState } from "react";
import {
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
import { formatCompactCount, formatSparkLabel } from "@/lib/formatters";
import {
  type CustomRange,
  effectiveScale,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
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

const SPARK: Record<
  Range,
  { conversations: number[]; avgTurns: number[]; avgCost: number[] }
> = {
  all: {
    conversations: [280, 340, 310, 380, 350, 410, 385, 415, 420],
    avgTurns: [11.2, 12.8, 11.6, 13.4, 12.9, 14.1, 13.5, 14.0, 14.2],
    avgCost: [0.101, 0.095, 0.098, 0.091, 0.093, 0.087, 0.089, 0.083, 0.082],
  },
  "30d": {
    conversations: [348, 368, 382, 371, 395, 383, 408, 398, 420],
    avgTurns: [13.1, 13.6, 13.4, 13.8, 13.6, 14.1, 13.9, 14.1, 14.2],
    avgCost: [0.091, 0.088, 0.09, 0.086, 0.088, 0.084, 0.086, 0.083, 0.082],
  },
  "7d": {
    conversations: [10, 12, 9, 11, 13, 10, 12, 11, 12],
    avgTurns: [13.4, 14.8, 13.1, 14.2, 14.9, 13.6, 14.5, 13.9, 14.2],
    avgCost: [0.087, 0.082, 0.09, 0.083, 0.085, 0.08, 0.084, 0.079, 0.082],
  },
  "24h": {
    conversations: [11, 13, 10, 12, 14, 11, 13, 12, 12],
    avgTurns: [14.0, 14.5, 13.8, 14.3, 14.7, 14.1, 14.4, 14.0, 14.2],
    avgCost: [0.083, 0.081, 0.084, 0.082, 0.08, 0.083, 0.081, 0.082, 0.082],
  },
  custom: {
    conversations: [380, 395, 410, 405, 415, 408, 418, 412, 420],
    avgTurns: [13.6, 14.0, 13.8, 14.2, 14.0, 14.4, 14.1, 14.3, 14.2],
    avgCost: [0.088, 0.085, 0.087, 0.084, 0.086, 0.083, 0.085, 0.082, 0.082],
  },
};

// Sparkline tooltip dates. These KPI sparklines are illustrative trends
// (authored as fixed 9-point arrays) with no real timestamps. We derive
// evenly-spaced bucket dates ending at the demo clock's "now" so the hover
// card can show a date beside each value. The values themselves stay
// illustrative. Consumers copy this Date before stepping it; never mutate it.
const SPARK_POINTS = 9;
const SPARK_TODAY = DEMO_NOW;

/** Avg Cost / Conv — the mean of what these conversations actually cost,
 *  Gate-metered rows only. Every term is a `costOf` sum over one
 *  conversation's request rows, so the tile agrees with the Cost column two
 *  inches below it and with the Models page's per-1M rates. It was hardcoded
 *  at "$0.082" until 2026-08-03, which no row on the page added up to. */
const AVG_COST_PER_CONVERSATION = avgCostPerConversation(
  CONVERSATION_ROWS,
  REQUEST_ROWS_ALL
);

/** The authored `avgCost` arrays are trend SHAPE, not money — all five ranges
 *  land on the same terminal point. Rescale so that terminal point IS the
 *  derived KPI: the sparkline's last dot and the number beside it are the same
 *  fact, and a reader hovering the tile cannot be shown two different answers. */
function avgCostSeries(shape: number[], avgCost: number): number[] {
  const last = shape.at(-1) ?? 0;
  if (last === 0) {
    return shape;
  }
  return shape.map((v) => (v / last) * avgCost);
}

function sparkDates(range: Range, customRange: CustomRange | null): string[] {
  const last = SPARK_POINTS - 1;
  const labels: string[] = [];

  if (range === "custom" && customRange) {
    const span = customRange.to.getTime() - customRange.from.getTime();
    for (let i = 0; i < SPARK_POINTS; i++) {
      labels.push(
        formatSparkLabel(
          new Date(customRange.from.getTime() + (span * i) / last)
        )
      );
    }
    return labels;
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
    labels.push(formatSparkLabel(d, preset === "24h"));
  }
  return labels;
}

// The Conversations KPI is the COUNT of conversations in the range; its
// sparkline shows per-bucket volume that must SUM to that KPI total (mirrors the
// backend getStats, where the daily buckets and the count agree). Each range's
// authored array is treated as the bucket *shape* and rescaled to the total via
// largest-remainder rounding, so the integer buckets sum to the total exactly.
function distributeTotal(total: number, shape: number[]): number[] {
  const shapeSum = shape.reduce((sum, w) => sum + w, 0);
  if (shapeSum <= 0) {
    return shape.map(() => 0);
  }
  const exact = shape.map((w) => (total * w) / shapeSum);
  const floored = exact.map((v) => Math.floor(v));
  let remainder = total - floored.reduce((sum, v) => sum + v, 0);
  const byFraction = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floored];
  for (let k = 0; remainder > 0 && k < byFraction.length; k += 1) {
    result[byFraction[k].i] += 1;
    remainder -= 1;
  }
  return result;
}

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
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
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
  const conversationsTotal = Math.round(
    CONVERSATIONS_TOTAL *
      scope.requestShare *
      effectiveScale(range, customRange)
  );
  const conversationsValue = formatCompactCount(conversationsTotal);
  // Admin reads the org canon; a scoped user reads their own conversations'
  // arithmetic (mean turns, mean metered cost), so the tiles and the table
  // below describe the same rows.
  const own = scope.scoped
    ? scopedSeeds(scope).map((seed) =>
        getConversationView(seed, REQUEST_ROWS_ALL)
      )
    : null;
  const avgTurns = own
    ? own.length === 0
      ? 0
      : own.reduce((a, v) => a + v.turns, 0) / own.length
    : 14.2;
  const avgCost = own
    ? avgCostPerConversation(scopedSeeds(scope), REQUEST_ROWS_ALL)
    : AVG_COST_PER_CONVERSATION;
  const spark = SPARK[range];
  const sparkLabels = sparkDates(range, customRange);
  const conversationsSpark = distributeTotal(
    conversationsTotal,
    spark.conversations
  );
  return (
    <KpiRailShell columns={3}>
      <CompactKpi
        delta="+6.4%"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-7)"
            data={conversationsSpark}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => Math.round(v).toLocaleString("en-US")}
          />
        }
        title="Conversations"
        value={conversationsValue}
      />
      <CompactKpi
        delta="+1.8"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-3)"
            data={spark.avgTurns}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => v.toFixed(1)}
          />
        }
        title="Avg turns"
        value={avgTurns.toFixed(1)}
      />
      <CompactKpi
        delta="-3.1%"
        deltaInverted
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={avgCostSeries(spark.avgCost, avgCost)}
            endDot
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => `$${v.toFixed(3)}`}
          />
        }
        title="Avg cost / conv"
        value={`$${avgCost.toFixed(3)}`}
      />
    </KpiRailShell>
  );
}

/* ─── Conversations table section (toolbar + table + pagination) ─────── */

// Synthetic total — held at module scope so pagination math reconciles
// with the KPI rail's "Conversations: 100" figure.
const CONVERSATIONS_TOTAL = 100;

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
    case "vendors":
      return row.vendors.map((v) => VENDOR_META[v].label).sort()[0] ?? null;
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
  return Math.round(Number(s.replace(/,/g, "")) * scale).toLocaleString(
    "en-US"
  );
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
  const scale = effectiveScale(range, customRange);
  const scope = useViewScope();
  const keyOptions = scope.keyNames
    ? [...scope.keyNames]
    : ["prod-web", "prod-agent", "test-key"];
  const [keyId, setKeyId] = useState("all");
  const [model, setModel] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  const isFiltered = keyId !== "all" || model !== "all";
  const { sort, toggle: toggleSort } = useTableSort();
  const viewRows = useMemo(
    () =>
      scopedSeeds(scope).map((seed) =>
        getConversationView(seed, REQUEST_ROWS_ALL)
      ),
    [scope]
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
  const paginationTotal = isFiltered
    ? visibleRows.length
    : Math.round(CONVERSATIONS_TOTAL * scope.requestShare * scale);
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
      const match = viewRows.find((r) => r.conversationId === openId);
      if (match) {
        setSelectedRow(match);
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
                  {visibleRows.map((row) => (
                    <TableRow
                      className="cursor-pointer transition-[background-color] duration-150 ease-out hover-fine:bg-accent motion-reduce:transition-none"
                      key={row.conversationId}
                      onClick={() =>
                        navigate(`/conversations-trace/${row.conversationId}`)
                      }
                    >
                      <TableCell className="max-w-0 whitespace-nowrap">
                        <RowActionButton
                          aria-label={`Inspect conversation ${row.title}`}
                          layout="stack"
                          onClick={() =>
                            navigate(
                              `/conversations-trace/${row.conversationId}`
                            )
                          }
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
