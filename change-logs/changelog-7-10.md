# UI Changelog: 2026-07-10

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-9.md`](./changelog-7-9.md)

---

## Conventions

### Dark-mode audit: 15 fixes across shared primitives and pages `8cecf87`

**`src/components/ui/{tabs,badge,compact-kpi,text-link}.tsx`, `src/components/canvas/Artboard.tsx`, `src/pages/{Activity,Models,Policies,Security,TokenSavings,onboarding-shared,plan-comparison-dialog}.tsx`, `src/pages/conversations/RequestTracePanel.tsx`, `src/pages/policies/config.ts`, `src/pages/requests/RequestDetailModal.tsx`, `src/pages/security/EventsTable.tsx`**

Ran a 5-way parallel audit over every page and shared UI component for dark-mode visual defects (invisible fills, missing `dark:` variants, contrast failures, inconsistent tokens across twins), then fixed every confirmed finding:

- **`tabs.tsx`**: "line" variant tab hover fill (`hover:bg-neutral-100`, no dark pairing) → `hover:bg-accent`, which already inverts correctly. Was hitting ApiKeys, Team, and Models' tab groups.
- **`badge.tsx`**: removed the `[a]:hover:*` classes from all 8 status-tint variants — dead code, since no `Badge` in the app is ever rendered as a link (`render={<a/>}`), confirmed by a full-repo grep.
- **`canvas/Artboard.tsx`**: two hardcoded `rgba(17,20,23,…)` shadows bypassed the dark-aware shadow-token ladder entirely (no elevation cue on dark cards) → `shadow-(--shadow-popup)`, matching the documented 6px-radius/`bg-card` convention.
- **`Policies.tsx`**: the sensitivity slider's checked stop lost its intended `muted-foreground` fill to the base `RadioGroupItem`'s higher-specificity `dark:data-checked:bg-primary` — confirmed via computed-style measurement in dark (`oklch(0.922 …)` instead of the expected `0.87`). Fixed by adding matching `data-checked:` qualified overrides so ours out-specifies the base, re-verified in-browser post-fix.
- **`policies/config.ts`**: `ACTION_ACTIVE_RADIO` (flag/redact/block checked-dot colors) and `ACTION_ACTIVE_BORDER.flag` had no `dark:` pairing at all — redact's dot (`neutral-700` on a `neutral-800` dark card fill) was nearly invisible. Added `dark:` variants for all three, following the same brightening step the semantic `--destructive` token already uses (600→400); redact now routes through the semantic `muted-foreground` token to match its sibling border.
- **`conversations/RequestTracePanel.tsx`**: trace-row hover rings (`hover:after:ring-{success,warn,danger}-200`) had no dark pairing, rendering a near-white flash on hover → added `dark:hover:after:ring-*-500/25`, the documented `*-200`→`*-500/25` conversion.
- **`security/EventsTable.tsx`**: "Mark event invalid" button's `hover:bg-neutral-50` (unpaired) made the label/icon vanish on hover in dark (both landing on near-white) → `hover:bg-accent`.
- **`Activity.tsx`**: Top Models/API Keys/Users card subtitle was `text-muted-foreground/5` — a stray 5% opacity modifier making it invisible in both themes → plain `text-muted-foreground`, matching every sibling subtitle in the codebase.
- **`TokenSavings.tsx`, `plan-comparison-dialog.tsx`, `onboarding-shared.tsx`, `Policies.tsx`**: the "featured plan" gradient card (`bg-gradient-to-b from-blue-50 to-blue-25`) had zero dark coverage across four call sites, rendering a near-white card with white text in dark — the most severe finding of the audit. Fixed using the working reference pattern already in `pro-upgrade-card.tsx`: added `dark:border-blue-400/30 dark:from-blue-500/10 dark:to-blue-500/5`. Also applied to the Policies "Pro plan protection" upsell card, which previously used the flat (non-gradient) recipe and was brought in line with the others per follow-up request.
- **`requests/RequestDetailModal.tsx`**: `FindingSwitcherCard`'s unselected-card border (`border-{danger,warning}-200`, unpaired) rendered a pastel outline on dark cards → added `dark:border-*-500/30` + hover variant.
- **`Models.tsx`**: the stacked-provider-icon separator ring hardcoded `var(--color-white)`, producing a bright white halo around vendor icons in dark → swapped for the theme-aware `var(--card)`.
- **`Security.tsx`**: hero-chart axis-tick text used a raw `var(--color-neutral-500)` fill, computing to 3.79–4.18:1 (below the 4.5:1 floor) → semantic `var(--muted-foreground)`, already calibrated for both themes.
- **`compact-kpi.tsx`**: chart tooltip cursor stroke used a raw `var(--color-neutral-300)` instead of the dark-aware grid token, reading mismatched against the grid it sits on → `var(--color-chart-grid)`. (`sparkline.tsx`'s analogous raw-neutral usage was left as-is — it's deliberately scoped to the chart-only palette per its own code comment and already passes contrast in both themes.)
- **`text-link.tsx`**: the "locked" ink-plus-faint-underline recipe had no dark variants at all, so the hover/focus state (`decoration-neutral-500`) computed to *lower* contrast than the resting state (`decoration-neutral-200`) in dark — the intended prominence progression ran backwards. Added `dark:decoration-border` (resting) and `dark:hover/focus-visible:decoration-muted-foreground` (prominent), both existing semantic tokens; light-mode values untouched.

Two items were verified with a single in-browser computed-style measurement each (the slider specificity fix, and the redact/flag radio dot colors) rather than by inspection alone, per the project's cap on in-browser verification passes.

### Table/row hover: stop border-color interpolating through theme transitions `911f186`

**`src/components/ui/table.tsx`, `src/pages/{Conversations,Models}.tsx`, `src/pages/requests/RequestsTable.tsx`, `src/pages/security/EventsTable.tsx`**

Table/row hover used `transition-colors`, which animates `border-color` alongside `background-color`. Interpolating the divider between dark's translucent white/10% border and light's opaque `neutral-200` produces a visible mid-transition gray smudge — alpha and lightness ramp at different rates in OKLab. Scoped to `transition-[background-color]` so the border snaps instantly, matching `TableHeader`/`TableFooter`, which already snap with no visible artifact.

### Toolbar search bar aligns to the KPI/card grid above it `9fa7e80`

**`src/pages/Activity.tsx`, `src/pages/Conversations.tsx`**

The "Recent X" toolbar's search input flexed between the section title and the trailing controls with no relation to the KPI/card row above — its start position was whatever was left over. Rebuilt each toolbar as the *same* grid as the row above (`grid-cols-3` on Activity, `grid-cols-1 sm:grid-cols-3` on Conversations, matching `KpiRail`'s definition exactly), title in the first two columns, search+controls in the third. Because both rows now share one grid definition, the third column's left edge is identical by construction — measured in-browser: both start at the same x as the card/tile above (1019/1008 respectively).

## Sections

### Dashboard: reconcile Tokens Saved rate with TokenSavings 7d window `5bc3719`

**`src/pages/activity-data.ts`, `src/pages/Dashboard.tsx`, `src/pages/TokenSavings.tsx`**

Overview's Tokens Saved tile used a hardcoded `TOTAL_SAVED_RATE` (23%) with no relation to any other number in the app. `TokenSavings.tsx`'s real 7d "Total saved" rate (caching 0.18% + compression 14.0% = 14.2%) was 9 points off from what Overview showed for the same window. Exported `TOKEN_SAVINGS_RATE_7D = 0.142` from `activity-data.ts` and wired both pages to it, so the two can't diverge again. Also gave the Dashboard sparklines real day labels, hover tooltips, and value formatters (previously bare, unlabeled).

### Requests → Messages: finish the terminology rename `233823a`

**17 files** — Activity, ActivityDefault, ApiKeys, Billing, BillingFree, Conversations, ConversationsDefault, Dashboard, Limits, LimitsFree, Models, SetupManual, TokenSavings, Upgrade, `conversations/ConversationDetail`, `conversations/RequestTracePanel`, `security/EventsTable`

Nav label and routes had already moved to `/messages` in an earlier pass, but page-body copy still said "Requests" — KPI titles, column headers, breadcrumb/empty-state text, dialog copy, aria-labels/sr-only strings. Also caught two `navigate()` calls still pointing at the stale `/requests` route (Dashboard's latest-messages table row, EventsTable's open-message link) — those were broken links, not just stale copy.

Scope is rendered/AT-facing text only. Internal identifiers (`Requests.tsx`, `RequestRow`, `RequestsTable`, `requestRowId`, the `requests/` directory) are left as-is — same precedent as Digital Evidence's fingerprint/anchor split, where UI copy already diverges from code names. The Python `requests` library reference in `Models.tsx`'s code sample is untouched.

### Overview + Activity charts: dark-mode palette, axis labels, rounded stack tops `04440cf`

**`design.md`, `src/index.css`, `src/pages/Dashboard.tsx`, `src/pages/activity/TrendCard.tsx`**

Three fixes to the "Tokens used" (Overview) and "Tokens over time" (Activity) stacked bar charts, prompted by side-by-side screenshots:

- The categorical palette (`--chart-1..8`) had no `.dark` override at all — same lightness in both themes, reading too bright against the near-black canvas. Added a `.dark` override 5 points darker (L −0.05, same hue/chroma); light mode untouched.
- Dashboard's Y-axis tick had no `fill` (Recharts' hardcoded `#666`, not a token) and no `tickMargin` (labels sat flush against the dashed gridlines) → `var(--muted-foreground)` + `tickMargin={4}`. Activity's Y-axis had a bespoke left-anchored `<text>` renderer (added earlier to fix a different left/right-alignment complaint) — replaced with the same right-aligned `tickMargin={4}`/`width={44}` pattern via `tickFormatter`, so both charts' axis labels are now visually and structurally consistent.
- Stacked bars: only the topmost series in each stack gets `radius={[2,2,0,0]}`; the bottom and every middle segment stay square.

### Messages table: spell out "Tokens In" / "Tokens Out" `5aa9f3e`

**`src/pages/requests/RequestsTable.tsx`**

Every other table in the app labels these columns "Tokens In"/"Tokens Out"; the Messages table just said "In"/"Out".

### Models detail: more vertical room in capability badges `f779dbb`

**`src/pages/Models.tsx`**

The capability strip (Vision, Tool use, JSON mode, Streaming, Prompt caching) used the shared `Badge`'s default `h-5` (20px), leaving the icon+label pinched top/bottom. Bumped to `h-6` (24px) on this usage only — `Badge`'s shared `h-5`/`px-2` contract is load-bearing everywhere else (status pills, findings chips) and stays untouched.
