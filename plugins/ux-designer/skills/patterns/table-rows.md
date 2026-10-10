# Scan and compare rows in a table

## Problem

Tables are read by scanning one column down and comparing values across rows.
Left-aligned numbers, lopsided columns, truncated identifiers and rows that do
not look clickable make the scan slow and the comparison wrong.

## Use when

- Many objects share the same attributes and the user compares them.
- A list where each row opens a detail.

## Do not use when

- One object's facts (use `key-value-details`).
- A handful of headline numbers (use `stat-summary`).

## Rule

- The first column is a human-readable identifier (a name), not a generated id;
  ids come later, in mono.
- Numeric columns align right, head and cells alike, in tabular figures. Text
  and prose-with-numbers stay left. Every cell mirrors its header's alignment.
- No column wraps freely while others squeeze: headers and cells do not wrap,
  and the table scrolls sideways inside its card when it is too wide.
- Never truncate a column heading or an essential identifier. Truncate only
  with a set width and a one-step way to see the full value.
- A row that opens something is a full-width selectable row with a hover fill
  and a focus ring. A real button sits in the identifier cell; the row element
  never takes a button role. Do not style the name as an underlined link.

## Anti-patterns

- Costs and counts ragged on the left, or a right-aligned header over
  left-aligned cells.
- One free-wrapping column eating the width while the rest squeeze.
- Key names cut to "prod-ap..." with no way to read the rest.
- "evt_7a3f9e2b" leading every row while the human name sits in column four.
- An underlined name as the only sign that the row opens a detail.

## Evidence

- <https://design-system.service.gov.uk/components/table/> (HTTP 200). Quote:
  "When comparing columns of numbers, align the numbers to the right in table
  cells."
- <https://www.nngroup.com/articles/data-tables/> (HTTP 200). Quote: "The
  (default ) first column should be a human-readable record identifier instead
  of a "mystery meat" automatically generated ID."
- <https://v4-archive.patternfly.org/v4/ux-writing/truncation> (HTTP 200).
  Quote: "Do not truncate text in column headings."
- <https://www.sap.com/design-system/fiori-design-web/v1-151/foundations/writing-and-wording/ux-writing/wrapping-and-truncating-text>
  (HTTP 200). Quote: "provide the user with a quick way to see the full text
  with one interaction".
- Owner correction: uneven column spacing reads as broken ("every time you make
  a new table you forget about even spacing"); every column is no-wrap.

## Check

- Is the first column a name a person would recognise?
- Are all numeric columns right-aligned, head and cells?
- Does any heading or identifier truncate without a way to see it whole?
- Can the user tell, without hovering, that a row opens something?
