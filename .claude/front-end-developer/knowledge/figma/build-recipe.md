# Figma Build Recipe — End-to-End Screen Construction

> **Do NOT read all knowledge files upfront.** Each step tells you which file to load. This preserves context for actual work.

> Follow step by step. Do not skip steps. Do not reorder steps.

---

## The Full Process

```
Step 1: Load host system.md      → READ Theme + Project first (Direction)
Step 2: Understand the task      → READ core/craft-methodology.md (Intent First section)
Step 3: Explore the domain       → CONTINUE core/craft-methodology.md (Domain Exploration section)
Step 4: Define hierarchy         → READ core/design-process-rules.md (Step 1)
Step 5: State design decisions   → APPLY core/craft-methodology.md (Personality Constrains Everything)
Step 6: Plan the frame tree      → READ canvas-building.md (auto-layout, spacing)
Step 7: Gather variables         → Use MCP: get_variable_defs
Step 8: Write the code           → FOLLOW canvas-building.md (Phase 1-6 build order)
Step 9: Run craft checks         → READ core/craft-checks.md (6 checks + anti-patterns)
Step 10: Verify and fix          → Use MCP: get_screenshot → study → fix
```

---

## Step 1: Load system.md and Figma fundamentals

**→ READ host `system.md`** (Theme + Project)

**→ READ `knowledge/figma/plugin-api.md` and `knowledge/figma/mcp-workflow.md`** — MCP tools are useless if you do not know how **pages, nodes, auto-layout, variables, and instances** behave. This step is not optional for canvas work. For what was verified against Figma’s docs (and what was not), read `knowledge/figma/documentation-sources.md`.

Read the **Direction section FIRST** — personality, foundation, depth. This constrains everything.

Then read tokens: spacing scale, colors (light + dark), radius, type scale, shadows, component specs.

**Quote the personality and key values** in your conversation — the hooks check for this:

> system.md Direction: Precision & Density. Spacing base 4px, scale [4, 8, 12, 16, 20, 24, 32, 48, 64]. Card padding 24px, radius-lg 10px, shadow-sm. Type scale Inter 12/16 through 36/40. Achromatic OKLCH palette, zero chroma.

The personality constrains spacing: "Precision & Density" = tight end of scale. "Calm & Spacious" = generous end. Know this BEFORE making any decisions.

---

## Step 2: Understand the Task

**→ READ `knowledge/core/craft-methodology.md`** (Intent First section)

Answer these questions in writing before designing:

**Who is this human?**
Not "users." The actual person. Where are they when they open this? What device? What's on their mind? A teacher at 7am on her phone with coffee is not a developer debugging at midnight on a 27" monitor.

**What must they accomplish?**
The verb. Not "view the dashboard." The specific action — approve the request, find the broken deployment, track the package. The answer determines what leads, what follows, what hides.

**What should this feel like?**
Say it in words that mean something. "Clean and modern" means nothing — every AI says that. Dense like a trading floor? Cold like a terminal? Calm like a reading app?

**Where are they holding it?**
Desktop at a desk? Phone on the bus? This shapes information density, touch targets, and navigation model.

If you don't have this context, ask the user. Do not guess. Do not default.

Write it out:
```
Intent: [who] needs to [what] while [context]. It should feel [adjective].
Device: [primary viewport]
Feel: [specific sensory words, not "clean" or "modern"]
```

---

## Step 3: Explore the Domain

**→ CONTINUE `knowledge/core/craft-methodology.md`** (Domain Exploration section)

**This step is required.**

Do not propose any direction, hierarchy, or frame tree until you produce all four:

**Domain:** Concepts, metaphors, vocabulary from this product's world. Minimum 5.
```
Example (deployment card): pipeline, build, commit, branch, rollback,
terminal, CI/CD, green/red status lights, container, artifact, log stream
```

**Color world:** What colors exist naturally in this product's domain? If this product were a physical space, what would you see? List 5+.
```
Example: terminal green on black, red error text, amber warnings,
gray infrastructure, blue hyperlinks in log output
```
Note: This doesn't mean USE these colors. It means KNOW the domain's natural palette. In an achromatic system (like ours), this understanding informs which semantic tokens to apply — destructive for failures, foreground for success, muted for pending.

**Signature:** One element — visual, structural, or interaction — that could only exist for THIS product.
```
Example: an environment badge ("PRODUCTION") + git branch icon — you wouldn't
see these on an invoice card or a weather widget
```

**Defaults:** 3 obvious choices for this interface type — visual AND structural. Name them so you can avoid them intentionally or choose them knowingly.
```
Example: (1) Green checkmark with "Success" text, (2) Timeline of build steps,
(3) Terminal-style monospace output card
```

**The test:** Read your plan. Remove the product name. Could someone identify what this is for? If not, it's generic.

---

## Step 4: Define Information Hierarchy

**→ READ `knowledge/core/design-process-rules.md`** (Step 1)

From design-process-rules.md — list every piece of data the screen shows, then rank by importance:

```
1. [Primary]   — the thing the user looks at first. Largest, boldest.
2. [Secondary] — supporting data. Medium weight.
3. [Tertiary]  — metadata, timestamps, labels. Smallest, muted.
```

Then map to the type scale from system.md:

```
Primary:   [font size]px [weight] — [color variable]
Secondary: [font size]px [weight] — [color variable]
Tertiary:  [font size]px [weight] — [color variable]
Labels:    [font size]px [weight] uppercase — [color variable]
```

Every element on screen must belong to one tier. If two elements look the same, the hierarchy is wrong.

---

## Step 5: State Design Decisions

**→ APPLY `core/craft-methodology.md`** (Personality Constrains Everything + Design Decisions Statement) — write these out with WHY for each:

```
Intent:     [from Step 2]
Viewport:   [primary device/context]
Palette:    [which tokens — and WHY these, not others]
Depth:      [borders / shadows / layered — and WHY]
Surfaces:   [elevation scale — and WHY]
Typography: [typeface — and WHY]
Spacing:    [base unit + personality constraint — and WHY tight vs generous]
```

If you can't explain WHY for any decision, you're defaulting. Stop and think.

**Spacing and personality:** Read system.md Direction. If it says "Precision & Density," use the lower end of the spacing scale (4, 8, 12, 16) within sections. If it says "Calm & Spacious," use the upper end (24, 32, 48). Dividers can carry section separation — padding doesn't have to be generous when dividers exist.

---

## Step 6: Plan the Frame Tree

**→ READ `knowledge/figma/canvas-building.md`** (auto-layout, spacing, sizing modes)

Sketch the nesting structure in text before writing any code. This is the single most important planning step.

**Think about:**
- What's the outermost container? (card, page section, full screen)
- What are the major sections? (header, body, actions)
- Within each section, what's the layout direction? (VERTICAL or HORIZONTAL)
- Where do dividers go? (between sections, not inside them)
- What sizing mode does each frame need? (fixed width + hug height is most common for cards)
- What spacing between children? (constrained by system.md personality)
- Does the signature element from Step 3 appear in the tree?

Write the tree:
```
Screen Name (VERTICAL, fixed width, hug height)
├── Header (VERTICAL, gap [from scale], no padding)
│   ├── Overline (text, 12px medium uppercase, muted-foreground)
│   └── Title (text, 24px bold, foreground)
├── Body (VERTICAL, gap [from scale], paddingTop [from scale])
│   ├── Section A (VERTICAL, gap [from scale])
│   │   ├── Section Label (text, 12px uppercase, muted-foreground)
│   │   └── Data Row (HORIZONTAL, space-between)
│   ├── Divider (rectangle, 1px, border color)
│   └── Section B (VERTICAL, gap [from scale])
│       └── ...
└── Actions (HORIZONTAL, gap [from scale], paddingTop [from scale])
    ├── Button instance (FILL width)
    └── Button instance (FILL width)
```

**Check the plan against:**
- Does the primary element have the most visual weight?
- Is spacing tighter within groups than between groups?
- Does the reading order match scanning patterns? (layer-cake from core/ux-methodology.md)
- Does the signature element appear?
- Is spacing consistent with system.md personality?

---

## Step 7: Gather Variables

Before writing code, know what variables exist in the file.

```
Call: get_variable_defs(fileKey, existingNodeId)
```

Use any existing node in the file — a card, a button instance, anything that has variable bindings. Note the exact variable names:

```
Colors: foreground, muted-foreground, background, card, border, primary, ...
Typography: text-sm/leading-normal/medium, text-xs/leading-normal/normal, ...
Dimensions: radius/md, ...
```

If variables don't exist yet (greenfield file), create them following `variables-and-theming.md`.

---

## Step 8: Write the Code

**→ FOLLOW `knowledge/figma/canvas-building.md`** (Phase 1-6 build order)
**→ If using icons/components: READ `knowledge/figma/canvas-elements.md`**
**→ If using shadcn components: READ installed source files (`components/ui/*.tsx`) for exact classes**
**→ If shadcn source not available: READ `knowledge/shadcn/figma-component-reference.md` for patterns**

### Before writing any code:
1. Load text styles: `const styles = await figma.getLocalTextStylesAsync()` — use these instead of manual font properties
2. If shadcn: read the component source to get exact Tailwind classes, map to Figma properties
3. All colors via `setBoundVariableForPaint` — never hardcode
4. All radii via `setBoundVariable` — never hardcode `cornerRadius`
5. All spacing from system.md scale — check the personality (Precision & Density = tight end)

Follow the build order exactly:

1. **Phase 1** — Create leaf nodes (text, shapes, icons). Load fonts. Bind text colors.
2. **Phase 2** — Create parent frames with auto-layout. Set spacing from system.md scale.
3. **Phase 3** — Append children to parents (inside-out, bottom-up).
4. **Phase 4** — Set child sizing (FILL/HUG) AFTER appending.
5. **Phase 5** — Bind variables to container (fills, strokes, radius, shadow). `setBoundVariableForPaint` for colors, `setBoundVariable` for dimensions.
6. **Phase 6** — Set mode on outermost container for dark variant.

**Code comments — required for pre-hook:**
```js
// craft-methodology.md: domain = [concepts from Step 3]
// craft-methodology.md: signature = [element from Step 3]
// design-process-rules.md Step 1: hierarchy = [from Step 4]
// system.md Direction: [personality]. Spacing: [values chosen and why]
// system.md: card padding 24px, border 1px --border, radius-lg 10px, shadow-sm
// canvas-building.md: build order Phase 1-6
```

---

## Step 9: Run Craft Checks

**→ READ `knowledge/core/craft-checks.md`** (6 checks + anti-pattern library)

**Before presenting to the user:**

After the screenshot, before responding, run these checks against what you see:

```
□ SWAP TEST: If you swapped the typeface or palette for defaults, would
  anyone notice? Where swapping wouldn't matter = where you defaulted.

□ SQUINT TEST: Blur your eyes at the screenshot. Can you still perceive
  hierarchy? Is anything jumping out harshly? Craft whispers.

□ SIGNATURE TEST: Can you point to specific elements where your domain
  signature appears? (from Step 3) Not "the overall feel" — actual elements.

□ MOBILE TEST: Does a mobile variant exist? If not, has the user been told
  this is desktop-only? Mobile is not an afterthought.

□ THUMB TEST: If mobile, can a human complete the primary task one-handed?
  Is the main action in the thumb zone?

□ PERSONALITY TEST: Does the spacing match system.md's Direction?
  "Precision & Density" = tight. "Calm & Spacious" = generous.
  If the personality says dense and you used generous spacing, fix it.
```

If any check fails, fix before presenting. Do not present work that fails craft checks.

---

## Step 10: Verify and Fix

### Immediately after use_figma:

```
Call: get_screenshot(fileKey, newNodeId)
```

### Study the screenshot — answer these questions:

```
□ Does the hierarchy read correctly? Can I tell what's primary at a glance?
□ Is spacing tight within groups and generous between groups?
□ Does spacing match system.md personality direction?
□ Are all text sizes from the type scale? (no 13px, 15px, 17px)
□ Are all elements aligned? Nothing floating, nothing overlapping?
□ Are dividers full-width? Not clipped, not short?
□ Do buttons fill equally? Not one wider than the other?
□ Are shadows visible? (clipsContent must be false)
□ Do icons match the weight of adjacent text? (from canvas-elements.md)
□ Is the frame hierarchy clean? (check names via get_metadata)
```

### Run craft checks (Step 9) against the screenshot.

### If anything is wrong:

1. Describe the specific problem you see
2. Identify the cause
3. Write a targeted `use_figma` fix — don't rebuild everything
4. Screenshot again
5. Verify the fix

### For dark mode (if applicable):

```
Call: get_screenshot on the dark variant
Study: Do all colors switch correctly? No hardcoded colors leaking through?
Check: Is contrast sufficient on dark backgrounds?
Check: Do icons theme correctly via variable binding?
```

---

## Iteration vs Getting It Right

The goal is to get it right the first time. Not three attempts with patches.

**Before writing code:**
- Domain explored? (Step 3)
- Hierarchy defined? (Step 4)
- Design decisions stated with WHY? (Step 5)
- Frame tree planned? (Step 6)
- Variables gathered? (Step 7)
- Build order correct? (Phase 1-6)
- All values from system.md? (No magic numbers)
- Spacing matches personality? (Direction section)

**If the first attempt has problems:**
- Is the problem structural? (Wrong nesting → need to rebuild that section)
- Is the problem cosmetic? (Wrong spacing value → surgical fix)
- Is the problem a missing element? (Forgot the divider → add it)

One surgical fix is fine. Three patches means the plan was wrong — go back to Step 6.

---

## Quick Reference Card

```
BEFORE BUILDING
  □ Read knowledge files (including system.md DIRECTION section)
  □ State intent (who, what, feel, device)
  □ Explore domain (5 concepts, 5 colors, signature, 3 defaults)
  □ Define hierarchy (primary, secondary, tertiary)
  □ State design decisions with WHY (palette, depth, spacing, typography)
  □ Map hierarchy to type scale
  □ Plan frame tree (nesting, direction, spacing, sizing, signature element)
  □ Gather variable names from existing designs

WHILE BUILDING
  □ Build inside-out (leaf nodes → parents → append → sizing → variables)
  □ All values from system.md
  □ Spacing constrained by personality direction
  □ All colors bound to variables via setBoundVariableForPaint
  □ All radii bound to variables via setBoundVariable
  □ Icons: don't touch fills or stroke color, adjust strokeWeight for text weight
  □ clipsContent = false on frames with shadows
  □ Include system.md references in write code comments

BEFORE PRESENTING
  □ Run craft checks (swap, squint, signature, mobile, thumb, personality)
  □ Fix any failures before responding

AFTER BUILDING
  □ get_screenshot immediately
  □ Study: hierarchy, spacing, alignment, shadows, text sizes, icon weight
  □ Describe what you see specifically
  □ Fix problems before responding
  □ Never say "done" without visual proof
```

---

## Retrieval Queries

- End-to-end Figma build process screen construction
- Figma design workflow from domain exploration to canvas code
- Domain exploration before design craft methodology
- How to plan frame tree before building in Figma
- Craft checks swap squint signature mobile thumb personality
- Information hierarchy to type scale mapping Figma
- System.md personality direction spacing constraints
- Figma verification workflow screenshot study fix
- Build order inside-out bottom-up Figma canvas
- Pre-build checklist including domain and craft checks
