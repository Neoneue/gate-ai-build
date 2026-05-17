# WDG audit — Group E (Billing, Team, Settings, DashboardChrome)

---

## Billing.tsx

### CRITICAL

**Billing.tsx:513–516 — hardcoded date strings, not `Intl.DateTimeFormat`**
```tsx
{ id: 'h-3', date: 'May 12, 2026', ... }
```
Rule: Dates/times must use `Intl.DateTimeFormat`. Hardcoded US locale strings break i18n and fail the anti-pattern list.
Fix: Store dates as ISO strings (`'2026-05-12'`), format at render with `new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(row.date))`.

**Billing.tsx:519–526 — hardcoded currency formatters, not `Intl.NumberFormat`**
```tsx
const fmtAmount = (n: number) => `+$${abs}`;
const fmtUsd = (n: number) => `$${n.toFixed(2)}`;
```
Rule: Numbers/currency must use `Intl.NumberFormat`. Raw template literals lock the USD symbol and period-as-decimal separator.
Fix: `new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', signDisplay: 'exceptZero' }).format(n)`.

**Billing.tsx:163–165 — `auto.topUp` and `auto.threshold` rendered directly into UI, not via `Intl.NumberFormat`**
```tsx
value={auto.enabled ? `+$${auto.topUp} below $${auto.threshold}` : 'Off'}
```
Same violation as above. Fix: format both numbers through `Intl.NumberFormat` currency style before interpolation.

### SERIOUS

**Billing.tsx:204–249 — toolbar hidden when empty, but `isEmpty` check fires on the wrong condition**
Per project rule, the toolbar should be hidden when the table is empty (empty state replaces it). Billing's `HistorySection` does not have a search toolbar, so this is not directly applicable there — but `CreditsCard`'s CreditStatRow for `Last top-up` at line 167 hardcodes `'May 12, 2026'` as a display string — same i18n violation as CRITICAL above (also affects `HISTORY_ROWS`).

**Billing.tsx:295–312 — `AddCreditsDialog` custom amount input: no `autocomplete` attribute**
```tsx
<Input id="add-credits-custom" type="number" inputMode="decimal" ... />
```
Rule: Inputs need `autocomplete`. A monetary input should carry `autocomplete="transaction-amount"` (valid autocomplete token for payment amounts) to prevent password-manager false-positive matching and align with the WDG forms rule.

**Billing.tsx:460–473 — `AutoRechargeDialog` save handler: no `aria-live` region for save confirmation**
The dialog closes on save with no toast or live-region feedback visible after close. Rule: async updates need `aria-live="polite"`. Wire a `sonner` toast on successful save so assistive technology announces the outcome.

### MODERATE

**Billing.tsx:91 — long paragraph, no `text-pretty` / widow guard on the plan description**
```tsx
<p className="font-sans text-sm text-ink-800 m-0 text-pretty">
```
`text-pretty` is present — passes. No finding.

**Billing.tsx:300 — straight apostrophe in prose copy**
```tsx
You'll be redirected to Stripe Checkout.
```
JSX string literal — the `'` is a straight ASCII apostrophe, not a curly right-single-quote (`'`). Rule: use curly quotes. Fix: `You&rsquo;ll` or `{'You’ll be…'}`.

**Billing.tsx:93 — `fmtUsd` used in `CreditsCard` hardcoded balance `$24.98`**
HeroNumeric at line 156 renders the string `"$24.98"` directly. This is a hardcoded display value that bypasses the i18n formatter rule (same class as the CRITICAL findings; flagged MODERATE because it is a single static demo value, not a formatted runtime value).

---

## Team.tsx

### CRITICAL

**Team.tsx:174–178 — hardcoded `joined` date strings, not `Intl.DateTimeFormat`**
```tsx
{ ..., joined: 'Apr 20, 2026' }
{ ..., joined: 'May 01, 2026' }
```
Store as ISO strings, format at render with `Intl.DateTimeFormat`.

**Team.tsx:356–358 — hardcoded `sent` and `expires` strings in `INVITATION_ROWS`**
```tsx
{ ..., sent: 'May 07, 2026', expires: 'in 6 days' }
```
`sent` needs `Intl.DateTimeFormat`. `expires` is a relative duration — use `Intl.RelativeTimeFormat` or a library (`date-fns/formatDistanceToNow`), not a hardcoded English string.

### SERIOUS

**Team.tsx:497–500 — `InviteMemberDialog` email error message does not include a fix/next step**
```tsx
<p id="invite-email-error">That doesn&apos;t look like an email address.</p>
```
Rule: error messages include fix/next step. Current copy states the problem only. Fix: `"Enter a valid email address, for example name@company.com."` — adds the example pattern the rule requires.

**Team.tsx:486–487 — invite email `Input` missing `name` attribute**
```tsx
<Input id="invite-email" type="email" value={email} onChange=... />
```
Rule: inputs need `autocomplete` and meaningful `name`. `autocomplete="off"` is present via `autoComplete="off"` but `name` is absent. Without `name` the field is not associated with the form's `FormData` and some AT combinations lose the field label association. Fix: `name="email"`.

**Team.tsx:508–510 — `SelectTrigger` for role in `InviteMemberDialog` has `id="invite-role"` but Base UI Select may not forward `id` to the trigger's underlying button**
The `Label` at line 505 uses `htmlFor="invite-role"`. If Base UI's `SelectTrigger` does not forward `id` to its trigger element, the label-to-control association breaks. Fix: verify forwarding or replace with `aria-labelledby` on the trigger pointing at the label's `id`.

### MODERATE

**Team.tsx:663–668 — `Avatar` marked `aria-hidden`; name and email are in adjacent `<span>` — correct. No finding.**

**Team.tsx:315–316 — `Joined` date column rendered with `font-mono` and `tabular-nums`**
Joined dates are human-read strings, not numeric data. Per project rule `font-mono` is for raw data only. Fix: render with `font-sans text-sm text-ink-800` (same as the Role/Email data columns).

**Team.tsx:405–406 — `expires` column in Invitations table: `font-mono tabular-nums` on a relative-duration string (`'in 6 days'`)**
Same violation — relative duration is prose, not numeric. Fix: `font-sans text-sm text-ink-800`.

**Team.tsx:122 — long description paragraph missing explicit `id` / `aria-describedby` link to `PageTitle`**
Not a hard failure but the `<p>` subtitle and `<PageTitle>` have no programmatic relationship. Minor.

---

## Settings.tsx

### CRITICAL

*(none)*

### SERIOUS

**Settings.tsx:79–87 — `ProfileCard` form: no `beforeunload` guard or router-leave warning for unsaved changes**
Rule: warn before navigation with unsaved changes. When `dirty === true` and the user clicks a sidebar nav item, the unsaved profile edits are silently discarded. Fix: add a `useEffect` with `window.addEventListener('beforeunload', handler)` when `dirty`, or use react-router's `useBlocker` to prompt on navigation.

**Settings.tsx:196–200 — `FormField` component: `spellCheck={false}` applied to all fields including `Display name`**
Rule: disable spellcheck on emails, codes, usernames — not display names. A user's display name is free-form natural language and benefits from spellcheck. Fix: thread a `spellCheck` prop through `FormField`, default `false` only for `email`, set `true` (or omit) for `displayName` and `organization`.

### MODERATE

**Settings.tsx:147–155 — Reset button: `variant="outline"` + `disabled={!dirty}` is correct, but no tooltip or visible label explaining what Reset does**
A blind user or first-time visitor pressing Tab will hear "Reset, button, dimmed" with no context on what is reset. Fix: add `title="Revert to last saved values"` or a visible hint text, or ensure the button label is self-evident in context (consider changing label to `"Discard changes"`).

**Settings.tsx:248–250 — `Eyebrow` used for `Registered passkeys` subsection header inside a card body**
Per project rule, `Eyebrow` is for KPI-tile chrome strips above hero metrics. Content card subsections use sans medium text or `<h4>`. Fix: replace `<Eyebrow>` with a `<p className="font-sans text-xs font-medium uppercase tracking-wide text-ink-500">` if the uppercase recipe is intentional, or a styled `<h4>`.

---

## DashboardChrome.tsx

### CRITICAL

*(none)*

### SERIOUS

**DashboardChrome.tsx:45 — `bg-white` hardcoded on the root shell div**
```tsx
<div className="flex flex-col w-full h-screen overflow-hidden bg-white">
```
Rule: use semantic tokens. `bg-white` bypasses the design token system and breaks dark-mode theming. Fix: `bg-background` (the `--background` CSS variable maps to white in light mode and adapts in dark). Same issue at line 84 on `DashTopBar`'s container.

**DashboardChrome.tsx:84 — `bg-white` on `DashTopBar` div (second instance)**
```tsx
<div className="flex items-center ... bg-white border-b border-border shrink-0">
```
Same fix: `bg-background`.

### MODERATE

**DashboardChrome.tsx:125–128 — `Docs` button has no `href` / `<a>` — it is a `<Button>` with an `ExternalLink` icon but no navigation target**
```tsx
<Button variant="outline" size="sm">
  Docs
  <ExternalLink data-icon="inline-end" aria-hidden />
</Button>
```
Rule: use `<a>`/`<Link>` for navigation, not `<button>`. An external link affordance (`ExternalLink` icon) on a `<button>` element breaks Cmd+click, middle-click, and tab-to-open behaviours. Fix: render as `<Button asChild><a href="https://docs.…" target="_blank" rel="noopener noreferrer">…</a></Button>` or add an `onClick` + `window.open` as an interim measure and file a follow-up to convert to `<a>`.

**DashboardChrome.tsx:44 — no skip-navigation link**
Rule: include skip link for main content. The layout shell is the right place to insert `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>`, and give the content pane at line 65 `id="main-content"`.

---

## Clean

- `DashTopBar` sidebar toggle: icon-only button has correct `aria-label` (line 89), `aria-expanded` state, and contextual cross-fade — no finding.
- `Notifications` button: correct `aria-label` (line 134) — no finding.
- `RowActionsMenu` trigger: `aria-label` is programmatically generated per row name/email (lines 336, 416) — no finding.
- `AddCreditsDialog` preset tile radiogroup: correct `role="radiogroup"`, `role="radio"`, `aria-checked` on each tile (lines 238–265) — no finding.
- `AutoRechargeDialog` switch: labeled via `aria-labelledby` pointing at `ar-enable-label` (line 369) — no finding.
- `InviteMemberDialog` email input: `aria-invalid` + `aria-describedby` wired to error paragraph when invalid (lines 493–494) — no finding.
- `MembersPane` search input: `aria-label="Search members"`, `autoComplete="off"`, `spellCheck={false}` — no finding.
- Dialogs use shadcn `DialogTitle` + `DialogDescription` — correct semantic structure — no finding.
- All table columns carry `whitespace-nowrap`; numeric columns carry `text-right tabular-nums` — no finding.
- All icon-only decorative icons carry `aria-hidden` — no finding.
- `transition-[opacity,transform,filter]` in sidebar toggle cross-fade is explicit (not `transition: all`) — no finding.
- `motion-reduce:transition-none` / `motion-reduce:animate-none` gates present in both icon cross-fade and `RowActionsMenu` popup — no finding.
- `border-border` used throughout (no raw `border-ink-N` values) — no finding.
