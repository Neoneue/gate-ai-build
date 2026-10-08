# Skills index: animator

Routing for the `animator` agent (`.claude/agents/animator.md`). Read skills
by path (`agents/animator/skills/<name>/SKILL.md`), never through the Skill
tool: four of them also exist as global copies in `~/.claude/skills/` that
differ from these. Read every skill together with its override below.

Before the first build of a session, read
`../knowledge/working-rules.md` (current motion values, which tool for which
job, the UI gate, proof).

## Your job

Every animation on the site: HTML and CSS transitions, keyframes, GSAP
choreography, and the animated icons. You decide whether something should
move, build it to `design.md`'s motion values, and prove it at normal speed
and under reduced motion. You do not own layout, components or color (the
front-end-developer) or words (the copywriter).

## The order, on every motion task

0. **Was it asked?** Build only what the brief names. Extra motion is a
   proposal back to the lead.
1. **Should it move?** `motion-ux-laws` § First, then `animate` steps 1-2
   (the gate). If the answer is no, say so and stop.
2. **UX gate:** read `agents/front-end-developer/skills/ux-laws/SKILL.md`,
   write the nine labelled lines, then read
   `agents/front-end-developer/skills/visual-hierarchy/SKILL.md`
   (`../knowledge/working-rules.md` § The UI gate).
3. **Pick the tool:** `../knowledge/working-rules.md` § Which tool. If the
   motion depicts part of the product, read the live code it depicts first
   (§ Depict the live UI).
4. **Build** with the one skill the table below names.
5. **Review** with `review-animations`, then `transitions-polish` for
   timing; check reduced motion in the browser.
6. **Final polish:** a pass with `emil-design-eng` on every build before you
   report (§ Polish and refinement). Its Review Checklist and Before / After
   table are the format; apply what fits and say what it changed.

## Polish and refinement

Pull these when the motion works and the job is making it feel right, or
when the lead asks for a polish or audit pass:

| Moment | Skill | What it catches |
| --- | --- | --- |
| Last step of every build (step 6) | `emil-design-eng` | Touch-gated hover, overlapping a state swap so it reads as one change, cohesion with the live component's own timing, gentler (not zero) reduced motion, stagger and origin details |
| Timing feels off: too slow, a lag, a close slower than its open | `transitions-polish` | Closes faster than opens, no delay on close or hover-out, trim duration before adding delay |
| Craft audit, approve or block | `review-animations` | Its ten standards and remedial order |
| The motion is gesture-driven: drag, swipe, sheet, momentum | `apple-design` | Interruptibility, springs, velocity handoff, rubber-banding (little else here applies to scripted art) |

Two passes on the onboarding art (2026-10-08) set this order: `emil-design-eng`
produced three of the four refinements; `apple-design` mostly confirmed
what was already right, so it stays for gesture work.

## Which skill for what

| Need | Build skill | Review |
| --- | --- | --- |
| Should this move, and new motion in decision order | `animate` | `review-animations` |
| GSAP: sequences, split text, scramble, morph, drawn strokes | `gsap` | `review-animations` |
| Attention, grouping and timing in motion | `motion-ux-laws` | |
| A named effect or motion tokens | `transitions-dev` | `transitions-polish` |
| Existing motion feels off | `transitions-polish` | `review-animations` |
| Component feel, origin-aware popovers, tooltip delay groups | `emil-design-eng` | `review-animations` |
| Final polish on any build (order step 6) | | `emil-design-eng` |
| Gestures, springs, drag, rubber-banding | `apple-design` | `review-animations` |
| SVG graphic or path animation | `svg-animations` | `review-animations` |
| Naming an effect | `animation-vocabulary` (reference only) | |
| A showcase moment (rare here; an auth or marketing-style screen) | `build-awwwards-quality-sites` | `review-animations` |

## Per-skill overrides (read with the skill)

- **All of them:** where a skill's press, easing, duration, stagger, height,
  pure-fade or reduced-motion rule differs from
  `../knowledge/working-rules.md` § Current values, build with the current
  value and report the difference to the lead as a proposed `design.md`
  update. That applies to components and primitives only; illustration art
  is tuned by craft (§ Current values, Scope). `motion/react`, not
  `framer-motion`.
- **`emil-design-eng`, `animate`, `review-animations`, `apple-design`,
  `animation-vocabulary`**: skip the "Initial Response" block each opens with.
- **`animate`**: the primary for "should this move" (steps 1-2 are the gate)
  and for new motion. `animate-expo` does not exist; for a toast, drawer or
  dropdown the answer is the existing Base UI primitive.
- **`review-animations`**: use its remedial order (delete, reduce, easing,
  origin, interruptibility, GPU, asymmetry, polish, a11y).
- **`apple-design`**: only for gestures, springs, rubber-banding, velocity
  and materials. Its system font, size-specific tracking, eased theme
  switch, scroll-edge effects, literal materials and reduced-motion
  crossfades differ from `design.md`: proposals only.
- **`animation-vocabulary`**: vocabulary only. There is no `/vocabulary`
  page in this repo.
- **`transitions-dev`**: use its effects and values; where they differ from
  the current values, propose first. Never import its `_root.css` as is: its
  `--ease-out: ease-out` would replace the app's curve everywhere. Adopted
  tokens go into `src/index.css`.
- **`transitions-polish`**: use its principles (closes faster than opens,
  never delay a close or hover-out, trim duration before adding delay,
  intent delay filters accidental triggers). Its retuning, overshoot,
  stagger and blur suggestions are proposals. Not its `_root.css` as is.
- **`svg-animations`**: colors through `currentColor` and semantic tokens;
  the easing tokens from the current values; `transform-origin: center` on
  SVG also needs `transform-box: fill-box`.
- **`build-awwwards-quality-sites`**: written for marketing sites. Keep its
  art-direction-first and "3D only with a job" rules. Its smooth-scroll
  engines (Lenis, Locomotive), scrubbed ScrollTrigger sequences and WebGL
  do not belong on this Operate surface without the owner's go.
- **`gsap`** and **`motion-ux-laws`**: written for this repo; no overrides.

## Reused from other agents (by path)

| For | Read |
| --- | --- |
| The 31 UX laws and the UI gate | `agents/front-end-developer/skills/ux-laws/SKILL.md` |
| Hierarchy tiers | `agents/front-end-developer/skills/visual-hierarchy/SKILL.md` |
| Toast API | `agents/front-end-developer/skills/ask-sonner/SKILL.md` |
| Reduced motion, focus during motion | `agents/front-end-developer/skills/better-accessibility/SKILL.md` |
| Motion values and their history | `design.md` "Motion" |

## Sources

`../knowledge/sources.md`.
