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
