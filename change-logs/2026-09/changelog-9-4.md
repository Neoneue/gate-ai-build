# UI Changelog: 2026-09-04

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-3.md`](./changelog-9-3.md)

---

## Conventions

### Heading ladder: 18px retired, dialog and block titles at 20 `9434e08`

Before: `type-heading-18` sat between the 20px `SectionTitle` and the 16px
`CardTitle`, worn by every dialog title (`dialog.tsx` default plus explicit
overrides in ApiKeys, Billing, BillingFree, Limits, LimitsFree, AuditTrail,
Team, DashboardDefault, RequestsTable, EventsTable, RequestDetailBody, teams
`dialogs.tsx`, both plan-comparison dialogs), the empty-state titles, the
plan-card titles, the Upgrade card title and the Overview feed `CardTitle`;
`DialogTitleBlock` sized its hero title with a raw `text-lg`. After: all 27
consumers read `type-heading-20`, `DialogTitleBlock` reads `text-xl`. The
ladder is 32 page, 24 section, 20 block / table / dialog, 16 card title.
The class stays defined in `index.css` for the lint allowlist; `design.md`
h4 row marks it retired. The Ask AI markdown `h2` (`text-lg/7`) is left, so
markdown h1 and h2 stay distinct.

### Heading ladder: 28px retired, Teams Overview tab header at 24 `86da091`

Before: the Teams Overview tab header "Team overview" was the site's only
`type-heading-28`, giving the team detail page four title levels (32 page,
28 tab header, 24 section, 20 block). After: the tab header sits at
`type-heading-24` over its 16px subtitle, the same pair the sections use, so
the ladder is 32 / 24 / 20 / 16 everywhere. `design.md` marks the 28 row
retired; the class stays for the lint allowlist.

### Lazy shells: notifications list and Ask AI panel load on first open `d2275d6`

Before: every dashboard page shipped the notifications list, the Ask AI
panel with its markdown renderer, and the full Framer Motion runtime inside
the chrome chunk (219 KB gzip), and the Messages table pulled the 425 KB
transcript chunk for its preview column. After (`plans/bundle-split.md`):
the bell trigger and unread badge stay eager (count from pinned seed ids in
`data/notifications-seed-ids.ts`); the popup body is `notifications-menu-body.tsx`
behind `React.lazy` with an empty shell fallback (`h-12` toolbar band +
`h-96` list; 16px shorter than the settled list on first open). The Ask AI
panel mounts on first open and stays mounted. The twelve animated icons use
`m.` under one `LazyMotion strict` wrapper in `DashboardChrome.tsx`. The
Messages preview column reads the generated `data/request-previews.ts`
(`npm run build:previews`). Chrome chunk 219 KB to 80 KB gzip; Overview first
load 427 KB to 268 KB gzip. Nothing changes visually. Same day: `9d6b526`
removed 1,691 lines of unimported and unreachable code, no UI change.

## Sections

### Team Overview: tab header stands apart from the ruled sections `e31f916`

Before: the Overview tab wrapper ruled and padded every child after the
first, so "Team overview" (title, subtitle, range and member controls) got the
same rule-below and 32px rhythm as Usage, Security and Token savings and read
as a fourth sibling section. After: two groups at `gap-6`. The header group
carries no rule; the section group keeps `gap-8` with the rule and `pt-8`
between its three panes only. Tab header to first section is 24px. The same
wrapper had forced every non-24 `SectionTitle` in the tab to `text-lg/7`
(18px); that selector is gone, so "Usage by current members" and the other
table titles render at the 20px default. Rule to hold: tab header, no rule,
controls right; sections, rule above, no controls.
`src/pages/TeamDetailEnterprise.tsx`.

### Team Overview: section subtitles in the site's own words `86da091`

Before: the Security and Token savings subtitles read "What the gateway caught
on this team's traffic, and where it clustered." and "What compression
returned to this team against raw provider cost." After, borrowing the
Security events and Token savings page subtitles: "Prompt injection, PII, and
credential events your policies caught on this team's traffic, and which
members they came from." and "What this team saved by caching, compressing and
deduplicating requests, compared with what it would have spent otherwise."
Usage unchanged. `src/pages/TeamDetailEnterprise.tsx` Overview tab.

### Team Settings titles match the Settings page at 20 `9434e08`

Before: `SettingsStack.tsx` stepped General / Policies / Token savings up to
`type-heading-24`, so the Teams page Settings tab and the team detail
Settings tab read one size above the Settings page's Profile / Security /
Account management. After: the override is gone and the three titles fall
back to the `SectionTitle` default, `type-heading-20`. One shared stack, so
both Settings surfaces change together.

### Team Overview: section subtitles under Usage, Security, Token savings `9434e08`

Before: the three 24px section titles on the team Overview tab stood alone
one 1.2x step above the 20px table titles. After: each carries a full-width
one-line description in the page-header subtitle voice (`type-copy-16 m-0
text-pretty text-muted-foreground tracking-snug`), stacked at `gap-2` inside
the existing title row; the range chrome slot is untouched. Copy describes
what the section tells the reader, never an affordance: Usage "How much this
team has spent and sent over the range, and which members and models account
for it."; Security "What the gateway caught on this team's traffic, and where
it clustered."; Token savings "What compression returned to this team against
raw provider cost." Threaded as an optional `description` prop on
`UsagePane`, `TeamSecurityOverviewPane`, `TeamTokenSavingsRail`; the Usage
tab, Budget block, table titles and Settings pass none. 14px and a
half-container measure cap were tried and reverted: the page is capped at
1024 and the site pairs 20/28 titles with 16 copy elsewhere.

### Messages: budget-blocked row reads a UUID prefix, not "budget-block" `a3843b0`

Before: the live budget-blocked message (one per team over a hard cap,
`src/pages/requests/budget-block-rows.ts`) carried the id
`budget-block-<teamId>`. The Message cell's second line shows the first two
dash segments of the row id, so that row read "budget-block" where every
other row reads a UUID prefix such as `34fef969-7dfc`. After: the id is
seeded through `fallbackRequestUuid` on the team, so it is UUID-shaped like
every seeded row and stable across reloads. The deep link
`/messages-findings/:requestId` follows the same id. Test asserts the shape.
