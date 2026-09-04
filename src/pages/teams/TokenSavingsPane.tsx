import { Check, Info } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { KpiRail } from "@/components/ui/kpi-rail";
import { KpiTile } from "@/components/ui/kpi-tile";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TeamRow, TeamSavings } from "@/data/teams";
import { cn } from "@/lib/utils";
import { teamSavingsKpis } from "@/pages/teams/savings-data";
import {
  type CustomRange,
  type PresetRange,
  RANGE_DELTA_NOTE,
  RANGE_OPTIONS,
  type Range,
  resampleSpark,
  SPARK_STOPS,
  sparkDates,
  sparkDelta,
} from "@/pages/token-savings-data";

/* ─────────────────────────────────────────────────────────────────────────
 * Team detail → Token savings tab, ENTERPRISE ONLY (route:
 * /teams-enterprise/:teamId).
 *
 * The org Token savings page's Pro body, scoped to one team (AG-624 /
 * PRD 8.5: team-level compression settings). Same clone shape as the
 * Security tab: chrome (`DashboardChrome`, `PageTitle`, the intro copy), the
 * `plan` seam and every Free branch (Basic compression card, the savings
 * headline upsell hook, `PlanComparisonDialog`) are dropped; the Overview
 * rail and the two option cards are verbatim.
 *
 * Reconciliation contract (charts-must-reconcile): the three tiles come from
 * ONE `teamSavingsKpis` call, whose Total spark is the per-point sum of the
 * Caching and Compression sparks, and whose components zero out when the
 * team's own switch is off — so flipping a switch here moves the rail.
 *
 * State lives on the team row (`team.savings`, seeded from the org defaults
 * via `TEAM_SAVINGS_SEED`); this pane is a controlled surface and every edit
 * hands the whole object back through `onChange`, the way `BudgetPane` hands
 * back `budget`.
 *
 * NOT in this phase: org-level forced settings, the lock cascade, the locked
 * read-only rendering, the not-entitled state. Every control here is live.
 * ───────────────────────────────────────────────────────────────────────── */

export function TeamTokenSavingsPane({
  team,
  teams,
  onChange,
  loading,
}: {
  team: TeamRow;
  /** Every team the page is rendering — the rate factors need the full set so
   *  this team's savings settle against the org average. */
  teams: TeamRow[];
  onChange: (savings: TeamSavings) => void;
  /** From the page-level hook. Only the Overview rail waits: the Compression
   *  and Caching cards below are CONTROLS reading `team.savings`, not
   *  readings of traffic, so they render as themselves. */
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <TeamTokenSavingsRail loading={loading} team={team} teams={teams} />
      <SavingsOptionsSection onChange={onChange} team={team} />
    </div>
  );
}

/** The KPI rail on its own, with its range chrome. The Token savings tab
 *  stacks the options cards under it; the Overview tab renders just this,
 *  retitled, between the Usage and Security blocks. */
export function TeamTokenSavingsRail({
  team,
  teams,
  loading,
  title = "Overview",
  titleClassName,
  controlledRange,
}: {
  team: TeamRow;
  teams: TeamRow[];
  loading: boolean;
  title?: string;
  /** Controlled range (Overview tab). When set, the section's own range
   *  chrome is hidden and the tab-level picker drives every number. */
  controlledRange?: { range: Range; customRange: CustomRange | null };

  /** Voice override for the title; the Overview tab steps its three block
   *  titles up to `type-heading-24` so the sections read apart. */
  titleClassName?: string;
}) {
  // Range selector defaults to All on load, matching the Usage and Security
  // tabs. No `?range=` read: the tab is not a deep-link target.
  const [range, setRange] = useState<Range>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  return (
    <OverviewSection
      customRange={controlledRange ? controlledRange.customRange : customRange}
      hideRangeChrome={Boolean(controlledRange)}
      loading={loading}
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
      range={controlledRange ? controlledRange.range : range}
      team={team}
      teams={teams}
      title={title}
      titleClassName={titleClassName}
    />
  );
}

/* ─── KPI rail ──────────────────────────────────────────────────────── */

function OverviewSection({
  range,
  customRange,
  onRangeChange,
  onCustomRangeChange,
  team,
  teams,
  loading,
  title,
  titleClassName,
  hideRangeChrome,
}: {
  range: Range;
  customRange: CustomRange | null;
  onRangeChange: (r: PresetRange) => void;
  onCustomRangeChange: (r: CustomRange | null) => void;
  team: TeamRow;
  teams: TeamRow[];
  loading: boolean;
  title: string;
  titleClassName?: string;
  hideRangeChrome?: boolean;
}) {
  const effectiveRange = range === "custom" ? "all" : range;
  const kpis = teamSavingsKpis(team, teams, effectiveRange);
  const sparkStops = SPARK_STOPS[effectiveRange];
  const sparkLabels = sparkDates(effectiveRange, sparkStops);
  const note = RANGE_DELTA_NOTE[range];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle className={titleClassName}>{title}</SectionTitle>
        {hideRangeChrome ? null : (
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
        )}
      </div>
      <KpiRail columns={3}>
        {kpis.map((k) => (
          <KpiTile
            delta={
              // No traffic, no trend: a fresh team shows the value alone
              // instead of a "+0.00%" chip.
              k.spark.some((v) => v !== 0) ? sparkDelta(k.spark) : undefined
            }
            deltaNote={note}
            deltaRow
            key={k.title}
            loading={loading}
            spark={
              <CompactSpark
                colorVar={k.colorVar}
                data={resampleSpark(k.spark, sparkStops)}
                labels={sparkLabels}
                tooltip
                valueFormatter={(v) => `${v}%`}
              />
            }
            title={k.title}
            value={k.value}
            valueSuffix="%"
          />
        ))}
      </KpiRail>
    </div>
  );
}

/* ─── Savings options ───────────────────────────────────────────────── */

function SavingsOptionsSection({
  team,
  onChange,
}: {
  team: TeamRow;
  onChange: (savings: TeamSavings) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle>Savings options</SectionTitle>
      </div>
      <TeamSavingsOptionCards onChange={onChange} savings={team.savings} />
    </div>
  );
}

/** The Compression + Caching control cards with no section chrome. The
 *  Settings tab renders these under its own "Token savings" title. */
export function TeamSavingsOptionCards({
  savings,
  onChange,
  locked = false,
}: {
  /** A team's `team.savings`, or the org defaults on the Teams Settings tab. */
  savings: TeamSavings;
  onChange: (savings: TeamSavings) => void;
  /** Every control renders disabled (org or team lock, AG-624 / PRD 8.5). */
  locked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <CompressionCard locked={locked} onChange={onChange} savings={savings} />
      <CachingCard locked={locked} onChange={onChange} savings={savings} />
    </div>
  );
}

function CardChromeHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  /** Optional control rendered flush right with the title — e.g. the card's
   * enable Switch, so the header toggle governs the whole card. */
  action?: ReactNode;
}) {
  return (
    <CardHeader className="border-border border-b">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="type-heading-16 m-0 text-foreground">{title}</h3>
          <p className="type-copy-14 m-0 text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </CardHeader>
  );
}

const TTL_OPTIONS = [
  { value: "5m", label: "5m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
] as const;

function CachingCard({
  savings,
  locked,
  onChange,
}: {
  savings: TeamSavings;
  locked: boolean;
  onChange: (savings: TeamSavings) => void;
}) {
  const enabled = savings.caching;
  const ttl = savings.cacheTtl;

  return (
    <Card>
      <CardChromeHeader
        action={<StatusBadge on={enabled} />}
        description="Reuse identical responses."
        title="Caching"
      />
      <CardContent className="flex flex-col gap-3">
        <Card className="rounded-sm border border-border bg-transparent shadow-none">
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <p
                  className="type-label-14 m-0 text-foreground"
                  id="caching-switch-label"
                >
                  Enable response caching
                </p>
                <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
                  Serve cached responses instead of round-tripping to providers.
                  Identical concurrent messages are deduplicated automatically.
                </p>
              </div>
              <Switch
                aria-labelledby="caching-switch-label"
                checked={enabled}
                className="mt-1 shrink-0"
                disabled={locked}
                onCheckedChange={(next) => {
                  onChange({ ...savings, caching: next });
                  toast(next ? "Caching enabled" : "Caching disabled");
                }}
                size="lg"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-transparent shadow-none">
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="type-label-14 m-0 text-foreground" id="ttl-label">
                  TTL
                </p>
                <p className="type-copy-14 m-0 text-muted-foreground">
                  How long cached entries live before re-fetching.
                </p>
              </div>
              <Select
                disabled={locked}
                onValueChange={(next) => {
                  onChange({ ...savings, cacheTtl: next });
                  toast.success("TTL saved");
                }}
                value={ttl}
              >
                <SelectTrigger
                  aria-labelledby="ttl-label"
                  className="w-24 shrink-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TTL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

type CompressionBenefit = { title: string; description: string };

// Everything in the lightweight Basic lane, plus the heavy hitters that drive
// the real savings.
const PRO_COMPRESSION_BENEFITS: CompressionBenefit[] = [
  {
    title: "Tool-output compaction",
    description:
      "Intelligently shrinks command output: git diffs, test runs (pytest/jest), build logs, npm/cargo, and more.",
  },
  {
    title: "Cross-conversation de-duplication",
    description:
      "When the same file or output recurs across a long session, stores it once instead of every turn — the single biggest saver.",
  },
  {
    title: "Tool-definition slimming",
    description:
      "Compresses the large “available tools” schemas sent on every request.",
  },
  {
    title: "Prose trimming",
    description:
      "Removes filler and redundancy in long English passages, with path collapse and aggressive duplicate-paragraph/quote removal.",
  },
];

function BenefitList({
  benefits,
  checkClassName,
  outlineClassName,
}: {
  benefits: CompressionBenefit[];
  checkClassName: string;
  /** Border color for the outline card wrapping the list (matches card chrome). */
  outlineClassName: string;
}) {
  return (
    <div className={`rounded-sm border bg-card/40 p-4 ${outlineClassName}`}>
      <ul className="m-0 grid list-none @lg:grid-cols-2 grid-cols-1 gap-4 p-0">
        {benefits.map((benefit) => (
          <li className="flex items-center gap-2" key={benefit.title}>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-primary-foreground",
                checkClassName
              )}
            >
              <Check aria-hidden className="size-3.5" />
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <span className="type-copy-14 text-foreground">
                {benefit.title}
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <span
                      {...props}
                      aria-label={`About ${benefit.title}`}
                      className="-m-1 inline-flex shrink-0 cursor-help rounded-sm p-1 text-muted-foreground hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Info
                        aria-hidden
                        className="size-3.5"
                        strokeWidth={1.75}
                      />
                    </span>
                  )}
                />
                <TooltipContent>{benefit.description}</TooltipContent>
              </Tooltip>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompressionCard({
  savings,
  locked,
  onChange,
}: {
  savings: TeamSavings;
  locked: boolean;
  onChange: (savings: TeamSavings) => void;
}) {
  const advancedEnabled = savings.compression;

  return (
    <Card>
      <CardChromeHeader
        action={<StatusBadge on={advancedEnabled} />}
        description="Shrink prompts before they reach the provider, without affecting the model's output."
        title="Compression"
      />
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3">
          {/* The Advanced card, in its already-entitled shape: no promotional
              blue chrome (neutral, like the org page on Pro), an enable
              toggle instead of an Upgrade CTA, but it keeps the blue Pro
              badge and blue checks to mark the tier the capability comes
              from. */}
          <Card className="rounded-sm shadow-none">
            <CardContent className="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <SectionHeading as="h4" className="type-heading-16">
                      Advanced compression
                    </SectionHeading>
                    <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
                      All the lightweight Basic clean-up, plus the heavy hitters
                      that drive the real savings.
                    </p>
                  </div>
                  <Switch
                    aria-label="Enable advanced compression"
                    checked={advancedEnabled}
                    className="shrink-0"
                    disabled={locked}
                    onCheckedChange={(next) => {
                      onChange({ ...savings, compression: next });
                      toast(
                        next
                          ? "Advanced compression enabled"
                          : "Advanced compression disabled"
                      );
                    }}
                    size="lg"
                  />
                </div>
                <BenefitList
                  benefits={PRO_COMPRESSION_BENEFITS}
                  // Soft blue checks: the card's own chrome already carries the
                  // tier mark, so keeping checks light stops a mass of
                  // solid-blue dots from competing with the toggle.
                  checkClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  outlineClassName="border-border"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
