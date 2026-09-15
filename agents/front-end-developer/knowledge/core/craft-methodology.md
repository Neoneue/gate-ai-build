# Craft Methodology — Anti-Default Design Process

> **Reading order:** This file (1/4) → `design-process-rules.md` → `design-recipes.md` → `pre-ship-quality-checklist.md`

> Read this before designing anything. This is what separates intentional work from AI templates.

---

## The Problem

You will generate generic output. Your training has seen thousands of dashboards. The patterns are strong.

You can follow an entire design process — explore the domain, name a signature, state your intent — and still produce a template. Warm colors on cold structures. Friendly fonts on generic layouts.

This happens because intent lives in prose, but code generation pulls from patterns. The gap between them is where defaults win.

---

## Where Defaults Hide

Defaults don't announce themselves. They disguise themselves as infrastructure.

**Typography feels like a container.** But typography IS your design. The weight of a headline, the personality of a label, the texture of a paragraph — these shape how the product feels before anyone reads a word.

**Navigation feels like scaffolding.** But navigation IS your product. Where you are, where you can go, what matters most. A page floating in space is a component demo, not software.

**Data feels like presentation.** A number on screen is not design. What does this number mean to the person looking at it? A progress ring and a stacked label both show "3 of 10" — one tells a story, one fills space.

**Responsive feels like scaling.** But mobile is not desktop-shrunk. It's a different context with different priorities, different gestures, different attention spans.

**Token names feel like implementation detail.** But your CSS variables are design decisions. `--ink` and `--parchment` evoke a world. `--gray-700` and `--surface-2` evoke a template.

The trap is thinking some decisions are creative and others are structural. There are no structural decisions. Everything is design.

---

## Intent First

Before touching code, answer these out loud — to yourself or the user.

**Who is this human?**
Not "users." The actual person. Where are they when they open this? What device? What's on their mind? A teacher at 7am on her phone with coffee is not a developer debugging at midnight on a 27" monitor.

**What must they accomplish?**
Not "use the dashboard." The verb. Grade these submissions. Find the broken deployment. Approve the payment. The answer determines what leads, what follows, what hides.

**What should this feel like?**
Say it in words that mean something. "Clean and modern" means nothing — every AI says that. Warm like a notebook? Cold like a terminal? Dense like a trading floor? Calm like a reading app?

**Where are they holding it?**
Phone in one hand on the bus? Tablet on the couch? Laptop at a desk? The primary device shapes EVERYTHING — touch targets, information density, navigation model, gesture affordances.

If you cannot answer these with specifics, stop. Ask the user. Do not guess. Do not default.

---

## Every Choice Must Be A Choice

For every decision, you must be able to explain WHY.

- Why this layout and not another?
- Why this breakpoint strategy?
- Why this color temperature?
- Why this typeface?
- Why this information hierarchy changes (or doesn't) between phone and desktop?

If your answer is "it's common" or "it's clean" or "it works" — you haven't chosen. You've defaulted.

---

## Sameness Is Failure

If another AI, given a similar prompt, would produce substantially the same output — you have failed. This isn't about being different for its own sake. It's about the interface emerging from the specific problem, the specific user, the specific context.

---

## Domain Exploration (Required Before Proposing)

Do not propose any direction until you produce all four:

**Domain:** Concepts, metaphors, vocabulary from this product's world. Minimum 5.

**Color world:** What colors exist naturally in this product's domain? If this product were a physical space, what would you see? List 5+.

**Signature:** One element — visual, structural, or interaction — that could only exist for THIS product.

**Defaults:** 3 obvious choices for this interface type — visual AND structural. You can't avoid patterns you haven't named.

**The test:** Read your proposal. Remove the product name. Could someone identify what this is for? If not, it's generic.

---

## Craft Checks (Run Before Showing)

Ask yourself: "If they said this lacks craft, what would they mean?" That thing you just thought of — fix it first.

- **The swap test:** If you swapped the typeface, layout, or color palette for your usual one, would anyone notice? The places where swapping wouldn't matter are where you defaulted.

- **The squint test:** Blur your eyes. Can you still perceive hierarchy? Is anything jumping out harshly? Craft whispers.

- **The signature test:** Can you point to five specific elements where your product signature appears? Not "the overall feel" — actual components.

- **The token test:** Read your CSS variables out loud. Do they sound like they belong to this product's world?

- **The mobile test:** Does the mobile layout feel like it was designed FIRST, or squeezed down from desktop? If you designed desktop first and then "fixed" mobile — start over.

- **The thumb test:** Can a human complete the primary task one-handed on a phone? Is the main action in the thumb zone?

If any check fails, iterate before showing.

---

## When the target is Figma or Paper (same intent, different runtime)

Craft, hierarchy, and tokens still apply. What changes is **how the surface works**:

- **Figma** is a **document tree**: `Document` → `Page` → frames with **auto-layout**, **component instances**, **variables**, and **modes**. MCP tools (`get_design_context`, `get_metadata`, `use_figma`, etc.) are how a developer-scale workflow talks to that tree — they do not replace understanding it. If you skip the model, you get wrong sizing order, broken variable binding, and layouts that do not match how designers structure files. **Before Figma work:** read `knowledge/figma/plugin-api.md` (Figma’s rules) and `knowledge/figma/mcp-workflow.md` (tool orchestration), then `knowledge/figma/canvas-building.md` and **host `system.md`** (Theme + Project) when present. For shadcn parity: `knowledge/shadcn/figma-component-reference.md` and `figma-theming.md`.

- **Paper** is **HTML/CSS on artboards**. **Before Paper work:** read `knowledge/paper/mcp-workflow.md` and `knowledge/paper/canvas-building.md`.

Treat MCP as **API access to the same file a human edits** — not a shortcut around learning that file’s primitives.

---

## Before Writing Each Component

**Every time** you write UI **code** or **build the equivalent on canvas**, state:

```
Intent: [who, what they need, how it should feel]
Viewport: [primary device/context]
Palette: [colors — and WHY]
Depth: [borders / shadows / layered — and WHY]
Surfaces: [elevation scale — and WHY]
Typography: [typeface — and WHY]
Spacing: [base unit]
```

If you can't explain WHY, you're defaulting.

---

## Subtle Layering

### Surface Elevation

```
Level 0: Base background (app canvas)
Level 1: Cards, panels (barely lighter)
Level 2: Dropdowns, popovers (floating above)
Level 3: Modals, sheets (highest elevation)
```

Each jump: 2-3% lightness in dark mode, shadow-based in light mode. Whisper-quiet.

### Borders

Low opacity, blend with background. Build a progression matching intensity to importance.

## Infinite Expression

**No interface should look the same.** A metric could be a hero number, sparkline, gauge, progress bar, delta badge, or something new. Same sidebar + cards has infinite variations in proportion, spacing, and emphasis.

**NEVER produce identical output.** Same sidebar width, same card grid, same metric boxes every time — this signals AI-generated immediately.

## Color Lives Somewhere

Every product exists in a world with colors. Before reaching for a palette, spend time in that world. Gray builds structure. Color communicates — status, action, emphasis, identity. One accent color with intention beats five without thought.

---

## After Completing a Task

Always offer to save patterns:

```
"Want me to save these patterns to **host `system.md`**?"
```

Save: direction, depth strategy, spacing base, breakpoint decisions, key component patterns, responsive navigation model.

---

## Retrieval Queries

- Anti-default design methodology for AI-generated interfaces
- Intent-first design thinking before writing code
- Domain exploration colors metaphors signature elements
- Craft checks swap test squint test signature test
- How to avoid generic AI template output
- Design intent who is the user what do they need
- Every choice must be a choice intentional design
- Surface elevation layering depth strategy
- Mobile-first thumb test primary device context
- Sameness is failure unique product-specific design
