# Read each fact once

## Problem

When the same number or sentence appears in a helper, a readout, an error and
a dialog, the user reads it several times, cannot tell which one is current,
and misses what is new.

## Use when

- Any surface (page, card, dialog, form) shows a value, a range, a limit or an
  explanation.
- Reviewing a design that adds a helper, badge, tooltip or banner to an
  existing surface.

## Do not use when

- The value is the subject of a different surface the user moves to (a detail
  page repeating the list row's name as its title is the expected wayfinding,
  not duplication).
- A confirm dialog must restate the action being confirmed (see
  `destructive-confirmation`); it states it once there, not on top of the
  trigger's label and a body sentence that repeats both.

## Rule

- Each fact has one home per surface. Pick the home closest to where it is used
  and remove the others.
- Helper, readout, error and dialog body each add something new: the helper
  states the rule, the readout states the current value, the error states what
  is wrong now and the fix. None restates another.
- A title and its body do not say the same thing in different words.
- A number shown in a summary tile is not repeated in a sentence beneath it.
- If two places need the same fact, one shows it and the other links to it.

## Anti-patterns

- A helper that says "Between 1 and 90 days" and an error that says the same
  sentence again.
- A dialog title "Delete key?" over a body that opens "Are you sure you want to
  delete this key?".
- A stat tile reading "42 requests" with a caption "You made 42 requests".
- A tooltip that repeats the visible label.
- A banner restating a field's own helper text.

## Evidence

- <https://www.nngroup.com/articles/aesthetic-minimalist-design/> (HTTP 200).
  Quote: "Every extra unit of information in an interface competes with the
  relevant units of information and diminishes their relative visibility."
  Supports: a repeated fact lowers the visibility of everything else.
- <https://design-system.service.gov.uk/components/error-message/> (HTTP 200).
  Quote: "Do not give an example in the error message if there is an example on
  the screen." Supports: errors do not restate the helper.
- <https://developers.google.com/style/headings> (HTTP 200). Quote: "Avoid
  repeating the exact page title in a heading on the page." Supports: one home
  for a name within a surface.

## Check

- Does any value or sentence appear twice on this surface?
- Does the error add something the helper does not say?
- Does the dialog body add information beyond its title?
- Where a fact is needed in two places, does one link to the other?
