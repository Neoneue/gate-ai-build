# UI Changelog: 2026-07-14

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-13.md`](./changelog-7-13.md)

---

## Components

### TopList: options prop for per-card toggle sets `00662fa`

**`src/pages/Activity.tsx`**

`TopList` hardcoded the `Tokens | Spend` `METRIC_OPTIONS` in its `SegmentedPill`, which blocked the new attack-types card from carrying a different lens. Genericized the component (`TopList<T extends string>`) with a required `options: { value: T; label: string }[]` prop; the three existing call sites now pass `METRIC_OPTIONS` explicitly, the new fourth card passes `ATTACK_METRIC_OPTIONS` (`Amount | Percent`). No visual change to the existing cards.

### New token: `--border-active` on the SegmentedPill indicator `6c5f51b`

**`src/index.css`**, **`src/components/ui/segmented-pill.tsx`**, **`design.md`**

The pill's active thumb (white on a neutral-100 track) was hard to see. New semantic token `--border-active` — neutral-100 in light, neutral-800 in dark — defined in `:root` / `.dark` and mapped in `@theme inline` (`border-border-active`). Applied as a 1px border on the shared `SegmentedPill` indicator, so every pill gets it. Dark deliberately equals the thumb surface (`--popover` neutral-800): the hairline disappears there and the lighter thumb carries the active state on its own. Documented in `design.md` (token table + paragraph). Not a substitute for `--border` on containers.

### Stacked bar charts: top-corner rounding halved to 1px `1c28d3a`

**`src/pages/Dashboard.tsx`**, **`src/pages/activity/TrendCard.tsx`**

The two stacked bar charts (Dashboard spend stack, Activity TrendCard spend/savings stack) rounded their top corners at `[2, 2, 0, 0]`. Halved to `[1, 1, 0, 0]` — the radius still only applies to the topmost series in each stack, so the seam between stacked segments stays square. Only these two charts carry top rounding; no other chart touched.

## Sections

### Activity: Alerts column on Usage by key `00662fa`

**`src/pages/Activity.tsx`**

New sortable numeric `Alerts` column after `Messages` in the Recent key usage table — same `whitespace-nowrap text-right font-mono tabular-nums` cell treatment as the other counts. Value is a placeholder rate computed inside the range-scaled `scaledRows` memo: `alerts = round(requests / 8)`, so it tracks the date/time range selector through the scaled message count (510,000 msgs -> 63,750 alerts on All). Comment in the memo marks it a placeholder until per-key alert data exists. Sort accessor gained the matching `"alerts"` case.

### Activity: revoked keys + Hide revoked toggle `00662fa`

**`src/pages/Activity.tsx`**, **`src/pages/activity-data.ts`**

`ApiKeyRow` gained `revoked?: boolean` (mirrors the Keys page status). `ci-runner` (Jordan Lee) and `atlas-eval` (Mateus Silva) are now revoked; `test-key` reassigned Mateus Silva -> Chad Ponticas with real zeros across requests/tokens/spend and revoked, matching the Keys page's never-used `sk-gw-…255e`. Table toolbar gained a labeled `Switch` ("Hide revoked", `type-label-14` label + `aria-labelledby`), default ON; the filter applies before search, and the toggle participates in the page-reset key so pagination snaps to page 1. When shown, revoked rows render at full strength with a `neutral` `Revoked` badge beside the key name (per-request decision: no opacity dim — the badge is the signal). Toolbar placement corrected in `1796df9`: the switch sits far right, after Export CSV (order: search → Export CSV → Hide revoked); it originally sat between them and read oddly.

### Activity: Billing column gap -25% `00662fa`

**`src/pages/Activity.tsx`**

The badge -> Messages whitespace measured 195px. Capped the Billing header at `w-20` (column clamps to its ~85px content minimum) so auto layout redistributes the surplus: gap now 144px (-26%, target -25%). Single class change, on-grid value, no other columns touched.

### Activity: staging-web -> design-agent `00662fa`

**`src/pages/activity-data.ts`**

Chad's `staging-web` key renamed `design-agent` to match the ApiKeys data (`ApiKeys.tsx` has prod-web / prod-agent / test-key / design-agent — no staging-web) and the Security events feed's `design-agent (sk-gw-ef7)`. All 13 references renamed in one pass — `API_KEY_ROWS` row, `SPEND_SERIES.apiKey` chart series, `SPEND_BASE.apiKey` bucket keys, comments — so the table and the By-API-key chart stay consistent.

### Activity: Top attack types card (4th middle card) `00662fa`

**`src/pages/Activity.tsx`**, **`src/pages/security/events-data.ts`**, **`src/pages/Security.tsx`**

The Top models / Top API keys / Top users row is now `grid-cols-4` with a fourth `TopList`: **Top attack types** — Prompt injection, PII / PHI, Credential leak — with an `Amount | Percent` pill (subtitles "By total attack amount" / "By total attack percentage").

- **Shared mix, single source.** The 8:5:3 attack baseline moved out of `Security.tsx` into `ATTACK_MIX` + `attackTypeCounts(range, customRange)` in `events-data.ts` (units x `eventsTotal / EVENT_MIX_TOTAL`, rounded). Security's `ATTACK_CATEGORIES` now derives from it (chart colors mapped locally via `ATTACK_COLORS`), so the Activity card and Security's Attack types card show the SAME integers for every range including custom (All: 207 / 129 / 78).
- **Percent lens** derives from those rounded counts as each type's share of the attack-type sum (50.0% / 31.2% / 18.8%), one decimal.
- **Icons** come straight from the Security events table's `TYPE_META` mapping — `Icon` + `color` (`chart-3` / `danger-600` / `chart-4`), `size-4`, `strokeWidth 1.75` — via a hoisted `ATTACK_AVATARS`, so the card cannot drift from the table's type treatment. PII/PHI merged onto the `pii` entry (`UserRound`).

### Activity: Saved column on Usage by key `6c5f51b`

**`src/pages/Activity.tsx`**, **`src/pages/activity-data.ts`**

New sortable `Saved` column after Tokens out — each key's Total-saved rate, rendered `N.N%` (one-decimal convention). `ApiKeyRow` gained a `savings` base rate (7d fraction, spread 9.6%–17.3%) authored so the token-weighted mean lands exactly on `TOKEN_SAVINGS_RATE_7D` (14.2%) — the column reconciles with the TokenSavings page. New `TOKEN_SAVINGS_RATE_BY_RANGE` (24h 12.8 / 7d 14.2 / 30d 13.5 / All 13.9, mirroring the TokenSavings hero) + `savingsRateFor(range, customRange)` (custom resolves by day span) drive the range scaling: per-key value = base × rangeRate/7dRate. Never-used `test-key` renders an em dash (`saved: null`) and sorts last, same pattern as BYOK spend.

### Activity: Savings lens on the trend chart `6c5f51b`

**`src/pages/activity/TrendCard.tsx`**

The chart pill is now `Tokens | Spend | Savings` via chart-local `TrendMetric` / `TREND_METRIC_OPTIONS` (the Top cards keep the plain pair). Under Savings ("Savings over time"):

- **Stack semantics:** each bucket's total stack height = the workspace % saved that bucket (`distributeSeries` around `savingsRateFor(range)`, so the bucket mean equals the range's rate), split across the model/provider/key series by their 7d token share. The stack total is the meaningful "% saved" figure and reconciles with the TokenSavings page.
- **Axis:** YAxis `domain=[0,30]` (hoisted `SAVINGS_DOMAIN`) with `%` tick labels; tooltip values format `N.N%`.
- **Breakdown panel:** shows each series' share alone under Savings — its "value" is also a percentage, and two `%` columns read as noise (user call). Tokens/Spend keep the `value · share` pair.

### Trend chart: auto-width YAxis + tooltip spacing `6c5f51b`

**`src/pages/activity/TrendCard.tsx`**

Two fixes on the chart chrome. (1) YAxis `width` 44 → `"auto"` (recharts 3): the fixed width clipped wide token ticks ("10.00M" lost its leading digit past the card padding), and a wider fixed value left a gap on the narrow `$`/`%` lenses — auto sizes each lens to its own rendered labels. (2) Tooltip rows: label→value gap `gap-3` → `gap-7` (12px → 28px, requested +16px).

### Activity: savings maturation curve (chart + Saved column) `d069080`

**`src/pages/activity-data.ts`**, **`src/pages/activity/TrendCard.tsx`**, **`src/pages/Activity.tsx`**

Replaced the flat savings band with a maturation model — caching/compression climbing over time toward a plateau. New `savingsCurve(range, customRange, count, seed)` in activity-data draws a concave √ ramp from each window's floor to a ~25% ceiling (hard-clamped under the 30% cap), with seeded jitter scaled to the window span. Measured: **All** climbs 9.1% → 23.9% across 30 buckets; **7d** sits flat-high 21.7% → 23.6%. `savingsRateFor()` now returns each curve's MEAN (`floor + (ceiling − floor)·2/3`), so the chart average and the table Saved column reconcile.

- **Raised to the 20-25% product goal.** Per the 2026-07-14 call (caching + compression realistically tops out ~25-30%), Activity savings moved off the old ~14% band onto a dedicated `ACTIVITY_SAVINGS_RATE_7D` (0.243). Per-key `savings` and the per-model/provider `SAVINGS_RATES_7D` were rebased to a 19-29% spread; token-weighted 7d mean = 24.3%. `SAVINGS_CURVE_BOUNDS` holds the per-range floor/ceiling (24h 24-25, 7d 23-25, 30d 22-25, all 10-25).
- **Decoupled from TokenSavings.** The shared `TOKEN_SAVINGS_RATE_7D` stays 0.142 and still drives the TokenSavings hero + Overview "Tokens Saved" tile — those are intentionally left at 14.2%. Activity now shows a higher savings number than those two surfaces by design.
- **Panel fix:** the Savings breakdown panel shows each series' OWN saved rate (it was echoing token share). For the apiKey dimension these equal the table's Saved column.
- **Pre-existing bug fixed:** `SPEND_BASE` / token buckets keyed the dev series `"dev"` while `SPEND_SERIES` + `API_KEY_ROWS` used `"development"`, so the development series rendered as 0 across Tokens/Spend/Savings. Unified to `"development"`.

### Activity: Top cards wrap 2×2 below 2xl `d069080`

**`src/pages/Activity.tsx`**

The four Top cards (models / API keys / users / attack types) row went `grid-cols-4` → `grid-cols-2 2xl:grid-cols-4`. The tightest card (Top attack types title + its Amount|Percent pill) needs ~316px, which a 4-up row only clears above a ~1424px viewport; `2xl` (1536) is the nearest breakpoint that never squeezes the headers. Verified 2×2 at 1512, 4-up at 1600.

### Feedback FAB: round messenger button `d069080`

**`src/components/ui/feedback-fab.tsx`**

Replaced the outlined "Feedback" pill trigger with a round messenger-style FAB (48×48, bottom-right, filled `MessageCircle` icon, `aria-label="Send feedback"`). Uses the brand-blue CTA recipe verbatim (`bg-blue-700 … hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700` + blue shadow) shared with the Policies / TokenSavings / plan CTAs, and the standard pressable motion (`-translate-y-px` hover, `active:scale-[0.98]`). Opens the same existing feedback dialog — only the trigger changed.
