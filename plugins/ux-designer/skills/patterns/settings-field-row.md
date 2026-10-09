# Change one setting

## Problem

The user scans a settings page for the one option they want to change. They
need the name and what it does on one side, the control on the other, and
clear feedback when a value is wrong.

## Use when

- A settings page or card lists several independent options.
- Each option has one control: a switch, select, short input or button.

## Do not use when

- The task is a data-entry form completed in order: stack the label above the
  input instead.
- The value is fixed for this user: use `locked-setting`.
- The option needs a large editor (a long text, a table): give it its own
  section with a full-width control.

## Rule

- Label and helper on the left, control on the right, on one row; the row stacks
  label above control on narrow screens.
- Label: a short noun phrase naming the setting (see `titles-and-labels`).
- Helper: one short sentence for most users (what it does or the allowed
  range), in muted text below the label. No helper if the label says it all.
- Error: appears below the helper, in error colour, says what is wrong now and
  how to fix it, and disappears once fixed. It never repeats the helper.
- One save model per form: switches save at once; inputs in a form save with
  the form's button. Do not mix the two inside one form.

## Anti-patterns

- A paragraph of helper text under every label.
- The error replacing the helper so the rule disappears exactly when needed.
- Switches that save instantly sitting inside a form with a Save button.
- Controls at varying horizontal positions down the list.
- The label describing the control's state instead of the setting.

## Evidence

- <https://primer.style/product/components/toggle-switch/guidelines> (HTTP 200).
  Quote: "By default, lay out a ToggleSwitch horizontally justified with its
  label and optional description." Supports: label and helper on one side,
  control on the other.
- <https://primer.style/product/ui-patterns/saving> (HTTP 200). Quote: "Avoid
  mixing explicit and automatic save patterns on a single page with multiple
  forms, and never mix save patterns in a single form." Supports: one save
  model per form.
- <https://design-system.service.gov.uk/components/text-input/> (HTTP 200).
  Quote: "Keep hint text to a single short sentence, without any full stops."
  Supports: one-sentence helper.
- <https://design-system.service.gov.uk/components/error-message/> (HTTP 200).
  Quote: "put the message in red after the question text and hint text".
  Supports: error below the helper, helper kept.

## Check

- Does every control sit in the same column on wide screens?
- Is each helper one short sentence, or absent?
- Does the error appear below the helper without replacing or repeating it?
- Does the form use one save model throughout?
