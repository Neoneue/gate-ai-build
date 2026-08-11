/**
 * Shared chart geometry — the ONE source for how an axis-bearing chart is laid
 * out. Every major chart (Overview's "Tokens used", Activity's "Tokens over
 * time") imports its margin, Y-axis reserve, tick type and plot math from
 * here, so the two cards line up pixel for pixel when they sit side by side.
 * The tick RENDERERS live in the sibling `chart-axis-ticks.tsx` — same source,
 * split only because a module that exports both components and constants trips
 * `react-refresh/only-export-components` (repo convention: split, don't
 * disable — see `toggle-variants.ts`, `monogram-types.ts`).
 *
 * Why this file exists: the two charts had independently solved the SAME
 * problem — "keep the first X label off the Y-axis number column" — in two
 * different ways. Overview anchored the first/last label inward; Activity
 * pushed the whole plot right with `margin.left`. Each worked alone and they
 * disagreed on screen, because `margin.left` moves the Y label column and
 * inward anchoring does not. The fix is structural: the left reserve lives in
 * the YAxis `width` (which moves the PLOT and leaves the label column alone),
 * `margin.left` is 0, and both charts render the same ticks.
 *
 * The rule the geometry encodes, in order of precedence:
 *   1. The Y tick column starts at the card's content edge, always — the same
 *      x as the CardTitle above it, on every chart, at every metric.
 *   2. Every X label, ENDS INCLUDED, is centred on its own bar.
 *   3. The first X label never reaches the Y tick column, because the plot
 *      starts a full CHART_Y_AXIS_WIDTH in and the label only reaches back
 *      half its own width from the first bar's centre.
 */
import { type RefObject, useLayoutEffect, useRef, useState } from "react";

/* ─── Type ──────────────────────────────────────────────────────────────── */

/** Axis tick size (px). 10 is the floor of the type scale (`--text-2xs`,
 *  index.css) and the only size any chart tick may use — the four charts
 *  previously split 10/11, and 11 is not on the scale at all. */
export const CHART_TICK_FONT_SIZE = 10;

/** Advance width (px) of ONE character at CHART_TICK_FONT_SIZE. Geist Mono is
 *  monospace, so a label's width is exactly its character count times this.
 *  Measured in the browser with getComputedTextLength across every glyph the
 *  axes render — digits, "W", ".", ":", "%", "$", space — all flat at 6.0000px
 *  (0.6em). Re-measure, never rescale, if the tick size ever changes: at 11px
 *  the same measurement returned 6.6003. */
export const CHART_TICK_CHAR_PX = 6;

/* ─── Horizontal reserve ────────────────────────────────────────────────── */

/** Longest Y tick, in characters, that any chart can produce. Enumerated
 *  across every chart × metric: Activity tokens "127.50M" (7) · Activity spend
 *  "$1,000" (6) · Activity savings "30%" (3) · Overview tokens "22.00M" (6) ·
 *  Overview spend "$10,000" (7). The widest governs the reserve. */
export const CHART_Y_LABEL_MAX_CHARS = 7;

/** Longest X tick, in characters: "Feb 27" / "Apr 27" (6). "00:00" (5) and
 *  "Now" (3) are shorter. Half of this is what the right margin reserves so a
 *  centred last label cannot be clipped. */
export const CHART_X_LABEL_MAX_CHARS = 6;

/** Width (px) the YAxis reserves for its tick column. This — NOT `margin.left`
 *  — is where the left reserve belongs: `width` moves the plot box and leaves
 *  the label column pinned at the card's content edge, while `margin.left`
 *  drags the labels right along with the plot (which is exactly how the two
 *  charts came to disagree).
 *
 *  52 is derived, not chosen. Two things have to fit:
 *    · the widest Y label — 7 chars × 6px = 42px, drawn from x=0;
 *    · the first X label, which is centred on the first bar and so reaches
 *      back `halfLabel − halfPitch` = 18 − 9.5 = 8.5px past the plot's left
 *      edge. Bar pitch is never below MIN_BAR_PITCH (19px) — getBucketGroupSize
 *      caps the bar count at plotWidth ÷ 19 — so 9.5px is the worst half-pitch
 *      any state can produce.
 *  42 + 8.5 = 50.5, rounded up to the 4px grid. Sized for the WIDEST label any
 *  chart can produce, so a shorter tick set ("30%") simply leaves more air
 *  rather than shifting the column. A 48px reserve fails: at a 1024px content
 *  column drawing 30 bars the first label starts at 39.8px, 2.2px inside the
 *  Y column. Asserted both ways in chart-helpers.test.ts. */
export const CHART_Y_AXIS_WIDTH = 52;

/** BarChart margin. `left: 0` pins the Y tick column to the card's content
 *  edge; the left reserve is CHART_Y_AXIS_WIDTH instead. `right` reserves half
 *  the widest X label (6 chars ÷ 2 = 18px, rounded up to the 4px grid) so the
 *  last label, centred on the last bar, cannot be clipped by the plot box.
 *  `top: 8` keeps the tallest bar off the card's inner edge. */
export const CHART_MARGIN = {
  top: 8,
  right: 20,
  left: 0,
  bottom: 0,
} as const;

/** Sparkline margin — the Y-LESS class of chart (`YAxis width={0}
 *  tick={false}`): Requests' hero area chart and Security's events chart. They
 *  have no tick column to reserve for and their end labels are anchored
 *  inward, not centred, because an area chart's first and last points sit ON
 *  the plot edges where a centred label would be clipped. Shared here so the
 *  two of them cannot drift from each other. */
export const SPARK_CHART_MARGIN = {
  top: 4,
  right: 4,
  left: 4,
  bottom: 0,
} as const;

/** X axis band height (px) and the gap between the plot floor and the label. */
export const CHART_X_AXIS_HEIGHT = 24;
export const CHART_X_TICK_MARGIN = 8;

/** Width (px) of a `chars`-long mono label at the shared tick size. */
export function chartLabelWidth(chars: number): number {
  return chars * CHART_TICK_CHAR_PX;
}

/* ─── Plot width ────────────────────────────────────────────────────────── */

/** Width (px) the content column must reach before CardContent splits into the
 *  two-pane chart + legend grid (`@4xl`). Below it the legend stacks under the
 *  chart and the chart takes the card's full width — which is why plot width
 *  is NOT monotonic in column width: crossing 896 upward hands 4 of 12 columns
 *  to the legend and the chart abruptly gets narrower. Both chart cards use
 *  the same `grid @4xl:grid-cols-12` + `@4xl:col-span-8` split. */
const TWO_PANE_MIN_WIDTH = 896;
/** Card border (1px each side) + CardContent's px-4. */
const CARD_CHROME_PX = 34;
/** CardContent's grid: 12 columns, gap-4, chart pane spans 8. */
const GRID_GAP_PX = 16;
const GRID_COLUMNS = 12;
const CHART_SPAN = 8;

/** Width (px) of the chart pane inside a content column `columnWidth` wide —
 *  the box the chart renders into, before its own margin and Y axis. */
export function getChartPaneWidth(columnWidth: number): number {
  const cardContent = columnWidth - CARD_CHROME_PX;
  return columnWidth >= TWO_PANE_MIN_WIDTH
    ? (CHART_SPAN * (cardContent - GRID_GAP_PX * (GRID_COLUMNS - 1))) /
        GRID_COLUMNS +
        GRID_GAP_PX * (CHART_SPAN - 1)
    : cardContent;
}

/** Plotted width available to the bars and their labels in a content column
 *  `columnWidth` wide. Exact, not estimated: the Y reserve is now a fixed
 *  width rather than recharts' auto-size, so nothing here depends on which
 *  tick strings the axis happens to render. */
export function getChartPlotWidth(columnWidth: number): number {
  return (
    getChartPaneWidth(columnWidth) - CHART_Y_AXIS_WIDTH - CHART_MARGIN.right
  );
}

/** Left edge (px, from the card's content edge) of the label centred on the
 *  FIRST bar. Must clear the Y tick column — the constraint that produced the
 *  two divergent hacks this module replaces. Asserted in the test sweep. */
export function getFirstLabelLeft(
  plotWidth: number,
  barCount: number,
  labelChars: number
): number {
  const pitch = plotWidth / Math.max(1, barCount);
  return CHART_Y_AXIS_WIDTH + pitch / 2 - chartLabelWidth(labelChars) / 2;
}

/* ─── X-axis label stride ───────────────────────────────────────────────── */

/** Clear space (px) required between two adjacent X-axis labels. They must
 *  never overlap and never touch. */
export const AXIS_LABEL_MIN_GAP = 16;
/** Below this many labels the axis stops reading as a scale. Used to reject a
 *  stride that would land exactly on the final bar at the cost of collapsing
 *  the axis to two labels. */
export const AXIS_MIN_TICKS = 3;

/** Every-Nth stride, in bars, for the X axis.
 *
 *  A fixed stride is the whole point. `preserveStartEnd` force-keeps the first
 *  and last tick and then CLAMPS them inside the plot box rather than centring
 *  them on their bar, while its companion `minTickGap` drops interior ticks
 *  opportunistically and leaves a dead gap mid-axis. Handing recharts an
 *  explicit `ticks` array with `interval={0}` bypasses both: it renders exactly
 *  the subset it is given and hides nothing.
 *
 *  Every label is centre-anchored on its own bar, so two neighbours collide
 *  when their centres are closer than one label width — hence the plain
 *  `width + gap` term, with no anchor-shift correction needed.
 *
 *  Prefers the tightest legal stride that DIVIDES the axis, because that is
 *  the only way a uniform stride can also land on the final bar. Such a stride
 *  exists for 23, 15, 12, 10 and 7 bars. At 30, 8 and 6 the span (29, 7, 5) is
 *  PRIME, so the only dividing strides leave two labels; there we take the
 *  extra labels and stop one or two bars short, since a run that reaches the
 *  end by shortening its final interval would reintroduce the uneven spacing
 *  this function exists to remove. */
export function getAxisTickStride(
  barCount: number,
  plotWidth: number,
  maxLabelChars: number
): number {
  if (barCount <= 1 || plotWidth <= 0) {
    return 1;
  }
  const pitch = plotWidth / barCount;
  const labelWidth = chartLabelWidth(maxLabelChars);
  const minStride = Math.max(
    1,
    Math.ceil((labelWidth + AXIS_LABEL_MIN_GAP) / pitch)
  );
  const span = barCount - 1;
  for (let stride = minStride; stride <= span; stride++) {
    if (span / stride + 1 < AXIS_MIN_TICKS) {
      break;
    }
    if (span % stride === 0) {
      return stride;
    }
  }
  return minStride;
}

/** Indices of the bars the X axis labels, at a uniform stride from the first. */
export function getAxisTickIndices(
  barCount: number,
  plotWidth: number,
  maxLabelChars: number
): number[] {
  const stride = getAxisTickStride(barCount, plotWidth, maxLabelChars);
  const out: number[] = [];
  for (let i = 0; i < barCount; i += stride) {
    out.push(i);
  }
  return out;
}

/** The exact subset of `rows` the X axis labels, as label strings, ready to
 *  hand to `<XAxis ticks={…} interval={0} />`. Both chart cards call this, so
 *  neither can fall back to recharts' uneven `preserveStartEnd` thinning. */
export function getAxisTicks(
  rows: readonly Record<string, number | string>[],
  columnWidth: number,
  key = "date"
): string[] {
  if (rows.length === 0) {
    return [];
  }
  const maxLabelChars = rows.reduce(
    (widest, row) => Math.max(widest, String(row[key] ?? "").length),
    0
  );
  return getAxisTickIndices(
    rows.length,
    getChartPlotWidth(columnWidth),
    maxLabelChars
  ).map((i) => String(rows[i]?.[key] ?? ""));
}

/* ─── Column measurement ────────────────────────────────────────────────── */

/** Measures the CONTENT COLUMN that hosts the chart card — `<main>`'s content
 *  box, which is also the inline size the `@` container variants read.
 *
 *  Keys off the column, not the viewport: the Ask AI panel and the collapsing
 *  nav rail both narrow this column while the viewport stays wide, which is
 *  exactly the state a media query cannot see. Attach the returned ref to the
 *  chart pane; the hook walks up to `<main>` from there.
 *
 *  useLayoutEffect so the first measurement lands before paint — the initial
 *  0-width render is never shown. Cannot loop: the observed column is sized by
 *  the page chrome alone, and what the width produces only changes what is
 *  drawn INSIDE the card. */
export function useChartColumnWidth(): [
  RefObject<HTMLDivElement | null>,
  number,
] {
  const ref = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState(0);

  useLayoutEffect(() => {
    const column = ref.current?.closest("main");
    if (!column) {
      return;
    }
    const publish = (next: number) =>
      setColumnWidth((prev) => (prev === next ? prev : next));
    const style = getComputedStyle(column);
    publish(
      Math.round(
        column.clientWidth -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight)
      )
    );
    // contentRect is the content box, i.e. exactly the container-query size.
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect.width;
      if (box !== undefined) {
        publish(Math.round(box));
      }
    });
    observer.observe(column);
    return () => observer.disconnect();
  }, []);

  return [ref, columnWidth];
}
