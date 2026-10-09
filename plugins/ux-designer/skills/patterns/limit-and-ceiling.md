# Enter a value inside a limit

## Problem

The user types a number or text that has a minimum or maximum. They need to
know the range before typing, and when they go past it, what the limit is and
whether a higher one exists.

## Use when

- An input accepts a bounded number, length or count.
- The maximum may be raised by a higher plan, role or request.

## Do not use when

- The value is chosen from a short fixed set: use a select or radio group, which
  cannot go out of range.
- The limit is a running usage quota shown over time: use a usage meter in the
  summary, not a field error.
- The user cannot change anything about the limit and never reaches it: state
  nothing until they do.

## Rule

- State the range at rest, once, in the helper: "1 to 90 days". Do not repeat it
  in the label, a tooltip or a banner.
- Let the user type past the limit. Do not clamp or block keystrokes silently;
  validate and say what is wrong.
- The error names the field and the range in plain words: "Duration must be
  between 1 and 90 days". It does not repeat the helper sentence word for word.
- When the maximum is a plan or role ceiling, the path past it appears only at
  the moment of need: one short pointer next to the error ("Longer periods are
  on the next plan") with its one action. Keep the error itself a fixable
  instruction.
- Do not advertise the higher ceiling at rest in the helper; the range at rest
  is the user's own range.

## Anti-patterns

- No range stated until the user fails.
- The input silently changes 500 to 90.
- An error that says only "Invalid value".
- The helper and the error both spelling out the same range in two sentences.
- An upgrade banner at the top of the page for a limit in one field.

## Evidence

- <https://design-system.service.gov.uk/components/text-input/> (HTTP 200).
  Quote: "Say ‘[whatever it is] must be between [lowest] and [highest]’."
  Supports: the error names the field and the range.
- <https://design-system.service.gov.uk/components/character-count/> (HTTP 200).
  Quote: "The user can enter more than the character limit, but are told
  they’ve entered too many characters." Supports: inform, do not clamp.
- <https://www.nngroup.com/articles/error-message-guidelines/> (HTTP 200). Quote:
  "Merely stating the problem is also not enough; offer some potential
  remedies." Supports: a path past the ceiling at the moment of need.
- <https://design-system.service.gov.uk/components/error-message/> (HTTP 200).
  Quote: "Do not use error messages to tell a user that they are not eligible or
  do not have permission to do something." Supports: keep the error fixable and
  put the plan pointer beside it, not inside it.

## Check

- Is the range visible before the user types?
- Can the user type past the limit and get a clear message instead of a silent
  change?
- Does the error name the field and the range without repeating the helper?
- Does the higher-limit path appear only once the limit is hit, next to the
  field?
