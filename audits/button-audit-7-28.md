# Button system audit & parity port — 2026-07-28

**Purpose:** the design repo (`gate-ai-build`) changed its Button system on
2026-07-28. This document is the complete, executable record of those changes so
the product build can be brought to **1:1 parity**. Divergence in the Button
primitive means every screen in both builds drifts.

> **This is the only Button document to work from.** It **supersedes the
> 2026-07-16 handoff** (`docs/button-sizing-staging-handoff.md`) in full. That
> file describes the scale this work replaced (`default` = 32px, `lg` = 36px)
> and will actively undo this port if followed — it has been moved out of the
> repo root and carries a superseded banner. Do not work from it.
>
> The only other file you need is **`design.md`**, which is tracked in the repo
> and has been updated to match. Everything else — including full source for the
> new primitives — is inlined here.

---

## ⬛ PROMPT — paste this to the agent doing the port

> You are bringing **this** repo to 1:1 parity with the Constellation Gate
> **design repo**, whose Button system was overhauled on 2026-07-28.
>
> **This is an AUDIT-and-FIX task, not a blind replay.** Your build may already
> be correct in places, may never have had a given problem, or may have drifted
> differently. Do not assume the specific edits listed here apply. **Section 0
> gives you scanners that tell you what your build actually has** — run those
> first, and fix only what they surface.
>
> What is NOT negotiable is the **end state**. Sections 2–8 describe the target:
> the size scale, the variants, the token, the primitives, and the six raw
> `<button>`s that must be left alone. However your build gets there, when you
> are done it must match that end state exactly, and §9's checks must pass.
>
> The per-file lists and counts throughout (63 sites, 30 files, specific line
> numbers) are **what was true in the design repo**. Yours will differ. A
> different count is expected and is not an error — a different *end state* is.
>
> **Read these two documents first, completely, before editing anything:**
>
> 1. **`audits/button-audit-7-28.md`** (this file) — every change,
>    with before/after, file paths, full source for the new primitives, and the
>    reasoning behind each.
> 2. **`design.md`** — the authoritative design-system contract. It has been
>    updated to match this work. Specifically read: §Buttons (the size scale,
>    `shape`, `variant="raised"`, symmetric icon padding) and the primitive
>    entries for `CopyButton`, `BackLink`, `OptionTile`, `MiniRadioGroup`,
>    `ExpandingAction`. Where this audit and `design.md` overlap, `design.md`
>    is authoritative.
>
> Also honour the standing repo rules in `.claude/rules/`:
> `no-handrolling.md` (compose primitives, never rebuild them),
> `no-hardcoding.md` (semantic tokens only — a raw ramp step used for a
> semantic role is still hardcoding), `design-tokens.md` (closed value set;
> note the ONE sanctioned off-grid value, `px-2.5`), and `no-thrash.md`.
>
> **Execute in this order. Do not reorder — later steps depend on earlier ones.**
>
> 0. **§0 Detect** — run all four scanners and write down what each returns.
>    That output is your actual work list. If a scanner comes back clean, that
>    problem does not exist in your build: **skip that section entirely** and
>    record it as "already correct". Do not manufacture work.
> 1. **§2 Token** — if `--border-hover` is missing, add it to both themes.
>    Required before §3.5 compiles.
> 2. **§3 The Button primitive** — bring `button.tsx` to the target recipe.
>    `lg`, `xl`, and `icon-lg` must end up **deleted**, not deprecated. Deleting
>    them makes `tsc` fail on every stale call site, which is how you find them.
>    If your build never had `xl`, there is nothing to delete — that is fine.
> 3. **§4 Call-site migration** — run the AST codemod in §4.1 against whatever
>    §0's census found. **Never find-and-replace `size="lg"`**: `Switch`,
>    `Input`, `Select`, `HeroNumeric`, and `Avatar` also take `size="lg"` and
>    must not be touched. Then fix any prop defaults (§4.2) the codemod cannot
>    see — `tsc` will point at them.
> 4. **§5 `data-icon` markers** — fix whatever scanner 3 surfaced. Without these
>    the symmetric padding never fires and buttons silently render 12px, not
>    10px. Check §5's exclusion list before marking anything.
> 5. **§6 New primitives** — create only the ones you actually need. If your
>    build has no credit-preset grid, you do not need `OptionTile`. Source is in
>    Appendix B; copy verbatim, including header comments.
> 6. **§7 Call-site conversions** — convert the equivalents that exist in your
>    build. Match by *what the control is*, not by file path or line number.
> 7. **§8 Deliberate non-changes** — **do not "fix" the raw `<button>`s listed
>    there.** Each was assessed and left intentionally; converting them breaks
>    working UI. For any raw `<button>` scanner 2 finds that is NOT on that
>    list, apply §8's single-definition test and decide — then report what you
>    decided and why.
> 8. **§9 Verify** — `npx tsc -b` and `npm run lint` must both exit 0, then run
>    the browser checks. The height census is the real proof: **no button above
>    36px anywhere**.
>
> **Three traps that already caught me — do not repeat them:**
>
> - `TextLink` is **underlined**; back breadcrumbs are not. Do not route
>   breadcrumbs into `TextLink`.
> - `Segmented` is a muted track with a card thumb; the BYOK/PAYG switch is a
>   card track with a muted thumb. They are **inverted**, not different sizes.
> - `RowActionButton` is **table-cell specific**. Do not use it for card-list
>   rows or timeline steps.
>
> If your build has diverged such that a step does not apply cleanly, **stop and
> report** rather than improvising a variant. A one-off variant at a call site is
> exactly the failure this whole audit is undoing.
>
> **Report at the end, per section:** `already correct` / `fixed (N sites)` /
> `not applicable` / `blocked — needs a decision`. Plus: any raw `<button>` you
> found that is not in §8 and what you decided about it, anything in your build
> that this document did not anticipate, and the final §9 height census.

---

## 0. Detect what YOUR build actually has

Run these four before touching anything. Each prints a work list. **A clean
result means that problem does not exist in your build — skip its section.**

These are the exact scanners used to produce this audit. They are AST-based, not
regex: inline arrow handlers contain `>`, which truncates naive tag matching and
undercounted by ~30% on the first pass here.

Save each as a `.mjs` at the **repo root** (`typescript` must resolve from
`node_modules`), run with `node ./<name>.mjs`, then delete it.

### Scanner 1 — Button size census → drives §3.2 and §4

```js
// .scan-sizes.mjs
import ts from "typescript";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("find src -name '*.tsx' | sort", { encoding: "utf8" })
  .trim().split("\n");
const bySize = new Map();

for (const file of files) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("<Button")) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const walk = (n) => {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
        n.tagName.getText(sf) === "Button") {
      let size = "(none)";
      for (const a of n.attributes.properties) {
        if (!ts.isJsxAttribute(a) || a.name.getText(sf) !== "size") continue;
        const i = a.initializer;
        size = i && ts.isStringLiteral(i) ? i.text : "(dynamic)";
      }
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      if (!bySize.has(size)) bySize.set(size, []);
      bySize.get(size).push(`${file}:${line}`);
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
}
for (const [s, arr] of [...bySize].sort((a, b) => b[1].length - a[1].length))
  console.log(`size="${s}"`.padEnd(22) + `×${arr.length}`);
console.log("\n--- sites needing migration ---");
for (const s of ["lg", "xl", "icon-lg"])
  for (const at of bySize.get(s) || []) console.log(`  ${s}  ${at}`);
```

**Reading it:** any count under `lg` / `xl` / `icon-lg` is your §4 work list. If
`default` shows 0 uses and `lg` shows many, you have the same root cause we did.
If `default` is already 36px and `lg` is gone, §3.2 and §4 are already correct.

### Scanner 2 — raw `<button>` inventory → drives §7 and §8

```js
// .scan-raw.mjs
import ts from "typescript";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("find src -name '*.tsx' | sort", { encoding: "utf8" })
  .trim().split("\n");
const hits = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const walk = (n) => {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
        n.tagName.getText(sf) === "button") {
      let label = "", cls = "";
      for (const a of n.attributes.properties) {
        if (!ts.isJsxAttribute(a) || !a.initializer) continue;
        const nm = a.name.getText(sf);
        if (nm === "aria-label") label = a.initializer.getText(sf).slice(0, 40);
        if (nm === "className") cls = a.initializer.getText(sf).replace(/\s+/g, " ");
      }
      const h = cls.match(/\bh-\d+|\bsize-\d+/);
      hits.push({ at: `${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`,
                  h: h ? h[0] : "", label });
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
}
const page = hits.filter((r) => !r.at.startsWith("src/components/ui/"));
console.log(`PAGE-LEVEL (${page.length}) — these are the candidates:`);
for (const r of page) console.log(`  ${r.at}  ${r.h}  ${r.label}`);
console.log(`\nUI-LEVEL (${hits.length - page.length}) — mostly legitimate, see §8`);
for (const r of hits.filter((r) => r.at.startsWith("src/components/ui/")))
  console.log(`  ${r.at}  ${r.h}  ${r.label}`);
```

**Reading it:** page-level hits are §7 candidates. Cross-check each against §8's
keep-list first. For anything not covered by either, apply §8's test.

### Scanner 3 — unmarked icons inside Buttons → drives §5

```js
// .scan-icons.mjs — heuristic; verify each hit by eye before editing
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("grep -rl '<Button\\|render={<Button' src --include='*.tsx'",
  { encoding: "utf8" }).trim().split("\n");
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const icons = new Set();
  for (const m of src.matchAll(/import\s*{([^}]+)}\s*from\s*"lucide-react"/g))
    for (const n of m[1].split(",")) icons.add(n.trim().split(/\s+as\s+/).pop().trim());
  if (!icons.size) continue;
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/<([A-Z][A-Za-z0-9]*)\b/);
    if (!m || !icons.has(m[1])) continue;
    let el = "";
    for (let j = i; j < Math.min(i + 8, lines.length); j++) {
      el += lines[j] + "\n";
      if (lines[j].includes("/>") || lines[j].includes("</")) break;
    }
    if (el.includes("data-icon")) continue;
    let ctx = "";
    for (let k = i; k >= Math.max(0, i - 12); k--) ctx = lines[k] + "\n" + ctx;
    if (!/<Button|render={<Button/.test(ctx)) continue;
    const size = (ctx.match(/size="([a-z-]+)"/) || [])[1] || "(none)";
    if (size.startsWith("icon")) continue;      // square, no padding rule
    console.log(`${file}:${i + 1}  ${m[1]}  size=${size}`);
  }
}
```

**Reading it:** this one over-reports — it caught 12 here of which only 7 were
real. Verify each: is the icon a *direct child of a Button, in normal flow*? Skip
icons in `<span>` wrappers, in `icon={}` props, and absolutely-positioned ones.
§5 lists the exclusions we hit.

### Scanner 4 — live height census → the pass/fail gate

The browser script in §9. Run it **before** you start, to see what your build
currently renders, and **after**, to prove it. Anything stably above 36px before
you start is a size problem; after you finish there must be none.

---

## 1. Why this happened (read once, it explains every decision below)

The size scale sat **one step below shadcn's**:

| | xs | sm | default | lg | xl |
| --- | --- | --- | --- | --- | --- |
| **shadcn** | h-6 (24) | h-8 (32) | **h-9 (36)** | h-10 (40) | — |
| **before** | h-6 (24) | h-8 (32) | **h-8 (32)** | h-9 (36) | h-11 (44) |
| **after** | h-6 (24) | h-8 (32) | **h-9 (36)** | *deleted* | *deleted* |

Because `default` was a size too small, every author reached for `lg` to get an
ordinary button. The census across 120 `<Button>` instances:

| Size | Uses before |
| --- | --- |
| `lg` | **62** |
| `sm` | 38 |
| `icon-sm` | 8 |
| `icon-lg` | 6 |
| dynamic (`size={size}`) | 5 |
| `xl` | 1 |
| **`default`** | **0** |
| **`xs`** | **0** |

`default` was dead API and `lg` was the real default. Renaming `lg` → `default`
is therefore **pixel-identical** and makes the API honest.

---

## 2. Token: `--border-hover`

`src/index.css`, both theme blocks. Required by §3.5.

```css
/* :root (light) — after --border-active */
/* Hover / pressed edge on a bordered control — always one step MORE
   contrast against the surface than --border. Darker in light, lighter in
   dark. One token covers both states. Not a focus ring; that's --ring. */
--border-hover: var(--color-neutral-300);

/* dark theme block */
--border-hover: color-mix(in oklch, var(--color-white) 20%, transparent);
```

Also register the Tailwind utility alongside the other border tokens in the
`@theme inline` block:

```css
--color-border-hover: var(--border-hover);
```

**Intent:** the hover *and* pressed edge on a bordered control — one token for
both, because a control that raises its edge on hover should hold it while
pressed rather than flicker to a third value. It is **not** a substitute for
`--ring`: `--ring` means "keyboard is here", `--border-hover` means "this is
pointing at you". A control can show both at once.

---

## 3. `src/components/ui/button.tsx` — five changes

### 3.1 Symmetric icon padding (was asymmetric)

```diff
- has-data-[icon=inline-start]:pl-2   has-data-[icon=inline-end]:pr-2
+ has-data-[icon=inline-start]:px-2.5 has-data-[icon=inline-end]:px-2.5
```

Applied to `xs`, `sm`, `default`. **shadcn has no asymmetric button padding at
any size** — upstream is `sm: "h-8 px-3 has-[>svg]:px-2.5"`, a symmetric draw-in
on both sides. The old `pl-2`/`pr-2` (8px icon side vs 12px text side) was a
local invention from 2026-07-16 and the lopsided edge was visible on every
icon+label button in the app.

**`px-2.5` = 10px is deliberately OFF the 4px grid.** It is shadcn's value and
is the single sanctioned `*.5` utility in the system. This is recorded as an
explicit carve-out in `.claude/rules/design-tokens.md` — do not "correct" it to
`px-3`, and do not treat it as licence for a second `*.5`.

### 3.2 The size scale

```diff
  xs:      "h-6 gap-2 in-data-[slot=button-group]:rounded-sm px-3 text-xs …"
  sm:      "h-8 gap-2 in-data-[slot=button-group]:rounded-sm px-3 text-xs …"
- default: "h-8 gap-2 px-3 text-sm …"
- lg:      "h-9 gap-2 px-3 text-sm …"
- xl:      "h-11 gap-3 px-4 text-sm"
+ default: "h-9 gap-2 px-3 text-sm …"
  "icon-xs": "size-6 …"
  "icon-sm": "size-8 …"
- icon:      "size-8"
- "icon-lg": "size-9"
+ icon:      "size-9"
```

**`lg`, `xl`, and `icon-lg` are deleted from the type.** That is the enforcement
mechanism — a previous sweep left them defined, so they came back. With them
gone, `tsc` rejects every stale call site. `xs` stays defined at zero uses; it is
shadcn's and it is the documented step for dense table chrome.

`icon` moves 32px → 36px so it tracks the new `default`. Safe: it had **zero**
explicit call sites (everything used `icon-sm` or `icon-lg`).

### 3.3 New `shape` variant

```ts
shape: {
  default: "",
  pill: "rounded-full",
  circle: "rounded-full",
},
// + shape: "default" in defaultVariants, and pass `shape` through to cva()
```

Radius is a primitive concern — no call site should ever write `rounded-full` on
a `<Button>`. `circle` exists because **four separate files had hand-rolled the
same round-button recipe** (see §7.2).

### 3.4 New `raised` variant

```ts
raised:
  "border-border bg-control-raised text-accent-foreground shadow-(--shadow-card-soft) hover:bg-muted hover:text-foreground",
```

A control that sits ON a panel and must read lifted off it. `--control-raised` is
white in light and **neutral-700 in dark — lighter than a card**, which
`outline` (on `--card`) cannot express. Reach for `outline` first.

### 3.5 Compound variant: `outline` + `pill`

```ts
compoundVariants: [
  {
    variant: "outline",
    shape: "pill",
    className:
      "hover:border-border-hover active:border-border-hover dark:hover:border-border-hover dark:active:border-border-hover",
  },
],
```

Pill-shaped outline rows are list rows, not toolbar buttons — the control IS the
row, so the edge moves on hover/press, not just the fill. **Deliberately scoped
to `outline + pill`**, not to all of `outline`: raising the edge on every outline
button is a site-wide visual change and is its own decision.

---

## 4. Call-site migration — 71 edits

### 4.1 The codemod (63 `lg`/`xl` → `default`, then 6 `icon-lg` → `icon`)

⚠️ **`size="lg"` appears 84 times in `src`, but only 62 are on `<Button>`.**
`Switch`, `Input`, `Select`, `SearchInput`, and `HeroNumeric` also take it. A
find-and-replace corrupts them. Use the AST:

```js
// .codemod-button-size.mjs — run from repo root: `node ./.codemod-button-size.mjs`
// Run ONCE with RENAME = { lg: "default", xl: "default" },
// then a SECOND time with RENAME = { "icon-lg": "icon" }.
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("find src -name '*.tsx' | sort", { encoding: "utf8" })
  .trim().split("\n");
const RENAME = { lg: "default", xl: "default" };
let changed = 0;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("<Button")) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const walk = (node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(sf) === "Button"
    ) {
      for (const a of node.attributes.properties) {
        if (!ts.isJsxAttribute(a) || a.name.getText(sf) !== "size") continue;
        const init = a.initializer;
        if (!init || !ts.isStringLiteral(init)) continue;
        const next = RENAME[init.text];
        if (!next) continue;
        edits.push({ start: init.getStart(sf) + 1, end: init.getEnd() - 1, text: next });
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
  if (!edits.length) continue;
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  writeFileSync(file, out);
  changed += edits.length;
}
console.log(`Rewrote ${changed} Button size props.`);
```

Note: `typescript` must resolve from the repo root, so keep the script at the
root (not in a temp dir) when running it. Delete it afterwards.

Files touched by pass 1 (63 edits across 30 files): `alert-dialog` ·
`ask-ai-empty-state` · `ask-ai-panel` · `dialog` · `feedback-fab` ×2 ·
`input-group` · `sheet` · `workspace-switcher` · `DashboardChrome` ×2 ·
`Activity` · `ApiKeys` ×6 · `AuditTrail` ×5 · `DashboardDefault` ×4 · `Limits`
×3 · `LimitsFree` ×2 · `Policies` · `SetupCredits` · `SetupGateConnect` ·
`SetupManual` ×2 · `SignIn` ×3 · `SignUp` ×2 · `Team` ×5 · `TeamDefault` ·
`Upgrade` · `onboarding-shared` · `plan-comparison-dialog` ·
`plan-comparison-dialog-pro` · `pro-upgrade-card` · `RequestsTable` ×5 ·
`EventsTable` ×5.

Pass 2 (6 edits): `ask-ai-panel` ×2 · `sheet` · `theme-toggle` ·
`DashboardChrome` ×2.

### 4.2 Prop defaults the codemod cannot see

These are default parameter values, not JSX attributes:

```diff
// src/components/ui/alert-dialog.tsx — AlertDialogCancel
-  size = "lg",
+  size = "default",

// src/pages/ApiKeys.tsx — CreateKeyButton
-  size = "lg",
+  size = "default",
```

### 4.3 Stale comments referencing dead sizes

`empty-state.tsx` ×2, `notifications-menu.tsx`, `ask-ai-empty-state.tsx` — all
said `<Button size="lg">` in prose. Update to `size="default"` so the docs
don't lie.

---

## 5. `data-icon` markers — 7 sites

**Root cause worth understanding:** the top-bar buttons rendered 12px padding
*after* §3.1 shipped. They were not hand-rolled — they were real `<Button>`s
whose icons lacked `data-icon`, so the padding rule had nothing to match. Per
shadcn's `icons.md`, icons inside a Button **must** carry the marker.

| File:line | Icon | Marker |
| --- | --- | --- |
| `ui/workspace-switcher.tsx:37` | `ChevronsUpDown` | `inline-end` |
| `ui/ask-ai-panel.tsx:102` | `ChevronsUpDown` | `inline-end` |
| `ui/feedback-fab.tsx:180` | `Upload` | `inline-start` |
| `ui/feedback-fab.tsx:190` | `Camera` | `inline-start` |
| `pages/AuditRecordDialog.tsx:139` | `Copy` | `inline-start` |
| `pages/AuditRecordDialog.tsx:154` | `ExternalLink` | `inline-start` |
| `pages/SignIn.tsx:111` | `KeyRound` | `inline-start` |

**Deliberately NOT marked** (scan will surface these; leave them):

- `SetupCredits.tsx:84`, `ApiKeys.tsx:320` — icons not inside a Button at all
  (one is in a `<span>`, one in an `EmptyState icon={}` prop).
- `SignUp.tsx:80`, `SignIn.tsx:97` — **absolutely positioned** arrows
  (`absolute right-3`). They are out of flow; drawing the button's edge in for
  them would be wrong.
- `ask-ai-empty-state.tsx` row arrow — nested inside a `<span>`, not a direct
  child.

Related: **delete sizing classes on icons inside a Button.** The primitive sizes
unclassed SVGs (`[&_svg:not([class*='size-'])]:size-4`). The Ask AI empty-state
row icon dropped `className="size-5"` and correctly became 16px.

---

## 6. Five new primitives

All five recipes are lifted **verbatim** from the hand-rolled originals — that is
the whole point, the extractions move zero pixels. Create these files as-is.

| File | What | Why not an existing primitive |
| --- | --- | --- |
| `ui/back-link.tsx` | `BackLink` — chevron + label detail-page breadcrumb | **Not `TextLink`** — TextLink is underlined, breadcrumbs are not |
| `ui/option-tile.tsx` | `OptionTile` — one choice in a radiogroup | **Not `Button`** — needs `role="radio"` + `aria-checked` semantics |
| `ui/mini-radio-group.tsx` | `MiniRadioGroup` / `MiniRadio` — 32px bordered track of 24px choices | **Not `Segmented`** — inverted track/thumb colors |
| `ui/expanding-action.tsx` | `ExpandingAction` — 32px key that opens on hover to reveal its label | **Not a `Button` variant** — width-on-hover is not button behavior |
| *(extend)* `ui/copy-button.tsx` | new label size `"segment"` | flush split-well segment; `compact`/`sm` float a short button in a taller well |

**Full source for all five is in Appendix B at the end of this document** —
copy it verbatim, including the header comments, which carry the reasoning.
`design.md` documents all five under the primitive list. **Two notes that must
survive the port:**

- `OptionTile`'s `tone="neutral"` vs `tone="accent"` encodes a **real
  pre-existing inconsistency** — `/billing` marks the chosen amount neutral,
  `/setup-credits` marks it blue. Both are reproduced verbatim so the refactor
  moved no pixels. Unifying them is an open design decision, not part of this
  port.
- `OptionTile` keeps the **parent** owning arrow-key roving tabindex. Billing
  has it (`onPresetKeyDown` + `presetRefs`); SetupCredits does not. Preserve
  that asymmetry.

---

## 7. Call-site conversions — 17 sites

### 7.1 Component-level: four hand-rolled circular buttons → `Button`

These existed because `shape="circle"` did not. Three local class-string
constants (`ACTION_BUTTON`, the FAB recipe, `REPLY_ACTION_BUTTON`) are deleted.

| File | Was | Now |
| --- | --- | --- |
| `ui/ask-ai-composer.tsx` | 24px circle, add-context | `<Button shape="circle" size="icon-xs" variant="raised">` |
| `ui/ask-ai-composer.tsx` | 32px circle, send/stop | `<Button shape="circle" size="icon-sm">` |
| `ui/ask-ai-scroll-to-latest.tsx` | 32px FAB | `<Button shape="circle" size="icon-sm" variant="raised">` |
| `ui/ask-ai-message.tsx` | reply action glyphs | `<Button variant="ghost" size="icon-xs">` |

Only `className` that survives is genuine **state** (`opacity-*`, the FAB's
`scale`/`pointer-events` visibility pair) — never chrome.

### 7.2 Page-level: 13 conversions

| # | File:line | Was | Now |
| --- | --- | --- | --- |
| 1 | `ConversationsTrace.tsx:40` | back breadcrumb | `BackLink` |
| 2 | `RequestsFindings.tsx:39` | same, copy 2 | `BackLink` |
| 3 | `onboarding-shared.tsx:130` | same, copy 3 (`SetupBackLink`) | delegates to `BackLink` |
| 4 | `ApiKeys.tsx:727` | copy-key split-well segment | `CopyButton mode="label" size="segment"` |
| 5 | `AuditTrail.tsx:171` | "What is a fingerprint?" glyph | `IconActionButton` |
| 6 | `Policies.tsx:328` | expand/collapse chevron | `IconActionButton` |
| 7 | `RequestDetailBody.tsx:708` | "Previous finding" paddle | `Button size="icon-sm" variant="outline"` |
| 8 | `RequestDetailBody.tsx:717` | "Next finding" paddle | same |
| 9 | `Billing.tsx:361` | credit tile | `OptionTile` (md/neutral) |
| 10 | `BillingFree.tsx:338` | credit tile, copy 2 | `OptionTile` (md/neutral) |
| 11 | `SetupCredits.tsx:59` | credit tile, copy 3 | `OptionTile size="lg" tone="accent"` |
| 12 | `DashboardDefault.tsx:163` | BYOK/PAYG toggle | `MiniRadioGroup` / `MiniRadio` |
| 13 | `EventsTable.tsx:574` | "Mark invalid" | `ExpandingAction` |

Cleanups that follow: `ApiKeys` drops its `useCopyFeedback` import and the now-
unused `Copy` icon; `RequestDetailBody` drops the local `paddle` const;
`ConversationsTrace` / `RequestsFindings` / `onboarding-shared` drop
`ChevronLeft`.

### 7.3 Known visual deltas — accepted, not accidental

Every one is a primitive's own value replacing a call-site override. **If any is
wrong, the fix is a variant on the primitive, never a `className` at the call
site.**

| Where | Before | After |
| --- | --- | --- |
| Composer send key | `text-primary-foreground-soft` | `text-primary-foreground` |
| Reply action glyphs | `rounded-xs`, `hover:bg-accent` | `rounded-sm`, `hover:bg-muted` (ghost's own) |
| Ask AI empty-state rows | 44px tall, 20px icon | 36px tall, 16px icon (`xl` deleted) |
| AuditTrail info glyph | no hover chip, 8px hit area | 24px hover chip, 12px hit area |
| Policies chevron | `rounded-md`, press `0.96` | `rounded-xs`, press `0.98` |
| Finding paddles | `rounded-xs`, `disabled:opacity-40` | `rounded-sm`, `disabled:opacity-50` |

---

## 8. Deliberate non-changes — DO NOT "FIX" THESE

Six raw `<button>` elements remain outside `src/components/ui/`. Each was
assessed and left. **The test:** is this a *single definition* (a component whose
job is to be that control), or is it *duplicated chrome pasted across files*?
Only the second is the failure `no-handrolling.md` targets.

| File:line | Why it stays |
| --- | --- |
| `requests/RequestDetailBody.tsx:676` | Disclosure trigger. A native `<button aria-expanded>` **is** the correct element; there is no Button case here. |
| `requests/RequestDetailBody.tsx:569` | Category-tinted finding chip with an interactive/static split. Single definition — it *is* the component. |
| `DashboardDefault.tsx:701` | Full-bleed 48px card-list row. `RowActionButton` is table-only. |
| `conversations/RequestTracePanel.tsx:247` | Timeline step with an absolutely-positioned track segment. Same. |
| `SetupManual.tsx:431` | Option row in a bespoke search-filter model picker. Correct target is the `Menu`/`Select` primitive, but that means rebuilding the picker — a feature change, not a button swap. Tracked, not done. |
| `components/canvas/Artboard.tsx:156` | Dev-only canvas tooling, not product surface. |

Also intentionally left inside `src/components/ui/`: `text-link.tsx`,
`row-action-button.tsx`, `segmented.tsx`, `sidebar.tsx` (nav is not a button
role), `table.tsx` sort header, `tag.tsx` 14px remove ×, `code-card.tsx` and
`multi-select.tsx` (list/menu rows). A primitive rendering a native `<button>`
is correct — that is what a primitive *is*.

**Still open (not done in either build):** `icon-action-button.tsx` is a parallel
icon-button primitive that could fold into `Button`; `copy-button.tsx`'s 20px
glyph sits below `icon-xs`; `feedback-fab.tsx` is a 48px circle and was
**explicitly kept as-is** — there is no 48px button and adding one would reopen
the scale question.

---

## 9. Verification — all four must pass

```bash
npx tsc -b        # must exit 0 — this is what catches stale lg/xl/icon-lg
npm run lint      # eslint + ultracite + lint:design, all clean
```

Then in the browser (dev server on **port 3000**), walk the routes and census
button heights. This is the real proof:

```js
// paste in devtools console on the running app
const routes = ['/overview','/messages','/api-keys','/team','/billing','/limits',
  '/audit-trail','/security','/activity','/policies','/sign-in','/setup-manual'];
const tally = {}, over = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const r of routes) {
  history.pushState({}, '', r);
  dispatchEvent(new PopStateEvent('popstate'));
  await sleep(400);
  for (const b of document.querySelectorAll('[data-slot="button"]')) {
    const h = Math.round(b.getBoundingClientRect().height);
    if (!h) continue;
    tally[h] = (tally[h] || 0) + 1;
    if (h > 36) over.push(`${r} ${h}px "${b.textContent.trim().slice(0,30)}"`);
  }
}
console.log(tally, [...new Set(over)]);
```

**Expected:** heights cluster at **24 / 32 / 36**, and `over` is **empty**.
Transient odd values (30/31/34/35) are elements measured mid
`active:scale-[0.98]` transition — re-run and they move. A *stable* value above
36 is a real miss.

Targeted checks worth running:

- Top bar — "Ask AI", "Docs", workspace switcher: computed padding must be
  **10px left and right**, height 36px.
- `/billing` → "Add credits" dialog: the four tiles must be
  `role="radio"`, 40px tall, 8px radius.
- Console must be **error-free** across all routes.

Final AST scan — page-level raw `<button>` count must be **6**, matching §8:

```bash
grep -rn "<button" src --include="*.tsx" | grep -v "src/components/ui/" | grep -v "^\s*\*"
```

---

## Appendix A — non-Button changes shipped the same day

Not part of the Button system, but they touch the same files and the same
parity requirement. Port these too or the two builds diverge:

| Change | Files |
| --- | --- |
| Ask AI panel **starts closed on every page load**; the `askai` localStorage persist is removed. State stays above the router outlet so one open holds for the session across navigation. | `src/App.tsx` |
| Composer **auto-focuses** on panel open (deferred one frame so the Sheet's initial-focus pass cannot steal the caret) and on **New chat** — but deliberately **not** after send, so the field is not lit while the agent replies. | `ui/ask-ai-panel.tsx`, `ui/ask-ai-composer.tsx`, `DashboardChrome.tsx` |
| `reset()` on the thread hook — New chat drops every turn through the same `interrupt()` path as stop. | `hooks/use-ask-ai-thread.ts` |
| Thread → composer spacing `gap-4` → **`gap-6`** (16px → 24px). The scroll-to-latest FAB anchors to the same gap and moved with it. | `ui/ask-ai-panel.tsx` |
| Ask AI **empty state** (new file): four suggestion rows, `Button variant="outline" shape="pill" size="default"`. | `ui/ask-ai-empty-state.tsx` |

---

## Change inventory — quick checklist

- [ ] §2 `--border-hover` token, both themes + `@theme inline` utility
- [ ] §3.1 symmetric `px-2.5` icon padding (xs / sm / default)
- [ ] §3.2 `default` → `h-9`; **delete** `lg`, `xl`, `icon-lg`; `icon` → `size-9`
- [ ] §3.3 `shape` variant (default / pill / circle)
- [ ] §3.4 `variant="raised"`
- [ ] §3.5 `outline + pill` compound variant
- [ ] §4.1 codemod, both passes (63 + 6)
- [ ] §4.2 two prop defaults
- [ ] §4.3 four stale comments
- [ ] §5 seven `data-icon` markers + icon size-class cleanup
- [ ] §6 five primitives (4 new files + `CopyButton size="segment"`)
- [ ] §7.1 four circular buttons → `Button`
- [ ] §7.2 thirteen page-level conversions
- [ ] §8 confirm the six exceptions are **left alone**
- [ ] §9 tsc + lint + browser census + AST scan
- [ ] Appendix A — five non-Button changes
- [ ] Appendix B — full primitive source copied verbatim

---

## Appendix B — full source for the new primitives

Create these files verbatim. Every recipe is copied from the hand-rolled
original it replaces, which is why the extraction moves zero pixels. Do not
"clean up" the class strings — they are the contract.

### `src/components/ui/back-link.tsx` — BackLink

```tsx
import { ChevronLeft } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─── BackLink — the back-breadcrumb above a detail page ────────────────────
 * Extracted 2026-07-28 from three byte-identical hand-rolled copies:
 * `ConversationsTrace.tsx`, `RequestsFindings.tsx`, and `SetupBackLink` in
 * `onboarding-shared.tsx`. The recipe below is those copies VERBATIM — this
 * extraction moves no pixels.
 *
 * NOT `TextLink`. TextLink is the underlined inline-prose affordance; this is
 * a chevron + label breadcrumb with no underline at all. Routing one into the
 * other would have added an underline to every detail page.
 *
 * The pieces that matter, none of which a call site should restate:
 *   · `after:-inset-y-3` — an invisible 12px vertical hit area, so a 20px-tall
 *     label is a comfortable target without occupying the space.
 *   · `group-hover:-translate-x-px` — the chevron nudges 1px left on hover.
 *   · `active:scale-[0.98]` press + the reduced-motion opt-outs, matching
 *     every other pressable control (design.md §5).
 * ───────────────────────────────────────────────────────────────────────── */

const BACK_LINK_BASE =
  "type-label-14 group relative inline-flex w-fit items-center gap-1 rounded-xs text-muted-foreground transition-[colors,scale] duration-150 ease-out after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

export type BackLinkProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "children"
> & {
  /** The destination's name — "Conversations", "Messages", "Setup". */
  label: string;
};

export function BackLink({ label, className, ...rest }: BackLinkProps) {
  return (
    <button className={cn(BACK_LINK_BASE, className)} type="button" {...rest}>
      <ChevronLeft
        aria-hidden
        className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        strokeWidth={1.75}
      />
      {label}
    </button>
  );
}
```

### `src/components/ui/option-tile.tsx` — OptionTile

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─── OptionTile — one choice in a radiogroup ───────────────────────────────
 * Extracted 2026-07-28 from three hand-rolled copies: the credit-preset grids
 * in `Billing.tsx`, `BillingFree.tsx`, and `SetupCredits.tsx`.
 *
 * Deliberately NOT a `Button`. These live inside `role="radiogroup"` and carry
 * `role="radio"` + `aria-checked` — they are a single-choice control, and a
 * screen reader must hear "2 of 4 selected", not "button". Routing them into
 * `Button` would have given correct chrome and wrong semantics. The element
 * stays a native `<button>` (focusable, Enter/Space) with the radio role on
 * top, which is the standard composite-widget pattern; the PARENT owns arrow-
 * key roving tabindex where it wants it (Billing does, SetupCredits doesn't).
 *
 * `tone` and `size` exist ONLY to preserve the three call sites exactly as
 * they render today — see the note under `tone`. They are not an invitation
 * to add a fourth look.
 * ───────────────────────────────────────────────────────────────────────── */

const optionTileVariants = cva(
  "flex items-center justify-center border tabular-nums outline-none transition-[colors,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        /** 40px — the billing credit grid. */
        md: "h-10 rounded-md font-medium font-sans text-sm",
        /** 48px — the setup-credits grid, which sits on a roomier page. */
        lg: "type-label-14 h-12 rounded-sm",
      },
      /* NOTE (2026-07-28): `neutral` and `accent` encode a REAL inconsistency
         that predates this extraction — /billing marks the chosen amount with
         a neutral fill, /setup-credits marks it blue. Both are reproduced
         verbatim so this refactor moves no pixels. Picking one is a design
         decision, not a refactor; flagged in audits/button-audit-7-28.md. */
      tone: {
        neutral: "",
        accent: "",
      },
      selected: { true: "", false: "" },
    },
    compoundVariants: [
      {
        tone: "neutral",
        selected: true,
        className: "border-border bg-muted text-foreground",
      },
      {
        tone: "neutral",
        selected: false,
        className: "border-border bg-card text-foreground hover:bg-accent",
      },
      {
        tone: "accent",
        selected: true,
        className:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300",
      },
      {
        tone: "accent",
        selected: false,
        className: "border-border bg-card text-foreground hover:border-input",
      },
    ],
    defaultVariants: { size: "md", tone: "neutral", selected: false },
  }
);

export type OptionTileProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked"
> &
  VariantProps<typeof optionTileVariants> & {
    /** Drives both `aria-checked` and the selected styling. */
    selected: boolean;
  };

export function OptionTile({
  className,
  selected,
  size,
  tone,
  children,
  ref,
  ...rest
}: OptionTileProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      aria-checked={selected}
      className={cn(optionTileVariants({ size, tone, selected }), className)}
      ref={ref}
      role="radio"
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
}
```

### `src/components/ui/mini-radio-group.tsx` — MiniRadioGroup / MiniRadio

```tsx
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─── MiniRadioGroup — 32px bordered track of 24px choices ──────────────────
 * Extracted 2026-07-28 from the hand-rolled BYOK / PAYG mode switch in
 * `DashboardDefault.tsx`. Recipe verbatim; this moves no pixels.
 *
 * NOT `Segmented`, and the difference is not size. Segmented is a MUTED track
 * with a raised card thumb; this is a CARD track with a muted thumb — the two
 * are inverted, so routing this into Segmented would have repainted it. It is
 * also a `role="radiogroup"` (single choice, announced as radios), where
 * Segmented is a view switcher.
 *
 * If a second consumer ever appears, reconcile the two rather than adding a
 * third look.
 * ───────────────────────────────────────────────────────────────────────── */

export function MiniRadioGroup({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-border bg-card px-1",
        className
      )}
      role="radiogroup"
      {...rest}
    >
      {children}
    </div>
  );
}

export type MiniRadioProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked"
> & {
  selected: boolean;
};

export function MiniRadio({
  className,
  selected,
  children,
  ...rest
}: MiniRadioProps) {
  return (
    <button
      aria-checked={selected}
      className={cn(
        "type-label-12 flex h-6 items-center rounded-xs px-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-muted-foreground",
        className
      )}
      role="radio"
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
}
```

### `src/components/ui/expanding-action.tsx` — ExpandingAction

```tsx
import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─── ExpandingAction — 32px icon key that opens to reveal its label ────────
 * Extracted 2026-07-28 from the hand-rolled "Mark invalid" control in
 * `security/EventsTable.tsx`. Recipe verbatim; this moves no pixels.
 *
 * Deliberately NOT a `Button` variant. Width-on-hover is not button behavior —
 * a Button is a fixed box whose contents may change, this is a box that
 * CHANGES SIZE under the pointer and reflows what sits next to it. Putting
 * that on `Button` would make every button in the app capable of resizing
 * itself, which is not a capability the primitive should have.
 *
 * The mechanics, none of which a call site should restate:
 *   · `w-8` → `hover:w-30` / `focus-visible:w-30`, eased on the drawer curve
 *     over 300ms while the press scale stays on the standard 150ms out curve.
 *   · The label is present in the DOM at all times (`opacity-0` → `100`), so
 *     the accessible name and the hit target never depend on hover state.
 *   · `after:-inset-2` keeps a comfortable target at the collapsed 32px.
 * ───────────────────────────────────────────────────────────────────────── */

export type ExpandingActionProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "children" | "aria-label"
> & {
  "aria-label": string;
  icon: LucideIcon;
  /** The text revealed on hover / focus. */
  label: string;
};

export function ExpandingAction({
  className,
  icon: Icon,
  label,
  ...rest
}: ExpandingActionProps) {
  return (
    <button
      className={cn(
        "type-label-12 group/mark relative inline-flex h-8 w-8 shrink-0 items-center overflow-hidden whitespace-nowrap rounded-sm border border-border bg-card text-foreground outline-none [transition:width_300ms_var(--ease-drawer),scale_150ms_var(--ease-out)] after:absolute after:-inset-2 after:content-[''] hover:w-30 hover:bg-accent focus-visible:w-30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      type="button"
      {...rest}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center">
        <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
      </span>
      <span className="pr-3 opacity-0 transition-opacity duration-200 ease-out group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100">
        {label}
      </span>
    </button>
  );
}
```

### `src/components/ui/copy-button.tsx` — add the `segment` label size

Three edits to the existing file.

**1. Extend the size union and document it:**

```diff
+ *   - 'segment' : full-height flush segment of a SPLIT WELL — no radius, no
+ *                 border except the left hairline divider, stretches to the
+ *                 well's height. For the "value | Copy" merged surface (the
+ *                 ApiKeys reveal-key dialog). Added 2026-07-28: that dialog
+ *                 had hand-rolled this exact chrome because no mode fit, and
+ *                 `compact`/`sm` would float a short button inside a taller
+ *                 well. The recipe below is the hand-rolled one verbatim.
   */
- export type CopyLabelSize = "compact" | "sm";
+ export type CopyLabelSize = "compact" | "sm" | "segment";
```

**2. In the `mode === "label"` branch, add the segment recipe to the `cn()`:**

```diff
          labelSize === "compact" &&
            "h-6 gap-1 px-2 font-medium text-muted-foreground hover:text-foreground",
+         // Flush split-well segment: kill the primitive's radius, border,
+         // and fixed height so the segment IS the well's right-hand half.
+         labelSize === "segment" &&
+           "type-label-14 h-auto self-stretch rounded-none border-0 border-border border-l bg-transparent px-4 text-muted-foreground shadow-none hover:bg-accent hover:text-foreground",
          className
```

**3. Route it to the 32px size step:**

```diff
-       size={labelSize === "sm" ? "sm" : "xs"}
+       size={labelSize === "sm" || labelSize === "segment" ? "sm" : "xs"}
```

**Call site** (`src/pages/ApiKeys.tsx`, inside the reveal-key dialog's split
well). The whole hand-rolled `<button>` collapses to:

```tsx
<CopyButton label="API key" mode="label" size="segment" value={fullKey ?? ""} />
```

Then delete the now-unused `useCopyFeedback` import, its `const { copied, trigger }`
destructure, and the `Copy` icon import from that file.
