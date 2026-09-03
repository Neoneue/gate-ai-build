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
import { cn } from "@/lib/utils";
import { PlanComparisonDialog } from "@/pages/plan-comparison-dialog";
import {
  type CustomRange,
  KPI_BY_RANGE,
  type PresetRange,
  RANGE_DELTA_NOTE,
  RANGE_OPTIONS,
  type Range,
  resampleSpark,
  SPARK_STOPS,
  sparkDates,
  sparkDelta,
} from "@/pages/token-savings-data";

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
      {/* Content stays fluid, then caps so the cards don't stretch across
          ultrawide displays. CONTAINER query, not viewport: the Ask AI
          panel narrows this column without narrowing the window. `@5xl`
          (1024px inline-size) is the same number as the `max-w-5xl` cap, so
          the class is a no-op until the column is wide enough to bind. */}
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
        />
        <SavingsOptionsSection plan={plan} />
      </div>
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <PageTitle>Token savings</PageTitle>
      <p className="type-copy-16 m-0 @4xl:max-w-1/2 max-w-full text-pretty text-muted-foreground tracking-snug">
        Cache, compress and deduplicate to spend less per request.
      </p>
    </div>
  );
}

/* ─── KPI rail ──────────────────────────────────────────────────────── */

export function OverviewSection({
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
                  Identical concurrent messages are deduplicated automatically.
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
          : "rounded-sm border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25 shadow-none dark:border-blue-400/30 dark:from-blue-500/10 dark:to-blue-500/5"
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
                className="shrink-0"
                onClick={() => setCompareOpen(true)}
                size="sm"
                type="button"
                variant="promo"
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
              caption="smaller messages on average"
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
            checkClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
            outlineClassName={
              isPro
                ? "border-border"
                : "border-blue-200 dark:border-blue-400/30"
            }
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
