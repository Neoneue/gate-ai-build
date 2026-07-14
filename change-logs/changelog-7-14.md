# UI Changelog: 2026-07-14

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-13.md`](./changelog-7-13.md)

---

## Components

### TopList: options prop for per-card toggle sets `00662fa`

**`src/pages/Activity.tsx`**

`TopList` hardcoded the `Tokens | Spend` `METRIC_OPTIONS` in its `SegmentedPill`, which blocked the new attack-types card from carrying a different lens. Genericized the component (`TopList<T extends string>`) with a required `options: { value: T; label: string }[]` prop; the three existing call sites now pass `METRIC_OPTIONS` explicitly, the new fourth card passes `ATTACK_METRIC_OPTIONS` (`Amount | Percent`). No visual change to the existing cards.

## Sections

### Activity: Alerts column on Usage by key `00662fa`

**`src/pages/Activity.tsx`**

New sortable numeric `Alerts` column after `Messages` in the Recent key usage table — same `whitespace-nowrap text-right font-mono tabular-nums` cell treatment as the other counts. Value is a placeholder rate computed inside the range-scaled `scaledRows` memo: `alerts = round(requests / 8)`, so it tracks the date/time range selector through the scaled message count (510,000 msgs -> 63,750 alerts on All). Comment in the memo marks it a placeholder until per-key alert data exists. Sort accessor gained the matching `"alerts"` case.

### Activity: revoked keys + Hide revoked toggle `00662fa`

**`src/pages/Activity.tsx`**, **`src/pages/activity-data.ts`**

`ApiKeyRow` gained `revoked?: boolean` (mirrors the Keys page status). `ci-runner` (Jordan Lee) and `atlas-eval` (Mateus Silva) are now revoked; `test-key` reassigned Mateus Silva -> Chad Ponticas with real zeros across requests/tokens/spend and revoked, matching the Keys page's never-used `sk-gw-…255e`. Table toolbar gained a labeled `Switch` ("Hide revoked", `type-label-14` label + `aria-labelledby`) between the search input and Export CSV, default ON; the filter applies before search, and the toggle participates in the page-reset key so pagination snaps to page 1. When shown, revoked rows render at full strength with a `neutral` `Revoked` badge beside the key name (per-request decision: no opacity dim — the badge is the signal).

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
