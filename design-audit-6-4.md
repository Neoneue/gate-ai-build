# Design-Engineering Audit — 2026-06-04

Full-site audit (103 files: 30 pages, 66 UI components, 5 icons/canvas, 2 layouts)
run through three design-engineering lenses:

- **make-interfaces-feel-better** (concentric radius, optical alignment, shadows,
  tabular-nums, text-wrap, hit areas, scale-on-press, `transition: all`)
- **emil-design-eng** (animation decision framework, easing curves, durations,
  spring/gesture physics, interruptibility, transform-origin, perf)
- **web-design-guidelines** (Vercel WIG — a11y, focus, forms, typography, content
  handling, images, performance, overscroll)

## How to use this doc

Findings are graded **P1** (clear defect), **P2** (clear improvement), **P3**
(nit). Each gives `file:line`, the principle, and a Before → After. Settled
project conventions were excluded as non-findings: `active:scale-[0.99]` press,
`--ease-out` token (= emil's curve), Base UI managed a11y / `--transform-origin`,
`border-border` + `shadow-xs`, 32px control heights, 8px-layout / 4px-component
grid, concentric radius, Geist (no opsz), mock-data form exemptions.

**Tally:** 1 P1 (latent), ~47 P2, ~84 P3. The codebase scored well — `tabular-nums`,
curly quotes, `…`, explicit transition properties, `motion-reduce` gating,
`min-w-0`, `--transform-origin`, `data-closed:fill-mode-forwards`, concentric
radius, and `active:scale-[0.99]` were all consistently correct.

Resolved during the audit (not open): `HeroNumeric` (`hero-numeric.tsx:23`) and
`CompactKpi` both bake in `tabular-nums`, so `KpiTile`/`CompactKpi`/`HeroNumeric`
numeric values are fine — the "verify KPI tabular-nums" flags are closed.

---

## P1 — defect

### sparkline.tsx — empty / single-point array produces broken SVG (LATENT)

`sparkline.tsx:31,34` — `Math.max(...points)` returns `-Infinity` on an empty
array and `step = (w - padX*2) / (points.length - 1)` divides by zero on a
single-point array → `NaN`/`Infinity` path coords, broken SVG.

- Before: no length guard.
- After: early-return `null` (or a flat baseline) when `points.length < 2`.

**Status: latent.** The only call site is `ApiKeys.tsx:462`
(`points={row.requests7d}`, always 7 points). `CompactKpi` uses a separate
recharts sparkline. Not currently triggered — defensive hardening.

---

## P2 — improvements, grouped by theme

### Theme 1 — Token / grid violations

| file:line | issue | Before → After |
| --- | --- | --- |
| `code-card.tsx:102` | raw white surface | `bg-white` → `bg-card` |
| `code-card.tsx:159` | raw neutral border | `border border-neutral-200` → `border border-border` |
| `code-card.tsx:261` | non-wrap code clips, no scroll | add `overflow-x-auto` on the non-wrap `CodeBlock` body |
| `DashboardDefault.tsx:119-123` | hardcoded hex syntax colors (also a WCAG contrast fail on white) | `text-[#818CF8]` / `text-[#F87171]` → token equivalents (e.g. indigo-600 / red-600) |
| `Artboard.tsx:27,144` | inline rgba box-shadows | route through a `--shadow-*` token |
| `Artboard.tsx:20` | `.5` grid violation | `pb-2.5` → `pb-2` (or `pb-3`) |
| `status-dot.tsx:14` | `.5` grid violation | `size-1.5` (6px) → `size-2` (8px), or document the dot exception |

### Theme 2 — Typography microcopy

| file:line | issue | Before → After |
| --- | --- | --- |
| `Team.tsx:543` | straight apostrophes | `teammate's` / `They'll` → `&rsquo;` |
| `Team.tsx:565` | straight apostrophe | `doesn't` → `doesn&rsquo;t` |
| `Billing.tsx:97` | straight apostrophe | `Constellation's` → `&rsquo;` |
| `Billing.tsx:309` | straight apostrophe | `You'll` → `&rsquo;` |
| `ApiKeys.tsx:497,686,701` | straight apostrophes | `can't` / `You'll` / `I've` → `&rsquo;` |
| `feedback-fab.tsx:167` | unit can wrap off number | `10 MB` → `10&nbsp;MB` |
| `AuditTrail.tsx:182` | missing `text-pretty` (sibling pages have it) | add `text-pretty` |
| `AuditTrailMerkle.tsx:183` | missing `text-pretty` | add `text-pretty` |
| `Activity.tsx:194` | missing `text-pretty` | add `text-pretty` |

### Theme 3 — Motion correctness (emil hard rules)

| file:line | issue | Before → After |
| --- | --- | --- |
| `animated-external-link.tsx:39` | `ease-in` on UI (the one hard "never") | `power2.in` exit → `power2.inOut` / `power2.out` |
| `animated-log-out.tsx:44` | `ease-in` exit leg | `power2.in` → `power2.inOut` |
| `animated-download.tsx:43` | `ease-in` exit leg | `power2.in` → `power2.inOut` |
| `segmented-pill.tsx:88` | indicator ignores `prefers-reduced-motion` | gate the inline `transition` off under `motion-reduce` |
| `switch.tsx:26` | thumb missing curve (track has `duration-150 ease-out`) | `transition-transform` → `transition-transform duration-150 ease-out` |
| `tabs.tsx:64` | indicator animates layout props | `transition-[left,width,top,height]` → drive via `translate`+`scale` (compositor) |
| `segmented.tsx:118` | indicator animates `width` (layout) | drive width via `scaleX` transform, or accept (small element) |

### Theme 4 — Overscroll containment (scroll-chaining to page)

| file:line | issue | Before → After |
| --- | --- | --- |
| `dialog.tsx:245` | `DialogScrollBody` is the real scroll container, no containment | add `overscroll-contain` |
| `Requests.tsx:2280` | inner modal scroll pane | add `overscroll-contain` |
| `date-range-picker.tsx:177` | scrollable popover (time selects) | add `overscroll-contain` |

### Theme 5 — Gesture / performance (strongest violations)

| file:line | issue | Before → After |
| --- | --- | --- |
| `Artboard.tsx:99` | pan via per-frame React `setTx/setTy` (re-render each wheel tick) | write `transform` imperatively via ref during gesture (rAF-batched), sync state on end |
| `AuditRecordDialogMerkle.tsx:569` | pan via per-frame `setPan` (re-render per mousemove) | write `viewBox`/transform imperatively via ref during drag, commit on mouseup |
| `AuditRecordDialogMerkle.tsx:555` | drag is mouse-only (no touch/pen) | Pointer Events + `setPointerCapture` + multi-touch guard |
| `Artboard.tsx:123` / `AuditRecordDialogMerkle.tsx:301` / `SecurityDefault.tsx:99` | permanent `will-change` holds a GPU layer | scope `will-change` to the active animating phase only |

### Theme 6 — Responsive overflow

| file:line | issue | Before → After |
| --- | --- | --- |
| `Billing.tsx:232,355` | fixed 500px dialogs overflow narrow viewports | inline fixed 500 → `sm:max-w-[500px] w-full` |
| `plan-comparison-dialog.tsx:140` | `grid-cols-2` no collapse | `grid-cols-1 sm:grid-cols-2` |
| `DashboardDefault.tsx:182` | code panel flex track can blow out layout | add `min-w-0` to the right panel |

### Theme 7 — Hit areas under the 40px house rule

(Some satisfy WCAG AA 24px but not the make-interfaces-better 40px rule.)

| file:line | issue | Before → After |
| --- | --- | --- |
| `copy-button.tsx:193` | inline-xs ~24px effective | widen `before:inset-[-2px]` where `gap-2` clearance allows |
| `tag.tsx:35` | remove button ~30px (comment claims ~40px) | `after:-inset-2` → `after:-inset-3` |
| `Activity.tsx:1149` | tooltip trigger ~30px | `after:-inset-2` → `after:-inset-3` |

### Theme 8 — Component parity

| file:line | issue | Before → After |
| --- | --- | --- |
| `feedback-fab.tsx:69` | missing press feedback every other pressable has | add `active:scale-[0.99] will-change-transform` (+ `motion-reduce:active:scale-100`) |
| `feedback-fab.tsx:79` | hover-lift not gated for touch | `hover:-translate-y-px` → gate behind `hover-fine:` |
| `timestamp.tsx:58` | date span missing `tabular-nums` (primitive meant for every table date cell) | `cn('cursor-default', className)` → `cn('cursor-default tabular-nums', className)` |
| `SignUp.tsx:42` | email field missing `spellCheck={false}` (invite field has it) | add `spellCheck={false}` |
| `AuthLayout.tsx:192` | hero logo `<img>` missing `width`/`height` (CLS, above-fold) | add `width`/`height` (or `fetchPriority="high"`) |
| `SignIn.tsx:86` | submit button absolute arrow can collide with centered label | move arrow to normal flow, or offset the label |
| `sidebar.tsx:85` | width `duration-150` contradicts the file's own documented 300ms drawer curve | confirm intended duration; likely `duration-300` |
| `Policies.tsx:409` | nested panel Card `rounded-md` inside `rounded-md` + `p-4` (concentric break) | step inner down one tier (`rounded-sm`) |

---

## P3 — nits (appendix, by file)

Low-value; capture for completeness. Most are stale code comments, tab-vs-space
source indentation, optional `motion-reduce` on color-only transitions, or
`text-balance` on short headings that never wrap.

- **Requests.tsx** — `SelectItem "Slow > 10s"` label reads as math (optional reword).
- **sidebar.tsx:243** — `locked` block indented with literal tabs.
- **AuthLayout.tsx:201,206** — hero `<h1>` / body `<p>` could take `text-balance` / `text-pretty` (low value; scramble spans control wrapping).
- **field.tsx:195** — loose `==` (lint, not UI).
- **SignIn.tsx:88** — arrow could take `group-hover:translate-x-px` for CTA parity.
- **row-action-button.tsx** — inline/stack text variants are short keyboard targets (row provides the mouse target).
- **Models.tsx:1185,1330** — model-name `<h2>` no `text-balance`; external-link uses a manual hover-nudge instead of `AnimatedExternalLink`.
- **AuditTrail.tsx:226,549** — section `<h3>` no `text-balance` (short labels).
- **Policies.tsx:521** — radio `<label>` transition missing `motion-reduce:transition-none`.
- **SecurityDefault.tsx:74,131,172** — one-off `shadow-card-soft`; `EASE_OUT` string duplicates the token instead of `var(--ease-out)`; blue-600 emphasis is color-only (OK at 24px).
- **card.tsx:31** — comment references `--shadow-border`, code uses `shadow-xs` (stale comment).
- **segmented.tsx:118** — width animation is layout (small element, low cost).
- **radio-group.tsx:26** / **empty-state.tsx:55** — add `motion-reduce:transition-none` / `text-balance` (consistency).
- **animated-bell.tsx / animated-external-link.tsx / animated-log-out.tsx / animated-download.tsx** — `tl.restart()` restarts the GSAP timeline from zero on rapid re-hover (not velocity-retargeting); acceptable for low-frequency decorative icons.
- **AuditRecordDialog.tsx:41,79** / **AuditRecordDialogMerkle.tsx:41,928,932** — badge `<img>` missing `width`/`height`; footer icons missing `aria-hidden`.
- **select.tsx:195,240,259** — highlight `bg-neutral-100` → `bg-muted` for cross-popup parity; scroll-button chevrons missing `aria-hidden`.
- **Settings.tsx:74,206** — org default value straight apostrophe (input value, low confidence); passkey row text column could take `min-w-0`.
- **TokenSavings.tsx:134-138** — caching toggle toasts on change, compression toggle does not (inconsistent feedback).
- **input-group.tsx:58** — `onClick` focus-forwarder on a `role="group"` div (input is reachable directly; soft anti-pattern).
- **Artboard.tsx:79** — no momentum/boundary damping on pan (dev tool, optional).
- **RequestsFindings.tsx:47,80** — back-button horizontal hit area not extended; not-found body no `text-pretty`.
- **inline-code.tsx:39** / **sonner.tsx:24** / **kpi-rail.tsx:33** / **menu.tsx:96** / **table.tsx:96** — hairline / surface uses raw `neutral-*` ramp where a semantic token (`bg-muted` / `bg-border` / `--color-border`) would track better.
- **Activity.tsx:874** / **Dashboard.tsx:470,486** — card titles no `text-balance`; "View all" links ~32px; `role="link"` on `<tr>` (pragmatic table trade).
- **LimitsFree.tsx:101,443** / **Limits.tsx:449** — tab indentation; example placeholders don't end with `…` (fits prose more than numerics).
- **DashboardDefault.tsx:106,143,156** — `CodePanel` re-tokenizes per render (memoize); hero `<h2>` no `text-balance`; `window.open` without `noopener`.
- **pagination.tsx:57** / **segmented-pill.tsx:65,89** / **pro-upgrade-card.tsx** / **TokenSavingsFree.tsx** — xs pagination <40px (compact trade); source indentation; tab indentation.
- **sheet.tsx:22** — block comment claims 250ms/custom curve, code is `ease-out`/300ms (stale comment).
- **table.tsx:73** / **checkbox.tsx:11,18** — `transition-colors` without explicit `duration-150 ease-out`; checkbox tick is instant (acceptable for high-frequency control).
- **Conversations.tsx:836** — `REDUCE_MOTION` captured once at module load (won't reflect a runtime OS toggle).
- **Upgrade.tsx:99** — plan CTA navigates via `<Button onClick>` not `<Link>` (app-wide convention).
- **AuditTrailMerkle.tsx:182** — description uses `text-muted-foreground` while sibling pages use `text-neutral-500` (both tokens; breaks cross-page match).

---

## Clean exemplars (no findings)

`button.tsx`, `badge.tsx`, `hero-numeric.tsx`, `calendar.tsx`,
`row-action-button.tsx`, `dialog.tsx` (motion), `alert-dialog.tsx`, `popover.tsx`,
`menu.tsx`, `tooltip.tsx`, `icon-action-button.tsx`, `page-title.tsx`,
`search-input.tsx`, `detail-list.tsx`, `input.tsx`, `label.tsx`,
`table-pagination-footer.tsx`, `table-empty-state.tsx`, `user-menu.tsx`,
`chart.tsx`, `compact-kpi.tsx`, `text-link.tsx`, `eyebrow.tsx`, `separator.tsx`,
`filter-toolbar.tsx`, `DashboardChrome.tsx` (icon cross-fade), `LimitsDefault.tsx`,
`message-block.tsx`, `vendor-meta.tsx`, `brand-mark.tsx`, `google-g.tsx`.
</content>
</invoke>
