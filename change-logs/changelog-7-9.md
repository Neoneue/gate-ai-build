# UI Changelog: 2026-07-09

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-7.md`](./changelog-7-7.md)

---

## Conventions

### Dark mode: `.dark` token theme + provider `12846e7`

**`src/index.css`, `src/hooks/use-theme.tsx`, `src/components/ui/theme-toggle.tsx`, `index.html`, `src/main.tsx`, `src/components/ui/sonner.tsx`, `src/layouts/DashboardChrome.tsx`, `src/components/ui/table.tsx`**

First dark theme. It is driven entirely by a `.dark` class on `<html>` that re-points the semantic tokens; no component reads a color directly, so surfaces that already use semantic utilities (`bg-card`, `text-foreground`, `border-border`, …) invert for free.

- **Token layer** (`index.css`): added a `.dark` block on the shadcn/Geist dark scale. Elevation is inverted vs. light (base is the darkest plane, raised surfaces step lighter): bg / sidebar `neutral-950`, card `neutral-900`, popover / muted / secondary `neutral-800`, accent (hover) `neutral-700`. Text: `foreground` white, `muted-foreground` `neutral-300`. Borders are translucent white (`border` white/10%, `input` white/15%) so hairlines read on any surface. Added `color-scheme` to `:root`/`.dark`, and a new `--surface-strong` / `--surface-strong-foreground` token pair for intentional dark surfaces (hero chart card, code cards) that stay dark in both themes.
- **Provider** (`use-theme.tsx` + `main.tsx`): `ThemeProvider` + `useTheme`. Binary light/dark, follows the OS preference until the user makes an explicit choice, persisted to `localStorage`.
- **No-flash**: a blocking inline script in `index.html` sets the class before React mounts.
- **Toggle**: top-bar sun/moon `ThemeToggle` reusing the sidebar toggle's icon cross-fade.
- **Sonner**: toasts track the active theme and route through `--popover` / `--border` instead of hardcoded neutrals.
- **Fixes surfaced by the change**: `DashboardChrome` content canvas `bg-neutral-50` → `bg-background` (was white in dark); shared `Table` header `bg-neutral-50` → `bg-muted` (sits one elevation step above the card in both themes).

Known follow-up: ~460 remaining raw color utilities (`text-neutral-*`, `bg-neutral-*`, `bg-white`) across pages/components do not invert yet; a semantic-token sweep is queued.

### Text-color token sweep — pass 1 `4249b81`

**~70 files across `src/pages` and `src/components/ui`**

App-wide pass 1: every **standalone** text color now uses the semantic tokens so it inverts in dark. `text-neutral-900/800` → `text-foreground`; `text-neutral-700/600/500/400/300` → `text-muted-foreground` (interactive hover/focus states brighten to `foreground`). ~297 swaps, run by three parallel agents plus a reconciling pass.

- Also retuned the light token: `--muted-foreground` `neutral-500` → `neutral-600` (darker/more legible muted text in light); dark stays `neutral-300`. Net pair: `foreground` = neutral-900 / white, `muted-foreground` = neutral-600 / neutral-300.
- `RequestDetailModal` message bodies promoted `neutral-700` → `text-foreground` (primary content, not muted).
- **Deferred to the surface pass** (text entangled with a raw background — must swap bg + text together): input/select/search controls (`bg-neutral-50`), the neutral `Badge` + count chips + `inline-code` (`bg-neutral-100`), the sidebar active-item chip, and the always-dark `code-card`/`code-panel` surfaces.

### Message bubbles lightened to `bg-card-muted` `978c62a`

**`src/components/ui/message-block.tsx`**

With the trace panels now `bg-card` (white), the default message bubble at `bg-muted` (neutral-100) sat one step too dark. Moved it to the `--card-muted` token (neutral-50 light / neutral-800 dark) — the card-wash level — so it reads a step lighter and stays a card-relative surface. Tinted (warn/danger) bubbles unchanged.

### Conversations trace panels get a `bg-card` body `afb819b`

**`src/pages/conversations/ConversationDetail.tsx`, `RequestTracePanel.tsx`**

The Messages and Request Trace panel wrappers had a `border` + `rounded-md` shell but no fill, so their bodies were transparent and showed the neutral-50 page canvas through — grey `bg-muted` message bubbles sat on a grey background. Added `bg-card` to both panel wrappers so each body is white; the muted bubbles now read cleanly against it.

### `--card-muted` token replaces the neutral-50 wash hardcodes `225d4e8`

**`src/index.css`, `table.tsx`, `segmented.tsx`, `segmented-pill.tsx`, `AuthLayout.tsx`, `DashboardChrome.tsx`, `Billing`/`BillingFree`/`Policies`/`onboarding-shared`, `design.md`**

The two prior fixes (`db93eeb`, `2e195c9`) restored the neutral-50 washes with hardcoded `bg-neutral-50 dark:*` classes. This replaces them with a proper token and narrows the scope so only card/table washes lighten — chips, avatars, and segmented tracks are untouched.

- New **`--card-muted`** token: neutral-50 (light) / neutral-800 (dark), an extension of `--card`, registered as `--color-card-muted` → `bg-card-muted`.
- Applied to: shared `TableHeader`/`TableFooter` and the bordered info-panels on Billing / BillingFree / Policies / onboarding (all neutral-50 washes the sweep had darkened to `bg-muted`).
- **`--muted` reverted to neutral-100**: chips, count pills, avatar/icon placeholders, and input fills keep their original fill — nothing else shifts.
- **`--background` is now canvas-only** (stays neutral-50 / neutral-950): the two segmented tracks and the `AuthLayout` spacer that had misused `bg-background` move to `bg-muted`, so no component rides the page-canvas token.
- `DashboardChrome` canvas + table header revert from the interim hardcodes back to the `bg-background` / `bg-card-muted` tokens.
- `design.md`: token table gains `--card-muted`, `--background` corrected to neutral-50, wash-surface note rewritten around the token.

### Light table column headers restored to neutral-50 `2e195c9`

**`src/components/ui/table.tsx`**

Same regression as the content canvas: the dark foundation swapped the shared `TableHeader` `bg-neutral-50` → `bg-muted`, darkening light-mode column headers neutral-50 → neutral-100. Restored to `bg-neutral-50 dark:bg-muted` (dark stays neutral-800).

### Light content canvas restored to neutral-50 `db93eeb`

**`src/layouts/DashboardChrome.tsx`**

The dark-mode foundation swapped the content canvas `bg-neutral-50` → `bg-background` so it would invert; in light mode that darkened the canvas neutral-50 → neutral-100 (rgb 251 → 245). Restored the original light value while keeping the dark inversion: `bg-neutral-50 dark:bg-neutral-950`. No light token resolves to neutral-50 (`--background` is neutral-100), so the explicit ramp pair carries the intended values.

### Code-snippet syntax legibility on dark `9e6f190`

**`src/index.css`, `src/components/ui/code-card.tsx`**

Code rendered on card surfaces (`TONE_CLASS_LIGHT`) used syntax colors tuned for white cards (blue-700 keys, success-700 literals, burnt-orange/amber keyword+variable hex), which read too dark on a `neutral-900` card in dark mode. The four `--color-syntax-*` vars now re-point to the ramp light-end in `.dark` (property → `blue-400`, terminal-blue → `success-400`, keyword + variable → lightened hex); the always-dark terminal (`TONE_CLASS_DARK`) only gets lighter, fine on its chrome. `TONE_CLASS_LIGHT.success` gains `dark:text-success-300`.

### Saturated colored text/icons + pro-CTA token parity `6e0b0b5`

**11 pages/components**

Saturated status text and colored icons (600–800) had no dark variant, so amber/green/blue read too dark on the dark canvas and tinted callouts. Body text → `dark:text-*-300` (ApiKeys warning callouts, `ConversationDetail` + `RequestTracePanel` trace tones, `SetupManual` success text); icons / link accents → `dark:text-*-400` (success check icons in ApiKeys / AuditRecordDialog / AuditTrail / SetupManual; blue feature/link accents in Policies, pro-upgrade-card, plan-comparison, onboarding, DashboardDefault). `Policies` "Pro plan protection" block now shares the Free-plan banner's color tokens: dropped the `bg-gradient-to-b from-blue-50 to-blue-25` (no dark variant, near-white in dark) for the banner's flat `bg-blue-25` + `dark:bg-blue-500/10` + `dark:border-blue-500/30`.

### Ultralight `-25` tint surfaces get dark variants `f818e9e`

**`RequestDetailModal`, `policies/config`, `Policies`, `pro-upgrade-card`, `design.md`**

The findings cards, policy action tone-chips, and blue callout `Card`s use an ultralight `bg-*-25` fill that the `-50/100/200` sweep did not cover, so they rendered as near-white boxes (white-on-cream, unreadable) in dark. Added dark variants: finding-card `bg-warning-25`/`bg-danger-25` active fills → `dark:bg-*-500/10` (+ `dark:hover:bg-*-500/15`); the `policies/config` flag/block tone map; the `Policies` scope `Card` and `pro-upgrade-card` `bg-blue-25` → `dark:bg-blue-500/10` + `dark:border-blue-500/30`. `design.md`'s status-tint convention table gains the `-25` ultralight-fill row.

### Surface sweep pass 3 — nav / calendar / pagination + page layer `38e46c0`

**29 files across `src/components/ui`, `src/pages`, `src/components/canvas`**

Phase B of the surface pass. The raw neutral surfaces and light status tints that pass 2 left on the nav / date / pagination primitives and across the page layer now map to semantic tokens, so the last non-inverting surfaces track `.dark`. Completes the color sweep (a full-tree re-scan is clean except deliberately-dark surfaces).

- **Nav / chrome primitives** — `sidebar` active-item + hover fills → `bg-accent` / `text-accent-foreground`, and the `from-neutral-100 to-neutral-50` active gradient is dropped for a flat `bg-accent`; `workspace-switcher`, `icon-action-button`, and the `alert-dialog` icon chip → accent / muted; `status-dot` neutral → `bg-muted-foreground`.
- **Calendar** — day hover → `bg-accent`, range fills → `bg-accent`, selected day `bg-neutral-900 text-white` → `bg-primary text-primary-foreground`, focus ring → `ring-ring`.
- **Pagination / tabs** — pager hover → `bg-accent`, active page `bg-neutral-800` → `bg-primary`; the `tabs` active underline `bg-neutral-900` → `bg-primary`.
- **Pages** — `bg-neutral-50`/`-100` fills → `bg-muted`, row/control hovers → `hover:bg-accent`, `border-neutral-300` hovers → `border-input`, small status dots → `bg-muted-foreground`: `Billing`, `BillingFree`, `ApiKeys`, `Models`, `Conversations`, `Security/EventsTable`, `RequestsTable`, `RequestDetailModal`, `RequestTracePanel`, `onboarding-shared`, `Artboard`, `policies/config`. `DashboardDefault` platform-card selected border → `border-foreground`, its count badges → `surface-strong`; `Policies` step-slider fills → `muted-foreground` + `border-ring`.
- **Status-tint callouts** gain `dark:` variants (ramp `-500/15` fill + `-300` text, per the design.md convention): `RequestDetailModal`, `ConversationDetail`, `ApiKeys`, `SetupManual`, `SetupCredits`, `SetupGateConnect`, `TokenSavings`, `pro-upgrade-card`, `Policies`, `message-block`.
- **Left intentional** (dark in both themes by design): dialog / sheet scrims, `code-card` terminal chrome, the `AuthLayout` dark login hero.

### Surface + tint token sweep — primitives (pass 2) `0a32743`

**16 primitives in `src/components/ui/` + `design.md`**

Pass 2 of the dark sweep. The remaining raw `bg-*` / `border-*` / `fill`/`stroke-*` neutrals and the light status tints on the shared primitives now map to semantic tokens, so inputs, badges, menus, charts, and inner-card chrome invert under `.dark`. The user-visible complaints (inputs, badges, dashed chart lines, inner cards, menus) all trace to these primitives, so each fix cascades app-wide.

- **Inputs / controls** — field wash `bg-neutral-50` retired to `bg-muted`: `Input`, `Textarea`, `InputGroup`, `SearchInput` icon, the `select-variants` trigger (+ `data-placeholder` text), `RadioGroup` unchecked fill. Disabled fills `bg-neutral-100` → `bg-muted`.
- **Menus / dropdowns** — highlight fills `bg-neutral-100` → `bg-accent` (`Menu` item, `Select` item, `MultiSelect` options); `MenuSeparator` `bg-neutral-200` → `bg-border`; the destructive menu item gains a dark tint fill + `text-danger-300`.
- **Badges / chips** — neutral `Badge` → `bg-muted` / `text-muted-foreground` / `hover:bg-accent`; the success / warning / danger / info status variants gain `dark:` tint variants (ramp mid at low alpha for the fill + `-300` text, mirroring the existing `dark:bg-destructive/20` idiom); `TabsCount`, `Tag`, `InlineCode` → `bg-muted`.
- **Charts** — `Chart` gridlines / tooltip cursor / reference lines `stroke-neutral-200`/`-400` → `stroke-border`, axis ticks `fill-neutral-500` → `fill-muted-foreground`, background sectors + tooltip-cursor rectangle `fill-neutral-100` → `fill-muted`. Fixes the dashed data / KPI gridlines that did not invert.
- **Inner cards** — `KpiRail` inset divider `before:bg-neutral-200` → `before:bg-border`; `CodeCard` header `bg-neutral-100` → `bg-muted`, tab hover `bg-white/60` → `bg-accent`, amber token-highlight gains a dark variant. The always-dark terminal chrome (`bg-neutral-800`/`-700`) is left intentional.

**`design.md`** — added the **Dark mode (`.dark` theme)** subsection under §2 Colors: the full light/dark token contract table, the `--surface-strong` pair, the raw→token surface map, the status-tint dark convention, and the kept-intentional list. Retired the `bg-neutral-50` field-wash "permitted exception"; updated the quick-reference (`--muted-foreground` neutral-600, dark-aware header) and the step-950 role. This is the tracked contract for the theme.

## Components

### Overview preview tables → shared primitives + `NavTableRow` `253c8c0`

**`src/pages/Dashboard.tsx`, `src/components/ui/table.tsx`, `src/components/ui/card.tsx`**

The Overview's three "Latest …" preview tables were hand-rolled `<table>`/`<thead>`/`<h3>` with raw neutral colors that did not invert in dark. Rebuilt on shared components; themed the primitives they rely on.

- `Dashboard.tsx`: `LatestRequestsTable` / `RecentConversationsTable` / `SecurityEventsTable` now compose `Card` + `CardTitle` + the shared `Table` primitives + `Badge`, wrapped in a local `PreviewCard` shell that DRYs the three identical card headers. Clickable rows use the new `NavTableRow`. Two intentional shifts from using the primitives: card titles move from `type-label-14` to the `CardTitle` voice (`type-heading-16`), and preview cells from 12px to the primitive's 14px.
- `table.tsx`: swept to semantic tokens — `TableCell` → `text-foreground`, `TableHead`/`TableCaption` → `text-muted-foreground`, `TableRow` hover/selected + `TableFooter` fills → `bg-accent`/`bg-muted`. Added `NavTableRow`: a keyboard-accessible clickable row (`role="link"`, `tabIndex`, `onClick`, Enter/Space) built on `TableRow`.
- `card.tsx`: `Card` base `text-neutral-900` → `text-card-foreground`; `CardDescription` `text-neutral-500` → `text-muted-foreground`. Light unchanged, dark fixed.

### Title + eyebrow primitives use semantic text tokens `ae3f47c`

**`src/components/ui/page-title.tsx`, `section-title.tsx`, `section-heading.tsx`, `eyebrow.tsx`**

`PageTitle` / `SectionTitle` / `SectionHeading` baked in raw `text-neutral-900`, and `Eyebrow` raw `text-neutral-500`, so titles and eyebrows rendered dark-on-dark in dark mode. Switched to `text-foreground` / `text-muted-foreground`. Light is identical (foreground=neutral-900, muted-foreground=neutral-500 in light); fixes every page title, section title, and eyebrow across the app in dark.

### Dark-mode fixes: segmented controls + monochrome vendor icons `2d0d7a1`

**`src/components/ui/segmented-pill.tsx`, `segmented.tsx`, `src/components/icons/vendor-meta.tsx`**

- Segmented tracks used raw `bg-neutral-100` (near-white in dark) → `bg-background`. The pill's active thumb `bg-card` → `bg-popover` so it sits one elevation step lighter than the card in dark (still white in light). The connected-variant active segment `bg-neutral-900`/`text-white` → `surface-strong` tokens.
- OpenAI and xAI brand marks used a fixed `#3D3D3D` and disappeared on dark; switched to `var(--foreground)` so the monochrome logos render near-black in light and white in dark. Colored brand marks (Anthropic, Gemini, etc.) unchanged.

## Sections
