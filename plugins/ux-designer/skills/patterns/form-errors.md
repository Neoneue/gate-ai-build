# Fix what I entered wrong

## Problem

The user entered something the system cannot accept. They need to see which
field, what is wrong, and how to fix it, without losing what they typed.

## Use when

- A field value fails validation on blur or on submit.
- A server check rejects a value that belongs to one field.

## Do not use when

- The problem is not something the user can fix in the field (no permission, a
  plan limit, a service outage): use `locked-setting`, `upgrade-prompts` or a
  page notice.
- The field is still being typed in for the first time: do not validate yet.

## Rule

- Place the error next to the field, below its helper, and mark the control
  itself; the label stays its normal colour.
- Say what is wrong and how to fix it, using the field's own name: "Enter a
  name with 2 to 35 characters", not "Invalid input".
- Do not repeat the helper or its example. The error adds what is wrong now.
- Validate after the user leaves the field or submits, not on each keystroke of
  a first entry. Remove the error as soon as the value is fixed.
- Keep what the user typed. Never clear the field.
- On submit with several errors, move focus to the first one or to a summary
  that links to each.

## Anti-patterns

- "Something went wrong" or "Invalid value" with no fix.
- An error that copies the helper sentence.
- Errors that appear while the user is still typing for the first time.
- A cleared field after a failed submit.
- A red field label instead of a marked control and message.
- An error that stays after the value is corrected.

## Evidence

- <https://design-system.service.gov.uk/components/error-message/> (HTTP 200).
  Quote: "Describe what has happened and tell them how to fix it." Supports:
  what is wrong plus the fix.
- Same page. Quote: "Do not give an example in the error message if there is an
  example on the screen." Supports: no restating the helper.
- <https://www.nngroup.com/articles/errors-forms-design-guidelines/> (HTTP 200).
  Quote: "Keeping error messages next to the fields in error minimizes
  working-memory load". Supports: error placed at the field.
- <https://baymard.com/blog/inline-form-validation> (HTTP 200). Quote: "it’s key
  that fields aren’t prematurely validated, that error messages are removed as
  soon as the input is corrected". Supports: validation timing and removal.

## Check

- Does the error sit at its field and name what is wrong and the fix?
- Does it avoid repeating the helper or its example?
- Is the user's input kept after a failed submit?
- Does the error disappear as soon as the value is valid?
