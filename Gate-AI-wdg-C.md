# WDG audit — Group C (Security, Policies, Guardrails)

---

## Security.tsx

### CRITICAL

None.

### SERIOUS

**Security.tsx:1113–1121** — `<TableRow>` used as interactive element with `onClick` + `tabIndex={0}` + `onKeyDown`, but `<tr>` is not a valid ARIA interactive role. Screen readers do not announce it as a button/link. Fix: wrap the row's clickable surface in a real `<button>` (visually transparent, full-row) or use `role="row"` on the `<tr>` with a dedicated action `<button>` inside the Actions cell. The `onKeyDown` handler is present and correct — the structural role is the gap.

**Security.tsx:1237–1238** — `openConversation` and `openRequest` are `onClick` navigation handlers wired to `<TextLink>` (lines 1361–1384). `TextLink` renders as a `<button>` or plain `<span>`, not `<a>`. Cmd/Ctrl+click and middle-click are silently broken; the browser history API is the only navigation path. Fix: use `<Link to={...}>` from react-router-dom, or pass `href` if `TextLink` supports it, so native link semantics are preserved.

### MODERATE

**Security.tsx:504–506** — `BreakdownRow` dot `<span aria-hidden>` hides the color indicator, which is the only visual encoding for Blocked/Flagged/Redacted in the header breakdown. The adjacent text label (line 501) names the category, so screen readers get the label and value — acceptable. But the color carries additional meaning (maps to the chart below) with no text equivalent anywhere. Recommendation: add a visually hidden `<span className="sr-only">` inside the dot `<span>` naming the tone (e.g., "danger").

**Security.tsx:697–726** — `role="meter"` on the category bar track is correct intent, but `aria-valuetext` is absent. `aria-valuenow` alone exposes a raw number; `aria-valuetext` should express it as a human-readable string (e.g., `"801 — 65%"`) so assistive tech announces context. Fix: add `aria-valuetext={`${fmtCount(cat.count)} of ${fmtCount(max)}`}` to the meter `<div>`.

**Security.tsx:588–591** — `SegmentedPill` value coerced to `''` when `range === 'custom'` (nothing selected state). If `SegmentedPill` uses a `<button>` group, the unselected state must still have a visually active indicator and the currently-active range must have `aria-pressed="true"` or `aria-current`. Verify the primitive handles the empty-value case — the empty string may leave all segments un-pressed with no indication of the custom state active. Low-effort fix: keep `value={range}` and add a `'custom'` option (hidden/disabled) so ARIA state stays coherent.

---

## Policies.tsx

### CRITICAL

None.

### SERIOUS

**Policies.tsx:507–541** — `RadioGroup` with `aria-labelledby={headingId}` is correct. However each option is a `<label>` wrapping a `<RadioGroupItem>` — the `htmlFor={radioId}` points to the `<RadioGroupItem id={radioId}>`. If `RadioGroupItem` renders a `<button role="radio">` (Base UI pattern) rather than a native `<input type="radio">`, `htmlFor` does not associate the label to a button. The click target works because the `<label>` wraps the element, but the `for`/`id` association is semantically broken for assistive tech. Fix: if `RadioGroupItem` is a `<button>`, remove `htmlFor` from `<label>` and instead use `aria-labelledby` on the button pointing to the option name span, or use `<label>` as a presentational wrapper only (no `htmlFor`).

### MODERATE

**Policies.tsx:446–453** — `<Segmented>` (Sensitivity / Scan direction) has no visible `<label>` or `aria-label` at the control level — the section heading above it (`<SectionHeading as="h4">Sensitivity</SectionHeading>`) is a heading, not a form label. The `<Segmented>` component must either consume an `aria-labelledby` pointing to the heading's id, or expose a hidden label. Fix: add `id` to the `<SectionHeading>` and pass `aria-labelledby` to `<Segmented>`.

**Policies.tsx:516–519** — Radio option label `<label>` applies `transition-colors duration-150 ease-out` but no `@media (prefers-reduced-motion)` guard. Inline Tailwind transition without `motion-reduce:transition-none` violates the reduced-motion rule. Fix: append `motion-reduce:transition-none` to the className string.

**Policies.tsx:84–91** — Sensitivity `caption` function returns plain strings that end with a period but are rendered as `<p>` without `aria-live`. When the user changes sensitivity, the caption text updates silently — screen readers won't announce the change. Fix: add `aria-live="polite"` to the caption `<p>` at line 454.

---

## Guardrails.tsx

### CRITICAL

None.

### SERIOUS

**Guardrails.tsx:191–212** — `LimitActionsMenu`: `<MenuTrigger>` wraps a `<Button variant="ghost" size="icon-sm" aria-label="Limit actions">` but the `<MoreHorizontal />` icon child has no `aria-hidden`. Without `aria-hidden` on the icon, screen readers announce both the icon name (if any) and the button label, producing redundant or confusing output. Fix: add `aria-hidden` to `<MoreHorizontal />` (line 204). Also note the `aria-label` is generic across all rows — each row's button should identify which limit it acts on (e.g., `aria-label={`Actions for ${limit.name}`}`), otherwise AT users cannot distinguish rows.

**Guardrails.tsx:325–336** — `handleSubmit` calls `onCreate` then `onOpenChange(false)` but there is no validation error path surfaced to the user. `canSubmit` prevents submission when fields are incomplete, but the button is simply `disabled` — there is no `aria-describedby` error or inline message explaining *why* it is disabled. Per WDG: "Errors inline next to fields; focus first error on submit." The current pattern doesn't satisfy this when a user tabs to the disabled button and activates nothing. Fix: display inline field-level hints when `name` is empty or `threshold` is invalid (non-positive), and move focus to the first invalid field on failed attempt.

### MODERATE

**Guardrails.tsx:354–355** — Dialog width set via inline `style={{ width: 500, minWidth: 500, maxWidth: 500 }}`. This is a hardcoded px value outside the spacing scale and bypasses responsive behavior — at viewport widths under 500px (uncommon for this dashboard but possible on small laptops) the dialog will overflow. Fix: use `sm:max-w-[500px] w-full` Tailwind classes to retain the intent while allowing narrower viewports to shrink the dialog.

**Guardrails.tsx:368–374** — Name `<Input>` has no `autocomplete` attribute and no `spellCheck={false}`. Limit names are identifier-like strings (e.g., "eu-payments daily spend") — password managers and browser autofill may incorrectly trigger. Fix: add `autoComplete="off"` and `spellCheck={false}`.

**Guardrails.tsx:399–409** — Threshold `<Input type="number">` has `inputMode="decimal"` — correct — but `name` attribute is absent. Every form input should carry `name` for semantic form identity (WDG: "meaningful `name`"). Fix: add `name="threshold"` (and `name` to all other inputs in the dialog: `name="limit-name"`, etc.).

**Guardrails.tsx:277–301** — `resetsAt` calls `new Date()` at render time. This is a live clock read on every render, causing a hydration mismatch risk (server renders one time, client renders another). In this SPA context that's not a hard SSR bug, but it means the "Resets on" column flickers on every re-render that triggers a new `Date()` snapshot. Fix: compute `resetsAt` values once when `limits` state is set (derive in `addLimit`), or memoize with `useMemo([limits])`. Also: `toLocaleString('en-US', ...)` is correct use of `Intl` — no flag here.

---

## Clean

- Security.tsx chart reconciliation — single source of truth correctly enforced via `eventsTotal()` + `splitEventMix()`. No hardcoded duplicate numbers found.
- Security.tsx search `<Input>` — `aria-label`, `autoComplete="off"`, `spellCheck={false}` all present (lines 1022–1028). Correct.
- Security.tsx filter `<Select>` triggers — all carry `aria-label` (lines 1035, 1051, 1068). Correct.
- Security.tsx table headers — all have `whitespace-nowrap` (lines 1099–1103). Correct.
- Security.tsx `TableRow` keyboard handler — `onKeyDown` covers Enter + Space (lines 1117–1121). Present.
- Security.tsx motion — `motion-reduce:transition-none` on row hover (line 1114). Correct.
- Policies.tsx Switch — `aria-label` with enabled/disabled state embedded (line 397). Correct.
- Policies.tsx `RadioGroup` — `aria-labelledby` wired to heading id (line 507). Correct.
- Guardrails.tsx destructive action — `MenuItem variant="destructive"` for Remove (line 208); no immediate-delete without confirmation since the state is local and reversible within the session. Acceptable.
- Guardrails.tsx `<Label htmlFor>` on all dialog inputs — present and correct for native inputs (lines 366, 379, 393, 414, 421).
- Guardrails.tsx revoked keys excluded from `LIMIT_SCOPES` (lines 235–239, comment line 233). Correct.
- All three files: no raw hex colors, no `border-ink-*` bypasses, no `*.5` spacing utilities found. Contract-compliant.
- All three files: no em dashes in user-facing copy found. Compliant.
