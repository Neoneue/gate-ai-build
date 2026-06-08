import { useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CompactSpark } from '@/components/ui/compact-kpi';
import { SegmentedPill } from '@/components/ui/segmented-pill';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { KpiRail } from '@/components/ui/kpi-rail';
import { KpiTile } from '@/components/ui/kpi-tile';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { DashboardChrome } from '@/layouts/DashboardChrome';

export function TokenSavings() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  // Range selector defaults to All on load (every page's landing state); read
  // `?range=` once for deep-links, then one-way (manual changes don't sync back).
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<Range>(() => {
    const r = searchParams.get('range');
    return r === '24h' || r === '7d' || r === '30d' || r === 'all' ? r : 'all';
  });
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  return (
    <DashboardChrome
      activeNavId="token-savings"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <OverviewSection
        range={range}
        customRange={customRange}
        onRangeChange={(r) => { setRange(r); setCustomRange(null); }}
        onCustomRangeChange={(r) => {
          if (r) { setCustomRange(r); setRange('custom'); }
          else { setCustomRange(null); setRange('all'); }
        }}
      />
      <SavingsOptionsSection />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <PageTitle>Token Savings</PageTitle>
      <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0 max-w-1/2">
        Cache, compress and deduplicate to spend less per request.
      </p>
    </div>
  );
}

/* ─── KPI rail ──────────────────────────────────────────────────────── */

type PresetRange = 'all' | '24h' | '7d' | '30d';
type Range = PresetRange | 'custom';
type CustomRange = { from: Date; to: Date };

const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

const RANGE_DELTA_NOTE: Record<Range, string> = {
  all: 'All time',
  '24h': 'vs prior day',
  '7d': 'vs prior week',
  '30d': 'vs prior month',
  custom: 'vs prior range',
};

// Savings is a RATE, so it stays roughly stable across windows (it does not
// accumulate like a total). Each window shows a slightly different rate, and
// every tile's sparkline ENDS at its headline value so the trend reconciles.
// Total saved === caching + compression (rounded): all 0.15+13.7≈13.9,
// 7d 0.18+14.0≈14.2, 30d 0.14+13.4≈13.5, 24h 0.11+12.7≈12.8.
const KPI_COLORS = {
  total: 'var(--color-chart-1)',
  caching: 'var(--color-chart-3)',
  compression: 'var(--color-chart-7)',
} as const;
type SavingsKpi = { title: string; value: string; colorVar: string; spark: number[] };
const KPI_BY_RANGE: Record<PresetRange, SavingsKpi[]> = {
  // All time / 30d show the lifetime ramp: savings start near 0% and climb
  // steeply as the cache warms and compression heuristics learn the workload,
  // then begin to plateau near the steady-state rate (ease-out curve). The
  // shorter windows (24h / 7d) sit in the plateau, so they barely move.
  all: [
    { title: 'Total saved', value: '13.9', colorVar: KPI_COLORS.total, spark: [0.4, 2.9, 6.4, 9.6, 11.9, 13.3, 13.9] },
    { title: 'Caching', value: '0.15', colorVar: KPI_COLORS.caching, spark: [0.0, 0.02, 0.05, 0.09, 0.12, 0.14, 0.15] },
    { title: 'Compression', value: '13.7', colorVar: KPI_COLORS.compression, spark: [0.4, 2.7, 6.1, 9.3, 11.7, 13.1, 13.7] },
  ],
  '24h': [
    { title: 'Total saved', value: '12.8', colorVar: KPI_COLORS.total, spark: [12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.8] },
    { title: 'Caching', value: '0.11', colorVar: KPI_COLORS.caching, spark: [0.09, 0.09, 0.10, 0.10, 0.11, 0.11, 0.11] },
    { title: 'Compression', value: '12.7', colorVar: KPI_COLORS.compression, spark: [12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.7] },
  ],
  '7d': [
    { title: 'Total saved', value: '14.2', colorVar: KPI_COLORS.total, spark: [12.4, 12.8, 13.2, 13.5, 13.8, 14.0, 14.2] },
    { title: 'Caching', value: '0.18', colorVar: KPI_COLORS.caching, spark: [0.13, 0.14, 0.15, 0.16, 0.17, 0.17, 0.18] },
    { title: 'Compression', value: '14.0', colorVar: KPI_COLORS.compression, spark: [12.3, 12.7, 13.1, 13.4, 13.7, 13.9, 14.0] },
  ],
  '30d': [
    { title: 'Total saved', value: '13.5', colorVar: KPI_COLORS.total, spark: [0.5, 3.1, 6.7, 9.8, 12.0, 13.1, 13.5] },
    { title: 'Caching', value: '0.14', colorVar: KPI_COLORS.caching, spark: [0.0, 0.02, 0.05, 0.08, 0.11, 0.13, 0.14] },
    { title: 'Compression', value: '13.4', colorVar: KPI_COLORS.compression, spark: [0.5, 2.9, 6.3, 9.5, 11.7, 13.0, 13.4] },
  ],
};

// Delta = change across the displayed window (last point − first point), so the
// tag can never contradict the sparkline. Sub-1-point moves keep 2 decimals
// (caching), larger moves 1 decimal. Always a percentage-point delta.
function sparkDelta(spark: number[]): string {
  const d = spark[spark.length - 1] - spark[0];
  const decimals = Math.abs(d) < 1 ? 2 : 1;
  return `${d >= 0 ? '+' : '-'}${Math.abs(d).toFixed(decimals)}%`;
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
  const kpis = KPI_BY_RANGE[range === 'custom' ? 'all' : range];
  const note = RANGE_DELTA_NOTE[range];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-sans text-xl/7 font-medium text-neutral-900 m-0">Overview</h3>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedPill
            size="sm"
            aria-label="Time range"
            options={RANGE_OPTIONS}
            value={range === 'custom' ? '' : range}
            onValueChange={(v) => onRangeChange(v as PresetRange)}
          />
          <DateRangePicker value={customRange} onChange={onCustomRangeChange} size="sm" />
        </div>
      </div>
      <KpiRail columns={3}>
        {kpis.map((k) => (
          <KpiTile
            key={k.title}
            title={k.title}
            value={k.value}
            valueSuffix="%"
            delta={sparkDelta(k.spark)}
            deltaNote={note}
            deltaRow
            spark={<CompactSpark colorVar={k.colorVar} data={[...k.spark]} />}
          />
        ))}
      </KpiRail>
    </div>
  );
}

/* ─── Savings options ───────────────────────────────────────────────── */

function SavingsOptionsSection() {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-sans text-xl/7 font-medium text-neutral-900 m-0">Savings options</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CachingCard />
        <CompressionCard />
      </div>
    </div>
  );
}

function CardChromeHeader({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <CardHeader className="border-b border-border">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h3 className="font-sans text-base font-medium text-neutral-900 m-0">
            {title}
          </h3>
          <p className="font-sans text-sm text-neutral-500 m-0">{description}</p>
        </div>
        <Badge variant={enabled ? 'success' : 'neutral'}>
          {enabled ? 'ON' : 'OFF'}
        </Badge>
      </div>
    </CardHeader>
  );
}

const TTL_OPTIONS = [
  { value: '5m', label: '5m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
] as const;

function CachingCard() {
  const [enabled, setEnabled] = useState(true);
  const [ttl, setTtl] = useState('1h');

  return (
    <Card>
      <CardChromeHeader
        title="Caching"
        description="Reuse identical or semantically similar responses"
        enabled={enabled}
      />
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p id="caching-switch-label" className="font-sans text-sm font-medium text-neutral-900 m-0">
              Enable response caching
            </p>
            <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
              Serve cached responses instead of round-tripping to providers. Identical concurrent requests are deduplicated automatically.
            </p>
          </div>
          <Switch
            aria-labelledby="caching-switch-label"
            checked={enabled}
            onCheckedChange={(next) => {
              setEnabled(next);
              toast.success('Response caching saved');
            }}
            className="mt-1 shrink-0"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p id="ttl-label" className="font-sans text-sm font-medium text-neutral-900 m-0">
              TTL
            </p>
            <p className="font-sans text-sm text-neutral-500 m-0">
              How long cached entries live before re-fetching.
            </p>
          </div>
          <Select
            value={ttl}
            onValueChange={(next) => {
              setTtl(next);
              toast.success('TTL saved');
            }}
          >
            <SelectTrigger className="w-24 shrink-0" aria-labelledby="ttl-label">
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
  );
}

function CompressionCard() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Card>
      <CardChromeHeader
        title="Compression"
        description="Shrink prompts before they reach the provider"
        enabled={enabled}
      />
      <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <p id="compression-switch-label" className="font-sans text-sm font-medium text-neutral-900 m-0">
                Enable compression
              </p>
              <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
                Strip envelopes, condense embedded tool output (git diff, cargo, pytest…), and apply lossless prose heuristics. Deterministic and cache-friendly.
              </p>
            </div>
            <Switch
              aria-labelledby="compression-switch-label"
              checked={enabled}
              onCheckedChange={setEnabled}
              className="mt-1 shrink-0"
            />
          </div>
        </CardContent>
    </Card>
  );
}
