# UI Changelog: 2026-06-22

Running log of UI changes for 06-22. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-19.md`](./changelog-6-19.md).

---

## Conventions

### Design values are a closed set: token guard + heading scale `7cd5528`

- New `npm run lint:design` (`scripts/check-design-tokens.mjs`) fails the build
  on invented colors (`*-[#…]` / `rgb` / `oklch` / …) and literal `text-[Npx]`
  sizes; wired into `npm run lint`. Rule codified in
  `.claude/rules/design-tokens.md` and surfaced in `CLAUDE.md`.
- Heading scale shifted in `design.md`: `h3` is now the 20px section-title voice
  (was 18px) and the 18px card-title voice moves to `h4`.

---

## Components

### SectionTitle primitive + CardTitle `as` prop `7cd5528`

- New `section-title.tsx`: single source of truth for page-level section titles
  (`m-0 font-medium font-sans text-neutral-900 text-xl/7`, 20/28). Renders
  `<h3>`; `as` overrides the level without changing the voice. Distinct from
  `SectionHeading` (text-sm, modal body sections).
- Adopted across Overview(default) / Requests / Conversations / Security /
  AuditTrail(+Merkle) / TokenSavings / Dashboard, replacing hand-rolled
  `text-xl/7` and `text-lg/6` headings.
- `CardTitle` gains an `as` prop (default `<h3>`) so card titles can follow the
  document outline without changing the voice.

### Audit record modal: accurate seal comment + Open Explorer as link `c01770e`

- `AuditRecordDialog.tsx`: the verified-seal comment claimed the asset renders at
  `h-8` (32px); corrected to `h-6` (24px) to match the actual `<img>`.
- Footer "Open Explorer" changed from a `<button>` to a real `<a>` (href to the
  Digital Evidence explorer, `target="_blank"`, `rel="noopener noreferrer"`) via
  Base UI `nativeButton={false}`, so it carries link semantics.

### Audit trail Filters: checkbox multiselect `33364fa`

- New `MultiSelect` (`multi-select.tsx`) replaces the two Base UI `Select multiple`
  controls (Member, Event type) in the Filters modal. Built on Popover + our
  Checkbox: a `(Select All)` row (binary: empty or checked, no indeterminate
  state) with a bottom divider, then checkbox rows.
- Row hover: `neutral-100` via the built-in `hover:` variant. Before, rows used
  `hover-fine:bg-neutral-50`; the project's `hover-fine` custom variant emits an
  empty rule (inline `@custom-variant` form cannot combine a media query with
  `&:hover`), so hover never showed. `hover:` is already gated behind
  `@media (hover: hover)` in Tailwind v4.
- Trigger mirrors `SelectTrigger` via `selectTriggerVariants`, extracted from
  `select.tsx` into `select-variants.ts` so component files only export
  components (react-refresh/only-export-components).
- Search input is built in but disabled for now (the Member field no longer
  passes `searchable`).

### Audit trail: fingerprint info tooltip `1e3d6e7`

- Added a shared `FingerprintInfoTooltip` (Info icon + Base UI `Tooltip`) beside
  the "Last fingerprint" KPI tile title and the Fingerprint table column header,
  with a plain-language explanation living in one component. Added an optional
  `titleInfo` slot to `KpiTile` to host the icon next to the title.

### API Keys Manual card: copy button anchor + tabs gap `f00ae42`

- `ConnectTabs` (floatingCopy): the conditional class concatenated into
  `gap-0relative`, so `relative` never applied and the Copy code button had no
  positioned ancestor (it anchored to the viewport bottom). Switched to `cn()`
  so `relative` applies (button now anchors to the snippet card) and the
  intended `gap-0` overrides the Tabs base `gap-2`.
- That removed an 8px gap below the tab row; the Manual code area went 208px →
  216px so the card height holds at 314px. Only the `floatingCopy` card was
  affected; other `ConnectTabs` usages already had `gap-0` working.

### Audit trail Filters: Export dropdown `7deb172`

- New Export control after the Filters button (`AuditTrail.tsx`): icon + "Export"
  + chevron, opening a menu with `Export as PDF` / `Export as CSV` (Base UI
  `Menu`). Menu aligns to the right edge of the trigger (`align="end"`).
- Disabled when the table has no rows to export, reusing the existing
  `isEmpty = filteredRows.length === 0` so it stays in sync with the empty state.
- Removed the page-header "Export view" button (superseded by this toolbar menu).

### Empty state: title grouped with copy `0500d34`

- `EmptyState` primitive: title + body wrapped in their own `flex-col` at `gap-3`,
  outer container at `gap-4`. Before, all children sat at a uniform `gap-3` with
  the action offset by `mt-1`. Now icon-to-title and copy-to-action read looser
  than the tighter title-to-copy pairing. Applies to every default-state card via
  `TableEmptyState`.

## Sections

### Audit trail: benefit-led page subtitle `33364fa`

- `AuditTrail.tsx` subtitle rewritten from the technical "Every model call gets a
  cryptographic receipt. Receipts are fingerprinted to Constellation's Digital
  Evidence layer on a public chain…" to "A tamper-evident record of every
  request, response, and policy decision the gateway handled. Investigate exactly
  what happened, and let anyone verify it independently."
- Leads with what the page does and the user benefit instead of the mechanism;
  grounded in the Audit Trail PRD (scope, developer use, independent
  verification).

### Audit trail: redacted descriptions + empty-state copy `7deb172`

- `audit-trail.ts`: the revoked-key event showed a raw key id; redacted to
  `API key <API_KEY> revoked` (Requests placeholder convention). Removed the
  "Passthrough tokens require explicit X-Gate-Upstream-Url header." sentence from
  the two `Request error` descriptions.
- Empty-state body rewritten from "Requests, policy decisions, and limit checks
  will appear here as your workspace routes traffic." to "No events match your
  current search or filters. Clear them to see the full audit trail." The state is
  only reachable via search/filters, so it now points at the Clear filters action.

### Default Overview: Get started hero rebuilt `7cd5528`

- `DashboardDefault.tsx`: the old `HeroCard` is replaced by `OverviewHeroCard` —
  a "Get started" section (`SectionTitle as="h2"`) wrapping a flush card with a
  numbered "1 · Create your first API key" block (Create key + Read API docs)
  and a `FirstRequestInfo` footer pairing an Automatic (Gate Connect) and Manual
  (code tabs) setup card. "Activity This Week" now uses `SectionTitle as="h2"`.

### Requests findings: credential rule labeled credential-scanner `e4742f8`

- `requests.ts`: the OpenAI/AWS credential findings showed recognizer-specific
  rule strings ("OpenAI API key", "AKIA[0-9A-Z]{16} + Shannon entropy >= 4.5
  bits/char"); the visible `rule` is normalized to `credential-scanner` across
  all occurrences, matching the Credentials-findings doc.

### Policies: card redesign + sensitivity slider, mirrored across tiers `0ab29d7`

- `Policies.tsx` policy cards reworked and `PoliciesFree.tsx` now renders the
  shared page with `variant="free"`. Both tiers: header enable Switch → a
  collapse chevron; the enable toggle moves into an in-body card (first panel);
  Action on detection + Sensitivity/Scan direction render as flat stacked
  panels (was a 2-column grid); the option panels dim + disable when the enable
  toggle is off.
- Sensitivity: the segmented Low/Medium/High pills → a trade-off slider — a
  gray rail with a solid black sliding thumb that glides between stops on the
  strong `ease-out` curve (`transition-[left]`/`[width]`, 200ms), passed stops
  fill gray, stops grow on hover. Values/captions unchanged.
- New shared `DetailCard` (info chip + title + description) summarizes the
  current selection under both Sensitivity ("{level} sensitivity") and Scan
  direction ("Output/Input/Bidirectional scanning"); scan-direction copy is now
  dynamic per selection and verified against the Security PRD (output on by
  default, input opt-in). Credentials policy copy reconciled to output-default.
- Action option cards: selected/hover fills now use the action's `-25` tone
  (Flag warning, Block danger; Redact stays neutral) with a lighter active
  border on hover, and option descriptions bumped `text-xs` → `text-sm`.
- Nested radii made concentric (card 8 → panel 6 → control 4); page content
  capped at `xl:max-w-5xl`; header subtitle widened to `max-w-2xl`.
- Free-only divergence (via the `variant` seam): prompt-injection enable card
  is titled "Enable lightweight Regex scanning" with a `BASIC` badge and drops
  its Action + Sensitivity panels (replacement card pending); Pro shows "Enable
  Prompt injection detection" with no badge and keeps the panels.

### Policies: scan-direction detail card gains a directional arrow `a1aa888`

- `DetailCard` gains an optional `icon` prop (defaults to `Info`). The Scan
  direction card now swaps the info glyph for a horizontal boundary-crossing
  arrow matching the selection: Output `ArrowRightFromLine` (`|→`, leaving),
  Input `ArrowRightToLine` (`→|`, arriving), Both `ArrowLeftRight` (`↔`). Reads
  as request flow through the gateway. (Initial vertical arrows read as
  upload/download and were rejected.) Sensitivity card keeps `Info`.

### Policies: typography rhythm + micro-interaction polish (Free + Pro) `41dbb9a`

- `Policies.tsx` heading hierarchy tuned for readability across both variants:
  policy titles now `text-lg/7` (18px), policy subtitle copy `text-base` (16px),
  and panel/helper copy stays `text-sm`/`text-sm/5` (14px tier).
- Free prompt-injection toggle card copy updated to plain-language onboarding
  text: title `Enable free Regex scanning` with helper
  `Lightweight free-tier scanning that checks for common prompt injection patterns.`
- Collapse chevron trigger now uses `active:scale-[0.96]` (was 0.98) and gains
  an expanded hit target via `after:-inset-2` so the interactive area meets the
  40×40 guidance without changing the visual icon size.
- Policy card `<h3>` titles now include `text-balance` to reduce awkward wraps
  on longer labels.

### Policies: semantic heading/label/copy type roles `a9643d7`

- Added reusable typography role utilities in `src/index.css` to mirror a
  Vercel-style semantic system: `type-heading-18`, `type-heading-16`,
  `type-label-16`, `type-label-14`, `type-label-12`, `type-copy-16`,
  `type-copy-14`, `type-copy-14-tight`, `type-copy-12`.
- `Policies.tsx` now consumes those role classes instead of page-local
  typography mixes (`text-lg/7`, `text-base/6`, `text-sm`, etc.) for policy
  titles, section headings, option labels, and helper/body copy. Visual output
  stays the same while naming/usage is standardized.

### Policies (Free): Pro upsell panel added + iterated to match comp `a9643d7`

- Added a Free-only prompt-injection upsell panel under the "Enable free Regex
  scanning" card in `Policies.tsx` (`variant === "free"` + policy id seam).
- Panel now follows the comp structure: headline + inline `PRO` badge, concise
  explainer copy, and a 2-column benefits grid (6 items total):
  Indirect injection, Obfuscated attacks, Goal hijacking, Jailbreak patterns,
  Choose what happens when caught, Tunable sensitivity.
- Tunable sensitivity copy corrected to
  `Low, Medium, or High sensitivity per workspace`.
- CTA uses the same modal-upgrade flow wiring as Billing (`PlanComparisonDialog`
  + `onUpgrade` route to `/billing`) with a single `Upgrade to Pro` action.
- Spacing tuned to reduce cramping while preserving page rhythm:
  extra 8px between subtitle and benefits grid, increased row/item breathing in
  the benefits list, and heading/subtitle kept on the page-standard `gap-1`.

### Token: blue-25 surface tier for subtle upsell fills `a9643d7`

- Added `--color-blue-25` in `src/index.css` and consumed it via `bg-blue-25`
  on the Free prompt-injection Pro upsell panel to keep the surface tint in the
  token system (no ad-hoc color values).

### Cross-page typography consistency sweep (Requests + Security) `a9643d7`

- `Security.tsx`: page subtitle moved to `type-copy-16`; filter modal labels
  (`Type`, `Action`, `Key`) moved to `type-label-14 text-neutral-600`.
- `Requests.tsx`: page subtitle moved to `type-copy-16`; filter modal labels
  (`Model`, `Key`, `Response`, `Guardrail`) moved to
  `type-label-14 text-neutral-600`.
- Goal: keep `Policies` from becoming a one-off by applying the same semantic
  heading/label/copy role classes on adjacent high-traffic pages.

### Project-wide typography sweep + role expansion `0477a15`

- Expanded semantic type-role utilities in `src/index.css` to mirror the wider
  Vercel naming model:
  `type-heading-24/20/18/16/14`,
  `type-label-20/18/16/14/13/12`,
  `type-copy-24/20/18/16/14/14-tight/13/12`.
- Updated `design.md` semantic type-role table to include the expanded set and
  keep docs aligned with implementation.
- Ran a project-wide mechanical pass across `src/**/*.tsx` replacing repeated
  raw typography mixes with semantic role classes where the mapping was direct
  and low-risk (page subtitles, form/filter labels, helper copy, recurring
  card/list text treatments in pages and primitives).
- Verification: `npx tsc -b` passes after the sweep; no linter diagnostics on
  touched files.

### Policies (Free): Upgrade CTA sm + card title/subtitle revert `5c119be`

- `ProBenefitsCard` Upgrade button: `default` → `size="sm"`, icon 16 → 14px.
- `PolicyCard` outer title: `type-heading-18` → `type-heading-16` (18 → 16px).
- `PolicyCard` subtitle: `type-copy-16` → `type-copy-14` (16 → 14px).

### Overview-first semantic type-role adoption `0477a15`

- Started the route-by-route rollout with Overview surfaces:
  `Dashboard.tsx` and `DashboardDefault.tsx`.
- Replaced safe, 1:1-equivalent typography recipes with semantic role classes
  only where the mapping was exact and low-risk (table header labels, small
  supporting copy, section headlines, and explanatory copy blocks).
- Explicitly avoided ambiguous typography spots where a role swap could alter
  metrics; those remain for manual review before broader replacement.
- Validation: `npx tsc -b` passes after the Overview pass; no linter diagnostics
  on touched Overview files.
