# UI Changelog: 2026-06-25

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-24.md`](./changelog-6-24.md)

---

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
