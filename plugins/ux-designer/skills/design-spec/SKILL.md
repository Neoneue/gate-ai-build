---
name: design-spec
description: The spec the designer writes before any UI code, its exact format (the plugin hook validates it), and the verify step after the build. Use at the start of every UI request, and again before saying done.
---

# Design spec

Write the spec to a file named `design-spec.md` (or `design-spec-<slug>.md`)
in your scratchpad directory, with the Write tool. The plugin hook reads it
on write and tells you what is missing. UI files stay locked until the spec
is valid AND the owner has replied after it.

## Format (validated)

```markdown
# Spec: <surface, e.g. "Settings > Notifications card">

## Requirements
| # | Requirement (what the user must learn or do) | Moment | Home | Reason |
| --- | --- | --- | --- | --- |
| 1 | Admin sees the current limit | always | Details list, "Limit" row | needed to confirm the setting works |
| 2 | Admin learns how to raise the limit | error | field error when over the max | most admins never need it; at rest it is noise |
| 3 | Brief: "a banner explaining limits" | cut | none | requirement 2 already delivers it at the moment of need |

## Surface
| Element | Says (only here) | Tier | Column | Copy | States |
| --- | --- | --- | --- | --- | --- |
| Card title | what the card controls | 1 | left | "Limits" | all |

## Values
| Value | Home |
| --- | --- |
| current limit (e.g. 90) | input (editable tiers), Details "Limit" row (read-only tiers) |

## Candidates
### A: <name>
(text wireframe)
### B: <name>
(text wireframe)

## Decision
Chosen: A, because ...
Rejected: B, because ...
Precedent: <URL you fetched or searched this session> -> <the project component it maps to>
```

Rules the hook checks:

1. All five sections exist: Requirements, Surface, Values, Candidates, Decision.
2. Every Requirements row has a Moment from: `always`, `interaction`,
   `error`, `elsewhere`, `cut`, `deferred`. A `cut` or `deferred` row has a
   Reason.
3. Surface has at least 3 rows. Every element has a "Says" entry.
4. No value appears twice in the Values table.
5. At least two `###` candidates.
6. `Chosen:`, `Rejected:` and `Precedent:` lines; the Precedent URL was
   fetched or searched in this session (WebFetch or WebSearch).

Rules the hook cannot check, and the reviewer will:

- The Surface table covers the WHOLE surface, existing elements included.
- No two Surface rows say the same thing ("Says" overlaps = filler).
- Each value's Home is one place per tier. "Input and Details row" on the
  same tier is two homes: pick one.
- Every brief line appears in Requirements (met, cut, merged or deferred).

## Tiny mode

For a change the owner fully specified (one value, class or string), the
whole file is one line:

```text
Tiny: <change>, <file>, <why nothing else on the surface changes>
```

It unlocks edits to one file only. The owner's instruction that produced it
is the approval; no second round.

## Present

Show the owner: the Requirements table (cuts and moves first), the Values
table, the chosen wireframe and the one-line Decision. Then stop. Do not
ask "should I proceed"; the hook waits for their reply.

## Verify (before saying done)

1. Screenshot every state the Surface table lists, every tier or role
   variant included, with the project's screenshot method (adapter).
2. Run the duplicate checker on each rendered surface. The plugin root is
   given in your session context ("ux-designer plugin root"):
   `node <plugin root>/scripts/dup-check.mjs --url <page url> --selector "<css for the surface>"`
   or, without Playwright, save the surface's visible text and input values
   to a file and run `--text <file>`. Every repeated value it lists is a
   defect unless the spec's Values table explains it.
3. Spawn `ux-designer:reviewer` with: the spec path, the screenshot paths,
   the changed files. Fix what it confirms; answer each finding in the
   report.
4. Report each spec line as match or mismatch.
