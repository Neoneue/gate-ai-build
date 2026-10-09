# Confirm an action I cannot undo

## Problem

The user is about to delete or revoke something permanently. They need one
clear chance to check what will happen, without a dialog they learn to click
through.

## Use when

- The action is destructive or irreversible (delete, revoke, cancel, discard
  unsaved work).
- The action affects other people or many objects at once.

## Do not use when

- The action can be undone: act immediately and offer Undo in a toast.
- The action is routine and frequent: no confirm, or the confirm becomes a
  reflex.
- The decision needs several inputs or steps: use a page or a multi-step flow.

## Rule

- The title is a short question naming the action and the object: "Delete
  production key?".
- The body says, once, what will happen that the title does not: the specific
  object, what else is affected, and that it cannot be undone. It does not
  restate the title.
- The confirm button repeats the verb and object ("Delete key"), in the danger
  style; the other button is "Cancel". Never Yes / No / OK.
- Match friction to cost: a plain confirm for most deletes; type-to-confirm only
  for the most severe, wide-reaching ones.
- Escape and Cancel do the safe thing; focus starts on the least destructive
  control.

## Anti-patterns

- "Are you sure?" as the title.
- A body that repeats the title in a longer sentence.
- Yes / No or OK / Cancel buttons.
- A confirm on every routine action, so users click through all of them.
- The object's name missing, so the user cannot tell which one goes.

## Evidence

- <https://www.nngroup.com/articles/confirmation-dialog/> (HTTP 200). Quote: "A
  confirmation dialog must restate the user’s request and explain what the
  computer is about to do, with specific information". Supports: name the
  object and the effect.
- Same page. Quote: "Instead of Yes/No answers, provide response options that
  summarize what will happen for each possible response." Supports: verb-object
  button labels.
- <https://primer.style/product/components/confirmation-dialog/guidelines> (HTTP
  200). Quote: "Frequent actions: Operations that users perform regularly (this
  creates fatigue)". Supports: no confirm for routine actions.
- <https://primer.style/product/scenario-patterns/delete> (HTTP 200). Quote: "Too
  much friction slows people down and trains them to click through every
  warning." Supports: friction matched to cost.

## Check

- Does the title name the action and the object as a question?
- Does the body add facts the title does not, without repeating it?
- Does the confirm button say the verb and object, not Yes or OK?
- Is the action actually irreversible, or would Undo serve better?
- Is extra friction reserved for the most severe case?
