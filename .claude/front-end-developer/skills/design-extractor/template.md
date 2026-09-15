---
# DESIGN.md format — compatible with `npx @google/design.md lint`
#
# STRUCTURE: Google's canonical (Overview → Colors → Typography → Layout → Elevation
# → Motion → Shapes → Components → Voice & Content → Do's/Don'ts) + our extensions
# (Direction, Responsive, Sources). Unknown sections
# survive linting.
#
# VOCABULARY belongs to the source stack (shadcn / Material / Tailwind / Apple HIG /
# brand-custom). Use the source's actual token names. The linter only requires
# `colors.primary`.
#
# CONCISION TARGET: ≤750 lines. This template demonstrates the compressed form.
# Per-line citations get stripped (header explains the scheme); variant blocks use
# flow-style `{ ... }` one-liners; recap sections (Agent Prompt Guide etc.) are out.
# See SKILL.md "Concision discipline" for the cut policy.

version: alpha
name: "[PRODUCT NAME]"
description: "[verb + who + feel — one sentence]"

colors:
  # Required by linter — use the source's actual descriptive name in §2 prose.
  primary: "#000000"  # ← [source]

  # Source-vocabulary tokens. Common families:
  #   Surfaces: background, surface, card, popover, sidebar, sheet
  #   Text: foreground, on-surface, on-primary
  #   Interactive: primary, secondary, tertiary, accent
  #   Borders: border, outline, divider, input, ring
  #   Semantic: destructive, error, success, warning, info
  #   Scales: chart-1..N, data-1..N
  # Use SOURCE NAMES. Don't translate to a foreign vocabulary.
  #
  # [token]: "#HEX"  # ← [source, brief note if useful]

typography:
  # Keys are source role/size names (display/h1/body/label/eyebrow/data, OR
  # text-3xl/text-base, OR headline-large/body-medium). Block per role:
  #
  # [role]:
  #   fontFamily: "[stack]"
  #   fontSize: [px/em/rem]
  #   fontWeight: [weight]      # numeric
  #   lineHeight: [value]
  #   letterSpacing: "[em]"     # quote em values; omit when 0
  #   fontFeature: "[feature]"  # optional, e.g. "tnum"

rounded:
  # Source's scale (t-shirt / numeric / role-based). Include only steps in use.
  # [key]: [value]  # ← [source]

spacing:
  # Source's scale. Include only steps in use. Bold the dominant step in §4 table.
  # [key]: [value]  # ← [source]

components:
  # Per-component structural tokens. Component keys = product vocabulary.
  # Reference primitives via {path.to.token}.
  #
  # COMPRESSION RULES:
  # - Parent components get full block form (5–6 lines).
  # - Variants and state tokens (-hover, -focused, -disabled, -checked, -overlay,
  #   -trigger-active, per-tone) collapse into flow-style one-liners
  #   `{ key: "val", key: "val" }` OR fold into the parent's trailing comment.
  # - Drop variants entirely if §7 prose already documents the state behavior
  #   AND no other YAML block references the variant key.
  #
  # [component]:                                   # ← parent: full block
  #   backgroundColor: "{colors.[token]}"
  #   textColor: "{colors.[token]}"
  #   typography: "{typography.[role]}"
  #   rounded: "{rounded.[scale]}"
  #   padding: [value]
  #   height: [value]
  # [component]-variant: { backgroundColor: "{colors.X}", textColor: "{colors.Y}" }  # ← variant: flow-style
---

# Design System — [PRODUCT NAME]

> **Format:** [DESIGN.md](https://github.com/google-labs-code/design.md) (Google) — YAML front matter + prose rationale.
> Validate with `npx @google/design.md lint design.md`. Export `--format dtcg` (preserves `components.*`) or `--format tailwind` (primitives-only Tailwind-v3 JSON).
> **Authoring discipline:** every value cites a source. **This document supersedes [legacy doc names if any]** — when they disagree, this file wins.

**Source:** [web URL + viewport / figma URL + fileKey / screenshot filenames / DevTools paste / this repo]
**Stack:** [tailwind-shadcn / material-v3 / mui / apple-hig / chakra / css-vars-custom / unknown]
**Extraction mode:** [figma-live / browser-live-mcp / url / screenshot / hybrid / code-direct]
**Confidence summary:** [N strong, N partial, N TBD]
**Captured states:** [e.g. logged-in dashboard light mode @ 1440×900; modal; form validation]
**Not yet captured (TBD):** [states / nodes / screenshots needed]

---

## 0. Direction *(our extension)*

**Who:** [persona — device, context, expectations, one sentence]. **Verb:** [the one action this product exists to do]. **Feel:** [aesthetic — one sentence with key tokens].

### Defaults being rejected

[3–6 numbered items, each one line: "Default pattern → what this system does instead." Flag `[needs user confirmation]` if inferred. These are durable signal for an agent — prohibitions matter.]

1. **[Default pattern]** → [what this system does]. (decided / inferred)

---

## 1. Overview *(Google canonical §1)*

[One paragraph: positioning, audience, information density, interaction model. No mood-board prose — name the visual register in one phrase, then describe what's actually rendered.]

**Key characteristics:** [N facts in a single line, separated by `·`. e.g. "5 OKLCH ramps × 11 steps · two-tier material ladder (6/12/4px) · five-voice typography · no dark mode · ink-900 primary, not blue · shadow-as-border, not solid borders".]

---

## 2. Colors *(Google canonical §2)*

[1–2 sentence preamble: where the contract lives, layer structure (palette atoms vs semantic), what's banned outside the contract.]

### Primary & brand accent

- **[Name]** `[value]` ← `{colors.[key]}` — [role, what it's NOT used for]
- **[Brand accent]** `[value]` ← `{colors.[key]}` — [role + what's reserved]

### Step roles (apply across all N ramps)

[ONE table — the step encodes **intent, not lightness**: the same number plays the same UI role in every ramp. **One role per step** — do NOT group steps like `50–100`; split each so an agent maps step → role unambiguously. Note which semantic tokens resolve to each step.]

| Step | Role |
|---|---|
| 50 | [field/well wash, lowest surface] |
| 100 | [default subtle bg + hover-bg; which fills resolve here] |
| 200 | [borders, dividers — what semantic tokens resolve here] |
| 300 | [strong borders, ghost-hover bg] |
| 400 | [placeholder text, disabled, separators — e.g. ring] |
| 500 | [secondary text, icons] |
| 600 | [solid mid fill — e.g. destructive] |
| 700 | [saturated text on tint, brand anchor] |
| 800 | [body text default] |
| 900 | [primary text, headlines — e.g. foreground/primary] |
| 950 | [reserved / extreme contrast, if present] |

### Status semantics

[One paragraph: which step is bg, which is text, which is solid mid, for each semantic ramp. Replaces 3 separate sub-sections.]

### Chart palette

[Brief: brand-decoupled or brand-coupled, slot count, hue spacing, override mechanism if any. Slot list as one inline-bulleted line.]

### Vendor / brand external colors

[One-line list: "Anthropic `#X` · OpenAI `#Y` · Multi-color SVG: Vendor1, Vendor2". Skip the multi-row table.]

### Do not use

- [Specific anti-patterns from the scan: legacy bindings, alias bypasses, raw hex outside contract, color reused for incompatible meanings]

---

## 3. Typography *(Google canonical §3)*

### Font Family

- **Sans:** `[stack]`
- **Mono:** `[stack]`

[One sentence on loading + any aliases / removed alternatives.]

### Hierarchy

[One table — keys match YAML. Drop the Notes column if the Use column carries it.]

| Role (YAML key) | Font | Size | Weight | Line | Use |
|---|---|---|---|---|---|
| `[key]` | | | | | |

**Default.** [Name the single fallback voice for UI text and for values/numerics — e.g. `body-sm` (14/20 sans) and `data` (mono 14/20) — so an agent picks without scanning the whole table. State it explicitly.]

### Voice taxonomy *(if the system splits sans/mono or display/data by intent)*

[One table mapping each voice to its recipe + use. The "Critical rule" goes in one bold line below.]

### Principles

[One paragraph: weight ceiling, size floor, hierarchy source, voice ratio. Compress 4 bullets to 2–3 sentences.]

---

## 4. Layout *(Google canonical §4)*

### Spacing System

[Table — bold the dominant step. The Uses column is observation count from the scan if available, otherwise role.]

| Token | Value | Uses | Role |
|---|---|---|---|
| `spacing.[key]` | | | |

**Rule:** [which step where — one sentence].

### Grid & Container

- **Grid:** [columns + gutter + behavior]
- **Outer page margins:** [value at which breakpoints]
- **Spec-sheet vs composed:** [if applicable]
- **Page-header subtitle width:** [if codified]

[One paragraph on whitespace philosophy + any body-bg rule. Don't repeat the spacing table.]

---

## 5. Elevation & Depth *(Google canonical §5)*

[One sentence: shadow composition rule, what's banned, what tracks the ramp.]

[ONE combined table — pair shadow with radius and surface list. Replaces the prior shadow-table-then-material-table pattern.]

| Tier | Token | Composition | Radius | Surfaces |
|---|---|---|---|---|
| Everyday | | | | |
| Hover | | | | |
| Menu | | | | |
| Modal | | | | |
| Sub-element | | | | |

**Rule:** [shadow-first vs border-first; concentric rule; locks].

---

## Motion *(Google canonical)*

[Lead: animate intent, not decoration — which properties transition (colors / shadow / opacity / scale / transform), never `transition-all`; reduced-motion always wins (`motion-reduce:*`).]

[ONE quick-ref table of motion tokens — easing curves + standard durations and where each applies. This is the single source for the values; the prose below must not restate them.]

| Token / duration | Value | Where |
|---|---|---|
| `[ease default]` | | [all standard color/shadow/scale transitions] |
| `[other easing]` | | [slide-in surfaces: drawer / sheet] |
| `[short]`ms | | [overlay fade, menu-item highlight] |
| `[base]`ms | | [default control transition] |
| `[enter]`ms | | [dialog / popover enter] |
| `[slide]`ms | | [sheet / drawer] |

[One paragraph for the detailed contract: press affordance (scale value + any trigger gate + `will-change-transform` + the paired `motion-reduce` reset), sliding indicators, dialog/menu transform-origin, exceptions. Flag `[needs user confirmation]` if motion wasn't directly extracted.]

---

## 6. Shapes *(Google canonical §6)*

[One sentence on what drives the radius scale + any locked overrides.]

| Token | Value | Use |
|---|---|---|
| `rounded.[key]` | | |

[One sentence on iconography: library, stroke weight, sizes, any per-button/per-control trim conventions. Replaces a separate "Shape Language" subsection.]

---

## 7. Components *(Google canonical §7)*

[One sentence: where the primitive library lives, count, and the rule "composed pages are compositions, not components themselves."]

### [Group: Buttons]

[One bullet per primitive — file path + key class string + size variants + states + asymmetric padding rules. Cross-cutting "Don't" lives in §8; per-primitive rules only when component-specific.]

- **[Component]** (`file.tsx`) — [class string]. [size variants]. [state behaviors]. [any rules].
- **[Component]** (`file.tsx`) — ...

**Rule (if component-specific):** [...]

### [Group: Inputs & Forms]

- **[Component]** (`file.tsx`) — ...

[Repeat the pattern for each component family: Cards & Containers, Selectors, Lists / Tables, Modal / Drawer, Badges/Pills/Tags, Hero Numerics & KPIs, Toast, Brand. Group sub-headings keep scanning fast; bullet form keeps it compact.]

### Inline links (className convention, not a primitive)

[Recipe + render-as guidance.]

### Composed-row patterns

[Recipe per shared composition pattern (consolidated row with inset hairline, focal-section accent, etc.). One short paragraph each, with the className recipe inline.]

### Section header capitalization

[One short rule list if the project codifies casing.]

---

## Voice & Content *(Google canonical)*

[Microcopy + tone contract — the project's actual rules, not generic advice. Bullet list:]

- **Case.** [Sentence case vs Title Case for titles / labels / buttons / tabs; what UPPERCASE or mono is reserved for.]
- **Actions.** [Verb-led and specific; banned bare labels like `OK` / `Confirm`.]
- **Terminology.** [UI term vs code-identifier splits; product nouns; what must not be blind-renamed.]
- **Numbers.** [Real-data rule; how an unknown / unmetered value renders — e.g. an em-dash, never an estimate.]
- **Status + errors.** [Real tokens; error copy = what happened + the fix, not "Something went wrong."]

---

## 8. Do's and Don'ts *(Google canonical §8 — cross-cutting only)*

### Do

- [System-wide rules not tied to a single component]

### Don't

- [Cross-cutting prohibitions. Per-component "don'ts" stay in §7.]

---

## Responsive Behavior *(our extension)*

[One sentence on default target. Breakpoint table. Touch targets bullet. Collapsing strategy bullet. Flag mobile TBD if not captured.]

| Name | Width | Key Changes |
|---|---|---|

---

## Sources & Composed-page References *(our extension)*

[Tokens cite `src/index.css:LINE` inline. Components cite per-file paths. Locked policy from feedback memories or equivalent. Composed pages in one short table:]

| Code | File | Pattern |
|---|---|---|
| [code] | [path] | [composition pattern] |

---

## Validation & Export

`npx @google/design.md lint [file].md` validates. `--format dtcg` for DTCG tokens (preserves `components.*`); `--format tailwind` for Tailwind-v3 JSON (primitives only — for v4, translate each into `@theme inline { --color-*: ...; }` in globals.css).
