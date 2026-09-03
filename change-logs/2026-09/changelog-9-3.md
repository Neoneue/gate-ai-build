# UI Changelog: 2026-09-03

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-2.md`](./changelog-9-2.md)

---

## Conventions

### Sentence case everywhere: nav labels and page titles first `1cb0150`

Before: the sidebar was Title Case (`Security Events`, `Audit Trail`,
`Token Savings`, `API Keys`) while tabs and buttons were sentence case, and
`design.md` carried both a Title Case rule for card titles and a sentence
case rule for titles. After: one rule, sentence case site-wide, proper nouns
and acronyms keep their casing, eyebrows and KPI labels stay mono uppercase.
Applied to every nav label (`src/layouts/nav-sections.ts`) and to the page
titles `API keys`, `Token savings` (Pro + Default), `My notifications`.
Card titles still in Title Case are legacy, fix on touch. `design.md`
"Capitalization (site-wide, 2026-09-03)" replaces the old block.

### Callout is the blue info banner `1cb0150`

Before: `Callout` was card-colored (`bg-card border-border`, muted ink),
so a "Locked by your organization" note read as one more card. After: blue
info tint in the same family as the danger banner. Light `bg-blue-50
border-blue-300 text-blue-900`; dark `bg-blue-500/10 border-blue-500/30
text-blue-300` (the danger banner's 10% wash / 30% border ladder). Icon
takes the same ink. `src/components/ui/callout.tsx`; `design.md` §Callout
rewritten. Also tints the Default team's Settings note and the cancel-plan
dialog note.

### `type-heading-28` step `1cb0150`

Before: the heading ladder jumped 24 to 32. After: `.type-heading-28`
(28px/36px, medium, tracking-tight) in `src/index.css`, registered in
`src/lib/utils.ts` and the design lint scale
(`scripts/check-design-tokens.mjs`). One consumer: the Teams Overview tab
header, one step under the page title and above the 24px block titles.

### Text inputs default `autoComplete="off"` `1cb0150`

Before: dialogs autofocus their first field and the browser's saved-entry
dropdown popped over the form (Create limit's Name). After: the `Input`
primitive sets `autoComplete="off"`; call sites that want autofill
(Settings name / email) pass their own. `src/components/ui/input.tsx`.

## Components

### Segmented gains `disabled` `1cb0150`

Both variants of `Segmented` accept `disabled` and pass it to every option
button, so a locked policy's Scan direction control reads disabled with the
rest of the card. `src/components/ui/segmented.tsx`.

### Nav icons: Limits is Gauge, Policies is ShieldCheck `1cb0150`

Before: Policies `Shield` next to Limits `ShieldCheck` were near-identical
glyphs. After: Limits takes `Gauge` (caps and thresholds), Policies takes
`ShieldCheck`. `src/layouts/nav-sections.ts`, every tier.

## Sections

### Team page: Overview tab `1cb0150`

Before: Usage, Security, Policies and Token savings were separate tabs and
Members was the landing tab. After: an Overview tab lands first, stacking
the Usage body, the Security body and the Token savings KPI rail under one
header ("Team overview", `type-heading-28`, copy "Monitor request volume,
token usage, spend, and security signals across your team."). ONE range
picker in the header drives all three blocks (their own pickers hide via
`controlledRange`); block titles are `type-heading-24`, inner table titles
step down to 18px, 1px `border-border` rules split the blocks at 32px.
The Usage, Security, Policies and Token savings triggers are removed; their
panels and code stay. Tab row: Overview, Members, Keys, Budget, Settings.
`src/pages/TeamDetailEnterprise.tsx`; `TeamTokenSavingsRail` extracted
from `teams/TokenSavingsPane.tsx`.

### Team page: member scope dropdown `1cb0150`

After the Custom date button, a Select reads "All members" and lists every
current member plus a "Past members" group. One member selected: the panes
receive a virtual team row holding only that member's keys (live + history),
so Usage KPIs, sparks and tables, and the Token savings rail derive per
member; Security scales the team read by the member's share of member events
(`scopeSecurityToMember`, `teams/security-data.ts`) and the attack-type
card uses their own row. Member-table search inputs hide, and only the
current or past table that holds them renders.

### Team page: search inputs on the breakdown tables `1cb0150`

Usage by current / past members, Usage by model, Events by current / past
members each carry a full-width `SearchInput` between title and card.
Member tables match on name; the model table matches on model name or
provider display name (`VENDOR_META`). Empty result shows the "No matches"
table empty state.

### Team page: Settings tab = General / Policies / Token savings `1cb0150`

Before: Settings held the rename and delete cards; Policies and Token
savings were tabs. After: three titled blocks with 1px dividers
(`teams/SettingsStack.tsx`). General leads with a "Lock settings for this
team" card (same Card / CardAction pattern as Team name, `Switch size="lg"`
centered), then rename and delete. Policies is the former tab body; Token
savings is the Compression + Caching cards without the KPI rail.
`TeamPoliciesPane` now takes `policies`, `TeamSavingsOptionCards` takes
`savings`, both with `locked`. Team budget title on the Budget tab is
`type-heading-24`.

### Team page: Add key and remove-key dropped `1cb0150`

The Keys tab's Add key button (toolbar and empty state), the remove X
column and the Add keys / Remove key dialogs are removed; keys are read-only
on a team. `onMoveKeys` / `onRemoveKey` and the page handlers are gone.

### Teams list: Current teams / Archived teams / Settings tabs `1cb0150`

Before: "Your teams" table with an "Archived teams" section below. After: a
line-variant tab row (API Keys' Active / Revoked pattern). Current teams and
Archived teams carry counts; with nothing archived the Archived tab shows
the `EmptyState` card ("No archived teams" / "Teams you archive will appear
here with their spend history, so org records can be tracked after a team
is removed."). Archived rows are `NavTableRow`s that open the team page.

### Archived teams drill in read-only `1cb0150`

`DeletedTeamSnapshot` now carries the frozen `TeamRow`. The detail page
resolves an archived id from it, renders every tab from the frozen data,
hides the Settings tab, and its mutation handlers no-op. Add members / Set
budget controls still render (inert) on an archived team.

### Org-level Settings tab and the lock cascade `1cb0150`

The Teams list's third tab renders `teams/OrgSettingsPane.tsx`: the same
General / Policies / Token savings stack with "Lock settings for this
organization". Org policies, savings and lock live in `teams-store.ts`
(`orgSettings`). Org lock on: every team's Policies and Token savings show
the ORG values disabled, a blue Callout "Locked by your organization. These
settings are set by an org admin and can't be changed here." above each
block, and the team lock card disables with "Locked by your organization"
copy. Team lock is a row field (`TeamRow.locked`).

### Enterprise "My policies" and "My token savings" pages `1cb0150`

`/policies-enterprise` and `/token-savings-enterprise` now render
`PoliciesEnterprise.tsx` / `TokenSavingsEnterprise.tsx`: user-level
settings (call 2026-09-03). Values and lock come from
`resolveEffectiveSettings` (`teams/effective-settings.ts`): org lock ->
org values + org banner; team lock -> team values + "Locked by your team's
admin" banner; neither -> the user's own (`userSettings`). Signed-in user is
`CURRENT_USER_ID = "usr_chad"`, team resolved from the live store. Token
savings keeps the org KPI rail. Enterprise sidebar labels "My policies" /
"My token savings"; Manage order Limits, My policies, My token savings.
Free / Pro / Default twins untouched. Tests in
`teams/effective-settings.test.ts`.
