# Type a value into a field

## Problem

A field that hides its label in a placeholder, is sized for the wrong content,
or starts empty when a sensible default exists makes every user stop, guess
and retype.

## Use when

- Any text, number or select field, in a form, dialog or settings row.

## Do not use when

- The value is fixed by plan or role (see `locked-setting`).
- The field sits against a limit (see `limit-and-ceiling` for the range rules).

## Rule

- Every field has a visible label. A placeholder is never the label or the only
  hint; leave it out, or repeat a format example that the helper also shows.
- Size the field to the value it takes: a short numeric field with its unit,
  not a full-width box for a two-digit number.
- Preselect the common or safe value when one exists; "Select one" only when
  no default is safe.
- Keep what the user typed, through errors and failed submits.

## Anti-patterns

- An input whose only text is a grey "e.g. 30" inside the box.
- A full-width field for a day count.
- A model or region select that starts empty although most users pick the same
  option.

## Evidence

- <https://www.nngroup.com/articles/form-design-placeholders/> (HTTP 200).
  Quote: "Worst: In this example, placeholder text is used instead of a label."
- <https://design-system.service.gov.uk/components/text-input/> (HTTP 200).
  Quote: "Do not use placeholder text in place of a label, or for hints or
  examples". Also: "Help users understand what they should enter by making text
  inputs the right size for the content they're intended for."
- <https://www.nngroup.com/articles/top-10-application-design-mistakes/> (HTTP
  200). Quote: "Many apps provide Select one (i.e. no value selected at all) as
  the default choice, forcing every user to interact with the dropdown and
  select a value."

## Check

- Does every field have a visible label outside the box?
- Does each field's width hint at the value it takes?
- Is there a safe default the field could start with?
