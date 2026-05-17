# WDG audit — Group D (AuditTrail, AuditRecordDialog, ApiKeys)

---

## AuditTrail.tsx

### CRITICAL

None.

### SERIOUS

**AuditTrail.tsx:78-79 — Hardcoded date format, not `Intl.DateTimeFormat`**
```ts
return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
```
Manual month-name array + manual padding is hardcoded locale formatting. Fix: replace `fmtTime` with `new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d)` (or equivalent options). The `MONTH_LABELS` constant and `pad2` helper can be deleted.

**AuditTrail.tsx:98-101 — Three ASCII dots in `truncateHex`, copied into visible table cells**
```ts
return `${s.slice(0, start)}...${s.slice(-end)}`;
```
Three ASCII periods render visually. The guidelines require `…` (U+2026) in rendered text. The comment on line 97 ("ASCII dots matching the glyph in the original seed data") does not justify shipping raw `...` to the UI. Fix: change the string literal to use `…`.

### MODERATE

**AuditTrail.tsx:539-546 — `<tr>` row acting as interactive trigger lacks `role="button"` / `aria-label`**
```tsx
<TableRow tabIndex={0} onClick={() => setSelectedRow(row)} onKeyDown={...}>
```
A `<tr>` with `tabIndex` and keyboard handler is functionally a button but carries no ARIA role, so screen readers announce it as a generic row with no affordance. Fix: add `role="button"` and `aria-label={`View audit record: ${row.description.slice(0, 60)}`}` (or equivalent descriptive label). Keyboard handler on Enter/Space is already present — this is just missing the ARIA role.

**AuditTrail.tsx:156-176 — `max-w-1/2` on a `flex-col` container with no `min-w-0`**
```tsx
<div className="flex flex-col gap-2 max-w-1/2">
```
The paragraph subtitle (line 159) contains a long string with no overflow handling. The `max-w-1/2` relies on the parent flex container for sizing; the child `<p>` has no `min-w-0`, `truncate`, `line-clamp-*`, or `break-words`. On narrow viewports or when the range controls grow, this can allow the paragraph to overflow its column. Fix: add `min-w-0` to the `flex-col` div and verify the `<p>` either wraps cleanly or gets `text-pretty`.

---

## AuditRecordDialog.tsx

### CRITICAL

None.

### SERIOUS

**AuditRecordDialog.tsx:162-163 — Icon-only button segment without full context label (copy-button inside key display)**
*(Note: this pattern does not apply here — the copy button has `aria-label`. See below.)*

**AuditRecordDialog.tsx:162-168 — Footer buttons: icons lack `aria-hidden`**
```tsx
<Button variant="outline" size="sm" onClick={() => {}}>
  <Copy className="size-3.5" />
  Copy proof JSON
</Button>
<Button size="sm" onClick={() => {}}>
  <ExternalLink className="size-3.5" />
  Open on DE explorer
</Button>
```
Both buttons have visible text labels (not icon-only), so these are not CRITICAL. However, the `<Copy>` and `<ExternalLink>` icons lack `aria-hidden="true"`. With text present, the icon is decorative. Without `aria-hidden`, some screen readers will attempt to announce the SVG title or path data alongside the button label. Fix: add `aria-hidden` to both icons.

### MODERATE

**AuditRecordDialog.tsx:94 — `Tabs` default value is hard-wired; tab state is not URL-synced**
```tsx
<Tabs defaultValue="event">
```
The guidelines require URL reflection for stateful UI. The active tab inside the dialog is ephemeral state — this is low-severity given the dialog dismisses on close, but the drill-in URL (`/audit-trail?record=e-01`) does not survive page reload with the correct tab selected. Fix when deep-link support is implemented: add a `tab` query param alongside the record ID.

**AuditRecordDialog.tsx:82-85 — `fmtRelative` uses hardcoded "ago" string formatting**
```ts
return `${seconds}s ago`;
// …etc
```
`fmtRelative` is defined in `AuditTrail.tsx` (line 81-93) and imported here. It manually constructs relative-time strings. The correct approach is `new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(...)`. This is the same SERIOUS finding rooted in AuditTrail.tsx — flagged here because the output renders inside the dialog.

---

## ApiKeys.tsx

### CRITICAL

None.

### SERIOUS

**ApiKeys.tsx:69 — `lastUsed` is a hardcoded string, not a formatted date**
```ts
lastUsed: string;  // "1 day ago" / "Never"
```
Seed data at lines 93 and 98 supplies literal `'1 day ago'`, `'2h ago'`, `'Never'` strings — hardcoded relative-time text, not a `Date` that feeds `Intl.RelativeTimeFormat`. When real data lands, this field must be a `Date | null` formatted with `Intl.RelativeTimeFormat`. Type the field as `lastUsedAt: Date | null` and format at render.

**ApiKeys.tsx:591 — `focus-visible:ring-3` on handwritten button inside `KeyCreatedDialog`**
```tsx
className="… focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 …"
```
`ring-3` is non-standard Tailwind v4 — the standard scale is `ring`, `ring-2`, `ring-4`, `ring-8`. `ring-3` may silently produce no ring or a 3px ring depending on Tailwind's dynamic scale behavior. Verify this renders the intended 3px focus ring or swap to `ring-2` (2px) / `ring-4` (4px) per the project's actual scale.

### MODERATE

**ApiKeys.tsx:504 — `placeholder` uses `·` (U+00B7 middle dot), not a typographic separator; ends with no `…`**
```tsx
placeholder="server · new-service"
```
The guidelines require placeholders to end with `…` showing an example pattern. This placeholder presents two example values separated by a middle dot, which is unconventional. Fix: `placeholder="e.g. prod-web…"` (single clear example + ellipsis).

**ApiKeys.tsx:611 — Em dash in user-facing warning copy**
```tsx
"you'd need to rotate the key."
```
No em dash found here, but line 573: `"Key created — copy it now"` inside `DialogTitle` contains an em dash. Project rule: no em dashes in user-facing copy. Fix: `"Key created: copy it now"` or `"Key created. Copy it now."`.

**ApiKeys.tsx:329 — `UsageInfo` `<section>` has no `aria-label` or `aria-labelledby`**
```tsx
<section className="flex flex-col gap-6 max-w-3xl">
```
The `<section>` element is a landmark; screen readers will announce it as "region" with no name. The `<h3>` on line 332 (`Using your key`) should label it. Fix: add `aria-labelledby="usage-info-heading"` on the `<section>` and `id="usage-info-heading"` on the `<h3>`.

**ApiKeys.tsx:167-174 — `PageHeader` "Create key" button missing `aria-label` disambiguation**
```tsx
<Button onClick={onCreate}>
  <Plus data-icon="inline-start" aria-hidden />
  Create key
</Button>
```
Not CRITICAL (has text label). However `data-icon="inline-start"` is a non-standard attribute used as a styling hook — it has no semantic effect. If the project's CSS uses it as a selector that's fine, but `aria-hidden` belongs on the `<Plus>` element directly (it is present). No change needed here beyond confirming the icon's `aria-hidden` is correct (it is).

---

## Clean

- `AuditTrail.tsx`: Search input (`aria-label`, `spellCheck`, `autoComplete`, type=search) — correct. `TableHead` `whitespace-nowrap` on all columns — correct. `TableEmptyState` with toolbar hidden on empty — correct. `CircleCheck` icon has `aria-hidden` + adjacent `sr-only` span — correct. `TableRow` keyboard handler covers Enter and Space — correct.
- `AuditRecordDialog.tsx`: `VerifiedBySeal` `<img>` has meaningful `alt` text — correct. `CircleCheck` in `DetailRow` has `aria-hidden` + adjacent `sr-only` — correct. `DialogTitleBlock` provides accessible dialog name — correct.
- `ApiKeys.tsx`: `IconActionButton` has `aria-label={`Actions for ${row.name}`}` — correct. `Checkbox` + `Label` share `htmlFor`/`id` — correct. `CreateKeyDialog` form input is labeled via `<Label htmlFor>` — correct. `DialogClose` renders as a proper button — correct. `openDocs` uses `noopener,noreferrer` — correct.
