import { describe, expect, it } from "vitest";
import {
  AXIS_MIN_TICKS,
  CHART_MARGIN,
  CHART_TICK_CHAR_PX,
  CHART_X_LABEL_MAX_CHARS,
  CHART_Y_AXIS_WIDTH,
  CHART_Y_LABEL_MAX_CHARS,
  chartLabelWidth,
  getAxisTickIndices,
  getChartPlotWidth,
  getFirstLabelLeft,
} from "@/components/ui/chart-geometry";
import {
  aggregateBuckets,
  BAR_DENSITY_TIERS,
  type ChartRow,
  getBucketCount,
  getBucketGroupSize,
  getBucketLabel,
  getRangeLabels,
  getRenderedBarCount,
  MIN_BAR_PITCH,
} from "./chart-helpers";

/** Bars drawn in a content column `width` px wide for a range of `fullCount`
 *  buckets — the composition the chart actually renders. */
const barsAt = (width: number, fullCount: number) =>
  getRenderedBarCount(fullCount, getBucketGroupSize(width, fullCount));

/** Content-column widths measured in the browser at every state the
 *  verification sweep covers. `<main>`'s content box, which is also the
 *  inline size the `@` container variants read. */
const COLUMN_WIDTHS = {
  "1024+ai": 372,
  "500": 468,
  "1152+ai": 500,
  "1280+ai": 628,
  "768": 720,
  "1024": 740,
  "1440+ai": 788,
  "900": 852,
  "1152": 868,
  "1600+ai": 948,
  "1280": 996,
  "1440": 1156,
  "1920+ai": 1268,
  "1600": 1316,
  "1920": 1636,
} as const;

const ALL_BUCKET_COUNTS = [7, 12, 30] as const;

describe("bar-density ladder", () => {
  // INVARIANT 1. This is the defect a linear plot-width ÷ pitch rule shipped:
  // plot width is NOT monotonic in column width (crossing @4xl hands 4 of 12
  // columns to the legend, so the chart abruptly narrows), which let a
  // narrower column draw MORE bars than a wider one.
  it("never draws more bars in a narrower column than in a wider one", () => {
    for (const fullCount of ALL_BUCKET_COUNTS) {
      let previous = 0;
      for (let width = 120; width <= 2400; width++) {
        const bars = barsAt(width, fullCount);
        expect(
          bars,
          `fullCount=${fullCount} regressed at column ${width}px: ${bars} bars after ${previous}`
        ).toBeGreaterThanOrEqual(previous);
        previous = bars;
      }
    }
  });

  // INVARIANT 2. 1440 and 1920 with the Ask AI panel closed must stay exactly
  // as they ship today.
  it("keeps the widest panel-closed desktop states at full detail", () => {
    for (const width of [COLUMN_WIDTHS["1440"], COLUMN_WIDTHS["1920"]]) {
      expect(getBucketGroupSize(width, 30)).toBe(1);
      expect(barsAt(width, 30)).toBe(30);
      expect(getBucketLabel("all", null, getBucketGroupSize(width, 30))).toBe(
        "per day"
      );
    }
  });

  // INVARIANT 3. Each rung is a real step down, not a proportional slide.
  it("drops the bar count at every tier boundary", () => {
    const boundaries = BAR_DENSITY_TIERS.map((t) => t.minWidth).filter(
      (w) => w > 0
    );
    for (const boundary of boundaries) {
      expect(
        barsAt(boundary, 30),
        `no step down crossing ${boundary}px`
      ).toBeGreaterThan(barsAt(boundary - 1, 30));
    }
  });

  it("is sublinear: halving the column more than halves the bar count", () => {
    // A constant-density rule would keep bars proportional to width. The
    // ladder must fall away faster than that.
    expect(barsAt(1024, 30) / barsAt(512, 30)).toBeGreaterThan(2);
  });

  it("never returns a group size that would drop a bucket", () => {
    for (const fullCount of ALL_BUCKET_COUNTS) {
      for (let width = 120; width <= 2400; width += 7) {
        const group = getBucketGroupSize(width, fullCount);
        expect(group).toBeGreaterThanOrEqual(1);
        expect(group).toBeLessThanOrEqual(fullCount);
        // Every bucket lands in exactly one group.
        expect(
          getRenderedBarCount(fullCount, group) * group
        ).toBeGreaterThanOrEqual(fullCount);
      }
    }
  });

  it("short ranges never aggregate — 7 daily buckets always fit", () => {
    for (const width of Object.values(COLUMN_WIDTHS)) {
      expect(getBucketGroupSize(width, 7)).toBe(1);
    }
  });

  // A partial trailing group draws a short final bar, which reads as a cliff
  // that is not in the data. Every preset range must divide evenly at every
  // rung of the ladder.
  it("folds every preset range into equal-span buckets at every tier", () => {
    for (const fullCount of ALL_BUCKET_COUNTS) {
      for (const [state, width] of Object.entries(COLUMN_WIDTHS)) {
        const group = getBucketGroupSize(width, fullCount);
        expect(
          fullCount % group,
          `fullCount=${fullCount} at ${state} (${width}px) leaves a partial group of ${fullCount % group}`
        ).toBe(0);
      }
    }
  });
});

describe("X-axis label stride", () => {
  /** Left edge of the label centred on bar `i`, and its right edge. */
  const labelBox = (
    i: number,
    plotWidth: number,
    bars: number,
    chars: number
  ) => {
    const pitch = plotWidth / bars;
    const centre = (i + 0.5) * pitch;
    const half = chartLabelWidth(chars) / 2;
    return { l: centre - half, r: centre + half };
  };

  // Every bucket count the ladder can produce, across every column width.
  const BAR_COUNTS = [6, 7, 8, 10, 12, 15, 23, 30];
  const CHAR_WIDTHS = [3, 5, 6]; // "Now", "00:00" / "Mar 5", "Feb 27"

  it("never lets two labels overlap or touch", () => {
    for (const bars of BAR_COUNTS) {
      for (const chars of CHAR_WIDTHS) {
        for (let column = 320; column <= 2000; column += 4) {
          const plotWidth = getChartPlotWidth(column);
          if (plotWidth <= 0) {
            continue;
          }
          const idx = getAxisTickIndices(bars, plotWidth, chars);
          for (let k = 1; k < idx.length; k++) {
            const prev = labelBox(idx[k - 1] as number, plotWidth, bars, chars);
            const cur = labelBox(idx[k] as number, plotWidth, bars, chars);
            expect(
              cur.l - prev.r,
              `bars=${bars} chars=${chars} column=${column}: labels ${idx[k - 1]}/${idx[k]} collide`
            ).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("spaces the rendered labels at a constant stride", () => {
    for (const bars of BAR_COUNTS) {
      for (const chars of CHAR_WIDTHS) {
        for (let column = 320; column <= 2000; column += 4) {
          const idx = getAxisTickIndices(
            bars,
            getChartPlotWidth(column),
            chars
          );
          const strides = idx.slice(1).map((v, k) => v - (idx[k] as number));
          const unique = new Set(strides);
          expect(
            unique.size,
            `bars=${bars} chars=${chars} column=${column}: strides ${[...unique].join("/")}`
          ).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("always labels the first bar", () => {
    for (const bars of BAR_COUNTS) {
      for (let column = 320; column <= 2000; column += 4) {
        expect(getAxisTickIndices(bars, getChartPlotWidth(column), 6)[0]).toBe(
          0
        );
      }
    }
  });

  // A stride that divides the span lands the run exactly on the final bar.
  // Composite spans always allow it: 7/10/15/23 bars -> spans 6/9/14/22.
  // Prime spans cannot: 30/12/8/6 bars -> spans 29/11/7/5, where the only
  // dividing strides collapse the axis to two labels, so those stop short by
  // design unless the column is wide enough for a stride of 1.
  it("lands on the last bar whenever the span allows it", () => {
    for (const bars of [7, 10, 15, 23]) {
      for (let column = 448; column <= 2000; column += 4) {
        const idx = getAxisTickIndices(bars, getChartPlotWidth(column), 6);
        expect(
          idx.at(-1),
          `bars=${bars} column=${column} ended at ${idx.at(-1)}`
        ).toBe(bars - 1);
      }
    }
  });

  it("renders at least AXIS_MIN_TICKS labels", () => {
    for (const bars of BAR_COUNTS) {
      for (let column = 372; column <= 2000; column += 4) {
        expect(
          getAxisTickIndices(bars, getChartPlotWidth(column), 6).length
        ).toBeGreaterThanOrEqual(AXIS_MIN_TICKS);
      }
    }
  });

  // The right margin is the ONLY horizontal reserve the margin carries now:
  // `left` is 0 and the left reserve is the YAxis width instead, which is what
  // lets the Y label column sit on the card's content edge. A last label
  // centred on the last bar reaches half its own width past that bar.
  it("reserves half a label on the right so the centred last label cannot clip", () => {
    expect(CHART_MARGIN.right).toBeGreaterThanOrEqual(
      chartLabelWidth(CHART_X_LABEL_MAX_CHARS) / 2
    );
  });

  // The defect that produced the two divergent hacks this module replaces: the
  // first X label, centred on the first bar, sliding under the Y number
  // column. The reserve has to hold at every REAL (column, bar count) pair the
  // ladder can produce — synthetic pairs like "30 bars in a 320px column" are
  // not reachable, and testing them would demand a reserve the design does not
  // need. 280px is below any content column the app renders (a 320px viewport
  // leaves ~288px).
  it("keeps the first X label clear of the Y tick column at every real state", () => {
    const yColumn = chartLabelWidth(CHART_Y_LABEL_MAX_CHARS);
    for (const fullCount of ALL_BUCKET_COUNTS) {
      for (let column = 280; column <= 2400; column += 4) {
        const bars = barsAt(column, fullCount);
        const left = getFirstLabelLeft(
          getChartPlotWidth(column),
          bars,
          CHART_X_LABEL_MAX_CHARS
        );
        expect(
          left,
          `fullCount=${fullCount} at column ${column}px (${bars} bars): first label starts at ${left.toFixed(1)}px, inside the ${yColumn}px Y column`
        ).toBeGreaterThanOrEqual(yColumn);
      }
    }
  });

  // Every Y tick string any chart can produce has to fit the shared reserve
  // with the plot still clear of it — this is the clipping defect that shipped
  // when the reserve was 44px against a 36px label positioned from the RIGHT.
  it("reserves enough Y width for the widest tick any chart renders", () => {
    expect(CHART_Y_AXIS_WIDTH).toBeGreaterThan(
      chartLabelWidth(CHART_Y_LABEL_MAX_CHARS)
    );
    // Left-anchored at the content edge, so the label can never start off-card.
    expect(CHART_MARGIN.left).toBe(0);
    expect(CHART_TICK_CHAR_PX).toBe(6);
  });

  // The closed form of the sweep above. Bar pitch is never below
  // MIN_BAR_PITCH (getBucketGroupSize caps the count at plotWidth ÷ pitch), so
  // the worst case a centred first label can reach back past the plot's left
  // edge is halfLabel − halfPitch. The Y reserve has to swallow that on top of
  // the widest Y label.
  it("derives the Y reserve from the widest labels and the minimum pitch", () => {
    expect(CHART_Y_AXIS_WIDTH).toBeGreaterThanOrEqual(
      chartLabelWidth(CHART_Y_LABEL_MAX_CHARS) +
        chartLabelWidth(CHART_X_LABEL_MAX_CHARS) / 2 -
        MIN_BAR_PITCH / 2
    );
  });
});

describe("aggregateBuckets", () => {
  const rows: ChartRow[] = getRangeLabels("30d", null).map((date, i) => ({
    date,
    a: i + 1,
    b: (i + 1) * 2,
  }));
  const sum = (list: ChartRow[], key: string) =>
    list.reduce((acc, r) => acc + Number(r[key]), 0);

  it("preserves every series total exactly — the legend must not move", () => {
    for (const group of [1, 2, 3, 4, 5, 7]) {
      const folded = aggregateBuckets(rows, group, false);
      expect(sum(folded, "a")).toBeCloseTo(sum(rows, "a"), 10);
      expect(sum(folded, "b")).toBeCloseTo(sum(rows, "b"), 10);
    }
  });

  it("sums adjacent buckets rather than sampling them", () => {
    const folded = aggregateBuckets(rows, 3, false);
    // First bar is literally days 1+2+3, not day 1 with 2 and 3 discarded.
    expect(folded[0]?.a).toBe(1 + 2 + 3);
    expect(folded).toHaveLength(10);
  });

  it("keeps each group's FIRST bucket label (bucket-start convention)", () => {
    const folded = aggregateBuckets(rows, 3, false);
    expect(folded[0]?.date).toBe(rows[0]?.date);
    expect(folded[1]?.date).toBe(rows[3]?.date);
  });

  it("averages instead of summing for the rate lens", () => {
    // Savings stacks are percentages: three 25% buckets are 25%, not 75%.
    const pct: ChartRow[] = [
      { date: "a", x: 25 },
      { date: "b", x: 25 },
      { date: "c", x: 25 },
    ];
    expect(aggregateBuckets(pct, 3, true)[0]?.x).toBe(25);
    expect(aggregateBuckets(pct, 3, false)[0]?.x).toBe(75);
  });

  it("handles a trailing partial group without inventing buckets", () => {
    const folded = aggregateBuckets(rows, 4, false);
    expect(folded).toHaveLength(8);
    // 30 buckets at 4 per group leaves 2 in the last group.
    expect(folded.at(-1)?.a).toBe(29 + 30);
  });
});

describe("getBucketLabel", () => {
  it("is unchanged at group size 1", () => {
    expect(getBucketLabel("30d", null)).toBe("per day");
    expect(getBucketLabel("all", null)).toBe("per day");
    expect(getBucketLabel("7d", null)).toBe("per day");
    expect(getBucketLabel("24h", null)).toBe("per 2 hours");
  });

  it("tracks the aggregated bucket size", () => {
    expect(getBucketLabel("30d", null, 2)).toBe("per 2 days");
    expect(getBucketLabel("30d", null, 3)).toBe("per 3 days");
    expect(getBucketLabel("24h", null, 2)).toBe("per 4 hours");
  });

  it("matches what the chart actually draws at every measured column", () => {
    for (const [state, width] of Object.entries(COLUMN_WIDTHS)) {
      const fullCount = getBucketCount("30d", null);
      const group = getBucketGroupSize(width, fullCount);
      const label = getBucketLabel("30d", null, group);
      const expected = group === 1 ? "per day" : `per ${group} days`;
      expect(label, `${state} (${width}px)`).toBe(expected);
    }
  });
});
