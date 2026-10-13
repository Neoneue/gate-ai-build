# See what matters now, the rest when I ask

## Problem

A surface that shows every option, explanation and edge case at once buries
the one thing most users came for.

## Use when

- Some content or settings are needed by only some users or only some of the
  time.
- Extra detail matters only after an interaction (a switch turned on, an error,
  a row opened).

## Do not use when

- Most users need the content to do the task: keep it visible.
- The hidden part would be the only explanation of a consequence (cost, data
  loss): show it at the point of decision.
- The content needs more than one more level to reach: restructure into a
  separate page instead of nesting.

## Rule

- At rest: the title, the current value and the primary action. Nothing that
  only some users need.
- On interaction: content that depends on a choice appears after that choice
  (a switch reveals its options below it).
- On error: the reason and the fix appear next to the field, then disappear
  once fixed (see `form-errors`).
- On demand: rarely needed detail sits behind one clearly labelled trigger
  ("Advanced settings", "Show details"). One level deep, two at most.
- The trigger label predicts what is behind it; no bare "More".

## Anti-patterns

- A paragraph of explanation at rest above a single field.
- Help text that most users need hidden behind an info icon.
- Advanced options nested three levels deep.
- A "Show more" link whose content is a surprise.
- Revealed content that appears above the control that revealed it.
- Data the user must compare split across tabs, so they flip back and forth
  holding values in memory.

## Evidence

- <https://www.nngroup.com/articles/progressive-disclosure/> (HTTP 200). Quote:
  "Initially, show users only a few of the most important options." Supports:
  the at-rest set is small.
- Same page. Quote: "designs that go beyond 2 disclosure levels typically have
  low usability because users often get lost when moving between the levels."
  Supports: one level, two at most.
- <https://design-system.service.gov.uk/components/details/> (HTTP 200). Quote:
  "Do not use the details component to hide information that the majority of
  your users will need." Supports: do not hide what most users need.
- <https://primer.style/product/components/toggle-switch/guidelines> (HTTP 200).
  Quote: "Content revealed on ToggleSwitch activation should always come after
  the ToggleSwitch." Supports: revealed content follows its trigger.

## Check

- Does the at-rest view hold only what most users need?
- Is every hidden item one labelled click away, two at most?
- Does each trigger label predict what it reveals?
- Is any consequence the user must know hidden behind a click?
