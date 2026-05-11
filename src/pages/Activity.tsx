import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Info } from 'lucide-react';
import {
  Area,
  AreaChart,
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

type Range = '24h' | '7d' | '30d' | '90d';

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d',  label: '7d'  },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

/** Multiplier applied to base (7d) values to fabricate plausible per-range
 *  totals on this static artboard. Real implementation would aggregate from
 *  the gateway event stream per the PRD acceptance criterion (chart-by-key
 *  total === per-key-table total for the same range). */
const RANGE_SCALE: Record<Range, number> = {
  '24h': 0.16,
  '7d':  1,
  '30d': 4.2,
  '90d': 12.6,
};

export function Activity() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  const [range, setRange] = useState<Range>('7d');

  return (
    <DashboardChrome
            urlSlug="activity"
            screenEyebrow="WORKSPACE"
            breadcrumbCurrent="Usage analytics"
            activeNavId="activity"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <PageHeader range={range} onRangeChange={setRange} />
            <KpiRail range={range} />
            <SpendTrendCard range={range} />
            <TopByAxisRow range={range} />
            <UsageByKey range={range} />
          </DashboardChrome>
  );
}

/* ─── Page header — title + subtitle on left, range pill on right ───────── */

function PageHeader({
  range,
  onRangeChange,
}: {
  range: Range;
  onRangeChange: (r: Range) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Activity</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Cost, requests, and tokens across the workspace.
        </p>
      </div>
      <SegmentedPill
        options={RANGE_OPTIONS}
        value={range}
        onValueChange={(v) => onRangeChange(v as Range)}
      />
    </div>
  );
}

/* ─── KPI rail (3-up, range-aware) ──────────────────────────────────────── */

type KpiSpec = {
  value: string;
  delta: string;
  spark: number[];
};

const KPI_DATA: Record<Range, { spend: KpiSpec; requests: KpiSpec; tokens: KpiSpec }> = {
  '24h': {
    spend:    { value: '$199.65',  delta: '+4.1%', spark: [6, 8, 7, 10, 9, 11, 13, 12, 14] },
    requests: { value: '7,727',    delta: '+2.6%', spark: [5, 6, 6, 8, 9, 8, 10, 11, 12] },
    tokens:   { value: '2.94 M',   delta: '+3.2%', spark: [7, 8, 9, 9, 10, 11, 11, 12, 12] },
  },
  '7d': {
    spend:    { value: '$1,247.82', delta: '+12.6%', spark: [8, 10, 12, 16, 18, 20, 25, 22, 24] },
    requests: { value: '48,293',    delta: '+8.2%',  spark: [6, 12, 10, 16, 20, 18, 26, 24, 28] },
    tokens:   { value: '18.4 M',    delta: '+8.7%',  spark: [10, 11, 13, 14, 16, 15, 17, 18, 18] },
  },
  '30d': {
    spend:    { value: '$5,240.84', delta: '+18.4%', spark: [12, 14, 18, 22, 24, 28, 32, 30, 34] },
    requests: { value: '202,831',   delta: '+14.7%', spark: [10, 14, 18, 22, 24, 26, 30, 30, 34] },
    tokens:   { value: '77.3 M',    delta: '+13.2%', spark: [14, 16, 18, 20, 22, 22, 24, 26, 28] },
  },
  '90d': {
    spend:    { value: '$15,722.53', delta: '+27.9%', spark: [10, 14, 18, 20, 22, 28, 32, 36, 42] },
    requests: { value: '608,492',    delta: '+22.1%', spark: [12, 14, 18, 20, 24, 28, 30, 34, 38] },
    tokens:   { value: '231.8 M',    delta: '+19.5%', spark: [12, 14, 18, 22, 24, 28, 30, 32, 36] },
  },
};

function KpiRail({ range }: { range: Range }) {
  const k = KPI_DATA[range];
  return (
    <KpiRailShell columns={3}>
      <CompactKpi
        flat
        title="Total Spend"
        value={k.spend.value}
        delta={k.spend.delta}
        spark={<CompactSpark colorVar="var(--color-chart-1)" data={k.spend.spark} />}
      />
      <CompactKpi
        flat
        title="Total Requests"
        value={k.requests.value}
        delta={k.requests.delta}
        spark={<CompactSpark colorVar="var(--color-ink-500)" data={k.requests.spark} />}
      />
      <CompactKpi
        flat
        title="Tokens Used"
        value={k.tokens.value}
        delta={k.tokens.delta}
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
    { key: 'prod',  label: 'Production',      slot: 1 },
    { key: 'macro', label: 'Macro Analyst',   slot: 2 },
    { key: 'risk',  label: 'Risk Pipeline',   slot: 3 },
    { key: 'dev',   label: 'Development',     slot: 4 },
    { key: 'eval',  label: 'Eval Harness',    slot: 5 },
    { key: 'other', label: 'Other (23 keys)', slot: 0, color: 'var(--color-ink-300)' },
  ],
};

/** Base (7d) chart data. Other ranges derive from this by scaling values and
 *  relabeling the x-axis. Mock-realistic, not aggregated. */
const SPEND_BASE: Record<Dimension, Array<Record<string, number>>> = {
  // Per-model daily $ sums match the 7d MODEL_ROWS totals so the chart
  // and the Top-by-axis cards tell the same story:
  //   opus≈410, sonnet≈295, gpt≈215, gemini≈146, llama≈98, haiku≈66.
  model: [
    { sonnet: 35, gpt: 26, gemini: 18, opus: 45, llama: 12, haiku:  8 },
    { sonnet: 38, gpt: 28, gemini: 19, opus: 50, llama: 13, haiku:  8 },
    { sonnet: 40, gpt: 29, gemini: 20, opus: 55, llama: 13, haiku:  9 },
    { sonnet: 42, gpt: 30, gemini: 21, opus: 58, llama: 14, haiku:  9 },
    { sonnet: 44, gpt: 32, gemini: 21, opus: 62, llama: 14, haiku: 10 },
    { sonnet: 47, gpt: 34, gemini: 23, opus: 67, llama: 16, haiku: 11 },
    { sonnet: 49, gpt: 36, gemini: 24, opus: 73, llama: 16, haiku: 11 },
  ],
  provider: [
    { anthropic: 73,  openai: 28, google: 18, bedrock: 14, openrouter: 9  },
    { anthropic: 83,  openai: 31, google: 21, bedrock: 17, openrouter: 11 },
    { anthropic: 90,  openai: 34, google: 19, bedrock: 19, openrouter: 13 },
    { anthropic: 97,  openai: 32, google: 24, bedrock: 21, openrouter: 15 },
    { anthropic: 109, openai: 38, google: 26, bedrock: 24, openrouter: 17 },
    { anthropic: 117, openai: 41, google: 28, bedrock: 26, openrouter: 19 },
    { anthropic: 125, openai: 44, google: 30, bedrock: 28, openrouter: 21 },
  ],
  // Daily $ sums match the 7d totals for these 6 series in API_KEY_ROWS:
  //   macro≈204, risk≈193, prod≈141, dev≈42, eval≈46, other≈622.
  // "other" aggregates the 23 keys not shown as named series. Full chart
  // total ≈ $1,248 — reconciles with the 7d Total Spend KPI.
  apiKey: [
    { prod: 17, macro: 24, risk: 23, dev: 5, eval: 5, other: 78 },
    { prod: 19, macro: 26, risk: 25, dev: 6, eval: 6, other: 83 },
    { prod: 19, macro: 28, risk: 27, dev: 6, eval: 6, other: 86 },
    { prod: 20, macro: 29, risk: 28, dev: 6, eval: 6, other: 90 },
    { prod: 21, macro: 30, risk: 29, dev: 6, eval: 7, other: 92 },
    { prod: 22, macro: 32, risk: 30, dev: 6, eval: 7, other: 96 },
    { prod: 23, macro: 35, risk: 30, dev: 7, eval: 8, other: 97 },
  ],
};

const RANGE_LABELS: Record<Range, string[]> = {
  '24h': ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
  '7d':  ['Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27'],
  '30d': ['Apr 1', 'Apr 5', 'Apr 10', 'Apr 14', 'Apr 19', 'Apr 23', 'Apr 27'],
  '90d': ['Feb 1', 'Feb 14', 'Feb 28', 'Mar 14', 'Mar 28', 'Apr 11', 'Apr 27'],
};

function paletteColor(slot: number): string {
  return CHART_PALETTE[(slot - 1) % CHART_PALETTE.length]!;
}

function seriesColor(s: { slot: number; color?: string }): string {
  return s.color ?? paletteColor(s.slot);
}

function SpendTrendCard({ range }: { range: Range }) {
  const [dimension, setDimension] = useState<Dimension>('model');
  const series = SPEND_SERIES[dimension];

  const data = useMemo(() => {
    const scale = RANGE_SCALE[range];
    const labels = RANGE_LABELS[range];
    return SPEND_BASE[dimension].map((row, i) => {
      const scaled: Record<string, number | string> = { date: labels[i] ?? '' };
      for (const [k, v] of Object.entries(row)) scaled[k] = Math.round(v * scale);
      return scaled;
    });
  }, [dimension, range]);

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
        <CardTitle>Spend over time</CardTitle>
        <CardDescription>
          Stacked by {DIMENSION_OPTIONS.find((d) => d.value === dimension)?.label.toLowerCase()}
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
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
              cursor={{ stroke: 'var(--color-ink-300)', strokeWidth: 1 }}
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
                <Area
                  key={s.key}
                  dataKey={s.key}
                  stackId="spend"
                  type="monotone"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={color}
                  fillOpacity={0.85}
                  isAnimationActive={false}
                />
              );
            })}
          </AreaChart>
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
  { key: 'opus',    label: 'Claude Opus 4.7',   vendor: 'anthropic', requests:  1895, tokens: 1_010_000, spend: 410.18 },
  { key: 'sonnet',  label: 'Claude Sonnet 4.5', vendor: 'anthropic', requests: 11280, tokens: 4_920_000, spend: 295.42 },
  { key: 'gpt',     label: 'GPT-5.1',           vendor: 'openai',    requests:  5050, tokens: 2_150_000, spend: 215.28 },
  { key: 'gemini',  label: 'Gemini 3 Pro',      vendor: 'google',    requests:  6600, tokens: 3_040_000, spend: 145.93 },
  { key: 'llama',   label: 'Llama 4.2 405B',    vendor: 'meta',      requests:  4000, tokens: 3_640_000, spend:  97.84 },
  { key: 'haiku',   label: 'Claude Haiku',      vendor: 'anthropic', requests: 18950, tokens: 3_350_000, spend:  65.51 },
  { key: 'mistral', label: 'Mistral Large 3',   vendor: 'mistral',   requests:   520, tokens:   290_000, spend:  17.66 },
];

type Axis = 'spend' | 'requests' | 'tokens';

const AXIS_META: Record<Axis, { title: string; format: (row: ScaledModelRow) => string }> = {
  spend:    { title: 'Top spend models',    format: (r) => fmtUsd(r.spend) },
  requests: { title: 'Top request models',  format: (r) => fmtInt(r.requests) },
  tokens:   { title: 'Top token models',    format: (r) => fmtTokens(r.tokens) },
};

type ScaledModelRow = ModelRow;

function scaleModels(range: Range): ScaledModelRow[] {
  const scale = RANGE_SCALE[range];
  return MODEL_ROWS.map((m) => ({
    ...m,
    spend:    +(m.spend * scale).toFixed(2),
    requests: Math.round(m.requests * scale),
    tokens:   Math.round(m.tokens * scale),
  }));
}

function TopByAxisRow({ range }: { range: Range }) {
  const rows = useMemo(() => scaleModels(range), [range]);
  return (
    <div className="grid grid-cols-3 gap-4">
      <TopByMetricCard axis="spend" rows={rows} />
      <TopByMetricCard axis="requests" rows={rows} />
      <TopByMetricCard axis="tokens" rows={rows} />
    </div>
  );
}

function TopByMetricCard({ axis, rows }: { axis: Axis; rows: ScaledModelRow[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b[axis] - a[axis]).slice(0, 5),
    [axis, rows],
  );
  const meta = AXIS_META[axis];

  return (
    <Card density="flush">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-heading text-base leading-snug font-medium text-ink-900 m-0">
          {meta.title}
        </h3>
      </div>
      <div className="flex flex-col px-4 pb-4 gap-2.5">
        {sorted.map((row) => (
          <div key={row.key} className="flex items-center gap-2 min-w-0">
            <VendorAvatar vendor={row.vendor} />
            <span
              className="font-sans text-sm text-ink-900 tracking-snug truncate flex-1 min-w-0"
              title={row.label}
            >
              {row.label}
            </span>
            <span className="font-mono tabular-nums text-sm text-ink-900 whitespace-nowrap">
              {meta.format(row)}
            </span>
          </div>
        ))}
      </div>
    </Card>
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
  tokens: number;
  spend: number;
};

/** Each key encodes a usage archetype (premium / workhorse / long-context /
 *  high-volume-cheap) so the three numeric sort options diverge meaningfully
 *  on page 1. Sums reconcile with the 7d KPI rail.
 *
 *  Resulting top-5 leaders:
 *    Spend     → Macro Analyst, Risk Pipeline, Production, Anomaly Detector, Backtester
 *    Requests  → Embedding Service, Sentiment Scanner, Production, Support Triage, Feature Extractor
 *    Tokens    → Forecast Engine, Production, Backtester, Docs Indexer, Research Console
 *    Owner A–Z → Alex Brandes' keys first, then Devon Wu's, etc. */
const API_KEY_ROWS: ApiKeyRow[] = [
  { key: 'prod',      label: 'Production',          owner: 'Alex Brandes', path: 'PAYG', requests: 4500, tokens: 2_580_000, spend: 141.41 },
  { key: 'macro',     label: 'Macro Analyst',       owner: 'Maya Chen',    path: 'BYOK', requests:  980, tokens:   520_000, spend: 204.45 },
  { key: 'risk',      label: 'Risk Pipeline',       owner: 'Jordan Park',  path: 'BYOK', requests:  940, tokens:   640_000, spend: 192.51 },
  { key: 'forecast',  label: 'Forecast Engine',     owner: 'Maya Chen',    path: 'BYOK', requests: 1870, tokens: 2_760_000, spend:  70.45 },
  { key: 'dev',       label: 'Development',         owner: 'Sam Rivera',   path: 'PAYG', requests: 1640, tokens:   870_000, spend:  41.68 },
  { key: 'backtest',  label: 'Backtester',          owner: 'Jordan Park',  path: 'BYOK', requests: 1380, tokens: 2_020_000, spend:  83.36 },
  { key: 'embed',     label: 'Embedding Service',   owner: 'Devon Wu',     path: 'PAYG', requests: 6800, tokens:   650_000, spend:  13.89 },
  { key: 'anomaly',   label: 'Anomaly Detector',    owner: 'Priya Singh',  path: 'BYOK', requests:  540, tokens:   330_000, spend: 121.55 },
  { key: 'eval',      label: 'Eval Harness',        owner: 'Priya Singh',  path: 'BYOK', requests: 1180, tokens:   620_000, spend:  45.65 },
  { key: 'sentiment', label: 'Sentiment Scanner',   owner: 'Maya Chen',    path: 'BYOK', requests: 5500, tokens:   490_000, spend:  18.85 },
  { key: 'staging',   label: 'Staging',             owner: 'Alex Brandes', path: 'PAYG', requests:  320, tokens:   320_000, spend:  31.75 },
  { key: 'feature',   label: 'Feature Extractor',   owner: 'Devon Wu',     path: 'PAYG', requests: 2900, tokens:   400_000, spend:  10.91 },
  { key: 'research',  label: 'Research Console',    owner: 'Lina Park',    path: 'BYOK', requests:  780, tokens: 1_130_000, spend:  47.63 },
  { key: 'fixtures',  label: 'Test Fixtures',       owner: 'Sam Rivera',   path: 'PAYG', requests: 2500, tokens:   250_000, spend:   8.93 },
  { key: 'review',    label: 'Code Review Bot',     owner: 'Maya Chen',    path: 'BYOK', requests:  720, tokens:   200_000, spend:  18.85 },
  { key: 'pr-bot',    label: 'PR Comments',         owner: 'Sam Rivera',   path: 'BYOK', requests: 1520, tokens:   220_000, spend:   5.95 },
  { key: 'support',   label: 'Support Triage',      owner: 'Jordan Park',  path: 'PAYG', requests: 3200, tokens:   520_000, spend:  15.88 },
  { key: 'kb',        label: 'Knowledge Base',      owner: 'Lina Park',    path: 'PAYG', requests:  510, tokens:   970_000, spend:  33.73 },
  { key: 'docs',      label: 'Docs Indexer',        owner: 'Priya Singh',  path: 'BYOK', requests:  380, tokens: 1_530_000, spend:  43.66 },
  { key: 'notebook',  label: 'Notebook Console',    owner: 'Lina Park',    path: 'BYOK', requests:  420, tokens:   160_000, spend:  10.91 },
  { key: 'experiment',label: 'Experiment Runner',   owner: 'Devon Wu',     path: 'BYOK', requests:  180, tokens:   100_000, spend:  38.70 },
  { key: 'play',      label: 'Playground',          owner: 'Alex Brandes', path: 'PAYG', requests:  480, tokens:   170_000, spend:   7.94 },
  { key: 'ci',        label: 'CI Bot',              owner: 'Sam Rivera',   path: 'PAYG', requests: 1700, tokens:   270_000, spend:   6.95 },
  { key: 'onboard',   label: 'Onboarding Bot',      owner: 'Jordan Park',  path: 'PAYG', requests: 2400, tokens:   200_000, spend:   7.94 },
  { key: 'routing',   label: 'Support Routing',     owner: 'Maya Chen',    path: 'PAYG', requests: 2600, tokens:   140_000, spend:   4.96 },
  { key: 'dataset',   label: 'Dataset Loader',      owner: 'Devon Wu',     path: 'PAYG', requests:  280, tokens:   240_000, spend:  11.90 },
  { key: 'sandbox',   label: 'Sandbox',             owner: 'Sam Rivera',   path: 'PAYG', requests:  820, tokens:    75_000, spend:   4.47 },
  { key: 'smoke',     label: 'Smoke Tests',         owner: 'Priya Singh',  path: 'PAYG', requests: 1240, tokens:    52_000, spend:   2.98 },
];

type KeySortKey = 'spend' | 'requests' | 'tokens' | 'owner';

const KEY_SORT_OPTIONS: { value: KeySortKey; label: string }[] = [
  { value: 'spend',    label: 'Highest spend' },
  { value: 'requests', label: 'Most requests' },
  { value: 'tokens',   label: 'Most tokens' },
  { value: 'owner',    label: 'Owner (A–Z)' },
];

function UsageByKey({ range }: { range: Range }) {
  const [sort, setSort] = useState<KeySortKey>('spend');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  // Land on page 1 whenever the underlying ordering or window changes.
  // Without this you sit on page 3 of "Highest spend / 30d," switch to
  // "Owner (A–Z) / 24h," and stare at page 3 of an entirely different
  // ranking — possibly past the last page. Rows-per-page already resets
  // inside TablePaginationFooter.
  useEffect(() => {
    setPage(1);
  }, [range, sort]);

  const sortedRows = useMemo(() => {
    const scale = RANGE_SCALE[range];
    const scaled = API_KEY_ROWS.map((k) => ({
      ...k,
      spend:    +(k.spend * scale).toFixed(2),
      requests: Math.round(k.requests * scale),
      tokens:   Math.round(k.tokens * scale),
    }));
    return scaled.sort((a, b) => {
      if (sort === 'owner') {
        return a.owner.localeCompare(b.owner) || b.spend - a.spend;
      }
      return b[sort] - a[sort];
    });
  }, [range, sort]);

  const perPage = parseInt(rowsPerPage, 10);
  const pageRows = useMemo(
    () => sortedRows.slice((page - 1) * perPage, page * perPage),
    [sortedRows, page, perPage],
  );

  return (
    <Card density="flush">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="font-heading text-base leading-snug font-medium text-ink-900 m-0">
            Usage by key
          </h3>
          <p className="font-sans text-sm/5 tracking-tight text-ink-500 m-0">
            All API keys in this workspace, across users.
          </p>
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
            <TableHead className="text-right whitespace-nowrap">Tokens</TableHead>
            <TableHead className="text-right whitespace-nowrap">Spend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={row.key} className="hover:bg-transparent">
              <TableCell className="max-w-[280px]">
                <span
                  className="font-sans text-sm text-ink-900 tracking-snug truncate"
                  title={row.label}
                >
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
                {fmtTokens(row.tokens)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap font-mono tabular-nums text-ink-900">
                {fmtUsd(row.spend)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePaginationFooter
        total={sortedRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </Card>
  );
}
