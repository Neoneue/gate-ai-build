# Act on the right object

## Problem

The user reads an action by where it sits: a button inside a card reads as an
action on that card. When actions land in the wrong container, compete as
equals, hide in a menu or carry vague labels, the user acts on the wrong thing
or cannot find the right one.

## Use when

- A surface adds or moves any action (button, link, menu item).
- A card, section or row carries actions in its header, footer or row end.
- Deciding which action on a view is the primary one.

## Do not use when

- The control is an input value, not an action (a switch that is the setting
  itself belongs to `settings-field-row`).
- The action is a destructive confirm inside a dialog (see
  `destructive-confirmation` for its wording).

## Rule

- An action changes the object of the container it sits in. A card footer
  holds only actions on that card's own object. Page, plan, account or
  workspace actions (Upgrade, Billing, Invite) go in the page header or on that
  object's own surface. One exception: a read-only, plan-locked card's own
  upgrade is that card's action and sits in its footer.
- The header action slot of a card holds controls only (a button, a menu
  trigger, a range selector); never a total, a count or a label.
- One primary action per view; every other action is outline or ghost.
- Destructive actions are quiet at rest (outline, ghost, or last in a menu after
  a separator) and far from the benign action beside them.
- The same kind of action sits in the same place on every section and row.
- Frequent actions stay visible; an overflow menu holds only rare ones.
- An icon-only button is for universal glyphs (copy, close, search, more);
  anything else carries a text label. Icon-only buttons always have an
  accessible name and a tooltip.
- A label is a specific verb and object ("Export view", "Revoke key"), never
  "OK", "Yes", "Done", "Submit" or "Learn more".

## Anti-patterns

- "Upgrade plan", "Billing" or "Invite" in a settings card's footer.
- "+1 seat" or a total sitting in a card's header action slot.
- "Save", "Create key" and "Upgrade" all filled dark on one view.
- A solid red "Delete workspace" as the loudest thing on the page, or "Revoke"
  directly under "Copy" with no separator.
- "Edit" top right on one card and at the bottom of the next.
- A "..." menu holding the one action most users came for.
- A row of unlabelled icons whose meaning only appears on hover.

## Evidence

- <https://www.nngroup.com/articles/gestalt-proximity/> (HTTP 200). Quote:
  "Design elements near each other are perceived as related, while elements
  spaced apart are perceived as belonging to separate groups." Supports: an
  action reads as belonging to its container.
- <https://carbondesignsystem.com/components/button/usage/> (HTTP 200). Quote:
  "Each page should have only one primary button." Supports: one primary.
- <https://design-system.service.gov.uk/components/button/> (HTTP 200). Quote:
  "Having more than one main call to action reduces their impact, and makes it
  harder for users to know what to do next."
- <https://www.nngroup.com/articles/proximity-consequential-options/> (HTTP
  200). Quote: "Confirmatory and destructive actions should be far apart from
  each other; use additional redundant visual signals to differentiate between
  them and avoid user errors."
- <https://www.nngroup.com/articles/consistency-and-standards/> (HTTP 200).
  Quote: "they should use the same patterns everywhere inside the system".
  Supports: actions keep their position.
- <https://www.nngroup.com/articles/top-10-application-design-mistakes/> (HTTP
  200). Quote: "These menu labels have low information scent and are nothing
  more than a junk drawer". Supports: frequent actions stay out of overflow.
- <https://www.nngroup.com/articles/icon-usability/> (HTTP 200). Quote: "a text
  label must be present alongside an icon to clarify its meaning in that
  particular context."
- <https://carbondesignsystem.com/components/modal/usage/> (HTTP 200). Quote:
  "Avoid vague or passive words, such as Done or OK."
- Owner correction (2026-10-07): an "Upgrade plan" button in a card footer
  "feels like its a card action. BAD UX." Owner ruling (2026-10-08): a
  read-only, plan-locked card's own upgrade sits in its own footer.

## Check

- For every action: which object does it change, and is that the object of the
  container it sits in?
- Is there exactly one primary action in the view?
- Does any card header action slot hold something that is not a control?
- Is every destructive action quiet at rest and away from the benign one?
- Does every label name a verb and an object?
