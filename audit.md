# UI audit - Token savings, Models, Billing (all workspaces)

Date: 2026-09-17. Read-only review by the `front-end-developer` agent, one
run per skill, same file set. Checklist: tick an item when it is applied and
verified, and append the commit hash. Work one section at a time; pick
items by number within a section (for example "better-ui 13, 14").

Scope (every workspace twin): `TokenSavings.tsx`, `TokenSavingsDefault.tsx`,
`TokenSavingsEnterprise.tsx`, `TokenSavingsFree.tsx`,
`token-savings/SummaryCard.tsx`; `Models.tsx`, `ModelsDefault.tsx`,
`ModelsFree.tsx`, `SetupModels.tsx`, `models/FreeModels.tsx`,
`models/ModelShelves.tsx`, `models/curation.ts`; `Billing.tsx`,
`BillingDefault.tsx`, `BillingEnterprise.tsx`, `BillingFree.tsx`,
`billing/CreditsCard.tsx`, `billing/HistorySection.tsx`,
`billing/PaymentMethodCard.tsx`. Shared primitives are reported once as a
root cause. Paths are relative to `src/`.

Already decided, not re-flagged: press 0.98, lucide stroke 1.75, radius
ladder 24 / 16 / 8 / 4, `border-border` + `shadow-xs` surfaces, no `filter`
in transition lists, Summary card breakdown labels (pending team), Enterprise
seats "4 of 4", CMS Featured badge wording, the two rams Models items from
2026-09-16.

## Overlap across the three skills

The same root causes surfaced in more than one report. Fix once.

| Root cause | better-ui | make-interfaces-feel-better | react-best-practices |
| --- | --- | --- | --- |
| `transition-[colors,...]` names a non-property; hover fills snap on Button, Switch, OptionTile, Select, Toggle, BackLink | 13 | 1 | |
| Free Billing duplicates `CreditsCard`, `PaymentMethodCard`, `CreditStatRow`; copies drifted (error size, fold breakpoint) | 10, 11 | 20, 21, 25 | 15 |
| Payment method inset repeats parent `rounded-md` | 9 | 22 | |
| Token savings inset cards one radius tier off | 1 | 8, 11 | |
| `HeroNumeric` forced to `text-xl leading-none` at the call site | 3 | 9 | |
| Models "Show more" label snaps while chevron eases | 7 | 2, 16 | |
| `CopyButton` label mode swaps glyph by mount | 8, 16, 19 | 3 | |

## Section 1: better-ui

### Token savings

- [ ] **1. MEDIUM** `pages/TokenSavings.tsx:298`, `:327`, `:507`, `:552`; `pages/token-savings/SummaryCard.tsx:131`
  - Before: `<Card className="rounded-sm ...">` (6px) inside the page `<Card>` (`rounded-md`, 8px)
  - After: `rounded-xs`
  - Why: Concentric border radius. design.md §6 locks the card-in-card step as `rounded-md` (8px) to `rounded-xs` (4px); 6px is the Button/chrome tier, so every inset panel on this page sits one tier off the ladder.
- [ ] **2. MEDIUM** `pages/TokenSavings.tsx:470`
  - Before: `... cursor-help ... text-muted-foreground hover:text-muted-foreground focus-visible:...`
  - After: `... cursor-help rounded-sm p-1 text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground motion-reduce:transition-none focus-visible:...`
  - Why: Every state change needs a visible cue. The hover target resolves to its own resting color, so the 11 benefit tooltips have a `cursor-help` affordance and no hover feedback.
- [ ] **3. LOW** `pages/TokenSavings.tsx:429` (via `:604`)
  - Before: `<HeroNumeric className={"leading-none text-foreground text-xl"}>`
  - After: drop `text-xl` / `leading-none`, keep `<HeroNumeric>` default
  - Why: `HeroNumeric` is the locked 24px+ display voice (`hero-numeric.tsx:15-20`); the call site pushes it to 20px, where the primitive's own contract says numerics revert to mono. The Overview rail beside it stays 24px, so the two savings figures read as different tiers.
- [ ] **4. LOW** `pages/TokenSavingsDefault.tsx:41`, `:55`, `:69`
  - Before: `min-h-[120px]`
  - After: `min-h-30`
  - Why: Arbitrary value for a tile inside `KpiRail`. 120px is on the grid; the bracket is the only thing off-system.

### Models

- [ ] **5. MEDIUM** `pages/models/ModelShelves.tsx:149`, `:152`
  - Before: `dimmed && "cursor-pointer opacity-75"` + `interactive={!dimmed}`
  - After: `dimmed && "opacity-75"` + `interactive` (unconditional)
  - Why: A dimmed Free-models card keeps `cursor-pointer` and a live drill-in but loses both the hover fill and the 0.98 press, so a pointer user gets no response before the route changes. Dim is the static cue; it does not need the feedback removed.
- [ ] **6. LOW** `pages/Models.tsx:1435-1441` (row also holds `:1423`, `:1427`, `:1431`)
  - Before: `<img ... className="size-4" src="/icons/providers/openclaw.svg" />`
  - After: `className="size-4 opacity-80"`
  - Why: Three of the four PAYG tab glyphs are `currentColor` and fade with the tab's muted to foreground ink; the OpenClaw mark is a fixed `#00e5cc` + gradient asset, so an inactive OpenClaw tab reads louder than the active one. `Bot` is also the one non-brand glyph in the row (no `hermes.svg` in `public/icons/providers/`).
- [ ] **7. LOW** `pages/Models.tsx:908`, `:915`
  - Before: label: no transition; chevron: `transition-transform duration-150 ease-out` + `group-hover:text-foreground`
  - After: label: add `transition-colors duration-150 ease-out motion-reduce:transition-none`; chevron: `transition-[color,rotate] duration-150 ease-out`
  - Why: The Show more/less pair changes color on hover with nothing named to animate it. The back link at `:832` does transition color, so one page carries two link behaviours.
- [ ] **8. LOW** `pages/Models.tsx:1040`, `:1463`
  - Before: `<CopyButton className="shadow-sm" ... mode="label" />`
  - After: see 16 (root cause in `copy-button.tsx`)
  - Why: Both floating Copy buttons swap Copy to CircleCheck by unmount, so the success glyph hard-cuts. Consumer only; fix once in the primitive.

### Billing

- [ ] **9. MEDIUM** `pages/billing/PaymentMethodCard.tsx:41`; `pages/BillingFree.tsx:808`
  - Before: `rounded-md border-border bg-card-muted p-4` inside the `rounded-md` `<Card>`
  - After: `rounded-xs border-border bg-card-muted p-4`
  - Why: Identical radius across a parent/child boundary, which design.md §6 names as the bug outright. Same 8px arc twice with 16px between them is the most visible nesting error on either Billing page.
- [ ] **10. MEDIUM** `pages/BillingFree.tsx:240-303`, `:798-829`, `:765-791` vs `pages/billing/CreditsCard.tsx:85`, `:632`, `pages/billing/PaymentMethodCard.tsx:23`
  - Before: three local re-implementations of `CreditsCard`, `PaymentMethodCard`, `CreditStatRow`
  - After: render the shared modules (`PaymentMethodCard` already takes `empty`; `CreditsCard` takes `balance` / `lastTopUp`)
  - Why: The copies have already drifted: validation errors are `type-copy-14` on Free (`:471`, `:615`, `:656`, `:701`) against `type-copy-12` on Pro/Enterprise (`CreditsCard.tsx:338`, `:482`, `:523`, `:568`), and the Auto-recharge field pair folds at `md:` on Free (`:579`) against `min-[480px]:` shared (`:446`). Same dialog, two type ramps and two fold points.
- [ ] **11. LOW** `pages/BillingEnterprise.tsx:270-295`
  - Before: local `StatRow`
  - After: import `CreditStatRow` from `@/pages/billing/CreditsCard`
  - Why: Same root cause as 10; third copy of a four-line row, and its header comment says so.
- [ ] **12. LOW** `pages/billing/HistorySection.tsx:181-198`
  - Before: expanded child rows mount with no transition
  - After: no change required
  - Why: Verified, not a defect: the skill's "remove immediately when motion adds no information" case; the rotating chevron (`:158-165`, 150ms, `motion-reduce` gated) is the static cue. Recorded so the omission reads as decided.

### Shared primitives

- [x] **13. HIGH** (applied 2026-09-17, `533cdd3`) `components/ui/button.tsx:14`; `switch.tsx:17`; `option-tile.tsx:24`; `select-variants.ts:8`; `toggle-variants.ts:5`; `back-link.tsx:25`
  - Before: `transition-[colors,...]`
  - After: button: `transition-[color,background-color,border-color,opacity,box-shadow,scale]`; switch / option-tile / select / toggle: `transition-[color,background-color,border-color,box-shadow]`; back-link: `transition-[color,background-color,border-color,scale]`
  - Why: Compiled: the class emits `transition-property: colors,opacity,box-shadow,scale`. `colors` is a Tailwind shorthand, not a CSS property, so it parses as an unmatched custom-ident and no color or fill on any Button, Switch, Select trigger, Toggle or OptionTile transitions; every hover fill snaps. Most visible on the Token savings switches: the thumb glides 150ms while the track colour cuts. design.md §Motion states this rule and records the same fix applied to Badge and Card on 2026-09-14; these six were missed. Out-of-scope copies of the same string: `DashboardDefault.tsx:423`, `SetupManual.tsx:391`, `Policies.tsx:587`, `teams/PoliciesPane.tsx:372`.
- [x] **14. HIGH** (applied 2026-09-17, `533cdd3`) `components/ui/icon-action-button.tsx:30`
  - Before: `transition-[color,background-color,transform,box-shadow]` with `active:scale-[0.98]`
  - After: `transition-[color,background-color,scale,box-shadow]`
  - Why: Compiled: `active:scale-[0.98]` emits the standalone `scale: 0.98`, which a list naming `transform` does not cover; the press jumps with no tween, and `motion-reduce:transition-none` on the same element guards nothing. design.md §Motion names this Tailwind v4 trap. Consumer in scope: every History disclosure chevron (`HistorySection.tsx:153`).
- [ ] **15. MEDIUM** `components/ui/option-tile.tsx:29`
  - Before: `md: "h-10 rounded-md font-medium font-sans text-sm"`
  - After: `md: "h-10 rounded-sm font-medium font-sans text-sm"`
  - Why: A 40px control takes the Card/surface tier (8px) while the primitive's own `lg` size takes the chrome tier (6px). Consumers: the Add credits preset grids (`CreditsCard.tsx:269`, `BillingFree.tsx:402`). The tile is also the one hand-rolled pressable with no `active:scale-[0.98] motion-reduce:active:scale-100`.
- [ ] **16. MEDIUM** `components/ui/copy-button.tsx:107`, `:133-141`
  - Before: `const Icon = copied ? CircleCheck : Copy;` then `<Icon className="transition-colors ..." />`
  - After: `<CopyIconSwap className="size-3.5" copied={copied} data-icon="inline-start" strokeWidth={1.75} />`
  - Why: Label mode toggles the glyph by mount/unmount, so the transition on it can never run and the success state hard-cuts. The primitive's own icon mode already does this correctly with `CopyIconSwap` (both glyphs in the DOM, opacity cross-fade).
- [ ] **17. MEDIUM** `components/ui/tabs.tsx:90`
  - Before: no press affordance on `TabsTrigger`
  - After: append `active:scale-[0.98] motion-reduce:active:scale-100` and extend the list to `transition-[color,background-color,border-color,scale]`
  - Why: design.md §Motion states "Same press lives on `IconActionButton` + `TabsTrigger`". It does not. Every tab row on these pages (Models modality tabs, both code-sample rails) presses dead.
- [ ] **18. LOW** `components/ui/icon-action-button.tsx:30`
  - Before: `will-change-transform` (unconditional)
  - After: remove
  - Why: Applied to every icon action button on every row, so a 25-row ledger holds 25 permanent compositing layers for a 150ms press. design.md mandates it on `<Button>` for label re-raster; it does not cover this primitive, and the glyph has no text to re-raster.
- [ ] **19. LOW** `components/ui/copy-button.tsx:140`
  - Before: `strokeWidth={1.8}`
  - After: `strokeWidth={1.75}`
  - Why: Same file uses 1.75 at `:170`; design.md §6 locks 1.75 as a single global value.
- [ ] **20. LOW** `components/ui/feedback-fab.tsx:101`
  - Before: `hover-fine:-translate-y-px motion-reduce:hover:translate-y-0`
  - After: `hover:-translate-y-px motion-reduce:hover:translate-y-0`
  - Why: The `@custom-variant hover-fine` in `index.css:9` compiles to invalid nested CSS, so this is the last inert `hover-fine:` in `src/` and the FAB has no hover lift. No in-scope page file uses the variant.

- [x] **21. MEDIUM** (applied 2026-09-17, `533cdd3`) `components/ui/sidebar.tsx:195, :223, :395, :507`
  - Before: `transition-[color,background-color,transform]` with `active:scale-[0.98]`
  - After: `transition-[color,background-color,scale]`
  - Why: Same defect as 14, found by the sweep while applying it: Tailwind v4 `scale-*` is the standalone `scale` property, so the named `transform` never matches and the press has no tween.
- [x] **22. LOW** (applied 2026-09-17, `533cdd3`) `components/ui/theme-toggle.tsx:32, :42`; `layouts/DashboardChrome.tsx:378, :388`
  - Before: `transition-[opacity,transform,filter]` animating `scale-100` to `scale-[0.25]` plus `blur-*`
  - After: `transition-[opacity,scale,filter]`
  - Why: `transform` is dead here (should be `scale`); opacity still fades so the icons cross-fade but do not scale. `filter` is live because `blur-*` compiles to it; this is an existing exception to the no-`filter` rule, decide whether to keep it.

### Not verified

No browser was used. Not verified: rendered radius arcs at real pixel
sizes; whether the Switch track/thumb desync in 13 is perceptible at 150ms;
the dimmed Featured card's actual pointer behaviour (5); the `motion/react`
icon components (`ReceiptIcon`, `RefreshCWIcon`, `SparklesIcon`,
`CreditCardIcon`, `SquareArrowUpIcon`) on every Billing button run 400 to
2000ms with `bounce: 0.3` on Sparkles, past the skill's 150ms hover
guidance, but they are an established house pattern and were not flagged
pending a call on whether that pattern is settled.

### Conflicts with design.md (design.md wins)

| Skill rule | design.md | Resolution |
| --- | --- | --- |
| Skill default is `scale(0.96)` | Project standard is `active:scale-[0.98]`; 0.96 is too strong (design.md:1131) | Keep 0.98. Every After above uses 0.98; the skill is overridden. |
| Icon stroke keyed to adjacent text weight (1.5 / 2 / 2.5) | lucide stroke 1.75, one global value | design.md. 19 corrects to 1.75. |
| Icon cross-fade = scale 0.25 to 1 + `blur(4px)` to 0 | `filter` excluded from the transition set | design.md. 16 keeps `CopyIconSwap`'s opacity-only cross-fade. |
| Icon-side padding = text-side minus 2px | symmetric `px-2.5` with `data-icon` | design.md. No optical-padding findings raised. |
| `will-change` only after observed stutter | mandated on `<Button>` for label re-raster | design.md for `<Button>`; 18 is scoped to `IconActionButton`, which design.md does not cover. |
| Shadows instead of borders for depth | `border-border` + `shadow-xs` | design.md. No border-to-shadow findings raised. |
| (doc drift) | design.md §Motion forbids `colors` in a property list, then states "The `<Button>` primitive's transition expands to `transition-[colors,opacity,box-shadow,scale]`". The doc prescribes the string its own rule forbids. | Needs a design.md edit alongside 13. |
| (doc drift) | design.md §Motion's stagger row describes an entrance in `ModelShelves.tsx:84-86` removed 2026-09-15. | Stale doc row; code is correct. |

**Verdict: Block.** Findings 13 and 14 are HIGH and both are shared
primitives that reach all three pages.

## Section 2: make-interfaces-feel-better

### Shared primitives

- [x] **1. HIGH** (applied 2026-09-17, `533cdd3`) `components/ui/button.tsx:14`, `option-tile.tsx:24`, `switch.tsx:17`, `select-variants.ts:8`, `back-link.tsx:25`
  - Before: `transition-[colors,opacity,box-shadow,scale]` (and `transition-[colors,box-shadow]`, `transition-[colors,scale]`)
  - After: `transition-[color,background-color,border-color,opacity,box-shadow,scale]`
  - Why: Same root cause as better-ui 13. `colors` is a custom-ident, not a property, so every hover/active fill and ink change on Button, OptionTile, Switch, SelectTrigger and BackLink snaps while `scale` / `opacity` / `box-shadow` still ease. design.md:1214 names this bug; Badge was fixed 2026-09-14.
- [ ] **2. MEDIUM** `components/ui/text-link.tsx:32`
  - Before: base recipe has no `transition-*` at all
  - After: append `transition-[color,text-decoration-color] duration-150 ease-out motion-reduce:transition-none`
  - Why: `hover:decoration-neutral-500` and every call-site `hover:text-foreground` snap. Call sites paper over it individually (`Models.tsx:832` pastes `transition-colors`, `Models.tsx:908` does not), so the same link eases on one line and snaps on the next.
- [ ] **3. MEDIUM** `components/ui/copy-button.tsx:163` (`inline-xs`, used 4x on Models)
  - Before: `size-5` + `before:inset-[-2px]` = 24x24 hit area
  - After: `before:inset-[-10px]` (40x40); at the table-row site cap at `-8px` so it does not collide with the row button 8px left
  - Why: Skill wants 40x40 minimum; 24x24 is exactly the WCAG 2.5.8 AA floor with nothing spare.
- [ ] **4. LOW** `components/ui/card.tsx:85` (`interactive`)
  - Before: `transition-[background-color,scale] ... active:scale-[0.98]`
  - After: add `will-change-transform`
  - Why: Button and IconActionButton both promote a layer for the identical 0.98 press; the Featured/Free cards do not, so the same gesture rasters differently. Note: better-ui 18 argues the opposite for IconActionButton; decide the will-change policy once.

### Token savings

- [ ] **5. MEDIUM** `pages/token-savings/SummaryCard.tsx:217-220`
  - Before: `className={cn("h-full rounded-full", fill)}` with inline `width: ${bar.share}%`
  - After: `cn("h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none", fill)`
  - Why: Toggling Compression or Caching re-derives every share, and a range change does the same. Today all bars jump. 200ms ease-out is the project's indicator rung; `transition-[width]` has four precedents in `components/ui`.
- [ ] **6. MEDIUM** `pages/TokenSavings.tsx:513-514, 560-561`
  - Before: `<SectionHeading as="h4" className="type-heading-16">`
  - After: `<SectionHeading as="h4">`
  - Why: `section-heading.tsx:104` locks its voice (layout-only className). `SummaryCard.tsx:322, 358, 387` renders the same primitive un-overridden at 14px, so the same element is two sizes on one page.
- [ ] **7. MEDIUM** `pages/TokenSavings.tsx:317`, `pages/billing/CreditsCard.tsx:440`, `pages/BillingFree.tsx:573`
  - Before: `className="mt-1 shrink-0"` on `<Switch size="lg">`
  - After: `className="shrink-0"`
  - Why: `size="lg"` is `h-6` (24px); the label above is `type-label-14`, a 20px line box. With `items-start` the switch centre is already 2px below the line's; `mt-1` pushes it to 6px. The two Compression switches (`:526`, `:575`) sit on a 24px `type-heading-16` line and are centred with `items-start` alone, so the same control sits at two heights on one page.
- [ ] **8. MEDIUM** `pages/TokenSavings.tsx:449` (rendered inside the cards at `:508` and `:549`)
  - Before: `rounded-sm border bg-card/40 p-4` inside a `rounded-sm` card
  - After: `rounded-xs border bg-card/40 p-4`
  - Why: Third nesting level repeats its parent's 6px radius. Ladder is `md` 8, `sm` 6, `xs` 4 (`index.css:570-573`); one step per level.
- [ ] **9. MEDIUM** `pages/TokenSavings.tsx:430` + `:604`
  - Before: `<HeroNumeric className={`leading-none ${valueClassName}`}>` with `valueClassName="text-foreground text-xl"`
  - After: `<HeroNumeric>` (drop `leading-none` and `text-xl`)
  - Why: Same as better-ui 3. HeroNumeric defines two rungs, 24px and 32px (`hero-numeric.tsx:27-29`); `text-xl` + `leading-none` is a third, off-ladder display size invented at the call site.
- [ ] **10. LOW** `pages/TokenSavings.tsx:428`
  - Before: `gap-x-2 gap-y-0.5`
  - After: `gap-x-2 gap-y-1`
  - Why: `gap-0.5` (2px) is the half-step that was reverted project-wide; `px-2.5` on Button is the one sanctioned exception. Only occurrence in all 14 files.
- [ ] **11. LOW** `pages/TokenSavings.tsx:299, 328`, `pages/token-savings/SummaryCard.tsx:131`
  - Before: `rounded-sm border-border bg-transparent shadow-none`
  - After: `rounded-sm bg-transparent shadow-none`
  - Why: `Card`'s base already carries `border-border`; re-stating it hides the one utility being changed. (Radius itself: see better-ui 1.)
- [ ] **12. LOW** `TokenSavings.tsx:135`, `TokenSavingsDefault.tsx:33`, `TokenSavingsEnterprise.tsx:58`, `Models.tsx:278`, `Models.tsx:390`, `ModelShelves.tsx:64`, `FreeModels.tsx:45`, `Billing.tsx:111`, `BillingEnterprise.tsx:160`, `BillingFree.tsx:107`
  - Before: `type-copy-18 ... tracking-snug` / `type-copy-16 ... tracking-snug`
  - After: drop `tracking-snug`
  - Why: `index.css:874-880` already bakes `tracking-snug` into both voices. Ten dead utilities that read as a deliberate tracking decision.

### Models

- [ ] **13. MEDIUM** `pages/Models.tsx:830-842`
  - Before: `<TextLink className="type-label-14 inline-flex items-center gap-1 transition-colors ...">` + hand-placed `<ChevronLeft>`
  - After: `<BackLink label="Models" onClick={onBack} data-model-back-link="" />`
  - Why: `components/ui/back-link.tsx` is the primitive for this affordance. The hand-rolled one ships TextLink's underline (wrong for a nav affordance) and loses `active:scale-[0.98]`, the 44px-tall hit area (`after:inset-x-0 after:-inset-y-3`) and the chevron's `group-hover:-translate-x-px` nudge.
- [ ] **14. MEDIUM** `pages/Models.tsx:275`, `pages/models/ModelShelves.tsx:63`, `pages/models/FreeModels.tsx:42`
  - Before: `<h2 className="type-heading-24 m-0 text-foreground">`
  - After: `<PageTitle as="h2">`
  - Why: `page-title.tsx:37-43` maps `as="h2"` to the identical `type-heading-24` plus `text-balance`. Three of the page's four widest headings wrap unbalanced.
- [ ] **15. MEDIUM** `pages/models/ModelShelves.tsx:306`
  - Before: `<span className="type-copy-12 text-muted-foreground">{label}</span>`
  - After: `<span className="type-label-12 text-muted-foreground">{label}</span>`
  - Why: It names a value inside a `RowActionButton`, so design.md §3's test lands on Label (500), not Copy (400). `lint:design` cannot catch it. Every sibling KPI label (`kpi-tile.tsx:72`, `SummaryCard.tsx:135`, `Models.tsx:1085`) is an `Eyebrow`; this is the one 400-weight stat label in the family.
- [ ] **16. MEDIUM** `pages/Models.tsx:905-920`
  - Before: TextLink with `hover:text-foreground focus-visible:text-foreground`, no transition; its `<ChevronDown>` has `transition-transform duration-150 ease-out`
  - After: fixed by 2 (primitive), no call-site change
  - Why: "Show more": the label's ink snaps while the caret glides for 150ms. Same as better-ui 7.
- [ ] **17. LOW** `pages/Models.tsx:1291`
  - Before: `<Badge title="Gateway markup over this provider's list price">`
  - After: `<Tooltip><TooltipTrigger render={<Badge .../>}>...` (recipe at `Models.tsx:737-757`)
  - Why: Native `title` is the only hover explanation on a page that otherwise speaks through the Tooltip primitive: two hover voices, OS delay, no keyboard path.
- [ ] **18. LOW** `pages/Models.tsx:368`
  - Before: `type-copy-12 m-0 text-muted-foreground tracking-snug`
  - After: `type-copy-12 m-0 text-muted-foreground`
  - Why: Unlike `type-copy-16/18`, `type-copy-12` (`index.css:886-888`) sets no tracking, so this is a live deviation: a 12px body voice tightened while every other 12px body sits at normal.
- [ ] **19. LOW** `pages/SetupModels.tsx:82`
  - Before: `<TableCell className="font-medium text-foreground">`
  - After: `<TableCell className="type-label-14 text-foreground">`
  - Why: Raw weight instead of the named voice; the identical cell on the catalog table (`Models.tsx:605`) and the shelf table (`ModelShelves.tsx:433`) use `type-label-14`.

### Billing

- [ ] **20. MEDIUM** `pages/billing/CreditsCard.tsx:338, 482, 568` vs `pages/BillingFree.tsx:471, 615, 657`
  - Before: `type-copy-12 m-0 text-destructive` (Pro/Enterprise) vs `type-copy-14 m-0 text-destructive` (Free)
  - After: pick one for all six; `type-copy-12` matches `type-input-helper`'s 12px tier (`index.css:917`)
  - Why: Same two dialogs, duplicated; all six field errors are the same string in the same place, rendered at two sizes depending on which tier opened them.
- [ ] **21. MEDIUM** `pages/billing/CreditsCard.tsx:446` vs `pages/BillingFree.tsx:579`
  - Before: `grid-cols-1 gap-4 min-[480px]:grid-cols-2` vs `grid-cols-1 gap-4 md:grid-cols-2`
  - After: `grid-cols-1 gap-4 min-[480px]:grid-cols-2` on both
  - Why: The dialog is a fixed 500px box, so the rung is read off the viewport either way. Between 480px and 768px the Pro auto-recharge dialog is two columns and the Free one is stacked.
- [ ] **22. MEDIUM** `pages/billing/PaymentMethodCard.tsx:41`, `pages/BillingFree.tsx:808`
  - Before: `rounded-md border-border bg-card-muted p-4` inside `<Card>` (`rounded-md`)
  - After: `rounded-sm border-border bg-card-muted p-4`
  - Why: Inset repeats its parent's 8px radius. Note: better-ui 9 proposes `rounded-xs` for the same lines per design.md §6's 8 to 4 step; pick one.
- [ ] **23. MEDIUM** `pages/billing/CreditsCard.tsx:119-124`, `pages/BillingFree.tsx:259-264`
  - Before: `<CreditStatRow label="Auto-recharge" value={`+$${auto.topUp} below $${auto.threshold}`} />`, `mono` omitted
  - After: add `mono`
  - Why: The `dd` column is a stack of right-aligned currency values; "Used this month" and "Last top-up" are `font-mono tabular-nums`, this one is proportional sans, so its digits sit off the column.
- [ ] **24. LOW** `pages/billing/CreditsCard.tsx:647`, `pages/BillingFree.tsx:780`, `pages/BillingEnterprise.tsx:284`
  - Before: `<dd className={cn("m-0", mono && ...)}>`, no voice; inherits `type-copy-14` from the `<dl>`
  - After: put `type-copy-14` on the `<dd>` itself
  - Why: The inherited-voice case `design-tokens.md` calls out as invisible to `lint:design`.
- [ ] **25. LOW** `pages/billing/CreditsCard.tsx:632`, `pages/BillingFree.tsx:765`, `pages/BillingEnterprise.tsx:270`
  - Before: three byte-identical `CreditStatRow` / `StatRow` definitions
  - After: one export from `CreditsCard.tsx`, imported by the other two
  - Why: `Billing.tsx:21` already imports the shared one. Rows 23 and 24 each had to be filed against three files for one defect. Flagged only; the code comments say the copies are deliberate and Enterprise billing is closed.
- [ ] **26. LOW** `pages/models/ModelShelves.tsx:358`
  - Before: `<Card className="overflow-x-auto" density="flush">`
  - After: `<div className="overflow-x-auto">` inside the Card, or drop the class
  - Why: `Card`'s base sets `overflow-hidden` on the same element; equal specificity, so the winner is stylesheet order. Block is currently unmounted (shelves hidden 2026-09-14); resurfaces if the shelves return.

### Not verified (no browser)

- Rows 1 and 2 are proved by compiling and reading the emitted CSS; the
  visual snap was not observed live.
- Row 7's 6px offset is computed from `h-6` against a 20px line box, not
  measured on screen.
- Row 26's cascade winner depends on the built sheet's rule order.
- Focus-ring clipping on `density="flush"` cards, tooltip placement and
  scroll-shadow behaviour were read in source only.
- No remaining `hover-fine:` uses in any of the 14 files. Site-wide
  survivors: `card.tsx:78-83` (a comment) and `feedback-fab.tsx:101`
  (better-ui 20).

### Conflicts with design.md (design.md wins)

| Skill says | design.md / project says | Resolution |
| --- | --- | --- |
| Skill §12 wants `scale(0.96)` | Project standard is `active:scale-[0.98]`; 0.96 is too strong (design.md:1131) | Keep 0.98. The skill is overridden. |
| §7 contextual icon animation must use `filter: blur(4px)` to 0 | transition list excludes `filter` | No blur proposed in any row. |
| §3 shadows instead of borders for cards | Card tier is `border-border` + `shadow-xs` (design.md:1223) | Rows 8 and 22 keep borders and change only radius. |
| §11 image outlines as literal `rgba(0,0,0,0.1)` | `no-hardcoding.md`: literals live only in `index.css` | Not raised; no photographic image in scope. |
| §16 minimum 40x40 hit area | `IconActionButton` gets there via `after:-inset-3`; `CopyButton inline-xs` stops at 24x24 | Row 3 proposes the pseudo-element route the project already uses. |

**Verdict:** the system underneath these pages is sound. One broken
`transition-property` keyword (row 1) accounts for most of the flatness, and
two missing primitives (`BackLink`, a transition on `TextLink`) account for
most of the inconsistency. The remaining rows are duplication artifacts:
every Billing finding exists two or three times because the same dialog,
stat row and card were copied instead of shared. Fix rows 1, 2, 13 and 25
and the rest shrink to a short cleanup pass.

## Section 3: react-best-practices

The skill defines no report format (SKILL.md is a rule index). Rules cited
by their skill filename. Next.js-only rules skipped: all `server-*`,
`async-*`, `bundle-dynamic-imports`, `bundle-defer-third-party`,
`rendering-hydration-*`, `client-swr-dedup`. Route-level code splitting
already exists (`App.tsx` uses `lazy`).

### JavaScript performance

- [x] **1. HIGH** (applied 2026-09-17, `533cdd3`) `js-cache-function-results` Shared: `lib/formatters.ts:17,30,54,68,79,89,97,112,125,138`
  - Before: `return new Intl.NumberFormat(LOCALE, options).format(n)` (every call constructs)
  - After: Module-level `Map` keyed on `JSON.stringify(options)`: `const nf = new Map(); function numberFormat(o) { const k = JSON.stringify(o); let f = nf.get(k); if (!f) { f = new Intl.NumberFormat(LOCALE, o); nf.set(k, f); } return f; }` and the same for `DateTimeFormat`
  - Why: Measured in this repo's Node: construct+format 20k times = 402ms, cached format = 7ms, 57x. `DateTimeFormat` is worse (606ms/20k). One `HistoryLedger` page at 25 rows builds about 50 `NumberFormat` objects per render; one keystroke in Add credits rebuilds 8. Every row here routes through this file.
- [ ] **2. MEDIUM** `js-index-maps` Models: `data/free-models.ts:79`, `pages/models/curation.ts:66`
  - Before: `models.find((m) => m.id === free.id)` / `ids.map((id) => models.find((m) => m.id === id))` over about 390 `MODELS` rows
  - After: Use the Map that already exists: `import { modelById } from "@/data/models"` then `modelById(free.id)` / `ids.map(modelById)`; keep the `models` param as an opt-in override that falls back to `find`
  - Why: `MODEL_BY_ID` is already built (`data/models.ts:1625`). `featuredModels()` does 4 scans, `freeModelRows()` 2, each shelf 4, all on every render of the Models list.
- [ ] **3. LOW** `js-set-map-lookups` Models: `pages/Models.tsx:875`
  - Before: `CAPABILITY_ORDER.filter((c) => model.capabilities.includes(c))`
  - After: `const have = new Set(model.capabilities); CAPABILITY_ORDER.filter((c) => have.has(c))`
  - Why: The same file already does exactly this at `:698`; the detail page is the inconsistent copy. Tiny N, consistency more than speed.
- [ ] **4. LOW** `js-min-max-loop` Models: `pages/models/curation.ts:120,131`
  - Before: `sortModels(models, "popular").slice(0, SHELF_ROW_COUNT)` copies and sorts all rows to take 4
  - After: For `popular` (identity order) use `models.slice(0, SHELF_ROW_COUNT)`; for `newest` keep the sort, it runs over the 4 allowlisted rows only
  - Why: `sortModels` does `rows.slice()` unconditionally (`data/models.ts:252`). `ModelShelves` is currently not mounted, so cost is latent.

### Re-render optimization

- [ ] **5. MEDIUM** `rerender-derived-state-no-effect` Token savings: `pages/TokenSavings.tsx:218-227`
  - Before: `const [local, setLocal] = useState(...); const value = savings ?? local; const update = (patch) => { const next = {...value, ...patch}; setLocal(next); onSavingsChange?.(next); }`
  - After: Only write local state when uncontrolled: `const controlled = savings !== undefined; const update = (patch) => { const next = {...value, ...patch}; if (!controlled) setLocal(next); onSavingsChange?.(next); }`
  - Why: When `TokenSavings` controls the switches (`:119-122`), every toggle writes a `local` value nothing reads, forcing a second render of the section and both cards. Two sources of truth for one value.
- [ ] **6. MEDIUM** `rerender-memo` Token savings: `pages/TokenSavings.tsx:82-86`
  - Before: `const summary = summaryFor(range, customRange, {...})` at render top
  - After: `useMemo(() => summaryFor(range, customRange, { compressionOn: savings.compression, cachingOn: savings.caching, plan }), [range, customRange, savings.compression, savings.caching, plan])`
  - Why: `summaryFor` runs `resolveWindow` (4 `Date` allocations), `periodCopy` (2 to 3 `Intl.DateTimeFormat` constructions), `allocateTenths` twice with a sort each, `bucketBreakdown`, and a final sort, on every render of the page.
- [ ] **7. MEDIUM** `rerender-memo` Token savings: `pages/TokenSavings.tsx:155-158,186-193`
  - Before: `const sparkLabels = sparkDates(effectiveRange, sparkStops)` and `data={resampleSpark(k.spark, sparkStops)}` inside the `.map`
  - After: `useMemo(() => sparkDates(effectiveRange, sparkStops), [effectiveRange, sparkStops])` and hoist the resampled series into one `useMemo` keyed on `[effectiveRange, sparkStops]`
  - Why: `sparkDates` constructs 1 to 2 `Intl.DateTimeFormat` per label: 24h = 12 stops = 24 constructions per render. Caveat: `CompactSpark` is not wrapped in `memo` (`components/ui/compact-kpi.tsx:180`) and rebuilds `points` at `:200`, so the three Recharts `AreaChart`s still reconcile on every parent render. Stopping that needs `export const CompactSpark = memo(...)`, a shared primitive.
- [ ] **8. MEDIUM** `rerender-memo-with-default-value` Models: `pages/Models.tsx:469-472`
  - Before: `options={CAPABILITY_ORDER.map((c) => ({ value: c, label: CAPABILITY_META[c].label }))}`
  - After: Hoist to module scope: `const CAPABILITY_OPTIONS = CAPABILITY_ORDER.map(...)`; then `options={CAPABILITY_OPTIONS}`
  - Why: `components/ui/multi-select.tsx:161` lists `options` in a `useMemo` dep array. A new array identity every render defeats that memo on every keystroke in the model search box.
- [ ] **9. MEDIUM** `rerender-split-combined-hooks` Models: `pages/Models.tsx:208-229`
  - Before: One `useMemo` does filter then `sortModels(rows, sort)` with deps `[modality, search, provider, features, sort]`
  - After: Split: `const filtered = useMemo(() => MODELS.filter(...), [modality, search, provider, features])` then `const rows = useMemo(() => sortModels(filtered, sort), [filtered, sort])`
  - Why: Changing only the sort Select re-runs the full 390-row filter (three `toLowerCase().includes` per row) for a result that cannot change.
- [ ] **10. MEDIUM** `rerender-use-deferred-value` Models: `pages/Models.tsx:199,208,236,353`
  - Before: `const [search, setSearch] = useState("")`, filter runs synchronously against `search` on every keystroke, then 25 `TableRow`s each with `CapabilityStrip` (up to 5 `Tooltip`s) and `ProviderStack` re-render
  - After: `const deferredSearch = useDeferredValue(search);` use it inside the filter memo (paired with 9), keep `search` on the `SearchInput`, dim the table with `search !== deferredSearch`
  - Why: Keeps the input responsive while 390 rows filter and up to 25 tooltip-bearing rows reconcile. Depends on 9 landing first.
- [ ] **11. MEDIUM** `rerender-memo-with-default-value` Billing: `pages/billing/CreditsCard.tsx:92`
  - Before: `lastTopUp = lastTopUpLabel()` as a default parameter value
  - After: Hoist: `const DEFAULT_LAST_TOP_UP = lastTopUpLabel();` then `lastTopUp = DEFAULT_LAST_TOP_UP`
  - Why: A default param is evaluated on every render. `lastTopUpLabel` (`data/billing-history.ts:71`) does a `.find` plus `formatDateNumeric`, one `Intl.DateTimeFormat` construction per render of the Pro and Enterprise Credits cards.
- [ ] **12. LOW** `rerender-memo` Models: `pages/models/ModelShelves.tsx:59,345`, `pages/models/FreeModels.tsx:29`
  - Before: `const models = featuredModels()` / `const rows = shelfRows(shelf)` / `const rows = freeModelRows()` at render top
  - After: Wrap each in `useMemo(..., [])` (inputs are module constants), or fix 2 and 4 so the calls are O(1)
  - Why: Each re-derives from `MODELS` on every render of the Models list, which happens on every search keystroke.
- [ ] **13. LOW** `rerender-memo` Billing: `pages/BillingEnterprise.tsx:64,299,300,367`
  - Before: `const view = enterpriseBillingView(state)`, `enterpriseSeatCount()`, `enterprisePlanSeats()`, `nextInvoiceUsd()` at render top
  - After: `useMemo(() => enterpriseBillingView(state), [state])`; hoist the three seat helpers to module constants, they read only `MEMBER_ROWS`
  - Why: Cheap per call, but `view` is a fresh object each render so `StateBanner` and `PlanCard` can never be memoized later. Safe: `view.ledgerRows` is the `HISTORY_ROWS` reference itself (`data/billing-enterprise.ts:166`).

### Rendering performance

- [ ] **14. LOW** `rendering-hoist-jsx` Token savings: `pages/TokenSavingsDefault.tsx:41-82`
  - Before: Three fully static empty-state tiles written inline in the `KpiRail`
  - After: `const EMPTY_TILES = [{ icon: BarChart2, label: "No savings yet" }, { icon: Layers, label: "No caching yet" }, { icon: Zap, label: "No compression yet" }] as const;` then map, or hoist the three elements to a module-level const
  - Why: 42 lines of identical markup with one icon and one string different; nothing depends on props or state.

### Bundle size

- [ ] **15. MEDIUM** (`bundle-` category intent) Billing: `pages/BillingFree.tsx:194-238,240-303,309-499,503-763,765-791,798-829` vs `pages/billing/CreditsCard.tsx:39-83,85-170,176-366,370-630,632-658` and `pages/billing/PaymentMethodCard.tsx:23-85`
  - Before: About 600 lines of `AutoRechargeConfig`, `readAutoRecharge`, `CreditsCard`, `AddCreditsDialog`, `AutoRechargeDialog`, `CreditStatRow`, `PaymentMethodCard` duplicated verbatim, sharing the same `"billing.autoRecharge.v2"` storage key
  - After: 1:1 swap available today: `BillingFree.tsx:798-829` is byte-equivalent to `<PaymentMethodCard empty />`; delete it and import (that file's header at `:20` cites `BillingFree.tsx:798` as its source). For Credits, import `CreditsCard` and pass `balance={0}`; three copy deltas must be preserved or decided first: Free prints "Never" for Last top-up where shared prints "None yet" (`CreditsCard.tsx:130`); Free error copy is `type-copy-14` vs shared `type-copy-12` (`BillingFree.tsx:471` vs `CreditsCard.tsx:338`); Free dialog grid is `md:grid-cols-2` vs shared `min-[480px]:grid-cols-2` (`BillingFree.tsx:579` vs `CreditsCard.tsx:446`)
  - Why: Two copies already drifted in three places. Both chunks ship both copies. The `PaymentMethodCard` half is risk-free; the Credits half needs a `lastTopUp="Never"` prop or a copy decision first. Same root cause as better-ui 10 and make-interfaces 20, 21, 25.
- [ ] **16. MEDIUM** `bundle-barrel-imports` (import from source, not through a re-exporting module) Models: `pages/Models.tsx:78-79` imports from `models/FreeModels` and `models/ModelShelves`, which import back at `pages/models/ModelShelves.tsx:28` (`CapabilityStrip, NumericCell, ProviderStack`) and `pages/models/FreeModels.tsx:8` (`CapabilityStrip`)
  - Before: Two import cycles through a 1528-line page module
  - After: Move `NumericCell`, `CapabilityStrip` and `ProviderStack` out of `Models.tsx` into `pages/models/cells.tsx`; all three files import from there
  - Why: Works today only because all three are hoisted `function` declarations, so no TDZ read happens at module-eval time. Adding one module-level `const` derived from an imported binding in `Models.tsx` breaks it at runtime, not at build.
- [ ] **17. LOW** `bundle-barrel-imports` Shared: `pages/Models.tsx:1`, `TokenSavings.tsx:1`, `BillingEnterprise.tsx:1`, `billing/CreditsCard.tsx:1`, `billing/HistorySection.tsx:1`, `billing/PaymentMethodCard.tsx:1`, `BillingFree.tsx:1`
  - Before: `import { Bot, ChevronDown, ChevronLeft } from "lucide-react"`
  - After: Leave as is unless dev-server boot becomes a complaint; if it does, add `optimizeDeps.include: ["lucide-react"]` to `vite.config.ts` rather than rewriting call sites to deep paths
  - Why: Downgraded from the rule's CRITICAL on purpose. The rule's figures and fix are Next.js specific. Vite + Rollup tree-shakes `lucide-react` per-icon ESM correctly, so there is no shipped-bytes cost. Residual cost is dev cold start and HMR only.

### Outside the named file list, reached from a named file

- [ ] **18. MEDIUM** `advanced-event-handler-refs` (stable subscriptions) Shared, reached from `pages/TokenSavingsEnterprise.tsx:43-45`: `pages/teams/teams-store.ts:136,144,207,224`
  - Before: `useSyncExternalStore((cb) => teamsStore.subscribe(cb), ...)` creates a new `subscribe` function on every call
  - After: Hoist once at module scope: `const subscribe = (cb: () => void) => teamsStore.subscribe(cb);` and pass that reference in all four hooks
  - Why: React re-subscribes whenever the `subscribe` identity changes, so every render of `TokenSavingsEnterprise` tears down and re-adds 3 listeners (`useUserSettings`, `useCurrentUserTeam` via `useTeams` + `useViewRole`, `useOrgSettings`). Affects every Enterprise page.

### Compliant, checked and clean (no action)

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

### Not verified

- Wall-clock impact of 6, 7, 9 and 10 in a browser. The Intl ratio in 1 is
  measured (Node, this machine); everything else needs React DevTools
  Profiler to size.
- Whether Recharts 3 internally memoizes on `data` identity (7).
- Production bundle deltas for 15, 16 and 17. No `vite build --report` run.
- 16's TDZ hazard is a static reading of the cycle, not an observed failure.

**Verdict:** these surfaces are in better shape than the file sizes
suggest: expensive list work is memoized in the right places, sorting is
immutable, lazy initializers and keyed resets are used correctly, no
component is declared inside another. The cost is concentrated in one
shared utility and a handful of unmemoized derivations. Row 1 pays for
itself across every table in the app. Rows 5 to 11 are one-to-three line
edits. Row 16 is the only structural item that can fail at runtime. The
five to take first: 1, 5, 8, 11, 16.
