import { Check, Info } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { KpiRail } from "@/components/ui/kpi-rail";
import { KpiTile } from "@/components/ui/kpi-tile";
import { PageTitle } from "@/components/ui/page-title";
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
import { SparklesIcon } from "@/components/ui/sparkles";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatSparkLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { PlanComparisonDialog } from "@/pages/plan-comparison-dialog";

type Plan = "pro" | "free";

export function TokenSavings({ plan = "pro" }: { plan?: Plan } = {}) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  // Range selector defaults to All on load (every page's landing state); read
  // `?range=` once for deep-links, then one-way (manual changes don't sync back).
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<Range>(() => {
    const r = searchParams.get("range");
    return r === "24h" || r === "7d" || r === "30d" || r === "all" ? r : "all";
  });
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  return (
    <DashboardChrome
      activeNavId="token-savings"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      <OverviewSection
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
      <SavingsOptionsSection plan={plan} />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <PageTitle>Token Savings</PageTitle>
      <p className="type-copy-16 m-0 max-w-1/2 text-pretty text-muted-foreground tracking-snug">
        Cache, compress and deduplicate to spend less per request.
      </p>
    </div>
  );
}

/* ─── KPI rail ──────────────────────────────────────────────────────── */

type PresetRange = "all" | "24h" | "7d" | "30d";
type Range = PresetRange | "custom";
type CustomRange = { from: Date; to: Date };

const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
  { value: "all", label: "All" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

const RANGE_DELTA_NOTE: Record<Range, string> = {
  all: "All time",
  "24h": "vs prior day",
  "7d": "vs prior week",
  "30d": "vs prior month",
  custom: "vs prior range",
};

// Savings is a RATE, so it stays roughly stable across windows (it does not
// accumulate like a total). Each window shows a slightly different rate, and
// every tile's sparkline ENDS at its headline value so the trend reconciles.
// Total saved === caching + compression (rounded): all 0.15+13.7≈13.9,
// 7d 0.18+14.0≈14.2, 30d 0.14+13.4≈13.5, 24h 0.11+12.7≈12.8.
const KPI_COLORS = {
  total: "var(--color-chart-1)",
  caching: "var(--color-chart-3)",
  compression: "var(--color-chart-7)",
} as const;
type SavingsKpi = {
  title: string;
  value: string;
  colorVar: string;
  spark: number[];
};
const KPI_BY_RANGE: Record<PresetRange, SavingsKpi[]> = {
  // All time / 30d show the lifetime ramp: savings start near 0% and climb
  // steeply as the cache warms and compression heuristics learn the workload,
  // then begin to plateau near the steady-state rate (ease-out curve). The
  // shorter windows (24h / 7d) sit in the plateau, so they barely move.
  all: [
    {
      title: "Total saved",
      value: "13.9",
      colorVar: KPI_COLORS.total,
      spark: [0.4, 2.9, 6.4, 9.6, 11.9, 13.3, 13.9],
    },
    {
      title: "Caching",
      value: "0.15",
      colorVar: KPI_COLORS.caching,
      spark: [0.0, 0.02, 0.05, 0.09, 0.12, 0.14, 0.15],
    },
    {
      title: "Compression",
      value: "13.7",
      colorVar: KPI_COLORS.compression,
      spark: [0.4, 2.7, 6.1, 9.3, 11.7, 13.1, 13.7],
    },
  ],
  "24h": [
    {
      title: "Total saved",
      value: "12.8",
      colorVar: KPI_COLORS.total,
      spark: [12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.8],
    },
    {
      title: "Caching",
      value: "0.11",
      colorVar: KPI_COLORS.caching,
      spark: [0.09, 0.09, 0.1, 0.1, 0.11, 0.11, 0.11],
    },
    {
      title: "Compression",
      value: "12.7",
      colorVar: KPI_COLORS.compression,
      spark: [12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.7],
    },
  ],
  "7d": [
    {
      title: "Total saved",
      value: "14.2",
      colorVar: KPI_COLORS.total,
      spark: [12.4, 12.8, 13.2, 13.5, 13.8, 14.0, 14.2],
    },
    {
      title: "Caching",
      value: "0.18",
      colorVar: KPI_COLORS.caching,
      spark: [0.13, 0.14, 0.15, 0.16, 0.17, 0.17, 0.18],
    },
    {
      title: "Compression",
      value: "14.0",
      colorVar: KPI_COLORS.compression,
      spark: [12.3, 12.7, 13.1, 13.4, 13.7, 13.9, 14.0],
    },
  ],
  "30d": [
    {
      title: "Total saved",
      value: "13.5",
      colorVar: KPI_COLORS.total,
      spark: [0.5, 3.1, 6.7, 9.8, 12.0, 13.1, 13.5],
    },
    {
      title: "Caching",
      value: "0.14",
      colorVar: KPI_COLORS.caching,
      spark: [0.0, 0.02, 0.05, 0.08, 0.11, 0.13, 0.14],
    },
    {
      title: "Compression",
      value: "13.4",
      colorVar: KPI_COLORS.compression,
      spark: [0.5, 2.9, 6.3, 9.5, 11.7, 13.0, 13.4],
    },
  ],
};

// Delta = change across the displayed window (last point − first point), so the
// tag can never contradict the sparkline. Sub-1-point moves keep 2 decimals
// (caching), larger moves 1 decimal. Always a percentage-point delta.
function sparkDelta(spark: number[]): string {
  const d = spark[spark.length - 1] - spark[0];
  const decimals = Math.abs(d) < 1 ? 2 : 1;
  return `${d >= 0 ? "+" : "-"}${Math.abs(d).toFixed(decimals)}%`;
}

// Sparkline density + tooltip dates. The KPI sparklines are illustrative
// trends (authored as 7 points) with no real timestamps. We resample each onto
// a denser, range-appropriate set of stops (the line is linear, so this only
// adds hover points without changing its shape) and derive evenly-spaced bucket
// dates ending at the mock "today" — the values stay illustrative.
const SPARK_STOPS: Record<PresetRange, number> = {
  all: 7,
  "24h": 12, // one stop per 2-hour block
  "7d": 7, // one stop per day
  "30d": 14,
};
// Step per stop, in the range's native unit (hours for 24h, days otherwise).
const SPARK_STEP: Record<PresetRange, number> = {
  all: 1, // months
  "24h": 2, // hours
  "7d": 1, // days
  "30d": 2, // days
};
const SPARK_TODAY = new Date(2026, 5, 15, 12, 0, 0);

// Resample an authored trend onto `count` evenly-spaced stops via linear
// interpolation. Endpoints are preserved exactly; intermediate stops sit on the
// existing line segments, rounded to 2 decimals.
function resampleSpark(values: number[], count: number): number[] {
  if (count <= values.length) {
    return [...values];
  }
  const last = values.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const pos = (i / (count - 1)) * last;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, last);
    const v = values[lo] + (values[hi] - values[lo]) * (pos - lo);
    return Math.round(v * 100) / 100;
  });
}

function sparkDates(range: PresetRange, count: number): string[] {
  const step = SPARK_STEP[range];
  return Array.from({ length: count }, (_, i) => {
    const stepsBack = count - 1 - i;
    const d = new Date(SPARK_TODAY);
    if (range === "24h") {
      d.setHours(d.getHours() - stepsBack * step);
    } else if (range === "all") {
      d.setMonth(d.getMonth() - stepsBack * step);
    } else {
      d.setDate(d.getDate() - stepsBack * step);
    }
    return formatSparkLabel(d, range === "24h");
  });
}

function OverviewSection({
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
  const effectiveRange = range === "custom" ? "all" : range;
  const kpis = KPI_BY_RANGE[effectiveRange];
  const sparkStops = SPARK_STOPS[effectiveRange];
  const sparkLabels = sparkDates(effectiveRange, sparkStops);
  const note = RANGE_DELTA_NOTE[range];
  return (
    <div className="flex flex-col gap-4">
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
      <KpiRail columns={3}>
        {kpis.map((k) => (
          <KpiTile
            delta={sparkDelta(k.spark)}
            deltaNote={note}
            deltaRow
            key={k.title}
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

export function SavingsOptionsSection({ plan = "pro" }: { plan?: Plan } = {}) {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle>Savings options</SectionTitle>
      </div>
      <div className="flex flex-col gap-4">
        <CompressionCard plan={plan} />
        <CachingCard />
      </div>
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

function CachingCard() {
  const [enabled, setEnabled] = useState(true);
  const [ttl, setTtl] = useState("1h");

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
                  Identical concurrent requests are deduplicated automatically.
                </p>
              </div>
              <Switch
                aria-labelledby="caching-switch-label"
                checked={enabled}
                className="mt-1 shrink-0"
                onCheckedChange={(next) => {
                  setEnabled(next);
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
                onValueChange={(next) => {
                  setTtl(next);
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

// Free = the "safe lane": lightweight, content-agnostic clean-up.
const FREE_COMPRESSION_BENEFITS: CompressionBenefit[] = [
  {
    title: "Strips wrapper and clutter",
    description:
      "Editor and agent scaffolding (e.g. system reminders) that isn't part of the actual content.",
  },
  {
    title: "JSON tidy",
    description: "Removes pretty-print spacing from JSON payloads.",
  },
  {
    title: "Lossless clean-up",
    description:
      "Collapses whitespace, removes terminal color codes, de-duplicates repeated lines, strips invisible characters.",
  },
  {
    title: "Trims giant blobs",
    description: "Caps oversized pasted base64/hex and long lines.",
  },
];

// Pro = everything in Free, plus the heavy hitters that drive the real savings.
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

// Payoff-first hero: the savings figure is the point of the card, so it leads
// at the same 24px sans-tabular voice as the Overview rail (HeroNumeric),
// with the checklist beneath it as supporting proof.
function SavingsHeadline({
  value,
  caption,
  valueClassName,
}: {
  value: string;
  caption: string;
  valueClassName: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <HeroNumeric className={`leading-none ${valueClassName}`}>
        {value}
      </HeroNumeric>
      <p className="type-copy-14 m-0 text-muted-foreground">{caption}</p>
    </div>
  );
}

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
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0">
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
                      className="-m-1 inline-flex shrink-0 cursor-help rounded-sm p-1 text-neutral-400 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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

function CompressionCard({ plan }: { plan: Plan }) {
  const navigate = useNavigate();
  const isPro = plan === "pro";
  const [enabled, setEnabled] = useState(true);
  const [advancedEnabled, setAdvancedEnabled] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);

  // Free — neutral "safe lane" card. Only shown on the Free plan, where the
  // Advanced card sits beside it as an upsell.
  const basicCard = (
    <Card className="rounded-sm shadow-none">
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <SectionHeading as="h4" className="type-heading-16">
                  Basic compression
                </SectionHeading>
                <Badge variant="success">Free</Badge>
              </div>
              <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
                The safe lane — lightweight, content-agnostic clean-up.
              </p>
            </div>
            <Switch
              aria-label="Enable compression"
              checked={enabled}
              className="shrink-0"
              onCheckedChange={(next) => {
                setEnabled(next);
                toast(next ? "Compression enabled" : "Compression disabled");
              }}
              size="lg"
            />
          </div>
          <BenefitList
            benefits={FREE_COMPRESSION_BENEFITS}
            checkClassName="bg-muted text-muted-foreground"
            outlineClassName="border-border"
          />
        </div>
      </CardContent>
    </Card>
  );

  // Advanced card. On Free it's the blue upsell CTA; on Pro the user already
  // has it, so it drops the promotional blue chrome (neutral, like Basic) and
  // swaps the Upgrade CTA for an enable toggle — but keeps the blue Pro badge
  // and blue savings KPI to mark it as the Pro-tier capability.
  const advancedCard = (
    <Card
      className={
        isPro
          ? "rounded-sm shadow-none"
          : "rounded-sm border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25 shadow-none"
      }
    >
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <SectionHeading as="h4" className="type-heading-16">
                  Advanced compression
                </SectionHeading>
                <Badge variant="info">Pro</Badge>
              </div>
              <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
                All the lightweight Basic clean-up, plus the heavy hitters that
                drive the real savings.
              </p>
            </div>
            {isPro ? (
              <Switch
                aria-label="Enable advanced compression"
                checked={advancedEnabled}
                className="shrink-0"
                onCheckedChange={(next) => {
                  setAdvancedEnabled(next);
                  toast(
                    next
                      ? "Advanced compression enabled"
                      : "Advanced compression disabled"
                  );
                }}
                size="lg"
              />
            ) : (
              <Button
                className="shrink-0 bg-blue-700 text-white shadow-blue-700/30 shadow-sm hover:bg-blue-800"
                onClick={() => setCompareOpen(true)}
                size="sm"
                type="button"
              >
                <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
                <span>Upgrade to Pro</span>
              </Button>
            )}
          </div>
          {/* KPI headline is an upsell hook — only the Free (CTA) version shows
              it. On Pro the user already has the capability, so it's dropped. */}
          {isPro ? null : (
            <SavingsHeadline
              caption="smaller requests on average"
              value="~20%"
              valueClassName="text-foreground text-xl"
            />
          )}
          <BenefitList
            benefits={PRO_COMPRESSION_BENEFITS}
            // Soft blue checks on both plans: the card already wins the eye via
            // its gradient + CTA, so keeping checks light lets the saturated CTA
            // button stay the single loudest element instead of competing with
            // a mass of solid-blue dots.
            checkClassName="bg-blue-100 text-blue-700"
            outlineClassName={isPro ? "border-border" : "border-blue-200"}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardChromeHeader
          action={<StatusBadge on={isPro ? advancedEnabled : enabled} />}
          description="Shrink prompts before they reach the provider, without affecting the model's output."
          title="Compression"
        />
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3">
            {isPro ? null : basicCard}
            {advancedCard}
          </div>
        </CardContent>
      </Card>
      {isPro ? null : (
        <PlanComparisonDialog
          onOpenChange={setCompareOpen}
          onUpgrade={() => navigate("/billing")}
          open={compareOpen}
        />
      )}
    </>
  );
}
