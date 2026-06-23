import {
  Activity,
  ArrowRight,
  ExternalLink,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { VENDOR_META, type Vendor } from "@/components/icons/vendor-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { CopyButton } from "@/components/ui/copy-button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogTitleBlock,
} from "@/components/ui/dialog";
import { Eyebrow } from "@/components/ui/eyebrow";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
import { MessageBlock, type MessageRole } from "@/components/ui/message-block";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timestamp } from "@/components/ui/timestamp";
import { ToolResultCode } from "@/components/ui/tool-result-code";
import {
  getConversationDetail,
  getConversationView,
} from "@/data/conversationDetail";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { parseNumeric, sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatSparkLabel } from "@/lib/formatters";

const REDUCE_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

type PresetRange = "all" | "24h" | "7d" | "30d";
type Range = PresetRange | "custom";
type CustomRange = { from: Date; to: Date };

const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
  { value: "all", label: "All" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

// Model filter options for the toolbar Select. Each carries its vendor so the
// item renders the brand icon (VendorAvatar) on the left.
const MODEL_FILTER_OPTIONS: { value: string; label: string; vendor: Vendor }[] =
  [
    { value: "claude-opus-4-7", label: "Claude Opus 4.7", vendor: "anthropic" },
    {
      value: "claude-sonnet-4-5",
      label: "Claude Sonnet 4.5",
      vendor: "anthropic",
    },
    {
      value: "claude-haiku-4-5",
      label: "Claude Haiku 4.5",
      vendor: "anthropic",
    },
    { value: "gpt-5", label: "GPT-5", vendor: "openai" },
    { value: "gpt-4o", label: "GPT-4o", vendor: "openai" },
    { value: "gpt-4o-mini", label: "GPT-4o-mini", vendor: "openai" },
    { value: "gemini-3-pro", label: "Gemini 3 Pro", vendor: "google" },
    { value: "gemini-3-flash", label: "Gemini 3 Flash", vendor: "google" },
    {
      value: "gemini-3-flash-lite",
      label: "Gemini 3 Flash Lite",
      vendor: "google",
    },
    { value: "llama-3-3-70b", label: "Llama 3.3 70B", vendor: "meta" },
  ];

const RANGE_SCALE: Record<PresetRange, number> = {
  "24h": 0.16,
  "7d": 1,
  "30d": 4.2,
  all: 8.5,
};

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
// evenly-spaced bucket dates ending at the mock "today" so the hover card can
// show a date beside each value — the values themselves stay illustrative.
const SPARK_POINTS = 9;
const SPARK_TODAY = new Date(2026, 5, 15, 12, 0, 0);

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
      <div className="flex max-w-1/2 flex-col gap-2">
        {/* h2 — see CMP012 PageHeader note. */}
        <PageTitle>Conversations</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-neutral-500 tracking-snug">
          A conversation is a chain of requests that share session context:
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
  const conversationsTotal = Math.round(
    100 * effectiveScale(range, customRange)
  );
  const conversationsValue = conversationsTotal.toLocaleString("en-US");
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
        title="Avg Turns"
        value="14.2"
      />
      <CompactKpi
        delta="-3.1%"
        deltaInverted
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={spark.avgCost}
            endDot
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => `$${v.toFixed(3)}`}
          />
        }
        title="Avg Cost / Conv"
        value="$0.082"
      />
    </KpiRailShell>
  );
}

/* ─── Conversations table section (toolbar + table + pagination) ─────── */

export type ConversationStatus = "active" | "completed" | "failed";

type ModelId =
  | "claude-opus-4-8"
  | "claude-opus-4-7"
  | "claude-sonnet-4-5"
  | "claude-haiku-4-5"
  | "gpt-5"
  | "gpt-5.3-codex"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-3-pro"
  | "gemini-3-flash"
  | "gemini-3-flash-lite"
  | "llama-3-3-70b";

export type ConversationRow = {
  title: string;
  conversationId: string;
  initiator: string;
  turns: number;
  reqs: number;
  vendors: Vendor[];
  models: ModelId[];
  inTokens: string;
  outTokens: string;
  cost: string;
  status: ConversationStatus;
  updated: Date;
  /** Conversation duration ("3m 53s") — surfaced in the detail sheet KPI rail. */
  duration: string;
};

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
  return "$" + (Number.parseFloat(s.replace("$", "")) * scale).toFixed(4);
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
  const [keyId, setKeyId] = useState("all");
  const [model, setModel] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  const isFiltered = keyId !== "all" || model !== "all";
  const { sort, toggle: toggleSort } = useTableSort();
  const viewRows = useMemo(
    () =>
      CONVERSATION_ROWS.map((seed) =>
        getConversationView(seed, REQUEST_ROWS_ALL)
      ),
    []
  );
  const filteredRows = useMemo(
    () =>
      viewRows.filter((row) => {
        if (keyId !== "all" && row.initiator !== keyId) {
          return false;
        }
        if (model !== "all" && !row.models.includes(model as ModelId)) {
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
    : Math.round(CONVERSATIONS_TOTAL * scale);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Recent conversations</SectionTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              ariaLabel="Search conversations"
              className="min-w-0 flex-1 shrink"
              placeholder="Search by id, prompt, user, key…"
              surface="elevated"
            />
            <Select onValueChange={setKeyId} value={keyId}>
              <SelectTrigger
                aria-label="Key"
                className="border-border bg-card font-normal text-foreground"
                size="sm"
              >
                <SelectValue placeholder="Key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All keys</SelectItem>
                <SelectItem value="prod-web">prod-web</SelectItem>
                <SelectItem value="prod-agent">prod-agent</SelectItem>
                <SelectItem value="test-key">test-key</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setModel} value={model}>
              <SelectTrigger
                aria-label="Model"
                className="border-border bg-card font-normal text-foreground"
                size="sm"
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
                      className="cursor-pointer transition-colors duration-150 ease-out hover-fine:bg-neutral-50 motion-reduce:transition-none"
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
                            className="type-copy-14 truncate text-neutral-900"
                            title={row.title}
                          >
                            {row.title}
                          </span>
                          <span className="font-mono text-neutral-500 text-xs">
                            {row.conversationId}
                          </span>
                        </RowActionButton>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-sm">
                        <span className="text-neutral-800">
                          {row.initiator}
                        </span>
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
                      <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 text-sm tabular-nums">
                        {row.turns}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 text-sm tabular-nums">
                        {row.reqs}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 text-sm tabular-nums">
                        {scaleTokenStr(row.inTokens, scale)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 text-sm tabular-nums">
                        {scaleTokenStr(row.outTokens, scale)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 text-sm tabular-nums">
                        {scaleCostStr(row.cost, scale)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-neutral-800 text-sm tabular-nums">
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

/* ─── Conversation detail modal ────────────────────────────────────────────
 * Centered modal (Dialog primitive) opened from a row title click. Started
 * as a right-docked Sheet mirroring CMP-013's pattern, but the conversation
 * scope adds a cross-link selection between Messages and Request Trace
 * that needs both panels visible simultaneously — sheets can't go wide
 * enough without crowding the page chrome behind them. Modal solves the
 * width problem and matches the original CTO mockup.
 *
 * Layout (top → bottom, fixed except where noted):
 *   header        eyebrow + title + meta + close
 *   identity row  status + cnv_id + initiator + Copy/Audit actions
 *   prompt quote  the user's opening message
 *   KPI rail      5 tiles (Requests / Turns / Tokens / Cost / Duration)
 *   body grid     Messages | Request Trace, side-by-side at lg, stacked
 *                 below — each panel scrolls internally
 *   footer        cross-link affordance copy + initiator/key/started meta
 *
 * Cross-link state (`activeRequestId`) is shared by both panels: clicking a
 * message bubble highlights the paired trace event and vice versa. State
 * persists if the user happens to be on a narrow viewport where the
 * panels stack — they can scroll between them without losing selection.
 * ────────────────────────────────────────────────────────────────────── */

function ConversationDetailDialog({
  row,
  onOpenChange,
  onOpenChangeComplete,
}: {
  row: ConversationRow | null;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
}) {
  // Hold the last non-null row so the body stays rendered during the
  // close animation. Without this, the modal briefly renders empty chrome
  // between selectedRow → null and the unmount, which reads as a flicker.
  const [stickyRow, setStickyRow] = useState<ConversationRow | null>(row);
  const [prevRow, setPrevRow] = useState<ConversationRow | null>(row);
  if (row !== prevRow) {
    setPrevRow(row);
    if (row) {
      setStickyRow(row);
    }
  }
  return (
    <Dialog
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      open={!!row}
    >
      <DialogScrollContent
        // 900px — wide enough for the two-column body to breathe at
        // typical desktop viewports, narrow enough that the dimmed page
        // behind reads as context. The shared scroll-shell primitive
        // provides max-h-[90vh] / flex-col / overflow-hidden; the inner
        // panels scroll independently inside the body.
        className="max-h-[calc(90vh-96px)] sm:max-w-[860px] [@media(max-height:800px)]:max-h-[90vh]"
      >
        {stickyRow ? <ConversationDetailBody row={stickyRow} /> : null}
      </DialogScrollContent>
    </Dialog>
  );
}

export function ConversationDetailBody({
  row,
  variant = "modal",
}: {
  row: ConversationRow;
  variant?: "page" | "modal";
}) {
  const navigate = useNavigate();
  // Cross-link selection state — clicking a message bubble or trace step
  // sets the active requestId; both panels paint the matching item with
  // the selection treatment (blue ring on the bubble, blue left-bar +
  // blue wash on the trace row). Click again to clear.
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  // Track which panel originated the selection so we only scroll the
  // counterpart panel into view (clicking a message in the Messages panel
  // shouldn't scroll the Messages panel itself — it was already where the
  // user clicked). `null` after a deselect or external mount.
  const [selectionSource, setSelectionSource] = useState<
    "messages" | "trace" | null
  >(null);
  const selectFromMessages = (id: string | null) => {
    setActiveRequestId(id);
    setSelectionSource(id ? "messages" : null);
  };
  const selectFromTrace = (id: string | null) => {
    setActiveRequestId(id);
    setSelectionSource(id ? "trace" : null);
  };

  // Finding / error tallies for the banner + step tabs, derived from the
  // trace. `warn` rows are policy findings (flagged / redacted); `danger`
  // rows are errors. Disjoint buckets — passing steps are neither.
  const detail = getConversationDetail(row, REQUEST_ROWS_ALL);
  const findingCount = detail.trace.filter((e) => e.finding).length;
  const errorCount = detail.trace.filter((e) => e.status === "danger").length;
  const actionRank = { Flag: 1, Redact: 2, Block: 3 } as const;
  const highestAction = detail.trace.reduce<"Flag" | "Redact" | "Block">(
    (hi, e) =>
      e.findingAction && actionRank[e.findingAction] > actionRank[hi]
        ? e.findingAction
        : hi,
    "Flag"
  );
  const bannerTone: "destructive" | "warning" =
    highestAction === "Block" ? "destructive" : "warning";

  // ── Findings-only view derivations ──────────────────────────────────────
  // A "finding step" = a trace event with a truthy `finding` label. The
  // Findings-only tab collapses every run of consecutive passing (non-finding)
  // steps into one muted "N passing request(s)" separator, preserving order.
  const findingIds = useMemo(
    () =>
      new Set(detail.trace.filter((e) => e.finding).map((e) => e.requestId)),
    [detail.trace]
  );
  // Interleave separators + finding events. Walk the full trace; accumulate
  // passing steps into a counter, and whenever a finding is reached (or the
  // trace ends) flush the accumulated run as a single separator before the
  // finding event.
  const findingTraceItems = useMemo<TraceRenderItem[]>(() => {
    const out: TraceRenderItem[] = [];
    let passing = 0;
    let sepSeq = 0;
    const flush = () => {
      if (passing > 0) {
        out.push({ kind: "separator", id: `sep-${sepSeq++}`, count: passing });
        passing = 0;
      }
    };
    for (const e of detail.trace) {
      if (e.finding) {
        flush();
        out.push({ kind: "event", event: e });
      } else {
        passing += 1;
      }
    }
    flush();
    return out;
  }, [detail.trace]);
  // Messages belonging to a finding request — no separator rows on this side,
  // just the filtered subset.
  const findingMessages = useMemo(
    () =>
      detail.messages.filter((m) => m.requestId && findingIds.has(m.requestId)),
    [detail.messages, findingIds]
  );
  // Errors tab — identical shape to Findings only, filtered to errored steps
  // (status === 'danger') instead of findings. Passing/non-error runs collapse
  // into the same muted separators.
  const errorIds = useMemo(
    () =>
      new Set(
        detail.trace
          .filter((e) => e.status === "danger")
          .map((e) => e.requestId)
      ),
    [detail.trace]
  );
  const errorTraceItems = useMemo<TraceRenderItem[]>(() => {
    const out: TraceRenderItem[] = [];
    let passing = 0;
    let sepSeq = 0;
    const flush = () => {
      if (passing > 0) {
        out.push({
          kind: "separator",
          id: `err-sep-${sepSeq++}`,
          count: passing,
        });
        passing = 0;
      }
    };
    for (const e of detail.trace) {
      if (e.status === "danger") {
        flush();
        out.push({ kind: "event", event: e });
      } else {
        passing += 1;
      }
    }
    flush();
    return out;
  }, [detail.trace]);
  const errorMessages = useMemo(
    () =>
      detail.messages.filter((m) => m.requestId && errorIds.has(m.requestId)),
    [detail.messages, errorIds]
  );

  return (
    <>
      {/* Top section — header + identity row + prompt quote. Fixed (does
          not scroll); the body grid below carries the scrollable panels.
          `pr-12` lives on the title block only so it clears the absolute
          DialogClose X; the identity row + quote run flush to the modal's
          right padding so action buttons align with the KPI rail edge. */}
      <DialogScrollHeader className={variant === "page" ? "pt-0" : undefined}>
        <DialogTitleBlock
          mode={variant === "page" ? "static" : "dialog"}
          titleAriaLabel={`Conversation ${row.title}`}
        >
          Messages + request trace
        </DialogTitleBlock>

        {/* Identity row — cnv_id + initiator. Copy ID lives in the
            footer-right; the header carries identity only. */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium font-mono text-neutral-900 text-sm">
            {row.conversationId}
          </span>
          <span className="font-mono text-neutral-500 text-xs">
            {row.initiator}
          </span>
        </div>
      </DialogScrollHeader>

      {/* Persistent KPI rail — 5 tiles at the conversation scope. Same
          pattern as CMP-013's request rail but with one extra tile
          (Duration) and a `grid-cols-5` track. */}
      <DialogScrollSummary>
        <ConversationKpiRail row={row} />
      </DialogScrollSummary>

      {/* Body — two-panel grid where each panel scrolls independently.
          Override the body's default `overflow-y-auto` to `overflow-hidden`
          and add `flex flex-col` so the inner grid manages overflow per
          panel rather than scrolling the whole body. */}
      <DialogScrollBody
        className={
          variant === "page"
            ? "flex min-h-fit flex-initial flex-col gap-4 overflow-y-visible overscroll-auto pt-4"
            : "flex flex-col gap-4 overflow-hidden pt-4"
        }
      >
        {/* Finding banner — same pattern as the Requests modal. Hidden
              when the conversation surfaced no findings or errors. */}
        {findingCount + errorCount > 0 && (
          <div
            className={[
              "flex items-center gap-4 rounded-md border p-4",
              bannerTone === "destructive"
                ? "border-destructive/50 bg-danger-50"
                : "border-warning-500/50 bg-warning-50",
            ].join(" ")}
            role="status"
          >
            <TriangleAlert
              aria-hidden
              className={[
                "size-6 shrink-0",
                bannerTone === "destructive"
                  ? "text-destructive"
                  : "text-warning-600",
              ].join(" ")}
              strokeWidth={1.75}
            />
            <p className="type-label-14 min-w-0 text-pretty text-neutral-900">
              {findingCount} finding{findingCount === 1 ? "" : "s"} across this
              conversation · Highest action:{" "}
              <span className="capitalize">{highestAction}</span>
            </p>
          </div>
        )}

        {/* Step tabs — filter the trace by outcome. "All steps" (default)
              renders the existing two-panel layout unchanged; the "Findings
              only" / "Errors" subsections are built in a follow-up pass. */}
        <Tabs
          className={
            variant === "page"
              ? "flex flex-col"
              : "flex min-h-0 flex-1 flex-col"
          }
          defaultValue="all"
        >
          <TabsList className="px-0" variant="line">
            <TabsTrigger value="all">
              All steps
              <Badge className="ml-1" variant="neutral">
                {detail.trace.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="findings">
              Findings only
              {findingCount > 0 && (
                <Badge className="ml-1" variant="neutral">
                  {findingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="errors">
              Errors
              <Badge className="ml-1" variant="neutral">
                {errorCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            className={
              variant === "page"
                ? "mt-4"
                : "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
            }
            value="all"
          >
            <div
              className={
                variant === "page"
                  ? "grid h-[600px] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                  : "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
              }
            >
              <ConversationMessagesPanel
                activeRequestId={activeRequestId}
                messages={detail.messages}
                onSelect={selectFromMessages}
                selectionSource={selectionSource}
                trace={detail.trace}
              />
              <RequestTracePanel
                activeRequestId={activeRequestId}
                footer={
                  <div className="flex flex-none items-center justify-between gap-4 border-border border-t bg-card px-4 py-3">
                    <span className="font-mono text-neutral-500 text-xs">
                      Key{" "}
                      <span className="text-neutral-800">{row.initiator}</span>{" "}
                      · started{" "}
                      <Timestamp
                        className="text-neutral-800"
                        date={row.updated}
                      />
                    </span>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        label="conversation ID"
                        mode="label"
                        size="sm"
                        text="Copy ID"
                        value={row.conversationId}
                      />
                      <Button
                        disabled={!activeRequestId}
                        onClick={() => {
                          if (activeRequestId) {
                            navigate(`/requests-findings/${activeRequestId}`);
                          }
                        }}
                        size="sm"
                        type="button"
                      >
                        View Request
                        <ExternalLink aria-hidden data-icon="inline-end" />
                      </Button>
                    </div>
                  </div>
                }
                onSelect={selectFromTrace}
                selectionSource={selectionSource}
                trace={detail.trace}
              />
            </div>
          </TabsContent>

          {/* Findings-only — same two-panel layout as "All steps", filtered
                to finding requests. Trace collapses passing runs into muted
                separators; messages are filtered to finding requests' turns.
                Cross-highlight + auto-scroll wiring is identical to the All
                tab (shared activeRequestId / selectionSource / onSelect). */}
          <TabsContent
            className={
              variant === "page"
                ? "mt-4"
                : "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
            }
            value="findings"
          >
            <div
              className={
                variant === "page"
                  ? "grid h-[600px] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                  : "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
              }
            >
              <ConversationMessagesPanel
                activeRequestId={activeRequestId}
                messages={findingMessages}
                onSelect={selectFromMessages}
                selectionSource={selectionSource}
                trace={detail.trace}
              />
              <RequestTracePanel
                activeRequestId={activeRequestId}
                countLabel={`${findingCount} findings`}
                footer={
                  <div className="flex flex-none items-center justify-between gap-4 border-border border-t bg-card px-4 py-3">
                    <span className="font-mono text-neutral-500 text-xs">
                      Key{" "}
                      <span className="text-neutral-800">{row.initiator}</span>{" "}
                      · started{" "}
                      <Timestamp
                        className="text-neutral-800"
                        date={row.updated}
                      />
                    </span>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        label="conversation ID"
                        mode="label"
                        size="sm"
                        text="Copy ID"
                        value={row.conversationId}
                      />
                      <Button
                        disabled={!activeRequestId}
                        onClick={() => {
                          if (activeRequestId) {
                            navigate(`/requests-findings/${activeRequestId}`);
                          }
                        }}
                        size="sm"
                        type="button"
                      >
                        View Request
                        <ExternalLink aria-hidden data-icon="inline-end" />
                      </Button>
                    </div>
                  </div>
                }
                items={findingTraceItems}
                onSelect={selectFromTrace}
                selectionSource={selectionSource}
              />
            </div>
          </TabsContent>
          {/* Errors — same two-panel layout as Findings only, filtered to
                errored steps (status danger). Passing runs collapse into muted
                separators; messages are filtered to errored requests' turns. */}
          <TabsContent
            className={
              variant === "page"
                ? "mt-4"
                : "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
            }
            value="errors"
          >
            {errorCount === 0 ? (
              <p className="type-copy-14 text-neutral-500">
                No errors in this conversation.
              </p>
            ) : (
              <div
                className={
                  variant === "page"
                    ? "grid h-[600px] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                    : "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                }
              >
                <ConversationMessagesPanel
                  activeRequestId={activeRequestId}
                  messages={errorMessages}
                  onSelect={selectFromMessages}
                  selectionSource={selectionSource}
                  trace={detail.trace}
                />
                <RequestTracePanel
                  activeRequestId={activeRequestId}
                  countLabel={`${errorCount} error${errorCount === 1 ? "" : "s"}`}
                  footer={
                    <div className="flex flex-none items-center justify-between gap-4 border-border border-t bg-card px-4 py-3">
                      <span className="font-mono text-neutral-500 text-xs">
                        Key{" "}
                        <span className="text-neutral-800">
                          {row.initiator}
                        </span>{" "}
                        · started{" "}
                        <Timestamp
                          className="text-neutral-800"
                          date={row.updated}
                        />
                      </span>
                      <div className="flex items-center gap-2">
                        <CopyButton
                          label="conversation ID"
                          mode="label"
                          size="sm"
                          text="Copy ID"
                          value={row.conversationId}
                        />
                        <Button
                          disabled={!activeRequestId}
                          onClick={() => {
                            if (activeRequestId) {
                              navigate(`/requests-findings/${activeRequestId}`);
                            }
                          }}
                          size="sm"
                          type="button"
                        >
                          View Request
                          <ExternalLink aria-hidden data-icon="inline-end" />
                        </Button>
                      </div>
                    </div>
                  }
                  items={errorTraceItems}
                  onSelect={selectFromTrace}
                  selectionSource={selectionSource}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogScrollBody>

      {/* Footer — conversation provenance LEFT, Copy ID action RIGHT.
          Override the footer's default `justify-end` since this footer
          carries informational copy on the leading edge as well. */}
    </>
  );
}

function ConversationKpiRail({ row }: { row: ConversationRow }) {
  const view = getConversationView(row, REQUEST_ROWS_ALL);
  return (
    <KpiRailShell columns={6}>
      <ConversationKpiTile label="Requests" value={String(view.reqs)} />
      <ConversationKpiTile label="Turns" value={String(view.turns)} />
      <ConversationKpiTile label="Tokens In" value={view.inTokens} />
      <ConversationKpiTile label="Tokens Out" value={view.outTokens} />
      <ConversationKpiTile label="Cost" value={view.cost} />
      <ConversationKpiTile label="Duration" value={view.duration} />
    </KpiRailShell>
  );
}

function ConversationKpiTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  // Mono at text-lg (18px) — below the sans-hero threshold (≥24px), so
  // these stay in the data-tier mono register per the five-voice taxonomy.
  // Label uses plain sans (Title Case, not Eyebrow caps): KPI tiles inside
  // a modal sit closer to body metadata than to page eyebrows, so the
  // uppercase-tracked register from <Eyebrow> overweighted the label.
  // Padding `p-4` matches the 16px card-padding rule (CompactKpi / ModelKpiTile).
  return (
    <div className="flex flex-col gap-1 p-4">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-medium font-mono text-lg text-neutral-900 tabular-nums tracking-snug">
        {value}
      </span>
    </div>
  );
}

/* ─── Messages tab ───────────────────────────────────────────────────────
 * Conversation-scope dialogue (richer than CMP-013's per-request thread
 * since a conversation spans multiple turns + tool calls). Renders via the
 * shared <MessageBlock> primitive so the bubble treatment stays one source
 * of truth across the request and conversation sheets. */

/**
 * Conversation thread — eight turns mirroring the agent flow. RequestIds
 * on assistant + tool messages match SAMPLE_TRACE entries, enabling the
 * cross-link selection (click message → highlights paired trace event).
 * USER turn is human input — no gateway request, no requestId.
 */
export type ConversationMessage = {
  role: MessageRole;
  tool?: string;
  body: React.ReactNode;
  time: string;
  requestId?: string;
};

// Static derivation — computed once at module load from the fixed message list.

function ConversationMessagesPanel({
  messages,
  trace,
  activeRequestId,
  selectionSource,
  onSelect,
}: {
  activeRequestId: string | null;
  selectionSource: "messages" | "trace" | null;
  onSelect: (requestId: string | null) => void;
  messages?: ConversationMessage[];
  trace?: TraceEvent[];
}) {
  // Count = assistant turns. Tool/user/system don't count as "turns" — a
  // turn is a model response. Mirrors the convention used in the table
  // (row.turns is assistant-only). Computed at module level (static data).

  // Auto-scroll the matching message into view ONLY when the selection
  // came from the counterpart (trace) panel. Selections that originated
  // here are already in view — scrolling would jump away from where the
  // user just clicked. `block: 'nearest'` is a no-op if the message is
  // already visible, so this is safe to fire on every cross-panel change.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!(activeRequestId && scrollRef.current)) {
      return;
    }
    if (selectionSource === "messages") {
      return;
    }
    const el = scrollRef.current.querySelector(
      `[data-request-id="${activeRequestId}"]`
    );
    el?.scrollIntoView({
      block: "nearest",
      behavior: REDUCE_MOTION ? "auto" : "smooth",
    });
  }, [activeRequestId, selectionSource]);

  // requestId → status, so each message bubble can adopt its trace step's tone.
  const statusByRequestId = useMemo(
    () => new Map((trace ?? []).map((e) => [e.requestId, e.status])),
    [trace]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the trace panel. `flex-none` so
          it doesn't shrink when the body scrolls. */}
      <div className="flex flex-none items-center justify-between border-border border-b bg-card px-4 py-3">
        <span
          className="type-label-14 text-neutral-900"
          id="conv-messages-eyebrow"
        >
          Messages
        </span>
        <span className="font-mono text-neutral-500 text-xs tabular-nums">
          {(messages ?? []).filter((m) => m.role === "assistant").length}{" "}
          {(messages ?? []).filter((m) => m.role === "assistant").length === 1
            ? "turn"
            : "turns"}
        </span>
      </div>
      <div
        aria-labelledby="conv-messages-eyebrow"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4"
        ref={scrollRef}
        role="region"
      >
        {(messages ?? []).map((m, i) => {
          const selected = !!m.requestId && m.requestId === activeRequestId;
          // Bubble tone tracks the matching trace step's status so the message
          // and its trace row carry the same color: blue = normal, amber =
          // flag/redact, red = block/error.
          const status = m.requestId
            ? statusByRequestId.get(m.requestId)
            : undefined;
          const tone =
            status === "danger"
              ? "danger"
              : status === "warn"
                ? "warn"
                : "default";
          return (
            <MessageBlock
              body={
                m.role === "tool" && typeof m.body === "string" ? (
                  <ToolResultCode>{m.body}</ToolResultCode>
                ) : (
                  m.body
                )
              }
              key={i}
              // Only assistant + tool turns participate in cross-link
              // selection — user input has no gateway request to pair with.
              onClick={
                m.requestId
                  ? () => onSelect(selected ? null : (m.requestId ?? null))
                  : undefined
              }
              requestId={m.requestId}
              role={m.role}
              selected={selected}
              time={m.time}
              tone={tone}
              tool={m.tool}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Request Trace tab ──────────────────────────────────────────────────
 * Vertical timeline of model calls for the conversation. Each event = one
 * row in the gateway log (one call to /v1/messages). Status dot signals
 * pass/warn/fail; vendor avatar + model name identify the route; the
 * label below describes the agent step ("plan", "tool: lookup_transfer",
 * "reason"). Click a step (eventually) to drill into CMP-013's request
 * sheet for that specific call. */

export type TraceStatus = "success" | "warn" | "danger";

export type TraceEvent = {
  id: string;
  vendor: Vendor;
  model: string;
  label: string;
  /** "tool" = wrench glyph in the timeline node; everything else gets the
   *  reasoning glyph (Activity wave). Drives icon choice only — status is
   *  separate. */
  kind: "tool" | "reason";
  status: TraceStatus;
  warnNote?: string;
  /** Finding chip: category label (e.g. "PII") plus the action verb. Set when
   * a detector fired on this request, regardless of HTTP status. */
  finding?: string;
  findingAction?: "Flag" | "Redact" | "Block";
  /** Tokens in (e.g. "1.2k"). Mono tabular when rendered. */
  inTokens: string;
  /** Tokens out (e.g. "184"). */
  outTokens: string;
  /** Wall-clock latency for this single request (e.g. "1240ms"). Slow rows
   *  (>1000ms) paint warning-tinted in the data line per the codified
   *  slow-row indicator policy. */
  latency: string;
  /** Per-request cost (e.g. "$0.0012"). Sums across the trace ≈ row.cost. */
  cost: string;
  time: string;
  requestId: string;
};

// Status → border color for the timeline node ring. Mirrors StatusDot's
// fill convention (-600 saturated mid).
const TRACE_NODE_BORDER: Record<TraceStatus, string> = {
  success: "border-success-600",
  warn: "border-warning-600",
  danger: "border-destructive",
};
const TRACE_NODE_ICON_TONE: Record<TraceStatus, string> = {
  success: "text-success-700",
  warn: "text-warning-700",
  danger: "text-destructive",
};
// Selected-row OUTLINE color, keyed off status (mirrors the messages panel's
// tone-aware selection ring): blue = no issues, amber = flag/redact, red =
// block/error. Selection is an outline, never a fill, so the row tint never
// competes with the status signal.
// Drawn as an ::after overlay (not a box-shadow ring) so the selection
// outline paints ABOVE the timeline track — an inset box-shadow would sit
// under the positioned track span and the gray line would cross it.
const TRACE_SELECT_RING: Record<TraceStatus, string> = {
  success: "after:ring-success-600",
  warn: "after:ring-warning-500",
  danger: "after:ring-destructive",
};
// Hover preview of the selection outline — a light SOLID tint of the same
// status color (the -200 step, not an alpha of the bold ring) so it composites
// cleanly over the timeline track. -50 is near-white and reads as no color, so
// -200 is the lightest step that still registers as the status hue.
const TRACE_HOVER_RING: Record<TraceStatus, string> = {
  success: "hover:after:ring-success-200",
  warn: "hover:after:ring-warning-200",
  danger: "hover:after:ring-danger-200",
};

/** Interleaved timeline entry for the Findings-only view: either a finding
 *  TraceEvent or a collapsed run of consecutive passing (non-finding) steps
 *  rendered as a single muted separator row. Order is preserved from the
 *  original trace. */
export type TraceRenderItem =
  | { kind: "event"; event: TraceEvent }
  | { kind: "separator"; id: string; count: number };

function RequestTracePanel({
  trace,
  items,
  countLabel,
  activeRequestId,
  selectionSource,
  onSelect,
  footer,
}: {
  activeRequestId: string | null;
  selectionSource: "messages" | "trace" | null;
  onSelect: (requestId: string | null) => void;
  messages?: ConversationMessage[];
  trace?: TraceEvent[];
  /** When provided, the panel renders this interleaved list (finding events +
   *  passing-run separators) instead of the flat `trace`. Used by the
   *  Findings-only tab. */
  items?: TraceRenderItem[];
  /** Right-aligned header count copy. Defaults to "N requests" from `trace`. */
  countLabel?: ReactNode;
  footer?: ReactNode;
}) {
  // Auto-scroll the matching trace event into view ONLY when the selection
  // came from the counterpart (messages) panel. Selections that originated
  // here are already in view. Pairing the two effects gives one-way
  // counterpart scrolling: clicking a message reveals its trace event;
  // clicking a trace event reveals its message bubble — but neither
  // scrolls its own panel.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!(activeRequestId && scrollRef.current)) {
      return;
    }
    if (selectionSource === "trace") {
      return;
    }
    const el = scrollRef.current.querySelector(
      `[data-request-id="${activeRequestId}"]`
    );
    el?.scrollIntoView({
      block: "nearest",
      behavior: REDUCE_MOTION ? "auto" : "smooth",
    });
  }, [activeRequestId, selectionSource]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the messages panel. `flex-none`
          so it doesn't shrink when the body scrolls. */}
      <div className="flex flex-none items-center justify-between border-border border-b bg-card px-4 py-3">
        <span
          className="type-label-14 text-neutral-900"
          id="conv-trace-eyebrow"
        >
          Request Trace
        </span>
        <span className="font-mono text-neutral-500 text-xs tabular-nums">
          {countLabel ?? `${(trace ?? []).length} requests`}
        </span>
      </div>

      {/* Timeline track — vertical hairline running down the column at
          x=28px (16px panel padding + 12px = node centerline). The track
          sits BEHIND the nodes; each node's white interior visually masks
          the line where it crosses, giving the "beads on a string" effect.
          `inset-y-6` shortens the line so it terminates inside the first
          and last node centers, accounting for the row's vertical padding.
          The wrapper carries the scroll so long traces flow without
          forcing the modal itself to scroll. */}
      <div
        aria-labelledby="conv-trace-eyebrow"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2"
        ref={scrollRef}
        role="region"
      >
        {/* Per-row track segments are rendered inside TraceItem (see
            below) so geometry stays correct regardless of row content
            height. First/last items truncate the segment at the node
            center; the node's bg-white masks the line where it crosses. */}
        <div className="flex flex-col">
          {items
            ? items.map((item, i) =>
                item.kind === "separator" ? (
                  <TracePassingSeparator
                    count={item.count}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                    key={item.id}
                  />
                ) : (
                  <TraceItem
                    event={item.event}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                    key={item.event.id}
                    onSelect={() =>
                      onSelect(
                        item.event.requestId === activeRequestId
                          ? null
                          : item.event.requestId
                      )
                    }
                    selected={item.event.requestId === activeRequestId}
                  />
                )
              )
            : (trace ?? []).map((event, i) => (
                <TraceItem
                  event={event}
                  isFirst={i === 0}
                  isLast={i === (trace ?? []).length - 1}
                  key={event.id}
                  onSelect={() =>
                    onSelect(
                      event.requestId === activeRequestId
                        ? null
                        : event.requestId
                    )
                  }
                  selected={event.requestId === activeRequestId}
                />
              ))}
        </div>
      </div>
      {footer}
    </div>
  );
}

function TraceItem({
  event,
  selected,
  isFirst,
  isLast,
  onSelect,
}: {
  event: TraceEvent;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
}) {
  // Selection is shown as a status-colored OUTLINE (ring), not a fill —
  // green/amber/red track the row's status. Hover previews the same outline in
  // a faint -50 tint. See TRACE_SELECT_RING / TRACE_HOVER_RING.
  const selectRing = TRACE_SELECT_RING[event.status];
  const hoverRing = TRACE_HOVER_RING[event.status];

  // Slow-latency tint: >1000ms paints the latency text warning-700 in the
  // data line only. Latency is not a security signal, so it never colors the
  // timeline node.
  const latencyMs = Number.parseInt(event.latency, 10);
  const isSlowLatency = latencyMs > 1000;
  const latencyTone = isSlowLatency ? "text-warning-700" : "text-neutral-500";

  // Node ring + icon tone key off guardrail status ONLY: green = clean (no
  // detector fired), amber = flag/redact, red = block/error. A slow-but-clean
  // step stays green; only a fired guardrail colors the node.
  const nodeBorder = TRACE_NODE_BORDER[event.status];
  const nodeIconTone = TRACE_NODE_ICON_TONE[event.status];

  // Step-type icon inside the node. Tool calls get Wrench (literal); every
  // other step gets Activity (the EKG wave — implies reasoning/processing).
  // Wrench's mass sits low; nudge -0.5px to optically center it inside
  // the node circle. Activity is balanced and stays at 0.
  const StepIcon = event.kind === "tool" ? Wrench : Activity;
  const stepIconTransform = event.kind === "tool" ? "-translate-y-[0.5px]" : "";

  // Per-row track segment — rendered behind the node circle (DOM order
  // puts node after, so its bg-white masks the line where it crosses).
  // Node center sits at y = py-3 (12px) + node-half (12px) = 24px = top-6.
  // First row: line starts at node center (top-6) and runs to row
  // bottom. Last row: line starts at row top and runs h-6 (24px) to
  // node center. Middle rows: line spans the full row height. Within
  // TraceItem padding box, node center is at x=24 (pl-3 + node-half);
  // for a 2px line to center on x=24, left = 23px.
  const trackSegment = isFirst
    ? "top-6 bottom-0"
    : isLast
      ? "top-0 h-6"
      : "inset-y-0";

  return (
    <button
      aria-pressed={selected}
      className={`relative -mx-2 flex cursor-pointer gap-3 rounded-md px-3 py-3 text-left outline-none transition-[box-shadow,background-color] duration-150 ease-out after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:ring-1 after:ring-inset after:transition-colors after:duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 motion-reduce:transition-none ${
        selected ? selectRing : `after:ring-transparent ${hoverRing}`
      }`}
      data-request-id={event.requestId}
      onClick={onSelect}
      type="button"
    >
      {/* Per-row track segment — sits at x=23 inside TraceItem coords so
          the 2px line centers on the node centerline at x=24. Comes
          first in DOM so the node renders above and its bg-white masks
          the line where it crosses. */}
      <span
        aria-hidden
        className={`absolute left-[23px] w-[2px] bg-neutral-200 ${trackSegment}`}
      />
      {/* Selected fill — an opaque card overlay that paints ABOVE the track
          (so the gray line doesn't show through the selected row) but below
          the node + content. Rendered as an overlay rather than the button's
          background because the background paints under the positioned track. */}
      {selected ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md bg-card"
        />
      ) : null}
      {/* Timeline node — circular, status-bordered, white-filled so the
          track behind it reads as broken at the bead. Icon inside marks
          the step type. */}
      <div
        className={`relative flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-card ${nodeBorder}`}
      >
        <StepIcon
          aria-hidden
          className={`size-3 ${nodeIconTone} ${stepIconTransform}`}
          strokeWidth={2}
        />
      </div>

      {/* Content column — two stacked rows by default; warn events get a
          third row below for the warn badge (left-aligned). Model
          deprioritized — repeated across every step's row added scan
          noise without information.
          (1) step label + time as the primary identifier,
          (2) tokens · latency · cost + requestId on the right,
          (3) warn badge (only when status === 'warn'). */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        {/* Row 1 — primary. Agent step label takes the slot the model
            previously occupied; timestamp right-aligned. */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex-1 truncate font-mono text-neutral-900 text-sm">
            {event.label}
          </span>
          <span className="shrink-0 font-mono text-neutral-500 text-xs tabular-nums">
            {event.time}
          </span>
        </div>

        {/* Row 2 — per-step economics + requestId. `tokens-in → tokens-out ·
            latency · cost` on the left; requestId right-aligned. Latency
            turns warning-700 on slow rows. Cost renders at neutral-800 per the
            three-tier table ink policy. Separators drop to neutral-300 so they
            read as hairline scaffolding, not data. */}
        <div className="flex min-w-0 items-center gap-2 text-neutral-500">
          <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums">
            {event.inTokens}
            <ArrowRight aria-hidden className="size-3" strokeWidth={1.75} />
            {event.outTokens}
          </span>
          <span aria-hidden className="text-neutral-300">
            ·
          </span>
          <span className={`font-mono text-xs tabular-nums ${latencyTone}`}>
            {event.latency}
          </span>
          <span aria-hidden className="text-neutral-300">
            ·
          </span>
          <span className="flex-1 font-mono text-neutral-800 text-xs tabular-nums">
            {event.cost}
          </span>
          <span className="shrink-0 font-mono text-neutral-500 text-xs">
            {event.requestId}
          </span>
        </div>

        {/* Row 3 — warn badge, only when this step carries a policy warn.
            Left-aligned on its own row so the signal is unmissable without
            crowding the primary identifier line. */}
        {event.finding ? (
          <div className="flex items-center">
            <Badge
              aria-label={`${event.finding} ${event.findingAction}`}
              variant={
                event.findingAction === "Block" ? "destructive" : "warning"
              }
            >
              <TriangleAlert
                aria-hidden
                className="size-3"
                strokeWidth={1.75}
              />
              {event.finding} · {event.findingAction}
            </Badge>
          </div>
        ) : null}
      </div>
    </button>
  );
}

/* Passing-run separator — quiet, non-interactive timeline row used in the
 * Findings-only view to collapse a run of consecutive passing (non-finding)
 * steps. Reads as muted scaffolding: no status node ring, no clickable
 * button, no finding color. It stays aligned to the same left rail as a
 * TraceItem (node centerline x=24) so the timeline track runs continuously
 * through it. The track segment is full-height for middle/edge rows so the
 * line is unbroken between the finding events on either side. */
function TracePassingSeparator({
  count,
  isFirst,
  isLast,
}: {
  count: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  // Mirror TraceItem's per-row track geometry. A separator almost always
  // sits between two finding events, so the line should run the full row
  // height; only truncate when it is the very first/last item in the list.
  const trackSegment = isFirst
    ? "top-6 bottom-0"
    : isLast
      ? "top-0 h-6"
      : "inset-y-0";
  return (
    <div aria-hidden className="relative -mx-2 flex gap-3 px-3 py-3">
      {/* Continuous track segment at x=23 — same centerline as TraceItem. */}
      <span
        className={`absolute left-[23px] w-[2px] bg-neutral-200 ${trackSegment}`}
      />
      {/* Node column placeholder — a small hollow dot centered on the rail
          (x=24) so the eye still tracks the timeline, but visibly lighter
          than a status node (no 2px ring, no icon). */}
      <div className="relative flex size-6 shrink-0 items-center justify-center">
        <span className="size-1.5 rounded-full bg-neutral-300" />
      </div>
      {/* Muted count copy. Mono so it sits in the data voice but quiet. */}
      <div className="flex min-w-0 flex-1 items-center">
        <span className="font-mono text-neutral-500 text-xs tabular-nums">
          {count} passing request{count === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
