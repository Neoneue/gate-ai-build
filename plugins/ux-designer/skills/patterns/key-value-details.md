# Read the facts about one object

## Problem

The user opens an object (a key, a project, an invoice, a member) and needs to
read its properties quickly and find the one they came for.

## Use when

- One object has several named properties, each with one value.
- The facts are read-only, or each has its own change action.
- Several objects of the same type each need their own block of facts and their
  own actions (use one card per object, each holding label-value rows).

## Do not use when

- Many objects share the same attributes and the user compares across them: use
  a table.
- The values are a handful of headline numbers the user monitors: use
  `stat-summary`.
- The list is items or tasks without a label for each value: use a plain list.
- The values are editable inline as a form: use `settings-field-row`.

## Rule

- Default to label-value rows (a description list): label in muted text, value
  in foreground, one fact per row, rows in one column or a two-column grid on
  wide surfaces.
- Do not turn each fact into its own tile or card. A tile per fact costs a box,
  padding and a border for one value and breaks scanning down one edge.
- Use a card per object only when several objects of the same type sit on one
  surface, or when actions apply to the whole block. A single small set of facts
  gets rows under a heading, not a card of its own.
- A per-fact action (Change, Copy) sits at the end of its row, in the same place
  on every row. An action on the whole object sits in the block header.
- More than about seven facts: split into labelled groups by meaning, never
  nest a list inside a value.
- An empty value shows an explicit placeholder (for example "None" or "Not
  set"), never a blank cell.

## Anti-patterns

- A grid of tiles, each holding one label and one value.
- Labels and values in the same weight and colour, so nothing leads.
- Change actions that move position from row to row.
- A table with a single row used to show one object's facts.
- Blank values that read as a loading or rendering bug.

## Evidence

- <https://design-system.service.gov.uk/components/summary-list/> (HTTP 200).
  Quote: "Use a summary list to show information as a list of key facts."
  Supports: label-value rows as the default for an object's facts.
- Same page. Quote: "Do not use summary cards if you only need to show a small
  amount of related information. Use summary lists instead, and structure them
  with headings if needed." Supports: rows under a heading, not a card, for a
  small set.
- <https://carbondesignsystem.com/components/structured-list/usage/> (HTTP 200).
  Quote: "These lists usually consist of read-only information and rows are not
  selectable." Supports: a structured row list for read-only facts.
- <https://cloudscape.design/components/key-value-pairs/> (HTTP 200). Quote:
  "Key-value pairs are lists of properties (labels) followed by their
  corresponding values." Supports: the label-then-value shape.

## Check

- Can the user find a given fact by scanning one edge of labels?
- Is each fact in a row rather than its own tile or card?
- Do per-fact actions sit in the same position on every row?
- Is every empty value shown as explicit text?
- Would a table serve better because the user compares several objects?
