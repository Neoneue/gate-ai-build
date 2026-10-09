# Name a card, section or field

## Problem

The user scans titles and labels to find the right place. Long or repeated
names slow the scan and make every heading look the same.

## Use when

- Writing a page, card, section, field, column or switch name.
- Renaming an object that appears in several places.

## Do not use when

- The text explains how something works or what happens next: put it in the
  helper line (see `settings-field-row`) or body copy, not the title.
- The text is a status or an outcome: use a badge, notice or toast.

## Rule

- Titles and labels are short noun phrases for things ("Billing address",
  "Data residency") and bare verbs for tasks ("Invite members"). No sentences,
  no ending punctuation, sentence case.
- Name the object once per region. A child heading does not repeat its parent:
  under a "Keys" card the columns are "Name" and "Created", not "Key name" and
  "Key created".
- A field or switch label names the setting, not its state ("Two-factor
  authentication", not "Two-factor authentication is on").
- Use the same name for the same object everywhere: nav item, page title,
  dialog title and error text.
- No leading articles or filler ("Your", "The", "This is").

## Anti-patterns

- A card title written as a sentence explaining the card.
- A section heading that repeats the page title.
- Every column prefixed with the object name.
- A switch label that flips text with the switch state.
- The same object called by two names on one surface.

## Evidence

- <https://developers.google.com/style/headings> (HTTP 200). Quote: "using bare
  infinitives for tasks and noun phrases for concepts." Supports: noun phrases
  for things, verbs for tasks.
- Same page. Quote: "Avoid repeating the exact page title in a heading on the
  page." Supports: name the object once per region.
- <https://primer.style/product/components/toggle-switch/guidelines> (HTTP 200).
  Quote: "Each ToggleSwitch needs a concise label describing the action (e.g.,
  "Discussions" or "Automatically watch repositories"). Avoid state-descriptive
  labels." Supports: labels name the setting, not its state.
- <https://design-system.service.gov.uk/components/error-message/> (HTTP 200).
  Quote: "Error messages should directly include language from the question or
  fieldset label." Supports: one name for one object across label and error.

## Check

- Is every title a short noun or verb phrase with no ending punctuation?
- Does any heading repeat its parent's name?
- Does each switch or field label name the setting, not its state?
- Is each object called by the same name everywhere on the surface?
