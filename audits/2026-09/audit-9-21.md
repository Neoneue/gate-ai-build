# Audit - 2026-09-21

Read-only reviews by the `front-end-developer` agent. Checklist: tick an
item when it is applied and verified, then append the commit hash to the
item's first line. Pick items by ID ("rams-3, wdg-7"). Paths are relative
to `src/`. Already decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`.

## Summary

- Why: end-to-end pipeline test (audit skill, day file, test tiers, lint) with rams over the whole site, plus the morning rbp close-out.
- Tested: test-smoke after the rbp apply pass; rams on the whole site (shared primitives, page set A, page set B re-run as two full-read agents after a Disclaimer); test-smoke after each of the two rams apply passes.
- Found: 14 items, 4 HIGH / 5 MEDIUM / 5 LOW; 14 applied (`ac3758d`), 0 skipped, 0 open. rams-1 was a reviewer false positive against the wash ladder and was removed at the user's direction; the ID is retired, not reused.
- Opinion: Clean. Every rams item is applied and both suites are green; one residue (rams-2 on PoliciesEnterprise) awaits a decision.
- Next: user decides the rams-2 PoliciesEnterprise heading residue by 2026-09-22; lint-hook plan off audit-9-20 Patterns plus today's `missing-handler` and `heading-order` candidates.

## Runs

| # | Time (CT) | Skill | Scope | Items | Applied |
| --- | --- | --- | --- | --- | --- |
| 1 | 12:33 | test-smoke (after rbp-3, 4, 6, 8, 9, 10, 13) | whole site | none | 0/0 |
| 2 | 15:46 | rams | whole site (components/ui, layouts, icons, every page twin; set B re-run 16:01 after a Disclaimer) | rams-2 to rams-15 (rams-1 retired) | 14/14 |
| 3 | 16:40 | test-smoke (after rams-5, 6, 8, 11) | whole site | none | 0/0 |
| 4 | 17:05 | test-smoke (after rams-2, 3, 4, 7, 9, 10, 12, 13, 14, 15) | whole site | none | 0/0 |

## test-smoke

### Compliant, checked and clean

- vitest 40/548 green; Playwright 8/8 green; tsc, lint and lint:design clean after the seven-item apply pass; the pre-commit React Compiler lint caught the rbp-12 hoist, which was reverted. Zero `matchMedia("(prefers-reduced-motion")` reads left in `components/ui/`; all twelve animated icons read `REDUCE_MOTION`.
- Run 3, after rams-5, 6, 8, 11: vitest 40 files / 548 cases green; Playwright 8/8 green against the live :3000 server; tsc, biome and lint:design clean.
- Run 4, after rams-2, 3, 4, 7, 9, 10, 12, 13, 14, 15: vitest 40 / 548 green; Playwright 8/8 green; tsc, ultracite (335 files) and lint:design clean.

Verdict (run 1): Clean. The apply pass introduced no regression.

Verdict (run 3): Clean. The rams HIGH apply pass introduced no regression.

Verdict (run 4): Clean. The rams MEDIUM / LOW apply pass introduced no regression.

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

## Patterns

- `no-handrolling`: rams-3, rams-5, rams-9. Review-time; a grep for `from "@base-ui/react/` outside `components/ui/` would catch rams-5's class.
- `missing-handler`: rams-6, rams-7, rams-8. Lint candidate: `Button` / `MenuItem` without `onClick` / `onSelect` / `render` / `type="submit"`, needs a no-op waiver comment.
- `twin-drift`: rams-10, rams-11. Review-time; the Free / Pro twin rule in `no-thrash.md`.
- `heading-order`: rams-2, rams-15. Lint candidate: `SectionTitle` without `as` directly under `PageTitle`.
