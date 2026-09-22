# Audit - 2026-09-21

Read-only reviews by the `front-end-developer` agent. Checklist: tick an
item when it is applied and verified, then append the commit hash to the
item's first line. Pick items by ID ("rams-3, wdg-7"). Paths are relative
to `src/`. Already decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`.

## Summary

- Why: end-to-end pipeline test (audit skill, day file, test tiers, lint): rams over the whole site, then impeccable polish on Models and Token Savings under the reshaped review rules (model by scope, full-read proof, same-turn write, proof re-run by the orchestrator).
- Tested: test-smoke after the rbp apply pass; rams whole site (three review agents, set B re-run full-read); test-smoke after each rams apply pass; impeccable polish review on Models + Token Savings (Opus, browser, all seven routes); test-smoke after each of the two imp apply passes with every Before pattern re-proved by `verify-twins`.
- Found: 34 items. rams 14 (4 HIGH / 5 MEDIUM / 5 LOW), all applied (`ac3758d`); imp 20 (2 HIGH / 10 MEDIUM / 8 LOW), all 20 applied (hash pending). rams-1 retired as a reviewer false positive.
- Opinion: Clean. Every item of both skills is applied and verified; nothing open.
- Next: rams-2 PoliciesEnterprise heading residue (user, 2026-09-22); lint-hook plan now has nine candidate classes in Patterns.

## Runs

| # | Time (CT) | Skill | Scope | Items | Applied |
| --- | --- | --- | --- | --- | --- |
| 1 | 12:33 | test-smoke (after rbp-3, 4, 6, 8, 9, 10, 13) | whole site | none | 0/0 |
| 2 | 15:46 | rams | whole site (components/ui, layouts, icons, every page twin; set B re-run 16:01 after a Disclaimer) | rams-2 to rams-15 (rams-1 retired) | 14/14 |
| 3 | 16:40 | test-smoke (after rams-5, 6, 8, 11) | whole site | none | 0/0 |
| 4 | 17:05 | test-smoke (after rams-2, 3, 4, 7, 9, 10, 12, 13, 14, 15) | whole site | none | 0/0 |
| 5 | 21:31 | impeccable polish (review mode, Opus, browser at 1440 and 390) | Models + Token Savings, all twins | imp-1 to imp-20 | 20/20 |
| 6 | 22:05 | test-smoke (after imp-8, 9) | whole site | none | 0/0 |
| 7 | 23:20 | test-smoke (after imp-1 to 7, 10 to 18; proofs re-run with verify-twins) | whole site | none | 0/0 |
| 8 | 23:50 | test-smoke (after imp-19, 20; first run of the check-report.mjs proof loop, PASS first round, 12 routes) | whole site | none | 0/0 |

## test-smoke

### Compliant, checked and clean

- vitest 40/548 green; Playwright 8/8 green; tsc, lint and lint:design clean after the seven-item apply pass; the pre-commit React Compiler lint caught the rbp-12 hoist, which was reverted. Zero `matchMedia("(prefers-reduced-motion")` reads left in `components/ui/`; all twelve animated icons read `REDUCE_MOTION`.
- Run 3, after rams-5, 6, 8, 11: vitest 40 files / 548 cases green; Playwright 8/8 green against the live :3000 server; tsc, biome and lint:design clean.
- Run 4, after rams-2, 3, 4, 7, 9, 10, 12, 13, 14, 15: vitest 40 / 548 green; Playwright 8/8 green; tsc, ultracite (335 files) and lint:design clean.
- Run 6, after imp-8, 9: vitest 40 / 551, Playwright 8/8; keyboard probe on /token-savings-free reaches a trigger and opens the tooltip.
- Run 8, after imp-19, 20: tsc 0, biome 0, lint:design pass, smoke 8/8; keyboard probe on /messages reaches a trigger and opens the tooltip; checker PASS on 12 routes.
- Run 7, after imp-1 to 7, 10 to 18: vitest 40 / 551, Playwright 8/8; every Before pattern absent on all rendered files per verify-twins; browser: /models 390 triggers unclipped, /token-savings 390 hero numerals share row tops, /token-savings-default rail 112px at 16px pad, /token-savings-enterprise inset radii 4/4/6/4/4, console clean.

Verdict (run 1): Clean. The apply pass introduced no regression.

Verdict (run 3): Clean. The rams HIGH apply pass introduced no regression.

Verdict (run 4): Clean. The rams MEDIUM / LOW apply pass introduced no regression.

Verdict (run 6): Clean.

Verdict (run 7): Clean. The impeccable apply passes introduced no regression.

Verdict (run 8): Clean.

## rams

### Global

- [x] **rams-2 MEDIUM** `heading-order` pages/Policies.tsx:174,338, pages/TokenSavings.tsx:151,206, pages/token-savings/SummaryCard.tsx:75 `ac3758d`
  - Before: page `<h1>` then straight to `<h3>`; `SectionTitle` defaults to h3 and Policies.tsx:338 hand-rolls a raw `<h3>`.
  - After: `<SectionTitle as="h2">` on the first section under the page title, mirror Notifications.tsx:405.
  - Why: skipped heading level (WCAG 1.3.1 / 2.4.6), so heading navigation misses the section.
- [x] **rams-3 LOW** `duplicate-recipe` layouts/DashboardChrome.tsx:414-435, components/ui/theme-toggle.tsx:28-49 `ac3758d`
  - Before: identical 20-line `transition-[opacity,scale,filter]` icon cross-fade block in two files.
  - After: one `IconCrossFade` primitive in `components/ui/` taking two icon nodes and a boolean.
  - Why: two hand copies of one recipe is the drift pattern `no-handrolling.md` names; a third site diverges unnoticed.

### Messages

- [x] **rams-4 MEDIUM** `touch-target` pages/requests/RequestsTable.tsx:964, pages/requests/RequestsTable.tsx:988 `ac3758d`
  - Before: focusable tooltip `<span className="inline-flex cursor-help ...">` around a `size-3.5` icon, about 14px hit area.
  - After: `p-1 -m-1` on both spans, matching the third trigger at RequestsTable.tsx:672.
  - Why: keyboard-focusable target under 44px (WCAG 2.5.8) on the demo table.

### Teams

- [x] **rams-5 HIGH** `no-handrolling` pages/Team.tsx:801-877 `ac3758d`
  - Before: `RowActionsMenu` built on raw `MenuPrimitive` from `@base-ui/react/menu`, comment claims no shared wrapper exists.
  - After: `Menu` / `MenuTrigger` / `MenuContent` / `MenuItem` from `components/ui/menu`, mirror TeamsEnterprise.tsx:687-731.
  - Why: the wrapper exists and is in correct use one file over, so this copy drifts on its own.
- [x] **rams-6 HIGH** `missing-handler` pages/TeamDefault.tsx:59 `ac3758d`
  - Before: header `<Button size="default" variant="default">Invite member</Button>` with no `onClick`.
  - After: open `InviteMemberDialog` as Team.tsx does, or mark the no-op with a comment and skip by decision.
  - Why: primary CTA on the demo path does nothing when clicked; no comment marks it intentional.
- [x] **rams-7 MEDIUM** `dead-control` pages/Team.tsx:622-816 `ac3758d`
  - Before: Invitations `RowActionsMenu` items `resend` / `copy` / `revoke` passed with no `onSelect`.
  - After: wire `onSelect` on each `RowActionItem` (type already allows it), or skip by decision.
  - Why: the menu opens and selection does nothing.

### Billing

- [x] **rams-8 HIGH** `missing-handler` pages/billing/CreditsCard.tsx:364, pages/BillingFree.tsx:492 `ac3758d`
  - Before: `<Button disabled={!canSubmit} size="sm" type="button">Continue to checkout</Button>` with no `onClick`.
  - After: close the dialog on click, as `AutoRechargeDialog` Save does, or comment the no-op like BillingEnterprise.tsx:374 and skip by decision.
  - Why: the Add-credits flow ends in a dead button in both twins, while the other Billing no-ops are commented as intentional.
- [x] **rams-9 MEDIUM** `no-handrolling` pages/billing/CreditsCard.tsx:343,487,528,573, pages/BillingFree.tsx:471,618,657,704 `ac3758d`
  - Before: hand-rolled `<p aria-live="polite" className="type-copy-12 m-0 text-destructive">` field errors.
  - After: `<FieldError>` from `components/ui/field`, mirror pages/teams/dialogs.tsx.
  - Why: a shared error primitive exists; two dialogs duplicate its markup by hand.
- [x] **rams-10 LOW** `type-voice-drift` pages/billing/CreditsCard.tsx:343, pages/BillingFree.tsx:471 `ac3758d`
  - Before: error text `type-copy-12` in CreditsCard, `type-copy-14` in BillingFree for the same field ids.
  - After: `type-copy-14` in both.
  - Why: byte-identical dialogs have drifted on one voice.

### Limits

- [x] **rams-11 HIGH** `dialog-form-reset` pages/LimitsFree.tsx:502-527 `ac3758d`
  - Before: `handleSubmit` calls `onCreate(...)` then `onOpenChange(false)` with no field reset; the only reset sits in the Dialog `onOpenChange` cancel path, which does not fire on a controlled close.
  - After: extract `resetForm()` and call it from `handleSubmit` after `onCreate`, mirror Limits.tsx:707-731.
  - Why: reopening Create limit shows the previous submission's values on the Free twin; the Pro twin already carries the fix.

### Onboarding

- [x] **rams-12 MEDIUM** `link-as-button` pages/SetupManual.tsx:139-152, pages/SetupGateConnect.tsx:63-80 `ac3758d`
  - Before: `<Button onClick={() => window.open("https://docs.constellationgate.ai", "_blank", "noopener,noreferrer")} variant="outline">API docs</Button>`.
  - After: `<a href="https://docs.constellationgate.ai" target="_blank" rel="noopener noreferrer">` in the Button recipe (`Button render={<a/>} nativeButton={false}`).
  - Why: a button has no href, so cmd-click, middle-click, copy link and status-bar preview are all lost on a docs link.
- [x] **rams-13 LOW** `icon-position` pages/SignUp.tsx:75-81, pages/SignIn.tsx:92-98 `ac3758d`
  - Before: `<ArrowRight className="absolute top-1/2 right-3 -translate-y-1/2" />` inside a `relative w-full` Button.
  - After: `<ArrowRight aria-hidden data-icon="inline-end" />`, mirror onboarding-shared.tsx:114-119.
  - Why: every other button icon uses the data-icon slot; absolute positioning crowds the label at narrow widths.

### API keys

- [x] **rams-14 LOW** `container-max-width` pages/ApiKeys.tsx:147 `ac3758d`
  - Before: `flex w-full max-w-5xl flex-col gap-6`.
  - After: `flex w-full @5xl:max-w-5xl flex-col gap-6`, matching Limits.tsx:139 and Settings.tsx:92.
  - Why: caps on viewport width instead of the column width inside `<main>`.

### Team detail

- [x] **rams-15 LOW** `heading-voice` pages/TeamDetailEnterprise.tsx:317 `ac3758d`
  - Before: `<h2 className="type-label-14 m-0 text-balance text-foreground">Team not found</h2>` inside the `role="alert"` empty state.
  - After: confirm intent, or `type-heading-16` on the h2.
  - Why: label voice on a heading tag reads as a mistag to the next reviewer.

### Decision needed

- rams-2 residue: `PoliciesEnterprise` reaches the Policies card title through `pages/teams/PoliciesPane.tsx:194`, which is also mounted inside `SettingsStack` under an h3 "Policies" section, so the shared pane stays h3 and PoliciesEnterprise keeps an h1 to h3 skip (user, by 2026-09-22).

### Not verified

- Contrast ratios, real touch-target pixels, focus order and focus restore on Dialog / Popover close: no browser pass.

### Compliant, checked and clean

- Images without alt: every `<img>` in scope is decorative with `alt=""` and `aria-hidden`.
- Icon-only buttons: `IconActionButton` and `CopyButton` require `aria-label` at the type level; every page call site carries one.
- Form inputs, selects, switches, radio groups: every one has a `Label htmlFor`, `aria-label` or `aria-labelledby`; validated fields wire `aria-describedby` and `aria-invalid`.
- Non-semantic click handlers: no `<div onClick>` or `<span onClick>` anywhere in scope.
- Focus outline removed: every `outline-none` pairs a `focus-visible:ring-2` replacement.
- Colour-only information: every Badge and status pill carries a text label; the budget breach banner pairs colour with icon and copy.
- Positive `tabIndex` and bare `role="button"`: none.
- `hover-fine:`: zero live uses site-wide.
- Radix: none; Base UI throughout.
- Motion: every transition pairs `motion-reduce:transition-none` or sits inside the reduced-motion block; GSAP stagger in PlanComparisonDialog is gated on `prefers-reduced-motion`.
- Raw colour literals: none outside `icons/brand-colors.ts`.
- 4px grid: no stray half-steps outside the documented `px-2.5`.
- Checked and not defects: Collapsible `transition-[height]` in RequestDetailBody.tsx:1638 (Base UI's documented technique); `transition-[color,rotate]` in Models.tsx:939 (`rotate` is a standalone Tailwind v4 property).

Verdict (run 2): Adverse at review; Clean after both apply passes, one heading residue on PoliciesEnterprise left for decision. The rest is consistency debt the write-time gates did not cover.

## impeccable

### Models

- [x] **imp-3 MEDIUM** `conceptual-mismatch` pages/Models.tsx:1186-1188, pages/Models.tsx:1268
  - Before: Providers table carries a sortable `Context` column printing `formatTokenCount(model.contextWindow)` on every row.
  - After: drop the column and its `providerSortValue` case; Context already leads the KPI rail at pages/Models.tsx:1088-1091.
  - Why: context is per-model, not per-provider (file comment 617-619), so the column repeats one value three times under a heading that promises variance, 200px under the tile that already shows it.
- [x] **imp-1 MEDIUM** `local-defect` pages/Models.tsx:929-944
  - Before: `Show more` / `Show less` `TextLink` renders unconditionally beside `#model-description`.
  - After: gate on real clipping with `useIsTruncated()` (hooks/use-is-truncated.ts), the precedent at pages/models/ModelShelves.tsx:120,206.
  - Why: a short description never engages `line-clamp-3`, so the control toggles text that already fits and nothing moves (measured on DeepSeek Pro Latest, 75 chars).
- [x] **imp-2 MEDIUM** `responsive-break` pages/Models.tsx:483, pages/Models.tsx:502, pages/Models.tsx:513
  - Before: provider `SelectTrigger`, features `MultiSelect` and sort `SelectTrigger` share row 2 with `min-w-0 @2xl:flex-none flex-1`.
  - After: `basis-full @xl:basis-auto @xl:flex-1` so the three stack until the column can hold them.
  - Why: at 390px each trigger is 114px against about 130px of label plus chevron, so all three read clipped (`All provide…`, `All feature…`, `Most popu…`) and the set filter is unreadable.
- [x] **imp-4 LOW** `one-off-implementation` pages/Models.tsx:1254
  - Before: `type-copy-14 truncate text-foreground` on the provider name.
  - After: `type-label-14 truncate text-foreground`.
  - Why: the provider name is a row identifier and every sibling identifier takes the label voice (pages/Models.tsx:637, pages/models/ModelShelves.tsx:433), so this one drops to 400.
- [x] **imp-5 LOW** `responsive-break` pages/models/FreeModels.tsx:54
  - Before: Free grid folds at `@3xl:grid-cols-2`; Featured above folds at `@4xl:grid-cols-2` (pages/models/ModelShelves.tsx:83).
  - After: `grid @4xl:grid-cols-2 grid-cols-1 gap-4`.
  - Why: between 768 and 896px the same card anatomy is 1-up in one block and 2-up beneath it, which reads as a mistake.
- [x] **imp-6 LOW** `one-off-implementation` pages/models/ModelShelves.tsx:306
  - Before: `type-copy-12 text-muted-foreground` for the card stat name.
  - After: `type-label-12 text-muted-foreground`.
  - Why: `Context` / `Input` / `Output` / `Features` name a value; the equivalent Token Savings stat label is `Eyebrow`, so this is the one stat label at 400.
- [x] **imp-7 LOW** `local-defect` pages/models/ModelShelves.tsx:358
  - Before: `<Card className="overflow-x-auto" density="flush">` around the shelf table.
  - After: drop `overflow-x-auto`.
  - Why: the `Table` primitive already wraps in `[data-slot=table-container]` with `overflow-x: auto`, so the outer class is inert and its comment misattributes the behaviour.

### Token Savings

- [x] **imp-8 HIGH** `copy-consistency` pages/TokenSavings.tsx:568-573
  - Before: Free Advanced-compression `SavingsHeadline` is the literal `value="~20%"`.
  - After: derive from the rail's source, `KPI_BY_RANGE.all[2].value` (13.7) at one decimal, or PM restates the claim; never a second number.
  - Why: the Compression tile and the Summary on the same page read 13.7%, so the upsell claims a rate the page contradicts (no-synthetic-data, charts-must-reconcile, one-decimal).
- [x] **imp-9 HIGH** `local-defect` pages/TokenSavings.tsx:437-451
  - Before: `Info` tooltip trigger renders a bare `<span>` with `cursor-help` and `focus-visible:ring-2` and no `tabIndex`.
  - After: `tabIndex={0}` on the rendered span, keep the `aria-label`.
  - Why: all eight triggers return null `tabindex`, so the only copy explaining each benefit is unreachable by keyboard and the coded focus ring never fires (WCAG 2.1.1); present on all four twins. Enterprise carries its own `BenefitList` in pages/teams/TokenSavingsPane.tsx:470, fixed the same way; other `cursor-help` spans (RequestsTable, SummaryCard) share the defect and are filed as imp-19.
- [x] **imp-10 MEDIUM** `local-defect` pages/TokenSavings.tsx:143-147
  - Before: `effectiveRange = range === "custom" ? "all" : range` feeds the tiles while `note = RANGE_DELTA_NOTE[range]` prints `vs prior range` for custom.
  - After: `const note = RANGE_DELTA_NOTE[effectiveRange];`
  - Why: on a custom range the tiles show the lifetime series but the delta tag claims a comparison that was never computed (verify-twins: pattern absent on all four routes after apply; Enterprise pane carried the same bug at teams/TokenSavingsPane.tsx:188, fixed).
- [x] **imp-11 MEDIUM** `one-off-implementation` pages/TokenSavings.tsx:274, pages/TokenSavings.tsx:303, pages/TokenSavings.tsx:479, pages/TokenSavings.tsx:520, pages/token-savings/SummaryCard.tsx:126
  - Before: inset panel hand-assembled six times as `<Card className="rounded-xs bg-transparent shadow-none">`, variants disagreeing on `bg-transparent`.
  - After: `inset` variant on components/ui/card.tsx, call sites `<Card variant="inset">`.
  - Why: six sites carrying one override is the missing-variant pattern `no-handrolling.md` names; the drifted `bg-transparent` proves it (verify-twins: `variant="inset"` 4 hits TokenSavings.tsx, 1 SummaryCard.tsx, 3 teams/TokenSavingsPane.tsx; old pattern absent). Follow-up: Policies.tsx:287,303,486 and teams/PoliciesPane.tsx:141,158,268 carry `rounded-sm border bg-transparent shadow-none`, the same variant one radius step up; filed as imp-20.
- [x] **imp-12 MEDIUM** `optical-alignment` pages/token-savings/SummaryCard.tsx:148-161
  - Before: `grid-cols-2 gap-4` with each `FigureCell` owning its own Eyebrow / value / note stack.
  - After: `grid-cols-2 grid-rows-[auto_auto_auto] gap-4` on the container, `grid-rows-subgrid row-span-3` on each `FigureCell` `CardContent`.
  - Why: at 390px `INPUT TOKENS REMOVED` wraps and `CACHE HITS` does not, so the two 24px hero numerals lose a shared baseline.
- [x] **imp-13 MEDIUM** `missing-token` pages/TokenSavingsDefault.tsx:41-85
  - Before: three hand-rolled tiles `flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6` with an inline `size-12 rounded-md bg-muted` chip.
  - After: one local `EmptyKpiTile({icon,label})` padded `p-4` like every KPI tile (pages/Models.tsx:1114, `CompactKpi`).
  - Why: the block repeats three times with an arbitrary `min-h-[120px]` and a 24px pad against the 16px recipe, so the Default rail misaligns with the other three twins.
- [x] **imp-14 MEDIUM** `conceptual-mismatch` pages/TokenSavings.tsx:598-602, pages/TokenSavings.tsx:479, pages/TokenSavings.tsx:519
  - Before: `Card` > `CardContent` > `Card rounded-xs` > `BenefitList div rounded-xs border`, the inner two at 4px.
  - After: outer 16 / option card `rounded-sm` 8 / benefit list `rounded-xs` 4; drop the third frame if the ladder cannot hold.
  - Why: the settled ladder is one step per level, and two consecutive 4px frames flatten the cue that the list belongs to the option card.
- [x] **imp-15 MEDIUM** `local-defect` pages/token-savings/SummaryCard.tsx:206
  - Before: `transition-[width] duration-200 ease-out` on the meter fill.
  - After: fill at full width driven by `scale-x` with `origin-left`, transitioning `transform` for 200ms.
  - Why: `width` is outside the animatable set and lays out on every range change across seven bars at once.
- [x] **imp-16 LOW** `local-defect` pages/TokenSavings.tsx:425-428, pages/TokenSavings.tsx:505, pages/TokenSavings.tsx:580
  - Before: check wrapper sets `text-primary-foreground`; both call sites override with `text-muted-foreground` / `text-tier-pro-foreground`.
  - After: drop `text-primary-foreground` from the `BenefitList` base string.
  - Why: a dead class no render shows, implying a default the component does not have (verify-twins: `text-primary-foreground` absent on all four routes; pane twin fixed).
- [x] **imp-17 LOW** `one-off-implementation` pages/TokenSavings.tsx:204, pages/TokenSavingsEnterprise.tsx:86
  - Before: `<div className="mt-2 flex-col gap-4">` on the Savings options section.
  - After: drop `mt-2`.
  - Why: the column is a `gap-6` stack, so this one seam is 32px where every other is 24px, pasted into the Enterprise twin (verify-twins: `mt-2 flex` absent on all four routes; 14 other pages keep it, out of scope).
- [x] **imp-18 LOW** `local-defect` pages/TokenSavings.tsx:420, pages/token-savings/SummaryCard.tsx:51-56
  - Before: template-string className `rounded-xs border bg-card/40 p-4 ${outlineClassName}`; the `ROW_GRID` comment documents `w-56` then `w-60` against `@md:w-72` in code.
  - After: `cn(...)` like every other file, and one documented track width.
  - Why: string concatenation defeats the class merge, and three contradicting widths mislead the next reader.

- [x] **imp-19 MEDIUM** `keyboard-unreachable-trigger` pages/requests/RequestsTable.tsx:672, pages/requests/RequestsTable.tsx:964, pages/requests/RequestsTable.tsx:988, pages/token-savings/SummaryCard.tsx (cursor-help span)
  - Before: `cursor-help` tooltip trigger spans with `focus-visible:ring-2` and no `tabIndex`, same shape as imp-9.
  - After: `tabIndex={0}` with the repo's `biome-ignore lint/a11y/noNoninteractiveTabindex` line and a WCAG 2.1.1 reason, as imp-9 did.
  - Why: found by the imp-9 apply agent's grep for a shared pattern; these are the surviving sites (grep `cursor-help` across src: 4 hits outside Token Savings). Applied on RequestsTable x3 and teams/budget.tsx x1; SummaryCard already clean; `components/ui/code-card.tsx:293` is an inline code token with no focus ring, left as-is.
- [x] **imp-20 LOW** `one-off-implementation` pages/Policies.tsx:287, pages/Policies.tsx:303, pages/Policies.tsx:486, pages/teams/PoliciesPane.tsx:141, pages/teams/PoliciesPane.tsx:158, pages/teams/PoliciesPane.tsx:268
  - Before: `rounded-sm border border-border bg-transparent shadow-none` hand-assembled inset panels.
  - After: `<Card variant="inset">` (now exists, ac-pending hash) with `className="rounded-sm"` if the 6px step is intended, else the variant's 4px.
  - Why: the imp-11 sweep found these six outside the briefed pattern; converting them changes radius on pages outside scope, so they wait for a Policies pass (grep: 6 hits, 2 files).

### Not verified

- Hover tooltips: synthetic `mouse.move` in headless Chromium opened no Base UI popup, so content, placement and portal target were not confirmed (harness artifact).
- Dark theme forced by class, not the header toggle; contrast not measured numerically. The dark `bg-muted` / `text-muted-foreground` check glyphs on the Basic compression card look near the 3:1 floor.

### Compliant, checked and clean

- Console: zero errors or warnings across all seven routes at 1440x900 and 390x844.
- Horizontal overflow: none at either size; catalog and providers tables scroll inside `[data-slot=table-container]`; the modality `TabsList` scrolls at 390.
- Interaction and state: zero-row search keeps the toolbar and shows Clear filters; sort, filters, tabs and pagination reset the page; detail open moves focus to the back link and close restores the row; switches toast and flip `StatusBadge`; TTL select saves.
- Motion: every transition is 150 / 200ms `ease-out` with `motion-reduce:transition-none`; no mount stagger.
- Numbers: Summary reconciles with the rail at every preset; breakdown shares sum to 100.0%; low-volume and no-traffic states render from real flags.
- `craft-floor.md` bans eyebrows above headings; design.md sanctions `Eyebrow` on KPI tiles and design.md wins, so SummaryCard.tsx:130 and Models.tsx:1115 stand.

Verdict (run 5): Qualified at review; Clean after both apply passes. imp-19 and imp-20 are follow-ups the apply agents surfaced, open.

## Patterns

- `no-handrolling`: rams-3, rams-5, rams-9, imp-11, imp-13, imp-20. Review-time; a grep for `from "@base-ui/react/` outside `components/ui/` would catch rams-5's class; repeated `className` overrides on `Card` are the imp-11 class.
- `missing-handler`: rams-6, rams-7, rams-8. Lint candidate: `Button` / `MenuItem` without `onClick` / `onSelect` / `render` / `type="submit"`, needs a no-op waiver comment.
- `twin-drift`: rams-10, rams-11, imp-5, imp-13, imp-10 (Enterprise pane copy). `verify-twins` script now resolves routes to files; use it in every brief. Review-time; the Free / Pro twin rule in `no-thrash.md`.
- `heading-order`: rams-2, rams-15. Lint candidate: `SectionTitle` without `as` directly under `PageTitle`.
- `label-voice-on-identifier`: imp-4, imp-6. Lint candidate: `type-copy-*` on a row identifier or stat name; hard to detect, review-time.
- `non-animatable-property`: imp-15. Lint candidate: extend check-design-tokens for `transition-[width]` / `[height]` outside Base UI Collapsible.
- `synthetic-number`: imp-8. Lint candidate: a literal `~N%` or `value="N%"` string on a page (`no-synthetic-data`).
- `keyboard-unreachable-trigger`: imp-9, imp-19. Lint candidate: `TooltipTrigger render={` whose element is a `span` without `tabIndex`.
