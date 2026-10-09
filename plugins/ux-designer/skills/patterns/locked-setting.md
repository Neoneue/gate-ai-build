# See a setting I cannot change

## Problem

The user sees a setting their plan or role does not let them change. They need
to know its current value, why it is fixed, and how to get it changed, without
mistaking it for a broken control.

## Use when

- The setting has a real current value the user should know.
- The lock comes from the plan or the role, not from an unfinished step on the
  same screen.
- The user can do something about it (upgrade, or ask someone who can).

## Do not use when

- The control is waiting on a prerequisite on the same screen (select a row
  first, fill a field first): use a disabled control with a short reason.
- The setting can never apply to this user and they cannot unlock it: hide it.
- The whole surface is a review step: show plain text with no lock treatment.

## Rule

- Show the current value as text in the same place the control would sit, at
  full contrast. Do not show a greyed-out input, select or switch.
- Add one short line: why it is fixed and what unlocks it (the plan that
  includes it, or the role that can change it). One sentence, no repetition of
  the value.
- Give exactly one action on the setting's own surface: Upgrade for a plan
  lock, Request access or "Ask an admin" for a role lock. Never place it in
  another card's footer or in a page banner.
- Keep the label and value styling identical to the editable version; mute only
  the affordance that is missing.
- A whole locked card gets its upgrade action in its own footer, once, not on
  every row inside it.

## Anti-patterns

- A disabled input whose value is too faint to read.
- A disabled control with no reason and no path to change it.
- A lock icon with the explanation only in a hover tooltip.
- The upgrade action placed on a neighbouring card or at the top of the page.
- Both Upgrade and Contact sales offered for the same lock.

## Evidence

- <https://cloudscape.design/patterns/general/disabled-and-read-only-states/>
  (HTTP 200). Quote: "Use a read-only state when the content is not to be
  modified by the user but they still need to view it." Supports: read-only
  value, not disabled, for a permission lock.
- Same page. Quote: "Use one sentence to describe what is disabled and the
  reason." Supports: the single reason line.
- <https://carbondesignsystem.com/patterns/read-only-states-pattern/> (HTTP 200).
  Quote: "Don’t use disabled states in place of read-only states." Supports:
  read-only display over a disabled input.
- <https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/> (HTTP 200).
  Quote: "Be sure to explain why a feature is disabled and also how to
  re-enable it." Supports: reason plus the path to unlock.

## Check

- Is the current value readable at full contrast?
- Does one line say why it is fixed and what unlocks it?
- Is there exactly one action, and does it sit on this setting's own surface?
- Would a user mistake this for a broken or loading control?
