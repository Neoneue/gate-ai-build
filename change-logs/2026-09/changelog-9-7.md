# UI Changelog: 2026-09-07

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-4.md`](./changelog-9-4.md)

---

## Conventions

### Viewing as switch on Pro: team roles belong to Pro and Enterprise `0988097`

Before: the "Viewing as" Admin / Manager / Member switch rendered only on
the Enterprise workspace, and leaving an Enterprise path snapped the role
back to Admin. PRD section 3 puts teams, budgets and the manager role on
Pro as well; only the forced settings are Enterprise-only. After:
`isTeamRoleSurface` (`src/lib/plan.ts`) is true for Pro and Enterprise,
false for Default and Free. `DashboardChrome` shows the switch in the top
bar and the collapsed rail on both, picks `PRO_TEAM_ROLE_SIDEBAR_SECTIONS`
/ `PRO_MEMBER_SIDEBAR_SECTIONS` (`src/layouts/nav-sections.ts`, same hidden
sets as the Enterprise variants: Members and Billing for team roles, plus
Teams for members), and snaps to Admin only on Default and Free. Personas
are unchanged: Admin is Chad, Manager is Kira Tan, Member is Mateus Silva,
so Pro and Enterprise show identical numbers per role.

### Rows per page never offers a size the list cannot fill `d52b8fe`

Before: every `TablePaginationFooter` offered 10 / 25 / 50 / All, so a
25-row Models catalog offered 50 and an 8-row list offered four choices
that all meant the same thing. After: `rowsPerPageOptions(total)`
(`src/components/ui/table-pagination.ts`) keeps only the steps at or below
the row count plus All. 25 rows offers 10 / 25 / All; 50 rows offers all
four; 10 or fewer rows hides the Rows control entirely and keeps the
"Showing 1 to N of N" text and page controls. A stale larger choice (50
selected, then a filter narrows to 20) reads as All in the label and in
`resolveRowsPerPage`, so the footer and every consumer's slice agree.
Shared by all 11 tables; no consumer changed.

## Sections

### Messages, Conversations: detail pages stay in the viewer's workspace and role `70d53e4`

Before: `/messages-findings/:id` and `/conversations-trace/:id` existed
only as Pro routes. Every row link from Default, Free or Enterprise dropped
the workspace suffix, the badge flipped to Pro, and the Enterprise role
snapped to Admin on arrival. After: both pages have `-default`, `-free` and
`-enterprise` twins (`src/App.tsx`), and `withTierOf` (`src/lib/plan.ts`)
carries the current suffix through the 12 links into them (Messages table,
Conversations table, Overview latest messages, Security event detail,
request and conversation detail bodies) and their back links. The
workspace switcher keeps the user on the detail page. A Manager on
Enterprise or Pro clicks a row and stays a Manager on that workspace.

### Messages, Conversations: a row outside the viewer's keys reads as not found `70d53e4`

Before: the detail pages resolved any id from the full row set, so a
Manager or Member could open another owner's request or conversation by
URL while the list pages hid it. After: `RequestsFindings` and
`ConversationsTrace` call `useViewScope` and treat an out-of-scope row
(`inScope` on `keyId` / `initiator`) as missing, rendering the existing
"Request not found" / "Conversation not found" state. Admin is unscoped and
unchanged. Matches PRD section 8.4: no prompt content outside your own keys
until the owner enables prompt visibility.

### Messages hero: headline equals the sum of the bars for scoped roles `70d53e4`

Before: `scaleHeroView` rounded the total and each bucket independently
under a Manager or Member share, so the headline could differ from the bar
sum by a few requests (Manager read 1,166 over bars summing to 1,157).
After: buckets scale first and the total is their sum; success stays
clamped to the total. Manager reads 1,157 = 1,136 success + 21 errors.
Admin is unchanged at 4,860. Test pins the reconciliation at the real
Manager and Member shares.

### Models: the table pages `70d53e4`

Before: `Models.tsx` passed the full filtered list to the table while the
footer paged, so "Page 1 of 3" at 10 rows always rendered every model.
After: the body slices with `resolveRowsPerPage`, same form as Audit trail.
Page 3 at 10 rows shows 5 models and "Showing 21 to 25 of 25".

### Teams: forced settings gate on the Enterprise entitlement `e9c9cae`

Before: `TeamsEnterprise` and `TeamDetailEnterprise` read entitlement from
the page `variant`, which only the Default twin sets, so the Pro routes
(`/teams`, `/teams/:teamId`) showed the org Settings tab, the team lock
card and the org to team lock cascade. PRD sections 3 and 8.5 and ticket
AG-624 make forced settings Enterprise-only, not-entitled state hidden.
After: `entitled = isEnterpriseSurface(pathname)` in both pages. Pro and
Default: the Teams list has Current and Archived only; a Pro admin's team
Settings tab is rename and archive only; a Pro manager has no Settings tab.
Enterprise is unchanged. When the active tab disappears across a workspace
switch, Teams falls back to Current teams and Team detail to Overview.

### Site map: standalone /site-map flow chart of every workspace and role `9366dac`

New reference page for developers and product, typed at `/site-map`, no
sidebar link, admin-only (any other role is sent to Overview). Standalone
document outside the dashboard shell (`src/pages/SiteMap.tsx`). Root node
"Signed in as Chad Ponticas" forks into Free, Pro and Enterprise columns;
Pro and Enterprise fork again into Admin / Manager / Member cards, Free
into a single Admin card with the snap-to-Admin note and a Default footnote.
Every card is drawn from the constants the app itself uses
(`src/layouts/nav-sections.ts` sets, `src/data/team-members.ts` roster,
`src/lib/plan.ts` helpers): persona, data scope, Teams landing path,
sidebar items with their literal routes and lock marks, the two detail-route
twins, and the PRD sections that justify the node. Two closing sections list
the Enterprise-only surfaces and the detail-page not-found rule, then a
callout marks manager prompt visibility (AG-697) as not built.
`src/pages/site-map/data.ts` holds the matrix; 11 tests pin it.

### Roles: a page hidden from the sidebar is blocked by URL `b6be012`

Before: the sidebar hid Members and Billing for Manager and Member and
Teams for Member, but only Teams enforced it; typing `/members` or
`/billing` (or their Enterprise twins) as Manager or Member rendered the
admin page. After: `DashboardChrome` checks the page's nav id against the
role's own sidebar sections (`sectionsIncludePage`,
`src/layouts/nav-sections.ts`) and redirects to that workspace's Overview
when it is absent. Admin is unrestricted. Hidden and blocked are now the
same list by construction. Verified in the browser: Manager and Member on
Pro and Enterprise land on Overview for Billing, Members and (Member) Teams;
Admin opens all three.

### Sidebar: unused lock affordance removed `b6be012`

Before: the sidebar carried a dormant lock mechanism (empty locked set,
padlock icon, hidden "Pro feature" label, `showLocks` plumbing) that no
PRD sentence describes and no workspace used. After: deleted from
`sidebar.tsx`, `nav-sections.ts`, `DashboardChrome.tsx` and the site map.
A page a role cannot see is hidden, and that is the only mechanism. The
Teams "locked settings" concept (PRD 8.5 forced settings) is unrelated and
unchanged. Site map "Hidden pages" rule lists the hidden ids per role from
the same helper the chrome uses.
