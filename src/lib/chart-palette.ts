/* ─────────────────────────────────────────────────────────────────────────
 * Categorical chart palette — single source of truth.
 *
 * Mirrors the 8-slot OKLCH palette declared as `--chart-1..8` in
 * `src/index.css`. Use these CSS variable refs whenever a chart series,
 * legend swatch, or sparkline needs a categorical color. Series pick a
 * slot by *index*, not by what each series represents — brand-decoupled,
 * per the PM call codified 2026-05-06.
 *
 * Hue map (for picking brand-mnemonic overrides):
 *   slot 1 → blue        slot 5 → coral
 *   slot 2 → orange      slot 6 → teal
 *   slot 3 → green       slot 7 → amber
 *   slot 4 → purple      slot 8 → magenta
 *
 * Don't reach for `VENDOR_META[v].color` for chart series. Vendor brand
 * colors are reserved for vendor identity affordances (avatars, eyebrow
 * labels). The chart palette stays separate so the operator-dashboard
 * register reads consistent across all surfaces.
 *
 * Full design rationale + survey of other systems lives in
 * `docs/chart-colors.md`.
 * ───────────────────────────────────────────────────────────────────────── */

export const CHART_PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
] as const;

export type ChartSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Pick a chart-palette color by 1-based slot. Mirrors `seriesColor`
 * helpers across artboards — wraps with modulo so slot==9 falls back
 * to slot 1 instead of throwing.
 */
export function chartSlot(slot: ChartSlot | number): string {
  const idx = (((slot - 1) % CHART_PALETTE.length) + CHART_PALETTE.length) % CHART_PALETTE.length;
  return CHART_PALETTE[idx]!;
}
