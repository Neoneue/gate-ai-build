# Design Process Rules

> **Reading order:** `craft-methodology.md` → This file (2/4) → `design-recipes.md` → `pre-ship-quality-checklist.md`

**Keywords:** Design Process Rules Workflow Steps Methodology Systematic Seven-Step UI UX Information-Hierarchy Typographic-Hierarchy Validation Audit Design-Thinking Process-Framework
## What This File Is
This is the 7-step design process workflow — a mandatory systematic methodology applied before **writing UI code** or **building the same UI structure on Figma/Paper** (frames, auto-layout, tokens). Steps: (1) define purpose, (2) rank data by importance (information hierarchy), (3) assign type size/weight/color per tier (typographic hierarchy), (4) choose grid/spacing/breakpoints (layout), (5) implement using semantic tokens (CSS/Tailwind on web; **Figma variables + text styles** on canvas — see `knowledge/figma/` and `knowledge/shadcn/figma-theming.md`), (6) screenshot + audit with /rams (or `get_screenshot` for Figma/Paper), (7) fix then present. This is a process checklist, not design theory.

> **Figma:** You cannot skip steps 1–4 and “draw” your way to quality. The canvas needs the same decisions encoded as **nodes and variables**. Learn the document model in `knowledge/figma/plugin-api.md` first.

> These are non-negotiable. Every UI task follows this process. No exceptions.

## The Problem (February 2026)

We have all the design knowledge — grid systems, typography scales, composition principles, Vercel guidelines, Material/iOS standards. But we skip straight to code and iterate reactively. This produces garbage because:

1. We never decide information hierarchy before coding
2. We never plan the layout on a grid before coding
3. We treat every page as separate instead of part of a system
4. We add decorative elements without meaning
5. We can't see our own output, so we ship broken layouts without noticing

## The Process

### Step 1: Define Information Hierarchy

Before ANY implementation (code or canvas), answer these questions in writing:

- **What is this page for?** (one sentence)
- **What data does it show?** (list every piece of data)
- **Rank the data by importance.** What does the user look at first? Second? Third? What's supporting context?
- **What is NOT important?** What can be de-emphasized or removed?

Write it as a numbered list:
```
1. [Primary] Agent name — identity, the thing that differentiates each card
2. [Secondary] Stats (files, chunks, bridges) — the quantitative data
3. [Tertiary] Domain tags — supporting context, what domains they cover
```

This hierarchy directly maps to the type scale. Primary = largest/boldest. Tertiary = smallest/lightest. No exceptions.

### Step 2: Choose the Grid

- Use a **12-column grid** (or whatever grid system the project uses)
- Decide column spans: 3-up, 2-up, full-width
- Every page in the app uses the same grid. Not different grids per page.
- Decide max-width. One value for the app, not per-page.

### Step 3: Define the Type Scale

Pick sizes from the project's type scale and assign them. Write it down:
```
Page title:    20px semibold
Card title:    14px semibold
Data numbers:  18px bold monospace
Labels:        12px muted color
Tags:          12px monospace
```

The scale must have **clear contrast between levels**. If two levels look the same, the hierarchy fails.

**Floor: 12px.** Nothing smaller. Ever.

### Step 4: Define Spacing

Use a consistent spacing scale (8pt grid is common). All spacing values are multiples of 4 or 8:
- 8px, 16px, 24px, 32px

Decide these once for the whole app:
- Page padding: 32px
- Card padding: 20px or 24px
- Grid gap: 16px or 24px
- Internal spacing between sections: 16px or 20px

### Step 5: Plan the Card/Component

Sketch the internal layout in text:
```
┌──────────────────────────┐
│ [icon] Agent Name        │  ← tier 1: identity
│                          │
│  97      390      271    │  ← tier 2: data (largest)
│  files   chunks   bridges│
│                          │
│  [tag] [tag] [tag]       │  ← tier 3: context (smallest)
└──────────────────────────┘
```

Check: Does the visual weight match the hierarchy? Is tier 1 the most prominent? Is tier 3 the quietest?

### Step 6: Check for Meaningless Decoration

Before shipping, audit every visual element:
- **Progress bars** — what's the max? what's the context? If there's no meaningful denominator, delete it.
- **Gradients/glows** — do they communicate something or just look "cool"?
- **Color accents** — do they encode data or identity, or are they random?
- **Borders/dividers** — does whitespace alone create the separation? If yes, remove the line.

Rule: **If you can't explain what a visual element communicates, delete it.**

### Step 7: Self-Review the Screenshot

After coding, take a screenshot and check:
- [ ] Does the hierarchy read correctly? (Can you tell what's most important at a glance?)
- [ ] Is there dead space that serves no purpose?
- [ ] Are all cards/rows aligned to the grid?
- [ ] Does text meet the minimum size (12px)?
- [ ] Does it look like the same app as the other pages?
- [ ] Would a designer be embarrassed by this?

## Common Mistakes to Avoid

- **`auto-rows-fr` + `flex-1`** — stretches cards to fill viewport, creates dead space voids
- **`mt-auto`** — pushes content to bottom, leaves middle empty
- **Different padding per page** — breaks the system, pages don't feel unified
- **Decorative progress bars** — bars need a meaningful denominator
- **Hero/featured treatment** — unless there's a real reason, all items get equal weight
- **Cramming data into `text-[10px]`** — if it's worth showing, it's worth reading at 12px+

## Applying the Process to Common UI Patterns

### Dashboard / Data Overview

Dashboards are where most hierarchy failures happen. Everything feels "equally important" so everything gets the same size.

**Fix: Force-rank by user task.** A monitoring dashboard exists so someone can spot anomalies fast. That means:
1. Primary: The numbers that change (KPIs, status indicators)
2. Secondary: Trend context (sparklines, deltas, percentages)
3. Tertiary: Labels, timestamps, metadata

```
Hierarchy mapping:
  KPI value:     30px bold tabular-nums
  Delta/change:  14px medium + semantic color (green/red)
  KPI label:     12px muted uppercase tracking-wide
  Timestamp:     12px muted
```

**Grid strategy:** 4-up on desktop, 2-up on tablet, 1-up on mobile. KPI cards min-width ~200px — cramped numbers kill readability.

### Settings / Form Pages

Settings pages have a different hierarchy problem: walls of equally-weighted form fields.

**Fix: Group by task frequency.** Things users change often go first and get more space. Rarely-touched settings go in collapsible sections or secondary tabs.

```
1. [Primary] Section heading — what category is this?
2. [Secondary] Field label + current value — what can I change?
3. [Tertiary] Help text, validation messages — context on demand
```

**Layout:** Single-column for forms, always. Max-width 512px. Labels above inputs, not beside (better for mobile, better for scanning). Group related fields with 24px between groups, 16px within.

### List / Table Views

Tables seem straightforward but often fail on column priority.

**Fix: Decide the scan column.** When someone's eyes hit the table, which column do they scan? That column gets medium weight, left alignment, and the most width. Secondary columns get muted color. Action columns stay narrow and right-aligned.

```
┌─────────────────────────────────────────────────────┐
│ Name ▾           Status      Last Active   Actions  │
│ ─────────────────────────────────────────────────── │
│ pixel-ronin      ● Online    2m ago        ⋯       │ ← name is scan column
│ pipe-wraith      ○ Idle      15m ago       ⋯       │
│ null-prophet     ● Online    1m ago        ⋯       │
└─────────────────────────────────────────────────────┘

Name:        medium weight, primary color (scan column)
Status:      14px + colored dot indicator
Last Active: 14px muted color
Actions:     icon-only, right-aligned
```

**Responsive table strategy:** Below `md`, switch to card layout. Don't horizontal-scroll tables — it's a capitulation, not a solution.

### Empty / Error / Loading States

These are part of the design, not afterthoughts. Apply the same hierarchy:

```
Empty state:
1. [Primary] What's missing — "No agents configured"
2. [Secondary] What to do — "Add your first agent to get started"
3. [Tertiary] Action — a single CTA button

Error state:
1. [Primary] What went wrong — plain language, no codes
2. [Secondary] What to try — specific next step
3. [Tertiary] Details — expandable technical info for debugging
```

Skeleton loaders should match the real layout exactly. If your skeleton doesn't look like the loaded state, the hierarchy is wrong.

## The Process at Different Scales

### Single Component

Steps 1-5 compress into a mental checklist. But still write the hierarchy: "In this card, the title matters most, the metric second, the label third." 15 seconds of thought prevents 15 minutes of iteration.

### Full Page

All 7 steps, written out. The page is a composition — elements compete for attention. Without explicit hierarchy, the loudest element wins (usually the wrong one).

### Multi-Page System

Add a Step 0: **System Inventory.** Before designing page N, document the decisions from pages 1 through N-1:
- What's the global max-width?
- What's the consistent page padding?
- What's the nav/sidebar width?
- What type scale tokens are already in use?
- What's the card style (border? shadow? background?)?

**New pages inherit the system.** If page 3 needs a different card style, that's a red flag — either the system is wrong or the page is wrong.

### Design Tokens as System Memory

Once you've made decisions, encode them so you don't re-decide:

```
spacing decisions, made once:
  page-padding: 32px
  card-padding: 20px
  section-gap: 24px
  grid-gap: 16px

type hierarchy, made once:
  page-title: 20px semibold
  section: 16px semibold
  body: 14px regular
  caption: 12px regular
```

How you encode these depends on the project's stack — CSS variables, Tailwind classes, theme objects, design tokens. The point is: these values are decided at system level, not per-component.

## Process Anti-Patterns

### "I'll Fix It in Review"

No you won't. Review catches 20% of issues. The other 80% are hierarchy failures that feel "slightly off" but nobody can articulate. Do the hierarchy step first or accept mediocre output.

### "Let Me Just Try Something"

Exploration has its place — in a design tool or prototype, not in production code. The 7-step process IS the exploration, compressed into deliberate decisions. "Trying something" without hierarchy is just typing and hoping.

### "It Looks Good on My Screen"

The screenshot step exists because we can't render the page in our heads. But one screenshot isn't enough:
- Check at `1440px` (desktop)
- Check at `768px` (tablet)
- Check at `375px` (mobile)
- Check with long text content (names, descriptions overflow)
- Check with minimal content (does it still hold together?)

### "I'll Make It Responsive Later"

Responsive is not a phase — it's a constraint that shapes the design from step 2 (grid). If your desktop layout needs 4 equal columns but the data doesn't group into 2×2 on tablet, the grid choice is wrong. Decide breakpoint behavior during layout planning, not after coding.

### "The Design System Will Handle It"

Design systems handle consistency, not hierarchy. Your component library gives you a Card component, but it doesn't tell you what goes in tier 1 vs tier 3. Tokens give you a "muted" color, but they don't tell you which elements get it. The process happens before you reach for components.

## Quick-Reference Checklist

Print this, tape it to the wall, tattoo it on your forearm:

```
□ 1. What is this for? (one sentence)
□ 2. What data, ranked? (numbered list)
□ 3. What type size/weight/color per rank?
□ 4. What grid, spacing, breakpoints?
□ 5. Code it (tokens, not magic numbers)
□ 6. Screenshot + /rams audit
□ 7. Fix, then ship
```

If you're about to skip a step: don't. The process is 5 minutes. Fixing the result of skipping it is 50.

## Dark Mode

Dark mode is a token problem, not a filter. "Invert the colors" produces garbage. Treat it as a parallel design that shares structure but has its own palette decisions.

### Token Strategy

Don't invert. Map semantic tokens to a second set of values:

```
                     Light           Dark
──────────────────────────────────────────────
background           white           gray-950 (not pure black)
surface              gray-50         gray-900
surface-raised       white           gray-850
border               gray-200        gray-800
text-primary         gray-900        gray-50
text-muted           gray-500        gray-400
```

**Why not pure black (#000)?** Pure black on OLED creates a "floating text" effect — no perceived depth. Use gray-950 (`#0a0a0a` to `#111`) for backgrounds. Vercel, Linear, GitHub all do this.

### Implementation

- Use `prefers-color-scheme: dark` media query as the default detection.
- Support manual override via a toggle that writes to `localStorage` and sets a `data-theme` attribute on `<html>`.
- Load preference before paint — read `localStorage` in a blocking `<script>` in `<head>` to prevent flash of wrong theme (FOWT).
- CSS: use `color-scheme: light dark` on `:root` to let the browser adapt scrollbars, form controls, and system UI.
- Set `<meta name="theme-color">` per mode — changes the browser chrome/status bar color.

```
Preference resolution order:
1. localStorage override (user explicitly chose)
2. prefers-color-scheme (system setting)
3. Light (default fallback)
```

### Dark Mode Adjustments

Things that need manual attention beyond token swaps:

- **Shadows:** Reduce or remove. Shadows are invisible on dark backgrounds — use subtle border or lighter surface instead of elevation.
- **Images:** Add a subtle dark overlay or reduce brightness/contrast. Bright images on dark backgrounds are blinding.
- **Icons:** If using colored icons, check contrast on dark surfaces. Monochrome icons in `currentColor` adapt automatically.
- **Borders:** Light mode uses gray-200 borders that disappear on dark. Use gray-700/800 — visible but subtle.
- **Saturated colors:** Reduce saturation slightly for primary/accent colors on dark backgrounds. Full-saturation blue on near-black vibrates.
- **Code blocks:** Use a dedicated dark syntax theme (not inverted light theme).
- **Gradients:** Re-tune. A light gradient that works on white will look muddy on dark.

### Testing Checklist

```
□ No pure black backgrounds (#000)
□ Text contrast still meets WCAG AA (4.5:1) on dark surfaces
□ Borders are visible (not same shade as background)
□ Images don't blind on dark backgrounds
□ Shadows replaced with borders/surface changes where invisible
□ Focus rings visible on dark backgrounds
□ Form inputs have clear boundaries (not just background color)
□ No flash of wrong theme on page load
□ Toggle persists across sessions (localStorage)
□ System preference respected when no manual override
```

---

## Responsive Design: Beyond Breakpoints

Mobile-first is assumed. This section covers the patterns that actually make responsive work feel designed rather than squeezed.

### Fluid Typography

Don't jump between fixed sizes at breakpoints. Use `clamp()` for smooth scaling:

```css
/* Heading: 24px at 375px → 36px at 1440px */
font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem);

/* Body: stays 16px (don't fluid-scale body text — readability suffers) */
font-size: 1rem;
```

**Rules:**
- Fluid scale headings and display text only.
- Body text (14–16px) stays fixed — fluid body text creates readability problems at mid-widths.
- Set `min` to mobile size, `max` to desktop size. The `preferred` value (`vi` units + rem) handles the middle.
- Use `rem` not `px` in clamp — respects user font-size preferences.

### Container Queries

Breakpoints based on viewport width break when components live in different-width containers (sidebar vs main content vs modal). Container queries fix this:

```css
.card-grid {
  container-type: inline-size;
}

@container (min-width: 600px) {
  .card { grid-column: span 2; }
}

@container (min-width: 900px) {
  .card { grid-column: span 3; }
}
```

**When to use container queries vs media queries:**
- **Media queries:** Page-level layout changes (sidebar collapse, header transformation, overall grid).
- **Container queries:** Component-level adaptation (card layout, table density, form arrangement). Use these for any component that could appear in multiple container widths.

### Adaptive Layout Triggers

Specific patterns for when components should transform:

| Component | Trigger | Desktop | Mobile |
|-----------|---------|---------|--------|
| Sidebar | `<768px` viewport | 240px fixed sidebar | Hidden + hamburger menu or bottom sheet |
| Data table | `<640px` container | Full table with columns | Card layout (each row becomes a card) |
| Stats row | `<480px` container | 4-column grid | 2-column grid, then stack |
| Navigation | `>5 items at <768px` | Horizontal tab bar | Bottom navigation (max 5) or hamburger |
| Form | Always | Single column 512px | Single column full-width, 16px padding |
| Modal | `<640px` viewport | Centered dialog | Bottom sheet (slides from bottom) |
| Side-by-side | `<768px` container | Two panels | Stacked, or tabbed if content is long |
| Image + text | `<600px` container | Horizontal (image left, text right) | Stacked (image top, text below) |

### Spacing That Scales

Use smaller spacing on mobile, not the same values compressed:

```
                Desktop     Mobile
─────────────────────────────────────
Page padding    32px        16px
Card padding    24px        16px
Section gap     24px        16px
Grid gap        16px        12px
```

Implement with CSS custom properties + media query, or Tailwind's responsive prefixes (`p-4 md:p-6 lg:p-8`).

### Touch Adaptation

- Touch targets: 44×44px minimum (already in web-design-guidelines, but enforce it during layout — a 32px desktop button needs padding expansion on touch).
- Hover states: don't rely on them. Every hover interaction needs a tap equivalent.
- Swipe: use for secondary actions only (swipe-to-delete, swipe-to-archive). Primary actions always have a visible button.
- Bottom sheet > modal on mobile. Easier to reach, easier to dismiss.
- Sticky action bars: on mobile, primary actions (Save, Submit) should be sticky at the bottom of the viewport — thumbs live there.

### Responsive Testing Checklist

```
□ Fluid type renders correctly at 375px, 768px, 1440px
□ No horizontal scroll at any width
□ Touch targets meet 44×44px minimum
□ Tables transform to cards (not horizontal scroll)
□ Sidebar collapses with accessible toggle
□ Modals become bottom sheets on mobile
□ Spacing reduces on smaller screens (not same values squeezed)
□ Images use srcset or responsive sizing (not fixed-width overflow)
□ Text doesn't overflow containers (long words, URLs)
□ Sticky elements don't overlap each other on small screens
□ Container queries used for reusable components in varied contexts
```

---

## Sources

- Grid Systems in Graphic Design — Josef Müller-Brockmann
- Vercel Web Interface Guidelines — https://vercel.com/design/guidelines
- NN/g "Good from Afar, But Far from Good" — https://www.nngroup.com/articles/ai-prototyping/
- "Why CSS Is So Hard for Generative AIs" — https://dev.to/asafaeirad/why-css-is-so-hard-for-generative-ais-to-understand-17fo
- Direct design review feedback, February 2026

## Retrieval Queries

- Design process rules and workflow best practices
- How to structure a design process for consistent results
- Rules and principles for efficient design work
- Design workflow: from brief to delivery
- How to maintain quality throughout the design process
- Design process discipline: constraints, iteration, and refinement
- Rules for designers to follow for better output
- How to establish a repeatable, high-quality design process
- Dark mode implementation tokens theming color-scheme
- Dark mode testing checklist shadows images contrast
- Responsive design fluid typography clamp container queries
- Adaptive layout triggers sidebar collapse table card mobile
- Touch targets bottom sheet mobile responsive spacing
- Container queries vs media queries component adaptation
