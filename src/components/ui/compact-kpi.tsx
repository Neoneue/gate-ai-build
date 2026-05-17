import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, XAxis } from 'recharts';
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart';
import { Eyebrow } from '@/components/ui/eyebrow';
import { HeroNumeric } from '@/components/ui/hero-numeric';

/* ─────────────────────────────────────────────────────────────────────────
 * DeltaTag — directional arrow + delta value, optional trailing note.
 *
 * Default: positive (more) = success, negative (less) = danger.
 * `inverted`: lower-is-better metrics (latency, cost-per-x, error rate);
 * negative paints success and positive paints danger. Direction arrow
 * still tracks the literal sign — only the tone flips.
 * ───────────────────────────────────────────────────────────────────────── */

export function DeltaTag({
  delta,
  note,
  inverted = false,
  size = 'sm',
}: {
  delta: string;
  note?: string;
  inverted?: boolean;
  /** `sm` (default) for dense KPI rows; `md` bumps the value, note, and
   *  arrow one step up for hero-scale cards. */
  size?: 'sm' | 'md';
}) {
  const trimmed = delta.trim();
  const negative = trimmed.startsWith('-');
  const Icon = negative ? ArrowDownRight : ArrowUpRight;
  const isGood = inverted ? negative : !negative;
  const toneCls = isGood ? 'text-success-700' : 'text-destructive';
  // Preserve the leading +/- on the displayed value. Redundant with the
  // arrow on its own, but the explicit sign reinforces the magnitude
  // direction and is the convention readers expect for tabular deltas.
  const display = trimmed;
  const iconCls = size === 'md' ? 'size-4' : 'size-3.5';
  const valueCls = size === 'md' ? 'text-sm' : 'text-xs/4';
  const noteCls = size === 'md' ? 'text-sm' : 'text-xs';
  return (
    <div className="inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-0 ${toneCls}`}>
        <Icon className={iconCls} />
        <span className={`font-mono ${valueCls} font-medium tabular-nums`}>
          {display}
        </span>
      </span>
      {note ? (
        <span className={`${noteCls} text-ink-500`}>
          <span aria-hidden> · </span>
          {note}
        </span>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * CompactKpi — dense KPI card. Title + value + (delta or noteLine) + sparkline.
 * `flat` strips the card chrome (border + radius) for use inside a divided row.
 * ───────────────────────────────────────────────────────────────────────── */

export function CompactKpi({
  title,
  value,
  valueSuffix,
  delta,
  deltaNote,
  deltaInverted = false,
  noteLine,
  spark,
  flat = false,
}: {
  title: string;
  value: string;
  /** Subordinate metric rendered between value and delta (e.g. share of
   *  total like "66%"). Rendered as muted ink-500 text aligned to the
   *  value baseline. */
  valueSuffix?: React.ReactNode;
  delta?: string;
  deltaNote?: string;
  /** Pass-through to DeltaTag for lower-is-better metrics. */
  deltaInverted?: boolean;
  noteLine?: string;
  spark: React.ReactNode;
  flat?: boolean;
}) {
  const containerCls = flat
    ? 'flex flex-col gap-2 bg-white p-4'
    : 'flex flex-col rounded-md gap-2 bg-white shadow-(--shadow-border) p-4';
  return (
    <div className={containerCls}>
      <Eyebrow as="div">{title}</Eyebrow>
      <div className="flex items-baseline gap-2">
        <HeroNumeric>{value}</HeroNumeric>
        {valueSuffix ? (
          <span className="inline-flex items-center text-ink-500">
            <span aria-hidden className="inline-block h-3.5 w-0" />
            <span className="font-mono text-xs/4 font-medium tabular-nums">
              {valueSuffix}
            </span>
          </span>
        ) : null}
        {delta ? (
          <DeltaTag delta={delta} note={deltaNote} inverted={deltaInverted} />
        ) : (
          <span className="text-sm text-ink-500">{noteLine}</span>
        )}
      </div>
      <div className="mt-1">{spark}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * CompactSpark — small recharts AreaChart sparkline (~36px tall).
 * Optional `endDot` marks the final point; `noGrid` hides the dashed grid.
 * ───────────────────────────────────────────────────────────────────────── */

const compactSparkConfig: ChartConfig = {
  v: {
    label: 'Value',
  },
};

export function CompactSpark({
  colorVar,
  data,
  endDot = true,
  noGrid = false,
}: {
  colorVar: string;
  data: number[];
  endDot?: boolean;
  noGrid?: boolean;
}) {
  const points = data.map((v, i) => ({ i, v }));
  const gradId = `cmp007-spark-${colorVar.replace(/[^a-zA-Z0-9]/g, '')}`;
  const lastIndex = points.length - 1;
  return (
    <ChartContainer
      config={compactSparkConfig}
      className="aspect-auto h-9 w-full mt-1"
    >
      <AreaChart
        accessibilityLayer
        data={points}
        margin={{ top: 2, right: 4, left: 0, bottom: 2 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorVar} stopOpacity={0.22} />
            <stop offset="100%" stopColor={colorVar} stopOpacity={0} />
          </linearGradient>
        </defs>
        {noGrid ? null : (
          <CartesianGrid
            horizontal
            vertical={false}
            stroke="var(--color-ink-200)"
            strokeDasharray="3 3"
          />
        )}
        <Area
          dataKey="v"
          type="linear"
          stroke={colorVar}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />
        {endDot ? (
          <Line
            dataKey="v"
            type="linear"
            stroke="transparent"
            isAnimationActive={false}
            dot={(props) => {
              const { cx, cy, index, key } = props as {
                cx: number;
                cy: number;
                index: number;
                key?: string | number;
              };
              if (index !== lastIndex) {
                return <g key={key ?? `dot-${index}`} />;
              }
              return (
                <circle
                  key={key ?? `dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill={colorVar}
                />
              );
            }}
            activeDot={false}
          />
        ) : null}
        <XAxis dataKey="i" hide />
      </AreaChart>
    </ChartContainer>
  );
}
