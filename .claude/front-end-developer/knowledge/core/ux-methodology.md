# UX Methodology — How to Think About User Experience

> **Reading order:** `craft-methodology.md` → `craft-checks.md` → `design-process-rules.md` → This file → `ux-laws.md` → `design-recipes.md` → `pre-ship-quality-checklist.md`

> This file teaches HOW to reason about UX decisions. For specific rules and checks, use **`skills/web-design-guidelines/SKILL.md`** (Vercel Web Interface Guidelines) and **`knowledge/core/web-interface-guidelines.md`** (full canonical reference). For the 30 named Laws of UX (Similarity, Von Restorff, Tesler, Jakob, Fitts, etc.) with definitions, use-it-when guidance, anti-patterns, and a 5-question pre-flight checklist, use **`knowledge/core/ux-laws.md`**. This file is the thinking framework; those are the lookup tables.

---

## Before Any UX Decision

These principles apply to **live products, Figma mocks, and Paper artboards**. Scanning, touch targets, and feedback still matter when the deliverable is a static canvas — reviewers and handoff readers experience the same layout.

Query the existing skills:

1. **Identify the category** — Is this about layout, touch, navigation, animation, accessibility, interaction, or content?
2. **Search ux-guidelines.csv** for that category — it has Do/Don't/Severity for 99 common issues
3. **Apply the principle below** to reason about edge cases the rules don't cover
4. **Apply web-design-guidelines while implementing** (methodology) — surface accessibility and UX implications before shipping, not only in a final audit

Never make a UX decision from instinct alone. Check the data first, then reason from principles.

---

## Core Principles

### 1. Cognitive Load — The Invisible Cost

Every element on screen costs the user mental effort. The total cost determines whether the interface feels simple or overwhelming.

**Three types of cognitive load:**
- **Intrinsic** — complexity inherent to the task (filing taxes is harder than checking weather). You can't reduce this.
- **Extraneous** — complexity added by bad design (confusing labels, inconsistent patterns, unclear hierarchy). Eliminate this.
- **Germane** — effort spent learning the system (where things are, how it works). Minimize this through consistency.

**How to apply:**
- Before adding any element, ask: "Does this reduce or increase the user's mental effort?"
- Group related items — the brain processes groups faster than individual items (Miller's Law: 7±2 chunks)
- Use familiar patterns — every novel interaction adds germane load
- Progressive disclosure — show only what's needed now, reveal complexity on demand
- Consistent patterns — if filters work one way on page A, they work the same on page B

**The divider test:** Dividers reduce cognitive load in dense views by pre-chunking information. The user's brain doesn't have to figure out where one section ends and another begins. In sparse views, dividers add visual noise (extraneous load). The question isn't "dividers yes/no" — it's "does this view need help chunking?"

### 2. Visual Scanning — How Eyes Actually Move

Users don't read interfaces. They scan.

**Scanning patterns:**
- **F-pattern** — content-heavy pages (articles, feeds). Users scan the top, then down the left edge. Put important content top-left.
- **Z-pattern** — landing pages, simple layouts. Eyes go top-left → top-right → bottom-left → bottom-right. Put CTAs at the end of the Z.
- **Layer cake** — dashboards and data views. Users scan section headers (the "cake layers") and only dive into content that seems relevant. This is why uppercase labels like "SHIPPED THIS WEEK" work — they're scannable markers.
- **Spotted pattern** — users hunting for a specific thing. They skip everything that doesn't match what they're looking for. Good labels and clear hierarchy help.

**How to apply:**
- Section headers are scanning anchors — they must be visually distinct from body content
- In data-dense views, visual chunking (dividers, background changes, spacing) speeds scanning
- The first element in each section gets disproportionate attention — make it the most important one
- Left-aligned content scans faster than centered content in data views

### 3. Fitts's Law — Size and Distance Matter

The time to reach a target is a function of its size and distance from the current position.

**How to apply:**
- Primary actions should be large and close to where the user already is
- On mobile, primary actions belong in the thumb zone (bottom center of screen)
- Destructive actions should be small and far from primary actions (prevent accidents)
- Touch targets: 44×44px minimum (query ux-guidelines.csv #22 for details)
- Adjacent interactive elements need 8px+ spacing (query ux-guidelines.csv #23)
- Infinite edges — elements at screen edges are effectively infinite size (browser menu bars exploit this). Use for persistent navigation.

### 4. Feedback — Every Action Needs a Response

Users need to know their action was received, is being processed, and succeeded or failed.

**Feedback timing:**
- **0-100ms** — feels instant. Button state changes, checkbox toggles.
- **100-300ms** — feels responsive. Hover effects, dropdown opens, transitions.
- **300ms-1s** — needs a subtle indicator. Loading spinner on a button.
- **1s-10s** — needs a clear indicator. Skeleton screens, progress bars.
- **10s+** — needs progress indication AND the ability to do other things. Background processing with notifications.

**How to apply:**
- Every interactive element needs at least 3 states: default, hover/focus, active/pressed
- Disabled elements must look obviously non-interactive (opacity + cursor change)
- **Interactive controls must reflect reality — disable when they can't act.** If a button cannot perform its action, it MUST be `disabled`. A button that does nothing when clicked is a UX bug. Every conditional action needs a `disabled` prop tied to its condition:
  - Pagination Prev/Next → disabled at page 1 / last page
  - Undo/Redo → disabled with empty history
  - Submit → disabled with invalid form
  - Delete → disabled with no selection
  - Save → disabled with no changes
  - Play/Pause → disabled with no media loaded
  - Back → disabled at root
  For every button in a build, ask: "What state does this button actually have available right now?" If the answer is "none," it must be disabled. This is a pre-ship check — verify every interactive element can actually perform its action before presenting.
- Loading states should show structure (skeletons) not just spinners
- Error states must explain what went wrong AND how to fix it
- Success states must confirm what happened AND suggest next steps
- Never let an action complete silently — even success needs acknowledgment

### 5. Recognition Over Recall

Users should recognize options rather than remember them.

**How to apply:**
- Show options instead of requiring typed input (dropdowns vs free text)
- Use icons WITH labels, not icons alone (icons are ambiguous without text)
- Recent/frequent items should be surfaced, not buried
- Search should suggest as you type, not wait for submission
- Empty states should show examples of what content looks like when populated
- Don't rely on users remembering what's behind a hamburger menu — if it's important, show it

### 6. Error Prevention — Better Than Error Messages

Preventing errors is better than helping users recover from them.

**How to apply:**
- Constrain inputs — if only numbers are valid, use a number input
- Confirm destructive actions — "Are you sure?" before delete
- Undo over confirmation — let users reverse actions instead of blocking them with modals
- Inline validation on blur — catch errors as they happen, not on submit
- Smart defaults — pre-fill with the most common choice
- Gray out unavailable options instead of hiding them (explains why something can't be done)
- Save drafts automatically — never lose user work

### 7. Consistency — Internal and External

Users bring expectations from every other app they've used.

**External consistency:**
- Follow platform conventions (iOS patterns on iOS, Material on Android, web standards on web)
- Common icons mean common things (gear = settings, magnifying glass = search, X = close)
- Standard keyboard shortcuts (Cmd+S = save, Cmd+Z = undo)
- Expected element positions (logo top-left, search top-center/right, user menu top-right)

**Internal consistency:**
- Same action = same appearance everywhere in the app
- Same spacing system, type scale, color usage across all pages
- If cards have shadows on one page, they have shadows on every page
- If primary buttons are filled, every primary button is filled — no mixing filled and outlined for the same hierarchy level

### 8. Progressive Disclosure — Reveal Complexity Gradually

Show only what's needed at each step. Reveal more as the user needs it.

**How to apply:**
- Start with the most common options, hide advanced settings behind "Advanced" or "More"
- Use accordions for content that most users won't need
- Multi-step forms instead of one overwhelming page
- Hover/click to reveal secondary actions (but ensure discoverability)
- "Show more" for long lists rather than infinite scroll or pagination for small sets
- Tooltips for explanations that most users won't need

**When NOT to use:**
- Don't hide things users need frequently — that's just inconvenience
- Don't progressively disclose critical information (pricing, errors, deadlines)
- Don't use it to make a busy page "look" simpler — if everything is needed, the page needs redesigning

### 9. Information Scent — Helping Users Predict What's Ahead

Users decide where to click based on clues about what they'll find.

**How to apply:**
- Link text should describe the destination ("View all blockers" not "Click here")
- Navigation labels should be specific ("Billing" not "Account stuff")
- Cards and list items should preview enough content to judge relevance
- Breadcrumbs show where you are AND what's above you
- Don't surprise users — the page they land on should match what the link promised

### 10. Accessibility Is UX — Not a Separate Concern

Accessible design IS good design. Every accessibility improvement helps all users.

**How to apply:**
- Color contrast: 4.5:1 minimum for text (query ux-guidelines.csv #36)
- Don't convey meaning through color alone — add icons, text, or patterns (#37)
- Keyboard navigation must work for all interactive elements (#28)
- Focus states must be visible (#28)
- Reduced motion preference must be respected (#9)
- Touch targets 44×44px minimum (#22)
- Heading hierarchy must be sequential for screen readers (#39)

---

## Decision Framework

When facing a UX decision, ask in this order:

1. **What is the user trying to do?** (Not what does the feature do — what is the user's goal?)
2. **What context are they in?** (Device, time pressure, expertise level, emotional state)
3. **What do they already know?** (Can I rely on recognition, or does this require recall?)
4. **What could go wrong?** (Can I prevent the error instead of handling it?)
5. **What feedback do they need?** (How will they know it worked?)
6. **Does this follow the pattern they expect?** (Internal AND external consistency)
7. **Am I adding or removing cognitive load?** (Every element must justify itself)

---

## Applying to Figma Design Work

Before building any component or view in Figma:

1. **State the user task** — who, what, how fast, on what device
2. **Query ux-guidelines.csv** — search the relevant categories (touch, layout, navigation, etc.)
3. **Apply the decision framework** — walk through the 7 questions above
4. **Check against design-process-rules.md** — does the hierarchy support the scanning pattern?
5. **After building, verify** — screenshot, study, check against the principles

The principles in this file answer "how to think." The skills answer "what rule applies." Use both.

---

## Retrieval Queries

- UX methodology cognitive load progressive disclosure
- How users scan interfaces F-pattern Z-pattern layer cake
- Fitts law touch targets button size placement
- Feedback timing loading states error handling
- Recognition over recall user interface design
- Error prevention inline validation smart defaults
- Consistency internal external platform conventions
- Progressive disclosure when to reveal complexity
- Information scent link labels navigation clarity
- Accessibility as UX design not separate concern
- UX decision framework user goals context feedback
