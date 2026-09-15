# Personality Presets — token adjustments from the shadcn baseline

When the user picks one or more personality pills in `/design-seed` step 4, apply these token adjustments on top of the pure shadcn new-york default before emitting the design.md. Tags remain `seeded` — a personality preset is a **tweaked default**, not a decision.

Pills compose. If the user picks "Human + Spirited", apply both diffs. If two pills conflict on the same token (e.g. Serious wants tight radius, Premium wants balanced), the **later-picked pill wins**. Reflect all applied pills in the §0 Direction "Feel" line.

## Pill: Quiet

The default-leaning stance. Use when the team wants "shadcn demo" as the starting point, nothing amplified.

- **§2 Color:** pure shadcn new-york — no change.
- **§3 Typography:** Geist default, weight ceiling SemiBold (600).
- **§5 Spacing:** Tailwind default.
- **§5 Radius:** `--radius: 0.625rem` (10 px).
- **§6 Shadow:** default scale.
- **§0 Feel contribution:** "restrained, minimal, gets out of the way"

Effectively a no-op — equivalent to skipping the personality step.

## Pill: Spirited

Energy up. For consumer-facing products, creator tools, anything that should feel alive.

- **§2 Color:** neutral → **stone** (warmer), swap every `oklch(X 0 0)` reference to `oklch(X 0.005 60)` (tiny warmth shift). Primary stays black until brand decision.
- **§5 Radius:** `--radius: 0.875rem` (14 px) — softer than default.
- **§5 Spacing:** slightly more generous — `p-6` → `p-7` (28 px) on cards.
- **§6 Motion:** punchier — press scale 0.95 instead of 0.97, sheet enter 250 ms with slight overshoot (cubic-bezier(0.34, 1.56, 0.64, 1)).
- **§0 Feel contribution:** "energetic, expressive, warm edges"

## Pill: Serious

Conservative. For B2B admin, enterprise, finance, healthcare chrome.

- **§2 Color:** pure shadcn default.
- **§3 Typography:** weight ceiling drops from SemiBold (600) to Medium (500) on body; SemiBold reserved for titles only. Letter-spacing stays 0.
- **§5 Radius:** `--radius: 0.375rem` (6 px) — tighter.
- **§5 Spacing:** slightly tighter — `p-6` → `p-5` (20 px) on cards, row gap `gap-3`.
- **§6 Motion:** restrained — 150 ms ease-out across the board, no overshoot.
- **§0 Feel contribution:** "conservative, professional, measured"

## Pill: Confident

Assertive. For marketing surfaces, challenger brands, editorial product UI.

- **§2 Color:** primary bumps contrast — primary stays `oklch(0.205 0 0)` light / `oklch(0.922 0 0)` dark, but foreground on muted surfaces gets **more contrast** (`oklch(0.4 0 0)` instead of `oklch(0.556 0 0)` for muted-foreground light).
- **§3 Typography:** weight ceiling raised from SemiBold (600) to **Bold (700)** on H1/H2. Display size step added — `text-5xl` (48 px SemiBold, line-height 1) for hero numerals / page titles.
- **§3 Letter-spacing:** -1% on titles (`text-2xl`+) for tight-tracking stance.
- **§5 Spacing:** default.
- **§0 Feel contribution:** "assertive, high-contrast, titles earn their weight"

## Pill: Human

Warm and approachable. For consumer apps, community products, education, wellness.

- **§2 Color:** neutral → **stone** (warmer). Neutral is the biggest lever — shift all `oklch(X 0 0)` neutral references to `oklch(X 0.01 60)`.
- **§5 Radius:** `--radius: 0.75rem` (12 px) — slightly softer.
- **§3 Typography:** Geist stays; letter-spacing at `0` (no tightening). Body line-height bumps — `text-base` becomes `24 → 26` for more breathing.
- **§6 Motion:** slightly slower — 200 ms ease-out presses, 350 ms sheet enter.
- **§0 Feel contribution:** "warm, approachable, unhurried"

## Pill: Engineered

Precise, technical. For developer tools, monitoring dashboards, anything "this is a machine."

- **§2 Color:** neutral → **slate** (cooler). Swap all neutral references to `oklch(X 0.02 240)` (blue-slate tint).
- **§5 Radius:** `--radius: 0.25rem` (4 px) — sharp.
- **§3 Typography:** monospace promoted to first-class in §4 Components (policy-IDs, data cells, timestamps use Geist Mono, not Geist Sans). Letter-spacing tightens (-1%) on labels; tabular-nums enabled on all data text (`font-variant-numeric: tabular-nums`).
- **§5 Spacing:** denser — tight defaults (`p-4` cards, `gap-2` rows).
- **§6 Motion:** linear timing on toggles, short (120 ms ease-out) everywhere else.
- **§0 Feel contribution:** "precise, technical, data-first"

## Pill: Premium

Refined. For luxury brands, high-end fintech, agencies, editorial.

- **§2 Color:** background inverts — default becomes a deeper canvas `oklch(0.98 0.004 60)` (warm-off-white) in light; dark canvas `oklch(0.12 0.004 60)` (deeper than shadcn default). Primary stays black.
- **§5 Radius:** `--radius: 0.5rem` (8 px) — balanced, slightly sharper than default.
- **§5 Spacing:** generous — `p-6` → `p-8` (32 px) on cards, `gap-6` → `gap-8` between sections. Page horizontal padding doubles.
- **§3 Typography:** add a **display face option** in §3 Font Family section (note: "Consider serif pairing — Söhne / GT Sectra / local equivalent for H1/H2 display type. Seed as Geist only; upgrade when brand confirms."). Letter-spacing -2% on display sizes.
- **§6 Shadow:** deeper at resting state — `shadow-sm` gets promoted to `shadow-md` for cards.
- **§0 Feel contribution:** "refined, generous, considered"

## Pill: Dense

Data-heavy, utilitarian. For admin chrome, spreadsheets, trading UIs, ops tools.

- **§2 Color:** default shadcn.
- **§3 Typography:** base size drops — `text-base` stays 16 px on mobile but `md:text-sm` (14 px) above tablet; table cells / list rows use `text-xs` (12 px) by default. Weight ceiling stays SemiBold.
- **§5 Spacing:** aggressively tight — `p-3` cards (12 px), `gap-2` rows (8 px), `px-4 py-2` cells.
- **§5 Radius:** `--radius: 0.375rem` (6 px) — tighter than default.
- **§3 Letter-spacing:** -2% on body data for tighter fit.
- **§4 Components:** row heights drop — `<Button size="sm">` becomes default; `h-8` (32 px) is the default input height.
- **§6 Shadow:** drops to `shadow-xs` baseline — barely there.
- **§0 Feel contribution:** "data-dense, utilitarian, maximum surface for records"

## Conflict resolution — when pills overlap

Some pills set the same dial. When two pills specify conflicting values, the **later pill wins** (user intent is the most recent choice).

| Dial | Quiet | Spirited | Serious | Confident | Human | Engineered | Premium | Dense |
|---|---|---|---|---|---|---|---|---|
| Radius | 10 | 14 | 6 | 10 | 12 | 4 | 8 | 6 |
| Neutral hue | default | stone | default | default | stone | slate | stone-deep | default |
| Weight ceiling | 600 | 600 | 500 (body) / 600 (titles) | 700 | 600 | 600 | 600 | 600 |
| Spacing density | default | +1 step | -1 step | default | default | -1 step | +1 step | -2 steps |
| Motion | default | punchy | restrained | default | slow | linear | considered | default |
| Base size floor | 16 | 16 | 16 | 16 | 16 | 16 | 16 | 14 (md+) |

If the user picks **Dense + Premium** (rare but possible — high-end trading ops dashboard?), Dense wins on radius and spacing (because Dense was picked later, or: adjudicate in step 4 by asking the user "Dense + Premium conflict on density — which wins?").

## Reflecting pills in §0 Direction

After applying preset adjustments, emit a §0 Feel line composed from the picked pills:

- 1 pill: "`<pill feel contribution>`."
- 2 pills: "`<pill A feel>` — `<pill B feel>`."
- 3 pills: "`<pill A feel>` with `<pill B feel>` and `<pill C feel>`."

Example:

- Picked **Human**: "Warm, approachable, unhurried."
- Picked **Human + Spirited**: "Warm, approachable, unhurried — energetic, expressive, warm edges."
- Picked **Engineered + Confident + Dense**: "Precise, technical, data-first with assertive titles and maximum surface for records."

Still tag the Feel line `[needs user confirmation]` — the team should confirm the synthesis before it hardens.

## Not covered by pills

- **Primary hue** — always stays shadcn near-black until a tweakcn / theme-generator / designer hand-off flips it. Personality presets set the *stance*, not the *hue*.
- **Icon library** — Lucide stays default. Pills don't swap the icon set.
- **Font family** — Geist stays default. Pills may add notes about pairing options (Premium suggests serif display pairing) but don't swap Geist out.
- **Component variants** — shadcn primitives stay shadcn. Pills don't introduce custom components. That's a later decision once the team knows what they need.

## Re-running presets after the seed

If the user wants to change pills after the seed is written:

1. Open the existing design.md.
2. Identify currently-applied pills from the §0 Feel line + §Source log.
3. **Reverse the old pill's adjustments** before applying the new pill's.
4. Rewrite the affected sections.
5. Note the change in a new Drift-to-Normalize entry: "personality preset changed from X to Y on `<date>` — some tokens may need team re-confirmation."

This is a rare operation — most projects pick pills once at seed time and then move on to decided brand tokens. Personality preset ≠ theme; it's just a starting point.
