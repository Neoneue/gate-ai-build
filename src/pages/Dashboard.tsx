import { useState, type ReactNode } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  BarChart2,
  BookOpen,
  ChevronRight,
  Plus,
  ClipboardList,
  Coins,
  CreditCard,
  ExternalLink,
  Gauge,
  KeyRound,
  Layers,
  ArrowLeftRight,
  ScanSearch,
  ShieldCheck,
  Terminal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { CompactKpi } from '@/components/ui/compact-kpi';
import { PageTitle } from '@/components/ui/page-title';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogTitleBlock,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/copy-button';
import { AnthropicIcon, OpenAIIcon, GeminiIcon, GrokIcon, MetaIcon, MistralIcon } from '@/components/icons/model-providers';
import {
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_REQUESTS,
  TOTAL_7D_BASE_TOKENS,
  distributeSeries,
  SPEND_BASE,
  SPEND_SERIES,
  SPEND_TOTALS_7D,
  TOKENS_TOTALS_7D,
  seriesColor,
} from '@/pages/Activity';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { DashboardChrome } from '@/layouts/DashboardChrome';

const THREATS_DETECTED_COUNT = 117; // Security 7d total: 77 blocked + 35 flagged + 5 redacted

const fmtTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : `${n}`;

const REQUEST_STATUS_SERIES = [
  { key: 'success', label: 'Success',   slot: 0, color: 'var(--color-success-500)' },
  { key: 'errors',  label: 'Errors',    slot: 1, color: 'var(--color-danger-500)'  },
  { key: 'slow',    label: 'Slow >10s', slot: 2, color: 'var(--color-warning-500)' },
] as const satisfies StackedSeries;

const THREATS_STATUS_SERIES = [
  { key: 'blocked',  label: 'Blocked',  slot: 0, color: 'var(--color-danger-500)'  },
  { key: 'flagged',  label: 'Flagged',  slot: 1, color: 'var(--color-warning-500)' },
  { key: 'redacted', label: 'Redacted', slot: 2, color: 'var(--color-blue-500)'    },
] as const satisfies StackedSeries;

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-012 — Composed · Dashboard
 *
 * Production-shell surface composed entirely from primitives that already
 * exist elsewhere in the system:
 *   - KPI rail   →  CompactKpi pattern from CMP-008 (Stat cards)
 *   - Bar chart  →  ComposedChart pattern from CMP-009.1 (Spend trend)
 *   - Audit feed →  table treatment from CMP-010.1 (Data table)
 *
 * The shell itself (sidebar + screen-head) is bespoke to this surface — the
 * 64px icon sidebar isn't part of the system's reusable primitives, so it
 * stays local to this artboard.
 *
 * Color palette: only ink-* / blue-* / semantic vars from index.css.
 * Status pill colors (red/amber for 4xx / 5xx codes) use the destructive
 * and warning semantic vars at low alpha — same approach as CMP-003.
 * ───────────────────────────────────────────────────────────────────────── */

export function Dashboard() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
            activeNavId="overview"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <PageHeader />
            <HeroCard />
            <div className="flex flex-col gap-4 mt-6">
              <h3 className="font-sans text-lg/6 font-medium tracking-snug text-neutral-900 m-0">
                Activity this week
              </h3>
              <KpiRail />
            </div>
          </DashboardChrome>
  );
}

/* ─── Page header (title + actions) ──────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 max-w-1/2">
      {/* h2 (not h1) — the artboard's ArtboardHeader already emits the
          outer h1; this is the in-surface page title and reads as h2
          in the document outline so RecentRequestsCard h3 doesn't
          create a level skip. */}
      <PageTitle>Overview</PageTitle>
      <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
        Cost controls, inline security, and a tamper-evident audit trail. Anchored to Constellation's Digital Evidence layer.
      </p>
    </div>
  );
}

/* ─── Setup banner ───────────────────────────────────────────────────────── */

function SetupBanner() {
  const navigate = useNavigate();
  return (
    <div className="bg-card border border-border rounded-md px-4 py-3 flex items-center gap-4">
      <span className="shrink-0 size-8 inline-flex items-center justify-center rounded-xs bg-muted text-neutral-700">
        <KeyRound className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-900">Create your first API key</span>
        <span className="text-sm text-neutral-500">Gate AI requires at least one API key before it can route any requests.</span>
      </div>
      <Button
        size="sm"
        variant="default"
        className="ml-auto shrink-0"
        onClick={() => navigate('/api-keys')}
      >
        + Create key
      </Button>
    </div>
  );
}

/* ─── KPI rail helpers ───────────────────────────────────────────────────── */

/** Generate 7 daily labels ending today (anchored to a fixed mock date so
 *  bar labels are stable across renders). Mirrors Activity.tsx's 7d path. */
function make7dLabels(): string[] {
  const anchor = new Date(2026, 3, 27); // Apr 27 — matches Activity fixtures
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

const KPI_7D_LABELS = make7dLabels();

/** Build stacked chart rows for a given dimension from SPEND_BASE (spend)
 *  or distributeSeries per-series totals (tokens). Each row is one day with
 *  a `date` key plus one key per series. */
function makeStackedSpendRows(): Array<Record<string, number | string>> {
  return SPEND_BASE['model'].map((row, i) => ({
    date: KPI_7D_LABELS[i] ?? '',
    ...row,
  }));
}

function makeStackedTokenRows(): Array<Record<string, number | string>> {
  const modelSeries = SPEND_SERIES['model'];
  const totals = TOKENS_TOTALS_7D['model'];
  const seriesBuckets: Record<string, number[]> = {};
  let seedOffset = 0;
  for (const s of modelSeries) {
    seedOffset++;
    seriesBuckets[s.key] = distributeSeries(
      totals[s.key] ?? 0,
      7,
      77 * 31 + seedOffset + 200, // distinct seed from spend path
    );
  }
  return Array.from({ length: 7 }, (_, i) => {
    const row: Record<string, number | string> = { date: KPI_7D_LABELS[i] ?? '' };
    for (const s of modelSeries) row[s.key] = seriesBuckets[s.key]?.[i] ?? 0;
    return row;
  });
}

function makeStackedThreatsRows(): Array<Record<string, number | string>> {
  const buckets = {
    blocked:  distributeSeries(77, 7, 141),
    flagged:  distributeSeries(35, 7, 142),
    redacted: distributeSeries(5,  7, 143),
  };
  return Array.from({ length: 7 }, (_, i) => ({
    date:     KPI_7D_LABELS[i] ?? '',
    blocked:  buckets.blocked[i]  ?? 0,
    flagged:  buckets.flagged[i]  ?? 0,
    redacted: buckets.redacted[i] ?? 0,
  }));
}

function makeStackedRequestRows(): Array<Record<string, number | string>> {
  const errors  = Math.round(TOTAL_7D_BASE_REQUESTS * 0.01);
  const slow    = Math.round(TOTAL_7D_BASE_REQUESTS * 0.45);
  const success = TOTAL_7D_BASE_REQUESTS - errors - slow;
  const buckets = {
    success: distributeSeries(success, 7, 131),
    errors:  distributeSeries(errors,  7, 132),
    slow:    distributeSeries(slow,    7, 133),
  };
  return Array.from({ length: 7 }, (_, i) => ({
    date:    KPI_7D_LABELS[i] ?? '',
    success: buckets.success[i] ?? 0,
    errors:  buckets.errors[i]  ?? 0,
    slow:    buckets.slow[i]    ?? 0,
  }));
}

/** Stacked-by-model bar chart used in the Spend and Tokens tiles. */
const STACKED_CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 } as const;
const STACKED_CHART_TICK = { fontSize: 10 } as const;

type StackedSeries = readonly { key: string; label: string; slot: number; color?: string }[];

function StackedKpiChart({
  data,
  series,
  yFormatter,
}: {
  data: Array<Record<string, number | string>>;
  series: StackedSeries;
  yFormatter: (v: number) => string;
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: seriesColor(s) }]),
  ) as ChartConfig;

  return (
    <ChartContainer config={config} className="h-[180px] w-full">
      <BarChart data={data} margin={STACKED_CHART_MARGIN} barCategoryGap="20%">
        <CartesianGrid horizontal vertical={false} stroke="var(--color-neutral-200)" strokeDasharray="8 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          height={24}
          tick={STACKED_CHART_TICK}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={STACKED_CHART_TICK}
          tickFormatter={yFormatter}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name) => {
                const cfg = config[name as string];
                return (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-1">
                      <span
                        aria-hidden
                        className="size-2 rounded-xs shrink-0"
                        style={{ backgroundColor: cfg?.color }}
                      />
                      <span className="text-muted-foreground">{cfg?.label ?? name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-foreground">
                      {yFormatter(Number(value))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="s"
            fill={seriesColor(s)}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/** Horizontal color key — dots + series names; breakdown lives in the tooltip. */
function HorizontalLegend({ series }: { series: StackedSeries }) {
  return (
    <div className="px-4 pb-5 flex items-center justify-center gap-4 flex-wrap">
      {series.slice(0, 6).map((s) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2 rounded-full shrink-0 inline-flex"
            style={{ backgroundColor: seriesColor(s) }}
          />
          <span className="text-xs text-neutral-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── KPI rail (2×2 stacked-bar tiles) ────────────────────────────────────── */

// Pre-compute static chart data at module scope so tile renders are cheap.
const SPEND_STACKED_ROWS    = makeStackedSpendRows();
const TOKENS_STACKED_ROWS   = makeStackedTokenRows();
const REQUESTS_STACKED_ROWS = makeStackedRequestRows();
const THREATS_STACKED_ROWS  = makeStackedThreatsRows();

const MODEL_SERIES = SPEND_SERIES['model'];


const fmtSpend = (v: number) => formatCurrency(v, { minFrac: 0, maxFrac: 0 });

function KpiRail() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Spend tile */}
      <div className="rounded-md border border-border bg-card shadow-xs overflow-hidden">
        <CompactKpi
          flat
          title="Total spent"
          value={formatCurrency(TOTAL_7D_BASE_DOLLARS, { minFrac: 0, maxFrac: 0 })}
          delta="+12.6%"
          deltaNote="vs last week"
          deltaSize="md"
          onClick={() => navigate('/activity?range=7d')}
          ariaLabel="Weekly spend — open Activity for the last 7 days"
        />
        <div className="px-4 pt-2 pb-2">
          <StackedKpiChart
            data={SPEND_STACKED_ROWS}
            series={MODEL_SERIES}
            yFormatter={fmtSpend}
          />
        </div>
        <HorizontalLegend series={MODEL_SERIES} />
      </div>

      {/* Tokens tile */}
      <div className="rounded-md border border-border bg-card shadow-xs overflow-hidden">
        <CompactKpi
          flat
          title="Tokens used"
          value={fmtTokens(TOTAL_7D_BASE_TOKENS)}
          delta="+8.7%"
          deltaNote="vs last week"
          deltaSize="md"
          onClick={() => navigate('/activity?range=7d')}
          ariaLabel="Weekly tokens — open Activity for the last 7 days"
        />
        <div className="px-4 pt-2 pb-2">
          <StackedKpiChart
            data={TOKENS_STACKED_ROWS}
            series={MODEL_SERIES}
            yFormatter={fmtTokens}
          />
        </div>
        <HorizontalLegend series={MODEL_SERIES} />
      </div>

      {/* Requests tile */}
      <div className="rounded-md border border-border bg-card shadow-xs overflow-hidden">
        <CompactKpi
          flat
          title="Requests sent"
          value={formatNumber(TOTAL_7D_BASE_REQUESTS)}
          delta="+8.2%"
          deltaNote="vs last week"
          deltaSize="md"
          onClick={() => navigate('/activity?range=7d')}
          ariaLabel="Weekly requests — open Activity for the last 7 days"
        />
        <div className="px-4 pt-2 pb-2">
          <StackedKpiChart
            data={REQUESTS_STACKED_ROWS}
            series={REQUEST_STATUS_SERIES}
            yFormatter={formatNumber}
          />
        </div>
        <HorizontalLegend series={REQUEST_STATUS_SERIES} />
      </div>

      {/* Threats tile */}
      <div className="rounded-md border border-border bg-card shadow-xs overflow-hidden">
        <CompactKpi
          flat
          title="Security events"
          value={formatNumber(THREATS_DETECTED_COUNT)}
          delta="+12.4%"
          deltaNote="vs last week"
          deltaSize="md"
          onClick={() => navigate('/security')}
          ariaLabel="Security events — open the Security event log"
        />
        <div className="px-4 pt-2 pb-2">
          <StackedKpiChart
            data={THREATS_STACKED_ROWS}
            series={THREATS_STATUS_SERIES}
            yFormatter={formatNumber}
          />
        </div>
        <HorizontalLegend series={THREATS_STATUS_SERIES} />
      </div>
    </div>
  );
}

/* ─── KPI rail — empty state ─────────────────────────────────────────────── */

const PLACEHOLDER_TILES = [
  'No spend this week',
  'No requests this week',
  'No tokens this week',
  'No threats this week',
] as const;

function KpiRailEmpty() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {PLACEHOLDER_TILES.map((label) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-card shadow-xs p-6 min-h-[120px]"
        >
          <BarChart2 className="size-6 text-neutral-500" strokeWidth={1.5} aria-hidden />
          <span className="text-sm text-neutral-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Quick-step card shell ──────────────────────────────────────────────── */

function QuickStepCard({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card density="flush">
      <div className="p-6 flex gap-4 items-start">
        <div className="shrink-0 size-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-mono text-neutral-600">
          {number}
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium text-neutral-900 m-0">{title}</h3>
            <p className="text-sm text-neutral-500 m-0">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </Card>
  );
}

/* ─── Code panel with syntax highlighting ───────────────────────────────── */

const KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var',
  'await', 'new', 'async', 'function', 'return', 'class',
]);

type CodeToken = { text: string; type: 'keyword' | 'string' | 'plain' };

function tokenizeLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === ch) { j++; break; }
        j++;
      }
      tokens.push({ text: line.slice(i, j), type: 'string' });
      i = j;
    } else if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ text: word, type: KEYWORDS.has(word) ? 'keyword' : 'plain' });
      i = j;
    } else {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'plain') {
        tokens[tokens.length - 1].text += ch;
      } else {
        tokens.push({ text: ch, type: 'plain' });
      }
      i++;
    }
  }
  return tokens;
}

function CodePanel({ snippet }: { snippet: string }) {
  const lines = snippet.split('\n');
  return (
    <div className="p-4 overflow-x-auto">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-4 leading-relaxed">
          <span className="font-mono text-xs text-neutral-400 select-none tabular-nums w-4 text-right shrink-0">
            {i + 1}
          </span>
          <span className="font-mono text-xs whitespace-pre flex-1">
            {tokenizeLine(line).map((tok, j) =>
              tok.type === 'keyword' ? (
                <span key={j} className="text-[#818CF8]">{tok.text}</span>
              ) : tok.type === 'string' ? (
                <span key={j} className="text-[#F87171]">{tok.text}</span>
              ) : (
                <span key={j} className="text-neutral-800">{tok.text}</span>
              )
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Hero card ──────────────────────────────────────────────────────────── */

function HeroCard() {
  const navigate = useNavigate();
  const [activeHeroTab, setActiveHeroTab] = useState<'anthropic' | 'openai' | 'google'>('anthropic');

  return (
    <Card density="flush">
      <div className="flex">
        {/* Left panel — existing content */}
        <div className="flex-1 flex flex-col">
          <div className="p-8 flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 m-0">
                Start using Constellation Gate AI
              </h2>
              <p className="text-sm text-neutral-500 text-pretty max-w-md m-0">
                Built on the AI SDK, Constellation Gate lets you switch between hundreds of models without managing rate limits or provider accounts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate('/api-keys')}>
                <Plus className="size-4" data-icon="inline-start" /> Create key
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://docs.constellationgate.ai', '_blank')}
              >
                Read API docs <ExternalLink className="size-4" />
              </Button>
            </div>
          </div>
          <div className="border-t border-border px-8 py-4 flex items-center gap-4">
            <span className="text-sm text-neutral-500">Works with</span>
            {[
              { Icon: OpenAIIcon,    name: 'OpenAI' },
              { Icon: GrokIcon,      name: 'xAI' },
              { Icon: AnthropicIcon, name: 'Anthropic' },
              { Icon: GeminiIcon,    name: 'Google' },
              { Icon: MetaIcon,      name: 'Meta' },
              { Icon: MistralIcon,   name: 'Mistral' },
            ].map(({ Icon, name }) => (
              <div key={name} className="flex items-center gap-2">
                <Icon className="size-4 text-neutral-600 shrink-0" />
                <span className="text-sm text-neutral-700">{name}</span>
              </div>
            ))}
            <span className="text-sm text-neutral-400 italic">+ many more</span>
          </div>
        </div>

        {/* Right panel — code snippet */}
        <div className="flex-1 border-l border-border flex flex-col">
          <Tabs defaultValue="anthropic" className="flex flex-col flex-1" onValueChange={(v) => setActiveHeroTab(v as 'anthropic' | 'openai' | 'google')}>
            <div className="flex items-center justify-between px-4 border-b border-border">
              <TabsList variant="line" className="px-0 border-b-0">
                <TabsTrigger value="anthropic">
                  <AnthropicIcon className="size-4" />Anthropic
                </TabsTrigger>
                <TabsTrigger value="openai">
                  <OpenAIIcon className="size-4" />OpenAI
                </TabsTrigger>
                <TabsTrigger value="google">
                  <GeminiIcon className="size-4" />Google
                </TabsTrigger>
              </TabsList>
              <CopyButton mode="label" text="Copy code" value={HERO_SNIPPETS[activeHeroTab]} label="code snippet" />
            </div>
            <TabsContent value="anthropic" className="flex-1 mt-0">
              <CodePanel snippet={HERO_ANTHROPIC_SNIPPET} />
            </TabsContent>
            <TabsContent value="openai" className="flex-1 mt-0">
              <CodePanel snippet={HERO_OPENAI_SNIPPET} />
            </TabsContent>
            <TabsContent value="google" className="flex-1 mt-0">
              <CodePanel snippet={HERO_GOOGLE_SNIPPET} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}

/* ─── Quick-start steps ──────────────────────────────────────────────────── */

function QuickStartSteps() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <QuickStepCard
        number={1}
        title="Read the docs"
        description="Get familiar with Gate AI architecture, authentication, and routing concepts."
      >
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('https://docs.constellationgate.ai', '_blank')}
          >
            Open docs <ExternalLink className="size-4" />
          </Button>
        </div>
      </QuickStepCard>

      <QuickStepCard
        number={2}
        title="Create an API key"
        description="Gate AI uses its own API keys to authenticate requests and track usage per key."
      >
        <div>
          <Button size="sm" onClick={() => navigate('/api-keys')}>
            Create key
          </Button>
        </div>
      </QuickStepCard>

      <QuickStepCard
        number={3}
        title="Connect your SDK"
        description="Point your provider SDK at the gateway URL and set your credentials as environment variables."
      >
        <Tabs defaultValue="anthropic">
          <TabsList variant="line" className="px-0">
            <TabsTrigger value="anthropic">
              <AnthropicIcon className="size-4" />Anthropic
            </TabsTrigger>
            <TabsTrigger value="openai">
              <OpenAIIcon className="size-4" />OpenAI
            </TabsTrigger>
            <TabsTrigger value="google">
              <GeminiIcon className="size-4" />Google
            </TabsTrigger>
          </TabsList>
          <TabsContent value="anthropic" className="pt-4">
            <ProviderSnippet snippet={ANTHROPIC_SNIPPET} />
          </TabsContent>
          <TabsContent value="openai" className="pt-4">
            <ProviderSnippet snippet={OPENAI_SNIPPET} />
          </TabsContent>
          <TabsContent value="google" className="pt-4">
            <ProviderSnippet snippet={GOOGLE_SNIPPET} />
          </TabsContent>
        </Tabs>
      </QuickStepCard>

      <QuickStepCard
        number={4}
        title="Set a spend limit"
        description="Add a guardrail to cap monthly spend and prevent runaway costs."
      >
        <div>
          <Button size="sm" variant="outline" onClick={() => navigate('/guardrails?create=1')}>
            Set limit
          </Button>
        </div>
      </QuickStepCard>

      <QuickStepCard
        number={5}
        title="Add a security policy"
        description="Configure injection detection, PII redaction, and credential scanning."
      >
        <div>
          <Button size="sm" variant="outline" onClick={() => navigate('/policies')}>
            Add policy
          </Button>
        </div>
      </QuickStepCard>

      <QuickStepCard
        number={6}
        title="Invite your team"
        description="Give teammates access with scoped roles and per-key usage visibility."
      >
        <div>
          <Button size="sm" variant="outline" onClick={() => navigate('/team')}>
            Invite team
          </Button>
        </div>
      </QuickStepCard>
    </div>
  );
}

/* ─── Your first steps ───────────────────────────────────────────────────── */

type SetupStep = {
  label: string;
  icon: LucideIcon;
  href?: string;
  onNavigate?: () => void;
  onModal?: () => void;
  external?: boolean;
};

type SetupLane = {
  title: string;
  description: string;
  steps: SetupStep[];
};

const SETUP_LANES: SetupLane[] = [
  {
    title: 'Connect',
    description: 'Create an API key, connect your SDK to the gateway, and start routing requests.',
    steps: [
      { label: 'Read API docs',          icon: BookOpen,      href: undefined, external: true },
      { label: 'Create an API key',      icon: KeyRound,      href: '/api-keys' },
      { label: 'Connect your SDK',       icon: Terminal,      onModal: undefined },
      { label: 'Browse models',          icon: Layers,        href: '/models' },
    ],
  },
  {
    title: 'Configure',
    description: 'Set spend limits, add security policies, and invite your team to manage access.',
    steps: [
      { label: 'Set a spend limit',        icon: Gauge,       href: '/guardrails?create=1' },
      { label: 'Add a security policy',   icon: ShieldCheck, href: '/policies' },
      { label: 'Invite team members',     icon: Users,       href: '/team' },
      { label: 'Manage billing & plan',   icon: CreditCard,  href: '/billing' },
    ],
  },
  {
    title: 'Verify',
    description: 'Confirm requests are routing and security events are captured on the audit trail.',
    steps: [
      { label: 'View your requests',      icon: ArrowLeftRight, href: '/requests' },
      { label: 'Review security events', icon: ScanSearch,     href: '/security' },
      { label: 'Check the audit trail',  icon: ClipboardList,  href: '/audit-trail' },
      { label: 'Review token savings',   icon: Coins,          href: '/token-savings' },
    ],
  },
];

function FirstStepsSection() {
  const navigate = useNavigate();
  const [sdkModalOpen, setSdkModalOpen] = useState(false);

  // Resolve callbacks now that we have access to navigate + setSdkModalOpen.
  const resolvedLanes = SETUP_LANES.map((lane) => ({
    ...lane,
    steps: lane.steps.map((step) => {
      if (step.label === 'Read API docs') {
        return { ...step, onNavigate: () => window.open('https://docs.constellationgate.ai', '_blank'), external: true };
      }
      if (step.label === 'Connect your SDK') {
        return { ...step, onModal: () => setSdkModalOpen(true) };
      }
      return step;
    }),
  }));

  return (
    <>
      <div className="flex flex-col gap-3">
        <h3 className="font-sans text-lg/6 font-medium tracking-snug text-neutral-900 m-0">
          Quick links
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {resolvedLanes.map((lane) => (
            <Card key={lane.title} density="flush">
              <div className="flex flex-col gap-1 px-4 py-3 border-b border-border">
                <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
                  {lane.title}
                </h3>
                <p className="text-xs text-neutral-500 text-pretty m-0 line-clamp-2">{lane.description}</p>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {lane.steps.map((step) => (
                  <StepItem
                    key={step.label}
                    label={step.label}
                    icon={step.icon}
                    onNavigate={step.onNavigate ?? (step.href ? () => navigate(step.href!) : undefined)}
                    onModal={step.onModal}
                    external={step.external}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <ConnectSdkModal open={sdkModalOpen} onOpenChange={setSdkModalOpen} />
    </>
  );
}

function StepItem({
  label,
  icon: Icon,
  onNavigate,
  onModal,
  external,
}: {
  label: string;
  icon: LucideIcon;
  href?: string;
  onNavigate?: () => void;
  onModal?: () => void;
  external?: boolean;
}) {
  const clickHandler = onNavigate ?? onModal;
  const TrailingIcon = external ? ExternalLink : ChevronRight;
  const inner = (
    <>
      <Icon className="shrink-0 size-4 text-neutral-500" strokeWidth={1.75} aria-hidden />
      <span className="flex-1 text-sm text-neutral-900">{label}</span>
      {clickHandler ? (
        <TrailingIcon className="shrink-0 size-4 text-neutral-400" strokeWidth={1.75} aria-hidden />
      ) : null}
    </>
  );

  if (clickHandler) {
    return (
      <button
        type="button"
        onClick={clickHandler}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-card hover:bg-neutral-100 outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {inner}
    </div>
  );
}

/* ─── Connect SDK modal ──────────────────────────────────────────────────── */

const GATEWAY_URL = 'https://gateway-staging.constellationgate.ai';
const GATEWAY_KEY_PLACEHOLDER = 'sk-gw-…YOUR_KEY';

const HERO_ANTHROPIC_SNIPPET =
`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  baseURL: "${GATEWAY_URL}",
  apiKey: "${GATEWAY_KEY_PLACEHOLDER}",
});

const msg = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.content);`;

const HERO_OPENAI_SNIPPET =
`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATEWAY_URL}",
  apiKey: "${GATEWAY_KEY_PLACEHOLDER}",
});

const msg = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.choices[0].message.content);`;

const HERO_GOOGLE_SNIPPET =
`import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("${GATEWAY_KEY_PLACEHOLDER}");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const result = await model.generateContent("Hello!");
console.log(result.response.text());`;

const HERO_SNIPPETS: Record<string, string> = {
  anthropic: HERO_ANTHROPIC_SNIPPET,
  openai: HERO_OPENAI_SNIPPET,
  google: HERO_GOOGLE_SNIPPET,
};

const ANTHROPIC_SNIPPET =
`export ANTHROPIC_AUTH_TOKEN="sk-ant-oat01-<your-token>"
export ANTHROPIC_BASE_URL="${GATEWAY_URL}"
export ANTHROPIC_CUSTOM_HEADERS="X-Gateway-Api-Key: ${GATEWAY_KEY_PLACEHOLDER}"`;

const OPENAI_SNIPPET =
`export OPENAI_BASE_URL="${GATEWAY_URL}"
export OPENAI_API_KEY="${GATEWAY_KEY_PLACEHOLDER}"`;

const GOOGLE_SNIPPET =
`export GOOGLE_BASE_URL="${GATEWAY_URL}"
export GOOGLE_API_KEY="${GATEWAY_KEY_PLACEHOLDER}"`;

function ProviderSnippet({ snippet }: { snippet: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-neutral-100 p-4">
        <pre className="font-mono text-xs text-neutral-800 whitespace-pre overflow-x-auto leading-relaxed m-0">{snippet}</pre>
      </div>
      <div className="flex justify-end">
        <CopyButton mode="label" value={snippet} label="setup snippet" text="Copy code" />
      </div>
    </div>
  );
}

function ConnectSdkModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollContent className="sm:max-w-[560px]">
        <DialogScrollHeader>
          <DialogTitleBlock>Connect your SDK</DialogTitleBlock>
          <DialogDescription>
            Set these variables before launching your tool. Your provider credentials pass through Gate AI — we never store them.
          </DialogDescription>
        </DialogScrollHeader>
        <DialogScrollBody>
          <Tabs defaultValue="anthropic">
            <TabsList variant="line" className="px-0">
              <TabsTrigger value="anthropic"><AnthropicIcon className="size-4" />Anthropic</TabsTrigger>
              <TabsTrigger value="openai"><OpenAIIcon className="size-4" />OpenAI</TabsTrigger>
              <TabsTrigger value="google"><GeminiIcon className="size-4" />Google</TabsTrigger>
            </TabsList>
            <TabsContent value="anthropic" className="pt-4">
              <p className="text-xs text-neutral-500 mb-4">
                For Claude Code and the Anthropic SDK. You'll also need your Anthropic OAuth token from{' '}
                <code className="font-mono">~/.claude/.credentials.json</code>.
              </p>
              <ProviderSnippet snippet={ANTHROPIC_SNIPPET} />
            </TabsContent>
            <TabsContent value="openai" className="pt-4">
              <p className="text-xs text-neutral-500 mb-4">
                For Codex CLI, Cursor, and any OpenAI-compatible SDK.
              </p>
              <ProviderSnippet snippet={OPENAI_SNIPPET} />
            </TabsContent>
            <TabsContent value="google" className="pt-4">
              <p className="text-xs text-neutral-500 mb-4">
                For Gemini API and Vertex AI SDK.
              </p>
              <ProviderSnippet snippet={GOOGLE_SNIPPET} />
            </TabsContent>
          </Tabs>
        </DialogScrollBody>
        <DialogScrollFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogScrollFooter>
      </DialogScrollContent>
    </Dialog>
  );
}
