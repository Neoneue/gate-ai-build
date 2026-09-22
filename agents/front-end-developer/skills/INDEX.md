# Skills index: front-end-developer

Thirteen design skills owned by the `front-end-developer` agent. This file
says which one to reach for; each skill's `SKILL.md` says how. Audit runs
go through `.claude/skills/ui-audit/` (alias table in its `audit-file.md`).
General, non-design skills live in `.claude/skills/` (`ui-audit`,
`verify-twins`, `triage-copy`, `adopt-skill`, `improve`).

## Which skill for what

### Calling out bad design and inconsistency on a page

**Best: `impeccable critique`.** The only skill built as a judgment pass
rather than a rule list. It runs two isolated assessments (a design review
and a browser detector), keeps them apart until synthesis so the detector
does not anchor the reviewer, persists a snapshot so the next run shows
trend, and closes by asking what to improve. It is the one that will say a
hierarchy is wrong or a section does not match its neighbours.

Recommended stack for a page: `critique` for the judgment, then `polish` to
fix, then `rams` for the accessibility sweep. Under the audit method a
critique is a review run with `imp` IDs.

### The rest, by what each is good at

| Skill | Alias | Good at | Weak at | Mode |
| --- | --- | --- | --- | --- |
| `impeccable critique` | `imp` | Design judgment: hierarchy, flow, neighbour mismatch, concept wrong | Exact values | Review |
| `impeccable polish` | `imp` | Refinement in a fixed triage order (defects, states, drift, visual, cleanup); inconsistency | Calling a concept wrong (it preserves the incumbent) | Review or fix |
| `impeccable audit` | `imp` | Technical scoring in five dimensions (a11y, perf, theming, responsive, code) | Taste | Review |
| `impeccable` other verbs | `imp` | `shape` (brief before code), `clarify` (copy), `distill` (simplify), `arrange` (layout), `typeset`, `colorize`, `harden`, `animate`, `normalize` (token drift) | One verb per pass | Fix |
| `rams` | `rams` | WCAG 2.1 checklist (alt, labels, focus, keyboard, contrast, targets) plus visual basics | Design depth | Review |
| `better-ui` | `bui` | Exact micro-values: concentric radius, optical alignment, surface depth, hit areas, icon sizing, enter / exit | Anything above the detail level | Review or fix |
| `web-design-guidelines` | `wdg` | Vercel rule list in `file:line` form; consistency at the rule level; apply while writing | Judgment | Review or build |
| `make-interfaces-feel-better` | `mifb` | Design-engineering principles: hover, shadows, borders, typography, micro-interactions | Page-level review | Build |
| `transitions-polish` | `tpol` | Refining existing motion against the token scale (duration, distance, scale, easing, open / close asymmetry) | Adding motion | Review or fix |
| `transitions-dev` | `tdev` | Adding a new transition to an element that has none; production recipes | Reviewing motion | Build |
| `svg-animations` | `svga` | SVG graphics, path and morph animation, loaders | Everything else | Build |
| `composition-patterns` | `comp` | Component API shape, slots, compound components | Visual | Build |
| `shadcn` | `shad` | Adding, searching, fixing shadcn components; project context | Visual judgment | Build |
| `react-best-practices` | `rbp` | React and Next.js performance patterns; memo, keys, effects | Visual | Review or fix |
| `brand` | `brand` | Voice, identity, messaging, brand compliance | UI mechanics | Build or review |
| `oklch-skill` | `oklch` | OKLCH conversion, palettes, contrast, gamut, Tailwind v4 theming | Layout, motion | Build |

## Rules of the road

- design.md wins on every conflict; settled skill-vs-design decisions are
  in `.claude/skills/ui-audit/SKILL.md` and are never re-flagged.
- Reviews run through `ui-audit` with the proof loop
  (`check-report.mjs`); apply passes prove every `Before:` pattern gone
  across the twins with `verify-twins`.
- Review model by scope: Opus for shared primitives, tokens or design.md
  table judgment; Sonnet for page sweeps. Build and apply always Opus.
- One skill per run; the day file (`audits/YYYY-MM/audit-M-D.md`) gets one
  `## <skill>` section per skill.
