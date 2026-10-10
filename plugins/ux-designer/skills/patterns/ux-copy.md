# Read copy that earns its place

## Problem

Helper text that says what the surface already shows, product mechanics copied
from a requirements document, and technical detail in place of an explanation
all cost reading time and bury the one line that matters.

## Use when

- Any surface adds or changes a title, helper, note, error or empty-state line.

## Do not use when

- The text is data (names, ids, values), not copy.

## Rule

- If the surface already implies a fact, do not write it. A behavioural
  requirement (how enforcement works, what a system does internally) gets no
  explanatory UI.
- Requirements documents give facts, not voice. Write what the user gets or must
  do; cut logistics, "cannot" and "there is no". One idea per sentence.
- Errors and notices say what happened and how to fix it in plain words. Keep
  real status codes beside the explanation for a technical audience.
- A dismiss link is neutral ("Not now"); never guilt-trip the user out of an
  offer.

## Anti-patterns

- "Here you can manage your settings." under the title "Settings".
- "through its own billing configuration", "that your teams cannot override",
  "there is no self-serve upgrade".
- An error showing only an internal field name or a stack code.
- "No thanks, I don't care about security" as a decline link.

## Evidence

- <https://atlassian.design/foundations/content/designing-messages/error-messages>
  (HTTP 200). Quote: "Make every word count and avoid irrelevant details."
- <https://www.nngroup.com/articles/error-message-guidelines/> (HTTP 200).
  Quote: "Avoid technical jargon and use language familiar to your users
  instead."
- <https://www.deceptive.design/types/confirmshaming> (HTTP 200). Quote:
  "Confirmshaming works by triggering uncomfortable emotions, such as guilt or
  shame, to influence users' decision-making."
- Owner correction: "We humans do something called extrapolating." Copy is for
  users, not an echo of the requirements document.

## Check

- Does every sentence say something the surface does not already show?
- Does any line describe how the system works instead of what the user gets?
- Does every error name the cause and the fix?
