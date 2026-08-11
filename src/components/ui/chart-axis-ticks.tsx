/**
 * Chart axis tick renderers — the visual half of the shared chart geometry
 * (`chart-geometry.ts`, which owns every number these read). Split out only
 * because a module exporting both components and constants trips
 * `react-refresh/only-export-components`; treat the pair as one source.
 *
 * All three are passed by reference (`tick={ChartXAxisTick}`), never as an
 * inline arrow: recharts treats a new function identity as a new prop and
 * re-runs layout work it could otherwise skip.
 */
import {
  CHART_MARGIN,
  CHART_TICK_FONT_SIZE,
} from "@/components/ui/chart-geometry";

/** What recharts hands a custom `tick` component (CartesianAxis renderTicks).
 *  `index` / `visibleTicksCount` are positions in the RENDERED tick set, after
 *  any thinning, and `tickFormatter` is the axis's own formatter — recharts
 *  only applies it for its built-in tick, so a custom renderer must call it. */
type AxisTickProps = {
  className?: string;
  index?: number;
  payload?: { value?: number | string };
  tickFormatter?: (value: never, index: number) => string;
  visibleTicksCount?: number;
  x?: number | string;
  y?: number | string;
};

function tickText(props: AxisTickProps): string {
  const raw = props.payload?.value ?? "";
  return props.tickFormatter
    ? props.tickFormatter(raw as never, props.index ?? 0)
    : String(raw);
}

/** X-axis tick. Every label — the ends included — is centred on its own bar's
 *  coordinate. recharts' built-in end handling insets the first and last tick
 *  to keep them inside the plot box, which both slid "Feb 27" into its
 *  neighbour on Activity and made Overview's first date read as left-aligned
 *  under the Y numbers; a custom tick draws at the coordinate it is given and
 *  ignores that clamp. CHART_MARGIN.right and CHART_Y_AXIS_WIDTH are what keep
 *  the centred ends from clipping. */
export function ChartXAxisTick(props: AxisTickProps) {
  return (
    <text
      className={props.className}
      dy="0.71em"
      fill="var(--muted-foreground)"
      fontFamily="var(--font-mono)"
      fontSize={CHART_TICK_FONT_SIZE}
      textAnchor="middle"
      x={props.x}
      y={props.y}
    >
      {tickText(props)}
    </text>
  );
}

/** Y-axis tick, LEFT-anchored at the card's content edge.
 *
 *  recharts' default right-anchors the label against the axis line, which
 *  makes the column's left edge a function of the longest tick STRING — so
 *  "22.00M" on one card and "127.50M" on the other start at different x even
 *  with identical axis widths, and a label wider than the reserve is clipped
 *  by the card instead of overflowing into empty space. Anchoring left at
 *  CHART_MARGIN.left removes both failures: every tick, on every chart, at
 *  every metric, starts at the same x as the CardTitle above it.
 *
 *  dy 0.355em reproduces recharts' own vertical centring (Text.js:
 *  verticalAnchor "middle" resolves to capHeight ÷ 2, capHeight 0.71em), so
 *  the labels stay centred on their gridlines. */
export function ChartYAxisTick(props: AxisTickProps) {
  return (
    <text
      className={props.className}
      dy="0.355em"
      fill="var(--muted-foreground)"
      fontFamily="var(--font-mono)"
      fontSize={CHART_TICK_FONT_SIZE}
      textAnchor="start"
      x={CHART_MARGIN.left}
      y={props.y}
    >
      {tickText(props)}
    </text>
  );
}

/** Sparkline X-axis tick — the Y-LESS class. The first label is start-anchored
 *  and the last end-anchored because an area chart's end points sit ON the
 *  plot edges: centring them (the bar-chart treatment) would clip both. Keeps
 *  the leading token only ("Apr 21 14:00" → "Apr 21"), matching what both
 *  sparklines shipped. First/last are read off `index` / `visibleTicksCount` —
 *  recharts' own count of what it actually rendered. */
export function SparkXAxisTick(props: AxisTickProps) {
  const value = tickText(props);
  const spaceIdx = value.indexOf(" ");
  const display =
    spaceIdx === -1 ? value : value.slice(0, value.lastIndexOf(" "));
  const index = props.index ?? 0;
  const last = (props.visibleTicksCount ?? 1) - 1;
  const anchor = index === 0 ? "start" : index === last ? "end" : "middle";
  return (
    <text
      className={props.className}
      dy="0.71em"
      fill="var(--muted-foreground)"
      fontFamily="var(--font-mono)"
      fontSize={CHART_TICK_FONT_SIZE}
      textAnchor={anchor}
      x={props.x}
      y={props.y}
    >
      {display}
    </text>
  );
}
