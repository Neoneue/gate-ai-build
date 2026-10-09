# Working rules: animator in gate-ai-build

The site is the Constellation Gate AI dashboard: Vite + React + TypeScript,
Tailwind v4, Base UI primitives, mock data. It is an Operate surface: dense,
scanned many times a day. Motion here is product feedback, not showcase.

## Current values (from design.md "Motion"; build with these)

`design.md` is the current record. When a skill prescribes a different
value, build with the value below and report the difference to the lead as
a proposed `design.md` update (skill, its value, current value, why).

**Scope (owner, 2026-10-08):** these values govern component elements and
primitives (controls, dialogs, sheets, menus, toasts, tabs, page and card
entrances). They do not govern illustration art (onboarding art,
explanatory sequences, empty-state drawings): `design.md` has no concept of
that motion. Tune art by craft with the animator skills (`animate`
explanatory tier, `motion-ux-laws` one beat at a time); under reduced
motion show the end state gently (a short fade, no movement); file no
`design.md` proposal for its timings. The owner's words: "our rules don't
apply to animations".
Precedent: `src/pages/onboarding/onboarding-motion.css`.

- **Easing tokens** (`src/index.css`, `@theme`): `--ease-out`
  (`cubic-bezier(0.23, 1, 0.32, 1)`) is the default for color, shadow and
  scale; `--ease-in-out` for symmetric moves; `--ease-drawer` for slide-in
  surfaces (Sheet, sidebar).
- **Durations:** 100 ms overlay fade and menu highlight; 150 ms default
  control transition; 200 ms dialog enter, sliding indicator and toast;
  120 ms dialog close; 300 ms sheet slide-in.
- **Properties:** only color, background, border, shadow, opacity, scale and
  transform. Never `transition-all`.
- **Reduced motion always wins:** `motion-reduce:transition-none`,
  `motion-reduce:animate-none`, and `gsap.matchMedia()` in GSAP code.
- **Press:** `active:scale-[0.98]` on Button and interactive Card, with
  `motion-reduce:active:scale-100`. Popup triggers do not scale.
- **Dialogs** (Base UI): 200 ms fade plus `zoom-in-95` on enter, 120 ms
  close; exits need `data-closed:fill-mode-forwards` on popup and overlay.
- **Toast** (sonner): 200 ms enter, 4 s hold, 200 ms exit.
- **Stagger:** one exists, 100 ms on the Models Featured cards. Never stagger
  table rows or high-frequency state.

## Which tool

| Job | Tool |
| --- | --- |
| Hover, focus, press, a single enter or exit | CSS / Tailwind transition on the primitive, with the tokens above |
| Dialog, sheet, popover, menu motion | The Base UI primitive's own data-state classes; change the primitive, never a call site |
| Animated icons (`src/components/ui/*.tsx`, 13 files) | `motion/react` (`m`, `useAnimation`), the existing pattern in `bell.tsx` |
| Sequenced choreography, split text, scramble, morph, drawn strokes | GSAP via `@gsap/react` (`skills/gsap/SKILL.md`) |
| Toast timing or wording | sonner (`ask-sonner` lives in the front-end kit) |

Never two systems on one property.

## Depict the live UI

When art or motion depicts part of the product (a chat, a composer, a code
snippet, a status), find the live code it depicts before building and copy
its styling, states and words: the surfaces, the focused or disabled state,
the file and field names. Cite the file. The onboarding chat and code art
took theirs from `chat-message.tsx`, `chat-composer.tsx` and
`client-configs.tsx`; art built from a mockup alone shipped a black bubble
and a Python file name the product never shows.

## The UI gate

`scripts/require-skill.mjs` blocks any edit to a UI file until this session
has read, in order: a skills `INDEX.md` (yours counts), then
`agents/front-end-developer/skills/ux-laws/SKILL.md`, then the written gate
(labelled lines Job, Path, Expectation, Precedent, Objects, Actions, Laws,
Patterns, Rejected, in visible text; for motion, Precedent names the
reference the motion follows and the existing motion in the repo it
matches), then
`agents/front-end-developer/skills/visual-hierarchy/SKILL.md`, then one
build skill. For motion work the build skill is usually `animate` or
`gsap`. It resets after each commit. For the animator (spawned as one, or
any session whose latest kit index read is `agents/animator/skills/INDEX.md`)
it also requires, after the index and before ux-laws, this file (once per
session) and then `motion-ux-laws` (per change).

## The review gate

`scripts/require-motion-review.mjs` runs when you end a turn, when a
subagent animator stops, and before a `SendMessage` or room post. Once you
have edited a `src/` file, it blocks until, after your LAST edit and in this
order, you have read `review-animations`, read `transitions-polish`, checked
the motion with reduced motion on (a tool call setting `reducedMotion` to
`"reduce"`), and read `emil-design-eng`. Your report must name the
review-animations verdict (Approve or Block) and hold the emil-design-eng
Before / After. Any later edit, a small follow-up fix included, resets all
of it. There is no skip.

Two ways to stop before the passes are done, neither of which skips them:

- **Ask the owner:** a reply whose first line starts `BLOCKED`, or a room
  post with `needs_human: true`. The passes are still owed at the next stop.
- **Hand them off:** spawn an `animator` subagent on Opus (the definition's
  model; an explicit non-Opus `model` does not count) after your last edit,
  so you stay free to talk to the owner. That subagent, with no edit of its
  own, must then do all four steps and put the proof in its report. Running
  the whole build in an animator subagent works the same way: its own stop
  is gated.

## Proof

A green build proves nothing about motion. Check it in the browser at
normal speed and with reduced motion on (Playwright
`emulateMedia({ reducedMotion: "reduce" })`), one tab, and delete any
screenshot afterwards.
