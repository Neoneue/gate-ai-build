# system.md — *(legacy / deprecated — see note)*

> ⚠ **Deprecated.** The policy layer (Direction / Defaults-rejected / Rule lines / per-component Do/Don't / Drift to normalize / Open Questions / Motion defaults) has been **absorbed into `design.md`** via the upgraded [template.md](../template.md). New extractions produce a single `design.md` — not a separate `system.md`.
>
> This document is kept for:
>
> 1. Projects that actively use the `interface-design` plugin (which still writes to `.interface-design/system.md`) and need a reference for what goes where.
> 2. Users who explicitly ask for a `system.md` alongside their `design.md` — after producing the upgraded `design.md`, you can offer a legacy `system.md` as a companion using this template.
>
> For new work, don't split evidence and policy into two files. One `design.md` with the opinion layer inline is what designers and devs now build against. If a project has a stale `.interface-design/` folder left over from earlier conventions, it's safe to remove once the content is absorbed into `design.md`.

---

`system.md` is the **policy layer** on top of `design.md`. Where `design.md` reports what was *observed*, `system.md` prescribes what the system *is* — rules, do/don't calls, dominant-token selections, drift to normalize, open questions. It's auditable precisely because it cites its evidence back to `design.md`.

Use this when the user asks for:
- "generate `system.md`"
- "replace the current `system.md`"
- "use the interface-design plugin" (and the plugin isn't installed — produce an equivalent hand-authored file)
- "full extraction" (write both `design.md` and `system.md`)

## Prerequisites

Write `design.md` first. `system.md` cannot be sourced from thin air — every decision inside it needs ground truth underneath. If the user asks for `system.md` without `design.md` existing, produce `design.md` first (silently or with a one-line note), then distill.

## File location

1. **Host convention (default):** `<product-name>/system.md` next to `design.md`, or the repo root if the host uses the front-end-developer agent layout.
2. **Plugin convention (only when the interface-design plugin is actively maintained on this project):** `/.interface-design/system.md`.

Ask before clobbering an existing `system.md` that describes a different project — copy the old one aside first (`<product-name>/system.<old-date>.md`).

## Template — canonical section order

Every `system.md` uses this order. Don't add or reorder sections without reason.

```markdown
# <Product name> — <one-line positioning>

<One paragraph: source file / URL + scope (how many screens, which pages) + kit identity + what the scan did NOT cover>

> Sections tagged **[needs user confirmation]** were not derivable from measurement alone. Everything else is extracted from <list of authoritative sources>. Sibling evidence at `<path to design.md>`.

---

## Direction [needs user confirmation]

- **Who:** <specific persona — device, context, stakes, expectations>
- **Verb:** <the one action this product exists to do — "hold and move," "confirm and pay," "approve and sign">
- **Feel:** <aesthetic positioning — one sentence including key tokens>

## Defaults being rejected [needs user confirmation]

<3–5 numbered items of the form "Default pattern → what this system does instead." Each is a decision made *against* the genre.>

---

## Depth strategy: **<shadow-first | border-first | mixed>**

<Single-paragraph rule for how elevation is treated. Name the 4–5 shadow tokens used and when. Call out what NOT to mix.>

---

## Spacing — base 4 px (or Npx)

<Frequency table — Tokens used in the scan + count of observations + role. The count matters because it reveals the *dominant* token (the one most things default to).>

| Token | Value | Uses | Role |
|---|---|---|---|
| `spacing/4` | 16 | **90** | **dominant** — card padding |
| ...

**Rule:** <one or two short sentences telling the reader when to pick each step>

---

## Radius — <N> tiers

<Same pattern — table with observation counts, one Rule sentence at the end. If the kit publishes more radii than used, call that out.>

---

## Typography

**Family:** <name + source: e.g. "→ [Font family] ([kit name])"> — with a line about what's NOT allowed (no second family, no monospace in product flows, etc.)

**Type scale:**

| Style | Size / Line-height | Weights | LS | Role |
|---|---|---|---|---|
| ...

**Signature:** <the one type move that is distinctive — the 48 px hero, the 40 px display, the −3 tracking on titles. One paragraph.>

**Rule:** <what sizes are allowed where; where hierarchy comes from — weight, color, or size>

---

## Color — semantic tokens only

All chrome colors bind to semantic tokens. **Do not introduce new hex.**

### Surfaces + text
### Primary (commit actions)
### Accent — <role>
### Semantic — gain / loss / destructive
### Network / chain (if applicable)
### Do not use

<For each subsection: bullet list of tokens with their resolved values + role. The Do-not-use list names specific anti-patterns observed in the scan — legacy bindings, Tailwind-palette aliases that bypass semantics, raw hex that should be bound.>

---

## Component patterns

<One subsection per canonical component. Tight: geometry (height/radius/padding), fill/stroke/text in tokens, states, rules. No code — this is spec, not JSX.>

### Button — primary CTA (the signature)
### Button — secondary / outlined
### Card (default / outlined variant)
### <Domain row — token row / activity row / payment method row>
### Input — text field
### <Domain input — code cells / amount input / address chip>
### Segmented tabs
### Top bar
### Bottom tab bar (if mobile) / Sidebar (if web)
### Bottom sheet / modal
### Info callout
### Warning / error callout
### Toast / snackbar
### Icons (set + sizes + stroke binding rule)
### Brand (logomark + wordmark placement rules)

---

## States checklist (observed)

<Enumerate every state captured in the scan, grouped by flow. This is how you prove the design covers the full space — not just happy paths.>

**Rule:** every new screen added to <domain> must ship with its <required states> in the same PR.

---

## Motion [needs user confirmation]

<Default motion tokens (button press, hover, sheet enter/exit, tab swap). Always start with the agent's global defaults until product confirms.>

---

## Drift to normalize

<List of specific legacy bindings, unbound hex counts, wrong font families surfaced in the scan. These go into a /normalize pass — they should not leak into new work.>

Raise as a `/normalize` pass before extending any flow.

---

## Open questions

<Numbered list of unresolved decisions. Each names the specific screen/node to look at to resolve it. Don't hide uncertainty.>

---

## Evidence log

| Section | Basis |
|---|---|
| ...

Sibling evidence document with full per-token citations: **`<path to design.md>`**. This file is the **opinionated contract** distilled from that evidence.
```

## Discipline rules (what makes a good system.md)

1. **Every number is a decision, not a measurement.** "Cards are `rounded-2xl` (16 px)" is a decision. The measurement ("9 out of 11 cards in the scan used 16 px") belongs in the Evidence log or parentheses. Lead with the rule.
2. **Frequency counts for spacing and radius.** The dominant token (the one used most) is the *default*; the rare ones are the exceptions. A reader scanning the table should be able to pick a spacing step in one second.
3. **`[needs user confirmation]` is an explicit tag**, not a maybe. Use it on Direction, Defaults being rejected, Motion, and any token that wasn't resolvable. Don't pad with guesses.
4. **The Do-not-use section is as important as the Do section.** Name the specific anti-patterns surfaced by the scan: raw hex that should be bound, palette aliases that bypass the semantic layer, foreign-family font leakage, duplicate tokens for the same role.
5. **Drift to normalize is not optional.** Every scan surfaces something. If truly nothing, say so explicitly — don't omit the section.
6. **Motion starts with the agent's defaults.** Don't leave §Motion empty — seed it with the 4–6 standard defaults (button press 160 ms ease-out, sheet 300 ms ease-drawer, etc.) and tag the whole section `[needs user confirmation]`.
7. **Open questions name a specific node or screen to resolve each.** Example: "Dark mode — no mode-switched values in scan. Resolve by re-querying kit file key `<key>` with `Dark` mode forced." Don't write "TBD" — give the next reader the query.
8. **Evidence log links back to `design.md`.** One-line mapping section-to-source. The contract earns its authority from the snapshot.

## Relationship to `design.md`

`design.md` and `system.md` are sibling deliverables, not alternatives:

- `design.md` is the **freeze frame.** It's rewritten every time you re-extract. Citations are per-value.
- `system.md` is the **contract.** It's edited over time as the team decides. Citations live in the Evidence log.

When they disagree, `design.md` is the measurement and `system.md` is the intent. A `system.md` rule that contradicts `design.md` is a **drift signal** — either the code/design needs to move, or the rule needs to be rewritten. Log those as drift entries, not silent overrides.

## Writing `system.md` without a running interface-design plugin

The `interface-design` plugin (commands: `/init`, `/extract`, `/audit`, `/critique`, `/status`, `/codegen`) was historically the canonical tool for authoring and maintaining `.interface-design/system.md`. When the plugin isn't installed — or when the project has retired that convention in favor of a single `design.md` — produce the file by hand using:

1. The `design.md` you just wrote as evidence
2. This template's section order
3. The discipline rules above
4. Direct `get_variable_defs` / `get_design_context` calls on representative nodes for any token not yet in `design.md`

The output is structurally indistinguishable from what the plugin would produce, and it composes with the plugin when it becomes available (the plugin can re-read and extend).
