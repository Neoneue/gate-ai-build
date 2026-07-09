import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";

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
  size = "sm",
}: {
  delta: string;
  note?: string;
  inverted?: boolean;
  /** `sm` (default) for dense KPI rows; `md` bumps the value, note, and
   *  arrow one step up for hero-scale cards. */
  size?: "sm" | "md";
}) {
  const trimmed = delta.trim();
  const negative = trimmed.startsWith("-");
  const Icon = negative ? ArrowDownRight : ArrowUpRight;
  const isGood = inverted ? negative : !negative;
  const toneCls = isGood ? "text-success-700" : "text-destructive";
  // Preserve the leading +/- on the displayed value. Redundant with the
  // arrow on its own, but the explicit sign reinforces the magnitude
  // direction and is the convention readers expect for tabular deltas.
  const display = trimmed;
  const iconCls = size === "md" ? "size-4" : "size-3.5";
  const valueCls = size === "md" ? "text-sm" : "text-xs/4";
  const noteCls = size === "md" ? "text-sm" : "text-xs";
  return (
    <div className="inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-0 ${toneCls}`}>
        <Icon aria-hidden className={iconCls} />
        <span className={`font-mono ${valueCls} font-medium tabular-nums`}>
          {display}
        </span>
      </span>
      {note ? (
        <span className={`${noteCls} text-muted-foreground`}>
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
  deltaSize = "sm",
  noteLine,
  spark,
  flat = false,
}: {
  title: string;
  value: string;
  /** Subordinate metric rendered between value and delta (e.g. share of
   *  total like "66%"). Rendered as muted neutral-500 text aligned to the
   *  value baseline. */
  valueSuffix?: React.ReactNode;
  delta?: string;
  deltaNote?: string;
  /** Pass-through to DeltaTag for lower-is-better metrics. */
  deltaInverted?: boolean;
  /** Pass-through to DeltaTag size. `md` is one type-step up — used on the
   *  Overview rail where delta + note carry more weight than in the dense
   *  KPI grids. */
  deltaSize?: "sm" | "md";
  noteLine?: string;
  spark?: React.ReactNode;
  flat?: boolean;
}) {
  const baseCls = flat
    ? "flex flex-col gap-2 bg-card p-4"
    : "flex flex-col rounded-md gap-2 bg-card shadow-(--shadow-border) p-4";
  return (
    <div className={baseCls}>
      <div className="flex items-center justify-between gap-2">
        <Eyebrow as="div">{title}</Eyebrow>
      </div>
      <div className="flex items-baseline gap-2">
        <HeroNumeric>{value}</HeroNumeric>
        {valueSuffix ? (
          <span className="inline-flex items-center text-muted-foreground">
            <span aria-hidden className="inline-block h-3.5 w-0" />
            <span className="font-medium font-mono text-xs/4 tabular-nums">
              {valueSuffix}
            </span>
          </span>
        ) : null}
        {delta ? (
          <DeltaTag
            delta={delta}
            inverted={deltaInverted}
            note={deltaNote}
            size={deltaSize}
          />
        ) : (
          <span className="type-copy-14 text-muted-foreground">{noteLine}</span>
        )}
      </div>
      {spark == null ? null : <div className="mt-3">{spark}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * CompactSpark — small recharts AreaChart sparkline (~36px tall).
 * Optional `endDot` marks the final point; `noGrid` hides the dashed grid.
 * ───────────────────────────────────────────────────────────────────────── */

const compactSparkConfig: ChartConfig = {
  v: {
    label: "Value",
  },
};

export function CompactSpark({
  colorVar,
  data,
  endDot = true,
  noGrid = false,
  tooltip = false,
  valueFormatter,
  labels,
}: {
  colorVar: string;
  data: number[];
  endDot?: boolean;
  noGrid?: boolean;
  /** Enable hover tooltips (active dot + cursor + value), like the larger
   *  charts. Off by default to keep purely-decorative sparklines inert. */
  tooltip?: boolean;
  /** Formats the value shown in the tooltip (e.g. `(v) => `${v}%``). */
  valueFormatter?: (value: number) => string;
  /** Per-point labels (e.g. dates) shown above the value in the tooltip. */
  labels?: (string | number)[];
}) {
  const points = data.map((v, i) => ({ i, v, label: labels?.[i] }));
  const gradId = `cmp007-spark-${colorVar.replace(/[^a-zA-Z0-9]/g, "")}`;
  const lastIndex = points.length - 1;
  return (
    <ChartContainer
      className="mt-1 aspect-auto h-9 w-full"
      config={compactSparkConfig}
    >
      <AreaChart
        accessibilityLayer
        data={points}
        margin={{ top: 2, right: 4, left: 0, bottom: 2 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colorVar} stopOpacity={0.22} />
            <stop offset="100%" stopColor={colorVar} stopOpacity={0} />
          </linearGradient>
        </defs>
        {noGrid ? null : (
          <CartesianGrid
            horizontal
            stroke="var(--color-neutral-200)"
            strokeDasharray="6 3"
            vertical={false}
          />
        )}
        <Area
          activeDot={tooltip ? { r: 3, fill: colorVar, strokeWidth: 0 } : false}
          dataKey="v"
          dot={false}
          fill={`url(#${gradId})`}
          isAnimationActive={false}
          stroke={colorVar}
          strokeWidth={1.5}
          type="linear"
        />
        {endDot ? (
          <Line
            activeDot={false}
            dataKey="v"
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
                  cx={cx}
                  cy={cy}
                  fill={colorVar}
                  key={key ?? `dot-${index}`}
                  r={2.5}
                />
              );
            }}
            isAnimationActive={false}
            stroke="transparent"
            tooltipType="none"
            type="linear"
          />
        ) : null}
        {tooltip ? (
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="gap-1"
                formatter={(value) => (
                  <span className="type-label-14 text-foreground">
                    {valueFormatter
                      ? valueFormatter(Number(value))
                      : String(value)}
                  </span>
                )}
                hideIndicator
                labelClassName="font-normal text-muted-foreground"
                labelFormatter={(_label, items) =>
                  (
                    items?.[0]?.payload as
                      | { label?: string | number }
                      | undefined
                  )?.label ?? ""
                }
              />
            }
            cursor={{ stroke: "var(--color-neutral-300)", strokeWidth: 1 }}
            isAnimationActive={false}
            position={{ y: -24 }}
          />
        ) : null}
        <XAxis dataKey="i" hide />
      </AreaChart>
    </ChartContainer>
  );
}
