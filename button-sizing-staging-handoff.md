# Handoff — Button & Form-Control Sizing System (2026-07-16)

**Audience:** the engineering agent applying these changes to the **staging build**.
**Source of truth:** this repo (`gate-ai-build`, branch `dev`) + [`design.md`](./design.md).
**Trace the work:** `change-logs/changelog-7-16.md` and the commits below.

| Commit | What landed |
| --- | --- |
| `9a9cfd5` | twMerge `font-size` group fix; SegmentedPill internal padding; Overview title |
| `70b9b6e` | **Button / Input / Select size scale + explicit-size sweep** (the main change) |
| `c0d5fac`, `5f70b84` | changelog stamps for the two above |

> Everything below is already shipped on `dev` in this repo. The task is to bring the **staging build** in line with it. Where staging's component code differs, port the *intent* (the scale + the rules), not necessarily the literal diff.

---

## 1. TL;DR

We moved all form controls (`Button`, `Input`, `Select`) onto a **shadcn-aligned size scale** and made every button declare its size explicitly.

- **New scale:** `default` = **32px** (`h-8`), `lg` = **36px** (`h-9`), both with **flat 12px (`px-3`)** left/right padding.
- **Old scale (being replaced):** `default` = 40px (`h-10`, `px-4`/16px), `lg` = 48px (`h-12`).
- **Migration rule:** any control that was **40px → `lg`**; anything that was **32px → `default`/`sm`**.
- **Every `<Button>` now carries an explicit `size` prop.** No implicit defaults. This is required so buttons can later be made responsive per breakpoint.
- **No hand-rolled buttons.** A real button/CTA/icon-button uses `<Button>`. A card / row / tile / toggle is *not* a button and stays as-is.

---

## 2. The new size scale (exact values)

### Button (`src/components/ui/button.tsx`)

| size | height | H-padding | icon-adjacent | text | before |
| --- | --- | --- | --- | --- | --- |
| `xs` | 24px (`h-6`) | 12px (`px-3`) | 8px (`pr-2`/`pl-2`) | `text-xs` | unchanged |
| `sm` | 32px (`h-8`) | 12px (`px-3`) | 8px | `text-xs` | unchanged |
| `default` | **32px (`h-8`)** | **12px (`px-3`)** | **8px (`pr-2`/`pl-2`)** | `text-sm` | was 40px / `px-4` |
| `lg` | **36px (`h-9`)** | **12px (`px-3`)** | **8px** | `text-sm` | was 48px / `px-4` |
| `icon-xs` | 24px (`size-6`) | — | — | — | unchanged |
| `icon-sm` | 32px (`size-8`) | — | — | — | unchanged |
| `icon` | **32px (`size-8`)** | — | — | — | was `size-10` (40px) |
| `icon-lg` | **36px (`size-9`)** | — | — | — | was `size-12` (48px) |

### Input (`src/components/ui/input.tsx`)

| size | height | H-padding | before |
| --- | --- | --- | --- |
| `xs` | 28px (`h-7`) | 12px (`px-3`) | unchanged |
| `sm` | 32px (`h-8`) | 12px (`px-3`) | unchanged |
| `default` | **32px (`h-8`)** | **12px (`px-3`)** | was 36px / `px-4` |
| `lg` | **36px (`h-9`)** | **12px (`px-3`)** | was 40px / `px-4` |

### Select trigger (`src/components/ui/select-variants.ts`)

Select keeps **asymmetric** padding (`pl-3 pr-2` = 12px text side / 8px chevron side) at **all** sizes — do not symmetrize it.

| size | height | padding | before |
| --- | --- | --- | --- |
| `xs` | 28px (`h-7`) | `pl-3 pr-2` | unchanged |
| `sm` | 32px (`h-8`) | `pl-3 pr-2` | unchanged |
| `default` | **32px (`h-8`)** | **`pl-3 pr-2`** | was 36px / `pl-4 pr-3` |
| `lg` | **36px (`h-9`)** | **`pl-3 pr-2`** | was 40px / `pl-4 pr-3` |

---

## 3. Core mechanism change — twMerge `font-size` group (REQUIRED first)

**File:** `src/lib/utils.ts` (commit `9a9cfd5`).

`cn()` now uses `extendTailwindMerge` to register every custom typography utility (`type-heading-*`, `type-copy-*`, `type-label-*`, `type-input-helper`) into Tailwind's `font-size` conflict group.

**Why it matters:** without this, a primitive's baked-in typography class (e.g. `CardTitle`'s `type-heading-16`) and a `className` override both land on the element, and CSS source order silently decides the winner — so the override is *dead*. After the fix, a `className` (and its `lg:` variants) cleanly replaces the primitive default, with **no `!important`**.

**Staging action:** if staging uses the same custom `type-*` utilities + vanilla `twMerge`, port this `extendTailwindMerge` config first. If staging doesn't use custom type utilities, skip — but then confirm typography overrides on primitives actually apply.

---

## 4. Component-specific changes

- **SegmentedPill** (`segmented-pill.tsx`, `9a9cfd5`): internal rail buttons are now **12px (`px-3`)** L/R at **both** sizes. The rail sets `data-spacing=0`, whose `ToggleGroupItem` variant `group-data-[spacing=0]/toggle-group:px-2` forces 8px — a plain `px-*` base can't beat it, so you must override the **same variant** (`group-data-[spacing=0]/toggle-group:px-3`). Rail height: `sm` 32px / `default` 40px; item height: `sm` 24px / `default` 32px.
- **WorkspaceSwitcher** (`workspace-switcher.tsx`, `70b9b6e`): was a **hand-rolled `<button>`** with a hardcoded `h-10`; now renders the `Button` primitive (`variant="outline"`, `size="lg"` = 36px). This is the pattern to follow for any hand-rolled trigger.
- **AlertDialogCancel** (`alert-dialog.tsx`) and **ApiKeys `CreateKeyButton`** (`ApiKeys.tsx`): default `size` bumped to `lg` (they were 40px dialog/CTA buttons). Note `AlertDialogContent`'s `size` prop is the dialog **max-width**, not a button — leave it.
- **Overview "Tokens used" title** (`Dashboard.tsx`, `9a9cfd5`): `type-heading-18 lg:type-heading-16` (only renders correctly because of the twMerge fix in §3).

---

## 5. Migration rules (how to size each button)

1. **Was 40px (old `default`, explicit or implicit) → `size="lg"`.** This includes every button with **no `size` prop** (they inherited the old 40px default).
2. **Was 32px (old `sm`) → keep `sm` (or `default`, both 32px now).**
3. **Was 48px (old `lg`) → stays `lg`** (now renders 36px).
4. **Icon buttons follow the same rule:** old `size="icon"` (40px) → `size="icon-lg"` (36px); `icon-sm` (32px) stays.
5. **Every `<Button>` must end up with an explicit `size`.** No implicit defaults.

**How we did the sweep safely (recommended for staging):** do **not** use a naive regex — JSX arrow-function bodies contain `>` and apostrophes-in-comments (`isn't`) which corrupt hand-rolled scanners (we hit this). Use the **TypeScript compiler AST** to find `JsxOpeningElement`/`JsxSelfClosingElement` with tag `Button`, read/inject the `size` attribute, then run `ultracite fix` + `tsc -b` + spot-check in-browser. ~46 call sites were touched here.

---

## 6. "A button is a button; a card is not a button"

When eliminating hand-rolled `<button>` elements, **convert only real buttons**:

- **Convert → `<Button>`:** CTAs, action buttons, and **icon buttons** (an icon button is just a Button without a label → `<Button size="icon-*" variant="ghost">`, icon as child, no sizing class on the icon).
- **Leave raw (these are NOT buttons):** clickable **cards**, table/list **rows**, **radio tiles** (`aria-checked`), **segmented/toggle** options (`aria-pressed`), and **menu options**. Forcing these into `<Button>` wraps them in button chrome and breaks layout.

**Audit result in this repo (for reference):** the genuine action buttons already use `<Button>`. The remaining raw `<button>`s are either DS primitives (`row-action-button`, `text-link`, `icon-action-button`, `tag`, `segmented`, `sidebar`, `calendar`, `table` sort-header, etc.) or the card/row/tile/toggle category above — all correctly left raw.

**4 deferred borderline cases** (genuine buttons that resist a clean swap — decide per-case, do NOT force `className` overrides onto a variant):

- `security/EventsTable.tsx` "Mark invalid" — width-morphs on hover (no variant reproduces the reveal).
- `ApiKeys.tsx` copy segment — fused flush into the key well (`border-l`, no own radius).
- `AuditTrail.tsx` info-icon — a `TooltipTrigger` render target; a ghost icon Button adds hover fill.
- `requests/RequestDetailBody.tsx` prev/next paddles — custom `rounded-xs` recipe needing ~7 overrides.

---

## 7. Staging checklist

- [ ] Port the twMerge `font-size` group (§3) if staging uses custom `type-*` utilities.
- [ ] Update `Button` size variants to the §2 scale (default 32/`px-3`, lg 36/`px-3`, icon `size-8`, icon-lg `size-9`, icon-adjacent `pr-2`/`pl-2`).
- [ ] Update `Input` size variants (§2).
- [ ] Update `Select` trigger size variants (§2) — keep `pl-3 pr-2` asymmetry.
- [ ] Standardize `SegmentedPill` internal padding to `px-3` via the `group-data-[spacing=0]` override (§4).
- [ ] Sweep **every** `<Button>` to an explicit `size` using the migration rules (§5) via the AST method.
- [ ] Refactor hand-rolled trigger buttons (e.g. workspace switcher) to `<Button>` (§4/§6); leave cards/rows/tiles/toggles raw.
- [ ] Bump dialog-action / CTA button defaults that were 40px → `lg` (§4).
- [ ] Verify: `tsc` clean, lint clean, and in-browser — no button/input/select shrank unintentionally; touch targets read correctly; nothing overflows a toolbar.

## 8. Not in scope yet (future)

- **Responsive sizing.** This pass is **desktop only**. The end goal is per-breakpoint sizing (e.g. `default` on desktop, `lg` on tablet/mobile for bigger touch targets). The explicit-`size`-everywhere work is the prerequisite; the responsive mechanism (responsive `size` prop or breakpoint variants) is a separate task.

---

## 9. References

- [`design.md`](./design.md) — authoritative. Updated this session: `components.button-default` / `input` / `select-trigger` token blocks, the Buttons / Inputs / Select prose specs, SegmentedPill note, and the Touch-Targets section.
- [`change-logs/changelog-7-16.md`](./change-logs/changelog-7-16.md) — the three entries stamped `9a9cfd5` / `70b9b6e`.
- Files changed (this repo): `src/lib/utils.ts`, `src/components/ui/{button,input,select-variants,segmented-pill,alert-dialog,workspace-switcher}.tsx`, `src/pages/**` (button sweep), `design.md`, `data-model.md`.
