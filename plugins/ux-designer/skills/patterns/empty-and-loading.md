# Know whether data is empty, loading or zero

## Problem

A blank card, a row of zeros and a page that is still loading can look the
same. When a surface claims "nothing here" before it knows, shows zeros as if
they were measured, or swaps its chrome for grey bars, the user misreads the
state and loses their place when the data lands.

## Use when

- A surface fetches data, can be empty, or can be filtered to no results.

## Do not use when

- The surface has static content only.

## Rule

- Loading: render the chrome as itself (titles, column heads, toolbars, tabs,
  buttons, units) and skeleton only the values, at the same size as what is
  coming, with one skeleton row per row expected. One status announcement for
  screen readers per page; no spinner and no visible "Loading" text.
- Empty is a conclusion: show it only after loading has finished.
- A first-use empty state says what will appear and the next action, with the
  action itself. Positive framing ("Start by adding a key"), not a statement of
  absence ("You don't have any keys", "There is no data").
- No traffic yet keeps the header and shows an explanation, never zeros that
  look like a measurement.
- A filtered-to-nothing state keeps the filters and search visible so the user
  can undo them; the empty state governs only the card interior.

## Anti-patterns

- An empty card body with nothing in it.
- "0 requests, $0.00" before any traffic exists.
- "No members yet" flashing before the members load.
- A centred spinner, or titles and buttons replaced by grey bars.
- One skeleton row standing in for ten real rows.
- A zero-result filter that also hides the search box that caused it.

## Evidence

- <https://www.nngroup.com/articles/empty-state-interface-design/> (HTTP 200).
  Quote: "Totally empty states cause confusion about how and whether the system
  is working."
- <https://carbondesignsystem.com/patterns/empty-states-pattern/> (HTTP 200).
  Quote: "Body: Explain clearly the next action to populate the space."
- <https://carbondesignsystem.com/patterns/loading-pattern/> (HTTP 200). Quote:
  "In most cases, action components (e.g. buttons, input fields, checkboxes,
  toggles) do not need to have a skeleton state."
- <https://cloudscape.design/patterns/general/empty-states/> (HTTP 200). Quote:
  "A zero results state occurs when users have filtered and there are no
  matches."
- Rule of this library, owner direction: no visible spinner; skeleton the
  value, keep the chrome (owner wins over NN/g's allowance for spinners on 2 to
  10 second waits).

## Check

- During loading, does every title, tab and button render as itself?
- Can the empty state appear before loading has finished?
- Does the empty state name the next action and offer it?
- After filtering to nothing, can the user still reach the filters?
