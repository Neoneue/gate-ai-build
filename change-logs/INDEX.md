# Change-log index

Every UI change to the dashboard, newest first. One file per day, grouped by
month. Each file states what changed, before → after, and where — written to
diff against and replicate across surfaces.

**Find the change, then open only that file.** Thirty files is roughly 90k
tokens; this index exists so nothing has to glob the directory.

## September 2026

### [2026-09-01](./2026-09/changelog-9-1.md)

- Team usage math: by-model requests reconcile with the team total
- One scaled projection per range: scaleUsage()
- Budget bars fill with success / warning gradients
- Enterprise Budget tab: window-aware table titles, scope Callout removed
- Enterprise Teams list: "Your teams" section title
- Team sparklines: one daily backbone, windowed per range
- Multi-window team budgets: one cap per window, shared enforcement
- Chart bars take `--chart-N-soft` gradient ends
- MultiSelect: opt-in `minSelected` and `showSelectedLabels`
- BudgetSummary: label + value facts with Info tooltips
- Enterprise Budget dialog: window multi-select, per-window amounts, scrollable
- Enterprise Budget tab: header pill scopes card and tables to a window
- Enterprise Teams list: org budget card removed, tightest-window meter, widths
- Enterprise team detail: tab order, Keys Member column, small monograms
- Enterprise Security tab: overview pane, threat types per member, two sections removed
- Teams store shared by list and detail
- Members rename: nav label and routes
- Enterprise Budget tab: stacked per-window cards, tables leave
- Enterprise team Members tab: Status becomes Joined
- Members page Invitations table: Actions column no longer overflows

## August 2026

### [2026-08-31](./2026-08/changelog-8-31.md)

- Manager role is per-membership; co-managers allowed
- Budgets drop the block threshold, gain quick-pick presets
- Enterprise workspace tier joins Pro / Default / Free
- Team member roles are org roles; the manager select is gone
- BudgetMeter gains a warn state; fill logic shared via budget-band
- New Callout primitive: quiet persistent info banner
- Line tab rails are no longer vertically scrollable
- Teams seed splits members and keys into real teams
- Teams list: budget utilization column + deleted-teams card
- Team detail: header actions, sortable spend tables, richer Keys tab
- Team Security tab counts findings and renders zero-findings states
- Enterprise Teams list: CTA-only header, deduped org budget card
- Enterprise team detail: Usage tab gets Activity's chart treatment
- Enterprise team detail: Budget tab combined into one card + Callout
- Enterprise team detail: Members / Keys table parity

### [2026-08-28](./2026-08/changelog-8-28.md)

- Nav items can hide per workspace variant
- MultiSelect options carry an optional description line
- SettingsRow title widens to ReactNode
- Teams workspace pages cloned from staging

### [2026-08-27](./2026-08/changelog-8-27.md)

- Back navigation restores the content scroll
- Rows-per-page 100 becomes All
- Table scroll edge fades
- Org security events gain the scope tray
- Channel row icon centers on the first two lines
- Notifications feed: bulk mark-as-read, Gmail select, 48px rows
- Limits table: width scheme, resets format, actions alignment

### [2026-08-25](./2026-08/changelog-8-25.md)

- Checkbox gets a visible disabled state
- EmptyState gains an optional footnote
- Bell menu becomes an inbox peek
- My Notifications page
- Notification history deepens to 38 real items
- Checkbox paints indeterminate
- Segmented options carry count chips
- Bell windows the whole history; archive and read split
- Feed bulk select
- Security-event default flips off per the PRD
- Limits: spend and usage alerts
- Feed rows pinned to one height
- Messages limits never alert

### [2026-08-24](./2026-08/changelog-8-24.md)

- Notification bell returns with a real feed
- NotificationsMenu: rows, read state, unread dot
- Alerts page removed

### [2026-08-20](./2026-08/changelog-8-20.md)

- Table row-identifier cells take the copy voice
- Security event verdict reaches the table
- Message blocks in the security event modal tighten to 8px
- Model name drops to the copy voice
- Provider shows the upstream host
- Messages table narrows 1580 to 1484

### [2026-08-19](./2026-08/changelog-8-19.md)

- Message column identifies a request on its row
- Request ids are UUIDs, shown as two segments
- Tokens In and Out merge into one stacked column
- Time renders the date in sans, the clock in mono
- Key column truncates
- Device name column on the key usage table
- Messages table column widths, re-measured

### [2026-08-12](./2026-08/changelog-8-12.md)

- Account management reads as an organization surface

### [2026-08-11](./2026-08/changelog-8-11.md)

- Page content responds to its column, not the browser (76 viewport variants → container queries, 36 files)
- `lg` removed from Input and Select; `Input` is now single-size
- Off-scale numeric type sizes fail the build
- `chart-geometry.tsx` — one geometry source for every axis-bearing chart
- TrendCard bar density folds by column width on a monotonic ladder
- X axis is an even stride that lands centred on its bars
- Table toolbars stack on column width (7 pages + `FilterToolbar`)

### [2026-08-06](./2026-08/changelog-8-6.md)

- The Ask AI scroll FAB rides the composer instead of a constant
- Light-mode dot grid eased to 0.7
- Alerts is hidden from the nav
- Account-management copy aligned to the AG-508 PRD

### [2026-08-05](./2026-08/changelog-8-5.md)

- Destructive alpha ladder — 30 / 50 / 100 named, not modifier-typed
- Observed values never fabricate past the 7 days of real data
- `Stepper` — new primitive for numbered in-dialog steps
- `Card` gains a `tone="danger"` edge
- `CancelPlanDialog` — shared controlled confirm, two entry points
- Alerts — a new Manage surface for rules and firings
- Settings — Account management section

### [2026-08-04](./2026-08/changelog-8-4.md)

- Blue becomes a surface language for exactly one card — the `--promo-*` family
- The 12px type floor opens one step down, and it is fenced
- There are now exactly two sanctioned half-steps, and the second is written down
- `SidebarUpgradeCard` — the upgrade CTA, 1:1 from the Figma twins
- The dot field is CSS, not a 2× PNG pair
- The rail grows a footer, and it obeys the tier signal that was already there
- Every message in the Conversations trace gets copy + expand, on the `↳ req_` line

### [2026-08-03](./2026-08/changelog-8-3.md)

- `type-copy-14-tight` is deleted — it was a no-op alias
- The copy scale is finished — `type-copy-20` and `-24` deleted
- Money is never authored — every dollar derives from the catalog
- Activity's spend engine inverted — tokens are authored, dollars are derived
- BYOK means one thing on every surface
- Top users ranked BYOK owners out of existence
- The trend chart named a fixed five and buried the 3rd-heaviest model
- Settings — section titles move above their cards
- Models — catalog and providers rebuilt from production
- Activity — the provider dimension was three names out of date
- The three Activity dimensions disagreed on every single day
- Models table — provider marks sit on 8px, not on top of each other
- Sub-cent prices stop reading as free
- PAYG snippet named the wrong models
- Messages, Conversations, Activity and Setup now name the same fleet as Models
- Conversations advertised models their own requests never ran
- Activity charted four models that never existed
- Setup pricing quoted a fictional price list
- Both model filters offered models that could never match
- PAYG card promised GPT; the pooled catalog has none
- Messages Model cell drops the canonical-id subtext
- Ask AI reply actions — thumb ratings hidden behind a flag

## July 2026

### [2026-07-30](./2026-07/changelog-7-30.md)

- `DialogContent` gains `density` — a dialog is 16px, a modal is 24px
- `ToolResultCode` goes sans, and breaks at words
- Ask AI canvas — the dark dot grid was carrying too much texture
- Ask AI empty state — the support suggestion read as a command
- New primitive: `ToolCallCard` — the CALL card inside an assistant bubble
- `MessageBlock` default fill: `bg-background` → `bg-card-muted`
- Security event modal — an "Add note" button and its dialog
- Conversations trace — assistant tool calls, and a reflow that finally respects its container

### [2026-07-29](./2026-07/changelog-7-29.md)

- `Button` gains `icon-action`, the one responsive size
- Dark `--muted-foreground` retunes neutral-300 → neutral-400
- Elevation moves to Tailwind's shadow scale — five bespoke families deleted
- New `--accent-muted` token — hover is half of selected
- Menus, Select, and the sidebar split hover from active
- Ask AI reply feedback row — thumbs, copy, and a wired retry
- The Ask AI composer floats over the thread
- The Ask AI header trigger becomes a real chat picker
- The thinking row swaps lucide `Brain` for the `@dotmatrix` 3×3 pulse
- The Ask AI chat body gets its dot-matrix canvas — drawn in CSS, not shipped
- Security event modal — verdict footer replaces the title-row flag button
- `Button variant="outline"` — the dark fill was see-through
- Ask AI canvas — strength and floor retuned

### [2026-07-28](./2026-07/changelog-7-28.md)

- Streaming chat: follow the stream by intent, not by geometry
- The Button size scale realigns to shadcn — `default` is the largest
- Every label takes the label voice, at `font-medium`
- Ask AI panel becomes a working chat (scripted agent)
- Ask AI: an empty state, a new chat, and a composer that arms itself
- Hand-rolled buttons: 19 page-level raw `<button>` down to 6
- Manage subscription: the Pro dialog matches the Free one

### [2026-07-27](./2026-07/changelog-7-27.md)

- Content pane is a container-query context; page grids key off content width
- Design-token guard runs at commit time; markdown gated in CI only
- Two semantic tokens for icon-only controls: `--primary-foreground-soft`, `--control-raised`
- Four chat-bubble tokens, and a sans exception for reply prose
- Ask AI top-bar button + docked chat-panel shell
- Docs button icon → leading BookOpen
- Pagination footer wraps on content width
- Top-bar workspace switcher relocates to the rail when cramped
- Ask AI panel state persists across navigation
- Accessible name on the Overview chart select; Policies check bullet realigned
- Ask AI chat composer
- Pagination ellipsis let the whole site scroll past the shell
- Ask AI chat bubbles + markdown reply scope
- Ask AI scroll-to-latest FAB
- Overview: container-query responsive conversion
- Container-query rollout to the remaining pages

### [2026-07-20](./2026-07/changelog-7-20.md)

- Settings: single Full name field + responsive Profile / Passkey layout

### [2026-07-17](./2026-07/changelog-7-17.md)

- Site margins 16px on mobile
- Subtitles full-width on mobile and tablet
- Filter modal footer: Reset left, Cancel+Apply right, one row
- Pagination footer: +4px bottom padding on mobile + tablet
- Table column gutter standardized to 24px
- Data tables side-scroll on mobile + tablet
- Sidebar rail desktop-only; hamburger nav on tablet + mobile
- API Keys: responsive setup cards, 1024 max width, drop 7-day column
- Billing: Seats inset stacked (title, seat-count, full-width copy)
- Activity mobile tweaks: right-aligned toggle, TrendCard button-row spacing
- Activity TrendCard: mobile header stack, divider, fewer bars, aligned ticks
- Hero cards: delta under the KPI number, key bottom-aligned
- Hero-chart x-axis ticks: recharts-native thinning
- Activity: bottom 4 breakdown cards stack on tablet + mobile
- Overview security-events preview: unique row key
- Table pagination: legible active page, prev button, compact window, 32px
- Mobile-responsive pass: content-flow shell, toolbar/footer stacking, Policies cards
- Policies cards: full-width description + spacing
- Mobile polish: pagination footer centered, tabs side-scroll, conversation-trace
- Compact-millions KPI formatter (1M+ → N.NM) across KPI tiles

### [2026-07-16](./2026-07/changelog-7-16.md)

- Mono data voice: `type-mono-*` tokens; all data numerics tokenized
- twMerge: custom `type-*` utilities join the `font-size` group
- SegmentedPill: internal button padding standardized to 12px
- Button / Input / Select: shadcn-aligned size scale
- Input / Select default bumped to `lg` (36px); table toolbars sized up
- Overview "Tokens used" chart title -> 18/16 responsive
- Overview "Tokens used" selector + toggle sized to `sm` (32px)
- Overview + Activity chart tooltips: 2-column gap -> 24px
- Model breakdown: `Claude Haiku` series relabeled `Others`
- Overview preview tables: uniform 48px rows + Type-cell alignment
- Models page: subtitle -> tabs gap to 32px

### [2026-07-15](./2026-07/changelog-7-15.md)

- Large-table section-header toolbars: stack above the table
- Activity "Recent key usage": drop Billing column, even column widths
- Security MiddleRow: stack the two category cards below `lg`
- Full-width ApiKeys, xl card stacking, Activity "Users" header

### [2026-07-14](./2026-07/changelog-7-14.md)

- TopList: options prop for per-card toggle sets
- New token: `--border-active` on the SegmentedPill indicator
- Stacked bar charts: top-corner rounding halved to 1px
- Activity: Alerts column on Usage by key
- Activity: revoked keys + Hide revoked toggle
- Activity: Billing column gap -25%
- Activity: staging-web -> design-agent
- Activity: Top attack types card (4th middle card)
- Activity: Saved column on Usage by key
- Activity: Savings lens on the trend chart
- Trend chart: auto-width YAxis + tooltip spacing
- Activity: savings maturation curve (chart + Saved column)
- Activity: Top cards wrap 2×2 below 2xl
- Feedback FAB: round messenger button

### [2026-07-13](./2026-07/changelog-7-13.md)

- Recessed-surface tokens: nested inset -> --card-muted, message wells -> --background
- No-hardcode rule + design-system reference page fully tokenized for dark mode
- data-model.md: sync detail surfaces to page-only
- Messages detail: flatten section titles to type-label-14
- Messages: soften danger/warn message tint + drop dead modal variant
- Messages detail: delete dead request modal, rename file to RequestDetailBody
- Design system reference page: dark mode + theme toggle + token catalog
- Repo hygiene — root cleanup, data-model + changelog docs

### [2026-07-10](./2026-07/changelog-7-10.md)

- Dark-mode audit — shared primitives
- Dark-mode audit — featured-plan gradient card
- Table/row hover — stop border-color interpolating through theme transitions
- Requests → Messages terminology rename
- Categorical chart palette — dark-mode override
- design.md — blue Pro-CTA exception
- Reconcile Tokens Saved rate with the Token Savings 7d window
- "Tokens used" chart — axis labels + rounded stack tops
- Chart-metric toggle — accessible name
- Dark-mode: Top-cards subtitle opacity
- Toolbar search bar aligns to the KPI/card grid above it
- "Tokens over time" chart — axis right-align + rounded stack tops
- Chart-metric toggle — accessible name
- Dark-mode: FindingSwitcherCard border
- Table columns — spell out "Tokens In" / "Tokens Out"
- Dark-mode: trace-row hover ring
- Toolbar search bar aligns to the KPI/card grid above it
- Dark-mode: Mark-invalid button hover + hero axis-tick contrast
- Dark-mode: provider-icon separator ring
- Capability badges — more vertical room
- Toolbar — match search + dropdowns to site convention
- Dark-mode: sensitivity slider fill + action radio/border variants
- Tokens Saved rate wired to the shared constant
- Model-picker focus ring

### [2026-07-09](./2026-07/changelog-7-9.md)

- Dark mode: `.dark` token theme + provider
- Text-color token sweep — pass 1
- Sensitivity slider dot fills restored in dark
- CTA blue brightened one step in dark mode
- Dark-theme sidebar logo
- Theme-aware elevation shadows + select trigger shadow
- Segmented track restored to `bg-background`
- `--chart-grid` token + accessible KPI deltas
- Conversations trace panel height 600 → 640px
- Message bubbles lightened to `bg-card-muted`
- Conversations trace panels get a `bg-card` body
- `--card-muted` token replaces the neutral-50 wash hardcodes
- Light table column headers restored to neutral-50
- Light content canvas restored to neutral-50
- Code-snippet syntax legibility on dark
- Saturated colored text/icons + pro-CTA token parity
- Ultralight `-25` tint surfaces get dark variants
- Surface sweep pass 3 — nav / calendar / pagination + page layer
- Surface + tint token sweep — primitives (pass 2)
- Overview preview tables → shared primitives + `NavTableRow`
- Title + eyebrow primitives use semantic text tokens
- Dark-mode fixes: segmented controls + monochrome vendor icons

### [2026-07-07](./2026-07/changelog-7-7.md)

- Billing: stack plan/credits cards + cap page at 1024px
- Pages: 1024px content caps + API Keys responsive polish
- API Keys: a11y heading hierarchy + default-variant cap
- Cap remaining tier twins at 1024px

### [2026-07-06](./2026-07/changelog-7-6.md)

- Request-data optimization: transcript dedup + body split
- Requests.tsx split into `src/pages/requests/` modules
- Split oversized page files into focused modules
- Extract Policies config/data to `policies/config.ts`
- Remove experimental Merkle audit variant
- Split Security.tsx into `src/pages/security/` modules
- Rename Requests to Messages and regroup sidebar
- Complete the Messages copy rename across all tiers
- Inner card title removed on all three Messages pages
- Routes renamed `/requests*` → `/messages*`

## June 2026

### [2026-06-26](./2026-06/changelog-6-26.md)

- Heading primitives routed onto `type-heading-*` tokens
- One-h1-per-page rule codified
- Standalone `design-system.html` reference page

### [2026-06-25](./2026-06/changelog-6-25.md)

- Spacing relaxed to a 4px grid
- Semantic text tokens site-wide
- `blue-25` documented
- Advanced compression bullet checks softened
- `lg` switch size
- Billing modal width fixed at 500px
- Token Savings plan-card figure + footer copy
- Auto-recharge enable card: drop gray fill
- Token Savings compression polish + plan-gating
- Policies: collapse by default + CTA bullet weight
- Overview-default onboarding flow rebuilt + setup subpages
- Token Savings copy + KPI cleanup (post dev-sync)
- Overview Get-started card: CTA + supports treatment
- Terminal-period convention codified + swept site-wide
- Overview-default: onboarding-first empty state
- Gate Connect setup steps + inline create-key modal
- Overview PAYG card: model breadth supports strip
- BYOK manual config snippets — agent settings format
- PAYG agent configs + Hermes tab
- Overview PAYG card title aligned with setup page
- Policies Free Pro-benefits CTA: soft blue check icons
- Manual setup: progressive-reveal step gating

### [2026-06-24](./2026-06/changelog-6-24.md)

- Default workspace: three-way switcher + `-default` route tier
- Default pages: empty-state rebuilds + Activity layout polish
- WorkspaceSwitcher badge polish + alignment fix
- Billing modal Pro card blue styling + display heading scale
- Shared ON/OFF StatusBadge
- Token Savings: Compression plan cards + card-wrapped Caching options
- Policies: header status badges + Free prompt-injection Action panel
- Requests: grow finding-modal wells to fill the clean-pass gap

### [2026-06-23](./2026-06/changelog-6-23.md)

- AuditTrail export simplified; Policies Pro card polish
- Project-wide type-role utility sweep (pt. 2)
- Policies radio + icon + copy polish

### [2026-06-22](./2026-06/changelog-6-22.md)

- Design values are a closed set: token guard + heading scale
- SectionTitle primitive + CardTitle `as` prop
- Audit record modal: accurate seal comment + Open Explorer as link
- Audit trail Filters: checkbox multiselect
- Audit trail: fingerprint info tooltip
- API Keys Manual card: copy button anchor + tabs gap
- Audit trail Filters: Export dropdown
- Empty state: title grouped with copy
- Audit trail: benefit-led page subtitle
- Audit trail: redacted descriptions + empty-state copy
- Default Overview: Get started hero rebuilt
- Requests findings: credential rule labeled credential-scanner
- Policies: card redesign + sensitivity slider, mirrored across tiers
- Policies: scan-direction detail card gains a directional arrow
- Policies: typography rhythm + micro-interaction polish (Free + Pro)
- Policies: semantic heading/label/copy type roles
- Policies (Free): Pro upsell panel added + iterated to match comp
- Token: blue-25 surface tier for subtle upsell fills
- Cross-page typography consistency sweep (Requests + Security)
- Project-wide typography sweep + role expansion
- Policies (Free): Upgrade CTA sm + card title/subtitle revert
- Overview-first semantic type-role adoption

### [2026-06-19](./2026-06/changelog-6-19.md)

- Press affordance standardized to `active:scale-[0.98]` site-wide
- `design.md` consolidated to one canonical doc
- Audit trail: Export view button uses the animated export icon
- Audit trail: drop synthetic delta from Events logged KPI
- Audit record modal: single details card, tabs removed

### [2026-06-18](./2026-06/changelog-6-18.md)

- Press scale 0.98 + cursor:pointer on buttons
- shadow-xs darkened ~10%
- Ultralight `-25` tint tokens
- `select.tsx`: additive `multiple` (multi-select) support
- Findings switcher: whole-card click + detail polish
- Findings cards: active tint, static single card, select-none
- Detail KPI rail gets shadow-xs
- Tune policy action routes to the Policies page
- Audit Trail: Filters modal replaces inline event-type Select
- Audit Trail Filters modal: Cancel button
- TableEmptyState merges into its host Card — no empty bands
- Table-section wrapper audit — all 13 table pages  (no code change)
- Security: Filters modal replaces three inline event Selects
- Page subtitles use `tracking-snug`
- Audit Trail: header + KPI rail slimmed
- Audit Trail: section title + table share one `gap-4` wrapper
- Requests findings always masked; Unredact toggle removed
- Billing modals: fixed 500px from md up

### [2026-06-17](./2026-06/changelog-6-17.md)

- FindingCard: sans message, tighter padding, no detector/turn line
- Passed detector cards: px-4 py-3
- Per-row compression override
- PII findings switcher card + pager
- PII switcher banner + match-line polish
- Findings switcher generalized + two-turn evidence
- Findings banner collapsed to one digest sentence per detector
- req_cd0e57: flagged provider-error request
- Findings detail on provider errors: trimmed narrative + white wells
- req_cd0e57: full-request body swapped to empty text blocks
- No-findings empty state: standalone card, success/allow only
- Policies: per-action active colors, swapped halves, key icon
- Real-data request detail pages + per-occurrence findings
- req_8389e4: chad@ trailers + generic PII banner
- req_8384d2: in/out redaction request from docs/ sources

### [2026-06-16](./2026-06/changelog-6-16.md)

- Workspace switcher: blue PRO plan badge
- Policies: hide card-title scan-tag badge
- Conversations: KPI sparkline hover tooltips
- Token Savings + Conversations: 24h spark labels read "12:00 PM"
- Requests: KPI chart tooltip matched to CompactSpark
- Security: Total Events tooltip matched to CompactSpark
- Billing: Your plan auto-renew removed, modals widened, helper text 12px
- `formatSparkLabel` — one tooltip date-label format for every chart
- Conversations / Token Savings / Activity KPI rails — dated hover tooltips
- Conversations count sparkline reconciles to the KPI total
- Requests / Security area-chart tooltips matched + dated
- Workspace switcher: real PRO/Free toggle
- Free workspace: `-free` page twins for every unlocked surface
- Sidebar: darker disabled nav-item color
- Requests detail: Findings/Details tabs merged into one view
- Requests detail: provider-error main card
- Detail-card labels unified to 16px
- Gap below the KPI rail is always 24px

### [2026-06-15](./2026-06/changelog-6-15.md)

- Notifications dropdown menu (new)
- Segmented pill: indicator no longer animates on mount
- Sidebar: PRO-feature locks gated to FREE surfaces
- Chrome: Notifications bell button hidden for now
- Buttons: no `lg` anywhere; DateRangePicker default is h-10
- CompactSpark: opt-in hover tooltips
- SearchInput: `elevated` surface for outside-table search bars
- Settings: Notification preferences card, Profile copy, footer + responsive grid
- Settings: Profile field width + Email verification helper
- Settings: split Display name into First / Last name
- Overview (default): swap hero cards + retitle Get started
- Billing: Pro price $29 → $20, drop per-user framing
- Overview (default): rewrite Create-key card body copy
- Settings: hide Notification preferences card
- Feedback FAB: outlined style + shadow-md
- Policies: type-icon colors + alignment, DEFAULT badge, selected border

### [2026-06-13](./2026-06/changelog-6-13.md)

- Route-aware workspace plan badge; switcher moved out of sidebar `[43f278d]`
- Plan-modal copy is state-correct; Pro price fixed to $29 `[bfe6fc1]`

### [2026-06-12](./2026-06/changelog-6-12.md)

- Requests Details tab → three subcards `[a7b5dab]`
- Error UI refinement: Provider context + Error origin row `[c5a01c9]`
- tsconfig path-alias cleanup `[795c342]`

### [2026-06-11](./2026-06/changelog-6-11.md)

- Billing modal split — Free vs Pro instances `[2fe643d]`
- `/billing` — Pro-plan page (`Billing.tsx`)
- `/billing-free` — Free-plan page (`BillingFree.tsx`) `[2fe643d]` + `[2a8d377]`
- Pro modal (`plan-comparison-dialog-pro.tsx`)

### [2026-06-10](./2026-06/changelog-6-10.md)

- AnimatedUpload — new GSAP icon; Export CSV buttons switch to it [85f7d9e] (superseded same day — the GSAP component never reached a commit; net state is the lucide-animated migration below)
- AnimatedSliders — new GSAP icon; Requests Filters button switches to it [85f7d9e] (superseded same day — see lucide-animated migration below)
- Overview default (Get Started) — GSAP icon animations on the two hero CTAs [85f7d9e] (Plus hover-scale on Create key survives; the GSAP Download icon was superseded by DownloadIcon — see migration below)
- lucide-animated migration — GSAP hover icons replaced by vendored motion icons [85f7d9e]
- ExternalLinkIcon — hand-built lucide-animated-style docs icon [85f7d9e]
- API Keys — connect columns hold 50/50 under wide PAYG snippets [85f7d9e]
- Lint gate green — audit finding #1: 29 errors → 0 [02fce0c]
- Audit #3 + #4 — dependency hygiene and route code splitting [02fce0c]
- Ultracite/Biome adopted — formatting + lint now actively enforced [02fce0c]
- Audit #2 — verification baseline: Vitest + GitHub Actions CI [c72f586]
- Audit #8 + #9 + #10 — small fixes, full strict mode, docs refresh [c72f586]

### [2026-06-06 → 06-08](./2026-06/changelog-6-6.md)

- Redacted-by-default Full request + one shared Unredact toggle (06-08) [16598f4]
- Blocked requests are errors, not 2xx (06-08) [5e22c0e]
- Selection is a status-tone outline, never a blue fill (06-08) [5e22c0e, 69d25c5]
- Entity findings name the redaction token, never the raw value (06-08) [6b6643c]
- A caught value never re-appears raw in the transcript (uncommitted)
- MessageBlock — 200px scroll cap, status tone, danger variant (06-08) [db7ba6c, 5e22c0e]
- PiiRightPanel — block-aware "What we did"; Unredact via props (06-08) [16598f4]
- RequestBodyPanel — showRaw redaction of Full request + clipboard (06-08) [16598f4]
- TraceItem — selection outline above the track + clickable affordance (06-08) [5e22c0e, 69d25c5]
- TraceItem — node color keys off guardrail status, not latency (uncommitted)
- Overview hero — new "Download Gate Connect" modal (Figma 514:42) (06-08) (uncommitted)
- Requests / Conversations — credentials surfaced once, keys redacted everywhere (06-08) [16598f4]
- Security events — credential leak listed under its PII event (06-08) (uncommitted)
- Token Savings — Overview + Savings options sections, KPI sparklines (06-08) [9dbf5b5]
- Conversations trace — Findings-only + Errors tabs built (06-08) [db7ba6c, 5e22c0e]
- Requests — injection req_18039f flipped to Flag (06-08) [6b6643c]
- Limits — Threshold / Used cells right-aligned (06-08) [9dbf5b5]
- Security event detail — Message box 200px scroll cap (06-08) [6b6643c]
- Conversations trace — redacted transcript + status-true node colors (uncommitted)

### [2026-06-05](./2026-06/changelog-6-5.md)

- Findings reconcile to one source; values are detector-accurate (uncommitted)
- TraceItem — finding chip replaces the warn-only badge (uncommitted)
- Requests + Conversations — recent window is one scripted conversation (uncommitted)
- Conversations — finding count includes blocks + View Request resolves (uncommitted)
- Conversations — detail + list derive from one per-conversation source (uncommitted)

### [changelog-6-4.md](./2026-06/changelog-6-4.md)

- Design-engineering audit pass · [6915f47]
- Focus-ring standard — `ring-3 ring-ring/50` · [fe0f43e]
- Action color — 2-tier severity (red / amber) · [5a00d8b]
- Concentric card radius (24 → 16 → 8 → 4) · [9d4e590]
- Titles above the card, never inside · [480633e · 9d4e590]
- Badges (`ui/badge.tsx`) · [5e8cbf0]
- Buttons (`ui/button.tsx`, `ui/icon-action-button.tsx`) · [f31a350]
- Code card (`ui/code-card.tsx`) · [fe0f43e]
- Copy button (`ui/copy-button.tsx`) · [1c3e4f9]
- Dialog (`ui/dialog.tsx`) · [5e8cbf0]
- Dropdowns (`ui/select.tsx`, `ui/popover.tsx`, `ui/menu.tsx`, `ui/date-range-picker.tsx`) · [f31a350]
- Field (`ui/field.tsx`) · [fe0f43e]
- RowActionButton (`ui/row-action-button.tsx`) · [5e8cbf0]
- Tables (`ui/table.tsx`, `hooks/use-table-sort.ts`) · [6d5e3e6]
- Tabs (`ui/tabs.tsx`) · [f31a350]
- Conversations — "Findings only" tab built out (`Conversations.tsx` → `ConversationDetailBody`) · (uncommitted)
- Requests — Full request code window scroll cap (`Requests.tsx` → `BodySection`) · [6915f47]
- Rams review batch — page-level fixes + GetStarted removal · [fe0f43e]
- Requests Filters modal — model icons + label-click fix (`Requests.tsx`) · [8431bd4]
- Conversations — model-filter icons + sortable Models column (`Conversations.tsx`) · [2ab3a47]
- Security event modal (`Security.tsx` → `ThreatEventDetailBody`) · [5a00d8b]
- Requests findings modal — Unredact default + model icon (`Requests.tsx` → `PiiRightPanel`) · [5a00d8b]
- Requests detail — Details tab merged + titles unified (`Requests.tsx`) · [5e8cbf0 · 9d4e590]
- Requests Findings page — `/requests-findings/:requestId` (`RequestsFindings.tsx`, `App.tsx`) · [5e8cbf0]
- Requests Findings modal v2 — full redesign (`Requests.tsx`, `ui/code-card.tsx`) · [480633e · a2e6fd0]
- Requests findings — a11y + perf polish (Rams review) (`Requests.tsx`, `DashboardChrome.tsx`) · [5e8cbf0 · f31a350]
