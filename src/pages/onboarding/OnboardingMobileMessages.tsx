import {
  ArrowLeftRight,
  BarChart2,
  CreditCard,
  Info,
  KeyRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { SearchInput } from "@/components/ui/search-input";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
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
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import {
  formatCompactCount,
  formatNumber,
  formatRelative,
} from "@/lib/formatters";
import {
  type OnboardingDemoMessage,
  type OnboardingDemoTraffic,
  useOnboardingDemoTraffic,
} from "@/pages/onboarding/onboarding-demo-traffic";
import { demoMessagesHero } from "@/pages/onboarding/onboarding-messages-hero";
import {
  EmptyChartCard,
  IconChip,
  MobilePageHeader,
  MobilePageMain,
} from "@/pages/onboarding/onboarding-mobile-parts";
import {
  GUARDRAIL_BADGE,
  RANGE_OPTIONS,
  RESPONSE_BADGE,
} from "@/pages/requests/data";
import type { CustomRange, RangeKey } from "@/pages/requests/types";

/* ─── OnboardingMobileMessages ──────────────────────────────────────────────
 * `/messages-mobile-onboarding`: the Mobile A demo's Messages, a copy of the
 * Pro Messages page (`Requests.tsx` + `requests/HeroMetric.tsx` +
 * `requests/RequestsTable.tsx`) fed by every demo Gate Chat message instead
 * of mock traffic (owner 2026-10-12, `useOnboardingDemoTraffic`). Before the
 * first message the page keeps the Default layout (the RequestsDefault copy:
 * "No messages yet" chart card and the empty table); after it the page is
 * the Pro layout, the hero counting each message in its send bucket and the
 * table listing every message, newest first ("Default is fine for default but when you added data we
 * needed those versions"). Mobile only (owner 2026-10-11): nothing here is shared with the
 * desktop page, and the range is local state, not the shared `rangeStore`,
 * so the demo range never leaks into `/messages`.
 *
 * Left out of the Pro copy: the hero's delta (no prior period exists), the
 * Filters dialog (its key, device and model lists are the Pro mock
 * account's, so the button renders inert), the retention callout, and the
 * Key, Device name, Conversation and Latency columns (a mock message has no
 * value for them). No detail page exists for a mock message, so a row opens
 * nothing and the Model cell is not a link.
 * ───────────────────────────────────────────────────────────────────────── */

const PAGE_DESCRIPTION =
  "Every model call across your stack, inspected for injection, PII, and credentials before it reaches the model.";
const EMPTY_BODY =
  "Individual messages routed through the gateway will appear here.";

export function OnboardingMobileMessages() {
  const traffic = useOnboardingDemoTraffic();
  return traffic ? <ProMessages traffic={traffic} /> : <DefaultMessages />;
}

/** Before the first message: the RequestsDefault copy, unchanged (owner
 *  2026-10-12, "Default is fine for default"). */
function DefaultMessages() {
  return (
    <MobilePageMain>
      <MobilePageHeader description={PAGE_DESCRIPTION} title="Messages" />
      <div className="flex flex-col gap-4">
        <SectionTitle>Overview</SectionTitle>
        <EmptyChartCard icon={BarChart2} label="No messages yet" />
      </div>
      <div className="mt-2 flex flex-col gap-4">
        <SectionTitle>Recent messages</SectionTitle>
        <Card density="flush">
          <TableEmptyState
            body={EMPTY_BODY}
            icon={<IconChip icon={ArrowLeftRight} />}
            title="No messages"
          />
        </Card>
      </div>
    </MobilePageMain>
  );
}

/** After the first message: the Pro page (Requests.tsx), fed by every demo
 *  message. */
function ProMessages({ traffic }: { traffic: OnboardingDemoTraffic }) {
  const sentAts = useMemo(
    () => traffic.messages.map((m) => m.sentAt),
    [traffic]
  );
  // One clock per mount: the chart's last bucket and the Time tooltip.
  const [now] = useState(() => new Date());
  // Requests.tsx's range state, minus the shared store.
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
    <MobilePageMain>
      <MobilePageHeader description={PAGE_DESCRIPTION} title="Messages" />
      {/* Requests.tsx:87-108: the Overview bar and the hero card in one
          gap-4 group, so "Overview" reads as the label for the card. */}
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
        <MessagesHeroCard
          customRange={customRange}
          now={now}
          range={range}
          sentAts={sentAts}
        />
      </div>
      <RecentMessages messages={traffic.messages} now={now} />
    </MobilePageMain>
  );
}

/* ─── Hero card (HeroMetric.tsx HeroMetricCard) ─────────────────────────── */

const HERO_CHART_CONFIG = {
  requests: { label: "Total", color: "var(--color-chart-1)" },
  success: { label: "Success", color: "var(--color-success-600)" },
  errors: { label: "Errors", color: "var(--destructive)" },
} satisfies ChartConfig;

function MessagesHeroCard({
  range,
  customRange,
  sentAts,
  now,
}: {
  range: RangeKey;
  customRange: CustomRange | null;
  sentAts: readonly Date[];
  now: Date;
}) {
  const view = useMemo(
    () => demoMessagesHero(range, customRange, sentAts, now),
    [range, customRange, sentAts, now]
  );

  return (
    <Card className="px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* The Pro recipe minus the DeltaTag: there is no prior period to
            compare the demo's messages against. */}
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
                id="onboarding-messages-hero-spark"
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
              fill="url(#onboarding-messages-hero-spark)"
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

/* ─── Recent messages (RequestsTable.tsx RequestsTableSection) ──────────── */

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const CLOCK_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** RequestsTable's sort keys, read off a demo message. */
function messageSortValue(
  message: OnboardingDemoMessage,
  key: string
): string | number | null {
  switch (key) {
    case "time":
      return message.sentAt.getTime();
    case "status":
      return "success";
    case "guardrail":
      return "allow";
    case "message":
      return message.prompt;
    case "model":
      return message.modelLabel;
    case "inTokens":
      return message.inTokens;
    default:
      return null;
  }
}

function RecentMessages({
  messages,
  now,
}: {
  messages: readonly OnboardingDemoMessage[];
  now: Date;
}) {
  // Toolbar search over the prompt text, case-insensitive (RequestsTable
  // filters synchronously off the committed value, no debounce).
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? messages.filter((m) => m.prompt.toLowerCase().includes(q))
      : [...messages];
  }, [messages, query]);
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(rows, sort, messageSortValue),
    [rows, sort]
  );
  const [rowsPerPage, setRowsPerPage] = useState("25");
  const [page, setPage] = useState(1);
  const handlePageChange = useCallback((next: number) => setPage(next), []);
  // A new search starts on page 1 (render-time reset, as Conversations.tsx
  // does for its filters), so a narrowing query cannot strand an empty page.
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setPage(1);
  }
  // `resolveRowsPerPage` owns the page math, the same helper the footer's
  // "Showing N-M of T" line uses, so the rows and the footer agree.
  const perPage = resolveRowsPerPage(rowsPerPage, sortedRows.length);
  const pagedRows = sortedRows.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <SectionTitle>Recent messages</SectionTitle>
        {/* RequestsTable.tsx:355: below the @2xl container width the search
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
          {/* Inert in the demo: the Pro Filters dialog lists the Pro mock
              account's keys, devices and models. */}
          <Button
            className="@2xl:flex-none flex-1"
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
          </Button>
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

      <Card density="flush">
        {sortedRows.length === 0 ? (
          // A search with no match: the Pro table's own empty state.
          <TableEmptyState body={EMPTY_BODY} title="No messages" />
        ) : (
          <>
            {/* The Pro table's column percentages, verbatim, for the seven
                columns kept. They sum to 63.5 of Pro's 102, and the floor is
                63.5 / 102 * 1612 = 1003.5px, rounded up to the 4px grid:
                1004px. Under `table-fixed` every kept column lands at its Pro
                pixel width (Time 9.5 / 63.5 * 1004 = 150px, Message 245px,
                Model 190px, Tokens 134px, Cost 87px). Below the floor the
                table's own overflow-x-auto side-scrolls, as on Pro. */}
            <Table className="min-w-[1004px] table-fixed">
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
                    className="w-[15.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="message"
                  >
                    Message
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
                  <CostHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((row) => (
                  <MessageRow key={row.id} message={row} now={now} />
                ))}
              </TableBody>
            </Table>
            <TablePaginationFooter
              minRowsPerPage={25}
              onPageChange={handlePageChange}
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

/** One row in RequestsTable's cell styles. Status is success and security
 *  allow (the scripted reply); the model is free, billed through Gate. */
function MessageRow({
  message,
  now,
}: {
  message: OnboardingDemoMessage;
  now: Date;
}) {
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
        <Badge variant={RESPONSE_BADGE.success.variant}>success</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={GUARDRAIL_BADGE.allow.variant}>allow</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <span
                {...props}
                className="type-copy-14 block truncate text-foreground"
              >
                {message.prompt}
              </span>
            )}
          />
          <TooltipContent className="max-w-sm text-left">
            {message.prompt}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="flex w-full min-w-0 items-center gap-2">
          <VendorAvatar vendor={message.vendor} />
          <span
            className="type-copy-14 block truncate text-foreground"
            title={message.modelLabel}
          >
            {message.modelLabel}
          </span>
        </span>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
        {formatNumber(message.inTokens)}
        <span className="type-mono-12 block text-muted-foreground">
          {formatNumber(message.outTokens)}
        </span>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right">
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
          <span className="text-foreground">{message.cost}</span>
        </span>
      </TableCell>
    </TableRow>
  );
}
