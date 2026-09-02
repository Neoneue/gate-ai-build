import { ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Monogram } from "@/components/ui/monogram";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { memberById, type TeamRow } from "@/data/teams";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import {
  formatCompactCount,
  formatNumber,
  formatSparkLabel,
} from "@/lib/formatters";
import {
  type CustomRange,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
} from "@/lib/range";
import { cn } from "@/lib/utils";
import { getBucketCount, getRangeDates } from "@/pages/activity/chart-helpers";
import {
  ATTACK_MIX,
  HERO_CHART_CONFIG,
  RANGE_DELTA_NOTE,
} from "@/pages/security/events-data";
import {
  GuardrailEmptyState,
  type TeamsVariant,
} from "@/pages/teams/SecurityPane";
import {
  securityForTeamAtRange,
  type TeamMemberSlice,
  type TeamSecurity,
  teamEventShares,
} from "@/pages/teams/security-data";
import { teamSparkSeries } from "@/pages/teams/spark-series";

/* ─────────────────────────────────────────────────────────────────────────
 * Team detail → Security tab, ENTERPRISE ONLY (route:
 * /teams-enterprise/:teamId).
 *
 * Pro keeps `TeamSecurityPane` (five stacked count-row cards, no concept of
 * time) — that page is frozen, so this is a separate pane rather than a
 * variant of it. The two panes share the data layer (`security-data.ts`) and
 * the empty state, nothing else.
 *
 * Shape, top to bottom — the org Security page's Overview block, scoped to
 * one team, so a reader who knows that page already knows this tab:
 *   1. Overview header — range pill + custom picker, landing on All. Byte-
 *      identical composition to the Usage tab's header, so switching tabs
 *      doesn't move the control.
 *   2. Hero card — "Total events": Eyebrow + HeroNumeric + DeltaTag + area
 *      chart, the org `HeroMetricCard` treatment.
 *   3. Action types + Attack types — the org `MiddleRow` pair, same titles,
 *      descriptions, bar geometry and colors; only the counts are team-scoped.
 *   4. By member — a real table, because a team can have a lot of members and
 *      a bar per person stops being a comparison.
 *
 * Removed 2026-09-01 against the PRD (8.4 asks for event counts by type and
 * verdict only): the "What this covers" summary card (explanatory UI) and the
 * "By pipeline stage" tiles (the dev build's request/output scan-phase GROUP
 * BY, a backend artifact with no PRD sentence).
 *
 * The "By outcome" card Pro shows is GONE by design: its Blocked / Flagged /
 * Redacted rows ARE the Action-types card, and its Allowed row is a clause in
 * the summary sentence. A four-row count card on top of that would be
 * duplication, not a breakdown.
 *
 * Reconciliation contract (charts-must-reconcile): every number on the tab
 * comes from ONE `securityForTeamAtRange` call, and the chart series is
 * `teamSparkSeries` settled onto `findings`, so sum(chart) === the headline
 * for every range and the Action-types bars sum to it too (`splitEventMix` is
 * a largest-remainder split).
 * ───────────────────────────────────────────────────────────────────────── */

/** One bar row: the org Action-types / Attack-types card shape. */
type BarRow = {
  id: string;
  label: string;
  count: number;
  /** Bar fill — the site-wide gradient recipe (darker origin → lighter
   *  leading edge). Chart slots run to their `-soft` twin, semantic families
   *  to their own 400 step. */
  fill: string;
};

/** Left card. Label + fill metadata mirrors the org page's
 *  `ACTION_CATEGORY_META` exactly (Blocked / Flagged / Redacted, in that
 *  reading order); counts are injected per range from `byOutcome`. */
const ACTION_META = [
  {
    id: "block",
    label: "Blocked",
    fill: "bg-gradient-to-r from-danger-500 to-danger-400",
  },
  {
    id: "flagged",
    label: "Flagged",
    fill: "bg-gradient-to-r from-warning-500 to-warning-400",
  },
  {
    id: "redacted",
    label: "Redacted",
    fill: "bg-gradient-to-r from-warning-500 to-warning-400",
  },
] as const;

/** Right card. The org Attack-types mapping, keyed on the same `ATTACK_MIX`
 *  ids the data layer emits. */
const ATTACK_FILL: Record<string, string> = {
  pii: "bg-gradient-to-r from-chart-3 to-chart-3-soft",
  injection: "bg-gradient-to-r from-chart-1 to-chart-1-soft",
  credential: "bg-gradient-to-r from-chart-4 to-chart-4-soft",
};
const ATTACK_FALLBACK_FILL = "bg-gradient-to-r from-chart-2 to-chart-2-soft";

const WHITESPACE_RE = /\s+/;
const YEAR_RE = /,\s\d{4}/;

/** Day-scale axis tick. Drops the year and keeps the trailing time token,
 *  which `SparkXAxisTick` then strips: "Apr 27, 2026 00:00" → "Apr 27". */
function formatDayTick(value: string | number): string {
  return String(value).replace(YEAR_RE, "");
}

/** 24H axis tick — the time alone. No space left in it, so `SparkXAxisTick`
 *  renders it whole. */
function formatHourTick(value: string | number): string {
  const raw = String(value);
  return raw.slice(raw.lastIndexOf(" ") + 1);
}

export function TeamSecurityOverviewPane({
  team,
  teams,
  variant,
}: {
  team: TeamRow;
  /** Every team the page is rendering — the event allocation needs the full
   *  set so this team's share settles exactly onto the org total. */
  teams: TeamRow[];
  variant: TeamsVariant;
}) {
  const [range, setRange] = useState<Range>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  // One derivation feeds the hero, both breakdown cards, the summary, the
  // member table and the stage tiles, so no two cards on the tab can describe
  // different windows.
  const security = securityForTeamAtRange(team, range, customRange, teams);

  // The empty gate is deliberately RANGE-INDEPENDENT: a low-volume team
  // rounds to 0 checks at 24H, and a tab that vanishes when you press a range
  // button is a bug, not an empty state.
  const lifetimeChecks = securityForTeamAtRange(
    team,
    "all",
    null,
    teams
  ).checks;

  if (variant === "default" || lifetimeChecks === 0) {
    return (
      <GuardrailEmptyState
        icon={
          <div
            aria-hidden
            className="flex size-12 items-center justify-center rounded-md bg-muted"
          >
            <ShieldCheck
              className="size-5 text-muted-foreground"
              strokeWidth={1.75}
            />
          </div>
        }
      />
    );
  }

  const outcomeCount = new Map(security.byOutcome.map((o) => [o.id, o.count]));
  const actionRows: BarRow[] = ACTION_META.map((meta) => ({
    ...meta,
    count: outcomeCount.get(meta.id) ?? 0,
  }));
  const attackRows: BarRow[] = security.byCategory.map((slice) => ({
    id: slice.id,
    label: slice.label,
    count: slice.count,
    fill: ATTACK_FILL[slice.id] ?? ATTACK_FALLBACK_FILL,
  }));

  return (
    /* Bento cluster = the chart + the two breakdown cards + the text card, at
       16px: they all read the same securityForTeamAtRange call. The titled
       By member block below tops its gap up to 24px with mt-2, so it reads
       as a section rather than more bento. */
    <div className="flex flex-col gap-4">
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

      <HeroEventsCard
        customRange={customRange}
        range={range}
        security={security}
        team={team}
        teams={teams}
      />

      <div className="grid @3xl:grid-cols-2 grid-cols-1 gap-4">
        <CategoryBreakdownCard
          description="Breakdown by action type"
          idPrefix="team-security-action"
          rows={actionRows}
          title="Action types"
        />
        {/* Attack types counts FINDINGS, so a clean team empties it while the
            Action-types card still renders its three zero rows. The empty copy
            says which of the two it is: nothing fired, versus nothing recorded
            for a team that does have findings. */}
        <CategoryBreakdownCard
          description="Breakdown by detection type"
          emptyBody={
            security.findings === 0
              ? "Nothing to attribute. No detector fired on this team’s traffic, so there is no category to report."
              : "No categories recorded."
          }
          idPrefix="team-security-attack"
          rows={attackRows}
          title="Attack types"
        />
      </div>

      <MemberFindingsSection security={security} />
    </div>
  );
}

/* ─── 1. Hero — Total events ───────────────────────────────────────────── */

function HeroEventsCard({
  team,
  teams,
  security,
  range,
  customRange,
}: {
  team: TeamRow;
  teams: TeamRow[];
  security: TeamSecurity;
  range: Range;
  customRange: CustomRange | null;
}) {
  // Series: a WINDOW of one daily backbone per team, re-settled onto the
  // findings headline for the active range (teams/spark-series.ts). The
  // backbone is shaped by the team's unscaled 7d event share, so the All
  // chart's tail and the 7D chart describe the same days.
  const teamSeed = [...team.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = getBucketCount(range, customRange);
  const findings7d = teamEventShares("7d", null, teams).get(team.id) ?? 0;
  const series = teamSparkSeries(
    findings7d,
    security.findings,
    range,
    customRange,
    count,
    teamSeed * 31 + 4
  );

  // `time` carries the full timestamp so every bucket is a distinct x
  // category (a short custom range can put two buckets on one calendar day);
  // the tick formatters below reduce it to what the axis shows, and `label`
  // is what the tooltip reads.
  const hourly = range === "24h";
  const data = getRangeDates(range, customRange).map((d, i) => ({
    time: formatSparkLabel(d, true),
    label: formatSparkLabel(d, hourly),
    requests: series[i] ?? 0,
  }));
  const domainTop = Math.max(...data.map((d) => d.requests), 1) + 1;

  // 4–7 evenly spaced ticks, same rule as the org hero; recharts thins them
  // further on narrow columns via minTickGap.
  const tickCount = Math.min(7, Math.max(4, data.length));
  const ticks: string[] = [];
  for (let i = 0; i < tickCount; i++) {
    const t = Math.round((i * (data.length - 1)) / (tickCount - 1));
    const label = data[t]?.time;
    if (label && !ticks.includes(label)) {
      ticks.push(label);
    }
  }

  return (
    <Card className="px-4">
      <div className="flex shrink-0 flex-col gap-2">
        <Eyebrow>Total events</Eyebrow>
        {/* Delta rides beside the number on its BASELINE (16px gap) — the
            chip reads as part of the number's line, not floating mid-height
            next to it. User direction 2026-09-01. */}
        <div className="flex items-baseline gap-4">
          <HeroNumeric size="lg">
            {formatCompactCount(security.findings)}
          </HeroNumeric>
          {/* The org page's delta constant, not a team number: a team's events
              are a fixed allocated SHARE of the org series (largest-remainder
              split of the same canon), so the org's period-over-period rate is
              the team's rate. Deriving a separate one would either restate
              this or invent prior-period team data that does not exist. */}
          <DeltaTag delta="+22.4%" note={RANGE_DELTA_NOTE[range]} size="md" />
        </div>
      </div>

      <div className="w-full">
        <ChartContainer
          className="aspect-auto h-24 w-full"
          config={HERO_CHART_CONFIG}
        >
          <AreaChart accessibilityLayer data={data} margin={SPARK_CHART_MARGIN}>
            <defs>
              <linearGradient
                id="team-security-events-spark"
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
            {/* Dashed baseline + ceiling only — `ticks` pinned to the domain
                ends so the grid draws exactly two horizontal lines. */}
            <CartesianGrid
              horizontal
              stroke="var(--color-chart-grid)"
              strokeDasharray="8 5"
              vertical={false}
            />
            <YAxis
              axisLine={false}
              domain={[0, domainTop]}
              tick={false}
              tickLine={false}
              ticks={[0, domainTop]}
              width={0}
            />
            <XAxis
              axisLine={false}
              dataKey="time"
              height={CHART_X_AXIS_HEIGHT}
              interval="preserveStartEnd"
              minTickGap={16}
              tick={SparkXAxisTick}
              tickFormatter={hourly ? formatHourTick : formatDayTick}
              tickLine={false}
              tickMargin={CHART_X_TICK_MARGIN}
              ticks={ticks}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="gap-1"
                  formatter={(value) => (
                    <span className="type-label-14 text-foreground">
                      {formatNumber(Math.round(Number(value)))}
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
              fill="url(#team-security-events-spark)"
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

/* ─── 2. Action types + Attack types ───────────────────────────────────────
 * The org Security page's MiddleRow pair. Its `CategoryBreakdownCard` is
 * page-local, so the recipe is mirrored here rather than imported across
 * pages: same titles, descriptions, 3-col grid, bar geometry and palette.
 * The one deliberate difference is the CardTitle, which stays the bare
 * primitive — the org card overrides its tracking at the call site, and
 * `no-handrolling` forbids re-styling a primitive's typography.
 * ────────────────────────────────────────────────────────────────────────── */

function CategoryBreakdownCard({
  title,
  description,
  rows,
  emptyBody,
  idPrefix,
}: {
  title: string;
  description: string;
  rows: BarRow[];
  /** Shown in place of the rows when the list can empty. Omitted on the
   *  Action-types card, which always renders its three outcomes. */
  emptyBody?: string;
  /** Namespaces the row label ids the meters point at. */
  idPrefix: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {/* 3-col grid: label (auto) · track (1fr, all flush) · count (auto —
          sizes to the widest number, right-aligned against the card edge).
          Each row is a `display:contents` wrapper so its three children land
          directly in the shared grid tracks. */}
      {rows.length === 0 && emptyBody ? (
        <CardContent>
          <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
            {emptyBody}
          </p>
        </CardContent>
      ) : (
        <CardContent className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3">
          {rows.map((row) => {
            const labelId = `${idPrefix}-${row.id}`;
            return (
              <div className="contents" key={row.id}>
                <span
                  className="type-copy-14 w-48 shrink-0 truncate text-foreground"
                  id={labelId}
                  title={row.label}
                >
                  {row.label}
                </span>
                <div
                  aria-labelledby={labelId}
                  aria-valuemax={max}
                  aria-valuemin={0}
                  aria-valuenow={row.count}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="meter"
                >
                  <div
                    className={cn("h-full rounded-full", row.fill)}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
                <span className="type-mono-14 justify-self-end whitespace-nowrap pl-2 text-foreground">
                  {formatNumber(row.count)}
                </span>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

/* ─── 4. By member ─────────────────────────────────────────────────────── */

function memberSortValue(
  row: TeamMemberSlice,
  key: string
): string | number | null {
  if (key === "label") {
    return row.label;
  }
  if (key === "count") {
    return row.count;
  }
  return row.byCategory[key as keyof typeof row.byCategory] ?? null;
}

function MemberFindingsSection({ security }: { security: TeamSecurity }) {
  // Same sort recipe as the Usage tab breakdown tables: one hook per table,
  // starting in the incoming (events-ranked) order until a header is toggled.
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(security.byMember, sort, memberSortValue),
    [security.byMember, sort]
  );
  // A table, not bars: a large team turns a bar-per-person into a wall, and
  // the rows sum exactly to the findings headline either way. Same title +
  // flush-card treatment as the Usage tab's breakdown tables.
  // mt-2 tops the column's gap-4 up to 24px: the bento treatment (16px) is
  // the chart + the two breakdown cards + the text card (user-scoped
  // 2026-09-01); this titled block sits below that cluster and takes the full
  // section break, same as the stage set under it.
  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SectionTitle>Events by member</SectionTitle>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          Which members the security events came from, by threat type.
        </p>
      </div>
      <Card density="flush">
        {security.byMember.length === 0 ? (
          <TableEmptyState
            body={
              security.findings === 0
                ? "Nothing to attribute. No detector fired on this team’s traffic. Per-member request volume lives on the Usage tab."
                : "No per-member data recorded."
            }
            title="No per-member findings"
          />
        ) : (
          <Table className="min-w-[640px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead
                  className="w-[36%] whitespace-nowrap"
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="label"
                >
                  Member
                </SortableTableHead>
                {/* One column per threat type, ATTACK_MIX order: each column
                    sums to the Attack types card above; Findings is the
                    row total, the balance being uncategorized. */}
                {ATTACK_MIX.map((c) => (
                  <SortableTableHead
                    className="w-[16%] whitespace-nowrap"
                    key={c.key}
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey={c.key}
                  >
                    {c.label}
                  </SortableTableHead>
                ))}
                <SortableTableHead
                  className="w-[16%] whitespace-nowrap"
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="count"
                >
                  Events
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* Single first initial + the member's own tone — the
                          Activity Top-users treatment the Usage tab also
                          uses, so the same person looks the same on both
                          tabs. */}
                      <Monogram
                        initials={(
                          row.label.trim().split(WHITESPACE_RE)[0]?.[0] ?? "?"
                        ).toUpperCase()}
                        size="sm"
                        tone={memberById(row.id)?.avatarTone ?? "ink"}
                      />
                      <span
                        className="min-w-0 flex-1 truncate"
                        title={row.label}
                      >
                        {row.label}
                      </span>
                    </div>
                  </TableCell>
                  {ATTACK_MIX.map((c) => (
                    <TableCell
                      className="type-mono-14 whitespace-nowrap text-right text-foreground"
                      key={c.key}
                    >
                      {formatNumber(row.byCategory[c.key])}
                    </TableCell>
                  ))}
                  <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                    {formatNumber(row.count)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
