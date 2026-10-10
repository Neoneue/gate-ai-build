# Learn what a higher plan unlocks

## Problem

The user hits something their plan does not include. They need to see what it
is, which plan includes it and how to get it, without being nagged everywhere
else.

## Use when

- A feature, setting or limit is locked by plan and the user is looking at it.
- The user has just hit a plan ceiling (see `limit-and-ceiling`).

## Do not use when

- The lock is a role, not a plan: offer a request or "Ask an admin", not an
  upgrade (see `locked-setting`).
- The user is not on the locked thing: do not interrupt an unrelated task with
  a plan prompt.
- The message is account-wide and urgent (payment failed, plan expiring): use
  one page banner (see `page-banners-and-inline-notices`).

## Rule

- The upgrade lives on the locked thing: its row, card footer or field, within
  sight of what it unlocks. One action per locked thing.
- Name the next plan that includes it ("Available on Pro"), not a list of every
  plan. The full comparison is one click away on the plans page.
- Say what the user gets, in the terms of the thing they are looking at, not a
  generic "Unlock more".
- At most one standing promotional surface per page; locked items carry their
  own small action instead of repeating a page banner.
- Paid users who already have the feature never see the prompt.

## Anti-patterns

- A page-wide upgrade banner above content that is not locked.
- An upgrade button in a different card from the thing it unlocks.
- A tier table squeezed into an inline notice.
- The same upgrade prompt on every row of a locked card.
- A lock icon with no words and no action.
- A guilt-trip decline ("No thanks, I don't care about security"). The dismiss
  is neutral ("Not now").

## Evidence

- <https://www.canva.dev/docs/apps/premium-apps/design-guidelines> (HTTP 200).
  Quote: "Users should be able to take action to upgrade their Canva plan within
  the immediate proximity of a premium crown icon." Supports: the upgrade sits
  on the locked thing.
- <https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/> (HTTP 200).
  Quote: "Unlike hidden features, disabled features can help users learn the
  UI, e.g., to understand the benefits of an upgrade." Supports: show locked
  items in place with their path.
- <https://www.uxtigers.com/post/inactive-buttons> (HTTP 200). Quote: "Best
  practice is to display disabled features in muted colors, accompanied by
  explanations of why they are currently unavailable." Supports: a reason on
  every locked item.
- Naming the next plan rather than every plan: rule of this library, no
  external source found.

## Check

- Is every upgrade action within sight of the thing it unlocks?
- Does the prompt name one plan, the next one that includes the feature?
- Is there at most one standing promotional surface on the page?
- Would a paid user who has the feature ever see this prompt?
