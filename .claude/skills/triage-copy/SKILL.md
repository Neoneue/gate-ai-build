---
name: triage-copy
description: Turn Jev copy-lint output or any copy rewrite request into PRD-grounded proposals: run lint:copy on the touched pages, sort flags into rewrite / waive / judgment, look up the governing Notion PRD for each rewrite, and propose only wording whose every fact is in the old sentence or the PRD, with the source cited. Use automatically, without being asked, before proposing or applying any user-facing copy change, and whenever lint:copy reports a flag.
---

# triage-copy

Copy rewrites drift into invented mechanism ("traffic stops until the period
resets") because the tone lint rewards fluency, not truth. This skill fixes
the order so a rewrite cannot skip the source check (memories:
`feedback_copy-rewrites-never-add-facts`, `feedback_run-lint-copy-before-copy-batches`,
user 2026-09-21: "I don't want you to make up anything that isn't true").

## When it fires

Do not wait to be asked. Run it:

1. Before relaying any copy or audit batch that touches user-facing strings.
2. Whenever `npm run lint:copy` reports a flag on a touched page.
3. Before writing any new sentence into `src/pages` or `src/components`.

## Steps

1. **Lint.** `npm run lint:copy -- <touched files>` (opt-in Jev lint, key in
   `.env.local`; if the key is missing say the run was skipped and continue
   with the manual pass). Both questions at 0.7 is the gate; `--any` is
   exploration only.
2. **Sort.** Each flag goes in exactly one bucket:
   - *rewrite*: PRD echo or negative mechanism ("cannot", "there is no",
     "returns 429") that a user would not say.
   - *waive*: a definition answering a visible question, a switch tooltip
     that exists to say what the switch does, or demo narrative that makes
     mock numbers coherent. Add `{/* copy-allow: <reason> */}` above it.
   - *judgment*: accurate but stiff; list it, do not touch it unprompted.
3. **Source.** For each rewrite, find the governing PRD BEFORE drafting.
   Individual PRD pages move and get superseded, so never rely on a cached
   page id for one. Navigate top-down, live, every time:
   - Root: **Gate AI Platform** `320a94bd4b4f80f1930ed1ffabbae0b3`, then
     **Gate AI Product Docs** `320a94bd4b4f8083ad2bc018d1be8bd2`
     (path `Protocol Home / Gate AI Platform / Gate AI Product Docs`).
   - Horizons live under Product Docs: **Horizon 1 - Gate Launch (June
     2026)** `345a94bd4b4f813299dff9bf0555adec` and **Horizon 2 - Aug - Sep
     2026** `345a94bd4b4f8187ba66e8bc1427eab3`. A later Horizon appears as a
     new child of Product Docs; fetch Product Docs first to see the current
     list.
   - PRDs are children of a Horizon. Fetch the Horizon, find the PRD whose
     title matches the page area (Gateway, Billing, Accounts, org/team,
     Account Management, and so on), then fetch that PRD. H2 supersedes H1
     where both speak. Local slices: `docs/prds/`, `docs/tickets/`.
   - Read the section that governs the string. Note the facts it states and
     the facts the old sentence states.
4. **Draft.** The new sentence may drop mechanism and negatives. It may not
   add a fact absent from the old sentence and the PRD. Say less, never
   something friendlier that might be false. If the old sentence itself
   carries a fact the PRD contradicts, the fix is to remove that fact and
   flag it, not to restate it kindly.
5. **Cite.** Every proposal in the relay carries its source in one clause:
   "same facts as before", or "H2 org/team PRD 8.1 reassignment", or "Gateway
   PRD R7". A proposal without a source is not relayed.
6. **Re-lint** the edited files. A rewrite that still flags is reworded once;
   if it flags again the sentence is stating a rule, keep the rule's facts in
   user voice and waive with the PRD reference as the reason.

## Never

- Never rewrite to satisfy the lint. The lint narrows review; the PRD decides.
- Never touch copy on a page whose twins were not resolved (`verify-twins`).
- Never change a number, a plan name, a role name, or a product term without
  the PRD line that gives it.
