import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Info, Key, Search } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
import { KpiRail as KpiRailShell } from '@/components/ui/kpi-rail';
import { PageTitle } from '@/components/ui/page-title';
import { SegmentedPill } from '@/components/ui/segmented-pill';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  VendorAvatar,
  type Vendor,
} from '@/components/icons/vendor-meta';
import { CHART_PALETTE } from '@/lib/chart-palette';
import { DashboardChrome } from '@/layouts/DashboardChrome';

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-019 — Activity (workspace usage analytics)
 *
 * Built to the Observability PRD's Activity spec (O6, §Activity) and the
 * mockup shared 2026-05-11:
 *   • Header: title + subtitle on left, range pill (24h / 7d / 30d / 90d)
 *     on the right. Custom is intentionally cut — see Open Question below.
 *   • KPI rail: Spend / Requests / Tokens (3-up). PRD calls for 5 cards
 *     (adding Active keys + Active models); the mockup elides both. Active
 *     models is implicit in the spend chart's stacked legend; key sprawl is
 *     surfaced in the Usage-by-key panel instead.
 *   • Spend chart: stacked by Model / Provider / API key (toggle). Compressed
 *     vs prior iteration so it reads as transitional rather than dominant.
 *   • Three Top-by-axis cards: Top spend / Top request / Top token models.
 *     Axis is the card identity — no sort dropdown.
 *   • Usage-by-key panel: per-key spend-share bars across all workspace keys.
 *
 * Open Question (Activity range — Custom): PRD §Activity lists "Custom" as
 * a fifth preset. Cut from this surface pending a real date-range popover.
 * Spec gap acknowledged; do not re-add as a non-functional segment.
 *
 * AG-44 resolved: no exports section on Activity. Raw-data export of audit
 * events is covered by Audit Trail PRD R12.
 * ───────────────────────────────────────────────────────────────────────── */

type PresetRange = 'all' | '24h' | '7d' | '30d';
type Range = PresetRange | 'custom';
type CustomRange = { from: Date; to: Date };

const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '24h', label: '24H' },
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
];

/** Multiplier applied to base (7d) values to fabricate plausible per-range
 *  totals on this static artboard. Real implementation would aggregate from
 *  the gateway event stream per the PRD acceptance criterion (chart-by-key
 *  total === per-key-table total for the same range). `all` is the lifetime
 *  cumulative window — ~60 days of history for this mock workspace, so it
 *  sits above 30d (8.5 ≈ 60/7 weeks, keeping the 7d day-rate consistent). */
const RANGE_SCALE: Record<PresetRange, number> = {
  '24h': 0.16,
  '7d':  1,
  '30d': 4.2,
  all:   8.5,
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function daysInRange(r: CustomRange): number {
  return Math.max(1, Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000) + 1);
}

function effectiveScale(range: Range, customRange: CustomRange | null): number {
  if (range === 'custom' && customRange) return daysInRange(customRange) / 7;
  return RANGE_SCALE[range === 'custom' ? '7d' : range];
}

export function Activity() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  // Defaults to `all` on load — the intended landing state for every page's
  // range selector.
  const [range, setRange] = useState<Range>('all');
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  return (
    <DashboardChrome
            breadcrumbCurrent="Usage analytics"
            activeNavId="activity"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <PageHeader
              range={range}
              customRange={customRange}
              onRangeChange={(r) => { setRange(r); setCustomRange(null); }}
              onCustomRangeChange={(r) => {
                if (r) { setCustomRange(r); setRange('custom'); }
                else   { setCustomRange(null); setRange('all'); }
              }}
            />
            <KpiRail range={range} customRange={customRange} />
            <SpendTrendCard range={range} customRange={customRange} />
            <TopByAxisRow range={range} customRange={customRange} />
            <UsageByKey range={range} customRange={customRange} />
          </DashboardChrome>
  );
}

/* ─── Page header — title + subtitle on left, range pill on right ───────── */

function PageHeader({
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
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Activity</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Cost, requests, and tokens across the workspace.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <SegmentedPill
          options={RANGE_OPTIONS}
          value={range === 'custom' ? '' : range}
          onValueChange={(v) => onRangeChange(v as PresetRange)}
        />
        <DateRangePicker
          value={customRange}
          onChange={onCustomRangeChange}
          size="default"
        />
      </div>
    </div>
  );
}

/* ─── KPI rail (3-up, range-aware) ──────────────────────────────────────── */

type KpiSpec = {
  value: string;
  delta: string;
  spark: number[];
};

// Note: `.spend.value` strings here are informational only — actual spend
// KPI is computed in getKpiSpec from TOTAL_7D_BASE_DOLLARS × effectiveScale,
// so it cannot drift from the Spend over time chart. Kept in sync with the
// computed value for readability if someone reads the source.
const KPI_DATA: Record<PresetRange, { spend: KpiSpec; requests: KpiSpec; tokens: KpiSpec }> = {
  all: {
    spend:    { value: '$7,879.50', delta: '+24.8%', spark: [14, 16, 20, 24, 28, 30, 36, 34, 40] },
    requests: { value: '542,241',   delta: '+19.3%', spark: [12, 16, 20, 24, 26, 30, 34, 34, 38] },
    tokens:   { value: '208.3 M',   delta: '+17.6%', spark: [16, 18, 20, 24, 26, 28, 30, 32, 36] },
  },
  '24h': {
    spend:    { value: '$148.32',   delta: '+4.1%',  spark: [6, 8, 7, 10, 9, 11, 13, 12, 14] },
    requests: { value: '10,207',    delta: '+2.6%',  spark: [5, 6, 6, 8, 9, 8, 10, 11, 12] },
    tokens:   { value: '3.92 M',    delta: '+3.2%',  spark: [7, 8, 9, 9, 10, 11, 11, 12, 12] },
  },
  '7d': {
    spend:    { value: '$927.00',   delta: '+12.6%', spark: [8, 10, 12, 16, 18, 20, 25, 22, 24] },
    requests: { value: '63,793',    delta: '+8.2%',  spark: [6, 12, 10, 16, 20, 18, 26, 24, 28] },
    tokens:   { value: '24.5 M',    delta: '+8.7%',  spark: [10, 11, 13, 14, 16, 15, 17, 18, 18] },
  },
  '30d': {
    spend:    { value: '$3,893.40', delta: '+18.4%', spark: [12, 14, 18, 22, 24, 28, 32, 30, 34] },
    requests: { value: '267,931',   delta: '+14.7%', spark: [10, 14, 18, 22, 24, 26, 30, 30, 34] },
    tokens:   { value: '102.9 M',   delta: '+13.2%', spark: [14, 16, 18, 20, 22, 22, 24, 26, 28] },
  },
};

// Canonical 7d totals — single source of truth for each KPI. Every range's
// value AND sparkline shape are computed from these × effectiveScale, so
// the KPIs reconcile with the underlying data and the spark shapes reflect
// real per-bucket variation rather than hand-drawn arrays.
const TOTAL_7D_BASE_DOLLARS = 927;
const TOTAL_7D_BASE_REQUESTS = 63_793;
const TOTAL_7D_BASE_TOKENS = 24_500_000;

/** KPI spec for the active range. All three metrics computed: value from
 *  the canonical 7d base × scale; sparkline by distributing that scaled
 *  total across the range's bucket count via distributeSeries — same
 *  generator the Spend over time chart uses, so spark shapes track real
 *  per-bucket variation (upward trend + ±10% jitter, deterministic). */
function getKpiSpec(range: Range, customRange: CustomRange | null) {
  const scale = effectiveScale(range, customRange);
  const count = getBucketCount(range, customRange);
  const spendDollars = TOTAL_7D_BASE_DOLLARS * scale;
  const requestsCount = TOTAL_7D_BASE_REQUESTS * scale;
  const tokensCount = TOTAL_7D_BASE_TOKENS * scale;

  // Each metric gets its own seed so adjacent sparklines in the rail
  // don't share the same jitter pattern. Range-aware seed so ranges with
  // matching bucket counts don't produce identical shapes at different scales.
  const rangeSeed =
    range === 'all' ? 11 :
    range === '24h' ? 47 :
    range === '7d'  ? 77 :
    range === '30d' ? 303 :
    99;
  const spendSpark    = distributeSeries(spendDollars,  count, rangeSeed * 31 + 1);
  const requestsSpark = distributeSeries(requestsCount, count, rangeSeed * 31 + 2);
  const tokensSpark   = distributeSeries(tokensCount,   count, rangeSeed * 31 + 3);

  const base = KPI_DATA[range === 'custom' ? '7d' : range];
  return {
    spend:    { value: fmtUsd(spendDollars),                  delta: base.spend.delta,    spark: spendSpark    },
    requests: { value: fmtInt(Math.round(requestsCount)),     delta: base.requests.delta, spark: requestsSpark },
    tokens:   { value: fmtTokens(Math.round(tokensCount)),    delta: base.tokens.delta,   spark: tokensSpark   },
  };
}

// Title suffix + delta trailing copy tied to the active range. Mirrors
// the Requests hero pattern (eyebrow "X / 24H", delta note "vs prior day").
const RANGE_TITLE_SUFFIX: Record<Range, string> = {
  all:      'all',
  '24h':    '24h',
  '7d':     '7d',
  '30d':    '30d',
  custom:   'custom',
};
const RANGE_DELTA_NOTE: Record<Range, string> = {
  all:      'all time',
  '24h':    'vs prior day',
  '7d':     'vs prior week',
  '30d':    'vs prior month',
  custom:   'vs prior range',
};

function KpiRail({ range, customRange }: { range: Range; customRange: CustomRange | null }) {
  const k = getKpiSpec(range, customRange);
  const suffix = RANGE_TITLE_SUFFIX[range];
  const note = RANGE_DELTA_NOTE[range];
  return (
    <KpiRailShell columns={3}>
      <CompactKpi
        flat
        title={`Total Spend / ${suffix}`}
        value={k.spend.value}
        delta={k.spend.delta}
        deltaNote={note}
        spark={<CompactSpark colorVar="var(--color-chart-1)" data={k.spend.spark} />}
      />
      <CompactKpi
        flat
        title={`Total Requests / ${suffix}`}
        value={k.requests.value}
        delta={k.requests.delta}
        deltaNote={note}
        spark={<CompactSpark colorVar="var(--color-ink-500)" data={k.requests.spark} />}
      />
      <CompactKpi
        flat
        title={`Tokens Used / ${suffix}`}
        value={k.tokens.value}
        delta={k.tokens.delta}
        deltaNote={note}
        spark={<CompactSpark colorVar="var(--color-chart-3)" data={k.tokens.spark} />}
      />
    </KpiRailShell>
  );
}

/* ─── Spend trend — stacked bars, Model / Provider / API key toggle ─────── */

type Dimension = 'model' | 'provider' | 'apiKey';

const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: 'model',    label: 'Model' },
  { value: 'provider', label: 'Provider' },
  { value: 'apiKey',   label: 'API key' },
];

/** ≤6 series per dimension. Model + provider stay fully enumerated (bounded
 *  cardinality in MVP). API keys fall back to "top 5 + Other" since key
 *  cardinality is unbounded — a 100-key workspace can't be honestly stacked.
 *
 *  `color` overrides the palette slot — Other recedes to ink-300 so the
 *  named series carry the visual weight. */
const SPEND_SERIES: Record<Dimension, readonly { key: string; label: string; slot: number; color?: string }[]> = {
  model: [
    { key: 'sonnet', label: 'Claude Sonnet 4.5', slot: 2 },
    { key: 'gpt',    label: 'GPT-5.1',           slot: 1 },
    { key: 'gemini', label: 'Gemini 3 Pro',      slot: 4 },
    { key: 'opus',   label: 'Claude Opus 4.7',   slot: 7 },
    { key: 'llama',  label: 'Llama 4.2 405B',    slot: 6 },
    { key: 'haiku',  label: 'Claude Haiku',      slot: 3 },
  ],
  provider: [
    { key: 'anthropic',  label: 'Anthropic',  slot: 2 },
    { key: 'openai',     label: 'OpenAI',     slot: 1 },
    { key: 'google',     label: 'Google',     slot: 4 },
    { key: 'bedrock',    label: 'Bedrock',    slot: 7 },
    { key: 'openrouter', label: 'OpenRouter', slot: 6 },
  ],
  apiKey: [
    { key: 'prod-agent',  label: 'prod-agent',  slot: 1 },
    { key: 'prod-web',    label: 'prod-web',    slot: 2 },
    { key: 'staging-web', label: 'staging-web', slot: 3 },
    { key: 'atlas-eval',  label: 'atlas-eval',  slot: 4 },
    { key: 'dev',         label: 'dev',         slot: 5 },
    { key: 'ci-runner',   label: 'ci-runner',   slot: 6 },
  ],
};

/** Base (7d) chart data. Other ranges derive from this by scaling values and
 *  relabeling the x-axis. Mock-realistic, not aggregated.
 *
 *  INVARIANT: every dimension's 7d row sums equal $927 — this is the
 *  canonical workspace 7d spend. The Total Spend KPI is computed from this
 *  base × the active range's effectiveScale, so chart and KPI cannot drift.
 *  If you change any row, verify the per-dimension total still equals 927. */
const SPEND_BASE: Record<Dimension, Array<Record<string, number>>> = {
  // PAYG-only — BYOK spend isn't tracked. Per-dimension 7d sums all equal
  // $927 so toggling Model / Provider / API key keeps the same workspace
  // total (and that total = the Total Spend KPI by construction).
  model: [
    { sonnet: 26, gpt: 20, gemini: 13, opus: 34, llama:  9, haiku: 6 },
    { sonnet: 28, gpt: 21, gemini: 14, opus: 38, llama: 10, haiku: 6 },
    { sonnet: 30, gpt: 22, gemini: 15, opus: 41, llama: 10, haiku: 7 },
    { sonnet: 32, gpt: 23, gemini: 16, opus: 44, llama: 11, haiku: 7 },
    { sonnet: 34, gpt: 24, gemini: 17, opus: 47, llama: 11, haiku: 7 },
    { sonnet: 35, gpt: 26, gemini: 17, opus: 51, llama: 11, haiku: 8 },
    { sonnet: 37, gpt: 26, gemini: 18, opus: 55, llama: 12, haiku: 8 },
  ],
  provider: [
    { anthropic: 50, openai: 19, google: 12, bedrock: 10, openrouter:  6 },
    { anthropic: 58, openai: 21, google: 14, bedrock: 11, openrouter:  7 },
    { anthropic: 62, openai: 23, google: 13, bedrock: 13, openrouter:  8 },
    { anthropic: 67, openai: 23, google: 16, bedrock: 14, openrouter: 10 },
    { anthropic: 73, openai: 26, google: 18, bedrock: 16, openrouter: 12 },
    { anthropic: 79, openai: 28, google: 19, bedrock: 18, openrouter: 13 },
    { anthropic: 83, openai: 29, google: 21, bedrock: 19, openrouter: 16 },
  ],
  // Per-key 7d sums match the PAYG rows in API_KEY_ROWS:
  //   prod-agent 410, prod-web 385, staging-web 58, atlas-eval 42,
  //   dev 23, ci-runner 9. Total ≈ $927.
  apiKey: [
    { 'prod-agent': 46, 'prod-web': 44, 'staging-web':  7, 'atlas-eval': 5, dev: 3, 'ci-runner': 1 },
    { 'prod-agent': 53, 'prod-web': 49, 'staging-web':  7, 'atlas-eval': 5, dev: 3, 'ci-runner': 1 },
    { 'prod-agent': 56, 'prod-web': 53, 'staging-web':  8, 'atlas-eval': 6, dev: 3, 'ci-runner': 1 },
    { 'prod-agent': 58, 'prod-web': 55, 'staging-web':  8, 'atlas-eval': 6, dev: 3, 'ci-runner': 1 },
    { 'prod-agent': 61, 'prod-web': 57, 'staging-web':  9, 'atlas-eval': 6, dev: 3, 'ci-runner': 1 },
    { 'prod-agent': 65, 'prod-web': 60, 'staging-web':  9, 'atlas-eval': 7, dev: 4, 'ci-runner': 2 },
    { 'prod-agent': 71, 'prod-web': 67, 'staging-web': 10, 'atlas-eval': 7, dev: 4, 'ci-runner': 2 },
  ],
};

/** Per-series 7d totals, derived once from SPEND_BASE. These are the
 *  canonical "how much did series X spend across the workspace 7d"
 *  numbers; the chart distributes them across N buckets per range via
 *  distributeSeries(). Sum across series = TOTAL_7D_BASE_DOLLARS = $927. */
const SPEND_TOTALS_7D: Record<Dimension, Record<string, number>> = Object.fromEntries(
  Object.entries(SPEND_BASE).map(([dim, rows]) => [
    dim,
    rows.reduce((acc, row) => {
      for (const [k, v] of Object.entries(row)) acc[k] = (acc[k] || 0) + v;
      return acc;
    }, {} as Record<string, number>),
  ]),
) as Record<Dimension, Record<string, number>>;

/** Distribute `total` across `count` buckets with a mild upward trend
 *  (0.7 → 1.3) and per-bucket noise that mimics real time-series:
 *    ~75% of buckets get moderate variation (±20% around trend)
 *    ~15% spike upward (1.4–2.0×, e.g. a big batch job day)
 *    ~10% dip downward (0.35–0.65×, e.g. a weekend or quiet hour)
 *  Seeded LCG so the shape is deterministic across renders. Last bucket
 *  absorbs floating-point remainder so per-series sum exactly equals
 *  `total` — required for the chart-sum = KPI invariant. */
function distributeSeries(total: number, count: number, seed: number): number[] {
  let s = (seed * 2654435769) >>> 0 || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const trend = 0.7 + 0.6 * t;
    const r = rand();
    let jitter: number;
    if (r > 0.85)       jitter = 1.4 + rand() * 0.6;  // spike
    else if (r < 0.10)  jitter = 0.35 + rand() * 0.30; // dip
    else                jitter = 0.80 + rand() * 0.40; // normal ±20%
    weights.push(trend * jitter);
  }
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const out: number[] = [];
  let accumulated = 0;
  for (let i = 0; i < count - 1; i++) {
    const v = +(total * (weights[i] / sumW)).toFixed(2);
    out.push(v);
    accumulated += v;
  }
  out.push(+(total - accumulated).toFixed(2));
  return out;
}

/** Bar count per range. The Spend over time chart distributes each
 *  series's 7d total across this many buckets, so 24H = 12 bars at 2h
 *  each, 30D = 30 daily bars, etc. Custom range derives count from the
 *  span (daily up to 30 days, then capped). */
const BUCKET_COUNTS: Record<PresetRange, number> = {
  '24h': 12,
  '7d':  7,
  '30d': 30,
  all:   30,
};

function getBucketCount(range: Range, customRange: CustomRange | null): number {
  if (range === 'custom' && customRange) {
    const days = daysInRange(customRange);
    return Math.max(7, Math.min(30, days));
  }
  return BUCKET_COUNTS[range === 'custom' ? '7d' : range];
}

/** Human-readable bucket period for the SpendTrendCard description.
 *  Tells the reader what one bar covers so they can reconcile sum(bars)
 *  against the Total Spend KPI without doing the arithmetic. */
function getBucketLabel(range: Range, customRange: CustomRange | null): string {
  if (range === 'custom' && customRange) {
    const days = daysInRange(customRange);
    const count = getBucketCount(range, customRange);
    const perBucketDays = Math.max(1, Math.round(days / count));
    return perBucketDays === 1 ? 'per day' : `per ~${perBucketDays} days`;
  }
  if (range === '24h') return 'per 2 hours';
  if (range === '7d')  return 'per day';
  if (range === '30d') return 'per day';
  if (range === 'all') return 'per day';
  return 'per bucket';
}

/** Generate N evenly-spaced labels for the chart x-axis. Each preset has
 *  its own anchoring (1H → minute marks ending at "Now"; 24H → 2-hour
 *  marks on the calendar; 7D → daily; 30D → daily ending today). */
function getRangeLabels(range: Range, customRange: CustomRange | null): string[] {
  const count = getBucketCount(range, customRange);
  if (range === 'custom' && customRange) {
    const labels: string[] = [];
    const span = customRange.to.getTime() - customRange.from.getTime();
    for (let i = 0; i < count; i++) {
      const d = new Date(customRange.from.getTime() + (span * i) / (count - 1));
      labels.push(`${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`);
    }
    return labels;
  }
  if (range === 'all') {
    // Lifetime cumulative window — 30 buckets spanning the ~60 days of mock
    // history, ending today (Apr 27, per existing fixtures). Each bucket
    // covers ~2 days; labels are the explicit date at the bucket start.
    const labels: string[] = [];
    const lastDay = new Date(2026, 3, 27);
    for (let i = 0; i < 30; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() - Math.round(((29 - i) * 59) / 29));
      labels.push(`${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`);
    }
    return labels;
  }
  if (range === '24h') {
    // 12 buckets at 2-hour intervals on the calendar day. Trailing bucket
    // labeled "Now" since it ends at the anchor 14:30 rather than 14:00.
    return ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', 'Now'];
  }
  if (range === '7d') {
    // 7 daily buckets ending today (May 12). Anchor day labels back from
    // May 12 by (count - 1 - i) days.
    return ['Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27'];
  }
  // 30D — 30 daily labels ending Apr 27 (today, per existing fixtures).
  // Going back 29 days: Mar 29 → Apr 27 inclusive. Last label is the
  // explicit date (matching 7D's pattern, not 1H/24H's "Now").
  const labels: string[] = [];
  const lastDay = new Date(2026, 3, 27);
  for (let i = 0; i < 30; i++) {
    const d = new Date(lastDay);
    d.setDate(d.getDate() - (29 - i));
    labels.push(`${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`);
  }
  return labels;
}

function paletteColor(slot: number): string {
  return CHART_PALETTE[(slot - 1) % CHART_PALETTE.length]!;
}

function seriesColor(s: { slot: number; color?: string }): string {
  return s.color ?? paletteColor(s.slot);
}

function SpendTrendCard({ range, customRange }: { range: Range; customRange: CustomRange | null }) {
  const [dimension, setDimension] = useState<Dimension>('model');
  const series = SPEND_SERIES[dimension];

  const data = useMemo(() => {
    const count = getBucketCount(range, customRange);
    const labels = getRangeLabels(range, customRange);
    const scale = effectiveScale(range, customRange);
    const totals = SPEND_TOTALS_7D[dimension];

    // Distribute each series's range-scaled total across N buckets via
    // distributeSeries (trend + spike/dip noise). Each series gets its
    // own seed so adjacent series don't sync into matching ripples —
    // keeps stacked bars looking organic. Range-aware base seed so ranges
    // with matching bucket counts don't produce identical shapes.
    const rangeSeed =
      range === 'all' ? 11 :
      range === '24h' ? 47 :
      range === '7d'  ? 77 :
      range === '30d' ? 303 :
      99;
    const seriesBuckets: Record<string, number[]> = {};
    let seedOffset = 0;
    for (const [key, total7d] of Object.entries(totals)) {
      seedOffset++;
      seriesBuckets[key] = distributeSeries(
        total7d * scale,
        count,
        rangeSeed * 31 + seedOffset,
      );
    }

    // Per-bucket sum equals scaled 7d total by construction (distributeSeries
    // sums each series exactly, then sums across series).
    return Array.from({ length: count }, (_, i) => {
      const row: Record<string, number | string> = { date: labels[i] ?? '' };
      for (const [key, buckets] of Object.entries(seriesBuckets)) {
        row[key] = buckets[i] ?? 0;
      }
      return row;
    });
  }, [dimension, range, customRange]);

  const bucketLabel = getBucketLabel(range, customRange);

  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        series.map((s) => [s.key, { label: s.label, color: seriesColor(s) }]),
      ) as ChartConfig,
    [series],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend over time <span className="text-muted-foreground font-normal">(PAYG)</span></CardTitle>
        <CardDescription>
          Stacked by {DIMENSION_OPTIONS.find((d) => d.value === dimension)?.label.toLowerCase()}
          {' · '}{bucketLabel}
        </CardDescription>
        <CardAction>
          <Select
            value={dimension}
            onValueChange={(v: string) => setDimension(v as Dimension)}
          >
            <SelectTrigger
              size="sm"
              aria-label="Group spend by"
              className="border-ink-200 bg-white text-ink-900 font-normal"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIMENSION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  By {d.label.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: seriesColor(s) }}
              />
              <span className="font-sans text-xs text-ink-900">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 184px gives the stacked layers enough vertical room to read as
            distinct bands without the chart taking over the page. YAxis
            ticks are left-aligned (custom tick renderer below) so they
            share their left edge with the title and legend. */}
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[184px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="var(--color-ink-200)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              height={24}
              tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
              // Target ~7 visible labels regardless of bucket count:
              //   7 bars  → interval 0 (show all)
              //   12 bars → interval 1 (every other, ~6 visible)
              //   30 bars → interval 4 (every 5th, ~6 visible)
              interval={Math.max(0, Math.ceil(data.length / 7) - 1)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              width={60}
              tick={(props: { y?: string | number; payload?: { value?: string | number } }) => (
                // Left-align every tick at x=0 of the chart container so the
                // left edges of "$0", "$700", "$2800" all sit at the same x —
                // and that x lines up with the title + legend left edges.
                // Default recharts tick is right-anchored to the tick line,
                // which makes "$0" sit visibly further right than "$2800".
                <text
                  x={0}
                  y={props.y}
                  dy={4}
                  fontSize={11}
                  fill="var(--color-ink-500)"
                  textAnchor="start"
                >
                  ${props.payload?.value}
                </text>
              )}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.date ?? '')
                  }
                />
              }
            />
            {series.map((s) => {
              const color = seriesColor(s);
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="spend"
                  fill={color}
                  isAnimationActive={false}
                />
              );
            })}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* ─── Top X models — 3-up, one card per axis (no sort dropdown) ─────────── */

const fmtUsd = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (n: number) => n.toLocaleString('en-US');
const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : `${n}`;

type ModelRow = {
  key: string;
  label: string;
  vendor: Vendor;
  requests: number;
  tokens: number;
  spend: number;
};

/** Numbers are tuned so the three Top-by-axis cards diverge realistically.
 *  Price-per-token differs by ~60× between Haiku and Opus, and tokens-per-
 *  request differs by ~5× between short-classification (Haiku) and long-
 *  context (Llama). Sums reconcile with the 7d KPI rail (~$1,248 spend,
 *  ~48,293 requests, ~18.4M tokens).
 *
 *  Resulting top-5 leaders:
 *    Spend     → Opus, Sonnet, GPT, Gemini, Llama
 *    Requests  → Haiku, Sonnet, Gemini, GPT, Llama
 *    Tokens    → Sonnet, Llama, Haiku, Gemini, GPT */
const MODEL_ROWS: ModelRow[] = [
  { key: 'opus',    label: 'Claude Opus 4.7',   vendor: 'anthropic', requests:  2500, tokens: 1_340_000, spend: 532.00 },
  { key: 'sonnet',  label: 'Claude Sonnet 4.5', vendor: 'anthropic', requests: 14900, tokens: 6_550_000, spend: 383.00 },
  { key: 'gpt',     label: 'GPT-5.1',           vendor: 'openai',    requests:  6670, tokens: 2_860_000, spend: 279.00 },
  { key: 'gemini',  label: 'Gemini 3 Pro',      vendor: 'google',    requests:  8720, tokens: 4_050_000, spend: 189.00 },
  { key: 'llama',   label: 'Llama 4.2 405B',    vendor: 'meta',      requests:  5280, tokens: 4_840_000, spend: 127.00 },
  { key: 'haiku',   label: 'Claude Haiku',      vendor: 'anthropic', requests: 25030, tokens: 4_460_000, spend:  85.00 },
  { key: 'mistral', label: 'Mistral Large 3',   vendor: 'mistral',   requests:   690, tokens:   380_000, spend:  22.82 },
];

/* Three cards, one per entity — CTO 2026-05-13: "no reason to have 3 stat
 * sections about [models]. Make one about models, one about api keys, one
 * about users." Axes chosen so each card carries a distinct lens (and
 * doesn't duplicate the chart above): models by tokens, keys by requests,
 * users by spend. User aggregation groups API_KEY_ROWS by owner — owners
 * mirror Team.tsx MEMBER_ROWS so the workspace user list reconciles. */

type AvatarTone = 'blue' | 'rose' | 'emerald' | 'amber' | 'ink';

const AVATAR_TONE_CLS: Record<AvatarTone, string> = {
  blue:    'bg-blue-700 text-white',
  rose:    'bg-danger-700 text-white',
  emerald: 'bg-success-700 text-white',
  amber:   'bg-warning-700 text-white',
  ink:     'bg-ink-700 text-white',
};

/** Matches Team.tsx MEMBER_ROWS. Workspace users come from the team roster. */
const USER_TONE: Record<string, AvatarTone> = {
  'Chad Ponticas': 'blue',
  'Kira Tan':      'rose',
  'Mateus Silva':  'emerald',
  'Jordan Lee':    'amber',
};

function UserMonogram({ name, tone }: { name: string; tone: AvatarTone }) {
  const initial = (name.trim().split(/\s+/)[0]?.[0] ?? '?').toUpperCase();
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center size-4 shrink-0 rounded-full font-sans text-[9px] font-medium ${AVATAR_TONE_CLS[tone]}`}
    >
      {initial}
    </span>
  );
}

type TopRow = {
  rowKey: string;
  label: string;
  labelClassName?: string;
  value: string;
  avatar: React.ReactNode;
};

function TopList({ title, subtitle, rows }: { title: string; subtitle: string; rows: TopRow[] }) {
  return (
    <Card density="flush">
      <div className="flex flex-col gap-1 p-4">
        <h3 className="font-heading text-base leading-snug font-medium text-ink-900 m-0">
          {title}
        </h3>
        <p className="font-sans text-sm/5 tracking-tight text-ink-500 m-0">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-col px-4 pb-4 gap-2.5">
        {rows.map((row) => (
          <div key={row.rowKey} className="flex items-center gap-2 min-w-0">
            {row.avatar}
            <span
              className={`text-sm text-ink-900 tracking-snug truncate flex-1 min-w-0 ${row.labelClassName ?? 'font-sans'}`}
              title={row.label}
            >
              {row.label}
            </span>
            <span className="font-mono tabular-nums text-sm text-ink-900 whitespace-nowrap">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopByAxisRow({ range, customRange }: { range: Range; customRange: CustomRange | null }) {
  const scale = effectiveScale(range, customRange);

  const modelRows: TopRow[] = useMemo(
    () =>
      [...MODEL_ROWS]
        .map((m) => ({ ...m, tokens: Math.round(m.tokens * scale) }))
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 4)
        .map((m) => ({
          rowKey: m.key,
          label: m.label,
          value: fmtTokens(m.tokens),
          avatar: <VendorAvatar vendor={m.vendor} />,
        })),
    [scale],
  );

  const keyRows: TopRow[] = useMemo(
    () =>
      [...API_KEY_ROWS]
        .map((k) => ({ ...k, requests: Math.round(k.requests * scale) }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 4)
        .map((k) => ({
          rowKey: k.key,
          label: k.label,
          labelClassName: 'font-mono tracking-tight',
          value: fmtInt(k.requests),
          avatar: <Key aria-hidden className="size-4 shrink-0 text-ink-500" strokeWidth={2} />,
        })),
    [scale],
  );

  const userRows: TopRow[] = useMemo(() => {
    // PAYG-only — BYOK spend isn't tracked against the workspace total,
    // so users whose keys are all BYOK don't appear here.
    const agg = new Map<string, { owner: string; spend: number }>();
    for (const k of API_KEY_ROWS) {
      if (k.path === 'BYOK') continue;
      const existing = agg.get(k.owner) ?? { owner: k.owner, spend: 0 };
      existing.spend += k.spend * scale;
      agg.set(k.owner, existing);
    }
    return [...agg.values()]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 4)
      .map((u) => ({
        rowKey: u.owner,
        label: u.owner,
        value: fmtUsd(+u.spend.toFixed(2)),
        avatar: <UserMonogram name={u.owner} tone={USER_TONE[u.owner] ?? 'ink'} />,
      }));
  }, [scale]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <TopList title="Top models"   subtitle="By total tokens used"     rows={modelRows} />
      <TopList title="Top API keys" subtitle="By total requests made"   rows={keyRows} />
      <TopList title="Top users"    subtitle="By total spend (PAYG)"    rows={userRows} />
    </div>
  );
}

/* ─── Usage by key — org-wide admin table, sortable ─────────────────────── */

type ApiKeyRow = {
  key: string;
  label: string;
  owner: string;
  /** Gateway PRD R4/R5: BYOK vs PAYG is per-key. Material on this admin
   *  surface because the workspace owner reconciles prepaid balance vs.
   *  external provider charges across every user's keys. */
  path: 'BYOK' | 'PAYG';
  requests: number;
  tokensIn: number;
  tokensOut: number;
  spend: number;
};

/** Five workspace keys — matches the canonical set used on Requests
 *  (prod-web, prod-agent, dev, byok-*) re-spun with the two BYOK slots
 *  given product names (openclaw, hermes-agent). Sums reconcile with the
 *  7d KPI rail: $1,247.82 spend, 48,293 requests, 18.4M tokens.
 *
 *  Resulting top-5 leaders (only 5 keys, so all show):
 *    Spend     → prod-agent, prod-web, openclaw, hermes-agent, dev
 *    Requests  → prod-web, prod-agent, openclaw, dev, hermes-agent
 *    Tokens    → prod-web, prod-agent, openclaw, hermes-agent, dev */
const API_KEY_ROWS: ApiKeyRow[] = [
  { key: 'prod-web',      label: 'prod-web',      owner: 'Chad Ponticas', path: 'PAYG', requests: 22000, tokensIn: 4_030_000, tokensOut: 2_170_000, spend: 385.00 },
  { key: 'prod-agent',    label: 'prod-agent',    owner: 'Chad Ponticas', path: 'PAYG', requests:  8400, tokensIn: 3_190_000, tokensOut: 2_610_000, spend: 410.00 },
  { key: 'openclaw',      label: 'openclaw',      owner: 'Kira Tan',      path: 'BYOK', requests:  6800, tokensIn: 2_040_000, tokensOut: 1_360_000, spend: 295.00 },
  { key: 'hermes-agent',  label: 'hermes-agent',  owner: 'Mateus Silva',  path: 'BYOK', requests:  5200, tokensIn: 1_320_000, tokensOut: 1_080_000, spend: 135.00 },
  { key: 'dev',           label: 'dev',           owner: 'Jordan Lee',    path: 'PAYG', requests:  5893, tokensIn:   390_000, tokensOut:   210_000, spend:  22.82 },
  { key: 'staging-web',   label: 'staging-web',   owner: 'Chad Ponticas', path: 'PAYG', requests:  3800, tokensIn:   910_000, tokensOut:   490_000, spend:  58.00 },
  { key: 'ci-runner',     label: 'ci-runner',     owner: 'Jordan Lee',    path: 'PAYG', requests:  2400, tokensIn:   224_000, tokensOut:    56_000, spend:   9.00 },
  { key: 'nova-chat',     label: 'nova-chat',     owner: 'Kira Tan',      path: 'BYOK', requests:  5400, tokensIn: 1_260_000, tokensOut:   840_000, spend: 185.00 },
  { key: 'atlas-eval',    label: 'atlas-eval',    owner: 'Mateus Silva',  path: 'PAYG', requests:  1800, tokensIn:   690_000, tokensOut:   230_000, spend:  42.00 },
  { key: 'shadowfax-rag', label: 'shadowfax-rag', owner: 'Mateus Silva',  path: 'BYOK', requests:  2100, tokensIn: 1_120_000, tokensOut:   280_000, spend:  76.00 },
];

type KeySortKey = 'spend' | 'requests' | 'tokens' | 'owner';

const KEY_SORT_OPTIONS: { value: KeySortKey; label: string }[] = [
  { value: 'spend',    label: 'Highest spend' },
  { value: 'requests', label: 'Most requests' },
  { value: 'tokens',   label: 'Most tokens' },
  { value: 'owner',    label: 'Owner (A–Z)' },
];

function UsageByKey({ range, customRange }: { range: Range; customRange: CustomRange | null }) {
  const [sort, setSort] = useState<KeySortKey>('owner');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  // Land on page 1 whenever the underlying ordering or window changes.
  // Without this you sit on page 3 of "Highest spend / 30d," switch to
  // "Owner (A–Z) / 24h," and stare at page 3 of an entirely different
  // ranking — possibly past the last page. Rows-per-page already resets
  // inside TablePaginationFooter.
  useEffect(() => {
    setPage(1);
  }, [range, customRange, sort, query]);

  const sortedRows = useMemo(() => {
    const scale = effectiveScale(range, customRange);
    const scaled = API_KEY_ROWS.map((k) => ({
      ...k,
      spend:     +(k.spend * scale).toFixed(2),
      requests:  Math.round(k.requests * scale),
      tokensIn:  Math.round(k.tokensIn * scale),
      tokensOut: Math.round(k.tokensOut * scale),
    }));
    return scaled.sort((a, b) => {
      if (sort === 'owner') {
        return a.owner.localeCompare(b.owner) || b.spend - a.spend;
      }
      if (sort === 'tokens') {
        return (b.tokensIn + b.tokensOut) - (a.tokensIn + a.tokensOut);
      }
      if (sort === 'spend') {
        // BYOK rows render "—" in the Spend column (we don't track that
        // against the workspace total), so they always sort last when
        // ranking by spend — regardless of underlying provider charges.
        const aByok = a.path === 'BYOK';
        const bByok = b.path === 'BYOK';
        if (aByok !== bByok) return aByok ? 1 : -1;
        return b.spend - a.spend;
      }
      return b[sort] - a[sort];
    });
  }, [range, customRange, sort]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedRows;
    return sortedRows.filter(
      (r) => r.label.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q),
    );
  }, [sortedRows, query]);

  const perPage = parseInt(rowsPerPage, 10);
  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * perPage, page * perPage),
    [filteredRows, page, perPage],
  );

  return (
    <Card density="flush">
      <div className="flex items-center gap-2 p-4">
        <div className="relative w-72 min-w-0 shrink-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-500"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            size="sm"
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search key or owner…"
            className="pl-8"
            aria-label="Search keys"
          />
        </div>
        <Select value={sort} onValueChange={(v: string) => setSort(v as KeySortKey)}>
          <SelectTrigger
            size="sm"
            aria-label="Sort keys by"
            className="border-ink-200 bg-white text-ink-900 font-normal"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KEY_SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="whitespace-nowrap">Key</TableHead>
            <TableHead className="whitespace-nowrap">Owner</TableHead>
            <TableHead className="whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5">
                Billing
                <Tooltip>
                  <TooltipTrigger
                    render={<button type="button" />}
                    aria-label="What's the difference between PAYG and BYOK?"
                    className="inline-flex items-center justify-center rounded-xs text-ink-400 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-300"
                  >
                    <Info aria-hidden className="size-3.5" strokeWidth={2} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      <div>
                        <span className="font-mono font-medium text-ink-900">PAYG</span>
                        {' '}— debits the workspace prepaid Gateway balance.
                      </div>
                      <div>
                        <span className="font-mono font-medium text-ink-900">BYOK</span>
                        {' '}— bills the customer's own provider account directly; Gateway sees $0.
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </span>
            </TableHead>
            <TableHead className="text-right whitespace-nowrap">Requests</TableHead>
            <TableHead className="text-right whitespace-nowrap">Tokens in</TableHead>
            <TableHead className="text-right whitespace-nowrap">Tokens out</TableHead>
            <TableHead className="text-right whitespace-nowrap">Spend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={row.key} className="hover:bg-transparent">
              <TableCell className="max-w-[280px] font-mono text-ink-800 tracking-tight">
                <span className="block truncate" title={row.label}>
                  {row.label}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="font-sans text-sm text-ink-800 tracking-snug">
                  {row.owner}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant="outline" className="font-mono text-ink-500">
                  {row.path}
                </Badge>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap font-mono tabular-nums text-ink-800">
                {fmtInt(row.requests)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap font-mono tabular-nums text-ink-800">
                {fmtTokens(row.tokensIn)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap font-mono tabular-nums text-ink-800">
                {fmtTokens(row.tokensOut)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap font-mono tabular-nums text-ink-900">
                {row.path === 'BYOK' ? <span className="text-ink-400">—</span> : fmtUsd(row.spend)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePaginationFooter
        total={filteredRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </Card>
  );
}
