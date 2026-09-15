# Web Interface Guidelines

> **Source:** Vercel Design Guidelines (vercel.com/design/guidelines). Canonical reference for web UI quality — accessibility, interactions, performance, content, forms, animation, layout, visual design, and copywriting.

> **Reading order:** Load alongside other core methodology files. Apply these rules when writing ANY UI code or building ANY canvas design. They are target-agnostic — Code, Paper, and Figma builds all must satisfy these. **Figma/Paper note:** You still implement via that tool’s primitives (HTML/CSS vs Plugin API nodes); these guidelines define **barriers, motion, a11y intent, and content** — map checks to screenshots and specs, not to browser-only APIs where N/A.

> **Relationship to skills:** The `skills/web-design-guidelines/` skill is a compact subset. This knowledge file is the complete, canonical reference. When they conflict, this file wins.

---

## 1. Interactions

### Keyboard & Focus
- **Keyboard works everywhere.** All flows keyboard-operable following WAI-ARIA Authoring Patterns.
- **Clear focus.** Every focusable element shows visible focus ring. Prefer `:focus-visible` over `:focus` to avoid distracting pointer users. Set `:focus-within` for grouped controls.
- **Manage focus.** Use focus traps, move and return focus per WAI-ARIA Patterns.
- **Locale-aware keyboard shortcuts.** Internationalize for non-QWERTY layouts. Show platform-specific symbols.

### Targets & Touch
- **Match visual and hit targets.** If visual target < 24px, expand hit target to >= 24px. Mobile minimum: 44px.
- **Mobile input size.** `<input>` font >= 16px on mobile prevents iOS Safari auto-zoom. Or set viewport meta with `maximum-scale=1`.
- **Respect zoom.** Never disable browser zoom.
- **Prevent double-tap zoom on controls.** Set `touch-action: manipulation`.
- **Tap highlight follows design.** Set `-webkit-tap-highlight-color`.
- **No dead zones.** If interactive-looking, it should be interactive.
- **Design forgiving interactions.** Generous hit targets, clear affordances, predictable interactions (e.g., prediction cones).

### State & Navigation
- **Hydration-safe inputs.** Inputs must not lose focus or value after hydration.
- **Don't block paste.** Never disable paste in `<input>` or `<textarea>`.
- **URL as state.** Persist state in URL for sharing, refresh, Back/Forward.
- **Deep-link everything.** Filters, tabs, pagination, expanded panels, any `useState` usage.
- **Scroll positions persist.** Back/Forward restores prior scroll.
- **Links are links.** Use `<a>` or `<Link>` for navigation, enabling Cmd/Ctrl+Click, middle-click, right-click. Never substitute with `<button>` or `<div>`.

### Feedback & Loading
- **Loading buttons.** Show loading indicator and keep original label.
- **Minimum loading-state duration.** Add ~150-300ms show-delay and ~300-500ms minimum visible time to avoid flicker. `<Suspense>` does this automatically.
- **Optimistic updates.** Update UI immediately when success likely; reconcile on server response. On failure, show error and rollback or provide Undo.
- **Ellipsis for further input and loading states.** Menu options ("Rename...") and loading states ("Loading...", "Saving...", "Generating...") end with ellipsis.
- **Confirm destructive actions.** Require confirmation or provide Undo with safe window.
- **Announce async updates.** Use polite `aria-live` for toasts and inline validation.

### Misc Interaction
- **Tooltip timing.** Delay first tooltip in group; subsequent peers have no delay.
- **Overscroll behavior.** Set `overscroll-behavior: contain` intentionally in modals/drawers.
- **Autofocus for speed.** On desktop with single primary input, autofocus. Rarely on mobile (keyboard opening causes layout shift).
- **Clean drag interactions.** Disable text selection and apply `inert` while element dragged.

---

## 2. Animations

- **Honor `prefers-reduced-motion`.** Provide reduced-motion variant for every animation.
- **Implementation preference.** CSS > Web Animations API > JS libraries (e.g., motion).
- **Compositor-friendly.** Prioritize GPU-accelerated properties (`transform`, `opacity`). Avoid properties triggering reflows/repaints (`width`, `height`, `top`, `left`).
- **Necessity check.** Animate only when clarifying cause and effect or adding deliberate delight.
- **Easing fits the subject.** Choose easing based on what changes (size, distance, trigger).
- **Interruptible.** Animations cancelable by user input.
- **Input-driven.** Avoid autoplay; animate responding to actions.
- **Correct transform origin.** Anchor motion to where it "physically" starts.
- **Never `transition: all`.** List only properties you intend to animate (typically `opacity`, `transform`).
- **Cross-browser SVG transforms.** Apply CSS transforms to `<g>` wrappers with `transform-box: fill-box; transform-origin: center;`.

---

## 3. Layout

- **Optical alignment.** Adjust +/-1px when perception beats geometry.
- **Deliberate alignment.** Every element intentionally aligns with grid, baseline, edge, or optical center.
- **Balance contrast in lockups.** Adjust weight, size, spacing, color when text and icons sit together.
- **Responsive coverage.** Verify mobile, laptop, ultra-wide (zoom 50%).
- **Respect safe areas.** Account for notches using safe-area variables.
- **No excessive scrollbars.** Render only useful scrollbars; fix overflow issues.
- **Let the browser size things.** Prefer flex/grid/intrinsic layout over JS measuring.

---

## 4. Content

### Text & Typography
- **Typographic quotes.** Prefer curly quotes (" ") over straight (" ").
- **Avoid widows/orphans.** Tidy rag and line breaks.
- **Tabular numbers for comparisons.** Use `font-variant-numeric: tabular-nums` or monospace font.
- **Use the ellipsis character.** `...` (single character) over three periods.
- **Anchored headings.** Set `scroll-margin-top` when linking to sections.

### States & Structure
- **Stable skeletons.** Skeletons mirror final content exactly, avoiding layout shift.
- **Accurate page titles.** `<title>` reflects current context.
- **No dead ends.** Every screen offers next step or recovery path.
- **All states designed.** Empty, sparse, dense, and error states.
- **Resilient to user-generated content.** Layouts handle short, average, very long content.
- **Inline help first.** Prefer inline explanations; tooltips last resort.

### Accessibility
- **Redundant status cues.** Don't rely on color alone; include text labels.
- **Icons have labels.** Convey meaning with text for non-sighted users.
- **Don't ship the schema.** Layouts may omit visible labels, but accessible names exist for assistive tech.
- **Icon-only buttons are named.** Provide descriptive `aria-label`.
- **Semantics before ARIA.** Prefer native elements (`button`, `a`, `label`, `table`) before `aria-*`.
- **Headings and skip link.** Hierarchical `<h1-h6>` and "Skip to content" link.
- **Accessible content.** Set accurate names (`aria-label`), hide decoration (`aria-hidden`), verify in accessibility tree.

### Internationalization
- **Locale-aware formats.** Format dates, times, numbers, delimiters, currencies per user locale.
- **Prefer language settings over location.** Detect via `Accept-Language` header and `navigator.languages`. Never rely on IP/GPS.
- **Shield verbatim content from translation.** Wrap brand names, product names, code, technical identifiers with `translate="no"`.
- **Non-breaking spaces for glued terms.** Use `&nbsp;` for units, shortcuts, names. `10&nbsp;MB`, `Cmd&nbsp;+&nbsp;K`.

---

## 5. Forms

### Submission & Validation
- **Enter submits.** Enter submits single-control text input; apply to last control if many.
- **Textarea behavior.** Cmd/Ctrl+Enter submits; Enter inserts new line.
- **Submission rule.** Keep submit enabled until submission starts; disable during in-flight request, show spinner, include idempotency key.
- **Don't block typing.** Allow any input even if field accepts numbers; show validation feedback.
- **Don't pre-disable submit.** Allow submitting incomplete forms to surface validation feedback.
- **Error placement.** Show errors next to fields; on submit, focus first error.
- **Unsaved changes.** Warn before navigation when data could be lost.
- **Text replacements and expansions.** Trim input value to avoid confusing error messages from trailing whitespace.

### Labels & Controls
- **Labels everywhere.** Every control has `<label>` or associated label.
- **Label activation.** Clicking `<label>` focuses associated control.
- **No dead zones on controls.** Checkboxes and radios with label and control share single generous hit target.
- **Autocomplete and names.** Set `autocomplete` and meaningful `name` values enabling autofill.
- **Spellcheck selectively.** Disable for emails, codes, usernames.
- **Correct types and input modes.** Use right `type` and `inputmode` for better keyboards and validation.
- **Placeholders signal emptiness.** End with ellipsis.
- **Placeholder value.** Set to example value or pattern (e.g., `+1 (123) 456-7890`, `sk-012345679...`).

### Password & Auth
- **Password managers and 2FA.** Ensure compatibility and allow pasting one-time codes.
- **Don't trigger password managers for non-auth fields.** Avoid reserved names; use `autocomplete="off"` or specific token.

### Platform
- **Windows `<select>` background.** Explicitly set `background-color` and `color` on native `<select>` avoiding dark-mode contrast bugs.

---

## 6. Performance

### Measuring
- **Device/browser matrix.** Test iOS Low Power Mode and macOS Safari.
- **Measure reliably.** Disable extensions changing runtime behavior.
- **Track re-renders.** Minimize and make fast. Use React DevTools or React Scan.
- **Throttle when profiling.** Test with CPU and network throttling.

### Runtime
- **Minimize layout work.** Batch reads/writes; avoid unnecessary reflows/repaints.
- **Network latency budgets.** `POST/PATCH/DELETE` complete in <500ms.
- **Keystroke cost.** Prefer uncontrolled inputs; make controlled loops cheap.
- **Large lists.** Virtualize (e.g., virtua) or use `content-visibility: auto`.
- **Don't use the main thread for expensive work.** Move long tasks to Web Workers preventing page interaction blocking.

### Loading & Assets
- **Preload wisely.** Preload above-the-fold images; lazy-load rest.
- **No image-caused CLS.** Set explicit image dimensions and reserve space.
- **Preconnect to origins.** Use `<link rel="preconnect">` for asset/CDN domains reducing DNS/TLS latency.
- **Preload fonts.** For critical text avoiding flash and layout shift.
- **Subset fonts.** Ship only code points/scripts used via unicode-range; limit variable axes.

---

## 7. Visual Design

- **Layered shadows.** Mimic ambient + direct light with >= 2 layers.
- **Crisp borders.** Combine borders and shadows; semi-transparent borders improve edge clarity.
- **Nested radii.** Child radius <= parent radius and concentric aligning curves.
- **Hue consistency.** Tint borders/shadows/text toward same hue on non-neutral backgrounds.
- **Accessible charts.** Use color-blind-friendly palettes.
- **Minimum contrast.** Prefer APCA over WCAG 2 for accurate perceptual contrast.
- **Interactions increase contrast.** `:hover`, `:active`, `:focus` have more contrast than rest state.
- **Browser UI matches your background.** Set `<meta name="theme-color">` aligning browser theme with page background.
- **Set the appropriate color-scheme.** Style `<html>` with `color-scheme: dark` in dark themes ensuring proper scrollbar and device UI contrast.
- **Text anti-aliasing and transforms.** Scaling text changes smoothing. Animate wrapper instead. If artifacts persist, set `translateZ(0)` or `will-change: transform`.
- **Avoid gradient banding.** Fading to dark via CSS masks causes banding; use background images instead.

---

## 8. Copywriting

- **Active voice.** "Install the CLI" not "The CLI will be installed."
- **Title Case for headings and buttons** (Chicago style). Marketing pages: sentence case.
- **Be clear and concise.** Use fewest words possible.
- **Prefer `&` over `and`.**
- **Action-oriented language.** "Install the CLI" not "You will need the CLI."
- **Keep nouns consistent.** Introduce fewest unique terms possible.
- **Write in second person.** Avoid first person.
- **Use consistent placeholders.** Strings: `YOUR_API_TOKEN_HERE`. Numbers: `0123456789`.
- **Use numerals for counts.** "8 deployments" not "eight deployments".
- **Consistent currency formatting.** Display with either 0 or 2 decimal places, never mix.
- **Separate numbers and units with space.** `10 MB` not `10MB`. Use non-breaking space: `10&nbsp;MB`.
- **Default to positive language.** Frame messages encouragingly. "Something went wrong — try again or contact support" not "Your deployment failed."
- **Error messages guide the exit.** Don't just state what went wrong; tell how to fix. "Your API key is incorrect or expired. Generate a new key in account settings."
- **Avoid ambiguity.** "Save API Key" not "Continue".

---

## Retrieval Queries

- Web interface guidelines accessibility keyboard focus ARIA
- Form validation submission enter behavior labels autocomplete
- Animation prefers-reduced-motion compositor GPU transform opacity
- Layout optical alignment responsive safe areas
- Content states skeletons typography locale i18n
- Performance virtualization preload fonts CLS reflows
- Visual design shadows borders nested radii contrast APCA
- Copywriting active voice Title Case error messages
- Vercel design guidelines web UI quality checklist
