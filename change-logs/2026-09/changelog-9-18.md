# UI Changelog: 2026-09-18

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-17.md`](./changelog-9-17.md)

---

## Conventions

### Plan tiers get their own colour tokens `2b1c3b1`

- Before: Pro and Enterprise surfaces re-derived their colour at every call
  site from raw ramp steps. The Pro badge recipe (`bg-blue-100 text-blue-700
  dark:bg-blue-500/15 dark:text-blue-300`) was pasted five times, the tinted
  Pro banner gradient five times, Pro icon ink six times with three different
  dark steps, and Enterprise violet sat on Tailwind's default scale with no
  entry in design.md.
- After: ten tokens in `src/index.css`, both themes, aliased in `@theme
  inline`: `--tier-pro`, `--tier-pro-foreground`, `--tier-pro-wash`,
  `--tier-pro-surface`, `--tier-pro-border`, `--tier-pro-surface-wash`, and
  `--tier-enterprise`, `-foreground`, `-wash`, `-border`. Consumers:
  `Badge` `pro` / `enterprise`, `Card` `tone="pro|enterprise"`,
  `OptionTile` selected state, the tinted banners on Policies, Token savings,
  onboarding, both plan-comparison dialogs and `pro-upgrade-card`, the check
  circles, and the tier ink on Billing, BillingEnterprise, DashboardDefault
  and the teams panes. design.md §2 gains a "Plan tier colours" subsection
  and a "Do not use" bullet for raw `blue-*` / `violet-*` on a tier.
- Three rungs were unified so each role has one value, noted in file
  comments: dark Pro border blue-400 at 30% to blue-500 at 30% (Card's
  documented rung) on the banners, OptionTile and pro-upgrade-card;
  pro-upgrade-card light fill blue-25 to blue-50; Billing hero dark ink
  blue-300 to blue-400.
- Left raw on purpose: the setup step-indicator ink `text-blue-600
  dark:text-blue-400` in `onboarding-shared.tsx` and `SetupManual.tsx`,
  pending a call on whether it is a tier role.

### Vendor brand colours live in one registry `2b1c3b1`

- Before: 77 brand hexes as `fill=` / `stopColor=` attributes and `color:`
  fields across `model-providers.tsx`, `gateway-providers.tsx`,
  `vendor-meta.tsx` and `ui/google-g.tsx`, with Google blue, Alibaba orange
  and Cohere coral each repeated in two or three places.
- After: `src/components/icons/brand-colors.ts` exports `BRAND_COLORS` (one
  key per brand, one named colour per fill, `primary` for the single-hue
  swatch) and `MONO_MARK_COLOR` for the theme-following marks. Every SVG
  fill and both meta maps read from it. `google-g.tsx` moved to `icons/`;
  SignIn and SignUp import from there. Brand colours stay out of `@theme`
  on purpose: they must not shift with the theme or become utilities.

## Components

### Dot matrix loader drops its unused colour presets `2b1c3b1`

- Before: `DotMatrixBase` / `DotMatrix3Base` accepted a `colorPreset` prop
  with eight presets; seven carried 27 hex values and CSS gradients, the
  eighth read `var(--color-dot-on)`, a token defined nowhere. No caller
  passed the prop.
- After: the prop, the preset table and `resolveDmxColorTokens` are removed
  from `src/lib/dotmatrix-core.tsx`. `color` (default `currentColor`) is the
  only colour input; rendering is unchanged.

## Sections

### Colour audit checklist `2b1c3b1`

- New `color-audit.md` at the repo root: 18 numbered items in `audit.md`
  shape (Before / After / Why), an inventory of every raw hex, `rgba()` and
  raw palette class in `src`, a proposed-token list and a Status section.
  Items 1, 14, 15, 16 and 18 are ticked by this commit.
