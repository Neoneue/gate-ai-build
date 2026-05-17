# WDG audit — Group B (Activity, Models, TokenSavings)

---

## Activity.tsx

### CRITICAL

- **L:1364–1368** [A11Y] `UsageByKey` search input has `aria-label="Search keys"` but the _sort_ `SelectTrigger` at L:1385 has `aria-label="Sort keys by"` while the toolbar search at L:1371 uses `name="q"` (one-char name, no `autocomplete` type hint). More critically: the toolbar wrapper `div` at L:1363 (`<div className="flex items-center gap-2 p-4">`) conditionally renders `null` when `isEmpty` (L:1363 `{isEmpty ? null : (...)}`), so the `Select` sort control disappears but the header remains. The real critical issue: the `Input` at L:1371 is missing `aria-label` text that describes _what_ it searches — `"Search keys"` is fine, but the `size="sm"` Input at L:1365 in `UsageByKey` has `aria-label="Search keys"` — that's actually acceptable. **However**, the `size-3.5` `Search` icon at L:1367 uses `aria-hidden` without the attribute value: `aria-hidden` (bare attribute) instead of `aria-hidden="true"`. In JSX, bare `aria-hidden` coerces to the string `"true"` in most browsers but is ambiguous and should be explicit.
  ```tsx
  // L:1369 — bare aria-hidden
  aria-hidden
  // fix:
  aria-hidden="true"
  ```

### SERIOUS

- **L:644–645** [A11Y] `TrendBreakdownPanel` rows are plain `div` elements with `hover:bg-muted` styling. They look interactive (hover state, press-like padding) but carry no role, no keyboard handler, and no `tabindex`. If these will eventually be clickable (drill-down), they need `role="button"` + `onKeyDown`. If they are intentionally read-only, remove the `hover:` style — decorative hover on non-interactive elements misleads keyboard and AT users.
  ```tsx
  // L:644 — interactive-looking div, no role
  <div className="... hover:bg-muted ...">
  ```

- **L:645–667** [NAVIGATION] Filter state in `Activity` (range, customRange) and chart dimension/metric toggles live in `useState` only — no URL sync. The WDG rule: "Deep-link all stateful UI (if uses `useState`, consider URL sync)." The range picker in particular is a high-value deep-link target (share a 30-day view). Not a blocking issue for a dashboard app but flagged as serious per the skill.

- **L:645** [SPACING] `TrendBreakdownPanel` rows use `px-2` and `py-1` — both off the 4px grid. `py-1` = 4px (fine), `px-2` = 8px (fine). However the grid template at L:656–658:
  ```tsx
  style={{ gridTemplateColumns: '9ch min-content 4ch' }}
  ```
  This is an inline style with `ch`-unit columns, not a spacing-scale value. Not a strict 4px-grid violation (ch is not a spacing utility), but mixing inline grid templates with Tailwind layout is an inconsistency worth noting.

- **L:566–582** [TYPOGRAPHY] `getRangeLabels` for `'all'` and `'30d'` hardcodes dates using a `MONTH_LABELS` array and manual `Date` arithmetic — not `Intl.DateTimeFormat`. Per WDG: "Dates/times: use `Intl.DateTimeFormat` not hardcoded formats." While this is mock data, the pattern ships as production code. Fix:
  ```tsx
  // Instead of: `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  ```

### MODERATE

- **L:895** [TYPOGRAPHY] Y-axis tick for spend uses `$${props.payload?.value}` which will render raw decimal numbers from Recharts (e.g. `$14.285714…`). The `fmtUsd` helper is defined below at L:971 and rounds to 2dp — it should be used here for the spend axis tick too.
  ```tsx
  // L:895 — unformatted spend tick
  const label = isSpend ? `$${props.payload?.value}` : fmtTokens(raw);
  // fix:
  const label = isSpend ? fmtUsd(raw) : fmtTokens(raw);
  ```

- **L:608, L:874** [ANIMATION] `TREND_CHART_XAXIS_TICK` and chart configuration are hoisted (good), but the `<Bar isAnimationActive={false} />` at L:947 disables animation universally — including for users who have not enabled `prefers-reduced-motion`. This is correct _behavior_ (no animation for static demo) but the comment should note it is intentional, or wire it to `prefers-reduced-motion` if animation is later re-enabled.

- **L:1114–1116** [A11Y] `KEY_AVATAR` is a module-level constant rendering a `<Key>` icon with bare `aria-hidden` (no `="true"`):
  ```tsx
  const KEY_AVATAR = (
    <Key aria-hidden className="size-4 shrink-0 text-muted-foreground" .../>
  );
  // fix: aria-hidden="true"
  ```

---

## Models.tsx

### CRITICAL

- **L:946–949** [A11Y] `ModelsTable` rows are `<TableRow onClick={() => onSelect(model)}>` — a `<tr>` with a click handler. `<tr>` is not an interactive element. This pattern is missing: (a) `role="button"` or equivalent on the row, (b) `tabindex="0"`, (c) `onKeyDown` for Enter/Space. The `RowActionButton` inside the first cell _does_ handle this for that cell, but the entire row fires `onSelect` on click without keyboard parity for the row itself.
  ```tsx
  // L:946
  <TableRow
    key={model.id}
    className="cursor-pointer ..."
    onClick={() => onSelect(model)}
  >
  // The row has no tabIndex, no onKeyDown — keyboard users cannot activate
  // the row drill-in except by tabbing to the RowActionButton inside.
  // Fix: add tabIndex={0} + onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(model); }}
  ```

- **L:1307–1313** [A11Y] `PlatformPanel` buttons are native `<button type="button">` elements (correct). They have `aria-label={`Open ${p.name} integration guide`}` (correct). The `onClick={() => undefined}` is a no-op stub — acceptable for a showcase. However: `focus-visible:ring-3` at L:1313 is a non-standard Tailwind v4 ring width. The ring utility scale in contract/globals.md tops out at `ring-2` for standard focus rings. `ring-3` is valid in Tailwind v4's dynamic scale but is unusually thick and should be verified against the design token. Not a critical accessibility failure, just inconsistency.

### SERIOUS

- **L:971–978** [NAVIGATION] `ModelsSurface` state (modality, search, vendor, provider, sort, page) is all `useState` with no URL sync. The comment at L:81 explicitly acknowledges this ("No URL sync — controls are local state"). Per WDG, filter state that is stateful and shareable belongs in URL params. The detail view toggle (`selectedModel`) is also in `useState` at L:90 — navigating to a model detail and refreshing loses the state entirely.

- **L:1028–1040** [A11Y] `CapabilityStrip` icons use `aria-label={meta.label}` + `role="img"` on each `<Icon>` SVG. This is correct for standalone icons. However the outer `<span>` at L:1034 also has `title={meta.label}`, creating a redundant tooltip announcement on hover and a duplicate label chain (`span[title] > svg[aria-label]`). Screen readers may announce the label twice. Prefer one mechanism: keep `role="img"` + `aria-label` on the SVG and remove `title` from the span, or vice versa.
  ```tsx
  // L:1034 — redundant: both span[title] and Icon[aria-label] carry same text
  <span key={c} title={meta.label} className="inline-flex shrink-0">
    <Icon ... aria-label={meta.label} role="img" />
  </span>
  // fix: remove title from span, keep role+aria-label on Icon
  ```

- **L:583** [TYPOGRAPHY / LOCALE] `formatNumeric` uses `.toLocaleString('en-US')` hardcoded locale. Per WDG: detect locale via `navigator.languages`, not a hardcoded string. Same pattern in `fmtUsd` (L:971) and throughput formatting at L:1413. Acceptable for a US-first v1 dashboard, but flagged.

- **L:1147** [A11Y] `ModelDetailPage` back affordance uses `<TextLink onClick={onBack}>`. `TextLink` renders as `<a>` without an `href`. An `<a>` without `href` is not keyboard-focusable by default in most browsers and is not a valid interactive element per HTML spec. It needs either a real `href="#"` with `e.preventDefault()`, or the component should be a `<button>`. Check the `TextLink` primitive — if it renders `<a>` unconditionally, add `href` or switch to `<button>` for action-without-navigation.

### MODERATE

- **L:777** [TYPOGRAPHY] The copy hint paragraph at L:777–783 uses `font-mono` for the outer `<p>` wrapping human-readable prose: `Pass ... to use the preferred provider`. Per design rules, `font-mono` is for raw data only. The `InlineCode` children are correctly mono; the surrounding prose should be `font-sans`.
  ```tsx
  // L:777
  <p className="font-mono text-xs text-ink-500 ...">
  // fix: font-sans
  ```

- **L:1090** [LAYOUT] `ProviderStack` applies negative margin via class string interpolation `${i === 0 ? '' : '-ml-1'}`. `-ml-1` = -4px, which is on-grid. Fine, but the empty string for `i === 0` leaves the first avatar with no margin class — relying on default flow. This works but is fragile; explicit `ml-0` for the first item would be clearer.

- **L:1388–1390** [A11Y] `ProvidersTable` header has 8 `<TableHead>` cells, but the table has no `<caption>` or `aria-label` and no `aria-describedby` pointing from the section heading "Providers" (L:1245) to the table. For complex pricing tables, AT users benefit from a programmatic label.

---

## TokenSavings.tsx

### CRITICAL

_(none)_

### SERIOUS

- **L:199–216** [A11Y] The TTL `Select` at L:199 has no visible label — the descriptive `<p>` at L:192 (`"TTL"`) and the secondary copy at L:195 (`"How long cached entries live..."`) are not programmatically associated with the `SelectTrigger`. There is no `id`/`aria-labelledby` link. Screen readers will announce the trigger as just a combobox with no context.
  ```tsx
  // L:192 — label text exists visually but is not associated
  <p className="... text-ink-900 m-0">TTL</p>
  // fix: add id="ttl-select-label" to the <p>
  // and aria-labelledby="ttl-select-label" to <Select> or <SelectTrigger>
  ```

- **L:157–219** [STATE] Both `CachingCard` and `CompressionCard` fire `toast.success` immediately on toggle/change. Per WDG: "Submit button stays enabled until request starts; spinner during request." In a real implementation there would be a network call; immediately toasting on `onCheckedChange` without any async feedback (no `pending` state, no error path) is incomplete. Flagged as serious because the pattern will require rework when wired to a real API.

### MODERATE

- **L:85** [SPACING] `KpiTile` root div: `p-4` is correct (16px). However the `bg-card` div has no `rounded-*` class — it sits inside a `KpiRail` that may apply border/radius, but the tile itself should respect the card radius if the parent surface has rounded corners. Minor, depends on `KpiRail` implementation.

- **L:48–49** [TYPOGRAPHY] Page subtitle: `"Cache, compress and deduplicate to spend less per request."` Missing Oxford comma before "and" (style inconsistency with the rest of the app's copy). Minor.

- **L:239** [TYPOGRAPHY] Compression description: `"…(git diff, cargo, pytest…)"` — the `…` inside the parenthetical is correct typographically, but `pytest` is lowercase-first; all three tool names are raw identifiers and should arguably be in an `<InlineCode>` element to signal they are tool names, not prose words. Minor.

- **L:132–145** [A11Y] `CardChromeHeader` renders an `<h3>` for the card title. Both `CachingCard` and `CompressionCard` use this, producing two sibling `h3` elements. Verify the page heading hierarchy: `PageTitle` presumably renders `h1`, and there are no `h2` sectioning elements between the page title and these `h3` cards — a skipped level. If `KpiRail` has no heading, these `h3`s are at level 3 under an `h1` with no intervening `h2`.

---

## Clean

- `TokenSavings` Switch components correctly use `aria-labelledby` pointing to sibling `<p id="...">` elements (L:178, L:242) — no false flag.
- `Activity` table numeric columns all have `text-right whitespace-nowrap` — compliant.
- `Models` `CapabilityStrip` icon wrapper uses `role="img"` + `aria-label` — acceptable (see SERIOUS note about redundant `title`).
- `Models` `ProviderStack` uses `role="img" aria-label={ariaLabel}` on the container div — correct group semantics.
- `Models` `RowActionButton` at L:951 carries explicit `aria-label={`Inspect ${model.name}`}` — not flagged.
- `Models` `PlatformPanel` uses native `<button type="button">` elements — correct.
- Date formatting in `Activity` KPI display uses `fmtUsd`/`fmtTokens` helpers (locale-aware for number grouping) — partially compliant.
