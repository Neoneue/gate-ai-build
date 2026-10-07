# Skills index: front-end-developer

Design skills owned by the `front-end-developer` agent. This file says
which one to reach for, in what order, and what each one may not override;
each skill's `SKILL.md` says how. Audit runs go through
`.claude/skills/ui-audit/` (alias table in its `audit-file.md`). General,
non-design skills live in `.claude/skills/` (`ui-audit`, `verify-twins`,
`triage-copy`, `adopt-skill`, `improve`).

**Load a kit skill by reading its path**
(`agents/front-end-developer/skills/<name>/SKILL.md`), never through the
Skill tool. Five names also exist as global copies in
`~/.claude/skills/`, and the Skill tool loads those instead. Four of them
differ from the kit copy, so always load these 4 by path:
`animation-vocabulary`, `apple-design`, `emil-design-eng`,
`review-animations`; `rams` is identical in both. Read every skill together
with its entry under "Per-skill overrides" below.

## The core four: every UI job, no exceptions

UX before UI: the always-loaded rule (`.claude/rules/ux-laws.md`) points to
the `ux-laws` skill, which holds all 31 laws and the gate before building.
These four are the working kit on every UI job; everything below is depth
for a specific concern.

1. **impeccable**: shape, then critique, then layout and distill.
2. **visual-hierarchy**: assign every element one tier.
3. **ux-laws** (`agents/front-end-developer/skills/ux-laws/SKILL.md`, read
   by path): the laws as check questions; pass its gate before writing UI.
4. **rams**: the review pass, when the owner asks for one.

The per-law depth lives in
`agents/front-end-developer/skills/ux-laws/references/<law>.md`; open one
only to go deep on that law. The animation skills are for motion work only.

## Pick by task: the one build skill, then the review

Every row starts with INDEX.md, `ux-laws`, then `visual-hierarchy` (the UX
pair); then exactly ONE build skill from the row; then its review. Typography
and accessibility are not optional extras: any change that adds or moves
text runs `better-typography`'s checks, and any change that adds a control,
a dialog, a toast or a live update runs `better-accessibility`'s checks,
whatever the build skill was. `rams` is the quick baseline review; it has no
rule for toast timing, focus restore, live-region mounting, zoom or heading
nesting, which `better-accessibility` covers.

| Task | Build skill (one) | Also check | Review |
| --- | --- | --- | --- |
| New or changed component (button, dialog, menu, form, sheet) | `shadcn` | `better-accessibility` | `rams`, then `better-accessibility` |
| A toast, or its wording or timing | `ask-sonner` | `better-accessibility` (errors stay until dismissed) | `better-accessibility` |
| Text: type size, line height, wrapping, truncation, counters | `better-typography` | `visual-hierarchy` | `better-typography` |
| Focus, keyboard, labels, live updates, hit areas, zoom | `better-accessibility` | | `better-accessibility`, then `rams` |
| Detail polish: radius, alignment, shadows, tabular numbers | `make-interfaces-feel-better` | `better-typography`, `better-ui` (see its override) | `impeccable polish` |
| Color: a new token, a palette step, contrast, dark-mode pairs | `oklch-skill` | `better-accessibility` (contrast) | `rams` |
| Too busy, cut or regroup a surface | `impeccable` (distill, layout) | `information-architecture` | `impeccable critique` |
| Where something lives, what it is called | `information-architecture` | | `impeccable critique` |
| A multi-step flow (create, invite, cancel, upgrade) | `user-flow-diagram` | `better-accessibility` (focus at each step) | `impeccable critique` |
| Copy, labels, errors | `impeccable` (clarify), then `triage-copy` | `better-typography` (punctuation, case) | `triage-copy` |
| New motion, or "should this move?" | `animate` | `emil-design-eng`, `better-accessibility` (reduced motion) | `review-animations` |
| A named effect or motion tokens | `transitions-dev` | `animate` | `transitions-polish` |
| Existing motion feels off | `transitions-polish` | `emil-design-eng` | `review-animations` |
| Gestures, springs, drag | `apple-design` | `better-accessibility` | `review-animations` |
| SVG graphic or path animation | `svg-animations` | | `review-animations` |
| Component API shape | `composition-patterns` | | `react-best-practices` |
| React performance | `react-best-practices` | | `react-best-practices` |
| Variants for the owner to pick (only when asked) | `prototype` | | the owner |
| Stress-test with worst-case data (long names, unbreakable emails, one-letter names, empty, 1, 1,000 rows) | `break-ui` | `better-typography` (truncate or wrap), `better-accessibility` (zoom 200%) | `break-ui` report, then `rams` |
| Whole-page or whole-site audit | none (read-only) | | `rams`, `better-accessibility`, `better-typography`, `impeccable critique` |

Reference only, never the build skill: `animation-vocabulary` (naming an
effect), `brand` (voice checklists), `pick-ui-library` (only when the owner
asks), `web-design-guidelines` (rules applied while writing any markup).

## The order: UX first, on every UI task

Plan the experience before placing anything, and place before building.
Steps 0 to 2 run before any build skill opens. A precisely specified change
moves through them in a few lines; it never skips them.

0. **Was it asked?** Build only what the owner named. Anything else (an
   extra line, a panel, a hint, a badge) is a proposal in your report,
   confirmed before it is built (`knowledge/core/gateway-context.md`
   "Standing UI laws"). A skill's suggestion is not a request.
1. **Shape the job: `impeccable shape`** (`impeccable/reference/shape.md`).
   Purpose, who arrives and in what state, the one primary task, what must
   remain untouched, the states that matter. A precise request gets a 3 to
   5 bullet brief and a compact confirmation; a sparse one gets one round of
   two or three questions. Shape never writes code. For a multi-step or
   multi-state surface, map the paths with `user-flow-diagram`: entry,
   happy path, branches, errors and recovery, exits, one flow per goal.
2. **Run the laws** (the `ux-laws` skill). Find the decision type in the
   lookup table (`ux-laws/references/overview.md` lines 13-22), read the 2
   or 3 laws it names, then the law skill below for depth. Run the
   **Pre-flight Checklist** (`overview.md` lines 254-268) before every UI
   write: one sentence per element on what it communicates, or it goes.
   Count choices at each decision point with
   `impeccable/reference/critique.md` lines 328 and 340 (4 or fewer
   visible).
3. **Place it.** Decide where it lives and how much weight it gets. Every
   value appears once on a surface (`gateway-context.md` line 21: "no
   duplication"); if it is said elsewhere, link or move it, never repeat
   it. Then `visual-hierarchy`, `information-architecture`, the grouping
   laws (proximity, common region, similarity), `impeccable layout` for
   reading order and rhythm, `impeccable distill` to cut what does not earn
   its place. gate-ai-build is an Operate surface
   (`impeccable/reference/operate.md`): earned familiarity over invention,
   and a modal is never the first thought.
4. **Build** with the craft skills below, reading
   `impeccable/reference/craft-floor.md` immediately before the edit.
   `design.md` holds the current values; where a skill disagrees, see
   "Current values" below.
5. **Check** with the review skills below. The impeccable hook runs after
   each Edit or Write (see "impeccable in this repo"); still run `detect`
   once on the changed files, then the gates in the agent file.

### Law skills by decision

The `ux-laws` skill is the first stop; a reference file is the deep read.

| When you are deciding | `ux-laws` section | Deep read (`agents/front-end-developer/skills/ux-laws/references/`) |
| --- | --- | --- |
| How to group related content | Laws 1-5 | `law-of-proximity.md`, `law-of-similarity.md`, `law-of-common-region.md`, `law-of-figure-ground.md` |
| What leads, what supports, what is read on demand | Laws 11-14 | `visual-hierarchy`, `von-restorff-effect.md`, `aesthetic-usability.md` |
| Whether the user is overloaded | Laws 6-10 | `millers-law.md`, `serial-position-effect.md` |
| Whether to add or cut an element, option or step | Laws 15-19 | `hicks-law.md`, `teslers-law.md` |
| Where something lives in the structure; labels, navigation | (not covered) | `information-architecture` |
| How a multi-step task flows, branches and recovers | (not covered) | `user-flow-diagram` |
| Whether it matches what users already know | Laws 24-26 | `jakobs-law.md` |
| Progress, unfinished tasks, flow | Laws 20-23 | `zeigarnik-effect.md` |
| Reach, response time, how a flow ends | Laws 27-29 | `fitts-law.md`, `doherty-threshold.md`, `peak-end-rule.md` |

`visual-hierarchy` points to a `critique-visual-hierarchy` skill that is not
installed; use `impeccable critique` instead.

## Current values: design.md today, open to change

`design.md` is the current record, not law. The values below are what
ships today. When a skill (`emil-design-eng`, `transitions-dev`,
`transitions-polish`, `better-ui` or any other) prescribes something
different, never overrule the skill and never quietly change the code: post
the difference to the owner as a proposed `design.md` update (the skill, its
value, the current value, why), and build with the current value until the
owner picks. An adopted value goes into `design.md` first, then the code.

From `design.md` (Motion and its table; 6. Shapes; 7. Components; Touch
Targets) and `src/index.css`. The lines below cite where each value is
recorded.

- **Three easing tokens**: `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`)
  is the default for color, shadow and scale; `--ease-in-out` for symmetric
  moves; `--ease-drawer` for slide-in surfaces (Sheet, sidebar)
  (design.md:1280-1282). Declared in `@theme` at `src/index.css:192-194`
  (design.md:1291).
- **Durations**: 100ms overlay fade and MenuItem highlight; 150ms default
  control transition; 200ms Dialog enter, sliding indicator and toast;
  120ms Dialog close; 300ms Sheet slide-in (design.md:1283-1287).
- **Transition properties**: only color, background, border, shadow,
  opacity, scale and transform; never `transition-all`. Reduced motion
  always wins (`motion-reduce:transition-none`, `motion-reduce:animate-none`)
  (design.md:1276).
- **Press**: `active:scale-[0.98]` on Button and Card `interactive`, always
  0.98 (0.96 rejected), paired with `motion-reduce:active:scale-100`
  (design.md:1288). The same press is on `IconActionButton` and
  `TabsTrigger`; popup triggers do not scale (design.md:1293).
- **Stagger**: one, a 100ms stagger on the Models Featured cards; route-level
  entrances where order carries meaning only, never on rows or
  high-frequency state (design.md:1289).
- **Dialog**: 200ms fade plus `zoom-in-95` on enter, 120ms close; Base UI
  exits need `data-closed:fill-mode-forwards` on popup and overlay
  (design.md:1286, :1291). Overlay `bg-neutral-900/40 backdrop-blur-xs`, the
  only blur in the system (design.md:1701).
- **Toast**: sonner's default, 200ms enter, 4s hold, 200ms exit
  (design.md:1293); radius 0.5rem, `--shadow-popup` (design.md:1807);
  `position="bottom-right"` (`src/App.tsx:505`).
- **Radius** tiers: 4px sub-element, 6px button and menu, 8px card, 10px
  base, 16px modal (locked), full for pills (design.md:1303-1308). A nested
  card steps down one tier; full ladder 24 / 16 / 8 / 4
  (design.md:1310).
- **Icons**: `lucide-react`, stroke 1.75, one value for the whole set;
  sizes `size-3` to `size-5` (design.md:1312). Passed at every call site as
  `strokeWidth={1.75}`: there is no global provider, and lucide's own
  default is 2.
- **Touch targets**: buttons 36px (`h-9`), 32px (`sm`), 24px (`xs`);
  icon-only buttons 36 / 32 / 24 with a 16px icon (14px at `icon-xs`);
  checkbox and radio 16px plus hit-target padding (design.md:1963-1968).
- **Type**: Geist and Geist Mono (design.md:879-880). Five voices
  (design.md:1014-1030): Label is `font-medium`, Body is `font-normal`
  (design.md:1026-1027). Sentence case everywhere (design.md:1845, :1862).
  Literals live only in `src/index.css`.

## impeccable in this repo

- **Version**: skill 4.3.1 (`impeccable/SKILL.md:4`), engine 0.1.5
  (`impeccable/scripts/VERSION`). Upgrading is the owner's decision, not
  part of any UI task.
- **Run it from its real path.** `SKILL.md` already prints the kit path, but
  several references and `degraded/asset-producer.md` still print
  `.claude/skills/impeccable/...` (where the upstream installer puts it),
  which does not exist here. Use
  `sh agents/front-end-developer/skills/impeccable/scripts/impeccable <verb>`.
  The native engine in `scripts/bin/` is gitignored and fetched per machine.
- **`/impeccable <verb>` is notation, not a slash command.** Run the Setup
  in `impeccable/SKILL.md`, then read `reference/<verb>.md`.
- **Verbs that exist** (`scripts/command-metadata.json`): craft, init,
  document, extract, live, adapt, animate, audit, bolder, clarify,
  colorize, critique, delight, distill, harden, onboard, layout, optimize,
  overdrive, polish, quieter, shape, typeset. There is no `arrange` (use
  `layout`) and no `normalize` (token drift is `polish` step 1 plus
  `npm run lint:design`). Motion goes through `animate` the skill, not
  `impeccable animate`.
- **No PRODUCT.md.** The product record is
  `agents/front-end-developer/knowledge/core/gateway-context.md`. Never
  create `PRODUCT.md`, and do not run `init` unless asked.
- **The design hook is configured, locally.** `.claude/settings.local.json`
  (gitignored) runs `impeccable/scripts/impeccable hook` after every Edit or
  Write. A machine without that file runs no hook, so run
  `detect --json <changed files>` once yourself. `.impeccable/config.json`
  (tracked) ignores `overused-font` on Geist and Geist Mono: the brand
  fonts.
- **Extending a surface inherits its world** (`new-work.md`, "Extend an
  existing surface"): no concept seed, no decision page, no comps, no
  `design.md` rewrite. The comp-led build path and `live` are out of scope.
- **Questions go to the parent.** Where a reference says "call the
  AskUserQuestion tool" (init, distill, critique, bolder, quieter,
  document, extract, overdrive), the front-end-developer subagent returns
  the questions to its parent, which asks the owner.
- **`critique` wants two isolated subagents** (design review and detector).
  A subagent cannot spawn subagents, so a full critique runs from the main
  session; a run inside a subagent is degraded and must open with the
  degraded banner.
- **craft-floor's motion line** (blur, backdrop-filter, clip-path): where it
  differs from "Current values", raise it as a proposal.
- **Its four shipped agents** live in `.claude/agents/impeccable-*.md`. An
  impeccable install or update overwrites them, so repo rules go in the
  spawn packet, never in those files. The main session spawns them; a
  front-end-developer subagent cannot.
  - `impeccable-documenter`: after a build, to confirm `design.md` still
    matches the code. Pass `design.md` as the existing DESIGN.md, no
    direction contract, no PRODUCT.md. Never ask it for a new world: that
    rewrites `design.md` into impeccable's eight-heading schema and drops
    its decision history, and `design.md` changes are the owner's. The
    macOS disk ignores case, so a write to `DESIGN.md` lands in
    `design.md`: ask it for a proposed diff, never a write.
  - `impeccable-finish-reviewer`: a fresh-eyes review of a whole new
    surface. It reviews nothing without valid captures (web:
    `desktop.png` and `mobile.png` in `.impeccable/review/`,
    `impeccable-finish-reviewer.md:19`, `:23`); the screenshot-deletion
    rule waits until it returns. With no direction contract or PRODUCT.md it
    judges what it can and names what is missing.
  - `impeccable-asset-producer`: only for a comp-led build with an approved
    comp, a `comp-spec` and image generation, none of which this repo uses.
    A new raster asset needs the owner's go first.
  - `impeccable-manual-edit-applier`: only inside `live` mode, which is not
    configured here.

## Per-skill overrides (read with the skill)

- **`web-design-guidelines`** (always on while writing): sentence case, never
  its Title Case rule; a native `<button>` or `<a>` needs no keyboard
  handler; no `virtua` or `nuqs`; its skip link, unsaved-changes guard and
  deep-link rules are proposals for the owner, not build steps; Hydration
  Safety does not apply to this Vite app.
- **`rams`**: icon-button targets per "Current values" (36 / 32 / 24), not
  its 44px Serious; no `onKeyDown` finding on native elements. As a
  subagent, take the files from the brief instead of asking.
- **`emil-design-eng`**, **`animate`**, **`review-animations`**,
  **`apple-design`**, **`animation-vocabulary`**, **`ask-sonner`**: skip the
  "Initial Response" block each opens with (it would end a planning turn on
  a canned line). Where their press, easing, stagger, height, pure-fade or
  reduced-motion rules differ from "Current values", report the difference
  as a proposed `design.md` update: not a defect in the code, and never a
  reason to drop the skill. `motion/react`, not `framer-motion`.
- **`animate`**: the primary for "should this move" (steps 1-2 are the
  gate) and new motion. `animate-expo` does not exist; for a toast, drawer
  or dropdown the answer is the existing Base UI primitive, not
  `pick-ui-library`.
- **`review-animations`**: the primary for "feels off" and motion review.
  Use its remedial order (delete, reduce, easing, origin, interruptibility,
  GPU, asymmetry, polish, a11y), and report a difference from "Current
  values" as a proposal.
- **`apple-design`**: only for gestures, springs, rubber-banding, velocity
  and materials. Its system font, size-specific tracking, eased theme
  switch, scroll-edge effects, literal materials and reduced-motion
  crossfades differ from `design.md`: proposals, raised to the owner.
- **`animation-vocabulary`**: vocabulary only. There is no `/vocabulary` page
  in this repo.
- **`ask-sonner`**: a library reference, not motion. Two errata against the
  installed 2.0.7: the default offset is 24px (not 32px) and the public call
  is `toast.getToasts()` (not `getActiveToasts()`). The Toaster lives in
  `src/App.tsx` (Vite), not `layout.tsx`; no `next-themes`.
- **`transitions-dev`**: an industry-standard catalog of named effects and
  motion tokens. Use its effects and values; where they differ from
  "Current values", propose the `design.md` update first. Never import its
  `_root.css` as is: its `--ease-out: ease-out` would replace the app's
  curve everywhere at once, so adopted tokens go into `src/index.css`.
- **`svg-animations`**: colors through `currentColor` and semantic tokens;
  the easing tokens from "Current values"; `transform-origin: center` on SVG
  also needs `transform-box: fill-box`.
- **`make-interfaces-feel-better`**: the build skill for detail polish. Its
  0.96 press, concentric radius, stagger and shadow-as-border differ from
  "Current values": raise any worth adopting as a proposal. Three verified
  errors: a bare `cubic-bezier(0.2, 0, 0, 1)` in a class list compiles to
  nothing (the working form is `ease-[cubic-bezier(...)]`, and here the
  curves are the easing tokens anyway); Tailwind's `transition` lists 23
  properties, not `all`; exits are `ease-out`, never ease-in.
- **`better-ui`**: a check for detail polish, never the build skill. Its
  0.96 press is overruled (0.98, design.md:1288) and so is its 1.5 / 2 /
  2.5 stroke table (one 1.75 stroke, design.md:1312). Settled
  better-ui-vs-design.md decisions are in `.claude/skills/ui-audit/SKILL.md`.
- **`oklch-skill`**: color math and palettes only. Every color is a token
  in `src/index.css` and is documented in `design.md` (see
  `.claude/rules/design-tokens.md`); a new token or step is a proposed
  `design.md` update first.
- **`transitions-polish`**: an industry-standard motion pass. Use its
  principles (closes faster than opens, never delay a close or hover-out,
  trim duration before adding delay, intent delay filters accidental
  triggers) and its token scale; its retuning, overshoot, stagger and blur
  suggestions that differ from "Current values" go to the owner as
  proposed `design.md` updates. Not its `_root.css` as is (same reason as
  transitions-dev) or the Refine-panel material. Its `transitions review`
  verb is not transitions-dev's.
- **`brand`**: reading only (voice, messaging, consistency and approval
  checklists). There is no `brand-guidelines.md` in this repo (only the
  skill's own `templates/brand-guidelines-starter.md`); `design.md` is the
  brand record. Every documented command fails; never run
  `sync-brand-to-tokens` (it writes a second token system), and its colors,
  Inter and weight 700 differ from `design.md`: proposals only. Copy
  changes still go through `impeccable clarify` and the repo's
  `triage-copy`.
- **`shadcn`**: the local CLI, `npx --no-install shadcn` (4.11.0), not
  `@latest`; it already emits `@base-ui/react` for this repo, so there is
  nothing to port. Read only the Base halves of `rules/base-vs-radix.md`.
  No `init --preset`, `apply`, `--overwrite` or registry adds without the
  owner; `customization.md` colors and dark mode differ from
  `design.md` (proposals only); ToggleGroup is 2 to 5 options.
- **`react-best-practices`**: read `rules/<name>.md`, never the compiled
  `AGENTS.md` (code missing from 5 rules, one wrong "Correct" example). Use
  the `rerender-*`, `rendering-*` (not hydration or script), `js-*`,
  `advanced-*`, `client-passive-event-listeners`,
  `client-localstorage-schema`, `bundle-conditional` and `bundle-preload`
  rules. Skip the Next.js and RSC rules and any that need swr, lru-cache or
  better-all. It has no rule on keys.
- **`composition-patterns`**: `use()` in new code only; never rewrite an
  existing `useContext` site unless asked. Its examples use React Native
  names.
- **`prototype`**: explicit invoke only. Its verbatim picker carries raw
  literals, so it lives outside `src/` lint scope or is waived per line;
  variant content comes from the real seed data, never invented;
  screenshots only when asked; the `width` transition stays in the picker.
- **`pick-ui-library`**: explicit invoke only; answer, never install. Base
  UI only, never Radix; theming is `src/hooks/use-theme` (`ThemeProvider`,
  `src/main.tsx:4`), not `next-themes`.
- **`break-ui`**: report only by default. This site has no synthetic data:
  every number derives from a real entity row in `src/data/`, so
  worst-case data never goes into those seeds. There is no dev-fixture
  folder or dev-only state toggle in this repo; any worst-case fixture or
  toggle is a proposal to the owner first. Fixes are applied only for the
  items the owner names, use `design.md` tokens and existing primitives,
  and a truncate-or-wrap choice that differs from `design.md` is a
  proposal. Fixture emails use `example.com`.

## Which skill for what

### Calling out bad design and inconsistency on a page

**Best: `impeccable critique`.** The only skill built as a judgment pass
rather than a rule list. It runs two isolated assessments (a design review
and a browser detector), keeps them apart until synthesis so the detector
does not anchor the reviewer, scores Nielsen's 10 heuristics and a
cognitive-load checklist, persists a snapshot so the next run shows trend,
and closes by asking what to improve. It is the one that will say a
hierarchy is wrong or a section does not match its neighbours.

Recommended stack for a page: `critique` for the judgment, then `polish` to
fix, then `rams` for the quick accessibility baseline, then
`better-accessibility` and `better-typography` for what rams has no rule
for. Under the audit method a critique is a review run with `imp` IDs.

### The rest, by what each is good at

| Skill | Alias | Good at | Weak at | Mode |
| --- | --- | --- | --- | --- |
| `impeccable shape` | `imp` | Discovery and a confirmed brief before code: purpose, people, primary task, untouched areas, states | Values; never writes code | Plan |
| `user-flow-diagram` | `flow` | Paths, branches, error recovery and exits for a multi-step task | Single-screen work | Plan |
| `impeccable critique` | `imp` | Design judgment: hierarchy, flow, neighbour mismatch, concept wrong | Exact values | Review |
| `impeccable polish` | `imp` | Refinement in a fixed triage order (defects, states, drift, visual, cleanup); classifies drift as missing token, one-off, concept mismatch or local defect | Calling a concept wrong (it preserves the incumbent) | Review or fix |
| `impeccable audit` | `imp` | Technical scoring in five dimensions (a11y, perf, theming, responsive, implementation integrity) | Taste | Review |
| `impeccable` other verbs | `imp` | `distill` (cut what does not earn its place), `layout` (reading order, grouping, rhythm), `clarify` (copy), `typeset`, `colorize`, `harden`, `onboard`, `adapt` | One verb per pass | Fix |
| `rams` | `rams` | WCAG 2.1 checklist (alt, labels, focus, keyboard, contrast, targets) plus visual basics | Design depth | Review |
| `make-interfaces-feel-better` | `mifb` | Typography rendering, text-wrap, tabular numbers, hit-area and surface principles | Its broken easing class and ease-in exits (see overrides) | Build or review |
| `better-ui` | `bui` | Exact micro-values: concentric radius, optical alignment, surface depth, hit areas, icon sizing, enter / exit | Its 0.96 press and stroke table (see overrides); anything above the detail level | Review |
| `better-typography` | `btyp` | Type scale, spacing, sizing, variable fonts, OpenType, wrapping, truncation | Layout, color, motion | Build or review |
| `better-accessibility` | `ba11y` | Focus and keyboard, forms, hit areas, screen readers, motion and zoom | Visual taste | Build or review |
| `web-design-guidelines` | `wdg` | Vercel rule list in `file:line` form; consistency at the rule level; apply while writing | Judgment | Review or build |
| `oklch-skill` | `oklch` | OKLCH conversion, palettes, contrast, gamut, Tailwind v4 theming | Layout, motion | Build |
| `animate` | `anim` | Whether something should move, then building new motion in decision order (why, tool, properties, curve, exit) | Reviewing motion | Plan and build |
| `review-animations` | `rvan` | Strict review of a motion change; "this feels off" | Adding motion | Review |
| `apple-design` | `apl` | Gestures, springs, velocity, rubber-banding, materials | Typography, theme, token values | Reference or build |
| `emil-design-eng` | `emil` | The "should this animate" gate, origin-aware popovers, tooltip delay groups, component feel | Exact token values | Review or build |
| `animation-vocabulary` | `avoc` | Naming a motion effect | Values | Reference |
| `transitions-dev` | `tdev` | An industry-standard catalog of 32 named effects and motion tokens | Values that differ from `design.md`: proposals until adopted; never its `_root.css` as is | Build or reference |
| `transitions-polish` | `tpol` | Timing principles for motion that already exists: closes faster than opens, never delay a close, trim before adding delay | Its token scale differs from `design.md`: proposals until adopted | Review |
| `ask-sonner` | `sonner` | Sonner API: calls, update, dismiss, styling, troubleshooting | Motion; anything but toasts | Reference |
| `svg-animations` | `svga` | SVG graphics, path and morph animation, loaders | Everything else | Build |
| `composition-patterns` | `comp` | Component API shape, slots, compound components | Visual | Build |
| `shadcn` | `shad` | Which component fits a need; adding or fixing a primitive with the local CLI | Visual judgment | Place and build |
| `react-best-practices` | `rbp` | React performance rules: re-renders, memo, effects, rendering | Visual; Next.js rules do not apply | Review or fix |
| `prototype` | `proto` | Several live variants behind a picker so the owner chooses (explicit invoke only) | Final polish | Place |
| `break-ui` | `break` | Worst-case data cases: long, short, missing, non-Latin, huge counts, empty and 1,000-row lists; a breaks report with a fix each | Taste and motion (`emil-design-eng`, `review-animations`) | Review, then fix on request |
| `pick-ui-library` | `pick` | Which library fits a job, as an answer (explicit invoke only) | Installing (no new dependencies) | Reference |
| `brand` | `brand` | Voice, messaging and brand-consistency checklists, as reading | Its scripts and token sync (see overrides) | Reference |

## Rules of the road

- design.md is the current record, not law: a skill-vs-design.md conflict
  goes to the owner as a proposed update, and the build keeps the current
  value until the owner picks. Decisions the owner already made are in
  `.claude/skills/ui-audit/SKILL.md` and are not re-raised unless the owner
  asks.
- Reviews run through `ui-audit` with the proof loop
  (`check-report.mjs`); apply passes prove every `Before:` pattern gone
  across the twins with `verify-twins`.
- Review model by scope: Opus for shared primitives, tokens or design.md
  table judgment; Sonnet for page sweeps. Build and apply always Opus.
- One skill per run; the day file (`audits/YYYY-MM/audit-M-D.md`) gets one
  `## <skill>` section per skill.
