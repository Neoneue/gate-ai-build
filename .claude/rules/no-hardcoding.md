# Rule: never hardcode a color, ever. Tokenize by semantic intent.

Companion to [`design-tokens.md`](./design-tokens.md). That rule says "no
invented values." This rule closes the gap that caused a real, expensive
failure on `design-system.html`: **a raw-ramp token used where a semantic
token belongs is still hardcoding.** It passes the "no hex" check yet is a
defect, because raw ramps do not carry theme meaning and do not flip.

## The one rule

Every color in component / UI code MUST reference a **semantic** token that
carries theme meaning. You map the *intent* (text, surface, border, action,
status) to the token, then apply it. You never reach for a literal, and you
never reach for a raw ramp step to stand in for a semantic role.

Three tiers, and only the middle one is for UI code:

1. **Literals** (`#hex`, `oklch(...)`, `rgb(...)`) live ONLY in the
   token-definition layer: `:root`, `[data-theme="dark"]` / `.dark`, or the
   `@theme` block in `src/index.css`. This is the single place a value is
   declared. Nowhere else.
2. **Semantic tokens** are what UI code uses: `--foreground` / `text-foreground`,
   `--card` / `bg-card`, `--muted`, `--muted-foreground`, `--border`,
   `--input`, `--ring`, `--primary` / `--primary-foreground`, `--secondary`,
   `--destructive`, plus the status families. These flip between themes.
3. **Raw ramp steps** (`--neutral-900`, `bg-neutral-100`, `--success-100`,
   `text-blue-700`, …) are theme-INDEPENDENT. They are NOT for expressing a
   semantic role. Using `var(--neutral-900)` for body text, or `var(--white)`
   for a surface, is hardcoding by another name: it will not respond to the
   theme and is a bug the moment dark mode exists.

## Map intent -> token (do this, do not guess)

| Intent | Token |
| --- | --- |
| primary text, headline, row identifier | `--foreground` / `text-foreground` |
| secondary, meta, caption, code, placeholder | `--muted-foreground` |
| card / panel surface | `--card` / `bg-card` |
| nested / inset / recessed surface, subtle or hover fill | `--muted` |
| page background | `--background` |
| border, divider, hairline | `--border` |
| form-control border | `--input` |
| focus ring | `--ring` |
| primary action, active nav, selected state | `--primary` (+ `--primary-foreground` for its text) |
| secondary / outline action | `--card` + `--border` (or `--secondary`) |
| destructive / danger | `--destructive` |
| status badge (per `badge.tsx`) | light `bg-{tone}-100` + `text-{tone}-800`; dark `bg color-mix({tone}-500 15%)` + `text {tone}-300` |

If no semantic token fits the intent, STOP and ask, or add the token to
`src/index.css` (both light and dark) and `design.md` FIRST, then use it. A
missing semantic token is not license to drop in a raw ramp.

## The only exceptions (raw ramps / literals allowed)

- The **token-definition layer** (declaring the value once).
- A specimen whose **explicit purpose is to display a raw value**: color-ramp
  swatches, the token catalog, an elevation/spacing visualizer accent. Showing
  the ramp IS the point. Even then, verify it still reads in BOTH themes.

Everything else that renders a color is UI code and obeys the one rule.

## Applies everywhere, including standalone HTML

`public/design-system.html` is not exempt because it is hand-written and
Tailwind-free. It defines the same semantic tokens in `:root` and
`[data-theme="dark"]` (mirroring `src/index.css`) precisely so every specimen
can reference them and flip. A reference page that hardcodes ramps is lying
about the system it claims to document.

## Self-check before you write any color

1. Is this the token-definition layer? If no, no literals.
2. Am I about to type a raw ramp step (`neutral-`, `-100`, `-700`, `--white`)?
   If yes, name the semantic role and use the token for it instead.
3. Will this value be correct in BOTH light and dark? If I cannot say yes,
   it is not tokenized correctly.

Two failed edits chasing the same color across themes means you are hardcoding
somewhere upstream. Stop and re-map the intent to a token.
