# Audit fixes — working checklist

Consolidated from two audits run on **2026-07-27** against commit `ef1af47`:

- **`/rams`** — accessibility + visual design, 14 main pages / 16,175 lines.
- **`/improve`** — full nine-category codebase audit, 4 parallel auditors, every
  finding re-verified against the code before landing here.

Every item below was confirmed by opening the cited code. Numbers in brackets
are the finding IDs used in `plans/README.md`, kept stable for traceability.

**Status key:** `[ ]` open · `[x]` done · `[~]` in progress

**Ground rules while working these:**

- UI/visual work routes to the `front-end-developer` subagent (see `CLAUDE.md`).
- Work on `dev`. Never commit to `main`.
- `npm run lint && npm test && npm run build` must pass before any promotion.
- The design-token guard now blocks at commit time on `.ts`/`.tsx`/`.css`.

---

## Done

- [x] **[rams-1] Overview chart dimension `Select` had no accessible name.**
  `Dashboard.tsx:437` — added `aria-label="Chart dimension"`, parallel to the
  sibling `SegmentedPill`'s `"Chart metric"`. WCAG 4.1.2. — `2d39b5a`
- [x] **[rams-2] Policies check bullet off the 4px grid.** `Policies.tsx:412`
  — dropped `mt-0.5` (2px) for `items-center` on the `<li>`, matching the
  canonical `BenefitList` in `TokenSavings.tsx:570`. — `2d39b5a`
- [x] **[rams-3] Policies check bullet tone mismatch.** `Policies.tsx:413` —
  `bg-blue-200 text-blue-800` → `bg-blue-100 text-blue-700`, matching
  `TokenSavings.tsx:724` and `design.md:319` `badge-info`. — `2d39b5a`
- [x] **[14] Design-token guard on pre-commit, markdown lint in CI.**
  Guard accepts file paths; markdown deliberately NOT on pre-commit; ignores
  gained `docs/**`, `plans/**`, `handoff.md`; 9 tracked violations fixed.
  See `plans/001-design-token-and-markdown-gates.md`. — `c6c30b3`..`fa8e937`

---

## P1 — demo-integrity bugs

Wrong numbers a viewer can see. All Small, all LOW risk, all HIGH confidence.
These are the highest-value items on the list.

- [ ] **[1] Requests hero chart bars do not sum to the hero KPI.**
  - Evidence: `src/pages/requests/hero-data.ts:51` rounds each bucket
    independently with no largest-remainder pass; the floor pass at `:61-76`
    can add units without removing them.
  - Verified by executing the real module: **24h declared 48 / bars 44** ·
    7d 468/461 · 30d 2248/2247 · All 4860/4856. All four ranges wrong.
  - Fix: the correct helper already exists twice —
    `src/pages/security/events-data.ts:227` `normalizeSparkTo` and
    `src/pages/activity-data.ts:444` `distributeSeries`. Lift one to
    `src/lib/` and call it from `makeHeroBuckets`.
  - Land [6a] in the same commit.
  - Effort S · Risk LOW

- [ ] **[2] Dashboard contradicts the Conversations page on all 5 visible rows.**
  - Evidence: `src/pages/Dashboard.tsx:763` renders raw `CONVERSATION_ROWS`
    seeds; `src/pages/Conversations.tsx:423` renders
    `getConversationView(seed, REQUEST_ROWS_ALL)` derived values.
  - Verified deltas (seed → derived): reqs `101→102`, `7→5`, `11→6`, `4→10`,
    `38→9`; turns `18→9` on the last. The Dashboard row navigates to the page
    that disagrees with it.
  - Fix: `CONVERSATION_ROWS.slice(0,5).map(s => getConversationView(s, REQUEST_ROWS_ALL))`.
    Then decide whether the seed `reqs`/`turns`/token fields should exist at
    all, since they are now write-only inputs to a clamp.
  - Land [6c] in the same commit.
  - Effort S · Risk LOW

- [ ] **[3] Conversations pagination is decorative.**
  - Evidence: `src/pages/Conversations.tsx:442` `visibleRows` is never sliced;
    `:623` maps it in full. `page`/`rowsPerPage` (`:417-418`) are write-only.
    Footer advertises up to 850 rows over 8; clicking page 2 does nothing.
  - Also: `:291` hardcodes `100` while `CONVERSATIONS_TOTAL = 100` sits at
    `:357` with a comment claiming it prevents exactly this desync.
  - Fix: copy the scope-key paging pattern from
    `src/pages/requests/RequestsTable.tsx:202-209`, slice before mapping, and
    hoist `CONVERSATIONS_TOTAL` above the KPI rail so `:291` reads it.
  - No page reset on filter change either — see [12].
  - Effort S · Risk LOW

- [ ] **[4] `daysInRange` off-by-one inflates every custom range.**
  - Evidence: `src/lib/range.ts:36` adds `+1` to a rounded millisecond span,
    but the picker defaults are `fromTime "00:00"` / `toTime "23:55"`
    (`src/components/ui/date-range-picker.tsx:126-127`), so the span is
    already inclusive. Jan 1 → Jan 7 yields **8**. A single-day range reports
    2/7 instead of 1/7, i.e. **100% high**.
  - Blast radius: feeds `effectiveScale` (`range.ts:40`), which multiplies
    nearly every KPI on Activity, Conversations and Security. They all drift
    together, which is why it looks consistent and nobody caught it.
  - Fix: normalize both ends to local midnight before differencing, then `+1`.
    Preserve same-day → 1.
  - Land [6e] in the same commit.
  - Effort S · Risk LOW

---

## P1 — tests that lock the above

Only 5 test suites exist for ~46,000 lines. Existing quality is good (real
invariants, no mocks, deterministic clocks); placement is the problem.
`vitest.config.ts` is `environment: "node"`, so pure-module tests are the cheap
path and component tests are not. Lean into that.

Model all of these on `src/pages/activity-data.test.ts`.

- [ ] **[6a] `hero-data.test.ts`** — assert `sum(HERO_VIEWS[r].data) === HERO_VIEWS[r].total`
  and `success + errors === total` for all four ranges, plus
  `buildCustomHeroView` (`hero-data.ts:296`). ~30 lines. Catches [1] forever.
- [ ] **[6b] `events-data.test.ts`** — `EVENTS_RANGE_TOTAL` must equal
  `0.25 × HERO_VIEWS[range].total`. That contract exists **only as a prose
  comment** at `events-data.ts:27-33` ("Do not hand-edit one without the
  other"). It currently holds (12/117/562/1215). Freeze it before it drifts.
  Also cover `splitEventMix` (`:90`) and `attackTypeCounts` (`:117`).
- [ ] **[6c] `conversationDetail.test.ts`** — assert
  `view.reqs === getConversationRequests(id, REQUEST_ROWS_ALL).length` and
  token sums, for every seed. ~15 lines. Would have caught [2].
- [ ] **[6d] `requests/data.test.ts`** — `requestSortValue` (`:44`) and
  `rowTimeValue` (`:31`). The latter composes a monotonic key from `"May 12"`
  + `"02:04:11"` with **no year and a 31-day month stride**: correct for the
  current Mar-May fixtures, silently wrong the moment a Dec/Jan row lands.
  `sortRows` is tested but its key extractor is not.
- [ ] **[6e] `range.test.ts`** — pin single-day → 1 and Jan 1→Jan 7 → 7. 10 lines.
- [ ] **[6f] `plan.test.ts`** — parity between `FREE_TWINS`/`DEFAULT_TWINS`
  (`src/lib/plan.ts:20-53`) and the route table in `src/App.tsx`. A base
  missing from either set silently dumps the user on `/overview-free`.
  Currently correct; this is a regression lock.

**Explicitly not worth doing:** adding jsdom + Testing Library to smoke-render
the pages. Their churn is deliberate visual iteration; those tests get deleted.

---

## P2 — performance

- [ ] **[5] 432 KB of mock transcripts ship to the `/conversations` list route.**
  - Chain: `src/pages/Conversations.tsx:36` → `src/data/conversationDetail.ts:15`
    → `src/data/request-bodies.ts` (440,394 bytes on disk; emits
    **432 KB raw / 116 KB gzip**), used at `conversationDetail.ts:191,198`
    only to compute a `.some()` boolean and per-row preview text.
  - Combined `/conversations` payload measured at **456 KB gzip**.
  - Fix: split a small `request-body-index.ts` (per-row `hasUserMessage`,
    truncated preview) and keep full transcripts behind
    `await import("@/data/request-bodies")`, reached only from the detail panel.
  - Effort M · Risk MED (`getConversationView` is sync inside a `useMemo`;
    needs Suspense or precomputed fields)

- [ ] **[7] GSAP ships in the entry chunk for a sign-in-only animation.**
  - `src/App.tsx:10` statically imports `AuthLayout` while all 52 routes are
    lazy. `src/layouts/AuthLayout.tsx:1-9` registers GSAP + SplitText +
    ScrambleText at module scope, so it is unshakeable.
  - Cost: ~25-35 KB gzip on every authenticated route.
  - Fix: `lazy()` it like the other 52.
  - Effort S · Risk LOW

- [ ] **[15] No `manualChunks`, no bundle size budget.**
  - `vite.config.ts:6-13` is plugins + alias only. React/router/app code/GSAP
    are welded into one ~107 KB gzip entry, so any app change busts the whole
    vendor cache. Nothing fails when a chunk balloons, so **[5] can silently
    regress after being fixed**.
  - Fix: `vendor-react` + `vendor-charts` split, `chunkSizeWarningLimit`, and
    a CI step failing on a committed budget.
  - Effort S · Risk LOW

- [ ] **[16] `react-router` HIGH advisory, `fixAvailable: true`.**
  - No exploit path here: no SSR, and every `navigate()` argument is a template
    over static mock data. Semver-compatible, so `npm audit fix` clears it.
  - Free hygiene, not a security finding.
  - Effort S · Risk LOW

- [ ] *(unranked, MED confidence)* **Narrow the recharts barrel.**
  `src/components/ui/chart.tsx:3` is `import * as RechartsPrimitive` but only
  dereferences `ResponsiveContainer` (`:50`). The emitted chart chunk still
  contains `ScatterChart`, `Brush`, `ComposedChart`, none of which the app
  uses. Swap to a named import and diff the build; if the dead components
  persist it is an upstream recharts limitation and this closes.

---

## P2 — correctness and security

- [ ] **[9] `App.tsx` localStorage is unguarded at 6 sites.**
  - `src/App.tsx:213,219,223,231,236,240`. Every other storage site in the repo
    is wrapped — `src/hooks/use-theme.tsx:28-34`, `index.html:9-22`,
    `src/pages/Billing.tsx:172-196`.
  - In Safari private browsing and partitioned-storage iframes these throw
    `SecurityError`. A throw from the `Layout` `useState` initializer has **no
    error boundary above it**, so the whole app renders blank.
  - Fix: extract the guarded helpers into `src/lib/storage.ts`, use at all six.
  - Effort S · Risk LOW

- [ ] **[10] No security response headers.**
  - `vercel.json` is a single rewrite rule, no `headers` block. No
    `frame-ancestors`/`X-Frame-Options` (framable, clickjackable), no CSP, no
    `nosniff`. This is the only server-side control a backend-less SPA has.
  - Fix: add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`, and a
    `Content-Security-Policy-Report-Only` first.
  - Note: a CSP will break the inline theme script in `index.html` and
    Tailwind v4 runtime style injection unless the script gets a hash and
    `style-src` allows inline. Ship report-only, promote once clean.
  - Effort S · Risk LOW-MED

---

## P3 — tech debt and docs

- [ ] **[8] ~1,000 lines of dead code.**
  - `src/pages/security-feed.ts` — **829 lines**, export `SECURITY_FEED` has
    zero importers anywhere in `src/`. It is a 48-event fixture that will rot
    out of sync with `src/pages/security-data.ts` and reads as a second source
    of truth to anyone grepping for security events. Delete this first.
  - `src/components/canvas/Artboard.tsx` — 166 lines, zero importers.
  - Also unreferenced: `chartSlot`/`ChartSlot` (`src/lib/chart-palette.ts:36,43`),
    `HorizontalLegend` (`Dashboard.tsx:408`), `SetupBackLink`
    (`onboarding-shared.tsx:122`), `FREE_SURFACE`/`isNonProSurface`
    (`src/lib/plan.ts:4,16`). The last two are worse than unused: their doc
    comments assert contracts the codebase does not follow.
  - `tsc -b` and the build prove reachability; nothing here is dynamic.
  - Effort S · Risk LOW

- [ ] **[11] Free/Pro twin drift that is bugs, not tier differences.**
  - `Billing.tsx` vs `BillingFree.tsx`: `type-copy-12` ×4 vs ×0 on the same
    four validation strings; grid breaks at `min-[480px]` vs `md`;
    `text-right` ×2 vs ×0.
  - `Limits.tsx` vs `LimitsFree.tsx`: `text-right` ×4 vs ×2 on identical
    numeric cells. Only 39 differing lines total, so the drift is clearly
    unintentional.
  - Fix: align each pair, then lift the byte-identical add-credits dialog into
    `src/pages/billing/AddCreditsDialog.tsx` so the next token change can only
    be applied once. **Do not collapse the twins** — they are deliberate.
  - Effort S (fixes) / M (extraction) · Risk LOW
  - Route via the front-end agent.

- [ ] **[12] Table scaffolding has diverged 2-of-4.**
  - Page reset on filter change: present in `Activity.tsx:771-776` and
    `security/EventsTable.tsx:148-153`, **absent** in `Conversations.tsx:417`,
    **partial** in `requests/RequestsTable.tsx:150-164` — verified that
    `pageScopeKey` covers only `range`/`customRange`, not `model`, `keyId`,
    `responseFilter`, `guardrailFilter` or `rowsPerPage`. So filtering on
    page 5 of Messages shows an empty table with a populated footer.
  - Row slicing: 3-of-4 slice; Conversations does not (that is [3]).
  - Default page size: `"25"` in three, `"10"` in `Activity.tsx:764`.
  - **Cheap path first:** fix [3] and the `pageScopeKey` omission as two
    independent one-line changes. That captures most of the value.
  - **Then optionally** extract `usePagedTable({ rows, scopeKey })` returning
    `{ page, setPage, perPage, pagedRows, total }`. Scope strictly to
    page/perPage/slice — not filters, not sort.
  - Effort S (gaps) / M (extraction) · Risk MED for the extraction

- [ ] **[13] README route table is wrong.**
  - Documents `/requests`, which does not exist and hits the `path="*"`
    catch-all redirect. The string `/messages` appears **nowhere** in the
    README, though it is the real route (`App.tsx:276`). Also documents
    `?open=` for Requests, which is now a full page, and lists 7 of 33 tier
    variant routes.
  - A stale route table is worse than none: the failure looks like a broken
    page, not a wrong doc.
  - Fix: correct against `src/App.tsx:259-338`, or generate the block from the
    route table and gate it in CI.
  - Effort S · Risk LOW

---

## Direction — product decisions, not defects

Not ranked against the bugs. Each needs a call from you before any code.

- [ ] **Tier-gating is a routing skeleton.** All 14 routes have both twins and
  `plan.ts` maps them all, but **10 of 14 Free twins are 5-8 line verbatim
  re-exports of the Pro page** (`TeamFree.tsx:5` returns `<Team />`, etc.).
  Only `LimitsFree` (674 lines) and `BillingFree` (790) are real forks;
  `PoliciesFree`/`TokenSavingsFree` use a `variant`/`plan` prop. Demo "Free",
  click Team or Models, and you get the full Pro product with no lock —
  contradicting the sidebar lock icons. Three options: (a) Free = Pro-with-locks,
  cheapest and matches what the sidebar implies; (b) per-page variants via the
  proven prop pattern; (c) shrink the story to the 4 pages where it lands.
  **Decide the pattern before differentiating ten more pages** — `Models.tsx`
  (1667 lines) and `Activity.tsx` (1021) would be catastrophic to fork.

- [ ] **Export is promised four times and cannot happen once.** "Export CSV"
  with no `onClick` at `AuditTrail.tsx:441`, `Activity.tsx:849`,
  `security/EventsTable.tsx:263`, `requests/RequestsTable.tsx:399`, plus an
  unwired "Copy proof JSON" in `AuditRecordDialog.tsx:137` sitting next to a
  wired sibling. Zero CSV/Blob/download helpers exist anywhere in `src/`.
  One `src/lib/export-csv.ts` plus five call sites removes four visible dead
  ends, and `PRODUCT.md` names auditability as the point. Cheapest credible
  win on this list.

- [ ] **Ask AI is a remembered, layout-shifting empty column.**
  `src/components/ui/ask-ai-panel.tsx:63` is a bare
  `<div className="min-h-0 flex-1 overflow-y-auto" />`. Two of three controls
  are explicitly unwired, yet it persists to `localStorage("askai")`
  (`App.tsx:233-241`) and drives a dedicated responsive rule
  (`DashboardChrome.tsx:122`). It is also the only cross-surface entry point
  ever designed — no command palette, no global search. Either spike 6-10
  canned Q→A pairs over the existing mock data, or delete it and the key.

- [ ] **Security events are the one entity without a drill-in.**
  `Security.tsx:557` says row-click is a placeholder. Requests get a route,
  conversations get a route, audit records get a dialog. The join is already
  modeled (`EventsTable.tsx:547` navigates to the request) and the detail
  content is already specified in comments at `Security.tsx:561-568`.
  `AuditRecordDialog.tsx` is a working template. Add pagination while there —
  it is the only listing page without it.

- [ ] **Two orphan routes.** `/upgrade` is built and reachable only by typed
  URL; `pro-upgrade-card.tsx:26` routes past it to `/billing`. `/events-default`
  is a legacy alias for `/security-default`, and the README documents the dead
  one. Wire or delete.

---

## Considered and rejected — do not re-audit

Full list with rationale in `plans/README.md`. Headlines:

- `?open=` modal artifacts are **not** dead code (reachable from live
  `navigate()` in `Dashboard.tsx:783,835`).
- The AWS key at `src/data/requests.ts:871` is detector fixture data, not a
  credential — though it may trip secret scanners.
- `dangerouslySetInnerHTML` at `chart.tsx:94` takes static theme config.
- All 41 listener/timer sites have correct cleanup parity.
- Zero `@ts-ignore` / `as any` in `src/`.
- Memoization in the big tables is already correct.
- Naive "consolidate the twins" — the twins are intentional.

## Not audited

`public/` assets, the gitignored `docs/` folder, and runtime behavior in a
browser. Visual/a11y was covered by the `/rams` pass whose three findings are
in the Done section.
