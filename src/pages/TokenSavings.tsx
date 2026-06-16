import { useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { KpiRail } from "@/components/ui/kpi-rail";
import { KpiTile } from "@/components/ui/kpi-tile";
import { PageTitle } from "@/components/ui/page-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatSparkLabel } from "@/lib/formatters";

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
      <SavingsOptionsSection />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <PageTitle>Token Savings</PageTitle>
      <p className="m-0 max-w-1/2 text-pretty font-sans text-base text-neutral-500 tracking-tight">
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
        <h3 className="m-0 font-medium font-sans text-neutral-900 text-xl/7">
          Overview
        </h3>
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

function SavingsOptionsSection() {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="m-0 font-medium font-sans text-neutral-900 text-xl/7">
          Savings options
        </h3>
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
    <CardHeader className="border-border border-b">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="m-0 font-medium font-sans text-base text-neutral-900">
            {title}
          </h3>
          <p className="m-0 font-sans text-neutral-500 text-sm">
            {description}
          </p>
        </div>
        <Badge variant={enabled ? "success" : "neutral"}>
          {enabled ? "ON" : "OFF"}
        </Badge>
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
        description="Reuse identical or semantically similar responses"
        enabled={enabled}
        title="Caching"
      />
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p
              className="m-0 font-medium font-sans text-neutral-900 text-sm"
              id="caching-switch-label"
            >
              Enable response caching
            </p>
            <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
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
              toast.success("Response caching saved");
            }}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p
              className="m-0 font-medium font-sans text-neutral-900 text-sm"
              id="ttl-label"
            >
              TTL
            </p>
            <p className="m-0 font-sans text-neutral-500 text-sm">
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
  );
}

function CompressionCard() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Card>
      <CardChromeHeader
        description="Shrink prompts before they reach the provider"
        enabled={enabled}
        title="Compression"
      />
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p
              className="m-0 font-medium font-sans text-neutral-900 text-sm"
              id="compression-switch-label"
            >
              Enable compression
            </p>
            <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
              Strip envelopes, condense embedded tool output (git diff, cargo,
              pytest…), and apply lossless prose heuristics. Deterministic and
              cache-friendly.
            </p>
          </div>
          <Switch
            aria-labelledby="compression-switch-label"
            checked={enabled}
            className="mt-1 shrink-0"
            onCheckedChange={setEnabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
