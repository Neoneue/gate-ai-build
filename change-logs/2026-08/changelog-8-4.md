# UI Changelog: 2026-08-04

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-3.md`](./changelog-8-3.md)

---

## Conventions

### Blue becomes a surface language for exactly one card — the `--promo-*` family

**`index.css`** · **`design.md`**

The rail is neutral by design: `--border`, `--foreground` and `--muted-foreground` all resolve to the gray ramp, and §2 says the primary is ink, "Not blue." The upgrade card is the one surface that inverts that, and it needs a border, a foreground, an accent, a texture ink, a wash and a shadow tint — none of which the semantic layer could supply.

- **Six roles, defined once, in both themes.** `--promo-border` (blue-200 / blue-400 @ 50%), `--promo-foreground` (blue-900 / blue-100), `--promo-accent` (blue-500 / blue-400), `--promo-dot` (blue-700 / blue-200 @ 25%), `--promo-wash`, `--promo-shadow` (blue-600 @ 12% / @ 40%). The first three are aliased into `@theme inline` so they arrive as `border-promo-border`, `text-promo-foreground`, `text-promo-accent`; the last three are read by CSS, so they deliberately do **not** get a `--color-*` alias that would offer `bg-promo-dot` as a plausible class meaning nothing.
- **Every value is a ramp atom, not a re-measurement.** The Figma file's blue ramp is identical to ours at all twelve steps — `blue-25` through `blue-950`, checked hex by hex — so the transcription is a lookup, not an eyeball.
- **No `--promo-surface`.** Figma's dark fill `#171717` *is* neutral-900 and its light fill is white, so `bg-card` already lands both. A seventh token would have been a duplicate of one that exists.
- **`--promo-wash` holds the whole gradient, not its stops.** The themes run it in opposite directions — light falls `blue-25 → blue-100` at 75%, dark rises `blue-500 @ 8% → 12%` and holds from the midpoint up. Two stop pairs plus a direction would have been three tokens saying one thing.
- **`--promo-shadow` is ink only.** The geometry stays Tailwind's `shadow-sm`, verbatim, per §5.0 — recolouring a stock step is a first-class Tailwind utility (`shadow-(color:…)`), not a bespoke shadow family. This sets the boundary the shadow-scale ruling left implicit: a per-theme alpha is allowed on a *component's* shadow ink, never on the scale.

### The 12px type floor opens one step down, and it is fenced

**`index.css`** · **`design.md`**

The Figma twins set the upgrade card's supporting line at Geist Regular 10/14. There was no 10px in the scale — the `@theme` block said so in as many words ("sub-12px sizes are out of scale by policy") — and `text-[10px]` is a build failure.

- **`--text-2xs` (10px / 14px) and the `type-copy-10` voice.** Named rather than arbitrary, so every 10px in the codebase is one greppable class and the linter's ban on bracketed pixel sizes still holds. The app already carried two hand-rolled 10px labels on that linter's allowlist (`monogram.tsx`, the Gate Connect pill) — which is exactly the drift a floor is supposed to prevent, and the argument for naming the step instead of adding a third exception.
- **Fenced to one role in writing.** `design.md` §3 "Micro tier" states it is not a fallback for tight space (the answer to copy that does not fit at 12px is less copy or more room), never a body voice, and that raw `text-2xs` is not a call-site class. A fourth consumer means editing that paragraph.

### The 4px grid governs layout, not graphics — and `gap-0.5` was never a graphics value

**`design.md`** · **`ui/sidebar-upgrade-card.tsx`**

The card's copy block sets `itemSpacing: 2` in Figma, which was briefly adopted as a second sanctioned half-step beside `Button`'s `px-2.5`. Reverted the same day.

- **The scope rule, stated by the user:** the 4px grid applies to components and elements — type, padding, gaps, sizing — not to "little things like dot grid graphics." So the texture's 10.5px pitch and 0.375px dot radius are **not** grid violations and should never have been treated as the same category.
- **But the title/description gap is layout, not graphics.** It spaces two text elements, which is squarely in scope. Rounded to `gap-1` (4px) and the §4 carve-out list was removed, leaving `Button`'s `px-2.5` as the one sanctioned half-step, documented where it already lived in `.claude/rules/design-tokens.md`.
- **Net:** the contract is unchanged from where it started today. One exception, not two.

---

## Components

### `SidebarUpgradeCard` — the upgrade CTA, 1:1 from the Figma twins

**`ui/sidebar-upgrade-card.tsx`** *(new)* · **`ui/sidebar.tsx`** · **`index.css`**

Built from `sidebar-footer-light` (1255:6256) and `sidebar-footer-dark` (1256:6340). Every value traces to a node property on one of those two frames rather than to a screenshot: 8px radius, 12px padding, 1px inside border, `shadow-sm` geometry tinted blue, a 12/16 Geist Medium title, a 2px gap, a 10/14 Geist Regular line at 70%, and a 24px sparkle at 50% inset 8px from the top right.

- **Width-flexible, not 220px.** The two twins draw the card at 220 and 248 wide inside 236 / 264 rails — that is the spec saying "fill the container." Height follows content; nothing is pinned.
- **The sparkle is the project's own `<SparklesIcon>`, verified by path data, not by name.** All five subpaths in the Figma vector match the component's `d` attributes exactly once the 2px viewBox offset is applied (`M 17.998 1 L 17.998 5` → `M20 3v4`, and so on). It is the same lucide glyph, so no asset was exported.
- **Rest state is the frame; interaction is house convention, not invention.** It is a real `<button>`, which means `<SparklesIcon>` picks up its closest-button hover retrofit for free — the card gets a designed hover moment without a single new value. Press is the global `active:scale-[0.98]`, focus the standard `ring-3 ring-ring/50`, both `motion-reduce`-gated.
- **`aria-hidden` on the texture, and the card sits outside the `<nav>` landmark** — it is a promo, not a destination. The accessible name reads "Upgrade to Pro plan Unlock premium security and compression settings for your team", verified against the computed a11y tree rather than `textContent`.

### The dot field is CSS, not a 2× PNG pair

**`index.css`**

Figma paints the texture as a pattern fill: an 8px frame holding a 1px dot, tiled `HORIZONTAL_HEXAGONAL` at `scalingFactor` 0.75 with 0.75 spacing. That resolves to a staggered grid on a **10.5px pitch carrying a 0.75px dot** — confirmed against a 6× isolated render of the frame before a line was written.

- **Two radial-gradients on a 10.5 × 21 tile**, dots at 25%/25% and 75%/75%. That *is* the stagger: the second dot sits half a pitch (5.25px) right and a full pitch (10.5px) down. Resolution-independent, no bytes, and the pitch holds as the rail resizes — which is what a texture should do. Same reasoning as `.ask-ai-canvas`.
- **Keeping both dots off the tile edges is load-bearing, not tidiness.** A tile paints only its own copy of each gradient, so a dot centred on the seam renders as a permanent half-dot with nothing completing it.
- **Layer order is inverted from Figma's.** Its fills array reads bottom-up; CSS paints the first background layer on top. Same stack, written the other way round — wash leads, dots sit under it.

### The Policies free-plan banner now wears the same promo surface

**`pages/Policies.tsx`**

The banner was painting itself out of raw ramp steps — `border-blue-200 bg-blue-25 dark:border-blue-400/30 dark:bg-blue-500/10` — which is hardcoding by another name (`no-hardcoding.md`): four theme-independent values standing in for two semantic roles. It now reuses the `--promo-*` family and the `.sidebar-upgrade-texture` utility verbatim from `SidebarUpgradeCard`, so the two upgrade prompts on a free workspace read as one surface instead of two similar blues.

- **`border-promo-border text-promo-foreground shadow-sm shadow-(color:--promo-shadow)`**, and the surface drops to `Card`'s own `bg-card` rather than re-stating it. Nothing new was added to `index.css` or `design.md`.
- **The texture needed no changes to fill a 1024 × 66 box.** Its wash is sized `100% 100%` and the dot tile repeats, so the same utility that fits a 220px rail card fits a full-width banner at the same 10.5px pitch. Verified at **DPR 1** — the band under the copy carries 2.3% dot-core pixels in light and 2.2% in dark, matching the tile's expected coverage, so the sub-pixel dot survives an unscaled display in both themes.
- **`relative` on the `Card` and on the `CardContent`** — the first gives the full-bleed texture a positioning context, the second lifts the copy back above it. `Card` already ships `overflow-hidden`, so the texture's corners are clipped for free.
- **The copy takes the promo ink at two strengths**, mirroring the card's title/description split: the lead-in at full `text-promo-foreground` (15.8:1 light, 13.9:1 dark) and the sentence at `/70` (6.8:1 light, 7.4:1 dark). The nesting is why this is an alpha modifier and not the card's `opacity-70` — an opacity there would drag the lead-in down with it.

### Two texture-level tuning passes — a quiet twin, and a brighter dark chat canvas

**`index.css`** · **`pages/Policies.tsx`**

Two separate dot fields got dialled in once they were seen in place. Both changes move a level, never a pitch or a geometry.

- **`.sidebar-upgrade-texture-quiet` — the promo field turned down for a wide surface.** The tile pitch is fixed, so a 1024 × 66 box shows far more tiles per eyeful than a 220px rail and the same field reads heavier there. Three levers, all scoped to the modifier so the rail card is untouched: ink to **78.75%** via a new `--promo-dot-strength` multiplier folded into the dot colour with `color-mix`; pitch **10.5px → 14px** via `--promo-dot-pitch`, with the tile derived as `pitch × 2` and the dots left at their proportional 25%/75% positions so they re-stagger for free; and in dark only, the wash's bottom stop **8% → 7.2% blue**, letting more of the neutral-900 surface through at the floor so the banner sits down instead of glowing off the near-black page.
- **Why the wash override is declared on the element, not the token.** `--promo-wash` is substituted where it is *read*, so a local redeclaration on the texture div wins. Editing a stop inside the `:root` definition would not have worked: custom properties resolve their own `var()`s at the declaring element, so a descendant cannot reach into an already-resolved token. Light is deliberately untouched — its wash runs the other way (`blue-25 → blue-100`, `to bottom`), where "darker at the bottom" means *more* blue, the opposite edit.
- **`--ask-ai-canvas-strength` 0.3 → 0.375 and `--ask-ai-canvas-fade-floor` 0.05 → 0.0625, dark only.** The chat canvas read too dim in place, effectively gone below the fade's midpoint. Both stops scale by the same 1.25 so the fade's *shape* is unchanged and only its level moves — raising the top stop alone would have steepened the gradient and left the lower panel exactly as faint. Light stays at 0.8 / 0.15.

### `Button` gets a `promo` variant, and the white ring around the upgrade key goes away

**`ui/button.tsx`** · **`index.css`** · **`design.md`** · **`pages/Policies.tsx`** · **`pages/pro-upgrade-card.tsx`** · **`pages/plan-comparison-dialog.tsx`** · **`pages/TokenSavings.tsx`** · **`ui/feedback-fab.tsx`**

Six call sites had each pasted the same string into a `className` — `bg-blue-700 text-white shadow-blue-700/30 shadow-sm hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700` — which is `no-handrolling.md` in its purest form: fill, ink, shadow and hover all overridden on a primitive, in six places that could drift apart. It is now `variant="promo"`, and the six call sites carry nothing but layout (`shrink-0`, `w-full`).

- **The variant fixes a live bug, it does not just tidy the markup.** `Button`'s base is `border border-transparent bg-clip-padding`. The transparent border still reserves its 1px, and `bg-clip-padding` stops the fill at the padding box — so on a filled variant with no border colour, that 1px ring renders **whatever is behind the button**. Against the newly-tinted Policies banner it read as a white outline around the blue key. The variant sets an explicit border, so the ring paints on purpose.
- **The border is one ramp step lighter than its own fill, per theme** — blue-600 over a blue-700 fill in light, blue-500 over blue-600 in dark. Fixing it at the variant rather than by dropping `bg-clip-padding` from the base matters: the base is load-bearing for every bordered variant, and touching it would have moved every button on the site.
- **Five new tokens, both themes** — `--promo-cta` (blue-700 / blue-600), `--promo-cta-hover` (blue-800 / blue-700), `--promo-cta-border` (blue-600 / blue-500), `--promo-cta-foreground` (white, holds across themes) and `--promo-cta-shadow` (blue-700 @ 30%, holds across themes). They extend the existing `--promo-*` family rather than starting a new one. **The shadow is a new token, not a reuse of `--promo-shadow`:** that one is blue-600 at 12% under a pale card, this one is blue-700 at 30% under a solid blue key, and pointing the button at the card ink would have quietly cut its lift to a third in light.
- **Dark fill is 2.15:1 against the banner; the border is 3.53:1.** Measured on rendered pixels, not on the token values, so the banner's texture and wash are in the number. Light is 11.7:1 fill / 6.8:1 border. The dark fill alone sits under the 3:1 non-text minimum (WCAG 2.2 SC 1.4.11) — the new border is what carries the control boundary there, which is the argument for keeping it rather than a reason to move the ramp steps.
- **The feedback FAB stopped being a raw `<button>`.** It was the last of the four round keys the 7-28 audit found hand-rolling the circle recipe. It is now `variant="promo" shape="circle" size="icon"`; only the 48px box, the fixed anchor, the `right`-glide transition and the hover lift stay local — verified in-browser that the composed `transition` still resolves to `background-color, transform, right` at `.15s, .15s, .3s`, so the lockstep with the Ask AI panel is intact.

### Promo copy moves off the blue ink and onto the neutral text tokens

**`ui/sidebar-upgrade-card.tsx`** · **`pages/Policies.tsx`** · **`design.md`**

Titles take `text-foreground`, sub-copy takes `text-muted-foreground`, on both promo surfaces. The blue now belongs entirely to the *chrome* — border, texture, sparkle, shadow — and the words read as the app's own voice on top of it rather than as a second branded layer. **Supersedes the "copy takes the promo ink at two strengths" bullet earlier in this file.**

- **The `opacity-70` on the sidenav card's 10px line is gone.** `--muted-foreground` already encodes de-emphasis, and it does it as a real colour with a real contrast ratio in both themes instead of as a transparency that lands wherever the surface under it happens to be.
- **`--promo-foreground` now has no consumer.** Its only readers were the two surfaces above. It is left defined and flagged in `design.md` §2 rather than deleted in the same pass — it is a documented member of the family, and removing it is a separate call.
- **Two stale comments corrected in `sidebar-upgrade-card.tsx`** while the file was open: the header block still described the copy as sitting "at 70% opacity, both on `--promo-foreground`", and the note above the copy block still claimed the 2px gap was design.md's second sanctioned half-step — that carve-out was reverted earlier today and the gap is `gap-1`.

---

## Sections

### The rail grows a footer, and it obeys the tier signal that was already there

**`layouts/DashboardChrome.tsx`** · **`ui/sidebar.tsx`** · **`data-model.md`**

In Figma the card is the last child of `nav-list`, which is `SPACE_BETWEEN` — nav at the top, card pinned to the bottom. The `<nav>` here is already `flex-1`, so it takes the slack and the card lands in the same place one level out.

- **Rendering is gated by a route, not a boolean.** `Sidebar` / `SidebarPanel` take `upgradePath`; passing it renders the card, omitting it renders nothing. There is no `showUpgrade` flag to fall out of sync with the destination.
- **`DashboardChrome` derives it from `lib/plan.ts`** — `/billing-default` on `-default`, `/billing-free` on `-free`, `undefined` on PRO. That is the same signal driving the nav lock icons and the workspace badge, so the promo and the locks can never disagree. It lands on that tier's own Billing page, never the PRO one, so the CTA does not jump the user across workspaces.
- **Both `SidebarPanel` mounts get it** — the desktop rail via `<Sidebar>`, the mobile Sheet via `DashTopBar → MobileNav` — so the two never drift. The collapsed 64px rail has no variant: the design has none, and there is nowhere to put one.
- **Aligned `px-3` to the nav items, `pb-4` below.** The 16px is `nav-list`'s own bottom padding, measured off the frame.

Verified in-browser on both themes and both tiers: absent on `/overview`, present and clicking through to `/billing-free` and `/billing-default`, present in the mobile Sheet and absent from the hidden rail behind it.

### The CTA lands in the plan picker, not on the page — `?manage=1`

**`layouts/DashboardChrome.tsx`** · **`pages/BillingFree.tsx`**

Navigating to Billing left the user to hunt for the "Manage subscription" button, which is the whole point of the CTA. `upgradePath` now carries `?manage=1`, and `BillingFree`'s `PlanCard` reads it on mount to open `PlanComparisonDialog`.

- **No new pattern.** This is Limits' `?create=1` contract verbatim: seed `useState` from `searchParams.get("manage") === "1"`, strip with `setSearchParams(params, { replace: true })` on close so the URL reflects what is on screen and a re-mount cannot re-open the dialog.
- **State stays local to `PlanCard`.** It already owned `compareOpen`; the param reads and strips in the same component, so nothing is drilled through `BillingFree`.
- **One implementation, both routes.** `BillingDefault` is a re-export of `BillingFree`, so `/billing-default?manage=1` works without a twin edit.

Verified end to end: clicking the card lands on `/billing-free?manage=1` with the "Manage subscription" dialog open; closing it returns the URL to `/billing-free`.

### The rail moves to 236px to sit on the Figma column grid

**`ui/sidebar.tsx`**

The rail was `w-66` (264px) against a design measured at 236px. Read the frame's `layoutGrids` directly: 1536 wide, 12 columns, `STRETCH`, 24px gutter, 0 offset, so a column is `(1536 − 11×24) / 12` = **106px**. Every top-level region is an exact multiple — `sidebar` 236 = 2 cols + 1 gutter, `max-width-container` 886 = 7 cols + 6 gutters, the Ask AI panel 366 = 3 cols + 2 gutters. The rail was the one piece off it.

- **`w-66` → `w-59`** at both mounts plus the doc comment. 236px is on the 4px grid.
- **Fixed, not fluid.** The grid is `STRETCH`, so two *fluid* columns compute to ~193px at a 1280 viewport and truncate the longer nav labels. The rail is pinned at its 1536 value and `main-column` absorbs the flex.

Verified at 1536: rail measures 236, 0 of 14 nav labels clip or wrap, the bottom user row does not clip, and the upgrade card sits at 212 (236 minus the existing `px-3` gutters).

### Nav items land on 36px

**`ui/sidebar.tsx`**

The rows measured 38px: a 20px line box plus `py-2` (16) plus the 1px border on each side. Padding could not get there on the grid — `py-1.5` is a banned half-step and lands at 34 anyway — so the row is now sized directly.

- **`px-2 py-2` → `h-9 px-2`**, applied to all three variants (active, inactive, disabled) so they cannot drift apart. `h-9` is 36px and on the 4px grid; `box-sizing: border-box` absorbs the border, and the existing `items-center` centres the 20px line box in what is left.
- **The transparent border on the inactive variants stays.** It is what keeps the active row from shifting when the real border appears, and sizing the row explicitly does not remove the need for it.

Verified: all 14 rows measure exactly 36, active and inactive alike.

### Nav items sit flush; section titles keep their air

**`ui/sidebar.tsx`**

The section wrapper's `gap-1` applied to every child, so it spaced item-from-item and title-from-first-item with the same 4px. Only the first of those was wanted.

- **Wrapper `flex flex-col gap-1` → `flex flex-col`.** Item-to-item is now 0 and the rows read as one continuous list.
- **The title's spacing moves inside its own box: `Eyebrow` `pb-1` → `pb-2`.** It previously got 8px of separation as `pb-1` (4) plus the wrapper's `gap-1` (4); with the gap gone, the padding carries all 8 so the title-to-items rhythm is unchanged. Spacing that belongs to one element now lives on that element rather than being assembled from two sources.
- **`nav`'s own `gap-4` between sections is untouched**, so the group rhythm still reads.

Verified: item-to-item measures 0 across all 14 rows, title-ink-to-first-item still 8px. Tightening the list also cut ~52px of nav height, so the rail overflows its scroll region by 31px at a 900px viewport instead of ~83px.
