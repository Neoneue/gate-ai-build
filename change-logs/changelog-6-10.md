# UI Changelog: 2026-06-10

Running log of UI changes for 06-10. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior days: [`changelog-6-6.md`](./changelog-6-6.md) (covers 06-06 → 06-08).
Note: the 06-09 commits (`63f5abd`…`bbb1520`, API Keys / Models / Overview
connect-flow rework) were not logged; `git log --since=2026-06-09` + `git show`
is the source for that stretch.

**Using this log to make a change:**

- Each entry is tagged with its commit (`[abc1234]`) or `(uncommitted)`. For a
  committed entry, **`git show <hash>` is the exact diff**.
- This file logs **deltas, not the full contract.** `design.md` is the
  authoritative design system; `data-model.md` is the architecture.
- **Verify** edits with `npx tsc -b` (must exit 0) and the dev server at
  `localhost:3000`.

Organized by **scope**. Filing test: edit one primitive → **Components**; apply a
rule in N places → **Conventions**; rebuild one surface → **Sections**.

---

## Components

### AnimatedUpload — new GSAP icon; Export CSV buttons switch to it [85f7d9e] (superseded same day — the GSAP component never reached a commit; net state is the lucide-animated migration below)

New `src/components/ui/animated-upload.tsx`. Drop-in for lucide's `<Upload>`
(lucide has no literal "export" icon; Upload is the standard export glyph —
same tray as Download, arrow pointing up). Exact structural mirror of
`AnimatedDownload`: pixel-exact lucide v1.14.0 paths, tray static, arrow as one
`<g data-arrow>` group, hover bound to `closest('button, a')`, one-shot per
hover, `prefers-reduced-motion` gated via `gsap.matchMedia()`.

Timeline is the **inversion** of AnimatedDownload's drop: arrow flies **up**
out of the tray + fades (`y: -6`, 0.26s power2.inOut), snaps below
(`y: 6`, invisible), re-enters up to rest with fade (0.28s power2.out).

Swapped onto all three **Export CSV** buttons (these were semantically wrong —
showing a *download* glyph for an export action):

- `src/pages/Requests.tsx:1775`
- `src/pages/Activity.tsx:1121`
- `src/pages/Security.tsx:1014`

`AnimatedDownload` itself is unchanged and still used where download is the
real action (Overview "Download Gate Connect" trigger).

### AnimatedSliders — new GSAP icon; Requests Filters button switches to it [85f7d9e] (superseded same day — see lucide-animated migration below)

New `src/components/ui/animated-sliders.tsx`. Drop-in for lucide's
`<SlidersHorizontal>`. Pixel-exact lucide v1.14.0 paths. Structural mirror of
`AnimatedDownload` / `AnimatedUpload`: same imports (`useRef`, `gsap`,
`useGSAP`, `cn`), same `gsap.matchMedia()` gate, host via
`svg.closest('button, a')`, one-shot timeline `.restart()` on `mouseenter`,
cleanup removes the listener, `useGSAP` with `{ scope: ref }`.

Six track paths are static direct children. Each of the three knobs lives in
its own `<g data-knob-N>` group. On hover the knobs nudge along their tracks
and settle back (directions geometry-constrained by the track gaps):

- Knob 1 (x=14, gap 10→14): x: -2
- Knob 2 (x=8, gap 8→12): x: +2
- Knob 3 (x=16, gap 12→16): x: -2

Timeline: nudge to offset at `duration: 0.22, ease: power2.inOut`, staggered
`0.05` (knob 1, 2, 3); return to rest at `duration: 0.26, ease: power2.out`,
same stagger order.

Swap in `src/pages/Requests.tsx`:

- Removed `SlidersHorizontal` from the lucide named import.
- Added `import { AnimatedSliders } from '@/components/ui/animated-sliders'`.
- Line ~1645: `<SlidersHorizontal data-icon="inline-start" aria-hidden />` →
  `<AnimatedSliders data-icon="inline-start" aria-hidden />`.
- Updated the inline comment on the `filtersOpen` state that referenced the old
  import name.

## Sections

### Overview default (Get Started) — GSAP icon animations on the two hero CTAs [85f7d9e] (Plus hover-scale on Create key survives; the GSAP Download icon was superseded by DownloadIcon — see migration below)

`src/pages/DashboardDefault.tsx`. Swapped the static lucide icons on the two
"Get Started" surface buttons for the existing GSAP drop-in components (both
self-bind hover to their host button via `closest('button,a')`):

- **Read API docs** — was `<ExternalLink>` with CSS `group-hover` translate
  nudge classes; now `<AnimatedExternalLink data-icon="inline-end" aria-hidden
  className="size-4" />` (same component as the top-bar Docs button in
  `DashboardChrome.tsx`). The CSS hover classes were removed; GSAP owns the
  motion.
- **Download Gate Connect** (dialog trigger) — was static `<Download>`; now
  `<AnimatedDownload data-icon="inline-start" aria-hidden className="size-4" />`
  (the Export CSV buttons used this too until they moved to `AnimatedUpload`,
  see Components above).
- Imports: dropped `ExternalLink` from the lucide import (now unused); `Download`
  stays (still used by the per-OS "Download for {label}" buttons inside the
  Gate Connect modal, which were deliberately left static).

### lucide-animated migration — GSAP hover icons replaced by vendored motion icons [85f7d9e]

Supersedes the AnimatedUpload entry above (that component shipped earlier today
and is already deleted again by this change).

- **Library**: [lucide-animated.com](https://lucide-animated.com/) (formerly
  icons.pqoqubbw.dev). No bundled package; each icon is vendored via
  `npx shadcn@latest add "https://lucide-animated.com/r/<slug>.json"`. Adds the
  `motion` dependency (^12.40.0). Registry slugs are mostly lucide kebab names,
  but not always (`logout`, not `log-out`; no `external-link` at all).
- **Vendored components** (all in `src/components/ui/`, each exports
  `<Name>Icon` + imperative `<Name>IconHandle`): `sliders-horizontal`,
  `upload`, `bell`, `logout`, `download`, `calendar-days`, `sparkles`.
- **House patch applied to every vendored file** (deviation from upstream,
  commented in-file): hover binds to
  `closest('[role="menuitem"], button, a')` so the icon animates on **host
  row/button hover**, not only over the icon itself (same contract as the old
  GSAP icons); gated by `prefers-reduced-motion`; skipped entirely when a
  parent attaches the imperative handle. Wrapper div gets `inline-flex` so it
  hugs the svg. `bell.tsx` + `logout.tsx` additionally accept
  `strokeWidth` (default 2). `bell.tsx`'s svg carries `size-auto` so its
  `size={16}` attrs beat the `icon-sm` Button's
  `[&_svg:not([class*='size-'])]:size-3.5` rule (old bell was explicitly 16px).
- **Deleted** (GSAP): `animated-sliders.tsx`, `animated-upload.tsx`,
  `animated-bell.tsx`, `animated-log-out.tsx`, `animated-download.tsx`.
- **Kept at first, replaced later the same day**:
  `animated-external-link.tsx` (no registry equivalent) — see the
  ExternalLinkIcon entry below. `gsap`/`@gsap/react` stay (page-level
  animation still uses them).
- **Call sites swapped** (all pass `size={16}`, keep `data-icon`/`aria-hidden`;
  `data-icon` now sits on the wrapper div — Button's `has-data-[icon=…]`
  padding selectors still match):
  - Requests Filters → `SlidersHorizontalIcon`; Requests/Activity/Security
    Export → `UploadIcon`
  - DashboardChrome notifications → `BellIcon`; user-menu → `LogoutIcon`
  - DashboardDefault "Download Gate Connect" → `DownloadIcon`
  - date-range-picker trigger → `CalendarDaysIcon` (was **static** lucide
    `Calendar`)
  - Billing + Upgrade "Upgrade to Pro" → `SparklesIcon` (was static lucide
    `Sparkles`; `Upgrade.tsx` `cta.icon` type widened from `LucideIcon` to a
    structural `ComponentType`)
- **Verified** in-browser at localhost:3000: rendered sizes match pre-swap
  (Button CSS still drives 14px under small buttons; bell/CTAs at 16px), hover
  animates from the host button/menuitem, logout animates inside the user-menu
  popover. `npx tsc -b` exits 0.

### ExternalLinkIcon — hand-built lucide-animated-style docs icon [85f7d9e]

New `src/components/ui/external-link.tsx`. The lucide-animated registry has
no external-link glyph, so this is hand-built in the exact vendored template
style (same exports, handle interface, house host-hover patch, wrapper div,
`size` prop). Glyph paths are pixel-exact lucide v1.14.0 `<ExternalLink>`.

- **Animation**: arrow group nudges toward the top-right (`x: 2, y: -2`)
  with the same spring as the vendored download/upload icons (stiffness 200,
  damping 10, mass 1). Box static. Deliberately replaces the old GSAP
  "send-off" (fly out top-right + fade + re-enter), which was more
  aggressive than the lucide-animated register.
- **Call sites swapped** (both `size={16}`, CSS still drives rendered size):
  DashboardChrome "Docs" button (sm → 14px, `relative -top-px` nudge kept);
  DashboardDefault "Read API docs" (default → 16px).
- **Deleted**: `animated-external-link.tsx` — the last GSAP icon component.
  All animated icons are now on the motion/lucide-animated template.
- Verified in-browser: hover nudge fires from the host button, no opacity
  change, settles back to rest. `npx tsc -b` exits 0.

### API Keys — connect columns hold 50/50 under wide PAYG snippets [85f7d9e]

The "How to make requests" two-column row (ApiKeys.tsx ~325/339) used
`flex-1` columns without `min-w-0`; flex items default to
`min-width: auto`, so the OpenClaw PAYG code block's long unbreakable lines
inflated the Manual card and squished the Gate Connect card. Added `min-w-0`
to both column divs — the code block's existing `overflow-x-auto` now engages
(~156px horizontal scroll at 1280 container) and the split stays 600/600 across
all tab + BYOK/PAYG combinations. Verified in-browser.

### Lint gate green — audit finding #1: 29 errors → 0 [02fce0c]

Mechanical module-boundary refactor; zero visual changes (all pages
browser-smoke-tested, Merkle dialog verified). `eslint .` and `npx tsc -b`
both exit 0.

- **Dead code deleted** (~190 lines): `HERO_SNIPPETS` (DashboardDefault),
  `CONVERSATION_MESSAGES` + `ASSISTANT_TURN_COUNT` (Conversations, leftovers
  from the pre-06-06 detail implementation), `PROVIDER_ORDER` (vendor-meta);
  `buttonVariants`/`badgeVariants` un-exported (no importers).
- **New shared modules** (extracted, not rewritten):
  `src/data/requests.ts` (requestRowId + findings model + all REQUEST_ROWS_*
  - getEventFindingCopy, ~535 lines out of Requests.tsx — first slice of the
  audit's god-object finding), `src/data/conversations.ts`
  (CONVERSATION_ROWS, SAMPLE_TRACE), `src/data/audit-trail.ts` (NOW mock
  clock, fmtRelative/truncateHex — previously DUPLICATED in AuditTrail +
  AuditTrailMerkle — uuid/hex, EVENT_ROWS, KIND_BADGE_VARIANT),
  `src/components/icons/vendor-avatar.tsx` (VendorAvatar + MarketplaceAvatar
  moved out so vendor-meta.tsx is data-only),
  `src/hooks/use-copy-feedback.ts`, `src/lib/portal-target-context.ts`;
  `randomHex` → lib/utils, `linesToString` → lib/formatters.
- **Types stay with their pages** (RequestRow, ConversationRow, EventRow…);
  data modules import them type-only, so no runtime cycles. The old
  Requests↔Conversations value-import cycle is gone.
- **Real fixes**: App.tsx redundant sync setState in the narrow-viewport
  effect removed (initializer already seeds it); DashboardDefault
  `useMemo(() => detectPlatform(), [])`; Conversations list pipeline
  (viewRows/filteredRows) properly memoized. The two intentionally disabled
  `{false && …}` blocks (Conversations footer Copy ID, ConversationsTrace
  header) keep explicit eslint-disable directives instead of deletion.
- Fast refresh now works in every previously-violating file (pages no longer
  full-reload when editing components).

### Audit #3 + #4 — dependency hygiene and route code splitting [02fce0c]

Zero visual changes; all routes browser-verified after both.

- **Dependencies** (audit finding #3): `npm audit` now reports **0
  vulnerabilities** (was 6, incl. 1 high). `shadcn` moved to
  devDependencies and bumped ^4.6.0 → ^4.11.0 (its MCP-SDK chain carried
  every advisory; the `index.css` tailwind import still resolves at build
  time); unused `next-themes` removed; `npm audit fix` cleared a
  brace-expansion moderate.
- **Code splitting** (audit finding #4): all 27 page imports in `App.tsx`
  converted to `React.lazy` (named-export `.then` mapping) behind one
  `<Suspense fallback={null}>` around `<Routes>`. Build went from a single
  1,884 KB chunk to 88 chunks — largest now 354 KB (shared recharts chunk),
  entry 314 KB; Vite's 500 kB warning is gone. Pages load their chunk on
  first visit.

### Ultracite/Biome adopted — formatting + lint now actively enforced [02fce0c]

`npx ultracite init` (Biome 2.4 + ultracite preset). One-time
`ultracite fix` reformatted ~134 files (whitespace/style only; tsc, eslint,
build, and browser all verified green after). Baseline went 3,137 → 0 Biome
errors.

- **Enforcement layers** (the point of the exercise):
  `npm run lint` = `eslint . && ultracite check` (one-command gate);
  husky pre-commit runs lint-staged (`ultracite fix` + `eslint --fix
  --max-warnings=0` on staged files); `.claude/settings.json` PostToolUse
  hook auto-runs `npm run fix` after every agent Write/Edit. CI remains
  audit finding #2.
- **biome.jsonc tuning**: ultracite preset kept for formatting +
  correctness/suspicious rules; ~30 opinion rules disabled with rationale in
  the config (nested ternaries, type-vs-interface, filename convention, etc.);
  the a11y rule batch is parked for a dedicated /rams pass, not rejected.
  src/index.css excluded (Tailwind v4 syntax breaks Biome's CSS parser).
- **Real fixes shaken out**: `==` → `===` (field.tsx); rangeStore forEach
  callbacks no longer leak return values; `dampedClamp` hoisted to module
  scope in AuditRecordDialogMerkle (was an unstable effect dep); 4 no-op
  `onClick={() => {}}` placeholders dropped from the unwired Verify/Export
  buttons; tsconfigs gained `strictNullChecks` (init added it — tsc already
  passed, so it stays; chunk of audit #9 for free).
- **Intent change**: Biome's unsafe fix deleted the two `{false && …}`
  disabled-UI blocks (Conversations footer Copy ID, ConversationsTrace header
  Copy). Both linters flagged them; the husks were removed entirely.
  Recoverable from git history (committed at 85f7d9e) if ever wanted.
- ESLint stays for the react-hooks rule set Biome doesn't replicate.

### Audit #2 — verification baseline: Vitest + GitHub Actions CI [c72f586]

Non-UI. `npm test` = `vitest run` (vitest.config.ts, node env, @ alias);
29 tests in 5 files, all pure logic — no component/snapshot tests:

- `use-table-sort.test.ts` — parseNumeric formats, sortRows contracts
  (nulls last in BOTH directions, numeric-aware string compare, no mutation)
- `data/requests.test.ts` — requestRowId determinism + fallback, finding
  categories closed set, RECENT ⊆ ALL by row identity, getEventFindingCopy
- `data/audit-trail.test.ts` — fmtRelative buckets + future-clamp,
  truncateHex, EVENT_ROWS id uniqueness / ≤ NOW / badge-variant coverage
- `pages/activity-data.test.ts` — THE charts-must-reconcile contract:
  SPEND_TOTALS_7D and TOKENS_TOTALS_7D sum to TOTAL_7D_BASE_* in every
  dimension (passed unmodified — the discipline held); distributeSeries
  sums exactly + deterministic seeding. This also discharges audit
  finding #7 (mock-data invariants unenforced).
- `lib/formatters.test.ts` — linesToString, formatNumber/Currency, randomHex

CI: `.github/workflows/ci.yml` — push/PR on dev + main, Node 22, npm ci,
then lint (eslint + biome) → test → build (tsc -b + vite). Closes the
`--no-verify` bypass gap left by pre-commit-only enforcement.

### Audit #8 + #9 + #10 — small fixes, full strict mode, docs refresh [c72f586]

- **#8 correctness bundle**: clipboard copy failures now surface a
  `toast.error` instead of silently doing nothing (use-copy-feedback);
  chart.tsx tooltip/legend keys use `item.dataKey` instead of array index;
  the Read-API-docs `window.open` gained `noopener,noreferrer`. Tooltip
  verified in-browser (multi-series, no key warnings).
- **#9 strict mode**: `"strict": true` in all three tsconfigs — tsc passes
  with ZERO new errors (strictNullChecks yesterday's hard part; the rest was
  already clean).
- **#10 docs refresh**: README routes table rewritten — all 27 routes grouped
  (core / detail / tier variants / auth) + deep-link params, was 8 rows.
  data-model.md: default route corrected (/overview, was /requests), new
  "Tier & onboarding variants" section (\*Default/\*Free naming contract,
  locked flag, gating asymmetry), §5 notes the 2026-06-10 src/data extraction
  - corrected import contracts (audit-trail/conversations/requests module
  owners), §6 gains a brief variant-pages inventory.

---

## Non-UI, same day

- Vendored the shadcn/improve audit skill (`.agents/skills/improve`,
  Claude Code symlink, `skills-lock.json`) [713c96e]. Ran a full /improve
  audit; vetted findings parked in `docs/improve-audit-2026-06-10.md`
  (gitignored) — plans phase deferred.
