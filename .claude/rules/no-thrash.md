# Rule: stop-and-pin before debugging "it's not working"

The most expensive recurring failure on this project: editing/verifying the
**wrong surface**, patching forward instead of reverting, and looping in the
browser. This gate exists to stop that. It overrides the default urge to act.

## Triggers

Any of: "it's not working", "still the same", "nothing changed/changing",
"it's still <wrong value>", "you broke it", or a screenshot showing a wrong
result.

## Hard gate — do this BEFORE any Read/Edit/browser tool call

1. **Pin the surface first.** Reply with one line: *"You're on `<route>` → that
   renders `<file>`. Confirm?"* and STOP. No tool calls until the exact file
   rendering what the user sees is confirmed. **Free/Pro/Default twins are
   separate files** (`BillingFree` vs `Billing`, `PoliciesFree` vs `Policies`,
   `RequestsDefault` vs `Requests`, …). A fix in the wrong twin looks identical
   to a broken fix. The screenshot usually names the route — read it.
2. **Diff, don't guess.** Open that file. If a working twin/sibling exists,
   diff against it and copy the working approach verbatim rather than inventing.

## While fixing

3. **One change at a time.** If a change doesn't work, **revert it** before
   trying another — never stack a second patch on a failed first. Two failed
   edits to the same element → `git checkout` to last good state and restate the
   problem in plain words.
4. **Reason before editing.** State the cause and the fix in one line *before*
   the Edit. The browser *confirms* an answer; it does not *find* one.
5. **Cap verification.** At most one in-browser measurement per fix. If you're
   measuring the same thing a third time, stop and reason — the loop is the
   failure mode.

## Self-check

If you have made 2+ edits or 2+ browser measurements on one issue without a
confirmed root cause, you are thrashing. Stop, revert to last commit, and pin
the surface (step 1).

Two hard-won specifics this gate absorbs: (a) **confirm route→file before any
edit** — Free/Pro/Default twins are separate files, and a fix in the wrong twin
looks identical to a broken fix; (b) **passing tsc/lint/build is NOT proof a
feature works** (Vite renders despite TS errors) — verify working behavior
in-browser before and after a refactor, and revert to the last good commit
instead of patching a refactor forward. Relevant memory:
`feedback_reply-fast-no-overthinking`.
