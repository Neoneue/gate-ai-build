# UI Changelog: 2026-06-25

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-24.md`](./changelog-6-24.md)

---

## Conventions

### Spacing relaxed to a 4px grid `20627e3`

**`.claude/rules/design-tokens.md`, `feedback_4px-grid` memory**

- Retired the old "layout spacing is 8px-only" rule. Spacing (gap/padding/margin) is now any **4px multiple** — `gap-3` / `p-3` (12px) are allowed.
- Still banned: the `*.5` utilities (`gap-0.5`, `mt-1.5`, `px-2.5` = 2/6/10px), which break the 4px unit.

### Semantic text tokens site-wide `928999a`

**32 files across `src/pages` + `src/layouts`**

- Migrated raw neutral text ramps to the semantic token layer: `text-neutral-500/700/800` → `text-muted-foreground` / `text-foreground`. No visual change intended; binds visible text to tokens instead of the ramp.

### `blue-25` documented `20627e3`

**`design.md`**

- Added `blue-25: oklch(0.985 0.010 268.85)` to the color block (already defined in `index.css:46`; the doc just omitted it). Used as the Pro card gradient floor.

## Components

### Advanced compression bullet checks softened `166b7bd`

**`src/pages/TokenSavings.tsx`**

- Advanced compression bullet checks now use `bg-blue-100 text-blue-700` (soft) on both plans, instead of solid `bg-blue-600` on Pro. Keeps the saturated CTA button as the single loudest element rather than competing with a mass of solid-blue check dots.

### `lg` switch size `cbbefe0`

**`src/components/ui/switch.tsx`**

- Added a third size, `lg` — track `h-6 w-10` (24×40px), knob `size-5` (20px), reusing the proven `calc(100%-2px)` thumb travel so the geometry matches the `default` switch scaled up (~1.67:1 proportion).
- Additive only; `default` (32×20) and `sm` (24×14) are unchanged.
- Applied `size="lg"` to every `<Switch>` in the app: Token Savings (Compression, Caching), Policies (in-body enable), Billing + BillingFree (auto-renew).

## Sections

### Billing modal width fixed at 500px `cbbefe0`

**`src/pages/Billing.tsx`, `src/pages/BillingFree.tsx`**

- The Auto-recharge and Add-credits dialogs were capping at 384px in the `sm` breakpoint range: the `DialogContent` base ships `sm:max-w-sm` (384px), and the className override (`max-w-[500px]` / `sm:max-w-[500px] md:w-[500px]`) only won at `md+`.
- Fixed with an inline `style={{ width: "calc(100% - 2rem)", maxWidth: 500 }}` — inline style beats the base class at every breakpoint, so the modal is a fixed 500px and only shrinks (viewport − 16px gutters) on a phone. Verified 500 at 1492/700px, 328 at 360px.

### Token Savings plan-card figure + footer copy `cbbefe0`

**`src/pages/TokenSavings.tsx`**

- Basic plan "~8% smaller requests" figure recolored to `text-success-700` (green), mirroring the Advanced card's `text-blue-700` accent.
- Advanced footer tail copy shortened to "…, increasing with heavier workloads."

### Auto-recharge enable card: drop gray fill `e788311`

**`src/pages/Billing.tsx`, `src/pages/BillingFree.tsx`**

- Removed `bg-neutral-50` from the top "Enable auto-recharge" card in both auto-recharge dialogs; it now sits flush on the white dialog surface (border + padding retained). The other gray cards in each modal are unchanged.

### Token Savings compression polish + plan-gating `20627e3`

**`src/pages/TokenSavings.tsx`, `TokenSavingsFree.tsx`, `TokenSavingsDefault.tsx`**

- Plan-gated the Basic compression card via a `plan` prop: Free (`plan="free"`) shows both Basic + Advanced; Pro shows Advanced only, full-width.
- Stacked the two compression cards vertically (`grid-cols-1`) and set the gap between them — and between the Caching subcards — to `gap-3` (12px).
- Promoted the savings figure: dropped the "Real traffic:" label and trailing copy; the percentage is now a `font-mono tabular-nums` numeral at `text-base` (16px) in the accent color (green Free / blue Pro), matching the dashboard's KPI-numeral convention. Promotes by typeface + color, not size, so it doesn't outrank card titles. Values: Free "4% smaller requests", Pro "~25% smaller requests (up to ~30%)".
- Bullet list: hid the per-item subtext (`hidden`, not deleted), switched to a 2x2 grid, and fixed check-icon/title alignment (`items-center`, dropped the off-grid `mt-0.5`) now that rows are single-line.

### Policies: collapse by default + CTA bullet weight `20627e3`

**`src/pages/Policies.tsx`**

- Scan cards now start collapsed on every load (`expanded` initial state `false`); users expand the ones they want to tune.
- Pro plan protection CTA: bullet titles changed from `type-label-14` (medium) to `type-copy-14` (regular) so they stop competing with the `type-heading-16` card title.

## Pages

### Overview-default onboarding flow rebuilt + setup subpages `9c7281d`

**`src/pages/DashboardDefault.tsx`, `src/pages/onboarding-shared.tsx` (new), `src/pages/SetupConnect.tsx` (new), `src/pages/SetupGateConnect.tsx` (new), `src/pages/SetupManual.tsx` (new), `src/pages/SetupCredits.tsx` (new), `src/pages/SetupModels.tsx` (new), `src/App.tsx`**

- Replaced the `/overview-default` get-started hero (`OverviewHeroCard` + `FirstRequestInfo`, now removed) with a new `GetStartedCard`: a two-step progress rail ("Connect a tool" → "First request") above two routing outcomes — "Use my existing subscriptions" (BYOK, featured blue) and "Pay as you go" (PAYG, green). The lower "Activity This Week" empty-state section (KPI strip + chart + tables) is unchanged.
- New shared module `onboarding-shared.tsx` owns the flow primitives so the card and subpages can't drift: `ChoiceCard` (tokenized blue/success/neutral icon chip; featured = `border-blue-200` + `from-blue-50 to-blue-25` gradient, matching the Pro/Token-Savings upsell treatment), `SetupScaffold` (default-tier `DashboardChrome` + centered column + back breadcrumb + title/subtitle), `SetupBackLink` (RequestsFindings breadcrumb pattern), and `WaitingStrip`.
- Five dedicated onboarding subpages, all routed under `-default` so the sidebar keeps the new-workspace locks (`isDefaultSurface`): `/setup-connect-default` (Pick how to connect), `/setup-gate-connect-default` (Gate Connect 3-step, reuses the exported `DownloadGateConnectDialog`), `/setup-manual-default` (create-key reveal + tool tabs/snippet; billing mode fixed via `?bill=byok|payg`, no in-page toggle), `/setup-credits-default` (PAYG top-up), `/setup-models-default` (pooled pricing table via `VendorAvatar`/`VENDOR_META`).
- Multi-level back stack preserved per the concept: Gate Connect → Connect options → Overview; Manual (BYOK) → Connect options; Manual (PAYG) → Overview; Credits/Models → Manual (PAYG). The Manual "Change" link re-enters the prior decision point.
- `DownloadGateConnectDialog` is now exported from `DashboardDefault.tsx` for reuse; `CodePanel` / `ConnectTabs` exports are unchanged. Verified clean: `tsc -b`, `lint:design`, and a full browser walk of both branches (no console errors).

### Token Savings copy + KPI cleanup (post dev-sync) `2dde112`

**`src/pages/TokenSavings.tsx`**

- Removed the Basic compression card's `4% smaller requests` KPI headline (per dev-sync: focus the Free view on the Pro upgrade path).
- Advanced KPI headline: dropped the `· up to ~25%` ceiling and the color/size emphasis — now `~20%` (neutral `text-foreground`, one step smaller at `text-xl`) + caption `smaller requests on average`, per Chad's note to add an "average" indicator and avoid overpromising. The headline now renders on the Free (CTA) version only; on Pro it's dropped since the user already has the capability.
- Compression subtitle now carries Alex's no-quality-impact assurance: `Shrink prompts before they reach the provider, without affecting the model's output.`
- Caching subtitle: removed the inaccurate similarity claim — `Reuse identical or semantically similar responses` → `Reuse identical responses.` (matches the card's identical-dedup behavior + dev-sync decision).

### Overview Get-started card: CTA + supports treatment `9c7281d`

**`src/pages/DashboardDefault.tsx`, `src/pages/onboarding-shared.tsx`**

- Both Get-started choice cards now use primary CTAs via a new `ChoiceCard` `ctaVariant` prop (defaults to `outline`, so `SetupConnect`'s cards are unchanged). PAYG CTA relabeled `Get started`.
- `ChoiceCard` `supports` box restyled from grey `bg-muted` fill to an outlined card (`border border-border bg-card`); the PAYG card's supports box was removed (kept only on the BYOK card).

### Terminal-period convention codified + swept site-wide `2dde112`

**`design.md` (Voice & Content), + `src/pages/*`**

- Codified the rule: complete descriptive sentences (page subtitles, card/section `description`s, step/list body copy, helper paragraphs, tooltip prose) take a terminal period — even one-line imperatives; terse fragments (titles, labels, button/tab text, eyebrows, KPI values + captions, badges, table headers) do not.
- Applied to Token Savings (Compression + Caching subtitles) by hand, then swept the remaining 55 page files via 6 parallel agents. Edits: `Upgrade.tsx` (+4), `plan-comparison-dialog.tsx` (+3), `plan-comparison-dialog-pro.tsx` (+3), `DashboardDefault.tsx` (+4 incl. download specs), `Settings.tsx` (−1: topic-list subtitle is a fragment). All other pages were already compliant. Verified: `tsc -b` + `lint:design` clean.

### Overview-default: onboarding-first empty state `ddbb5fe`

**`src/pages/DashboardDefault.tsx`**

- Replaced the "Overview" page title + monitoring subtitle with a promoted onboarding header matching `SetupScaffold`: `PageTitle` "Choose how to use Gate" + subtitle "Keep your existing subscriptions, or run models as you go. Switch anytime."
- `GetStartedCard` now mirrors the "Pick how to connect" layout — choice cards only (no step rail, no in-card intro paragraph). Card titles/CTAs relabeled: "Keep my existing subscriptions" / "Keep my subscriptions" and "Run models as you go" / "Run as you go".
- Hid the always-empty Activity This Week section (KPI strip + usage chart) and the three preview tables (Latest requests / conversations / security events) so the first screen reads as a single clear decision.

### Gate Connect setup steps + inline create-key modal `ddbb5fe`

**`src/pages/SetupGateConnect.tsx`**

- Replaced the three steps with "Download the app", "Create an API key", and "Send your first request" (was Sign in / Flip the switch on).
- Step 2 opens the shared `CreateKeyDialog` + `KeyCreatedDialog` from API Keys inline — no redirect to `/api-keys-default`. The listening strip moves to step 3 after the key is saved.

### Overview PAYG card: model breadth supports strip `ddbb5fe`

**`src/pages/DashboardDefault.tsx`**

- Restored the outlined `supports` box on the "Run models as you go" choice card, mirroring BYOK: vendor avatars + flagship names (Claude, GPT, Gemini) and "and more." — concrete breadth without claiming "hundreds" ahead of the catalog.

### BYOK manual config snippets — agent settings format `ddbb5fe`

**`src/pages/DashboardDefault.tsx`, `src/pages/SetupManual.tsx`**

- Replaced stale SDK sample code (Anthropic/OpenAI/OpenClaw imports) with the gateway devs' BYOK configs: Claude Code `settings.json`, Codex `config.toml` (+ credential-helper comments), OpenClaw `openclaw.json` + `.env` notes. Uses production `gateway.constellationgate.ai` for BYOK paths.
- Tokenizer: `#` line comments (Codex TOML). Manual setup BYOK keeps `ConnectTabs` locked to BYOK with the mode strip hidden (billing path is already chosen upstream).

### PAYG agent configs + Hermes tab `ddbb5fe`

**`src/pages/DashboardDefault.tsx`, `src/pages/Models.tsx`**

- Replaced stale PAYG shell-export snippets with live agent configs (Claude `settings.json`, Codex `config.toml`, OpenClaw `openclaw.json`, Hermes `config.yaml`) via shared `paygConfigSnippet()` — production gateway, model handle interpolated on setup/model detail.
- `PaygToolConfigCard`: OpenCode → **Hermes** tab with lucide `Bot` icon; per-tab captions match live site.
- Moved the shared snippet + captions (`paygConfigSnippet`, `PAYG_TOOL_CAPTIONS`, `PaygToolId`) out of `DashboardDefault` into a component-free `src/pages/payg-config.ts` so `Models` / `SetupManual` import one source without tripping `react-refresh/only-export-components`.

### Overview PAYG card title aligned with setup page `9b73781`

**`src/pages/DashboardDefault.tsx`**

- Choice card title "Run models as you go" → "Run models pay-as-you-go" (matches `/setup-manual-default?bill=payg` scaffold).

### Policies Free Pro-benefits CTA: soft blue check icons `aa66835`

**`src/pages/Policies.tsx`**

- `ProBenefitsCard` benefit checkmarks: `bg-blue-600 text-white` → `bg-blue-200 text-blue-800`, so a column of solid-blue dots stops competing with the card's CTA.

### Manual setup: progressive-reveal step gating `014ddfe`

**`src/pages/SetupManual.tsx`**

- Steps dim (`opacity-50 pointer-events-none`, 150ms) until their prerequisite is met: step 2 unlocks once a key is created or the create-key dialog is cancelled (`CreateKeyDialog onCancel`); PAYG steps 3-4 unlock on first interaction with the model selector, and the `WaitingStrip` spinner only starts then (`active` prop).
- New `StepHeading` swaps the plain "N. Title" labels for the green numbered circle matching the Gate Connect steps; the `SetupIconChip` on the create-key row was dropped.

