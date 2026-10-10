# Notice something important on the page

## Problem

The user must notice a message about their account or the page, but banners
are easy to skip and each extra one makes the rest easier to ignore.

## Use when

- A message affects the whole page or account and is not tied to one control
  (a payment failed, a service incident, an outcome of the previous step).
- Guidance must be read before the user starts a task in one section (use an
  inline notice in that section).

## Do not use when

- The message is about one field: use inline help or `form-errors`.
- The message is about one setting or one locked item: put it on that item
  (`locked-setting`, `upgrade-prompts`).
- It confirms a just-finished action that needs no follow-up: use a toast.
- It is validation for a form: use field errors and an error summary.

## Rule

- At most one page banner per page, placed above the page title or content, at
  content width. If two messages compete, combine them or show the higher
  priority one.
- An inline notice sits inside the section it is about, at the top of that
  section, never at page level.
- Tone matches the stakes: neutral for information, warning for a risk the user
  can still avoid, error only for something broken now. No error colour for a
  plan or marketing message.
- Each notice holds one message and at most one action. No heading for a
  one-line notice.
- Prefer inline help next to the thing when the message is about the thing.
- A toast is for a passing confirmation only. Errors and validation stay inline
  at their source until resolved.

## Anti-patterns

- Two or three stacked banners at the top of a page.
- A banner explaining one field lower down the page.
- Error styling on an informational message.
- A permanent banner the user cannot act on or dismiss.
- A notice that repeats the section's own helper text.
- "Save failed" in a toast that disappears after four seconds.

## Evidence

- <https://design-system.service.gov.uk/components/notification-banner/> (HTTP
  200). Quote: "Use notification banners sparingly. There’s evidence that people
  often miss them, and using them too often is likely to make this problem
  worse." Supports: few banners.
- Same page. Quote: "Avoid showing more than one notification banner on the same
  page." Supports: one banner per page.
- Same page. Quote: "If the information is directly relevant to the thing the
  user is doing on that page, put the information in the main page content
  instead." Supports: inline help over banners for task-specific messages.
- <https://carbondesignsystem.com/components/notification/usage/> (HTTP 200).
  Quote: "Callouts are used to highlight important information that loads with
  the contents of the page, is placed contextually, and cannot be dismissed."
  Supports: an inline notice placed in its section.

## Check

- Is there at most one page banner?
- Is every message about a specific item placed on that item instead?
- Does the tone match the stakes, with error colour only for broken now?
- Does each notice carry one message and at most one action?
