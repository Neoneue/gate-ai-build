import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { vendorLabel } from "@/components/icons/vendor-meta";
import { Card } from "@/components/ui/card";
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
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
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatChartTooltipDate,
  formatCompactCount,
  formatNumber,
} from "@/lib/formatters";
import {
  type CustomRange,
  inRangeWindow,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
} from "@/lib/range";
import { ConversationsDefault } from "@/pages/ConversationsDefault";
import type { ImprovedModel } from "@/pages/onboarding/improved-data";
import {
  NO_KEY,
  type WorkspaceConversation,
  type WorkspaceTraffic,
} from "@/pages/onboarding/onboarding-workspace-traffic";
import { useWorkspaceTraffic } from "@/pages/onboarding/use-workspace-traffic";

/* ─── OnboardingConversations ───────────────────────────────────────────────
 * `/conversations-onboarding`: the desktop onboarding workspace's
 * Conversations (owner 2026-10-13). The workspace is Free, so the data
 * state is a copy of the Free page (`ConversationsFree` renders
 * `Conversations.tsx`: PageHeader, Overview bar, KpiRail,
 * ConversationsTableSection), every section and control kept.
 *
 * Before the first message (`useWorkspaceTraffic()` null):
 * `ConversationsDefault`, unchanged. After it: a row per conversation,
 * `traffic.conversations` (owner 2026-10-14): the step 3 messages came from
 * one app session, so setup is ONE row (one turn and one request per
 * message: 1, then 2 once the demo lands), and each Gate Chat chat of the
 * run, from any tab, is a row of its own (Reqs counts its replies: a
 * compare turn sends two). The rail reads the same ranged array, so its
 * count, mean turns and mean cost reconcile with the rows.
 *
 * Left out of the Pro copy, each because no Gate record exists for a mock
 * conversation: the conversation id line under the title, the row click
 * with its trace page, and the `?open=` detail dialog. The Key and Model
 * selects list only the keys and models the rows used.
 *
 * Conversations scales nothing: the range pills FILTER rows by their
 * `updated` time (Pro's `rangedSeeds`). Pro anchors its windows on the demo
 * clock (`DEMO_NOW`); this page anchors on the newest message's real time,
 * the same anchor as the setup Overview's week (`setupWeek`). Range state is
 * local, never the shared range store. `Conversations` and
 * `ConversationsDefault` never change (no-thrash.md).
 * ───────────────────────────────────────────────────────────────────────── */

const PAGE_DESCRIPTION =
  "A conversation is a chain of messages that share session context: agent runs, multi-turn chats, tool-calling loops. Click any row to see its message thread.";
const EMPTY_BODY =
  "Multi-turn conversations grouped by key and model will appear here as your workspace routes traffic.";

/** Pro's no-value mark (`Conversations.tsx` NO_VALUE): a mean with no rows
 *  behind it is unknown, not 0. */
const NO_VALUE = String.fromCodePoint(0x20_14);

/** A conversation as the table and rail read it. */
type SetupConversationRow = WorkspaceConversation;

export function OnboardingConversations() {
  const traffic = useWorkspaceTraffic();
  return traffic ? (
    <SetupConversations traffic={traffic} />
  ) : (
    <ConversationsDefault />
  );
}

/** `rangeWindow` (lib/range) anchored on `anchor` instead of `DEMO_NOW`. */
function rangeWindowAt(
  range: Range,
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

function SetupConversations({ traffic }: { traffic: WorkspaceTraffic }) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [range, setRange] = useState<Range>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const anchorTime = (traffic.messages[0]?.sentAt ?? new Date()).getTime();
  const anchor = useMemo(() => new Date(anchorTime), [anchorTime]);
  const allRows = traffic.conversations;
  // ONE ranged array, shared by the rail and the table (Pro's `rangedSeeds`),
  // so the headline cannot advertise a row the table does not own.
  const rows = useMemo(() => {
    const window = rangeWindowAt(range, customRange, anchor);
    return allRows.filter((r) => inRangeWindow(r.updated, window));
  }, [allRows, range, customRange, anchor]);

  return (
    <DashboardChrome
      activeNavId="conversations"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
          <PageTitle>Conversations</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            {PAGE_DESCRIPTION}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {/* Conversations.tsx OverviewBar. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedPill
              aria-label="Time range"
              onValueChange={(v) => {
                setRange(v as PresetRange);
                setCustomRange(null);
              }}
              options={RANGE_OPTIONS}
              size="sm"
              value={range === "custom" ? "" : range}
            />
            <DateRangePicker
              onChange={(r) => {
                if (r) {
                  setCustomRange(r);
                  setRange("custom");
                } else {
                  setCustomRange(null);
                  setRange("all");
                }
              }}
              size="sm"
              value={customRange}
            />
          </div>
        </div>
        <KpiRail
          anchor={anchor}
          customRange={customRange}
          range={range}
          rows={rows}
        />
      </div>
      <ConversationsTableSection
        models={[
          ...new Map(
            allRows.flatMap((r) => r.models).map((m) => [m.id, m])
          ).values(),
        ]}
        rangeKey={`${range}|${customRange?.from.getTime() ?? ""}|${customRange?.to.getTime() ?? ""}`}
        rows={rows}
        traffic={traffic}
      />
    </DashboardChrome>
  );
}

/* ─── KPI rail (Conversations.tsx KpiRail) ──────────────────────────────── */

const SPARK_POINTS = 9;

/** Conversations.tsx `sparkBucketDates`, anchored on `anchor`. */
function sparkBucketDates(
  range: Range,
  customRange: CustomRange | null,
  anchor: Date
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
    const d = new Date(anchor);
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

/** Conversations.tsx `bucketOf`: `boundaries[i]` is the END of bucket i;
 *  older rows clamp into bucket 0, newer into the last, so the buckets sum
 *  to the count. */
function bucketOf(d: Date, boundaries: Date[]): number {
  const t = d.getTime();
  for (let i = 0; i < boundaries.length; i += 1) {
    if (t <= (boundaries[i]?.getTime() ?? 0)) {
      return i;
    }
  }
  return boundaries.length - 1;
}

/** Conversations.tsx `runningSeries`: point i is `stat` over every row up to
 *  bucket i, so the last point is the tile's value. */
function runningSeries(
  buckets: SetupConversationRow[][],
  stat: (rows: SetupConversationRow[]) => number | null
): number[] {
  const seen: SetupConversationRow[] = [];
  const points = buckets.map((bucket) => {
    seen.push(...bucket);
    return stat(seen);
  });
  const first = points.find((v) => v !== null) ?? 0;
  return points.map((v) => v ?? first);
}

const meanTurns = (of: SetupConversationRow[]) =>
  of.length === 0 ? null : of.reduce((a, r) => a + r.turns, 0) / of.length;

/** The setup messages carry a cost on every billing choice (the catalog list
 *  price on Gate credits, $0.00 on provider billing: onboarding-setup-traffic),
 *  so the mean is the plain mean of the rows' costs. */
const meanCost = (of: SetupConversationRow[]) =>
  of.length === 0 ? null : of.reduce((a, r) => a + r.costUsd, 0) / of.length;

function KpiRail({
  rows,
  range,
  customRange,
  anchor,
}: {
  rows: SetupConversationRow[];
  range: Range;
  customRange: CustomRange | null;
  anchor: Date;
}) {
  const rail = useMemo(() => {
    const boundaries = sparkBucketDates(range, customRange, anchor);
    const buckets: SetupConversationRow[][] = boundaries.map(() => []);
    for (const row of rows) {
      buckets[bucketOf(row.updated, boundaries)]?.push(row);
    }
    const span = {
      start: boundaries[0] ?? anchor,
      end: boundaries.at(-1) ?? anchor,
    };
    const granularity = range === "24h" ? "hour" : "day";
    return {
      count: rows.length,
      avgTurns: meanTurns(rows),
      avgCost: meanCost(rows),
      labels: boundaries.map((d) =>
        formatChartTooltipDate(d, granularity, span)
      ),
      countSpark: buckets.map((b) => b.length),
      turnsSpark: runningSeries(buckets, meanTurns),
      costSpark: runningSeries(buckets, meanCost),
    };
  }, [rows, range, customRange, anchor]);

  return (
    <KpiRailShell columns={3}>
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
            valueFormatter={(v) => `$${v.toFixed(3)}`}
          />
        }
        title="Avg cost / conv"
        value={rail.avgCost === null ? NO_VALUE : `$${rail.avgCost.toFixed(3)}`}
      />
    </KpiRailShell>
  );
}

/* ─── Table section (Conversations.tsx ConversationsTableSection) ──────── */

function conversationSortValue(
  row: SetupConversationRow,
  key: string
): string | number | null {
  switch (key) {
    case "title":
      return row.title;
    case "initiator":
      return row.keyLabel;
    case "vendors":
      return row.models.map((m) => vendorLabel(m.vendor)).sort()[0] ?? null;
    case "turns":
      return row.turns;
    case "reqs":
      return row.reqs;
    case "inTokens":
      return row.inTokens;
    case "outTokens":
      return row.outTokens;
    case "cost":
      return row.costUsd;
    case "updated":
      return row.updated.getTime();
    default:
      return null;
  }
}

function ConversationsTableSection({
  rows,
  models,
  traffic,
  rangeKey,
}: {
  rows: SetupConversationRow[];
  models: ImprovedModel[];
  traffic: WorkspaceTraffic;
  rangeKey: string;
}) {
  const [query, setQuery] = useState("");
  const [keyId, setKeyId] = useState("all");
  const [model, setModel] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  // Pro's render-time reset: a narrowing filter or range starts on page 1.
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${rangeKey}|${query}|${keyId}|${model}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }
  const { sort, toggle: toggleSort } = useTableSort();
  // The range filter ran first (the rail reads the same array); then the
  // search over the prompt title and the key, the Key and Model selects, and
  // the sort.
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (keyId !== "all" && row.keyLabel !== keyId) {
        return false;
      }
      if (model !== "all" && !row.models.some((m) => m.id === model)) {
        return false;
      }
      return (
        !q ||
        row.title.toLowerCase().includes(q) ||
        (row.keyLabel ?? "").toLowerCase().includes(q)
      );
    });
    return sortRows(filtered, sort, conversationSortValue);
  }, [rows, keyId, model, query, sort]);
  const perPage = resolveRowsPerPage(rowsPerPage, visibleRows.length);
  const pagedRows = visibleRows.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <SectionTitle>Recent conversations</SectionTitle>
        {/* Conversations.tsx toolbar: below @2xl the search takes row 1 and
            the two Selects split row 2 (`min-w-0 flex-1`). */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            ariaLabel="Search conversations"
            className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
            onChange={setQuery}
            placeholder="Search by id, prompt, user, key…"
            surface="elevated"
            value={query}
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
              {[
                ...new Set(
                  traffic.conversations.flatMap((c) =>
                    c.keyLabel ? [c.keyLabel] : []
                  )
                ),
              ].map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
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
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <VendorAvatar decorative vendor={m.vendor} />
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card density="flush">
        {visibleRows.length === 0 ? (
          <TableEmptyState body={EMPTY_BODY} title="No conversations" />
        ) : (
          <>
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
                  <TableRow key={row.id}>
                    <TableCell className="max-w-0 whitespace-nowrap">
                      <span
                        className="type-label-14 block truncate text-foreground"
                        title={row.title}
                      >
                        {row.title}
                      </span>
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap">
                      <span className="text-foreground">
                        {row.keyLabel ?? NO_KEY}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div
                        aria-label={`Models: ${row.models.map((m) => vendorLabel(m.vendor)).join(", ")}`}
                        className="flex items-center gap-1"
                        role="img"
                      >
                        {row.models.map((m) => (
                          <VendorAvatar
                            decorative
                            key={m.id}
                            vendor={m.vendor}
                          />
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
                      {formatNumber(row.inTokens)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {formatNumber(row.outTokens)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {`$${row.costUsd.toFixed(4)}`}
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
              total={visibleRows.length}
            />
          </>
        )}
      </Card>
    </div>
  );
}
