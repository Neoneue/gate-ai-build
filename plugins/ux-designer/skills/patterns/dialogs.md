# Finish a short task in a dialog

## Problem

A modal interrupts the user and hides the page they were working in. Used for
detail views or unrequested information, it costs context; laid out tight, it
reads cramped and the commit band blurs into the content.

## Use when

- A confirmation, or a short focused task with one or a few fields.

## Do not use when

- Showing a record's full detail: give it its own page.
- Announcing information the user did not ask for.
- Confirming an irreversible action's wording (see `destructive-confirmation`).

## Rule

- A modal is never the first idea. Detail views are pages; inspection that must
  keep the list in view is a side sheet.
- A dialog does one thing: its title names it, its body holds only what that
  task needs, and its footer holds the commit and cancel actions.
- Leave 24px between the last content and the footer button row.
- The dialog's own close control is the standard one, in the same corner on
  every dialog.

## Anti-patterns

- A request's full detail in a modal over the table.
- An information popup on page load.
- Footer buttons 8 to 16px under the last paragraph.

## Evidence

- <https://www.nngroup.com/articles/modal-nonmodal-dialog/> (HTTP 200). Quote:
  "Modal dialogs interrupt users and demand an action." Also: "When a dialog
  appears on top of the current window, it can cover important content and
  remove context."
- Owner rules: detail surfaces are pages; dialog footer buttons sit 24px below
  the body (standing component styling).

## Check

- Could this be a page or a sheet instead of a modal?
- Does the dialog do exactly one task?
- Is there 24px above the footer buttons?
