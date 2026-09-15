---
name: design-seed
description: Scaffold a greenfield `design.md` before branding exists. Short stack interview (or auto-detected from package.json), emits a seeded design.md that ships with the project on day one. Use when starting a new repo or when the user says "new project", "greenfield", "bootstrap design system", "seed a design.md", "shadcn default scaffold". Pairs with `design-extractor` (which is for extracting from existing sources).
---

# design-seed

Scaffold a ready-to-build `design.md` for a greenfield project. Zero measurement required — seed from the stack's defaults, tag every token `seeded`, pre-populate an Open Questions list as the branding backlog. Teams can ship UI on day one and flip tokens from `seeded` → `decided` as brand decisions land.

## When to use

Trigger on any of:

- "Seed a design.md for a new project"
- "Bootstrap the design system"
- "Starting a new Next.js / Tailwind / shadcn project"
- "Scaffold design tokens"
- User opens an empty repo or one with only `package.json` + config and asks for design system setup
- User says "new greenfield" / "fresh project" / "no brand yet"

**Don't use this when:** an existing app / Figma file / design source exists. That's `design-extractor` territory. Seeding over real evidence throws away ground truth.

## Prerequisites

One of:

- A repo with `package.json` (stack auto-detected), OR
- The user is willing to answer 3 stack questions

## Step-by-step

### 1. Detect or ask the stack

**First:** read `package.json` if one exists. Look for:

- **Framework:** `next` / `remix` / `@remix-run/*` / `astro` / `vite` / `@sveltejs/kit`
- **Styling:** `tailwindcss` (check version — v3 vs v4 have different token syntax) / `styled-components` / `@emotion/*` / `@vanilla-extract/*` / `@pandacss/*`
- **Component kit:** check `components/ui/` folder for shadcn / `@mui/material` / `@chakra-ui/*` / `@mantine/*` / `antd` / `@radix-ui/*` raw
- **Icons:** `lucide-react` / `@heroicons/*` / `@phosphor-icons/*` / `@tabler/icons-*`
- **Font:** `geist` / `@next/font` usage / CSS @font-face

**If detected:** confirm with one line to the user ("Detected Next.js 15 + Tailwind v4 + shadcn/ui + Lucide + Geist. Seed with shadcn new-york defaults? [Y/n]").

**If nothing detected (empty repo):** ask 3 questions:

1. Framework + styling? (default: Next.js 15 + Tailwind v4)
2. Component kit? (default: shadcn/ui new-york style)
3. Dark mode on day one? (default: yes — shadcn ships both light + dark values)

Don't ask about icons or font — default Lucide + Geist Sans & Mono unless the user raises it.

### 2. Project identity (required)

Ask three questions, conversational — one turn, user can answer in a single reply.

1. **What's the project called?** (for the design.md header + folder name)
2. **What does this product do, in one sentence?** (verb-forward — "lets users …", "helps teams …")
3. **Who's the primary user?** (device, context, stakes — 1–2 sentences is fine)

The answers go straight into §0 Direction. Don't invent positioning — if the user says "I don't know yet", seed `[needs user confirmation]` for anything they skip.

### 3. Scope — primary surfaces (required)

**Ask:** "What are the 3–7 main screens or flows you'll need to build first? (comma-separated is fine)"

Use the answer to pre-populate the §States Checklist with placeholder state rows per surface (empty / loading / error / success) and note them in §0 Direction as "what this product is scoped to."

### 4. Personality presets (optional — skip for pure shadcn default)

**Ask:** "Pick 1–3 that describe how this should feel. Skip to stay with shadcn default." Present as a list:

- **Quiet** — restrained, minimal, default-leaning
- **Spirited** — energetic, warmer palette, softer radius
- **Serious** — conservative, tight radius, restrained weights
- **Confident** — bold, high contrast, heavier type
- **Human** — warm, approachable, stone neutral
- **Engineered** — precise, cool neutrals (slate/zinc), sharp radius
- **Premium** — refined, deeper surfaces, generous padding
- **Dense** — data-heavy, tight padding, compact rows

Each pill maps to specific token adjustments from the shadcn baseline. Pills compose — if the user picks "Human + Spirited", apply both adjustments in order. See [references/personality-presets.md](references/personality-presets.md) for the exact token diffs.

If the user skips this step: emit pure shadcn new-york default. That's a valid, neutral starting point.

### 5. Brand direction (optional)

Two short optional asks:

1. **"Any color direction yet?"** (name, hex, OKLCH value, tweakcn URL, or "not yet")
2. **"Any typography leanings?"** (e.g. "Geist only", "serif headings + sans body", "mono-forward", or "not yet")

If provided, note in §Open Questions as "Leaning toward …" — **do not** flip the seeded tokens yet. A leaning isn't a decision. These are hints for when a formal tweakcn or theme-generator export lands (see [references/import-tweakcn.md](references/import-tweakcn.md)).

### 6. Route to the matching seed template

| Stack detected | Seed template |
|---|---|
| Next.js / Vite / Remix / Astro + Tailwind v4 + shadcn | [references/seed-tailwind-shadcn.md](references/seed-tailwind-shadcn.md) |
| Next.js + Tailwind v3 + shadcn | same template, note Tailwind v3 in header; generator emits v3 syntax |
| MUI / Chakra / Mantine / Ant | **TBD** — seed templates not yet built. Emit a skeleton design.md with the stack pinned and `[needs user confirmation]` on every token. |

The seed template is a complete design.md with shadcn defaults in every section. The skill's job is:

1. Copy the template to `<product-name>/design.md` (confirm location with user)
2. Patch the header: project name, today's date, detected-or-chosen stack string
3. Patch §0 Direction with the answers from step 2 (name / what-it-does / who-for). Any unanswered → `[needs user confirmation]`.
4. Pre-populate §States Checklist with rows for each surface from step 3.
5. Apply personality-preset token adjustments if any pills were picked in step 4 (see [references/personality-presets.md](references/personality-presets.md) for per-pill token diffs). Tags stay `seeded` — a preset is a tweaked default, not a decision.
6. Note color / typography leanings from step 5 under §Open Questions (as "Leaning toward X — confirm via tweakcn import").
7. If dark mode off: remove the Dark column from §2 (or collapse to a single mode).
8. If icon set isn't Lucide: swap references in §4 and §9.
9. Save. Tell the user what's ready and what's waiting.

### 7. Pin the stack in the header

Every seeded design.md MUST include a precise `Stack:` line in the top metadata. Pin versions from the project's `package.json` when available. Without this line, downstream generators can't emit the right `globals.css` / theme config syntax.

Example:

```
**Stack:** Next.js 15.1.0 · Tailwind v4.0.1 · shadcn/ui (new-york, canary) · Lucide 0.475 · Geist Sans + Mono · TypeScript 5.4
**Generator target:** `app/globals.css` (CSS custom properties via `@theme inline`) + Tailwind v4 config
```

### 8. Hand off to the team

After writing the file, tell the user:

- **What works day one:** §4 Components, §5 Layout, §6 Depth, §9 Agent Prompt Guide — real shadcn decisions a dev or agent can build against immediately.
- **What's waiting:** §0 Direction (Who / Verb / Feel), §2 Color primary hue + neutral temperature, §Open Questions (12 default branding decisions).
- **Next step:** as brand lands — paste a tweakcn URL, a shadcn theme generator export, or hand-authored decisions — run the import protocol at [references/import-tweakcn.md](references/import-tweakcn.md) to flip `seeded` tokens to `decided`.

## Confidence tag lifecycle

Extends the design-extractor confidence hierarchy. Strongest to weakest:

- `figma-live` — pulled from Figma MCP
- `computed-live` — pulled from browser DevTools MCP
- `asked-user` — user pasted DevTools or confirmed explicitly
- `decided` — team committed to this value (flipped from `seeded` or `inferred`)
- `observed` — measured from screenshot
- `inferred` — pattern-matched from similar systems
- `seeded` — stack default, **change before ship** if brand requires it

A fresh seeded design.md is 100% `seeded`. As the team works, tokens flip:

- Brand lands → `seeded` → `decided` (primary hue, neutrals, radius)
- Extractor verifies shipped code → `decided` can be promoted to `computed-live` if the code exactly matches the declared value; flagged as drift otherwise.

## Output discipline

Every seeded design.md follows these rules:

1. **Every token is tagged `seeded`** with its source (`← seeded: shadcn/ui new-york default`). No unsourced values.
2. **`[needs user confirmation]` tags on prose sections** (Direction, Defaults-being-rejected, Feel). Don't invent positioning for a project you've never seen.
3. **Open Questions pre-populated** with the 12 standard branding decisions (see seed template).
4. **Header stack line pinned** to actual `package.json` versions when available.
5. **Drift section starts empty** with a note: "Will populate as the extractor runs against shipped code."

## Stop conditions

- Repo has existing UI, Figma file, or any measurable source → **stop and route to `design-extractor`**. Don't seed over real evidence.
- Stack isn't Tailwind+shadcn and no seed template exists for it → emit a skeleton design.md with `[needs user confirmation]` on every row and tell the user a targeted seed template needs to be added for their stack (open a `skills/design-seed/references/seed-<stack>.md` issue).
- User wants branding decisions from you without input → stop. This skill seeds stack defaults, it does not invent brand direction.

## Relationship to other artifacts

- **Layer 1 — `contract/globals.md`** (agent package) — stable token architecture. Read-only. This skill references it; doesn't rewrite.
- **Layer 2 — `design.md`** (per product) — what this skill writes. Evolves with the team.
- **Layer 3 — `globals.css` / Tailwind config** (generated) — downstream from design.md via a separate generator step (not part of this skill).

This skill only produces Layer 2. Generator that emits Layer 3 from Layer 2 is a separate concern.

## Sibling skills

- **`design-extractor`** — the inverse: reverse-engineer design.md from an existing source (Figma / live app / screenshots). Use instead of seed when ground truth exists.
- **`impeccable`** — craft methodology. Applies to seeded design.md the same as any other. The seed doesn't preempt craft review.
