# Pre-Ship Quality Checklist — 10-Section Final Sweep

> **Reading order:** `craft-methodology.md` → `craft-checks.md` → `design-process-rules.md` → `design-recipes.md` → `ux-methodology.md` → **This file (final sweep)**

> **When to run:** After `craft-checks.md` passes and before declaring a design done. This is the last gate before presenting to the user — ship or don't ship. Each section is a structured pass over the build with pass/fail questions. If any **P0** check fails, do not ship.

> **Sources:** Dieter Rams 10 Principles; WCAG 2.1 AA; Vercel Web Interface Guidelines; NN/g research; Apple Human Interface Guidelines; Emil Kowalski on motion; `skills/web-design-guidelines/SKILL.md`.

---

## How to use

Run sections **in order**. Each has:
- **Purpose** — what it catches
- **Checks** — concrete pass/fail questions
- **Fail action** — the specific fix

If a check depends on information you don't have (e.g., host `system.md` personality), note it and move on — do not invent an answer. Treat every unchecked box as a ship blocker unless explicitly waived.

---

## 1. Intent & Identification

**Purpose:** Prove the design communicates *this* product, not a generic template.

**Checks:**
- [ ] You can name the primary verb (the single task this screen enables)
- [ ] You can name the person (not "users" — a specific role, context, device)
- [ ] At least three visible elements would need to change if you ported this design to a different product
- [ ] The signature element from domain exploration is present and organic (not pasted-on)
- [ ] Someone reading a text description of the design could identify the product

**Fail action:** Go back to `craft-methodology.md` domain exploration. Name the default three generic approaches and move away from them.

---

## 2. Visual Hierarchy

**Purpose:** One glance reveals what matters most.

**Checks:**
- [ ] Squint test passes — three distinct visual weight tiers visible when blurred
- [ ] Primary element is unmistakably heaviest
- [ ] No two tiers look the same weight
- [ ] Hierarchy works through multiple dimensions (size + weight + color + position), not just one
- [ ] Labels are visibly lighter/smaller than values (at least one tier difference)

**Fail action:** Increase contrast between tiers. Font size ratio ≥ 1.25x between adjacent tiers, or weight delta ≥ 200 (400 vs 600).

---

## 3. Token Compliance

**Purpose:** No invented values. Every number traces to the contract chain.

**Checks:**
- [ ] Every color is a semantic token (Tailwind class or CSS custom property) — no raw hex, no `rgb()`
- [ ] Every spacing value is from the spacing scale in `contract/globals.md` / host `globals.css` (or `system.md` when it defines rhythm)
- [ ] Every radius is from the scale (`rounded-sm`, `rounded-md`, `rounded-lg`, …)
- [ ] Every font size is from the type scale — no arbitrary `text-[15px]` unless the contract defines it
- [ ] Figma: every fill/stroke is bound via `setBoundVariableForPaint`; every text node uses `setTextStyleIdAsync`
- [ ] Paper: no hardcoded OKLCH values that aren't in `globals.css` / `contract/globals.md`

**Fail action:** Replace orphan values with scale tokens. If a value you need doesn't exist on the scale, extend the scale in `system.md` (or ask the user) — don't leak raw numbers.

---

## 4. Typography

**Purpose:** Type does the communicative work.

**Checks:**
- [ ] At least three distinct type tiers (display/heading/body or similar)
- [ ] Headings use weight, not just size, to establish hierarchy
- [ ] Line-height scales inversely with size (tighter on display, looser on body)
- [ ] Letter-spacing tightened on large sizes, neutral or wider on small sizes
- [ ] No orphan fonts — every family is declared in the contract
- [ ] Monospace used intentionally for code, SHAs, IDs — not as decoration
- [ ] `text-balance` on short headings, `text-pretty` on body paragraphs where supported

**Fail action:** Load `skills/typeset/SKILL.md`. Sync to `skills/impeccable/reference/typography.md` for weight/size/leading pairings.

---

## 5. Spacing & Layout

**Purpose:** Gestalt proximity is doing the grouping work.

**Checks:**
- [ ] Tight spacing within groups (related items close together)
- [ ] Generous spacing between groups (unrelated things visibly separate)
- [ ] Spacing matches `system.md` personality (dense → 8–16px; spacious → 24–48px between sections)
- [ ] No uniform spacing everywhere — that's a template smell
- [ ] Frame hierarchy mirrors DOM structure (Figma/Paper wrappers = real component wrappers, same gap/padding)
- [ ] No spacer frames or `<br>` tags — use `gap`/`itemSpacing`
- [ ] Concentric radius respected (outer radius ≥ inner radius; see `knowledge/core/motion-patterns.md` for micro-tactics)

**Fail action:** Load `skills/impeccable/reference/layout.md` (`/layout`). Identify the largest gap inside a group and the smallest gap between groups — they should not be equal.

---

## 6. Color & Contrast

**Purpose:** Color communicates, and everyone can read it.

**Checks:**
- [ ] Text contrast ≥ 4.5:1 on body, ≥ 3:1 on large text (WCAG 2.1 AA)
- [ ] Non-text UI elements (borders, icons, state indicators) ≥ 3:1 against their background (WCAG 2.1 AA non-text contrast)
- [ ] Dark mode contrast verified separately — light mode passing does not guarantee dark mode
- [ ] No gray-on-color (e.g., gray text on colored button) — a common AI-slop tell
- [ ] Color is not the only channel carrying meaning (pair with icon, label, or shape)
- [ ] Accent/brand color used sparingly (hierarchy demands scarcity)

**Fail action:** Run the design through a contrast checker (axe, WAVE, or `npm run` your project's a11y checker). Darken foreground or lighten background to clear 4.5:1.

---

## 7. Motion & Interactions

**Purpose:** Motion communicates causality and state, never decoration.

**Checks:**
- [ ] Every interactive element has a visible hover state (gated behind `@media (hover: hover)` for touch)
- [ ] Every button has `:active` press feedback (scale ≈ 0.97 or translate-y)
- [ ] Every focusable element has a visible focus ring (and `:focus-visible` for keyboard-only)
- [ ] Transitions animate only `transform` and `opacity` — no `width`, `height`, `top`, `left` on transitions
- [ ] UI animation durations under 300ms (drawers/sheets excepted)
- [ ] Enter/exit from `scale(0.95) opacity(0)`, not `scale(0)`
- [ ] `prefers-reduced-motion: reduce` honored — fade instead of transform, never full removal
- [ ] No animation on actions triggered 100+ times/day (command palette, keyboard shortcuts)
- [ ] Popovers/dropdowns anchor `transform-origin` to the trigger, not center
- [ ] Custom easing curves used (see `motion-patterns.md`) — not built-in `ease`/`ease-in-out`

**Fail action:** Load `knowledge/core/motion-patterns.md` and `skills/emil-design-eng/SKILL.md`. For SVG work, load `skills/svg-animations/SKILL.md`.

---

## 8. Accessibility

**Purpose:** Everyone can use it — keyboard, screen reader, magnifier, reduced-motion.

**Checks:**
- [ ] Semantic HTML — `button` for actions, `a` for navigation, `h1`–`h6` for structure
- [ ] Single `h1` per page; no heading levels skipped
- [ ] All form inputs have an associated `<label>` (not placeholder-as-label)
- [ ] Required fields visibly marked (not only color)
- [ ] Error messages are specific, programmatically associated (`aria-describedby`), and polite
- [ ] Keyboard navigation: tab order logical, no keyboard traps, Esc closes modals, arrow keys in menus
- [ ] Focus ring visible at ≥ 3:1 contrast against all backgrounds it appears over
- [ ] Touch targets ≥ 44×44px (Apple HIG) on mobile; 8px+ spacing between adjacent interactive targets
- [ ] `alt` text on meaningful images; `alt=""` on decorative
- [ ] ARIA used only where semantic HTML can't express the state (role, state, property)
- [ ] Dynamic content updates announced (`aria-live` where appropriate)

**Fail action:** Load `skills/rams/SKILL.md` and `skills/web-design-guidelines/SKILL.md`. Run the component through an a11y tool (axe, Lighthouse, VoiceOver).

---

## 9. Responsive Behavior

**Purpose:** Works across viewports, not just the one you designed in.

**Checks:**
- [ ] Mobile variant built or desktop-only acknowledged explicitly to the user
- [ ] No horizontal scroll on viewports ≥ 320px wide
- [ ] Fluid layouts where possible; breakpoints only where the layout meaningfully changes
- [ ] Touch targets meet 44px on mobile
- [ ] Primary action reachable in thumb zone on mobile (bottom center)
- [ ] Text remains readable at 200% zoom (WCAG 1.4.4)
- [ ] Navigation pattern changes appropriately (sidebar → bottom bar / drawer on mobile)
- [ ] Long content truncates with purpose (ellipsis + tooltip, or `line-clamp` with reveal)
- [ ] Images use `srcset` or responsive sizing — no oversized assets on mobile

**Fail action:** Load `skills/impeccable/reference/adapt.md` (`/adapt`). Re-plan the mobile hierarchy rather than shrinking the desktop layout.

---

## 10. Performance & Ship Readiness

**Purpose:** Fast, lean, and actually ready to merge.

**Checks:**
- [ ] No expensive animations (`width`/`height`/`top`/`left` transitions)
- [ ] Images lazy-loaded below the fold; `width`/`height` attributes present to prevent CLS
- [ ] No unused imports, no dead branches, no `console.log` left in
- [ ] Code passes typecheck and lint
- [ ] No hardcoded copy that should come from content/props (beyond intentional fixtures)
- [ ] Error and empty states designed and tested — not just happy path
- [ ] Loading states designed — no raw spinners without context
- [ ] Tested with browser DevTools at 6× CPU throttle for animation smoothness
- [ ] `will-change` used sparingly, removed after animation completes
- [ ] Bundle impact considered for any new dependency

**Fail action:** Load `skills/impeccable/reference/optimize.md` (`/optimize`) for perf work and `skills/impeccable/reference/harden.md` (`/harden`) for edge-case coverage.

---

## The Compression Test

After all 10 sections pass, one final pass:

- [ ] Can anything be **removed** without losing information? If yes, remove it.
- [ ] Does every visual element earn its place?
- [ ] Is typography doing the hierarchy work, or are you relying on color/borders to carry it?
- [ ] Could the layout be denser without losing clarity? (only if personality says dense)
- [ ] Is motion adding communication, or just decoration?
- [ ] Would this look good in a static screenshot, without any interaction?

> "Good design is as little design as possible. Back to purity, back to simplicity." — Dieter Rams, Principle 10

---

## Ship / Don't Ship

**Ship if:** All 10 sections pass, the Compression Test has been run, and no P0 issues remain.

**Don't ship if:**
- Any token compliance check fails (Section 3) — the contract is violated
- Any contrast check fails (Section 6) — WCAG AA is a legal/ethical floor
- Any keyboard/focus accessibility check fails (Section 8) — the product is unusable for a real portion of users
- The Identification Test (Section 1) fails — the design reads as generic AI output

For non-P0 failures, log them, note them in your response to the user, and let the user decide whether to ship with the known gap or iterate.

---

## Retrieval Queries

- Pre-ship checklist design quality final sweep
- 10-section ship gate verification craft
- Token compliance motion a11y responsive final audit
- Compression test design simplicity Rams
- WCAG contrast touch targets ship criteria
- Don't ship design gate blocking issues
