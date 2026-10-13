import { Check, Info } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
  useLocation,
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
import { formatChartTooltipDate, formatDate } from "@/lib/formatters";
import { keepInOnboarding } from "@/lib/plan";
import { cn } from "@/lib/utils";
import {
  type SetupMessage,
  type SetupTraffic,
  setupCompression,
} from "@/pages/onboarding/onboarding-setup-traffic";
import { useSetupTraffic } from "@/pages/onboarding/use-setup-traffic";
import { PlanComparisonDialog } from "@/pages/plan-comparison-dialog";
import { TokenSavingsDefault } from "@/pages/TokenSavingsDefault";
import { SummaryCard } from "@/pages/token-savings/SummaryCard";
import {
  type CustomRange,
  KPI_BY_RANGE,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
  SPARK_STOPS,
} from "@/pages/token-savings-data";
import {
  allocateTenths,
  LOW_VOLUME_REQUESTS,
  type SummaryMechanism,
  type SummaryModel,
} from "@/pages/token-savings-summary";

/* ─── OnboardingTokenSavings ────────────────────────────────────────────────
 * `/token-savings-onboarding`: the desktop onboarding workspace's Token
 * savings (owner 2026-10-13).
 *
 * Before step 3's first message (`useSetupTraffic()` null):
 * `TokenSavingsDefault`, unchanged. Then the messages land one at a time
 * (the test message, then the demo); the numbers below are at 2.
 *
 * After it: a copy of the FREE page (`TokenSavingsFree` -> `TokenSavings.tsx`
 * with `plan="free"`; the Pro variant is not copied, a new workspace is Free)
 * fed by exactly the step 3 messages, so the rail never shows the
 * Default's blank cards once traffic exists:
 *   - Overview rail: Total saved, Caching, Compression over the selected
 *     window. Compression is `setupCompression` (2 of 2,366 input tokens,
 *     "0.1"); Caching is 0.00: neither message was answered from Gate's
 *     cache. Total saved = Caching + Compression, as on the Pro rail. Each
 *     spark is the rate per bucket, Pro's bucket geometry (SPARK_STOPS)
 *     anchored on the newest message's real send time, not the demo clock.
 *     No delta tag: there is no prior period to compare (the phone
 *     Activity's precedent).
 *   - Summary: the real `SummaryCard`, fed a model built from the same
 *     messages: 2 tokens removed of 2,366, 0 cache hits of 2 requests,
 *     Compression 100.0% of what Gate saved. Under LOW_VOLUME_REQUESTS, so
 *     the card's own low-volume note shows. A custom window with no
 *     message shows the card's own no-traffic state.
 *   - Savings options: the Free cards verbatim (Basic beside the Advanced
 *     upsell); Upgrade opens the plan comparison and its Upgrade stays in
 *     onboarding (`keepInOnboarding(pathname, "/billing")`).
 * Range state is LOCAL (Pro's `?range=` read once, never the range store).
 * ───────────────────────────────────────────────────────────────────────── */

export function OnboardingTokenSavings() {
  const traffic = useSetupTraffic();
  return traffic ? (
    <TokenSavingsAfterSetup traffic={traffic} />
  ) : (
    <TokenSavingsDefault />
  );
}

/** The savings switches on the Savings options cards (TokenSavings.tsx). */
type SavingsSwitches = { compression: boolean; caching: boolean };

function TokenSavingsAfterSetup({ traffic }: { traffic: SetupTraffic }) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  // Pro's landing state: All, with `?range=` read once for deep-links.
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<Range>(() => {
    const r = searchParams.get("range");
    return r === "24h" || r === "7d" || r === "30d" || r === "all" ? r : "all";
  });
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const summary = useMemo(
    () => setupSummary(traffic, range, customRange),
    [traffic, range, customRange]
  );
  return (
    <DashboardChrome
      activeNavId="token-savings"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* TokenSavings.tsx's column: fluid, capped at `@5xl` (1024px). */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
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
          traffic={traffic}
        />
        <SummaryCard model={summary} />
        <SavingsOptionsSection />
      </div>
    </DashboardChrome>
  );
}

/* ─── Page header (TokenSavings.tsx, verbatim) ──────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <PageTitle>Token savings</PageTitle>
      <p className="type-copy-16 m-0 @4xl:max-w-1/2 max-w-full text-pretty text-muted-foreground">
        Cache, compress and deduplicate to spend less per request.
      </p>
    </div>
  );
}

/* ─── The two messages, as savings rates ────────────────────────────────── */

/** The rates the rail prints for a set of messages: Compression is
 *  `setupCompression` (one decimal), Caching the share of requests Gate's
 *  cache answered (two decimals, the Pro tile's precision; none were), and
 *  Total saved their sum, as the Pro rail adds them. */
type SetupRates = {
  total: number;
  caching: number;
  compression: number;
  savedTokens: number;
  inTokens: number;
  cacheHits: number;
};

function ratesOf(
  traffic: SetupTraffic,
  messages: readonly SetupMessage[]
): SetupRates {
  const { savedTokens, inTokens, percent } = setupCompression({
    ...traffic,
    messages,
  });
  const compression = Number.parseFloat(percent);
  // Neither step 3 message was served from Gate's cache: both reached the
  // guardrail and the provider path, so the cache answered 0 requests.
  const cacheHits = 0;
  const caching =
    messages.length === 0
      ? 0
      : Number(((cacheHits / messages.length) * 100).toFixed(2));
  return {
    total: Number((compression + caching).toFixed(1)),
    caching,
    compression,
    savedTokens,
    inTokens,
    cacheHits,
  };
}

/* ─── Buckets: Pro's spark geometry, anchored on the newest send ────────── */

/** Step per stop, in the range's native unit (token-savings-data.ts
 *  SPARK_STEP): months on All, hours on 24H, days otherwise. */
const SPARK_STEP: Record<PresetRange, number> = {
  all: 1,
  "24h": 2,
  "7d": 1,
  "30d": 2,
};

type SparkBucket = { start: number; end: number; label: string };

function stepBack(anchor: Date, range: PresetRange, steps: number): Date {
  const d = new Date(anchor);
  const amount = steps * SPARK_STEP[range];
  if (range === "24h") {
    d.setHours(d.getHours() - amount);
  } else if (range === "all") {
    d.setMonth(d.getMonth() - amount);
  } else {
    d.setDate(d.getDate() - amount);
  }
  return d;
}

/** SPARK_STOPS[range] buckets ending at the newest message: bucket i holds a
 *  send after the previous bucket's end, up to and including its own. The
 *  tooltip date is `sparkDates`' shape (`formatChartTooltipDate`). */
function sparkBuckets(range: PresetRange, anchor: Date): SparkBucket[] {
  const count = SPARK_STOPS[range];
  const ends = Array.from({ length: count }, (_, i) =>
    stepBack(anchor, range, count - 1 - i)
  );
  const span = {
    start: ends[0] ?? anchor,
    end: ends.at(-1) ?? anchor,
  };
  return ends.map((end, i) => ({
    start: (ends[i - 1] ?? stepBack(end, range, 1)).getTime(),
    end: end.getTime(),
    label: formatChartTooltipDate(end, range === "24h" ? "hour" : "day", span),
  }));
}

const inBucket = (bucket: SparkBucket, m: SetupMessage) =>
  m.sentAt.getTime() > bucket.start && m.sentAt.getTime() <= bucket.end;

/* ─── KPI rail ──────────────────────────────────────────────────────────── */

function OverviewSection({
  traffic,
  range,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: {
  traffic: SetupTraffic;
  range: Range;
  customRange: CustomRange | null;
  onRangeChange: (r: PresetRange) => void;
  onCustomRangeChange: (r: CustomRange | null) => void;
}) {
  // Pro: a custom range reads the lifetime tiles (TokenSavings.tsx :145).
  const effectiveRange: PresetRange = range === "custom" ? "all" : range;
  const anchor = traffic.messages[0]?.sentAt ?? null;
  const rail = useMemo(() => {
    if (!anchor) {
      return null;
    }
    const buckets = sparkBuckets(effectiveRange, anchor);
    // All is the workspace's lifetime: every message. A shorter window holds
    // the sends its buckets cover.
    const first = buckets[0];
    const messages =
      effectiveRange === "all" || !first
        ? traffic.messages
        : traffic.messages.filter(
            (m) => m.sentAt.getTime() > first.start && m.sentAt <= anchor
          );
    const perBucket = buckets.map((bucket) =>
      ratesOf(
        traffic,
        traffic.messages.filter((m) => inBucket(bucket, m))
      )
    );
    return {
      rates: ratesOf(traffic, messages),
      labels: buckets.map((b) => b.label),
      perBucket,
    };
  }, [anchor, effectiveRange, traffic]);

  // Titles and chart colours from the Pro rail's own rows, so the copy and
  // the series colours have one home (token-savings-data.ts).
  const [totalKpi, cachingKpi, compressionKpi] = KPI_BY_RANGE.all;
  const tiles = rail
    ? [
        {
          kpi: totalKpi,
          value: rail.rates.total.toFixed(1),
          spark: rail.perBucket.map((r) => r.total),
        },
        {
          kpi: cachingKpi,
          value: rail.rates.caching.toFixed(2),
          spark: rail.perBucket.map((r) => r.caching),
        },
        {
          kpi: compressionKpi,
          value: rail.rates.compression.toFixed(1),
          spark: rail.perBucket.map((r) => r.compression),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle as="h2">Overview</SectionTitle>
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
        {tiles.map(({ kpi, value, spark }) =>
          kpi ? (
            <KpiTile
              deltaRow
              key={kpi.title}
              spark={
                <CompactSpark
                  colorVar={kpi.colorVar}
                  data={spark}
                  labels={rail?.labels}
                  tooltip
                  valueFormatter={(v) => `${v}%`}
                />
              }
              title={kpi.title}
              value={value}
              valueSuffix="%"
            />
          ) : null
        )}
      </KpiRail>
    </div>
  );
}

/* ─── Summary model over the two messages ───────────────────────────────── */

/** Data-bar fills (token-savings-summary.ts MECHANISM_FILL, verbatim). */
const MECHANISM_FILL = {
  compression: "bg-gradient-to-r from-chart-7 to-chart-7-soft",
  cache: "bg-gradient-to-r from-chart-3 to-chart-3-soft",
} as const;

const tenthsLabel = (tenths: number) => `${(tenths / 10).toFixed(1)}%`;

/** The window the Summary reports, anchored on the newest send: 24H, 7D and
 *  30D count back from it, All starts at the first message, Custom is the
 *  picked span. */
function summaryWindow(
  traffic: SetupTraffic,
  range: Range,
  customRange: CustomRange | null
): { from: Date; to: Date } {
  const newest = traffic.messages[0]?.sentAt ?? new Date();
  const oldest = traffic.messages.at(-1)?.sentAt ?? newest;
  if (range === "custom" && customRange) {
    return { from: customRange.from, to: customRange.to };
  }
  if (range === "all" || range === "custom") {
    return { from: oldest, to: newest };
  }
  const days = range === "24h" ? 1 : range === "7d" ? 7 : 30;
  const from = new Date(newest);
  if (range === "24h") {
    from.setHours(from.getHours() - 24);
  } else {
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);
  }
  return { from, to: newest };
}

/** `periodCopy` (token-savings-summary.ts), verbatim over this window. */
function periodCopy(
  range: Range,
  w: { from: Date; to: Date }
): { label: string; phrase: string } {
  const span = `${formatDate(w.from, { month: "short", day: "numeric" })} to ${formatDate(w.to)}`;
  if (range === "all") {
    return { label: "All time", phrase: "Over this period" };
  }
  if (range === "24h") {
    return {
      label: `Last 24 hours, ${formatDate(w.to)}`,
      phrase: "In the last 24 hours",
    };
  }
  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    return {
      label: `Last ${days} days, ${span}`,
      phrase: `In the last ${days} days`,
    };
  }
  return {
    label: span,
    phrase: `Between ${formatDate(w.from, { month: "short", day: "numeric" })} and ${formatDate(w.to)}`,
  };
}

/** The Summary card's model (the shape `summaryFor` returns) built from the
 *  messages in the window, so the card and the rail read one source. */
function setupSummary(
  traffic: SetupTraffic,
  range: Range,
  customRange: CustomRange | null
): SummaryModel {
  const w = summaryWindow(traffic, range, customRange);
  const messages = traffic.messages.filter(
    (m) =>
      m.sentAt.getTime() >= w.from.getTime() &&
      m.sentAt.getTime() <= w.to.getTime()
  );
  const rates = ratesOf(traffic, messages);
  const { label: periodLabel, phrase: periodPhrase } = periodCopy(range, w);
  const requests = messages.length;
  const noTraffic = requests === 0;

  // Level one only: under LOW_VOLUME_REQUESTS the card shows the two
  // mechanism bars and no per-pass split. Shares in tenths so the printed
  // one-decimal shares sum to 100.0.
  const totalPoints = rates.compression + rates.caching;
  const [compressionTenths = 0, cacheTenths = 0] =
    totalPoints > 0
      ? allocateTenths(1000, [
          rates.compression / totalPoints,
          rates.caching / totalPoints,
        ])
      : [0, 0];
  const compression: SummaryMechanism = {
    id: "compression",
    label: "Compression",
    share: compressionTenths / 10,
    shareLabel: tenthsLabel(compressionTenths),
    tokens: rates.savedTokens,
    fill: MECHANISM_FILL.compression,
    passes: [],
  };
  const cache: SummaryMechanism = {
    id: "cache",
    label: "Caching",
    share: cacheTenths / 10,
    shareLabel: tenthsLabel(cacheTenths),
    tokens: 0,
    fill: MECHANISM_FILL.cache,
    passes: [],
  };

  return {
    plan: "free",
    window: {
      from: w.from,
      to: w.to,
      scale: noTraffic ? 0 : 1,
      clamped: false,
      empty: noTraffic,
      rateRange: range === "custom" ? "all" : range,
    },
    periodLabel,
    periodPhrase,
    noTraffic,
    lowVolume: !noTraffic && requests < LOW_VOLUME_REQUESTS,
    requests,
    inputTokensSent: rates.inTokens,
    inputTokensRemoved: rates.savedTokens,
    cacheAnswered: rates.cacheHits,
    compressionRateLabel: `${rates.compression.toFixed(1)}%`,
    cachingRateLabel: `${rates.caching.toFixed(2)}%`,
    mechanisms: [compression, cache].sort((a, b) => b.share - a.share),
  };
}

/* ─── Savings options (TokenSavings.tsx, the Free plan's cards) ─────────── */

function SavingsOptionsSection() {
  const [value, setValue] = useState<SavingsSwitches>({
    compression: true,
    caching: true,
  });
  const update = (patch: Partial<SavingsSwitches>) => {
    setValue((prev) => ({ ...prev, ...patch }));
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle as="h2">Savings options</SectionTitle>
      </div>
      <div className="flex flex-col gap-4">
        <CompressionCard
          enabled={value.compression}
          onEnabledChange={(compression) => update({ compression })}
        />
        <CachingCard
          enabled={value.caching}
          onEnabledChange={(caching) => update({ caching })}
        />
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
  /** Control flush right with the title: the card's status badge. */
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
  enabled,
  onEnabledChange,
}: {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
}) {
  const [ttl, setTtl] = useState("1h");

  return (
    <Card>
      <CardChromeHeader
        action={<StatusBadge on={enabled} />}
        description="Reuse identical responses."
        title="Caching"
      />
      <CardContent className="flex flex-col gap-3">
        <Card variant="inset">
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
                className="shrink-0"
                onCheckedChange={(next) => {
                  onEnabledChange(next);
                  toast(next ? "Caching enabled" : "Caching disabled");
                }}
                size="lg"
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="inset">
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

// The Advanced upsell's figure, as the Free page prints it (TokenSavings.tsx
// COMPRESSION_RATE_ALL): what Advanced compression does, not this workspace.
const COMPRESSION_RATE_ALL =
  KPI_BY_RANGE.all.find((kpi) => kpi.title === "Compression")?.value ?? "0";

function SavingsHeadline({
  value,
  caption,
}: {
  value: string;
  caption: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <HeroNumeric>{value}</HeroNumeric>
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
  /** Border color for the outline card wrapping the list. */
  outlineClassName: string;
}) {
  return (
    // Third frame in the radius ladder: outer Card > option card
    // (rounded-sm) > this list (rounded-xs), one step per level.
    <div className={cn("rounded-xs border bg-card/40 p-4", outlineClassName)}>
      <ul className="m-0 grid list-none @lg:grid-cols-2 grid-cols-1 gap-4 p-0">
        {benefits.map((benefit) => (
          <li className="flex items-center gap-2" key={benefit.title}>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
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
                      className="-m-1 inline-flex shrink-0 cursor-help rounded-sm p-1 text-muted-foreground hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      // biome-ignore lint/a11y/noNoninteractiveTabindex: the tooltip trigger must be focusable or its explanation is keyboard-unreachable (WCAG 2.1.1)
                      tabIndex={0}
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

/** The Free plan's Compression card: Basic (on) beside the Advanced upsell. */
function CompressionCard({
  enabled,
  onEnabledChange,
}: {
  /** The Basic compression switch. */
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <>
      <Card>
        <CardChromeHeader
          action={<StatusBadge on={enabled} />}
          description="Shrink prompts before they reach the provider, without affecting the model's output."
          title="Compression"
        />
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3">
            <Card className="rounded-sm" variant="inset">
              <CardContent className="flex flex-1 flex-col">
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <SectionHeading as="h4">
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
                        onEnabledChange(next);
                        toast(
                          next ? "Compression enabled" : "Compression disabled"
                        );
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
            {/* The Advanced upsell: the blue Pro chrome, the promo CTA and
                the savings headline, as the Free page shows them. */}
            <Card
              className="rounded-sm border-tier-pro-border bg-[image:var(--tier-pro-surface-wash)]"
              variant="inset"
            >
              <CardContent className="flex flex-1 flex-col">
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <SectionHeading as="h4">
                          Advanced compression
                        </SectionHeading>
                        <Badge variant="info">Pro</Badge>
                      </div>
                      <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
                        All the lightweight Basic clean-up, plus the heavy
                        hitters that drive the real savings.
                      </p>
                    </div>
                    <Button
                      className="shrink-0"
                      onClick={() => setCompareOpen(true)}
                      size="sm"
                      type="button"
                      variant="promo"
                    >
                      <SparklesIcon
                        aria-hidden
                        data-icon="inline-start"
                        size={16}
                      />
                      <span>Upgrade to Pro</span>
                    </Button>
                  </div>
                  <SavingsHeadline
                    caption="smaller messages on average"
                    value={`${COMPRESSION_RATE_ALL}%`}
                  />
                  <BenefitList
                    benefits={PRO_COMPRESSION_BENEFITS}
                    checkClassName="bg-tier-pro-wash text-tier-pro-foreground"
                    outlineClassName="border-tier-pro-border"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      <PlanComparisonDialog
        onOpenChange={setCompareOpen}
        onUpgrade={() => navigate(keepInOnboarding(pathname, "/billing"))}
        open={compareOpen}
      />
    </>
  );
}
