# UI Changelog: 2026-06-25

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-24.md`](./changelog-6-24.md)

---

## Conventions

### Spacing relaxed to a 4px grid `20627e3`

**`.claude/rules/design-tokens.md`, `feedback_4px-grid` memory**

- Retired the old "layout spacing is 8px-only" rule. Spacing (gap/padding/margin) is now any **4px multiple** — `gap-3` / `p-3` (12px) are allowed.
- Still banned: the `*.5` utilities (`gap-0.5`, `mt-1.5`, `px-2.5` = 2/6/10px), which break the 4px unit.

### Semantic text tokens site-wide `928999a`

**32 files across `src/pages` + `src/layouts`**

- Migrated raw neutral text ramps to the semantic token layer: `text-neutral-500/700/800` → `text-muted-foreground` / `text-foreground`. No visual change intended; binds visible text to tokens instead of the ramp.

### `blue-25` documented `20627e3`

**`design.md`**

- Added `blue-25: oklch(0.985 0.010 268.85)` to the color block (already defined in `index.css:46`; the doc just omitted it). Used as the Pro card gradient floor.

## Components

### `lg` switch size `cbbefe0`

**`src/components/ui/switch.tsx`**

- Added a third size, `lg` — track `h-6 w-10` (24×40px), knob `size-5` (20px), reusing the proven `calc(100%-2px)` thumb travel so the geometry matches the `default` switch scaled up (~1.67:1 proportion).
- Additive only; `default` (32×20) and `sm` (24×14) are unchanged.
- Applied `size="lg"` to every `<Switch>` in the app: Token Savings (Compression, Caching), Policies (in-body enable), Billing + BillingFree (auto-renew).

## Sections

### Billing modal width fixed at 500px `cbbefe0`

**`src/pages/Billing.tsx`, `src/pages/BillingFree.tsx`**

- The Auto-recharge and Add-credits dialogs were capping at 384px in the `sm` breakpoint range: the `DialogContent` base ships `sm:max-w-sm` (384px), and the className override (`max-w-[500px]` / `sm:max-w-[500px] md:w-[500px]`) only won at `md+`.
- Fixed with an inline `style={{ width: "calc(100% - 2rem)", maxWidth: 500 }}` — inline style beats the base class at every breakpoint, so the modal is a fixed 500px and only shrinks (viewport − 16px gutters) on a phone. Verified 500 at 1492/700px, 328 at 360px.

### Token Savings plan-card figure + footer copy `cbbefe0`

**`src/pages/TokenSavings.tsx`**

- Basic plan "~8% smaller requests" figure recolored to `text-success-700` (green), mirroring the Advanced card's `text-blue-700` accent.
- Advanced footer tail copy shortened to "…, increasing with heavier workloads."

### Auto-recharge enable card: drop gray fill `e788311`

**`src/pages/Billing.tsx`, `src/pages/BillingFree.tsx`**

- Removed `bg-neutral-50` from the top "Enable auto-recharge" card in both auto-recharge dialogs; it now sits flush on the white dialog surface (border + padding retained). The other gray cards in each modal are unchanged.

### Token Savings compression polish + plan-gating `20627e3`

**`src/pages/TokenSavings.tsx`, `TokenSavingsFree.tsx`, `TokenSavingsDefault.tsx`**

- Plan-gated the Basic compression card via a `plan` prop: Free (`plan="free"`) shows both Basic + Advanced; Pro shows Advanced only, full-width.
- Stacked the two compression cards vertically (`grid-cols-1`) and set the gap between them — and between the Caching subcards — to `gap-3` (12px).
- Promoted the savings figure: dropped the "Real traffic:" label and trailing copy; the percentage is now a `font-mono tabular-nums` numeral at `text-base` (16px) in the accent color (green Free / blue Pro), matching the dashboard's KPI-numeral convention. Promotes by typeface + color, not size, so it doesn't outrank card titles. Values: Free "4% smaller requests", Pro "~25% smaller requests (up to ~30%)".
- Bullet list: hid the per-item subtext (`hidden`, not deleted), switched to a 2x2 grid, and fixed check-icon/title alignment (`items-center`, dropped the off-grid `mt-0.5`) now that rows are single-line.

### Policies: collapse by default + CTA bullet weight `20627e3`

**`src/pages/Policies.tsx`**

- Scan cards now start collapsed on every load (`expanded` initial state `false`); users expand the ones they want to tune.
- Pro plan protection CTA: bullet titles changed from `type-label-14` (medium) to `type-copy-14` (regular) so they stop competing with the `type-heading-16` card title.

