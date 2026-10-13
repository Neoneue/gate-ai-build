# Trust the numbers

## Problem

One number that disagrees with another, a figure that cannot be traced to real
data, or a value that changes format between rows makes the user distrust
every number on the page.

## Use when

- A surface shows a count, total, rate, cost or chart.
- The same measure appears in a tile, a chart and a table.

## Do not use when

- The surface shows no measured values.

## Rule

- One source for every appearance of a value: the tile, the chart total and the
  sum of the bars come from the same data and reconcile.
- Every figure derives from real data. An unknown or unmetered value renders as
  a dash with a reason, never an estimate or a plausible constant.
- One format per measure and one unit system per view (for example, a
  percentage always to one decimal).
- Plot quantities as lengths (bars) or positions (lines), sorted. No pie,
  donut, gauge, radar or 3D chart for a quantity.
- A chart keeps fewer, summed buckets as its column narrows; it never squeezes
  desktop density into a phone width.

## Anti-patterns

- A KPI tile of 1,204 above a chart totalling 1,198.
- A hand-typed ratio or an estimated cost where the data is unknown.
- "22%" in one row and "22.4%" in the next.
- A donut of spend by model, or a gauge for a single rate.
- Ninety hairline bars in a mobile column.

## Evidence

- <https://www.nngroup.com/articles/dashboards-preattentive/> (HTTP 200).
  Quote: "Circular graphs like pie charts, gauges, and radar charts do not
  convey well quantitative relationships between data, as they rely on area and
  angle to communicate quantitative information."
- <https://carbondesignsystem.com/data-visualization/dashboards/> (HTTP 200).
  Quote: "Do not switch measurement systems, like imperial to metric."
- Owner rule: no synthetic data; every number comes from a real row, and charts
  reconcile with the KPI they explain.

## Check

- Do the tile, the chart total and the bar sum agree exactly?
- Can every number be traced to a data row?
- Does each measure keep one format across the view?
- Is any quantity drawn as an angle or an area?
