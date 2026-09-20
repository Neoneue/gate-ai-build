# Audit - 2026-09-18

Read-only reviews by the `front-end-developer` agent plus one manual token
sweep, rolled into one file on 2026-09-20 from `ui-audit-9-18.md` (reviewed
2026-09-17, applied 2026-09-17 and 2026-09-18) and `color-audit-9-18.md`.
Original item numbers are preserved behind the alias prefix, so "better-ui
13" in older notes is `bui-13` here. Checklist: tick an item when it is
applied and verified, then append the commit hash to the item's first line.
Pick items by ID ("bui-2, mifb-14"). Paths are relative to `src/`. Already
decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`, plus Summary card breakdown labels
(pending team), Enterprise seats "4 of 4", CMS Featured badge wording, and
the two rams Models items from 2026-09-16.

Scope of runs 1 to 3 (every workspace twin): `TokenSavings.tsx`,
`TokenSavingsDefault.tsx`, `TokenSavingsEnterprise.tsx`,
`TokenSavingsFree.tsx`, `token-savings/SummaryCard.tsx`; `Models.tsx`,
`ModelsDefault.tsx`, `ModelsFree.tsx`, `SetupModels.tsx`,
`models/FreeModels.tsx`, `models/ModelShelves.tsx`, `models/curation.ts`;
`Billing.tsx`, `BillingDefault.tsx`, `BillingEnterprise.tsx`,
`BillingFree.tsx`, `billing/CreditsCard.tsx`, `billing/HistorySection.tsx`,
`billing/PaymentMethodCard.tsx`. Shared primitives are reported once as a
root cause.

## Runs

| # | Date | Skill | Scope | Items |
| --- | --- | --- | --- | --- |
| 1 | 2026-09-17 | better-ui | Token savings, Models, Billing (all twins) | bui-1 to bui-22 |
| 2 | 2026-09-17 | make-interfaces-feel-better | same set | mifb-1 to mifb-26 |
| 3 | 2026-09-17 | react-best-practices | same set | rbp-1 to rbp-18 |
| 4 | 2026-09-18 | color-audit (manual) | `src/**/*.{ts,tsx,css}` minus the two data blobs | col-1 to col-18 |

## better-ui

### Global

- [x] **bui-13 HIGH** (applied 2026-09-17, `533cdd3`) `components/ui/button.tsx:14`; `switch.tsx:17`; `option-tile.tsx:24`; `select-variants.ts:8`; `toggle-variants.ts:5`; `back-link.tsx:25`
  - Before: `transition-[colors,...]`
  - After: button: `transition-[color,background-color,border-color,opacity,box-shadow,scale]`; switch / option-tile / select / toggle: `transition-[color,background-color,border-color,box-shadow]`; back-link: `transition-[color,background-color,border-color,scale]`
  - Why: Compiled: the class emits `transition-property: colors,opacity,box-shadow,scale`. `colors` is a Tailwind shorthand, not a CSS property, so it parses as an unmatched custom-ident and no color or fill on any Button, Switch, Select trigger, Toggle or OptionTile transitions; every hover fill snaps. Most visible on the Token savings switches: the thumb glides 150ms while the track colour cuts. design.md §Motion states this rule and records the same fix applied to Badge and Card on 2026-09-14; these six were missed. Out-of-scope copies of the same string: `DashboardDefault.tsx:423`, `SetupManual.tsx:391`, `Policies.tsx:587`, `teams/PoliciesPane.tsx:372`.
- [x] **bui-14 HIGH** (applied 2026-09-17, `533cdd3`) `components/ui/icon-action-button.tsx:30`
  - Before: `transition-[color,background-color,transform,box-shadow]` with `active:scale-[0.98]`
  - After: `transition-[color,background-color,scale,box-shadow]`
  - Why: Compiled: `active:scale-[0.98]` emits the standalone `scale: 0.98`, which a list naming `transform` does not cover; the press jumps with no tween, and `motion-reduce:transition-none` on the same element guards nothing. design.md §Motion names this Tailwind v4 trap. Consumer in scope: every History disclosure chevron (`HistorySection.tsx:153`).
- [ ] **bui-15 MEDIUM** `components/ui/option-tile.tsx:29`
  - Before: `md: "h-10 rounded-md font-medium font-sans text-sm"`
  - After: `md: "h-10 rounded-sm font-medium font-sans text-sm"`
  - Why: A 40px control takes the Card/surface tier (8px) while the primitive's own `lg` size takes the chrome tier (6px). Consumers: the Add credits preset grids (`CreditsCard.tsx:269`, `BillingFree.tsx:402`). The tile is also the one hand-rolled pressable with no `active:scale-[0.98] motion-reduce:active:scale-100`.
- [x] **bui-16 MEDIUM** (applied 2026-09-17, `751c216`) `components/ui/copy-button.tsx:107`, `:133-141`
  - Before: `const Icon = copied ? CircleCheck : Copy;` then `<Icon className="transition-colors ..." />`
  - After: `<CopyIconSwap className="size-3.5" copied={copied} data-icon="inline-start" strokeWidth={1.75} />`
  - Why: Label mode toggles the glyph by mount/unmount, so the transition on it can never run and the success state hard-cuts. The primitive's own icon mode already does this correctly with `CopyIconSwap` (both glyphs in the DOM, opacity cross-fade).
- [x] **bui-17 MEDIUM** (applied 2026-09-17, `751c216`) `components/ui/tabs.tsx:90`
  - Before: no press affordance on `TabsTrigger`
  - After: append `active:scale-[0.98] motion-reduce:active:scale-100` and extend the list to `transition-[color,background-color,border-color,scale]`
  - Why: design.md §Motion states "Same press lives on `IconActionButton` + `TabsTrigger`". It does not. Every tab row on these pages (Models modality tabs, both code-sample rails) presses dead.
- [x] **bui-21 MEDIUM** (applied 2026-09-17, `533cdd3`) `components/ui/sidebar.tsx:195, :223, :395, :507`
  - Before: `transition-[color,background-color,transform]` with `active:scale-[0.98]`
  - After: `transition-[color,background-color,scale]`
  - Why: Same defect as bui-14, found by the sweep while applying it: Tailwind v4 `scale-*` is the standalone `scale` property, so the named `transform` never matches and the press has no tween.
- [ ] **bui-18 LOW** `components/ui/icon-action-button.tsx:30`
  - Before: `will-change-transform` (unconditional)
  - After: remove
  - Why: Applied to every icon action button on every row, so a 25-row ledger holds 25 permanent compositing layers for a 150ms press. design.md mandates it on `<Button>` for label re-raster; it does not cover this primitive, and the glyph has no text to re-raster.
- [x] **bui-19 LOW** (applied 2026-09-17, `751c216`) `components/ui/copy-button.tsx:140`
  - Before: `strokeWidth={1.8}`
  - After: `strokeWidth={1.75}`
  - Why: Same file uses 1.75 at `:170`; design.md §6 locks 1.75 as a single global value.
- [ ] **bui-20 LOW** `components/ui/feedback-fab.tsx:101`
  - Before: `hover-fine:-translate-y-px motion-reduce:hover:translate-y-0`
  - After: `hover:-translate-y-px motion-reduce:hover:translate-y-0`
  - Why: The `@custom-variant hover-fine` in `index.css:9` compiles to invalid nested CSS, so this is the last inert `hover-fine:` in `src/` and the FAB has no hover lift. No in-scope page file uses the variant.
- [x] **bui-22 LOW** (applied 2026-09-17, `533cdd3`) `components/ui/theme-toggle.tsx:32, :42`; `layouts/DashboardChrome.tsx:378, :388`
  - Before: `transition-[opacity,transform,filter]` animating `scale-100` to `scale-[0.25]` plus `blur-*`
  - After: `transition-[opacity,scale,filter]`
  - Why: `transform` is dead here (should be `scale`); opacity still fades so the icons cross-fade but do not scale. `filter` is live because `blur-*` compiles to it; this is an existing exception to the no-`filter` rule, decide whether to keep it.

### Token savings

- [x] **bui-1 MEDIUM** (applied 2026-09-17, `876afb4`; also applies mifb-11 on the same strings; the advanced-card ternary at :549 was taken with :550 so the Pro and Free branches stay on one tier) `pages/TokenSavings.tsx:298`, `:327`, `:507`, `:552`; `pages/token-savings/SummaryCard.tsx:131`
  - Before: `<Card className="rounded-sm ...">` (6px) inside the page `<Card>` (`rounded-md`, 8px)
  - After: `rounded-xs`
  - Why: Concentric border radius. design.md §6 locks the card-in-card step as `rounded-md` (8px) to `rounded-xs` (4px); 6px is the Button/chrome tier, so every inset panel on this page sits one tier off the ladder.
- [ ] **bui-2 MEDIUM** `pages/TokenSavings.tsx:470`
  - Before: `... cursor-help ... text-muted-foreground hover:text-muted-foreground focus-visible:...`
  - After: `... cursor-help rounded-sm p-1 text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground motion-reduce:transition-none focus-visible:...`
  - Why: Every state change needs a visible cue. The hover target resolves to its own resting color, so the 11 benefit tooltips have a `cursor-help` affordance and no hover feedback.
- [x] **bui-3 LOW** (applied 2026-09-17, `876afb4`; the only call site is now :569 (the Summary off state went away today); HeroNumeric's base already carries text-foreground, so the single-use valueClassName prop went with it) `pages/TokenSavings.tsx:429` (via `:604`)
  - Before: `<HeroNumeric className={"leading-none text-foreground text-xl"}>`
  - After: drop `text-xl` / `leading-none`, keep `<HeroNumeric>` default
  - Why: `HeroNumeric` is the locked 24px+ display voice (`hero-numeric.tsx:15-20`); the call site pushes it to 20px, where the primitive's own contract says numerics revert to mono. The Overview rail beside it stays 24px, so the two savings figures read as different tiers.
- [ ] **bui-4 LOW** `pages/TokenSavingsDefault.tsx:41`, `:55`, `:69`
  - Before: `min-h-[120px]`
  - After: `min-h-30`
  - Why: Arbitrary value for a tile inside `KpiRail`. 120px is on the grid; the bracket is the only thing off-system.

### Models

- [ ] **bui-5 MEDIUM** `pages/models/ModelShelves.tsx:149`, `:152`
  - Before: `dimmed && "cursor-pointer opacity-75"` + `interactive={!dimmed}`
  - After: `dimmed && "opacity-75"` + `interactive` (unconditional)
  - Why: A dimmed Free-models card keeps `cursor-pointer` and a live drill-in but loses both the hover fill and the 0.98 press, so a pointer user gets no response before the route changes. Dim is the static cue; it does not need the feedback removed.
- [ ] **bui-6 LOW** `pages/Models.tsx:1435-1441` (row also holds `:1423`, `:1427`, `:1431`)
  - Before: `<img ... className="size-4" src="/icons/providers/openclaw.svg" />`
  - After: `className="size-4 opacity-80"`
  - Why: Three of the four PAYG tab glyphs are `currentColor` and fade with the tab's muted to foreground ink; the OpenClaw mark is a fixed `#00e5cc` + gradient asset, so an inactive OpenClaw tab reads louder than the active one. `Bot` is also the one non-brand glyph in the row (no `hermes.svg` in `public/icons/providers/`).
- [x] **bui-7 LOW** (applied 2026-09-17, `876afb4`; fixed by mifb-2 for the label; chevron list is now transition-[color,rotate]) `pages/Models.tsx:908`, `:915`
  - Before: label: no transition; chevron: `transition-transform duration-150 ease-out` + `group-hover:text-foreground`
  - After: label: add `transition-colors duration-150 ease-out motion-reduce:transition-none`; chevron: `transition-[color,rotate] duration-150 ease-out`
  - Why: The Show more/less pair changes color on hover with nothing named to animate it. The back link at `:832` does transition color, so one page carries two link behaviours.
- [x] **bui-8 LOW** (applied 2026-09-17, `876afb4`; fixed by bui-16 in the primitive) `pages/Models.tsx:1040`, `:1463`
  - Before: `<CopyButton className="shadow-sm" ... mode="label" />`
  - After: see bui-16 (root cause in `copy-button.tsx`)
  - Why: Both floating Copy buttons swap Copy to CircleCheck by unmount, so the success glyph hard-cuts. Consumer only; fix once in the primitive.

### Billing

- [x] **bui-9 MEDIUM** (applied 2026-09-17, `751c216`) `pages/billing/PaymentMethodCard.tsx:41`; `pages/BillingFree.tsx:808`
  - Before: `rounded-md border-border bg-card-muted p-4` inside the `rounded-md` `<Card>`
  - After: `rounded-xs border-border bg-card-muted p-4`
  - Why: Identical radius across a parent/child boundary, which design.md §6 names as the bug outright. Same 8px arc twice with 16px between them is the most visible nesting error on either Billing page.
- [ ] **bui-10 MEDIUM** `pages/BillingFree.tsx:240-303`, `:798-829`, `:765-791` vs `pages/billing/CreditsCard.tsx:85`, `:632`, `pages/billing/PaymentMethodCard.tsx:23`
  - Before: three local re-implementations of `CreditsCard`, `PaymentMethodCard`, `CreditStatRow`
  - After: render the shared modules (`PaymentMethodCard` already takes `empty`; `CreditsCard` takes `balance` / `lastTopUp`)
  - Why: The copies have already drifted: validation errors are `type-copy-14` on Free (`:471`, `:615`, `:656`, `:701`) against `type-copy-12` on Pro/Enterprise (`CreditsCard.tsx:338`, `:482`, `:523`, `:568`), and the Auto-recharge field pair folds at `md:` on Free (`:579`) against `min-[480px]:` shared (`:446`). Same dialog, two type ramps and two fold points.
- [ ] **bui-11 LOW** `pages/BillingEnterprise.tsx:270-295`
  - Before: local `StatRow`
  - After: import `CreditStatRow` from `@/pages/billing/CreditsCard`
  - Why: Same root cause as bui-10; third copy of a four-line row, and its header comment says so.
- [ ] **bui-12 LOW** `pages/billing/HistorySection.tsx:181-198`
  - Before: expanded child rows mount with no transition
  - After: no change required
  - Why: Verified, not a defect: the skill's "remove immediately when motion adds no information" case; the rotating chevron (`:158-165`, 150ms, `motion-reduce` gated) is the static cue. Recorded so the omission reads as decided.

### Decision needed

- bui-2: hover colour on the 11 benefit tooltip triggers (visual call).
- bui-18 vs mifb-4: one `will-change` policy for pressables.
- bui-15: OptionTile `md` radius tier.

- Skill: Skill default is `scale(0.96)`. design.md: Project standard is `active:scale-[0.98]`; 0.96 is too strong (design.md:1131). Resolution: Keep 0.98. Every After above uses 0.98; the skill is overridden.
- Skill: Icon stroke keyed to adjacent text weight (1.5 / 2 / 2.5). design.md: lucide stroke 1.75, one global value. Resolution: design.md. bui-19 corrects to 1.75.
- Skill: Icon cross-fade = scale 0.25 to 1 + `blur(4px)` to 0. design.md: `filter` excluded from the transition set. Resolution: design.md. bui-16 keeps `CopyIconSwap`'s opacity-only cross-fade.
- Skill: Icon-side padding = text-side minus 2px. design.md: symmetric `px-2.5` with `data-icon`. Resolution: design.md. No optical-padding findings raised.
- Skill: `will-change` only after observed stutter. design.md: mandated on `<Button>` for label re-raster. Resolution: design.md for `<Button>`; bui-18 is scoped to `IconActionButton`, which design.md does not cover.
- Skill: Shadows instead of borders for depth. design.md: `border-border` + `shadow-xs`. Resolution: design.md. No border-to-shadow findings raised.
- Skill: (doc drift). design.md: design.md §Motion forbids `colors` in a property list, then states "The `<Button>` primitive's transition expands to `transition-[colors,opacity,box-shadow,scale]`". The doc prescribes the string its own rule forbids.. Resolution: Needs a design.md edit alongside bui-13.
- Skill: (doc drift). design.md: design.md §Motion's stagger row describes an entrance in `ModelShelves.tsx:84-86` removed 2026-09-15. Resolution: Stale doc row; code is correct.

### Not verified

No browser was used. Not verified: rendered radius arcs at real pixel
sizes; whether the Switch track/thumb desync in bui-13 is perceptible at 150ms;
the dimmed Featured card's actual pointer behaviour (bui-5); the `motion/react`
icon components (`ReceiptIcon`, `RefreshCWIcon`, `SparklesIcon`,
`CreditCardIcon`, `SquareArrowUpIcon`) on every Billing button run 400 to
2000ms with `bounce: 0.3` on Sparkles, past the skill's 150ms hover
guidance, but they are an established house pattern and were not flagged
pending a call on whether that pattern is settled.

### Skipped by decision

- bui-4, bui-6, bui-12, bui-20: churn-only, unmounted shelves, brand asset, or no visible effect (2026-09-17).
- bui-10, bui-11 (Free Billing duplicate set): the copies are marked deliberate in code and Enterprise billing is closed. Needs a copy decision ("Never" vs "None yet") first.
- bui-5: dim is the intended cue on a dimmed Free card.

Verdict (run 1): Block. bui-13 and bui-14 are HIGH and both are shared
primitives that reach all three pages.

## make-interfaces-feel-better

### Global

- [x] **mifb-1 HIGH** (applied 2026-09-17, `533cdd3`) `components/ui/button.tsx:14`, `option-tile.tsx:24`, `switch.tsx:17`, `select-variants.ts:8`, `back-link.tsx:25`
  - Before: `transition-[colors,opacity,box-shadow,scale]` (and `transition-[colors,box-shadow]`, `transition-[colors,scale]`)
  - After: `transition-[color,background-color,border-color,opacity,box-shadow,scale]`
  - Why: Same root cause as bui-13. `colors` is a custom-ident, not a property, so every hover/active fill and ink change on Button, OptionTile, Switch, SelectTrigger and BackLink snaps while `scale` / `opacity` / `box-shadow` still ease. design.md:1214 names this bug; Badge was fixed 2026-09-14.
- [x] **mifb-2 MEDIUM** (applied 2026-09-17, `751c216`) `components/ui/text-link.tsx:32`
  - Before: base recipe has no `transition-*` at all
  - After: append `transition-[color,text-decoration-color] duration-150 ease-out motion-reduce:transition-none`
  - Why: `hover:decoration-neutral-500` and every call-site `hover:text-foreground` snap. Call sites paper over it individually (`Models.tsx:832` pastes `transition-colors`, `Models.tsx:908` does not), so the same link eases on one line and snaps on the next.
- [ ] **mifb-3 MEDIUM** `components/ui/copy-button.tsx:163` (`inline-xs`, used 4x on Models)
  - Before: `size-5` + `before:inset-[-2px]` = 24x24 hit area
  - After: `before:inset-[-10px]` (40x40); at the table-row site cap at `-8px` so it does not collide with the row button 8px left
  - Why: Skill wants 40x40 minimum; 24x24 is exactly the WCAG 2.5.8 AA floor with nothing spare.
- [ ] **mifb-4 LOW** `components/ui/card.tsx:85` (`interactive`)
  - Before: `transition-[background-color,scale] ... active:scale-[0.98]`
  - After: add `will-change-transform`
  - Why: Button and IconActionButton both promote a layer for the identical 0.98 press; the Featured/Free cards do not, so the same gesture rasters differently. Note: bui-18 argues the opposite for IconActionButton; decide the will-change policy once.

### Token savings

- [x] **mifb-5 MEDIUM** (applied 2026-09-17, `751c216`) `pages/token-savings/SummaryCard.tsx:217-220`
  - Before: `className={cn("h-full rounded-full", fill)}` with inline `width: ${bar.share}%`
  - After: `cn("h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none", fill)`
  - Why: Toggling Compression or Caching re-derives every share, and a range change does the same. Today all bars jump. 200ms ease-out is the project's indicator rung; `transition-[width]` has four precedents in `components/ui`.
- [x] **mifb-6 MEDIUM** (applied 2026-09-17, `751c216`) `pages/TokenSavings.tsx:513-514, 560-561`
  - Before: `<SectionHeading as="h4" className="type-heading-16">`
  - After: `<SectionHeading as="h4">`
  - Why: `section-heading.tsx:104` locks its voice (layout-only className). `SummaryCard.tsx:322, 358, 387` renders the same primitive un-overridden at 14px, so the same element is two sizes on one page.
- [x] **mifb-7 MEDIUM** (applied 2026-09-17, `751c216`) `pages/TokenSavings.tsx:317`, `pages/billing/CreditsCard.tsx:440`, `pages/BillingFree.tsx:573`
  - Before: `className="mt-1 shrink-0"` on `<Switch size="lg">`
  - After: `className="shrink-0"`
  - Why: `size="lg"` is `h-6` (24px); the label above is `type-label-14`, a 20px line box. With `items-start` the switch centre is already 2px below the line's; `mt-1` pushes it to 6px. The two Compression switches (`:526`, `:575`) sit on a 24px `type-heading-16` line and are centred with `items-start` alone, so the same control sits at two heights on one page.
- [x] **mifb-8 MEDIUM** (applied 2026-09-17, `876afb4`; parent is rounded-xs after bui-1, so the child went to rounded-xs too: the ladder bottoms out at 4px, no smaller rung was invented) `pages/TokenSavings.tsx:449` (rendered inside the cards at `:508` and `:549`)
  - Before: `rounded-sm border bg-card/40 p-4` inside a `rounded-sm` card
  - After: `rounded-xs border bg-card/40 p-4`
  - Why: Third nesting level repeats its parent's 6px radius. Ladder is `md` 8, `sm` 6, `xs` 4 (`index.css:570-573`); one step per level.
- [x] **mifb-9 MEDIUM** (applied 2026-09-17, `876afb4`; same edit as bui-3) `pages/TokenSavings.tsx:430` + `:604`
  - Before: `<HeroNumeric className={`leading-none ${valueClassName}`}>` with `valueClassName="text-foreground text-xl"`
  - After: `<HeroNumeric>` (drop `leading-none` and `text-xl`)
  - Why: Same as bui-3. HeroNumeric defines two rungs, 24px and 32px (`hero-numeric.tsx:27-29`); `text-xl` + `leading-none` is a third, off-ladder display size invented at the call site.
- [x] **mifb-10 LOW** (applied 2026-09-17, `876afb4`) `pages/TokenSavings.tsx:428`
  - Before: `gap-x-2 gap-y-0.5`
  - After: `gap-x-2 gap-y-1`
  - Why: `gap-0.5` (2px) is the half-step that was reverted project-wide; `px-2.5` on Button is the one sanctioned exception. Only occurrence in all 14 files.
- [x] **mifb-11 LOW** (applied 2026-09-17, `876afb4`; applied with bui-1; the call sites restated `border border-border`, both dropped) `pages/TokenSavings.tsx:299, 328`, `pages/token-savings/SummaryCard.tsx:131`
  - Before: `rounded-sm border-border bg-transparent shadow-none`
  - After: `rounded-sm bg-transparent shadow-none`
  - Why: `Card`'s base already carries `border-border`; re-stating it hides the one utility being changed. (Radius itself: see bui-1.)
- [x] **mifb-12 LOW** (applied 2026-09-17, `876afb4`; 10 utilities across the 10 listed files, zero hits left there; 37 hits remain in 26 other files, left alone as out of scope) `TokenSavings.tsx:135`, `TokenSavingsDefault.tsx:33`, `TokenSavingsEnterprise.tsx:58`, `Models.tsx:278`, `Models.tsx:390`, `ModelShelves.tsx:64`, `FreeModels.tsx:45`, `Billing.tsx:111`, `BillingEnterprise.tsx:160`, `BillingFree.tsx:107`
  - Before: `type-copy-18 ... tracking-snug` / `type-copy-16 ... tracking-snug`
  - After: drop `tracking-snug`
  - Why: `index.css:874-880` already bakes `tracking-snug` into both voices. Ten dead utilities that read as a deliberate tracking decision.

### Models

- [x] **mifb-13 MEDIUM** (applied 2026-09-17, `751c216`) `pages/Models.tsx:830-842`
  - Before: `<TextLink className="type-label-14 inline-flex items-center gap-1 transition-colors ...">` + hand-placed `<ChevronLeft>`
  - After: `<BackLink label="Models" onClick={onBack} data-model-back-link="" />`
  - Why: `components/ui/back-link.tsx` is the primitive for this affordance. The hand-rolled one ships TextLink's underline (wrong for a nav affordance) and loses `active:scale-[0.98]`, the 44px-tall hit area (`after:inset-x-0 after:-inset-y-3`) and the chevron's `group-hover:-translate-x-px` nudge.
- [ ] **mifb-14 MEDIUM** `pages/Models.tsx:275`, `pages/models/ModelShelves.tsx:63`, `pages/models/FreeModels.tsx:42`
  - Before: `<h2 className="type-heading-24 m-0 text-foreground">`
  - After: `<PageTitle as="h2">`
  - Why: `page-title.tsx:37-43` maps `as="h2"` to the identical `type-heading-24` plus `text-balance`. Three of the page's four widest headings wrap unbalanced.
- [ ] **mifb-15 MEDIUM** `pages/models/ModelShelves.tsx:306`
  - Before: `<span className="type-copy-12 text-muted-foreground">{label}</span>`
  - After: `<span className="type-label-12 text-muted-foreground">{label}</span>`
  - Why: It names a value inside a `RowActionButton`, so design.md §3's test lands on Label (500), not Copy (400). `lint:design` cannot catch it. Every sibling KPI label (`kpi-tile.tsx:72`, `SummaryCard.tsx:135`, `Models.tsx:1085`) is an `Eyebrow`; this is the one 400-weight stat label in the family.
- [x] **mifb-16 MEDIUM** (applied 2026-09-17, `876afb4`; fixed by mifb-2) `pages/Models.tsx:905-920`
  - Before: TextLink with `hover:text-foreground focus-visible:text-foreground`, no transition; its `<ChevronDown>` has `transition-transform duration-150 ease-out`
  - After: fixed by mifb-2 (primitive), no call-site change
  - Why: "Show more": the label's ink snaps while the caret glides for 150ms. Same as bui-7.
- [x] **mifb-17 LOW** (applied 2026-09-17, `876afb4`; recipe copied from the +N capability chip in the same file) `pages/Models.tsx:1291`
  - Before: `<Badge title="Gateway markup over this provider's list price">`
  - After: `<Tooltip><TooltipTrigger render={<Badge .../>}>...` (recipe at `Models.tsx:737-757`)
  - Why: Native `title` is the only hover explanation on a page that otherwise speaks through the Tooltip primitive: two hover voices, OS delay, no keyboard path.
- [x] **mifb-18 LOW** (applied 2026-09-17, `876afb4`) `pages/Models.tsx:368`
  - Before: `type-copy-12 m-0 text-muted-foreground tracking-snug`
  - After: `type-copy-12 m-0 text-muted-foreground`
  - Why: Unlike `type-copy-16/18`, `type-copy-12` (`index.css:886-888`) sets no tracking, so this is a live deviation: a 12px body voice tightened while every other 12px body sits at normal.
- [x] **mifb-19 LOW** (applied 2026-09-17, `876afb4`) `pages/SetupModels.tsx:82`
  - Before: `<TableCell className="font-medium text-foreground">`
  - After: `<TableCell className="type-label-14 text-foreground">`
  - Why: Raw weight instead of the named voice; the identical cell on the catalog table (`Models.tsx:605`) and the shelf table (`ModelShelves.tsx:433`) use `type-label-14`.

### Billing

- [ ] **mifb-20 MEDIUM** `pages/billing/CreditsCard.tsx:338, 482, 568` vs `pages/BillingFree.tsx:471, 615, 657`
  - Before: `type-copy-12 m-0 text-destructive` (Pro/Enterprise) vs `type-copy-14 m-0 text-destructive` (Free)
  - After: pick one for all six; `type-copy-12` matches `type-input-helper`'s 12px tier (`index.css:917`)
  - Why: Same two dialogs, duplicated; all six field errors are the same string in the same place, rendered at two sizes depending on which tier opened them.
- [ ] **mifb-21 MEDIUM** `pages/billing/CreditsCard.tsx:446` vs `pages/BillingFree.tsx:579`
  - Before: `grid-cols-1 gap-4 min-[480px]:grid-cols-2` vs `grid-cols-1 gap-4 md:grid-cols-2`
  - After: `grid-cols-1 gap-4 min-[480px]:grid-cols-2` on both
  - Why: The dialog is a fixed 500px box, so the rung is read off the viewport either way. Between 480px and 768px the Pro auto-recharge dialog is two columns and the Free one is stacked.
- [x] **mifb-22 MEDIUM** (applied 2026-09-17, `876afb4`; resolved to rounded-xs per bui-9) `pages/billing/PaymentMethodCard.tsx:41`, `pages/BillingFree.tsx:808`
  - Before: `rounded-md border-border bg-card-muted p-4` inside `<Card>` (`rounded-md`)
  - After: `rounded-sm border-border bg-card-muted p-4`
  - Why: Inset repeats its parent's 8px radius. Note: bui-9 proposes `rounded-xs` for the same lines per design.md §6's 8 to 4 step; pick one.
- [ ] **mifb-23 MEDIUM** `pages/billing/CreditsCard.tsx:119-124`, `pages/BillingFree.tsx:259-264`
  - Before: `<CreditStatRow label="Auto-recharge" value={`+$${auto.topUp} below $${auto.threshold}`} />`, `mono` omitted
  - After: add `mono`
  - Why: The `dd` column is a stack of right-aligned currency values; "Used this month" and "Last top-up" are `font-mono tabular-nums`, this one is proportional sans, so its digits sit off the column.
- [x] **mifb-24 LOW** (applied 2026-09-17, `876afb4`; the mono/muted conditionals are untouched) `pages/billing/CreditsCard.tsx:647`, `pages/BillingFree.tsx:780`, `pages/BillingEnterprise.tsx:284`
  - Before: `<dd className={cn("m-0", mono && ...)}>`, no voice; inherits `type-copy-14` from the `<dl>`
  - After: put `type-copy-14` on the `<dd>` itself
  - Why: The inherited-voice case `design-tokens.md` calls out as invisible to `lint:design`.
- [ ] **mifb-25 LOW** `pages/billing/CreditsCard.tsx:632`, `pages/BillingFree.tsx:765`, `pages/BillingEnterprise.tsx:270`
  - Before: three byte-identical `CreditStatRow` / `StatRow` definitions
  - After: one export from `CreditsCard.tsx`, imported by the other two
  - Why: `Billing.tsx:21` already imports the shared one. mifb-23 and mifb-24 each had to be filed against three files for one defect. Flagged only; the code comments say the copies are deliberate and Enterprise billing is closed.
- [ ] **mifb-26 LOW** `pages/models/ModelShelves.tsx:358`
  - Before: `<Card className="overflow-x-auto" density="flush">`
  - After: `<div className="overflow-x-auto">` inside the Card, or drop the class
  - Why: `Card`'s base sets `overflow-hidden` on the same element; equal specificity, so the winner is stylesheet order. Block is currently unmounted (shelves hidden 2026-09-14); resurfaces if the shelves return.

### Decision needed

- mifb-4 vs bui-18: one `will-change` policy for pressables.

- Skill: Skill §12 wants `scale(0.96)`. design.md: Project standard is `active:scale-[0.98]`; 0.96 is too strong (design.md:1131). Resolution: Keep 0.98. The skill is overridden.
- Skill: §7 contextual icon animation must use `filter: blur(4px)` to 0. design.md: transition list excludes `filter`. Resolution: No blur proposed in any row.
- Skill: §3 shadows instead of borders for cards. design.md: Card tier is `border-border` + `shadow-xs` (design.md:1223). Resolution: mifb-8 and mifb-22 keep borders and change only radius.
- Skill: §11 image outlines as literal `rgba(0,0,0,0.1)`. design.md: `no-hardcoding.md`: literals live only in `index.css`. Resolution: Not raised; no photographic image in scope.
- Skill: §16 minimum 40x40 hit area. design.md: `IconActionButton` gets there via `after:-inset-3`; `CopyButton inline-xs` stops at 24x24. Resolution: mifb-3 proposes the pseudo-element route the project already uses.

### Not verified

- mifb-1 and mifb-2 are proved by compiling and reading the emitted CSS; the
  visual snap was not observed live.
- mifb-7's 6px offset is computed from `h-6` against a 20px line box, not
  measured on screen.
- mifb-26's cascade winner depends on the built sheet's rule order.
- Focus-ring clipping on `density="flush"` cards, tooltip placement and
  scroll-shadow behaviour were read in source only.
- No remaining `hover-fine:` uses in any of the 14 files. Site-wide
  survivors: `card.tsx:78-83` (a comment) and `feedback-fab.tsx:101`
  (bui-20).

### Skipped by decision

- mifb-3, mifb-14, mifb-15, mifb-26: churn-only, unmounted shelves, brand asset, or no visible effect (2026-09-17).
- mifb-20, mifb-21, mifb-23, mifb-25 (Free Billing duplicate set): the copies are marked deliberate in code and Enterprise billing is closed. Needs a copy decision ("Never" vs "None yet") first.

Verdict (run 2): the system underneath these pages is sound. One broken
`transition-property` keyword (mifb-1) accounts for most of the flatness, and
two missing primitives (`BackLink`, a transition on `TextLink`) account for
most of the inconsistency. The remaining rows are duplication artifacts:
every Billing finding exists two or three times because the same dialog,
stat row and card were copied instead of shared. Fix mifb-1, mifb-2, mifb-13 and mifb-25
and the rest shrink to a short cleanup pass.

## react-best-practices

The skill defines no report format (SKILL.md is a rule index). Rules cited
by their skill filename. Next.js-only rules skipped: all `server-*`,
`async-*`, `bundle-dynamic-imports`, `bundle-defer-third-party`,
`rendering-hydration-*`, `client-swr-dedup`. Route-level code splitting
already exists (`App.tsx` uses `lazy`).

### Global

- [x] **rbp-1 HIGH** (applied 2026-09-17, `533cdd3`) `js-cache-function-results` Shared: `lib/formatters.ts:17,30,54,68,79,89,97,112,125,138`
  - Before: `return new Intl.NumberFormat(LOCALE, options).format(n)` (every call constructs)
  - After: Module-level `Map` keyed on `JSON.stringify(options)`: `const nf = new Map(); function numberFormat(o) { const k = JSON.stringify(o); let f = nf.get(k); if (!f) { f = new Intl.NumberFormat(LOCALE, o); nf.set(k, f); } return f; }` and the same for `DateTimeFormat`
  - Why: Measured in this repo's Node: construct+format 20k times = 402ms, cached format = 7ms, 57x. `DateTimeFormat` is worse (606ms/20k). One `HistoryLedger` page at 25 rows builds about 50 `NumberFormat` objects per render; one keystroke in Add credits rebuilds 8. Every row here routes through this file.
- [ ] **rbp-18 MEDIUM** `advanced-event-handler-refs` (stable subscriptions) Shared, reached from `pages/TokenSavingsEnterprise.tsx:43-45`: `pages/teams/teams-store.ts:136,144,207,224`
  - Before: `useSyncExternalStore((cb) => teamsStore.subscribe(cb), ...)` creates a new `subscribe` function on every call
  - After: Hoist once at module scope: `const subscribe = (cb: () => void) => teamsStore.subscribe(cb);` and pass that reference in all four hooks
  - Why: React re-subscribes whenever the `subscribe` identity changes, so every render of `TokenSavingsEnterprise` tears down and re-adds 3 listeners (`useUserSettings`, `useCurrentUserTeam` via `useTeams` + `useViewRole`, `useOrgSettings`). Affects every Enterprise page.
- [ ] **rbp-17 LOW** `bundle-barrel-imports` Shared: `pages/Models.tsx:1`, `TokenSavings.tsx:1`, `BillingEnterprise.tsx:1`, `billing/CreditsCard.tsx:1`, `billing/HistorySection.tsx:1`, `billing/PaymentMethodCard.tsx:1`, `BillingFree.tsx:1`
  - Before: `import { Bot, ChevronDown, ChevronLeft } from "lucide-react"`
  - After: Leave as is unless dev-server boot becomes a complaint; if it does, add `optimizeDeps.include: ["lucide-react"]` to `vite.config.ts` rather than rewriting call sites to deep paths
  - Why: Downgraded from the rule's CRITICAL on purpose. The rule's figures and fix are Next.js specific. Vite + Rollup tree-shakes `lucide-react` per-icon ESM correctly, so there is no shipped-bytes cost. Residual cost is dev cold start and HMR only.

### Token savings

- [x] **rbp-5 MEDIUM** (moot, `d138ff4`: the controlled `savings` props were removed when the Summary was decoupled from the switches) `rerender-derived-state-no-effect` Token savings: `pages/TokenSavings.tsx:218-227`
  - Before: `const [local, setLocal] = useState(...); const value = savings ?? local; const update = (patch) => { const next = {...value, ...patch}; setLocal(next); onSavingsChange?.(next); }`
  - After: Only write local state when uncontrolled: `const controlled = savings !== undefined; const update = (patch) => { const next = {...value, ...patch}; if (!controlled) setLocal(next); onSavingsChange?.(next); }`
  - Why: When `TokenSavings` controls the switches (`:119-122`), every toggle writes a `local` value nothing reads, forcing a second render of the section and both cards. Two sources of truth for one value.
- [ ] **rbp-6 MEDIUM** `rerender-memo` Token savings: `pages/TokenSavings.tsx:82-86`
  - Before: `const summary = summaryFor(range, customRange, {...})` at render top
  - After: `useMemo(() => summaryFor(range, customRange, { compressionOn: savings.compression, cachingOn: savings.caching, plan }), [range, customRange, savings.compression, savings.caching, plan])`
  - Why: `summaryFor` runs `resolveWindow` (4 `Date` allocations), `periodCopy` (2 to 3 `Intl.DateTimeFormat` constructions), `allocateTenths` twice with a sort each, `bucketBreakdown`, and a final sort, on every render of the page.
- [ ] **rbp-7 MEDIUM** `rerender-memo` Token savings: `pages/TokenSavings.tsx:155-158,186-193`
  - Before: `const sparkLabels = sparkDates(effectiveRange, sparkStops)` and `data={resampleSpark(k.spark, sparkStops)}` inside the `.map`
  - After: `useMemo(() => sparkDates(effectiveRange, sparkStops), [effectiveRange, sparkStops])` and hoist the resampled series into one `useMemo` keyed on `[effectiveRange, sparkStops]`
  - Why: `sparkDates` constructs 1 to 2 `Intl.DateTimeFormat` per label: 24h = 12 stops = 24 constructions per render. Caveat: `CompactSpark` is not wrapped in `memo` (`components/ui/compact-kpi.tsx:180`) and rebuilds `points` at `:200`, so the three Recharts `AreaChart`s still reconcile on every parent render. Stopping that needs `export const CompactSpark = memo(...)`, a shared primitive.
- [ ] **rbp-14 LOW** `rendering-hoist-jsx` Token savings: `pages/TokenSavingsDefault.tsx:41-82`
  - Before: Three fully static empty-state tiles written inline in the `KpiRail`
  - After: `const EMPTY_TILES = [{ icon: BarChart2, label: "No savings yet" }, { icon: Layers, label: "No caching yet" }, { icon: Zap, label: "No compression yet" }] as const;` then map, or hoist the three elements to a module-level const
  - Why: 42 lines of identical markup with one icon and one string different; nothing depends on props or state.

### Models

- [ ] **rbp-2 MEDIUM** `js-index-maps` Models: `data/free-models.ts:79`, `pages/models/curation.ts:66`
  - Before: `models.find((m) => m.id === free.id)` / `ids.map((id) => models.find((m) => m.id === id))` over about 390 `MODELS` rows
  - After: Use the Map that already exists: `import { modelById } from "@/data/models"` then `modelById(free.id)` / `ids.map(modelById)`; keep the `models` param as an opt-in override that falls back to `find`
  - Why: `MODEL_BY_ID` is already built (`data/models.ts:1625`). `featuredModels()` does 4 scans, `freeModelRows()` 2, each shelf 4, all on every render of the Models list.
- [x] **rbp-8 MEDIUM** (applied 2026-09-17, `751c216`) `rerender-memo-with-default-value` Models: `pages/Models.tsx:469-472`
  - Before: `options={CAPABILITY_ORDER.map((c) => ({ value: c, label: CAPABILITY_META[c].label }))}`
  - After: Hoist to module scope: `const CAPABILITY_OPTIONS = CAPABILITY_ORDER.map(...)`; then `options={CAPABILITY_OPTIONS}`
  - Why: `components/ui/multi-select.tsx:161` lists `options` in a `useMemo` dep array. A new array identity every render defeats that memo on every keystroke in the model search box.
- [x] **rbp-9 MEDIUM** (applied 2026-09-17, `751c216`) `rerender-split-combined-hooks` Models: `pages/Models.tsx:208-229`
  - Before: One `useMemo` does filter then `sortModels(rows, sort)` with deps `[modality, search, provider, features, sort]`
  - After: Split: `const filtered = useMemo(() => MODELS.filter(...), [modality, search, provider, features])` then `const rows = useMemo(() => sortModels(filtered, sort), [filtered, sort])`
  - Why: Changing only the sort Select re-runs the full 390-row filter (three `toLowerCase().includes` per row) for a result that cannot change.
- [x] **rbp-10 MEDIUM** (applied 2026-09-17, `751c216`) `rerender-use-deferred-value` Models: `pages/Models.tsx:199,208,236,353`
  - Before: `const [search, setSearch] = useState("")`, filter runs synchronously against `search` on every keystroke, then 25 `TableRow`s each with `CapabilityStrip` (up to 5 `Tooltip`s) and `ProviderStack` re-render
  - After: `const deferredSearch = useDeferredValue(search);` use it inside the filter memo (paired with rbp-9), keep `search` on the `SearchInput`, dim the table with `search !== deferredSearch`
  - Why: Keeps the input responsive while 390 rows filter and up to 25 tooltip-bearing rows reconcile. Depends on rbp-9 landing first.
- [ ] **rbp-16 MEDIUM** `bundle-barrel-imports` (import from source, not through a re-exporting module) Models: `pages/Models.tsx:78-79` imports from `models/FreeModels` and `models/ModelShelves`, which import back at `pages/models/ModelShelves.tsx:28` (`CapabilityStrip, NumericCell, ProviderStack`) and `pages/models/FreeModels.tsx:8` (`CapabilityStrip`)
  - Before: Two import cycles through a 1528-line page module
  - After: Move `NumericCell`, `CapabilityStrip` and `ProviderStack` out of `Models.tsx` into `pages/models/cells.tsx`; all three files import from there
  - Why: Works today only because all three are hoisted `function` declarations, so no TDZ read happens at module-eval time. Adding one module-level `const` derived from an imported binding in `Models.tsx` breaks it at runtime, not at build.
- [x] **rbp-3 LOW** (applied 2026-09-17, `876afb4`; the Set is hoisted into ModelDetailPage's body as orderedCapabilities) `js-set-map-lookups` Models: `pages/Models.tsx:875`
  - Before: `CAPABILITY_ORDER.filter((c) => model.capabilities.includes(c))`
  - After: `const have = new Set(model.capabilities); CAPABILITY_ORDER.filter((c) => have.has(c))`
  - Why: The same file already does exactly this at `:698`; the detail page is the inconsistent copy. Tiny N, consistency more than speed.
- [ ] **rbp-4 LOW** `js-min-max-loop` Models: `pages/models/curation.ts:120,131`
  - Before: `sortModels(models, "popular").slice(0, SHELF_ROW_COUNT)` copies and sorts all rows to take 4
  - After: For `popular` (identity order) use `models.slice(0, SHELF_ROW_COUNT)`; for `newest` keep the sort, it runs over the 4 allowlisted rows only
  - Why: `sortModels` does `rows.slice()` unconditionally (`data/models.ts:252`). `ModelShelves` is currently not mounted, so cost is latent.
- [ ] **rbp-12 LOW** `rerender-memo` Models: `pages/models/ModelShelves.tsx:59,345`, `pages/models/FreeModels.tsx:29`
  - Before: `const models = featuredModels()` / `const rows = shelfRows(shelf)` / `const rows = freeModelRows()` at render top
  - After: Wrap each in `useMemo(..., [])` (inputs are module constants), or fix rbp-2 and rbp-4 so the calls are O(1)
  - Why: Each re-derives from `MODELS` on every render of the Models list, which happens on every search keystroke.

### Billing

- [x] **rbp-11 MEDIUM** (applied 2026-09-17, `751c216`) `rerender-memo-with-default-value` Billing: `pages/billing/CreditsCard.tsx:92`
  - Before: `lastTopUp = lastTopUpLabel()` as a default parameter value
  - After: Hoist: `const DEFAULT_LAST_TOP_UP = lastTopUpLabel();` then `lastTopUp = DEFAULT_LAST_TOP_UP`
  - Why: A default param is evaluated on every render. `lastTopUpLabel` (`data/billing-history.ts:71`) does a `.find` plus `formatDateNumeric`, one `Intl.DateTimeFormat` construction per render of the Pro and Enterprise Credits cards.
- [ ] **rbp-15 MEDIUM** (`bundle-` category intent) Billing: `pages/BillingFree.tsx:194-238,240-303,309-499,503-763,765-791,798-829` vs `pages/billing/CreditsCard.tsx:39-83,85-170,176-366,370-630,632-658` and `pages/billing/PaymentMethodCard.tsx:23-85`
  - Before: About 600 lines of `AutoRechargeConfig`, `readAutoRecharge`, `CreditsCard`, `AddCreditsDialog`, `AutoRechargeDialog`, `CreditStatRow`, `PaymentMethodCard` duplicated verbatim, sharing the same `"billing.autoRecharge.v2"` storage key
  - After: 1:1 swap available today: `BillingFree.tsx:798-829` is byte-equivalent to `<PaymentMethodCard empty />`; delete it and import (that file's header at `:20` cites `BillingFree.tsx:798` as its source). For Credits, import `CreditsCard` and pass `balance={0}`; three copy deltas must be preserved or decided first: Free prints "Never" for Last top-up where shared prints "None yet" (`CreditsCard.tsx:130`); Free error copy is `type-copy-14` vs shared `type-copy-12` (`BillingFree.tsx:471` vs `CreditsCard.tsx:338`); Free dialog grid is `md:grid-cols-2` vs shared `min-[480px]:grid-cols-2` (`BillingFree.tsx:579` vs `CreditsCard.tsx:446`)
  - Why: Two copies already drifted in three places. Both chunks ship both copies. The `PaymentMethodCard` half is risk-free; the Credits half needs a `lastTopUp="Never"` prop or a copy decision first. Same root cause as bui-10 and mifb-20, 21, 25.
- [ ] **rbp-13 LOW** `rerender-memo` Billing: `pages/BillingEnterprise.tsx:64,299,300,367`
  - Before: `const view = enterpriseBillingView(state)`, `enterpriseSeatCount()`, `enterprisePlanSeats()`, `nextInvoiceUsd()` at render top
  - After: `useMemo(() => enterpriseBillingView(state), [state])`; hoist the three seat helpers to module constants, they read only `MEMBER_ROWS`
  - Why: Cheap per call, but `view` is a fresh object each render so `StateBanner` and `PlanCard` can never be memoized later. Safe: `view.ledgerRows` is the `HISTORY_ROWS` reference itself (`data/billing-enterprise.ts:166`).

### Decision needed

- rbp-6, rbp-7, rbp-16, rbp-18: Token savings memoization, the Models import cycle, the teams-store subscribe identity. Correct but no visible effect.

### Not verified

- Wall-clock impact of rbp-6, rbp-7, rbp-9 and rbp-10 in a browser. The Intl ratio in rbp-1 is
  measured (Node, this machine); everything else needs React DevTools
  Profiler to size.
- Whether Recharts 3 internally memoizes on `data` identity (rbp-7).
- Production bundle deltas for rbp-15, rbp-16 and rbp-17. No `vite build --report` run.
- rbp-16's TDZ hazard is a static reading of the cycle, not an observed failure.

### Skipped by decision

- rbp-2, rbp-4, rbp-12, rbp-13, rbp-14, rbp-17: churn-only, unmounted shelves, or no visible effect (2026-09-17).
- rbp-15 (Free Billing duplicate set): the copies are marked deliberate in code and Enterprise billing is closed. Needs a copy decision ("Never" vs "None yet") first.

### Compliant, checked and clean

`rerender-no-inline-components`: no component declared inside another;
`TokenSavings.tsx:507,548` assign JSX elements, not component types.
`rerender-lazy-state-init`: `CreditsCard.tsx:99`, `BillingFree.tsx:243`,
`TokenSavings.tsx:71`, `BillingFree.tsx:116` all correct.
`js-tosorted-immutable`: `sortRows` and `sortModels` copy before sorting;
every `.sort()` in `token-savings-summary.ts` runs on a fresh array.
`rendering-conditional-render`: every `&&` guards on a boolean, never a
number. `client-localstorage-schema`: the auto-recharge key is versioned,
field-validated and try/catch wrapped. `CreditsCard.tsx:152` keyed reset is
the react.dev-endorsed pattern. `teams-store.ts` snapshots return stable
references. `js-hoist-regexp`: the code tokenizer's regexes are at module
scope (`Models.tsx:1303-1314`).

Verdict (run 3): these surfaces are in better shape than the file sizes
suggest: expensive list work is memoized in the right places, sorting is
immutable, lazy initializers and keyed resets are used correctly, no
component is declared inside another. The cost is concentrated in one
shared utility and a handful of unmemoized derivations. rbp-1 pays for
itself across every table in the app. rbp-5 to rbp-11 are one-to-three line
edits. rbp-16 is the only structural item that can fail at runtime. The
five to take first: rbp-1, rbp-5, rbp-8, rbp-11, rbp-16.

## color-audit

Manual token sweep, not an agent skill. Checklist of every raw colour in `src` that was not a design token, what it became, and which tokens were missing. Severity: HIGH = wrong or dead colour shipping; MEDIUM = a role with no token, copied across files; LOW = single site or cosmetic. Every proposed token landed in `index.css` (`:root` + `.dark`, mapped in `@theme inline`) and is documented in design.md §2.

### Scope and inventory

- Swept `src/**/*.{ts,tsx,css}` minus the two data blobs
  (`request-bodies.ts`, `models-catalog.ts`). Transcript strings inside
  `requests.ts` / `request-previews.ts` matched `text-green` and
  `text-emerald`; those are captured shell commands, not UI, and are excluded.
- Four literal classes: bare hex, `rgb()/oklch()/hsl()`, arbitrary
  `*-[…]` colour classes, inline `style` colours.
- One class of near-literal: a raw Tailwind palette atom (`bg-neutral-100`,
  `text-blue-700`, `bg-white`) where `design.md` §2 already names a semantic
  token or a family (`--promo-*`) for that role.
- Yardstick: `design.md` §2 "Semantic token quick-reference", "Do not use",
  and the `--promo-*` / destructive-ladder precedents for how a family is
  shaped. Vendor SVG fills are sanctioned there and are not findings.

Inventory (counts for `src` outside `index.css`):

Counts are for `src` outside `index.css`.

- Hex literals: 128 in 12 files. 77 are vendor SVG fills (sanctioned). 27 are
  seven unused dotmatrix presets. The rest are comments, Recharts attribute
  selectors, `text-[var(--color-syntax-*)]`, and one order number in copy.
- `rgba()` literals: 3, all in `AuthLayout.tsx`.
- Raw palette classes (`blue`, `violet`, `neutral`, `white`): 167 uses,
  51 distinct classes, 30 files. Blue is 130 of them.
- Semantic classes on the status families (`success`, `warning`, `danger`,
  `destructive`): about 330 uses. That side is healthy.
- Tokens referenced but never defined: `--color-dot-on` (dead path, removed in col-1).
- Tokens defined but never consumed: `--promo-foreground` (documented).

### Global

- [x] **col-1 HIGH** `src/lib/dotmatrix-core.tsx:29-97`
  - Before: a `colorPreset` prop with eight presets. Seven (`solid-mint`,
    the six `grad-*`) carried 27 hex values and CSS gradients; the eighth,
    `solid-theme`, read `var(--color-dot-on)`, a token defined nowhere. No
    caller in `src` passed `colorPreset`, so the whole branch was dead and
    every dot matrix already painted with `color` (default `currentColor`).
  - After (applied 2026-09-18): `DotMatrixColorPreset`,
    `DOT_MATRIX_COLOR_PRESETS`, `resolveDmxColorTokens` and the
    `colorPreset` prop removed from both base components. `color` is the
    only colour input. No `--color-dot-on` token is needed.
  - Why: dead hex is still hex, and a prop that points at an undefined token
    is a trap for the next caller. The audit first read this as a live bug;
    it was not, because nothing reached the preset path.
  - Applied: 2026-09-18, pass 1.
- [x] **col-14 HIGH** Pro tier tint, six copies
  `src/pages/Policies.tsx:411`, `TokenSavings.tsx:522`,
  `onboarding-shared.tsx:89`, `plan-comparison-dialog.tsx:131`,
  `plan-comparison-dialog-pro.tsx:134`, `src/components/ui/option-tile.tsx:60`
  - Before: `border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25
    dark:border-blue-400/30 dark:from-blue-500/10 dark:to-blue-500/5`, pasted
    five times; `option-tile` is the flat twin `border-blue-200 bg-blue-50
    dark:border-blue-400/30 dark:bg-blue-500/15`. `callout.tsx:26` is a third
    variant on `border-blue-300 bg-blue-50 dark:border-blue-500/30`.
  - After: extend the promo family. `--promo-border` already exists
    (blue-200 light, blue-400 at 50% dark; the pages use 30%, pick one).
    Add `--promo-surface` (`blue-50` / `blue-500` at 15%) and
    `--promo-surface-wash` (the gradient, same shape as `--promo-wash`).
    Sites read `border-promo-border bg-promo-surface` or `[background:var(--promo-surface-wash)]`.
    Callout decides whether it is promo (join) or info (col-10 family).
  - Why: this is the exact case the `--promo-*` block in `index.css:410`
    was written for, and the family stopped one step short of the surface.
  - Applied: 2026-09-18, pass 1, as `--tier-pro-surface` / `--tier-pro-surface-wash` / `--tier-pro-border`. Shifts accepted, each noted in a file comment: dark Pro border blue-400 at 30% to blue-500 at 30% (Card's documented rung) on five banners, OptionTile and pro-upgrade-card; pro-upgrade-card light fill blue-25 to blue-50. Callout resolved as an info surface (col-10).
- [x] **col-15 HIGH** Pro tier ink and badge, twelve sites
  badge: `src/components/ui/badge.tsx:66`, `Policies.tsx:429`,
  `TokenSavings.tsx:580`, `teams/TokenSavingsPane.tsx:549`,
  `pro-upgrade-card.tsx:39`
  ink: `Policies.tsx:672`, `teams/PoliciesPane.tsx:458`,
  `DashboardDefault.tsx:386`, `pro-upgrade-card.tsx:41`,
  `plan-comparison-dialog.tsx:160`, `plan-comparison-dialog-pro.tsx:163`,
  `Billing.tsx:129`
  - Before: badge recipe `bg-blue-100 text-blue-700 dark:bg-blue-500/15
    dark:text-blue-300` five times. Ink `text-blue-700 dark:text-blue-400`
    six times, but `Billing.tsx:129` and the badges use `dark:text-blue-300`,
    and `SetupManual.tsx:172,447` plus `onboarding-shared.tsx:23,207` use
    `text-blue-600 dark:text-blue-400`. Three dark inks and two light inks
    for one role.
  - After: `--tier-pro` (blue-700 / blue-400), `--tier-pro-foreground`
    (blue-700 / blue-300, ink on wash), `--tier-pro-wash` (blue-100 /
    blue-500 at 15%). Badge `pro` = `bg-tier-pro-wash text-tier-pro-foreground`.
    Icon tints and the Billing hero = `text-tier-pro`. Decide whether the
    SetupManual / onboarding 600 step is a different role (link-ish
    step indicator) or drift; if drift, it joins `text-tier-pro`.
  - Why: the tier is a first-class concept (Card `tone="pro"`, Badge `pro`,
    the view-role switch) with no token, so every file re-derives it.
  - Applied: 2026-09-18, pass 1: `--tier-pro`, `--tier-pro-foreground`, `--tier-pro-wash`, both themes, documented in design.md §2 "Plan tier colours". `--tier-pro` stands alone from `--promo-cta`. Shift accepted: Billing hero dark ink blue-300 to blue-400. Still open: the setup step-indicator ink (see Decision needed).
- [x] **col-16 HIGH** Enterprise tier, three sites and no ramp
  `src/components/ui/badge.tsx:62`, `card.tsx:72` (`data-[tone=enterprise]`
  selectors), `src/pages/BillingEnterprise.tsx:311`
  - Before: `bg-violet-100 text-violet-700 dark:bg-violet-500/15
    dark:text-violet-300`, `border-violet-200 dark:border-violet-500/30`,
    `text-violet-700 dark:text-violet-300`. Violet is Tailwind's default
    scale; `index.css` declares no violet ramp and `design.md` §2 does not
    list it as a brand or status hue. Badge's own comment records this.
  - After: `--tier-enterprise`, `--tier-enterprise-foreground`,
    `--tier-enterprise-wash`, `--tier-enterprise-border`, resolving to the
    default violet steps used today. Add a "Plan tier colours" subsection to
    `design.md` §2 naming Pro = blue, Enterprise = violet, with the four
    roles each. Only then does violet stop being an undocumented hue.
  - Why: the user set the hue (2026-09-16), so this is documentation and
    tokenisation, not a colour change. Same family shape as col-15 so the
    two tiers read as one system.
  - Applied: 2026-09-18, pass 1: `--tier-enterprise`, `-foreground`, `-wash`, `-border`, both themes, documented in design.md §2 "Plan tier colours".
- [x] **col-2 MEDIUM** `src/layouts/AuthLayout.tsx:188,189,236`
  - Before: three inline gradients on `rgba(255,255,255,0.05)`.
  - After: one token in the `--canvas-*` block of `index.css`,
    `--auth-glow: color-mix(in oklch, var(--color-white) 5%, transparent)`,
    consumed as `var(--auth-glow)` in the same three gradients.
  - Why: the only `rgba()` in `src` outside `index.css`. Same value three
    times is a token by the promo-family precedent.
  - Applied: 2026-09-18, pass 2, folded into the `--auth-*` family (six tokens, `:root` only, fixed dark) that owns every colour on the AuthLayout panel including both glow gradients.
- [x] **col-7 MEDIUM** modal scrim, four copies
  `src/components/ui/dialog.tsx:35`, `sheet.tsx:58`, `alert-dialog.tsx:29`,
  `notifications-menu.tsx:164`
  - Before: `bg-neutral-900/40` three times, `bg-neutral-900/50` once. No
    dark variant, so the scrim is lighter than the dark page behind it.
  - After: `--overlay` in `:root` and `.dark`
    (`color-mix(in oklab, var(--color-neutral-900) 40%, transparent)` light,
    `var(--color-neutral-950)` at 60% dark), mapped to `--color-overlay`,
    consumed as `bg-overlay`. Notifications takes the same token; if 50% is
    deliberate, document why on the token.
  - Why: one role, four sites, two strengths, no theme handling.
  - Applied: 2026-09-18, pass 3: `--overlay` (neutral-900 at 40%) and `--overlay-strong` (50%), `:root` only, on dialog (both backdrops), sheet, alert-dialog, notifications. The proposed dark twin was NOT added; it would have changed the dark scrim. Open as a future tune.
- [x] **col-8 MEDIUM** dark terminal surface
  `src/components/ui/code-card.tsx:79,80,336,341`, `code-panel.tsx:93`
  - Before: `bg-neutral-800`, `bg-neutral-700`, `border-neutral-900/60`,
    `text-neutral-100`, `text-neutral-400`.
  - After: a `--terminal-*` family beside `--chat-bubble-*`:
    `--terminal` (surface), `--terminal-chrome` (header strip),
    `--terminal-edge`, `--terminal-foreground`, `--terminal-foreground-muted`.
    Identical in both themes, declared once. The traffic lights already have
    `--color-traffic-*`.
  - Why: the terminal is intentionally dark on both themes, which is exactly
    the case where a raw step looks correct today and has no owner tomorrow.
    Confidence moderate: check `design.md` CMP-012 first; if it pins the ramp
    steps, the family still wins because it names the role.
  - Applied: 2026-09-18, pass 3: `--terminal{,-chrome,-edge,-foreground,-foreground-muted}`, `:root` only, fixed dark, on code-card and code-panel. Exact values, zero visual change.
- [x] **col-9 MEDIUM** brand-blue monogram, five copies
  `src/components/ui/monogram-types.ts:16`, `sidebar.tsx:208,411,491`,
  `user-menu.tsx:45`
  - Before: `bg-blue-700 text-white` on four hand-rolled avatar circles plus
    the `blue` monogram tone. `monogram-types.ts:20` `ink` is
    `bg-neutral-700 text-white`.
  - After: the three sidebar sites and user-menu render `Monogram` instead
    of their own circle. `Monogram` `blue` reads `bg-promo-cta
    text-promo-cta-foreground` (blue-700 / white light, blue-600 dark), or a
    new `--tier-pro` token from col-14. `ink` reads `bg-surface-strong
    text-surface-strong-foreground`.
  - Why: four copies of a primitive's recipe, and `text-white` is a palette
    atom standing in for a foreground token.
  - Applied: 2026-09-18, pass 3, narrowed: design.md §2 "Kept as-is" keeps white-on-brand fills, and `Monogram` sizes (20 / 28) do not match the circles (24 / 32 / 28), so no component swap and no token. The four circles reuse `AVATAR_TONE_CLS.blue` instead of restating `bg-blue-700 text-white`.
- [x] **col-18 MEDIUM** vendor colours scattered across four icon files
  `src/components/icons/model-providers.tsx`, `gateway-providers.tsx`,
  `vendor-meta.tsx`, `src/components/ui/google-g.tsx`
  - Before: 77 brand hexes as `fill=` / `stopColor=` attributes and
    `color:` fields, the same value repeated across files (Google blue in
    three places, Alibaba orange and Cohere coral in two).
  - After (applied 2026-09-18): `src/components/icons/brand-colors.ts` is
    the one file in `src` that holds a raw hex. `BRAND_COLORS` keys by brand,
    one named colour per fill, `primary` for the single-hue swatch;
    `MONO_MARK_COLOR` names the theme-following ink. All marks and
    `VENDOR_META` / `PROVIDER_META` read from it. `google-g.tsx` moved into
    `icons/`. Adding a vendor is one entry, one mark, one meta row.
  - Why: brand colours are not design tokens and must not enter `@theme`
    (they would generate utilities and shift with a reskin), but they still
    need one owner so the lint allowlist is a file, not a folder.
  - Applied: 2026-09-18, pass 1.
- [x] **col-17 MEDIUM** `scripts/check-design-tokens.mjs` check 1
  - Before: `COLOR_RE` fires only on `*-[#…]` / `*-[rgb(…)]` arbitrary
    classes. It cannot see a bare `"#34d399"` string (col-1), an inline
    `rgba(` (col-2), `fill="#…"` on an SVG, or a raw palette class that has
    a semantic twin (`bg-white`, `bg-neutral-100`, `border-neutral-200`,
    `text-neutral-900`, `ring-neutral-*`).
  - After: check 5 `[raw-color]`: any hex, `rgb`, `hsl`, `oklch` literal in
    `src` outside `index.css`; allowlist only
    `src/components/icons/brand-colors.ts` and a `design-allow-raw-color`
    waiver comment within 5 lines above (same shape as `design-allow-raw-type`). Check 6
    `[raw-palette]`: the "Do NOT write" column of the design.md
    quick-reference as a regex over `src/pages`, `src/layouts`,
    `src/components`. Both documented under design.md "How it's enforced".
  - Why: the raw-type check went 40 to 0 in a day once it existed. Colour
    has the same drift pattern and no gate.
  - Applied: 2026-09-18, pass 3: checks 5 `[raw-color]` and 6 `[raw-palette]` in `scripts/check-design-tokens.mjs`; documented in design.md "How it's enforced" and `.claude/rules/design-tokens.md`. Allowlist is `brand-colors.ts` alone; `src/data` skipped; waiver `design-allow-raw-color`.
- [x] **col-3 LOW** `src/components/ui/code-card.tsx:66-74`,
  `src/components/ui/code-panel.tsx:103-107`
  - Before: `text-[var(--color-syntax-keyword)]` and siblings, 12 uses.
  - After: `text-syntax-keyword`, `text-syntax-variable`,
    `text-syntax-property`, `text-syntax-terminal-blue`. The `--color-syntax-*`
    atoms already live in `@theme`, so Tailwind v4 generates these utilities.
  - Why: the arbitrary form hides the token from the theme scale and from
    class sorting. Also rename `--color-syntax-terminal-blue`: it resolves to
    `success-700` / `success-400` and is green in both themes.
  - Applied 2026-09-18: plain `text-syntax-*` utilities in both files;
    token renamed `--color-syntax-literal` in both themes.
  - Applied: 2026-09-18, pass 2: plain `text-syntax-*` utilities in both files; token renamed `--color-syntax-literal` in both themes.
- [x] **col-4 LOW** `src/components/ui/chart.tsx:64`
  - Before: `[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border`
    and the `#fff` twin.
  - After: keep. These are attribute selectors matching Recharts' own
    default stroke so it can be overridden with `stroke-border`. Add a
    one-line comment naming that, so a future hex lint has a waiver to read.
  - Why: no colour is applied; the hex is a selector key.
  - Applied 2026-09-18: JSX comment above the wrapper div.
  - Applied: 2026-09-18, pass 2: JSX comment above the wrapper div; `design-allow-raw-color` waiver (the one use).
- [x] **col-5 LOW** comments and copy
  - `segmented-pill.tsx:81` `#11141714`, `sidebar-upgrade-card.tsx:14`
    `#171717`, `RequestDetailBody.tsx:1299` `order #12345`. No action; listed
    so the count reconciles.
  - Applied: 2026-09-18, pass 2: no code change, count reconciled.
- [x] **col-10 LOW** `src/components/ui/status-dot.tsx:7`,
  `src/components/ui/badge.tsx:54`
  - Before: `info: "bg-blue-600"`; badge `info` is
    `bg-blue-700/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300`.
  - After: an `--info` family mirroring the destructive ladder:
    `--info` (blue-600 / blue-400), `--info-foreground` (blue-700 / blue-300
    ink on wash), `--info-subtle` at 10%, `--info-muted` at 15%. StatusDot
    reads `bg-info`; Badge `info` reads `bg-info-subtle text-info-foreground`.
  - Why: success, warning and danger each have a family; info is the one
    status with none, so every consumer picks its own blue step.
  - Applied: 2026-09-18, pass 2: `--info` family (six tokens) completes the four status families; StatusDot, Badge `info` and Callout bind to it with no value change.
- [x] **col-11 LOW** `src/components/ui/text-link.tsx:38`
  - Before: `decoration-neutral-200 hover:decoration-neutral-500` in light,
    `dark:decoration-border dark:hover:decoration-muted-foreground` in dark.
  - After: `decoration-border hover:decoration-muted-foreground` with no
    `dark:` pair. Note this moves the light hover from neutral-500 to
    neutral-600 (`--muted-foreground`); design.md §2 step table still says
    500, so update that row or accept the one-step shift.
  - Why: the dark side already uses the tokens; light should match.
  - Applied: 2026-09-18, pass 2. Shift accepted: light hover underline neutral-500 to neutral-600 (`--muted-foreground`).
- [x] **col-12 LOW** `src/layouts/AuthLayout.tsx:185,213,233`
  - Before: `bg-neutral-950`, `text-white`, `border-white/10 bg-neutral-900
    text-white`, `text-blue-400`.
  - After: `bg-surface-strong text-surface-strong-foreground` for the panel
    (surface-strong is neutral-900 today; if the panel must stay 950, add
    `--auth-canvas` next to col-2's `--auth-glow`). Border uses
    `border-border` scoped under a local `.dark` wrapper, which is what the
    dark theme already resolves it to. Icon ink `text-promo-accent`.
  - Why: the auth panel is a fixed-dark surface like the terminal; same
    argument as col-8.
  - Applied: 2026-09-18, pass 2, via the `--auth-*` family (see col-2). Follow-up noted: `AuthLayout.tsx:60,107` DotRadar runtime fills use `color-mix(... var(--color-neutral-800) ..., white ...)` in template literals; ramp-referencing, not hex, left alone.
- [x] **col-6 NONE** vendor SVG fills
  - `src/components/icons/model-providers.tsx` (27),
    `gateway-providers.tsx` (22), `vendor-meta.tsx` (20),
    `src/components/ui/google-g.tsx` (8). Sanctioned by `design.md` §2
    "Vendor brand colors". Superseded by col-18: the hexes now live in one
    file and the lint allowlist is that file alone.
  - Applied: folded into col-18.

### Policies

- [x] **col-13 LOW** `src/pages/policies/config.ts:75`
  - Before: `redact` radio is `data-checked:border-neutral-700
    data-checked:bg-neutral-700 dark:…muted-foreground`.
  - After: `data-checked:border-primary data-checked:bg-primary` in both
    themes (`--primary` is neutral-900 / neutral-200). If the 700 step is
    load-bearing next to warning-600 and danger-700, say so in the comment.
  - Why: `flag` and `block` on the same line use ramp steps of a status
    family; `redact` is the neutral one and should bind to the neutral
    semantic.
  - Applied: 2026-09-18, pass 2. Shift accepted: `redact` radio and card border to `--primary` (light 700 / 600 to 900, dark 400 to 200).

### Decision needed

- col-15: the setup step-indicator ink `text-blue-600 dark:text-blue-400` (`onboarding-shared.tsx:23,210`, `SetupManual.tsx:172,447`) is left raw. Same role as `--tier-pro` or its own token.
- col-7: a dark twin for `--overlay` would change the dark scrim. Future tune, not taken.

Verdict (run 4): all 18 items closed 2026-09-18 in three passes. col-1 was a live bug; col-14, col-15 and col-16 removed about 60 of the 130 raw blue and violet uses and gave the tier concept a name.

## Cross-skill notes

Overlap: the same root causes surfaced in more than one report. Fixed once, ticked in each.

- `transition-[colors,...]` names a non-property; hover fills snap on Button, Switch, OptionTile, Select, Toggle, BackLink: bui-13, mifb-1.
- Free Billing duplicates `CreditsCard`, `PaymentMethodCard`, `CreditStatRow`; copies drifted (error size, fold breakpoint): bui-10, bui-11, mifb-20, mifb-21, mifb-25, rbp-15.
- Payment method inset repeats parent `rounded-md`: bui-9, mifb-22.
- Token savings inset cards one radius tier off: bui-1, mifb-8, mifb-11.
- `HeroNumeric` forced to `text-xl leading-none` at the call site: bui-3, mifb-9.
- Models "Show more" label snaps while chevron eases: bui-7, mifb-2, mifb-16.
- `CopyButton` label mode swaps glyph by mount: bui-8, bui-16, bui-19, mifb-3.

Follow-on work the 2026-09-17 runs triggered (not items):

- `lint:design` gained a `[raw-type]` check: a bare `font-*` / `text-xs`..`2xl` with no `type-*` voice in `src/pages` or `src/layouts` fails. Waiver `design-allow-raw-type` per site. Documented in design.md and `.claude/rules/design-tokens.md`.
- Sweep of the 40 hits it found: 31 converted to voices, 9 waived with a reason. Three menu-style rows moved from 400 to 500 (design.md lists menu items as Label); `menu.tsx` primitive still renders items at 400, follow-up.
- Request and Conversation detail KPI rails moved onto `CompactKpi`, so KPI values are `HeroNumeric` sans tabular 24px, never mono (user rule). The request count pill is `TabsCount` (badge voice, mono 12). `HeroNumeric` docblock and design.md line 450 updated.
- Token savings Summary decoupled from the Savings options switches (`d138ff4`) and the off state removed entirely (user: the toggle has no effect on the summary; a demo cannot make time pass).
- 37 dead `tracking-snug` utilities remain on `type-copy-16/18` lines in 26 other pages (outside the audited set); harmless, sweep when convenient.
