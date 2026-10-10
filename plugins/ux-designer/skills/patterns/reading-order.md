# Read the page in the right order

## Problem

The eye lands on what is largest, darkest and best aligned. When every element
has the same weight, edges almost line up, spacing does not show what belongs
together, or a layout is invented instead of familiar, the user cannot find
where to start or what goes with what.

## Use when

- Composing any new surface or changing what leads on an existing one.
- Reviewing a built screen for hierarchy and alignment.

## Do not use when

- Never skip it: every surface has a reading order.

## Rule

- Titles and names are foreground and largest; supporting text is muted.
  Hierarchy comes from size, weight and voice; color is kept for state.
- One leading element per view.
- Align to a shared edge: every list uses one label track width, so every
  control, value or bar starts on one line.
- Proximity shows grouping: a label sits tight to its own control, with a larger
  gap between groups.
- A header holds one purpose line. Periods, caveats and timestamps go where they
  are used (the lede, the footer), not stacked under the title.
- A section title sits above its card, not nested inside it.
- Small mono uppercase labels (eyebrows) are chrome: KPI labels and navigation
  section headers only, never a form label or a content card title.
- A collapsible section is a full-width header row (title, chevron at the right
  edge, whole row clickable, hover fill), never a small text button.
- Start from a tested layout that users already know from comparable products,
  mapped to existing components, and record the alternative you rejected.

## Anti-patterns

- Title, labels, values and helper text in the same color and weight.
- Controls at slightly different x down a settings list; bars starting at
  different x because their label tracks differ.
- A label as close to the field above as to its own.
- A card header stacking subtitle, period, caveat and timestamp.
- A mono uppercase eyebrow on a form field.
- "Show advanced" as a small ghost link under a section.
- A bespoke 4 + 1 grid with an orphan full-width tile.

## Evidence

- <https://www.nngroup.com/articles/visual-hierarchy-ux-definition/> (HTTP
  200). Quote: "When too many colors of similar value or saturation are used,
  people's perception of hierarchy among elements is often reduced."
- <https://www.nngroup.com/articles/using-grids-in-interface-designs/> (HTTP
  200). Quote: "Because of their consistent reference point, grids improve page
  readability and scannability and allow people to quickly get where they need
  to go."
- <https://www.nngroup.com/articles/web-form-design/> (HTTP 200). Quote: "Avoid
  ambiguous spacing, where labels are equidistant from multiple fields".
- <https://www.nngroup.com/articles/top-10-application-design-mistakes/> (HTTP
  200). Quote: "Remember Jakob's law: "users spend most of their time on other
  websites."" Supports: start from a familiar pattern.
- Owner rule: "If everything is foreground, nothing is important." Owner
  correction (2026-10-08): "no more invented ui that doesn't fit our work".

## Check

- Squint: does exactly one element lead?
- Do all controls, values and bars in a list start on one vertical line?
- Is every label closer to its own control than to any other?
- Which tested product uses this layout, and which alternative was rejected?
