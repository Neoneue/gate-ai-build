import { Activity, BarChart2, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Card } from "@/components/ui/card";
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { KpiRail } from "@/components/ui/kpi-rail";
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
import {
  type OnboardingDemoConversation,
  type OnboardingDemoModel,
  type OnboardingDemoTraffic,
  useOnboardingDemoTraffic,
} from "@/pages/onboarding/onboarding-demo-traffic";
import {
  IconChip,
  MobilePageHeader,
  MobilePageMain,
} from "@/pages/onboarding/onboarding-mobile-parts";

/* ─── OnboardingMobileConversations ─────────────────────────────────────────
 * `/conversations-mobile-onboarding`: the phone demo's Conversations (owner
 * 2026-10-12: "Conversations would just add to the existing one with +1 or
 * +2 new messages/turns").
 *
 * Before the first Gate Chat message: the `ConversationsDefault` copy,
 * unchanged. After it: a copy of the Pro page (`Conversations.tsx`: Overview
 * bar, KpiRail, ConversationsTableSection) fed by every demo conversation
 * (`useOnboardingDemoTraffic`, the source Overview's "Latest conversations"
 * reads, so the rows, turns and counts reconcile). The 2nd and 3rd chips in
 * one chat add turns to its row; a new chat adds a row.
 *
 * Left out of the Pro copy: the Key column (no API key carried a Gate Chat
 * message; the Key select keeps only "All keys"), the conversation id line
 * under the title (no Gate record exists for a mock conversation), and the
 * row click with its trace page and detail dialog (no Gate record to open).
 * The Model select lists only the models the demo used.
 *
 * Pro anchors its range on the demo clock (`rangeWindow`, `DEMO_NOW`); this
 * page anchors on real now, because the messages were sent now. Range state
 * is LOCAL, never the desktop page's. Mobile only (owner 2026-10-11,
 * no-thrash.md): `Conversations` and `ConversationsDefault` never change.
 * ───────────────────────────────────────────────────────────────────────── */

const PAGE_DESCRIPTION =
  "A conversation is a chain of messages that share session context: agent runs, multi-turn chats, tool-calling loops. Click any row to see its message thread.";
const EMPTY_BODY =
  "Multi-turn conversations grouped by key and model will appear here as your workspace routes traffic.";

/** Pro's no-value mark (`Conversations.tsx` NO_VALUE): a mean with no rows
 *  behind it is unknown, not 0. */
const NO_VALUE = String.fromCodePoint(0x20_14);

export function OnboardingMobileConversations() {
  const traffic = useOnboardingDemoTraffic();
  return traffic ? (
    <ProConversations traffic={traffic} />
  ) : (
    <DefaultConversations />
  );
}

/* ─── Before the first message: ConversationsDefault, verbatim ─────────── */

function DefaultKpiTile({
  icon,
  label,
}: {
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
      <IconChip icon={icon} />
      <span className="type-copy-14 text-muted-foreground">{label}</span>
    </div>
  );
}

function DefaultConversations() {
  return (
    <MobilePageMain>
      <MobilePageHeader description={PAGE_DESCRIPTION} title="Conversations" />
      <div className="flex flex-col gap-4">
        <SectionTitle>Overview</SectionTitle>
        <KpiRail columns={3}>
          <DefaultKpiTile icon={MessageSquare} label="No conversations yet" />
          <DefaultKpiTile icon={Activity} label="No turns yet" />
          <DefaultKpiTile icon={BarChart2} label="No cost yet" />
        </KpiRail>
      </div>
      <div className="mt-2 flex flex-col gap-4">
        <SectionTitle>Recent conversations</SectionTitle>
        <Card density="flush">
          <TableEmptyState
            body={EMPTY_BODY}
            icon={<IconChip icon={MessageSquare} />}
            title="No conversations"
          />
        </Card>
      </div>
    </MobilePageMain>
  );
}

/* ─── After it: the Pro page ────────────────────────────────────────────── */

/** `rangeWindow` anchored on `now` instead of `DEMO_NOW`. */
function rangeWindowAt(
  range: Range,
  customRange: CustomRange | null,
  now: Date
): CustomRange | null {
  if (range === "custom") {
    return customRange;
  }
  if (range === "all") {
    return null;
  }
  const from = new Date(now);
  if (range === "24h") {
    from.setHours(from.getHours() - 24);
  } else {
    from.setDate(from.getDate() - (range === "30d" ? 30 : 7));
  }
  return { from, to: new Date(now) };
}

/** The demo conversations a range holds, by their `updated` time (Pro's
 *  `rangedSeeds`). One array feeds the rail and the table. */
function rangedConversations(
  conversations: readonly OnboardingDemoConversation[],
  range: Range,
  customRange: CustomRange | null,
  now: Date
): OnboardingDemoConversation[] {
  const bounds = rangeWindowAt(range, customRange, now);
  return conversations.filter((c) => inRangeWindow(c.updated, bounds));
}

function ProConversations({ traffic }: { traffic: OnboardingDemoTraffic }) {
  // One clock per mount, later than every send: the sparks' right edge and
  // the Updated tooltip's anchor.
  const [mountedAt] = useState(() => new Date());
  const newest = traffic.conversations[0]?.updated.getTime() ?? 0;
  const now = useMemo(
    () => new Date(Math.max(mountedAt.getTime(), newest)),
    [mountedAt, newest]
  );
  const [range, setRange] = useState<Range>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const rows = useMemo(
    () => rangedConversations(traffic.conversations, range, customRange, now),
    [traffic.conversations, range, customRange, now]
  );

  return (
    <MobilePageMain>
      <MobilePageHeader description={PAGE_DESCRIPTION} title="Conversations" />
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
        <ConversationsRail
          customRange={customRange}
          now={now}
          range={range}
          rows={rows}
        />
      </div>
      <ConversationsTableSection
        models={traffic.models}
        now={now}
        resetKey={`${range}|${customRange?.from.getTime() ?? ""}|${customRange?.to.getTime() ?? ""}`}
        rows={rows}
      />
    </MobilePageMain>
  );
}

/* ─── KPI rail (Conversations.tsx KpiRail) ──────────────────────────────── */

const SPARK_POINTS = 9;

/** Conversations.tsx `sparkBucketDates`, anchored on `now`. */
function sparkBucketDates(
  range: Range,
  customRange: CustomRange | null,
  now: Date
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
    const d = new Date(now);
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
  buckets: OnboardingDemoConversation[][],
  stat: (rows: OnboardingDemoConversation[]) => number | null
): number[] {
  const seen: OnboardingDemoConversation[] = [];
  const points = buckets.map((bucket) => {
    seen.push(...bucket);
    return stat(seen);
  });
  const first = points.find((v) => v !== null) ?? 0;
  return points.map((v) => v ?? first);
}

const meanTurns = (of: OnboardingDemoConversation[]) =>
  of.length === 0 ? null : of.reduce((a, r) => a + r.turns, 0) / of.length;

/** Every demo conversation is Gate-metered (billed by Gate, $0.00 on the
 *  free models), so the mean is the plain mean of their costs. */
const meanCost = (of: OnboardingDemoConversation[]) =>
  of.length === 0 ? null : of.reduce((a, r) => a + r.costUsd, 0) / of.length;

function ConversationsRail({
  rows,
  range,
  customRange,
  now,
}: {
  rows: OnboardingDemoConversation[];
  range: Range;
  customRange: CustomRange | null;
  now: Date;
}) {
  const rail = useMemo(() => {
    const boundaries = sparkBucketDates(range, customRange, now);
    const buckets: OnboardingDemoConversation[][] = boundaries.map(() => []);
    for (const row of rows) {
      buckets[bucketOf(row.updated, boundaries)]?.push(row);
    }
    const span = {
      start: boundaries[0] ?? now,
      end: boundaries.at(-1) ?? now,
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
  }, [rows, range, customRange, now]);

  return (
    <KpiRail columns={3}>
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
    </KpiRail>
  );
}

/* ─── Table section (Conversations.tsx ConversationsTableSection) ──────── */

function conversationSortValue(
  row: OnboardingDemoConversation,
  key: string
): string | number | null {
  switch (key) {
    case "title":
      return row.title;
    case "vendors":
      return row.modelIds[0] ?? null;
    case "turns":
      return row.turns;
    case "reqs":
      return row.turns;
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
  now,
  resetKey: rangeKey,
}: {
  rows: OnboardingDemoConversation[];
  models: readonly OnboardingDemoModel[];
  now: Date;
  resetKey: string;
}) {
  const [query, setQuery] = useState("");
  const [keyId, setKeyId] = useState("all");
  const [model, setModel] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  // Pro's render-time reset: a narrowing filter or range starts on page 1.
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${rangeKey}|${query}|${model}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }
  const { sort, toggle: toggleSort } = useTableSort();
  const modelsById = useMemo(
    () => new Map(models.map((m) => [m.id, m])),
    [models]
  );
  // Search over the title and every prompt in the chat, case-insensitive
  // (the Pro search reads ids, prompts, users and keys; a demo chat has only
  // its title and prompts). Then the Model select, then the sort.
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (model !== "all" && !row.modelIds.includes(model)) {
        return false;
      }
      return (
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.prompts.some((p) => p.toLowerCase().includes(q))
      );
    });
    return sortRows(filtered, sort, conversationSortValue);
  }, [rows, model, query, sort]);
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
                    <TableCell className="whitespace-nowrap">
                      <div
                        aria-label={`Models: ${row.modelIds
                          .map((id) => modelsById.get(id)?.label ?? id)
                          .join(", ")}`}
                        className="flex items-center gap-1"
                        role="img"
                      >
                        {row.modelIds.map((id) => (
                          <VendorAvatar
                            decorative
                            key={id}
                            vendor={modelsById.get(id)?.vendor ?? ""}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {row.turns}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {row.turns}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {formatNumber(row.inTokens)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {formatNumber(row.outTokens)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {row.cost}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      <Timestamp anchor={now} date={row.updated} />
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
