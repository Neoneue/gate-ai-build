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

### Info becomes the fourth status family `81888fb`

- Before: `success`, `warning` and `danger` each owned a token family; info
  did not, so StatusDot took `bg-blue-600`, Badge `info` took
  `bg-blue-700/10 text-blue-600` with a `dark:` twin, and Callout took a
  third recipe on blue-300 / blue-50 / blue-900.
- After: `--info`, `--info-foreground`, `--info-wash`, `--info-surface`,
  `--info-border`, `--info-foreground-strong` in `src/index.css`, both
  themes, at exactly the values that shipped. StatusDot, Badge and Callout
  bind to them. design.md §2 gains "Status info family".

### Auth panel colours are tokens `81888fb`

- Before: `AuthLayout.tsx` painted its fixed-dark marketing panel with raw
  `bg-neutral-950`, `bg-neutral-900`, `text-white`, `border-white/10`,
  `text-blue-400` and three inline `rgba(255,255,255,0.05)` gradients, the
  only `rgba()` in `src` outside `index.css`.
- After: `--auth-panel`, `--auth-panel-foreground`, `--auth-panel-tile`,
  `--auth-panel-edge`, `--auth-glow`, `--auth-accent`, declared once in
  `:root` because the panel never follows the theme. Same values.
  design.md §2 gains "Auth panel".

### Syntax literal token renamed; code surfaces use plain utilities `81888fb`

- Before: `--color-syntax-terminal-blue` resolved to success-700 /
  success-400 and was green in both themes; `code-card.tsx` and
  `code-panel.tsx` reached it through `text-[var(--color-syntax-*)]`.
- After: token is `--color-syntax-literal`; both files use
  `text-syntax-keyword`, `text-syntax-variable`, `text-syntax-property`,
  `text-syntax-literal`. No colour change.

## Components

### TextLink underline and Policies redact radio read semantic tokens `81888fb`

- TextLink: `decoration-neutral-200 hover:decoration-neutral-500` plus three
  `dark:` twins becomes `decoration-border hover:decoration-muted-foreground`
  (`text-link.tsx`). Light hover underline moves one step, neutral-500 to
  neutral-600; dark is unchanged. design.md §0 and §7 recipes updated.
- Policies redact action: checked radio and active card border move from
  `neutral-700` / `border-muted-foreground` to `--primary`
  (`policies/config.ts`). Light 700 / 600 to 900, dark 400 to 200, so the
  redact state matches the primary button ink and stays one tone.
- Chart wrapper (`chart.tsx`): a comment marks the `#ccc` / `#fff` as
  Recharts attribute selectors, not colours.

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
