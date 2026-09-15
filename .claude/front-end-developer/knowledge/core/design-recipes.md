# Design Recipes: Common UI Patterns

> **Reading order:** `craft-methodology.md` → `design-process-rules.md` → This file (3/4) → `pre-ship-quality-checklist.md`

**Keywords:** recipe, recipes, reusable, boilerplate, starter, template, snippet, dashboard, data table, form, modal, empty state, toast, loading skeleton, patterns, foundations

> These recipes describe **structural patterns and token values** — the dimensions, spacing, timing, and hierarchy that make each pattern work. Code examples use Tailwind/React syntax for brevity, but **translate to the project's actual stack**. The pattern — not the syntax — is what matters.

> **Figma:** The same structures (shell, table, card row, form) map to **nested auto-layout frames**, component instances, and variable-bound fills — not to arbitrary rectangles. See `knowledge/shadcn/figma-component-reference.md` and `knowledge/figma/canvas-building.md`. **Paper:** Map to flex layouts in inline styles per `knowledge/paper/canvas-building.md`.

---

## Recipe 1: Dashboard Shell

The standard layout shell used by Vercel, GitHub, Linear, Stripe.

```
┌────────────────────────────────────────────────┐
│ [Logo]  [Nav]            [Search] [User Avatar] │  ← Header: 56px
├──────┬─────────────────────────────────────────┤
│      │                                          │
│ Side │     Main Content Area                    │
│ bar  │     max-width ~1400px, centered          │
│ 240  │     padding 24px                         │
│  px  │                                          │
│      │                                          │
└──────┴─────────────────────────────────────────┘
```

**Key values:**
- Sidebar: 240px (Vercel, GitHub, Linear standard)
- Header: 56px — fits logo + nav comfortably
- Content padding: 24px
- Border-based separation (not shadows) — modern approach
- Backdrop blur header — Apple-inspired polish
- Mobile: sidebar collapses to hamburger/sheet

---

## Recipe 2: Data Table

Enterprise standard. Used by every admin dashboard.

**Key values:**
- Row height: ~44px (12px vertical padding + content) — meets touch target minimum
- Text: 14px for data, 12px for column headers
- Column headers: uppercase + wider letter-spacing + muted color
- Hover: 150ms transition on row background
- Container: rounded corners + border (not shadow)
- Mobile: switch to card layout, don't horizontal-scroll

---

## Recipe 3: Stats Card Row

The KPI display at the top of every dashboard.

**Key values:**
- Label: 12px + muted color
- Value: 24px + semibold + tight tracking — large enough to scan
- Change indicator: 12px + semantic color (green positive, red negative)
- Card: 16px padding + rounded corners + border
- Grid: 4 columns desktop, 2 tablet, 1 mobile
- KPI cards: min-width ~200px — cramped numbers kill readability

---

## Recipe 4: Form

Standard form layout. Used everywhere.

**Key values:**
- Input height: 36px — between Ant's 32px and 40px
- Spacing between fields: 16px
- Label-to-input gap: 6px — tight, clear association
- Input radius: 6px
- Focus ring: 2px ring on focus-visible — accessibility essential
- Button: same height as inputs (visual alignment)
- Helper text: 12px + muted color
- Form max-width: ~512px. Single column. Labels above inputs.

---

## Recipe 5: Modal / Dialog

Standard dialog overlay.

**Key values:**
- Backdrop: black at 50% opacity + subtle blur
- Dialog width: max ~448px for confirmations, wider for complex content
- Padding: 24px
- Radius: 8px — one step above card radius
- Shadow: needed for modals (exception to border-based approach)
- Animation: 200ms fade + slide-from-bottom on enter
- Button gap: 8px, right-aligned
- Mobile: bottom sheet instead of centered modal

---

## Recipe 6: Empty State

When there's no data to show. Critical for first-run experience.

**Key values:**
- Vertical padding: 64px — signals "this space is intentionally empty"
- Icon container: circular, subtle fill, centered
- Heading: 16px — slightly larger than body to anchor
- Description: 14px + muted color + max-width ~384px
- CTA button: primary style — guide the user to action
- Always include: what's missing + what to do + action

---

## Recipe 7: Notification / Toast

Transient feedback — success, error, warning, info.

**Key values:**
- Position: fixed bottom-right (common standard)
- Width: max ~384px
- Animation: 200ms slide-from-bottom
- Icon: 20px, leading the content
- Shadow: needed for floating above page content
- Auto-dismiss after 4-5 seconds
- Close button for manual dismissal

---

## Recipe 8: Loading Skeleton

Perceived performance — show structure while data loads.

**Key values:**
- Background: subtle muted fill (semantic token, not hardcoded gray)
- Animation: 2s opacity pulse, ease-in-out
- Width variation across lines (75%, 50%, 85%) — mimics real text breaks
- Skeleton matches the real layout exactly — same dimensions, same spacing
- Skeletons over spinners for content loading — they signal structure

---

## When to Reach for Which Recipe

| Need | Recipe | System Inspiration |
|------|--------|-------------------|
| App layout | Dashboard Shell | Vercel, GitHub |
| Data display | Data Table | Polaris, Ant Design |
| Metrics overview | Stats Card Row | Stripe, Vercel |
| User input | Form | Polaris, Ant Design |
| Confirmation | Modal | Radix, Material |
| No content | Empty State | GitHub, Linear |
| Feedback | Toast | Sonner, Material |
| Loading | Skeleton | Facebook, Instagram |
| Multi-step flow | Multi-Step Form | Stripe, Linear |
| Input validation | Form Validation | Polaris, Material |

---

## Recipe 9: Multi-Step Form

Complex flows — onboarding, checkout, profile setup, wizards.

```
┌──────────────────────────────────────────┐
│  Step 1 ── Step 2 ── Step 3 ── Review    │  ← Progress: which step, how many left
├──────────────────────────────────────────┤
│                                          │
│  Section Heading                         │
│                                          │
│  [Label]                                 │
│  [Input________________________]         │
│                                          │
│  [Label]                                 │
│  [Input________________________]         │
│  ⚠ Validation message here               │
│                                          │
│              [Back]  [Continue →]         │  ← Always show back. Disable continue until valid.
│                                          │
└──────────────────────────────────────────┘
```

**Key values:**
- Progress indicator: step labels > dots. Show step names so users know what's ahead.
- Max fields per step: 3–5. More than that → split into another step.
- Step container: same max-width as forms (~512px), single column.
- Transitions between steps: 200ms slide-left/right (direction matches progress).
- Persist draft state — don't lose input on back/forward navigation.
- Final step: review summary showing all entered data with inline edit links.
- Mobile: progress indicator collapses to "Step 2 of 4" text.

**Validation strategy:**
- Validate on blur, not on change (avoids yelling at users mid-typing).
- Show errors inline below the field, not in a banner at the top.
- Error text: 12px + destructive color. Icon + message, never color alone.
- Don't block forward navigation on optional fields.
- On submit failure: scroll to first error, focus the field, announce to screen readers via `aria-live="assertive"`.

**Multi-step state patterns (library-agnostic):**
- One state object for the entire wizard, not per-step.
- Each step validates its own slice before allowing "Continue."
- Back button never re-validates — users should freely review.
- Works with React Hook Form (multi-step register), Zod (per-step schema), or native `checkValidity()`.

---

## Recipe 10: Form Validation & Error States

The patterns that make forms feel solid vs. frustrating.

**Inline validation:**
```
[Label]
[Input________________________]     ← default: border-muted
[Input________________________]     ← focus: ring-2 ring-primary
[Input________________________]     ← error: ring-2 ring-destructive
  ⚠ Email address is required        ← 12px, destructive color, appears on blur
[Input________________________]     ← success: border-green (optional, use sparingly)
  ✓ Looks good                        ← 12px, success color
```

**Key values:**
- Error message gap: 4px below input.
- Error icon: 14px, inline with text — don't rely on color alone.
- Error message: specific. "Email is required" not "This field is required."
- Success indicators: optional. Use only on fields where validation isn't obvious (password strength, username availability).
- Disabled submit: dim to 50% opacity + `cursor-not-allowed`. Re-enable the moment all required fields are valid.

**Timing:**
- Validate on blur (first interaction).
- After first error, switch to validate on change (instant feedback while fixing).
- Debounce async validation (username check, email exists) at 300–500ms.
- Never validate on focus — user hasn't done anything yet.

**Error summary (for long forms):**
- Show at top of form only after submit attempt, not as fields are filled.
- List each error as a link that scrolls/focuses the offending field.
- Screen reader: `role="alert"` on the summary container.

**Password fields:**
- Show/hide toggle (eye icon). Default: hidden.
- Strength meter: segmented bar (weak/fair/strong), not a percentage.
- Requirements list: check each requirement in real-time as user types.
- Confirm password: validate match on blur of confirm field.

---

## Adapting Recipes to Your Stack

These patterns are **stack-agnostic**. The values (dimensions, timing, spacing) stay the same. Translate to whatever the project uses:

- **Tailwind/shadcn:** Use utility classes directly
- **CSS Modules:** Use the values as CSS custom properties or direct values
- **styled-components/Emotion:** Use the values in template literals or style objects
- **MUI/Chakra/Mantine:** Map values to the library's theme/token system
- **Vanilla CSS:** Use CSS custom properties with these values

The recipe is the pattern + the numbers. The syntax is whatever ships in your project.

---

## Retrieval Queries

- Design recipes: step-by-step patterns for common UI tasks
- How to approach common design problems systematically
- Reusable design patterns and recipes for web interfaces
- Step-by-step design recipes for cards, forms, and layouts
- Common UI design problems and their standard solutions
- Practical design patterns you can apply immediately
- Multi-step form wizard pattern with validation
- Form validation timing inline errors error messages
- Password strength meter form error states
- Onboarding checkout wizard step-by-step flow
