# Bundle split: make the first load lean

Status: PLAN, not started. Baseline measured 2026-09-04 at `9d6b526`.
Rule: measure before and after every step with the same command; a step
ships only if its number moves. No UI change is allowed by any step.

## Baseline (what the browser loads today)

Every dashboard page loads three chunks before it can paint, then its own
page chunk. The chart chunk joins on any page with a Recharts element
(Overview, Activity, Security, Messages, team Overview).

| Chunk | Shipped | Gzip | Loaded on |
| --- | --- | --- | --- |
| `index` | 334 KB | 107 KB | every page |
| `DashboardChrome` | 755 KB | 219 KB | every dashboard page |
| `compact-kpi` (Recharts) | 348 KB | 101 KB | every page with a chart |
| `request-bodies` | 425 KB | 115 KB | Messages, Conversations, Findings |
| all JS | 2,680 KB | 777 KB | |

Overview first load today: index + chrome + charts = 1,437 KB, 427 KB gzip.

### What is inside the two shared chunks (sourcemap attribution)

`DashboardChrome` (2,450 KB of source):

| Source | KB | Why it is in the chrome |
| --- | --- | --- |
| `@base-ui/react` + utils | 510 | primitives, legitimately shared |
| `motion-dom` + `framer-motion` | 443 | 12 animated sidebar / toolbar icons in `components/ui/*.tsx` |
| `data/requests.ts` | 168 | `notifications-menu` -> `data/notifications` -> `data/requests` |
| micromark, mdast, unified, remark | ~240 | `ask-ai-panel` -> `react-markdown` |
| `data/models.ts` | 55 | `teams-store` -> `data/teams` -> `data/models` |
| `pages/activity-data.ts` | 50 | same notifications chain |
| `lib/dotmatrix-core.tsx` | 46 | Ask AI thinking row animation |

`index` (937 KB of source): `react-dom` 532, `gsap` 267 (`AuthLayout` is an
eager import in `App.tsx`; both plan-comparison dialogs also use it), `sonner`
64, `App.tsx` 16.

The `request-bodies` chunk is NOT duplicated. The transcript-like strings seen
in the chrome chunk are the seven >2 KB `evidence` literals inside
`data/requests.ts` (51 KB), which rides the notifications chain.

## Steps, in payoff order

Each step names the file, the change, the expected saving (source KB from
the table above, shipped roughly 0.3x for code and 0.9x for string data),
and the acceptance number. Do them one at a time, measure, commit.

### 1. Lazy-load the notifications menu body

`components/ui/notifications-menu.tsx` imports `data/notifications`, which
imports `data/requests`, `data/api-keys`, `data/billing-history`,
`data/team-members`, and via those `activity-data` and `models`. The bell
button and its unread count must stay eager; the dropdown CONTENT (the list)
becomes `React.lazy` behind the menu's open state, in its own module.

- Watch: the unread badge count today derives from the same seed. Keep a
  tiny eager `notifications-count.ts` that imports only what the count needs
  (or precompute the count as a constant, single-sourced from the seed with a
  test pinning it).
- Expected: chrome loses ~270 KB source (requests, activity-data, models,
  api-keys, billing-history), about 200 KB shipped, ~50 KB gzip.
- Accept: `DashboardChrome` gzip <= 170 KB, `grep -c 'Check our handoff'`
  on the chrome chunk = 0.

### 2. Lazy-load the Ask AI panel

`layouts/DashboardChrome.tsx` imports `ask-ai-panel` eagerly; the panel is
closed by default. Wrap it in `React.lazy` + `Suspense` and render it only
once `askAiOpen` has been true at least once (keep it mounted after that so
the thread survives close / reopen). This takes `react-markdown` and its
whole remark / micromark tree, plus `dotmatrix-core` and `dotmatrix-hooks`,
out of the chrome.

- Expected: ~290 KB source, ~110 KB shipped, ~35 KB gzip off the chrome.
- Accept: `grep -c micromark` on the chrome chunk = 0.
- `AskAiThreadProvider` in `App.tsx` stays eager (13 KB); only the panel
  moves.

### 3. Framer Motion: `LazyMotion` + `m` components

The 12 animated icon components (`bell`, `download`, `refresh-cw`,
`sliders-horizontal`, `square-arrow-up`, `receipt`, `logout`, `sparkles`,
`external-link`, `calendar-days`, `upload`, `credit-card`) each import
`motion` from `framer-motion`, which pulls the full 443 KB runtime into the
chrome. Framer's documented fix: import `m` instead of `motion`, wrap the
chrome once in `<LazyMotion features={domAnimation} strict>`, and the runtime
shrinks to its ~5 KB core plus the feature bundle loaded once.

- Mechanical: `motion.` -> `m.` in the 12 files, one `LazyMotion` in
  `DashboardChrome.tsx`. `strict` makes any leftover `motion.` throw in dev.
- Expected: ~100 KB shipped, ~30 KB gzip off the chrome.
- Accept: chrome gzip drops by >= 25 KB versus after step 2.
- Alternative if `LazyMotion` misbehaves: the icons animate on hover only;
  CSS keyframes would remove the dependency from the chrome entirely. Bigger
  change, needs front-end-developer.

### 4. Move gsap off the first load

`AuthLayout` is one of only two eager page-level imports in `App.tsx` (the
other is the Ask AI provider). Make `AuthLayout` `lazy` like the other 61
routes. gsap then loads only on `/login`-style routes and inside the two
plan-comparison dialogs, which are already inside lazy pages.

- Expected: ~90 KB shipped, ~30 KB gzip off `index`.
- Accept: `grep -c gsap` on the `index` chunk = 0; `index` gzip <= 80 KB.

### 5. Messages table preview without the 425 KB blob

`pages/requests/message-preview.ts` imports `data/request-bodies` to show
the first line of each message in the table. That makes the Messages page
and Conversations list pull 425 KB (115 KB gzip) that the detail pages
actually need. Generate a `request-previews.ts` at build time (or once, via a
script, checked in): `Record<requestRowId, string>` holding only the masked
first line per row, ~153 rows x ~120 bytes = ~20 KB. `messagePreview()` reads
that; `RequestDetailBody` and `ConversationDetail` keep the full blob.

- Guard: the preview must still run through `redactFindings` at generation
  time so masked PII never lands in the small file. Pin with the existing
  `message-preview.test.ts` cases.
- Expected: Messages and Conversations first load drop 115 KB gzip.
- Accept: the `request-bodies` chunk is absent from the network on
  `/messages` and `/conversations`, present on `/messages-findings/:id`.

### 6. Investigate, do not change yet

- `@base-ui/react` 510 KB source in the chrome: imports already use subpaths
  (`@base-ui/react/menu` etc.), so this is real usage across the primitives.
  Nothing cheap here. Note only.
- Recharts 671 KB source as its own 348 KB chunk: correct shape. It loads on
  chart pages only. Do not fold into the chrome.
- `react-dom` 532 KB: fixed cost.

## Targets

| Measure | Today | After steps 1-4 | After step 5 |
| --- | --- | --- | --- |
| `DashboardChrome` gzip | 219 KB | ~105 KB | same |
| `index` gzip | 107 KB | ~77 KB | same |
| Overview first load gzip (index + chrome + charts) | 427 KB | ~283 KB | same |
| Messages first load gzip | ~542 KB | ~398 KB | ~283 KB |

Roughly a third off every first paint, half off Messages and Conversations.

## Measurement command (run before and after every step)

```sh
npx vite build --logLevel error
for f in $(ls -S dist/assets/*.js | head -5); do
  printf '%5d KB gz  %s\n' $(( $(gzip -c "$f" | wc -c) / 1024 )) "$(basename $f | cut -d- -f1)"
done
find dist/assets -name '*.js' -exec cat {} + | gzip -c | wc -c
```

Attribution when a number does not move: `npx vite build --sourcemap
--outDir <scratch>` and sum `sourcesContent` lengths per module from the
`.map` files (the script used to build the baseline table above).

## Risks

- Step 1 changes when the notifications seed is evaluated. `localStorage
  notifications.prefs.v1` overrides the seed (tooling gotcha); the lazy body
  must read the store the same way the eager one did.
- Step 2: a `Suspense` fallback inside the docked panel must match the panel
  shell so opening it does not flash. Keep the shell eager, lazy only the
  body.
- Step 3: `LazyMotion strict` throws on any `motion.` left behind, including
  in lazy pages. Grep the whole tree, not just the 12 files.
- Every step: no visual change. Verify by eye once per step on Overview,
  Messages, and the team Overview tab, then trust tsc, lint and the 158
  tests.
