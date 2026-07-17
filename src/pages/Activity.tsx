import { Key } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import type { Vendor } from "@/components/icons/vendor-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
import { Monogram } from "@/components/ui/monogram";
import type { AvatarTone } from "@/components/ui/monogram-types";
import { PageTitle } from "@/components/ui/page-title";
import { SearchInput } from "@/components/ui/search-input";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import { Switch } from "@/components/ui/switch";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { UploadIcon } from "@/components/ui/upload";
import { parseNumeric, sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatSparkLabel } from "@/lib/formatters";
import {
  type CustomRange,
  effectiveScale,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
} from "@/lib/range";
import {
  ACTIVITY_SAVINGS_RATE_7D,
  API_KEY_ROWS,
  distributeSeries,
  METRIC_OPTIONS,
  type Metric,
  savingsRateFor,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_REQUESTS,
  TOTAL_7D_BASE_TOKENS,
} from "@/pages/activity-data";
import { attackTypeCounts } from "@/pages/security/events-data";
import { TYPE_META } from "@/pages/security-data";
import {
  fmtInt,
  fmtTokens,
  fmtUsd,
  getBucketCount,
  getRangeDates,
} from "./activity/chart-helpers";
import { TrendCard } from "./activity/TrendCard";

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

/** Page-level metric lens — drives the trend chart + the 3 Top-by-axis
 *  cards (not the KPI rail, which always shows all metrics). Default is
 *  `tokens`. */

export function Activity() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Deep-link support: `?range=24h|7d|30d|all` lets Overview's KPI tiles
  // drop the user into the right slice in one click. Read once via a lazy
  // initializer, then ignore: manual range changes do not sync back to the
  // URL (one-way), mirroring the Conversations `?open=` pattern. Defaults to
  // `all`, the intended landing state for every page's range selector.
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<Range>(() => {
    const r = searchParams.get("range");
    return r === "24h" || r === "7d" || r === "30d" || r === "all" ? r : "all";
  });
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  return (
    <DashboardChrome
      activeNavId="activity"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
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
        <KpiRail customRange={customRange} range={range} />
        <TrendCard customRange={customRange} range={range} />
      </div>
      <TopByAxisRow customRange={customRange} range={range} />
      <UsageByKey customRange={customRange} range={range} />
    </DashboardChrome>
  );
}

/* ─── Page header — title + subtitle on left, range pill on right ───────── */

function PageHeader() {
  return (
    <div className="flex max-w-full flex-col gap-2 xl:max-w-1/2">
      <PageTitle>Activity</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        Cost, request volume, and token usage by model, API key, and team
        member.
      </p>
    </div>
  );
}

/* ─── KPI rail (3-up, range-aware) ──────────────────────────────────────── */

// Only `delta` is hand-authored per range; the KPI value and sparkline are
// both computed in getKpiSpec from TOTAL_7D_BASE_* × effectiveScale, so the
// KPI rail cannot drift from the Spend / Requests / Tokens over-time charts.
type KpiSpec = { delta: string };

const KPI_DATA: Record<
  PresetRange,
  { spend: KpiSpec; requests: KpiSpec; tokens: KpiSpec }
> = {
  all: {
    spend: { delta: "+24.8%" },
    requests: { delta: "+19.3%" },
    tokens: { delta: "+17.6%" },
  },
  "24h": {
    spend: { delta: "+4.1%" },
    requests: { delta: "+2.6%" },
    tokens: { delta: "+3.2%" },
  },
  "7d": {
    spend: { delta: "+12.6%" },
    requests: { delta: "+8.2%" },
    tokens: { delta: "+8.7%" },
  },
  "30d": {
    spend: { delta: "+18.4%" },
    requests: { delta: "+14.7%" },
    tokens: { delta: "+13.2%" },
  },
};

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
    range === "all"
      ? 11
      : range === "24h"
        ? 47
        : range === "7d"
          ? 77
          : range === "30d"
            ? 303
            : 99;
  const spendSpark = distributeSeries(spendDollars, count, rangeSeed * 31 + 1);
  const requestsSpark = distributeSeries(
    requestsCount,
    count,
    rangeSeed * 31 + 2
  );
  const tokensSpark = distributeSeries(tokensCount, count, rangeSeed * 31 + 3);

  const base = KPI_DATA[range === "custom" ? "7d" : range];
  return {
    spend: {
      value: fmtUsd(spendDollars),
      delta: base.spend.delta,
      spark: spendSpark,
    },
    requests: {
      value: fmtInt(Math.round(requestsCount)),
      delta: base.requests.delta,
      spark: requestsSpark,
    },
    tokens: {
      value: fmtTokens(Math.round(tokensCount)),
      delta: base.tokens.delta,
      spark: tokensSpark,
    },
  };
}

// Delta trailing copy tied to the active range.
const RANGE_DELTA_NOTE: Record<Range, string> = {
  all: "All time",
  "24h": "vs prior day",
  "7d": "vs prior week",
  "30d": "vs prior month",
  custom: "vs prior range",
};

function KpiRail({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const k = getKpiSpec(range, customRange);
  const sparkLabels = getRangeDates(range, customRange).map((d) =>
    formatSparkLabel(d, range === "24h")
  );
  const note = RANGE_DELTA_NOTE[range];
  return (
    <KpiRailShell columns={3}>
      <CompactKpi
        delta={k.spend.delta}
        deltaNote={note}
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={k.spend.spark}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => fmtUsd(v)}
          />
        }
        title="Total Spend"
        value={k.spend.value}
      />
      <CompactKpi
        delta={k.requests.delta}
        deltaNote={note}
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-neutral-500)"
            data={k.requests.spark}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => fmtInt(Math.round(v))}
          />
        }
        title="Total Messages"
        value={k.requests.value}
      />
      <CompactKpi
        delta={k.tokens.delta}
        deltaNote={note}
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-3)"
            data={k.tokens.spark}
            labels={sparkLabels}
            tooltip
            valueFormatter={(v) => fmtTokens(Math.round(v))}
          />
        }
        title="Tokens Used"
        value={k.tokens.value}
      />
    </KpiRailShell>
  );
}

type ModelRow = {
  key: string;
  label: string;
  vendor: Vendor;
  requests: number;
  tokensIn: number;
  tokensOut: number;
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
// MODEL_ROWS is the source of truth for the Top Models card. tokensIn /
// tokensOut are the per-model workspace aggregates; the card computes total
// tokens at the call site (tokensIn + tokensOut). The trend breakdown panel
// no longer reads in/out — cumulative only; see TrendBreakdownPanel. The
// table at the bottom (UsageByKey) is where in/out lives. Production reads
// these from real traffic; replace the rows.
const MODEL_ROWS: ModelRow[] = [
  {
    key: "opus",
    label: "Claude Opus 4.7",
    vendor: "anthropic",
    requests: 34_400,
    tokensIn: 7_370_000,
    tokensOut: 6_030_000,
    spend: 120.6,
  },
  {
    key: "sonnet",
    label: "Claude Sonnet 4.5",
    vendor: "anthropic",
    requests: 14_900,
    tokensIn: 5_371_000,
    tokensOut: 1_179_000,
    spend: 35.4,
  },
  {
    key: "haiku",
    label: "Claude Haiku",
    vendor: "anthropic",
    requests: 25_030,
    tokensIn: 2_676_000,
    tokensOut: 1_784_000,
    spend: 8.5,
  },
  {
    key: "gpt",
    label: "GPT-5.1",
    vendor: "openai",
    requests: 6670,
    tokensIn: 1_859_000,
    tokensOut: 1_001_000,
    spend: 14.0,
  },
  {
    key: "gemini",
    label: "Gemini 3 Pro",
    vendor: "google",
    requests: 8720,
    tokensIn: 2_835_000,
    tokensOut: 1_215_000,
    spend: 9.5,
  },
  {
    key: "llama",
    label: "Llama 4.2 405B",
    vendor: "meta",
    requests: 5280,
    tokensIn: 936_000,
    tokensOut: 264_000,
    spend: 6.0,
  },
  {
    key: "mistral",
    label: "Mistral Large 3",
    vendor: "mistral",
    requests: 690,
    tokensIn: 247_000,
    tokensOut: 133_000,
    spend: 2.3,
  },
];

/* Three cards, one per entity — CTO 2026-05-13: "no reason to have 3 stat
 * sections about [models]. Make one about models, one about api keys, one
 * about users." Axes chosen so each card carries a distinct lens (and
 * doesn't duplicate the chart above): models by tokens, keys by requests,
 * users by spend. User aggregation groups API_KEY_ROWS by owner — owners
 * mirror Team.tsx MEMBER_ROWS so the workspace user list reconciles. */

/** Matches Team.tsx MEMBER_ROWS. Workspace users come from the team roster. */
const USER_TONE: Record<string, AvatarTone> = {
  "Chad Ponticas": "blue",
  "Kira Tan": "rose",
  "Mateus Silva": "emerald",
  "Jordan Lee": "amber",
};

type TopRow = {
  rowKey: string;
  label: string;
  labelClassName?: string;
  value: string;
  avatar: React.ReactNode;
};

function TopList<T extends string>({
  title,
  subtitle,
  rows,
  metric,
  options,
  onMetricChange,
}: {
  title: string;
  subtitle: string;
  rows: TopRow[];
  metric: T;
  options: { value: T; label: string }[];
  onMetricChange: (m: T) => void;
}) {
  return (
    <Card density="flush">
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="type-heading-16 m-0 text-foreground leading-snug">
            {title}
          </h3>
          <p className="type-copy-14 m-0 text-muted-foreground">{subtitle}</p>
        </div>
        <SegmentedPill
          aria-label="Chart metric"
          onValueChange={(v) => onMetricChange(v as T)}
          options={options}
          size="sm"
          value={metric}
        />
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {rows.map((row) => (
          <div className="flex min-w-0 items-center gap-2" key={row.rowKey}>
            {row.avatar}
            <span
              className={`type-copy-14 min-w-0 flex-1 truncate text-foreground ${row.labelClassName ?? ""}`}
              title={row.label}
            >
              {row.label}
            </span>
            <span className="type-mono-14 whitespace-nowrap text-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Hoisted: identical for every keyRow. Avoids re-creating the same JSX
 *  element inside the keyRows useMemo on every metric/scale change. */
const KEY_AVATAR = (
  <Key
    aria-hidden
    className="size-4 shrink-0 text-muted-foreground"
    strokeWidth={2}
  />
);

/* ─── Top attack types — Amount | Percent lens over the Security mix ────── */

type AttackMetric = "amount" | "percent";

const ATTACK_METRIC_OPTIONS: { value: AttackMetric; label: string }[] = [
  { value: "amount", label: "Amount" },
  { value: "percent", label: "Percent" },
];

/** Hoisted like KEY_AVATAR — icon + color per attack type, straight from
 *  the Security events table's TYPE_META mapping (PII/PHI merged). */
const attackAvatar = (kind: "pii" | "injection" | "credential") => {
  const { Icon, color } = TYPE_META[kind];
  return (
    <Icon
      aria-hidden
      className="size-4 shrink-0"
      strokeWidth={1.75}
      style={{ color }}
    />
  );
};
const ATTACK_AVATARS: Record<string, React.ReactNode> = {
  pii: attackAvatar("pii"),
  injection: attackAvatar("injection"),
  credential: attackAvatar("credential"),
};

function TopByAxisRow({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const scale = effectiveScale(range, customRange);

  // Each card owns its own metric lens — no shared state across the four.
  const [modelMetric, setModelMetric] = useState<Metric>("tokens");
  const [keyMetric, setKeyMetric] = useState<Metric>("tokens");
  const [userMetric, setUserMetric] = useState<Metric>("tokens");
  const [attackMetric, setAttackMetric] = useState<AttackMetric>("amount");

  // Spend → fmtUsd, with 2dp scaled values; tokens → fmtTokens (compact
  // "M"/"k") on rounded integers. Each card computes from its own metric.
  const modelRows: TopRow[] = useMemo(() => {
    const isSpend = modelMetric === "spend";
    return MODEL_ROWS.map((m) => ({
      key: m.key,
      label: m.label,
      vendor: m.vendor,
      axis: isSpend ? m.spend * scale : (m.tokensIn + m.tokensOut) * scale,
    }))
      .sort((a, b) => b.axis - a.axis)
      .slice(0, 4)
      .map((m) => ({
        rowKey: m.key,
        label: m.label,
        value: isSpend
          ? fmtUsd(+m.axis.toFixed(2))
          : fmtTokens(Math.round(m.axis)),
        avatar: <VendorAvatar vendor={m.vendor} />,
      }));
  }, [scale, modelMetric]);

  const keyRows: TopRow[] = useMemo(() => {
    const isSpend = keyMetric === "spend";
    return API_KEY_ROWS.map((k) => ({
      key: k.key,
      label: k.label,
      axis: isSpend ? k.spend * scale : (k.tokensIn + k.tokensOut) * scale,
    }))
      .sort((a, b) => b.axis - a.axis)
      .slice(0, 4)
      .map((k) => ({
        rowKey: k.key,
        label: k.label,
        labelClassName: "font-mono",
        value: isSpend
          ? fmtUsd(+k.axis.toFixed(2))
          : fmtTokens(Math.round(k.axis)),
        avatar: KEY_AVATAR,
      }));
  }, [scale, keyMetric]);

  const userRows: TopRow[] = useMemo(() => {
    const isSpend = userMetric === "spend";
    // Spend leaderboard counts workspace ("Gate") spend only. A member who
    // owns ANY BYOK key isn't a workspace spender — their token usage runs
    // on their own provider keys, so excluding them from Spend is the
    // honest read. Token volume aggregates across every key the member
    // owns (Gate + BYOK), so all four members appear under Tokens.
    const memberHasByok = new Set<string>();
    if (isSpend) {
      for (const k of API_KEY_ROWS) {
        if (k.path === "BYOK") {
          memberHasByok.add(k.owner);
        }
      }
    }
    const agg = new Map<string, { owner: string; axis: number }>();
    for (const k of API_KEY_ROWS) {
      if (isSpend && memberHasByok.has(k.owner)) {
        continue;
      }
      const existing = agg.get(k.owner) ?? { owner: k.owner, axis: 0 };
      existing.axis += (isSpend ? k.spend : k.tokensIn + k.tokensOut) * scale;
      agg.set(k.owner, existing);
    }
    return [...agg.values()]
      .sort((a, b) => b.axis - a.axis)
      .slice(0, 4)
      .map((u) => ({
        rowKey: u.owner,
        label: u.owner,
        value: isSpend
          ? fmtUsd(+u.axis.toFixed(2))
          : fmtTokens(Math.round(u.axis)),
        avatar: (
          <Monogram
            initials={(
              u.owner.trim().split(/\s+/)[0]?.[0] ?? "?"
            ).toUpperCase()}
            size="sm"
            tone={USER_TONE[u.owner] ?? "ink"}
          />
        ),
      }));
  }, [scale, userMetric]);

  // Counts come from the shared Security attack mix (attackTypeCounts), so
  // this card and Security's Attack-types card show the SAME integers for
  // every range. Percent = each type's share of the attack-type sum,
  // derived from those rounded counts.
  const attackRows: TopRow[] = useMemo(() => {
    const counts = attackTypeCounts(range, customRange);
    const totalCount = counts.reduce((a, c) => a + c.count, 0) || 1;
    return counts.map((c) => ({
      rowKey: c.key,
      label: c.label,
      value:
        attackMetric === "percent"
          ? `${((100 * c.count) / totalCount).toFixed(1)}%`
          : fmtInt(c.count),
      avatar: ATTACK_AVATARS[c.key],
    }));
  }, [range, customRange, attackMetric]);

  const subtitleFor = (m: Metric) =>
    m === "spend" ? "By total spend" : "By total tokens used";

  return (
    // 2×2 below 2xl: the tightest card (Top attack types title + its
    // Amount|Percent pill) needs ~316px, which a 4-up row only clears
    // above a ~1424px viewport — 2xl (1536) is the nearest breakpoint
    // that never squeezes the headers.
    <div className="grid grid-cols-2 gap-4 2xl:grid-cols-4">
      <TopList
        metric={modelMetric}
        onMetricChange={setModelMetric}
        options={METRIC_OPTIONS}
        rows={modelRows}
        subtitle={subtitleFor(modelMetric)}
        title="Top models"
      />
      <TopList
        metric={keyMetric}
        onMetricChange={setKeyMetric}
        options={METRIC_OPTIONS}
        rows={keyRows}
        subtitle={subtitleFor(keyMetric)}
        title="Top API keys"
      />
      <TopList
        metric={userMetric}
        onMetricChange={setUserMetric}
        options={METRIC_OPTIONS}
        rows={userRows}
        subtitle={subtitleFor(userMetric)}
        title="Top users"
      />
      <TopList
        metric={attackMetric}
        onMetricChange={setAttackMetric}
        options={ATTACK_METRIC_OPTIONS}
        rows={attackRows}
        subtitle={
          attackMetric === "percent"
            ? "By total attack percentage"
            : "By total attack amount"
        }
        title="Top attack types"
      />
    </div>
  );
}

/* ─── Usage by key — org-wide admin table, sortable ─────────────────────── */

/** Scaled key row — the shape rendered in the table (and fed to the sort
 *  accessor). Spend on BYOK rows renders "—"; the accessor returns null for
 *  it so BYOK always sorts last when ranking by spend (matches the prior
 *  dropdown's explicit BYOK-last rule). */
type ScaledKeyRow = (typeof API_KEY_ROWS)[number] & {
  spend: number;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  alerts: number;
  /** Saved % for the active range (display value, e.g. 14.7). Null when
   *  the key was never used — renders "—" and sorts last. */
  saved: number | null;
};

function keySortValue(row: ScaledKeyRow, key: string): string | number | null {
  switch (key) {
    case "label":
      return row.label;
    case "owner":
      return row.owner;
    case "requests":
      return parseNumeric(row.requests);
    case "alerts":
      return parseNumeric(row.alerts);
    case "tokensIn":
      return parseNumeric(row.tokensIn);
    case "tokensOut":
      return parseNumeric(row.tokensOut);
    // BYOK has no Gateway spend ("—") → null so those rows sort last.
    case "spend":
      return row.path === "BYOK" ? null : parseNumeric(row.spend);
    // Never-used keys have no savings ("—") → null so they sort last.
    case "saved":
      return row.saved;
    default:
      return null;
  }
}

function UsageByKey({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  // Click-to-sort headers replace the former sort <Select>. Default ordering
  // (key=null) preserves API_KEY_ROWS' authored order.
  const { sort, toggle: toggleSort } = useTableSort();
  const [query, setQuery] = useState("");
  const [hideRevoked, setHideRevoked] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  // Land on page 1 whenever the underlying ordering or window changes.
  // Without this you sit on page 3 of "Highest spend / 30d," switch to
  // "Member (A–Z) / 24h," and stare at page 3 of an entirely different
  // ranking — possibly past the last page. Rows-per-page already resets
  // inside TablePaginationFooter.
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${range}|${customRange?.from}|${customRange?.to}|${sort.key}|${sort.dir}|${query}|${hideRevoked}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const scaledRows = useMemo<ScaledKeyRow[]>(() => {
    const scale = effectiveScale(range, customRange);
    // Savings is a rate, not a volume — per-key values shift with the
    // range's workspace rate (savingsRateFor), not with effectiveScale.
    const savingsScale =
      savingsRateFor(range, customRange) / ACTIVITY_SAVINGS_RATE_7D;
    return API_KEY_ROWS.map((k) => {
      const requests = Math.round(k.requests * scale);
      return {
        ...k,
        spend: +(k.spend * scale).toFixed(2),
        requests,
        tokensIn: Math.round(k.tokensIn * scale),
        tokensOut: Math.round(k.tokensOut * scale),
        // Placeholder rate until per-key alert data exists: alerts run at
        // 1/8th of the key's message count, so the column tracks the range
        // selector through `requests`.
        alerts: Math.round(requests / 8),
        saved: k.requests === 0 ? null : k.savings * savingsScale * 100,
      };
    });
  }, [range, customRange]);

  const searchedRows = useMemo(() => {
    const base = hideRevoked
      ? scaledRows.filter((r) => !r.revoked)
      : scaledRows;
    const q = query.trim().toLowerCase();
    if (!q) {
      return base;
    }
    return base.filter(
      (r) =>
        r.label.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)
    );
  }, [scaledRows, query, hideRevoked]);

  // Sort AFTER filtering, BEFORE the pagination slice.
  const filteredRows = useMemo(
    () => sortRows(searchedRows, sort, keySortValue),
    [searchedRows, sort]
  );

  const perPage = Number.parseInt(rowsPerPage, 10);
  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * perPage, page * perPage),
    [filteredRows, page, perPage]
  );

  const isEmpty = filteredRows.length === 0;

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <SectionTitle>Recent key usage</SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            ariaLabel="Search keys"
            className="w-full min-w-0 md:w-auto md:flex-1"
            onChange={setQuery}
            placeholder="Search key or member…"
            surface="elevated"
            value={query}
          />
          <Button
            className="flex-1 md:flex-none"
            size="lg"
            type="button"
            variant="outline"
          >
            <UploadIcon aria-hidden data-icon="inline-start" size={16} />
            Export CSV
          </Button>
          <span className="flex flex-1 items-center gap-2 md:flex-none">
            <span
              className="type-label-14 whitespace-nowrap text-muted-foreground"
              id="hide-revoked-label"
            >
              Hide revoked
            </span>
            <Switch
              aria-labelledby="hide-revoked-label"
              checked={hideRevoked}
              onCheckedChange={setHideRevoked}
            />
          </span>
        </div>
      </div>
      <Card density="flush" id="usage-by-key">
        {isEmpty ? (
          <TableEmptyState
            body="No keys match your search or filter. Try a different name or clear the filter."
            title="No keys match"
          />
        ) : (
          <>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableTableHead
                    className="whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="label"
                  >
                    Key
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="owner"
                  >
                    Users
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="requests"
                  >
                    Messages
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="alerts"
                  >
                    Alerts
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="tokensIn"
                  >
                    Tokens in
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="tokensOut"
                  >
                    Tokens out
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="saved"
                  >
                    Saved
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="spend"
                  >
                    Spend
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow className="hover:bg-transparent" key={row.key}>
                    <TableCell className="type-mono-14 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-foreground">{row.label}</span>
                        {row.revoked ? (
                          <Badge variant="neutral">Revoked</Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="type-copy-14 text-foreground">
                        {row.owner}
                      </span>
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtInt(row.requests)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtInt(row.alerts)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtTokens(row.tokensIn)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtTokens(row.tokensOut)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {row.saved === null ? (
                        <>
                          <span aria-hidden className="text-muted-foreground">
                            —
                          </span>
                          <span className="sr-only">
                            No savings (never used)
                          </span>
                        </>
                      ) : (
                        `${row.saved.toFixed(1)}%`
                      )}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {row.path === "BYOK" ? (
                        <>
                          <span aria-hidden className="text-muted-foreground">
                            —
                          </span>
                          <span className="sr-only">
                            No Gateway spend (BYOK)
                          </span>
                        </>
                      ) : (
                        fmtUsd(row.spend)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePaginationFooter
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              total={filteredRows.length}
            />
          </>
        )}
      </Card>
    </div>
  );
}
