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

### Sentence case: card, KPI, field and button titles `ae85022`

Second pass of the site-wide rule. Before → after: `Activity This Week` →
`Activity this week` (Overview); `Avg Turns` / `Avg Cost / Conv` → `Avg
turns` / `Avg cost / conv` (Conversations KPI tiles); `Total Spend` / `Total
Messages` / `Tokens Used` → sentence case (Activity and team Usage KPI
tiles); `Tokens In` / `Tokens Out` → `Tokens in` / `Tokens out` (message and
conversation detail fields); `Request Trace` → `Request trace` (trace tab);
`View Conversation` / `View Request` → sentence case (buttons). Proper nouns
and product names (Gate Connect, Claude Code, Google Vertex, Ask Gatekeeper,
Open Explorer, people) unchanged. A regex sweep over JSX text and title /
label / heading props found no other Title Case UI strings.

### "Viewing as" role switch (Admin / Manager), Enterprise only `d0cb23d`

New `ViewRoleSwitch` (`src/components/ui/view-role-switch.tsx`), a `sm`
Select right of the workspace switcher in the top bar on `-enterprise`
routes only. Defaults to Admin view, so nothing on the site changes until
it is flipped. Backed by `viewRole` in `teams-store.ts`; Admin is the seeded
owner (Chad Ponticas), Manager is Kira Tan (Platform). No Member option:
the PRD gives members no Teams surface. AG-695 item 8, IN PROGRESS.

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

### Audit trail records settings changes `d0cb23d`

AG-624 AC "Setting changes are recorded in the audit log." New
`src/data/audit-trail-store.ts` holds the seeded rows plus every entry
written this session; the Audit trail page reads the union. Org lock /
unlock, org policy and token savings edits, team lock / policy / savings
edits each append an AUDIT row ("Org settings locked", 'Team "Platform"
policy "Prompt injection detection" updated', "Org token savings: Caching
disabled"), actor = the signed-in user, real timestamp, 64-hex fingerprint.
My settings writes are not logged (they force nothing).

### Archived team: controls hidden `d0cb23d`

Before: Add member, the role select, the remove X and Set / Edit budget
rendered on an archived team with no-op handlers. After: hidden via an
`archived` prop on MembersPane and BudgetPane; the role column reads
"Manager" / "Member" as text. The frozen snapshot is a record, not a roster.

### Messages: budget-blocked 429 row `d0cb23d`

PRD §3 Hard-budget block: "a distinct budget error identifying it as a team
or org budget block." When a team's HARD budget is over its cap, the Messages
list leads with one live row per blocking team
(`src/pages/requests/budget-block-rows.ts`): status error + guardrail block
(existing badges), code 429, key = the team's first key, model = that key's
last model, user message "Update our data-model.md with our changes". The
detail page shows the message plus an Error detail card: 'Team budget block.
"Platform" has used $x of its $y monthly cap, so the gateway refused this
message before it reached the provider. Resets on the 1st of each month.'
Derived from the teams store, so lowering a hard cap on the Teams page makes
it appear; the seed shows none. Day / time take the newest seeded row's
authored shape (a pre-shifted date crashed the table: fixed same day). Hero
KPIs do not count it. Tests in `budget-block-rows.test.ts`.

### Default workspace: no forced settings `d0cb23d`

Default is the Free plan. `/teams-default` has no org Settings tab;
`/teams-default/:teamId` Settings shows General only (rename / delete), no
lock card, no Policies, no Token savings. `TeamsEnterprise` takes
`variant`; `TeamsDefault` passes `"default"`.

### Team-manager view, scaffold (in progress) `d0cb23d`

With the switch on Manager: sidebar = the member surfaces plus Teams
(`ENTERPRISE_MANAGER_SIDEBAR_SECTIONS`; hides Audit trail, Limits, Members,
Billing — Audit trail is to be RESTORED, user 2026-09-03: anyone in the org
sees it); `/teams-enterprise` redirects to the manager's team; the team page
has no back link and another team's URL redirects to their own; Budget is
read-only (no Set / Edit); Settings is read-only (no rename / delete / lock
card, Policies + Token savings disabled under "Read-only. Team settings are
managed by an org admin."); Members keeps add / remove, role select reads as
text. STILL TO DO: restore Audit trail, hide the Settings page's Delete
organization card for a manager, checklist item 8.

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

### Role switch: Admin / Manager / Member, member read-only team page `a739f50`

The "Viewing as" switch gains a third option. Before: Admin / Manager, with
the manager scaffold in progress. After: Admin (Chad), Manager (Kira Tan,
Platform), Member (Mateus Silva, Platform); one `viewRole` in
`teams-store.ts` drives every surface; Enterprise only, in the top bar, the
tight-band rail slot and the mobile drawer (stacked under the workspace
switcher, `gap-2`). Manager and Member share one sidebar
(`ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS`): Limits, Members and Billing
hidden, Audit trail RESTORED (anyone in the org sees it). Both land on their
own team, no back link, other team URLs redirect. Member: Overview + Members
tabs only; Keys, Budget and Settings tabs hidden; the roster is a pure list
(no Add member, no remove action, no role select, `MembersPane readOnly`).
Manager unchanged: add / remove kept, role as text, Budget and team Settings
read-only. Settings page (`Settings.tsx`): the Account management section
(Cancel plan, Delete organization) is hidden for Manager and Member; Profile
and Security stay editable. Test `layouts/nav-sections.test.ts`.

### Skeleton theatre: 2 s to 1 s `a739f50`

`TEAMS_LOADING_THEATRE_MS` in `teams/use-theatre-loading.ts` drops from 2000
to 1000 (user: "this takes too long at 2"). Every Teams skeleton reads the
one constant.

### Limits stays for Manager and Member, scoped to their own keys `4af3d2c`

Before: the team-role sidebar hid Limits. After: Limits stays (caps run "at
the org, project, or key level"); only Members and Billing hide
(`HIDDEN_FOR_TEAM_ROLES`). On `Limits.tsx` a non-admin's scope dropdown lists
only the keys they own from `API_KEY_SEED_ROWS` (revoked excluded), with no
"Org-wide" option; an org-wide row shows "Set by an org admin" in place of
the actions menu. The create dialog snaps a stale scope to the first valid
option after a role switch. Admin unchanged.

### Archive, not Delete, on teams `4af3d2c`

PRD: soft-delete, history immutable. Row menu "Archive"; Settings card
"Archive team"; dialog "Archive {team}?" / "Archive team"; copy "Members and
keys on this team move to the default team. The team moves to Archived teams
with its usage history. This can't be undone." Archived list column
"Archived on"; empty state says "usage history".

### Archived teams have no budget `4af3d2c`

Budget tab and breach banner hidden on an archived team (nothing attributes
to it); subtitle "Archived. Members, keys, and usage history for this team."

### Fresh teams read zero savings, no zero-delta chips `4af3d2c`

`teamSavingsFactors` returned 1 for a team with no traffic, so a new team
inherited the org's 13.8% saved. Now 0 / 0: tiles read 0.00% with flat
sparks, matching Usage (PRD 3 Reassignment: a moved member brings no
history). Savings tiles drop the delta chip when every point is 0; the
Security hero drops the org "+22.4%" chip at 0 events. Test in
`savings-data.test.ts`.

### Development team, 1 s skeleton theatre `4af3d2c`

Seed team "Platform" renamed "Development" (id unchanged).
`TEAMS_LOADING_THEATRE_MS` 2000 -> 1000 (user: "this takes too long at 2").

### Role switch snaps to Admin off Enterprise, member subtitle, placeholder `311a200`

`DashboardChrome.tsx` resets `viewRole` to admin when the workspace is not
Enterprise, so Manager / Member gating never leaks onto Default, Free or Pro.
Member team page subtitle reads "Members and usage for this team." (no keys
or budget for that role). Create-team placeholder "e.g. Platform" -> "e.g.
Data science" after the Development rename.

### Manager / Member read their own keys on every org-wide page `468b898`

PRD 3 "Managers use the product too", 8.4, 11. New `teams/view-scope.ts`:
one `useViewScope()` per page (role, own key names from
`API_KEY_SEED_ROWS.ownerId`, a virtual one-person team, the user's share of
7d requests). Admin is unscoped. Overview KPIs, chart and the three preview
tables; Activity KPI rail, trend chart, Top cards and the keys table;
Messages rows, key dropdown and hero; Conversations rows, key dropdown and
KPIs; API keys list (and a new key is owned by the signed-in user) all read
the viewer's own keys. Security: Manager reads Development's users (team
share of the canon, `teams/scoped-security.ts`) with a new User select in
the Filters dialog; Member reads their own keys. Models stays the read-only
catalog. Data prereq `677e8b7`: cnv_skylark_18 and cnv_polaris_55 now run
on Kira's openclaw / nova-chat, cnv_orion_70 and cnv_lyra_92 on Mateus's
hermes-agent / atlas-eval; every conversation sits on one owner's keys,
Security rows follow. BYOK conversations read "—" for cost (26 metered rows,
`pricing.test.ts`). Org roll-ups unchanged (`view-scope.test.ts`).

### No org delta chips on scoped KPIs `9235958`

User: "how could she be up for the delta when she never spent money?" The
delta chips on Activity (KPI_DATA per range), Conversations (+6.4% / +1.8 /
-3.1%), Overview strip (+8.2% / +8.7% / +22.4%), the Security hero (+22.4%)
and the Messages hero (view.delta) are hardcoded ORG rates. A scoped
Manager / Member has no canon rate, so the chip (and its note) is dropped
for them on every one of those tiles; Admin unchanged. Same class as the
zero-tile chips fixed in `4af3d2c`.

### Members have no Teams surface `259e400`

Confirmed 2026-09-03: a Member does not see Teams at all (PRD 8.4 gives
team read access to the manager role only). New
`ENTERPRISE_MEMBER_SIDEBAR_SECTIONS` in `nav-sections.ts` hides Teams on top
of Members and Billing; `DashboardChrome` picks it for the member role.
`/teams*` and `/teams*/:teamId` bounce a Member to the workspace's Overview
(`overviewPathFor` in `lib/plan.ts`). Manager unchanged: own team,
read-only budget and settings. Supersedes the earlier read-only member team
page (`a739f50`); that code path is now unreachable and left in place.

### One model per conversation `174cb68`

User: "most conversations / sessions only use 1 model". Five conversations
ran 3 or 4 models each; 19 request rows re-modelled to the conversation's
dominant model (lyra -> Haiku 4.5, vela -> Sonnet 5, skylark -> Kimi K2
Thinking, polaris -> Gemini 3.1 Pro); cnv_orion_70 is the one exception at
two (Opus 4.7 + Gemini 3.1 Pro). 8 row costs and 3 seed costs re-derived
from `costOf`; seed `vendors` / `models` follow the rows. The Models cell
on Conversations now shows one avatar (two on orion).

### Sidebar: "Manage" is "My settings", Limits moves to Workspace `23d41d9`

PM meeting 2026-09-03 (Joao Carvalho, Alex Brandes): the policies section
is renamed to make clear these are individual configurations; org-level
locks are managed on the Teams page; a locked setting shows a banner and
disabled inputs (already built). Section label "Manage" -> "My settings" on
every tier, holding Policies and Token savings. The Enterprise-only "My
policies" / "My token savings" item labels are dropped: the section says
whose they are now, so Pro and Enterprise read the same. Limits moves to
Workspace after Activity: an admin's org-wide caps are not a personal
setting. `nav-sections.ts`, `data-model.md` sidebar table.

### Block threshold field restored on hard budgets `2f906bd`

PRD 3 / 8.2 / 11: budgets carry warn AND block thresholds ("warn at 80%,
block at 100%"). The field was removed 2026-09-02 (`9eafff4`) and is back on
the PRD gut-check: "Block threshold (% of budget)" under the warn field,
hard budgets only, whole number 1 to 100 and above the warn value ("Block
must be above the warn threshold."), blur-gated error like the other
fields, Save disabled while invalid. Saved value flows to `blockThreshold`;
the Budget tab "Block at" fact and the breach banner already read it.
`src/pages/teams/dialogs.tsx`.

### Audit trail: a user sees their own log `6c66c4a`

User: "a user only sees their audit logs, not the whole org. That's what an
ADMIN sees." Manager and Member read the rows stamped with their own name
(`EventRow.member`; live appends are stamped with the actor already); the
KPI tiles, table and pagination follow. The Member filter is hidden for
them (one member's log has nothing to filter by member). Admin unchanged.
Models stays the read-only catalog for every role: both are USER surfaces,
not team oversight, so PRD 11 "nothing outside their team" does not apply.
