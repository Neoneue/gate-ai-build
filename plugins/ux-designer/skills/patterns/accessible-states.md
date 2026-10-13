# Use it without color or a mouse

## Problem

Status shown only by color disappears for color-blind users and in grayscale.
Links inside hover tooltips cannot be reached by keyboard or touch. A focus
ring or popup clipped by its container leaves keyboard users lost.

## Use when

- A surface shows a status, uses a tooltip, or places focusable controls inside
  a scrolling or clipped container.

## Do not use when

- Never skip it.

## Rule

- Color never carries meaning alone: pair it with a word or an icon (a status
  badge that says "Blocked").
- Tooltips hold plain text only. Anything interactive goes on the surface or in
  a popover with its own trigger.
- Nothing is clipped by its container: not a focus ring, a tooltip, a menu or a
  shadow. Reserve room inside the container or render the layer outside it;
  fix the shared component, not one call site.

## Anti-patterns

- A green or red dot with no text for passed or blocked.
- An "Upgrade" link inside a hover tooltip.
- A focus ring cut off by a card's hidden overflow; a menu clipped by a scroll
  container.

## Evidence

- <https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html> (HTTP 200).
  Quote: "Color is not used as the only visual means of conveying information,
  indicating an action, prompting a response, or distinguishing a visual
  element."
- <https://carbondesignsystem.com/components/tooltip/usage/> (HTTP 200). Quote:
  "Do not include interactive elements within a tooltip."
- <https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html> (HTTP 200).
  Quote: "Without a focus indicator, sighted keyboard users cannot operate the
  page."

## Check

- Turn the screen grayscale: is every status still readable?
- Can every link and button be reached with Tab alone?
- Tab through every scrolling region: is each focus ring fully visible?
