# Check the headline numbers at a glance

## Problem

The user lands on a page with a table or chart and wants the few numbers that
tell them how things stand before reading any detail.

## Use when

- A page has a table or chart, and a few totals or rates answer the user's
  first question about it.
- The numbers update over time and the user monitors them.

## Do not use when

- The values are properties of one object (a name, a date, an owner): use
  `key-value-details`.
- There is only one number: put it in the page or section header.
- The numbers need comparison across many items: that is the chart or table
  itself.

## Rule

- Three to five tiles. A tile earns its place only if the user would act
  differently based on its value, and it is not already the table's own
  count or column total shown elsewhere on the surface.
- Each tile: a short label, one figure, and at most one line of context (change
  versus a prior period, or a limit). No sentence repeating the figure.
- Order by importance, most important first (left on wide screens).
- Every figure derives from the same data and range as the table or chart below
  it; when the range changes, tiles and table change together.
- A tile that opens detail is a selectable surface with a hover state; a static
  tile is not.

## Anti-patterns

- Eight or more tiles in a row, all the same weight.
- A tile showing a number the table header already shows.
- Tiles on a different time range from the chart below.
- Tiles with a caption that restates the figure in words.
- Decorative icons that take more space than the number.

## Evidence

- <https://carbondesignsystem.com/data-visualization/dashboards/> (HTTP 200).
  Quote: "Prioritize data by importance, then create a clear visual hierarchy."
  Supports: order and weight by importance.
- Same page. Quote: "Non-essential information should be provided as needed."
  (under "Limit the number of metrics"). Supports: a small tile set.
- <https://www.nngroup.com/articles/dashboards-preattentive/> (HTTP 200). Quote:
  "Dashboards are collections of data visualizations, presented in a
  single-page view that imparts at-a-glance information on which users can act
  quickly." Supports: tiles exist to be read at a glance and acted on.
- The three-to-five count: rule of this library, no external source found
  (fetched sources say to limit metrics but give no number).

## Check

- Are there five tiles or fewer?
- Would the user act differently based on each tile's value?
- Does any tile repeat a number shown elsewhere on the surface?
- Do the tiles and the table or chart share one data source and range?
