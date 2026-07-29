# Shadow / elevation system audit & parity port — 2026-07-29

**Purpose:** the design repo (`gate-ai-build`) replaced its entire elevation
system on 2026-07-29. Five hand-authored shadow families were **deleted** and
every surface was remapped onto **Tailwind's own shadow scale at Tailwind's
exact values**. This document is the complete, executable record so the product
build can be brought to **1:1 parity**. Elevation is global chrome — if the two
builds disagree here, every card, menu, and modal in both drifts.

> **The rule this enforces, stated once:** the Figma file scales elevation on
> Tailwind's shadow steps. The code must use the same steps, at the same
> values. **No bespoke shadow tokens. No retuned alphas. No per-theme alpha
> overrides. No `shadow-[…]` arbitrary values.** A shadow that is not one of
> the five utilities in §2 is a defect, not a preference.
>
> The only other file you need is **`design.md`**, which is tracked and has
> been updated to match (§5.0 and §5.1). Where this audit and `design.md`
> overlap, **`design.md` is authoritative**.

---

## ⬛ PROMPT — paste this to the agent doing the port

> You are bringing **this** repo to 1:1 parity with the Constellation Gate
> **design repo**, whose elevation system was replaced on 2026-07-29.
>
> **This is an AUDIT-and-FIX task, not a blind replay.** Your build may already
> be correct in places, may never have had a given token, or may have drifted
> differently. Do not assume the specific edits listed here apply. **Section 0
> gives you scanners that tell you what your build actually has** — run those
> first and fix only what they surface.
>
> What is NOT negotiable is the **end state**: the five-step scale in §2, the
> tier→utility mapping in §4, and zero references to any bespoke shadow token
> anywhere in `src`. However your build gets there, when you are done it must
> match that end state exactly and §8's checks must pass.
>
> The per-file lists and counts throughout are **what was true in the design
> repo**. Yours will differ. A different count is expected and is not an error
> — a different *end state* is.
>
> **Read these two documents first, completely, before editing anything:**
>
> 1. **`audits/shadow-audit-7-29.md`** (this file) — every change,
>    with before/after values, file paths, and the reasoning behind each.
> 2. **`design.md` §5 Elevation & Depth** — §5.0 is the scale with exact
>    values, §5.1 is the tier→utility assignment table.
>
> Also honour the standing repo rules in `.claude/rules/`:
> `design-tokens.md` (closed value set), `no-hardcoding.md` (semantic tokens
> only), `no-handrolling.md` (compose primitives; change the primitive, never
> the call site), and `no-thrash.md`.
>
> **Execute in this order. Do not reorder — later steps depend on earlier ones.**
>
> 0. **§0 Detect** — run all three scanners and write down what each returns.
>    That output is your actual work list. If a scanner comes back clean, that
>    problem does not exist in your build: skip its section and record it as
>    "already correct". Do not manufacture work.
> 1. **§2 Add the scale** — put the five exact values in your `@theme` block.
>    Do this BEFORE deleting anything, or the intermediate state has no
>    shadows at all.
> 2. **§4 + §5 Remap every call site** onto the tier utilities. Work from
>    scanner 1's output, not from this file's line numbers.
> 3. **§6 Add the missing borders.** Do this in the SAME pass as §5, not
>    after. The deleted tokens bundled a 1px ring; a surface converted without
>    its border renders edgeless.
> 4. **§3 Delete the bespoke families** — only once §0's scanner 1 returns
>    zero references. Deleting first is how you ship a shadowless menu.
> 5. **§7 Deliberate non-changes** — do not "fix" the items listed there.
> 6. **§8 Verify** — `npx tsc -b` and `npm run lint` must exit 0, then the
>    browser checks in BOTH themes.
>
> **Four traps that already caught me — do not repeat them:**
>
> - **Never grep for shadows with a line-length filter.** The house convention
>   `grep … | awk 'length($0)<400'` (from `.claude/rules/token-efficient-reads.md`)
>   silently drops long `className` strings — and Select/AlertDialog class
>   strings are longer than that. **Two components shipped with NO shadow at
>   all** because a filtered grep reported the sweep clean. Use
>   `grep -rlE` with no filter for any completeness check.
> - **An edgeless surface means a missing border, NOT too small a shadow.**
>   Every deleted token fused a `0 0 0 1px` ring with a lift. If a converted
>   surface looks flat, add `border border-border` — do not escalate the
>   shadow step. Escalating is how you end up back in bespoke-value territory.
> - **`shadow-(--shadow-xs)` is not a bug but IS a smell.** It resolves (the
>   token still exists as part of the scale) so nothing breaks and nothing
>   warns — which is exactly why it hides. Normalise it to plain `shadow-xs`.
> - **Do not "restore" dark mode by re-adding a per-theme alpha.** It will look
>   softer than before. That is the intended, accepted outcome — see §3.3.
>
> If your build has diverged such that a step does not apply cleanly, **stop
> and report** rather than inventing a value. A one-off shadow at a call site
> is exactly the failure this audit is undoing.
>
> **Report at the end, per section:** `already correct` / `fixed (N sites)` /
> `not applicable` / `blocked — needs a decision`. Plus: any surface that lost
> its edge and what border you gave it, anything this document did not
> anticipate, and the final §8 census.

---

## 0. Detect what YOUR build actually has

Run these three before touching anything. Each prints a work list. **A clean
result means that problem does not exist in your build — skip its section.**

### Scanner 1 — bespoke shadow references → drives §3 and §5

**This is the one that matters.** Note the deliberate absence of any
`awk 'length($0)<N'` filter — that filter is what hid two call sites in the
design repo. If the output is long, pipe to a file; do not filter by length.

```bash
# every reference to a shadow custom-property, anywhere in src
grep -rnE "shadow-\(--shadow-[a-z-]+\)" src --include="*.tsx" --include="*.ts" --include="*.css"

# just the file list + which token each uses (compact, safe to eyeball)
grep -roE "shadow-\(--shadow-[a-z-]+\)" src | sort | uniq -c | sort -rn
```

Every hit outside your `index.css` token-definition block is a call site that
must be remapped in §5. Hits *inside* `index.css` are the definitions to delete
in §3. **Comments count as hits** — fix those too, or the next person greps and
finds a token that no longer exists.

### Scanner 2 — arbitrary / invented shadows → drives §3

```bash
# arbitrary-value shadows and inline box-shadow styles
grep -rnE "shadow-\[|boxShadow" src --include="*.tsx" --include="*.ts"

# every shadow custom property defined anywhere in your CSS
grep -rn -- "--shadow-" src/index.css
```

Expected end state for the second command: **exactly the five lines in §2** and
nothing else. Anything else is either a bespoke family (delete it, §3) or a
retuned Tailwind value (restore it to stock, §3.2).

### Scanner 3 — live elevation census → the pass/fail gate

Run this in devtools on the running app (dev server on **port 3000**), once per
theme. It reports every distinct computed `box-shadow` in the document.

```js
// paste in devtools console on the running app
const seen = new Map();
for (const el of document.querySelectorAll('*')) {
  const bs = getComputedStyle(el).boxShadow;
  if (!bs || bs === 'none') continue;
  seen.set(bs, (seen.get(bs) || 0) + 1);
}
console.table([...seen].map(([shadow, count]) => ({ count, shadow })));
```

**Expected:** every row is one of the five §2 values (Tailwind emits them with
the `rgba(0,0,0,0)` placeholder layers prepended — that is normal, match on the
trailing offsets/alpha). A row with `0 0 0 1px` in it is a surviving bespoke
ring. A row with an alpha of `0.3`–`0.6` is a surviving dark-theme override.

---

## 1. Why this happened (read once, it explains every decision below)

The design repo had accumulated **five hand-authored shadow families**, each
defined twice (light + dark), plus a sixth value that impersonated a Tailwind
step:

| Token | What it was | Consumers |
| --- | --- | --- |
| `--shadow-border` | 3-layer: 1px ring + lift + ambient, `color-mix` off `--color-neutral-800` | 2 |
| `--shadow-border-hover` | same, heavier | **0 — dead the whole time** |
| `--shadow-popup` | `0 4px 12px -2px` @ 8% + 1px ring @ 4% | 8 |
| `--shadow-modal` | `0 16px 32px -4px` @ 12% + 1px ring @ 6% | 4 |
| `--shadow-card-soft` | `0 4px 8px -1px` + `0 2px 6px -2px`, both @ 5% | 1 (via `Button variant="raised"`) |
| `--shadow-xs` | **Tailwind's name, retuned** — `0.055` alpha, commented in-file as *"Tailwind default darkened ~10%"* | many |

Three failures compound here, and they are the same three that
`no-handrolling.md` describes for components:

1. **Six independent decisions that could each drift.** Nobody decided the
   system should have six elevation values; it happened one addition at a time.
2. **The Figma file did not agree with any of them.** Design scales elevation
   on Tailwind's steps. Every bespoke value was a silent divergence from the
   source of truth, invisible in review because the code looked tokenised.
3. **`--shadow-xs` is the tell.** Retuning a Tailwind step by 10% and keeping
   its name is the most expensive kind of drift: it passes every "is this
   tokenised?" check while guaranteeing the build cannot match the design file.

The fix is the same shape as the primitives rule: **adopt the closed set
someone else already tuned.** The only decision left is *which tier a surface
belongs to* — which is the decision actually worth making.

**Bonus contrast win.** Every bespoke token fused a `0 0 0 1px` ring *into* the
shadow. Surfaces that also carried `border border-border` were drawing two
1px edges at the same y-position — the ring and the border — which read as a
muddy doubled line. Now the border draws the edge and the shadow does depth,
one job each. The design repo's contrast visibly improved on conversion.

---

## 2. The scale — Tailwind's, verbatim

Copied byte-for-byte from `node_modules/tailwindcss/theme.css` (v4.2.4, lines
406–410). Restate them in your **`@theme`** block in `src/index.css` rather
than relying on them implicitly, so the scale is visible in the token layer and
any drift from upstream shows up as a diff instead of a discovery.

```css
@theme {
  /* ── Elevation scale — Tailwind's own, verbatim ──────────────────────────
     These are the ONLY shadows the design system has. The Figma file scales
     elevation on Tailwind's steps, so the code must too — no retuned alphas,
     no bespoke families, no arbitrary values. */
  --shadow-2xs: 0 1px rgb(0 0 0 / 0.05);
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

`shadow-xl` and `shadow-2xl` exist in Tailwind but **are not used by this
system** — nothing in either build needs that much lift. They are not banned,
but reach for one only with a design decision behind it.

**Verify against your own install** rather than trusting this paste:

```bash
grep -n -- "^  --shadow-" node_modules/tailwindcss/theme.css
```

If your Tailwind version differs and the values differ, **use your version's
values** and note the delta in your report. Matching Tailwind is the rule;
matching this file's transcription is not.

---

## 3. Deletions — three separate things to remove

### 3.1 The five bespoke families

Delete **all five**, in **both** the light block and the dark block:
`--shadow-border`, `--shadow-border-hover`, `--shadow-popup`, `--shadow-modal`,
`--shadow-card-soft`.

**Order matters.** Add §2 first, remap §5 second, delete these third. Deleting
first leaves every consumer resolving `shadow-(--shadow-popup)` to nothing —
CSS custom properties fail silently, so you get no shadow, no error, and no
`tsc`/lint failure. That is exactly how two components shipped flat in the
design repo (see §5's note).

### 3.2 The `--shadow-xs` retune

```diff
- /* shadow-xs: Tailwind default darkened ~10% (0.05 -> 0.055 alpha) for a
-    touch more lift on cards / buttons. */
- --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.055);
+ --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
```

### 3.3 The dark-theme alpha override

```diff
- /* dark block */
- --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.4);
```

**One scale, one set of values, both themes.** A per-theme alpha is an invented
value wearing a theme's clothing.

**This has a real, visible cost and it was accepted knowingly.** The deleted
dark tokens ran at **0.3–0.6 alpha** because Tailwind's 0.05–0.1 is tuned for
light grounds and nearly vanishes on near-black. After this change, dark-mode
elevation reads noticeably softer, and the `border-border` hairline carries most
of the surface separation. **Do not "fix" this by reintroducing a dark alpha.**
If dark separation is genuinely insufficient on some surface, the answer is a
border or a different `--card`/`--popover` step, not a bespoke shadow.

---

## 4. The mapping — tier → utility

This is the end state. Everything in §5 is just this table applied.

| Tier | Utility | Radius | Surfaces |
| --- | --- | --- | --- |
| Sub-element | *none* | `rounded-xs` (4px) | Tabs trigger, Segmented item, SelectItem, Badge, MenuItem |
| **Card / Surface** | **`border border-border shadow-xs`** | `rounded-md` (8px) | Card, KpiRail, EmptyState, CompactKpi, CodeCard (flat), Tabs `line`, MessageBlock. **Tables carry no shadow of their own — they sit inside a Card** |
| Hover (card) | `hover:shadow-sm` where interactive | (same as card) | Rare — most operator cards are static |
| **Soft lift** | **`shadow-sm`** | (varies) | `Button variant="raised"` and everything built on it: the Ask AI scroll-to-latest FAB, the composer's Add-context button |
| **Menu / Chrome** | **`shadow-md`** | `rounded-sm` (6px) | Menu popup, Popover, Tooltip, **SelectContent**, chart tooltip, CodeCard `raised`, Artboard shell, Team member menu |
| **Modal** | **`shadow-lg`** | `rounded-xl` (**16px LOCKED**) | Dialog, **AlertDialog**, Sheet, SignIn / SignUp auth cards |

Quick substitution reference:

| Was | Becomes |
| --- | --- |
| `shadow-(--shadow-border)` | `border border-border shadow-xs` |
| `shadow-(--shadow-popup)` | `shadow-md` |
| `shadow-(--shadow-modal)` | `shadow-lg` |
| `shadow-(--shadow-card-soft)` | `shadow-sm` |
| `shadow-(--shadow-xs)` | `shadow-xs` (plain utility form) |

---

## 5. Call-site migration — 15 edits across 13 files

What the design repo actually changed. **Match by *what the surface is*, not by
file path or line number.**

### 5.1 → `shadow-md` (menu / chrome tier)

| File | Surface |
| --- | --- |
| `ui/menu.tsx` | `MenuContent` popup |
| `ui/popover.tsx` | `PopoverContent` |
| `ui/tooltip.tsx` | `TooltipContent` |
| `ui/select.tsx` | `SelectContent` — **see the warning below** |
| `ui/chart.tsx` | chart tooltip |
| `ui/code-card.tsx` | `elevation="raised"` branch |
| `canvas/Artboard.tsx` | ×2 — the artboard shell and the fixed bottom-right toolbar |
| `pages/Team.tsx` | member-row menu popup |

### 5.2 → `shadow-lg` (modal tier)

| File | Surface |
| --- | --- |
| `ui/dialog.tsx` | `DialogContent` shell |
| `ui/alert-dialog.tsx` | `AlertDialogContent` — **see the warning below** |
| `ui/sheet.tsx` | right-docked drawer |
| `pages/SignIn.tsx`, `pages/SignUp.tsx` | the `Card` auth panels (`w-100 rounded-lg`) |

### 5.3 → `shadow-sm` (soft lift)

| File | Surface |
| --- | --- |
| `ui/button.tsx` | `variant="raised"` recipe. **One edit covers every consumer** — the Ask AI FAB and the composer's Add-context button both inherit from it. Do not chase them individually. |

### 5.4 → `border border-border shadow-xs` (card tier)

| File | Surface | Note |
| --- | --- | --- |
| `ui/compact-kpi.tsx` | non-flat KPI tile | **gained a border** — see §6 |
| `ui/code-card.tsx` | flat default shell | **gained a border** — see §6 |

`Card`, `KpiRail`, and `EmptyState` were **already** on `border border-border
shadow-xs` (migrated 2026-05-15) and needed no change. Check yours before
editing.

### 5.5 Normalisation

`ui/select-variants.ts` carried `shadow-(--shadow-xs)` — the arbitrary-property
form of a token that still exists. It resolved correctly, so nothing broke.
Normalised to plain `shadow-xs`.

### ⚠️ The two that shipped broken — read this

`select.tsx` (`SelectContent`) and `alert-dialog.tsx` (`AlertDialogContent`)
were **missed by the first sweep and shipped with no shadow at all**. A Select
opened inside a Dialog sat completely flat on the modal.

**Root cause was tooling, not typing.** The sweep used the repo's
token-efficiency convention `grep … | awk 'length($0)<400'` to keep long
`className` strings out of context. Both components' class strings are longer
than 400 characters, so both were silently filtered out and the sweep *reported
clean*. Deleting a CSS custom property produces no error and no lint failure —
just a silently missing shadow.

**If your build has long class strings — and it does — use scanner 1 exactly as
written, with no length filter.**

### 5.6 Stale comments

These reference deleted tokens and will mislead the next reader. Update them:
`ui/card.tsx`, `ui/table.tsx`, `ui/empty-state.tsx`, `ui/kpi-rail.tsx`,
`ui/tooltip.tsx`, `ui/code-card.tsx`, `pages/Team.tsx`,
`ui/ask-ai-scroll-to-latest.tsx` (its header maps Figma `shadow/md` →
`--shadow-card-soft`; that is now `shadow-sm` via `variant="raised"`).

---

## 6. The ring layer — the one real trap

Every deleted token bundled **two jobs** into one value:

```css
--shadow-popup:
  0 4px 12px -2px …8%,   /* the lift  — replaced by shadow-md */
  0 0 0 1px …4%;         /* the RING  — replaced by nothing   */
```

Tailwind's steps are **lift only**. Any surface that relied on the ring for its
visible edge loses that edge on conversion and must gain
`border border-border` in the same edit.

**Most call sites already had a border** (`menu.tsx`, `popover.tsx`,
`tooltip.tsx`, `dialog.tsx`, `chart.tsx`, `Team.tsx`, and the `Card`-based auth
panels all carried `border border-border` and needed nothing).

**Two did not, and were given one:**

| File | Before | After |
| --- | --- | --- |
| `ui/compact-kpi.tsx` | `rounded-md gap-2 bg-card shadow-(--shadow-border) p-4` | `flex flex-col gap-2 rounded-md border border-border bg-card p-4 shadow-xs` |
| `canvas/Artboard.tsx` (shell) | `artboard-shell overflow-hidden rounded-sm bg-card shadow-(--shadow-popup)` | `artboard-shell overflow-hidden rounded-sm border border-border bg-card shadow-md` |

`sheet.tsx` is a special case worth not "fixing": its base carries
`border-border` **without** a width utility because the side variants apply
per-side borders (`border-l` / `border-r`). That is correct — leave it.

> **The rule, restated because it is the single most likely mistake:**
> a converted surface that looks edgeless is **missing its border**. It is not
> missing shadow. Adding `shadow-md` to a card to give it an edge re-creates
> the exact fused ring+lift value this audit deleted.

---

## 7. Deliberate non-changes — DO NOT "FIX" THESE

| Item | Why it stays |
| --- | --- |
| Pre-existing `shadow-sm` / `hover:shadow-sm` on `tabs.tsx`, `feedback-fab.tsx`, `Models.tsx`, `Policies.tsx`, `TokenSavings.tsx`, `pro-upgrade-card.tsx`, `plan-comparison-dialog.tsx`, `DashboardDefault.tsx` | Already plain Tailwind utilities. They were never part of the bespoke system. Do not "re-tier" them — they are compliant. |
| `shadow-blue-700/30` on Pro-upsell CTAs | A *coloured* shadow for brand signalling, documented in `design.md` §3 as the one blessed blue exception. Different concern from the elevation scale. |
| Tables having no shadow | Correct. Tables sit inside a `Card` and inherit its chrome. Do not give a table its own elevation. |
| `sheet.tsx`'s width-less `border-border` | Per-side borders come from the side variants. See §6. |
| Softer dark-mode elevation | Intended and accepted. See §3.3. |
| `shadow-2xs` currently having no consumers | It is part of Tailwind's scale and is defined for completeness. An unused step is not dead code. |

---

## 8. Verification — all four must pass

```bash
npx tsc -b        # exit 0
npm run lint      # eslint + ultracite + lint:design, all clean
```

**Neither of these can catch a missing shadow** — a dangling CSS custom
property is not a type error or a lint error. The next two checks are the
actual gate.

```bash
# must return NOTHING (no length filter — that is the point)
grep -rlE "shadow-\(--shadow-(border|border-hover|popup|modal|card-soft)\)" src

# must return exactly the five lines from §2
grep -rn -- "--shadow-" src/index.css
```

Then in the browser, **in both light and dark**, run scanner 3 from §0 and
confirm every distinct `box-shadow` is one of the five scale values. Then walk
these surfaces specifically — they are the ones that broke or changed most:

- **A `Select` opened inside a `Dialog`** (canonical: Security events →
  Filters → Type). The popup must cast a visible `shadow-md` over the modal.
  This is the exact surface that shipped flat.
- **`AlertDialog`** — must cast `shadow-lg`.
- **Any menu** (workspace switcher, user menu, a table row menu) — `shadow-md`,
  border intact, clearly lifted off the page canvas.
- **Cards and tables** — `shadow-xs` with a crisp `border-border` edge, and
  **no doubled 1px line** where the old ring used to sit under the border.
- **`Button variant="raised"`** (Ask AI FAB, composer Add-context) —
  `shadow-sm`.
- **Dark mode everywhere** — expect softer elevation. Confirm every surface is
  still *separable*; if one is not, report it rather than adding a shadow.

---

## Change inventory — quick checklist

- [ ] §0 all three scanners run, output recorded as the work list
- [ ] §2 five exact Tailwind values in `@theme` (verified against your own
      `node_modules/tailwindcss/theme.css`)
- [ ] §5 every call site remapped (scanner 1 returns zero)
- [ ] §6 borders added to any surface that lost its ring edge
- [ ] §3.1 five bespoke families deleted, **both** themes
- [ ] §3.2 `--shadow-xs` back to stock `0.05`
- [ ] §3.3 dark `--shadow-xs` override deleted, softer dark accepted
- [ ] §5.5 `shadow-(--shadow-xs)` normalised to `shadow-xs`
- [ ] §5.6 stale comments updated
- [ ] §7 confirm the compliant pre-existing utilities are **left alone**
- [ ] §8 tsc + lint + both greps + browser census in **both themes**
- [ ] `design.md` §5.0/§5.1 updated to match
