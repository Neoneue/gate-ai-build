---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.css"
  - "public/design-system.html"
---

# Rule: design values are a closed set

`design.md` is authoritative for ALL visual decisions. Colors, type sizes,
line-heights, tracking, spacing, radius, and shadows are a **closed set** —
every value you write must map to a named token or voice defined in `design.md`.

## Hard constraints

- **Never invent a color.** Use the semantic / neutral tokens (`bg-card`,
  `text-neutral-700`, `border-border`, …). No hex, no `rgb()/oklch()/hsl()`,
  no `*-[#…]` arbitrary-color classes, no inline `style` colors.
- **Never invent a type size or voice.** Use the scale — h1 32 / h2 24 /
  h3 20 / h4 18 / body 16 (plus the named voices). No `text-[Npx]`. Prefer the
  heading components (`SectionTitle`, `CardTitle`) over hand-rolled
  `<hN className="text-…">`.
- **One tracking system.** h2–h4 / body = normal tracking; only the page-title
  display tier is tight (documented). Don't sprinkle `tracking-tight`.
- **Spacing on the 4px grid.** Every spacing value (gaps, padding, margin) must
  be a 4px multiple — `gap-1`/`2`/`3`/`4`… and `p-1`/`2`/`3`/`4`… are all fine
  (`gap-3`/`p-3` = 12px is allowed). What stays banned: the `*.5` utilities
  (`gap-0.5`, `mt-1.5`, `p-2.5` = 2/6/10px), which break the 4px unit. Prefer
  the 8px steps (`2`/`4`/`6`/`8`) for layout rhythm where they fit; reach for the
  odd 4px steps (`1`/`3`/`5`) when 8px is too coarse.
  - **One sanctioned exception:** `Button`'s icon padding, `px-2.5` (10px), which
    is shadcn's own `has-[>svg]:px-2.5` value. Adopting upstream verbatim beats
    rounding it to keep a grid. It is the only `*.5` in the system; a second one
    needs the same justification, in writing, in `design.md`.

## When no token fits

STOP and ask. Do not pick a plausible Tailwind value. Either the user names an
existing token, or the value is added to `design.md` as a named token/voice
**first**, then used. A value not in `design.md` is a defect, even if it
"looks right."

## When the user requests an off-token value

Flag it before implementing — name the closest token and that the request is
off-scale, and let them decide whether to use the token or extend `design.md`.
Don't silently ship the arbitrary value.

## Enforcement

`npm run lint` runs `lint:design` (`scripts/check-design-tokens.mjs`), which
fails the build on arbitrary colors and literal `text-[Npx]` sizes. It also
fails on a **copy voice applied to a label** — a `type-copy-*` in the
`className` of a button / trigger / menu-or-select item / `Label` / `CardTitle`
/ `SectionTitle` / `TableHead`, or on a `<span>` nested inside one. Labels take
`type-label-*` (font-medium); `type-copy-*` is body text and silently renders a
label at 400. See [`no-handrolling.md`](./no-handrolling.md).

The voice check is deliberately conservative — it declines to guess on
ambiguous nesting, so it will miss some cases. Notably it cannot see a voice
applied through a shared variant/`cva` recipe, a `cn()` helper defined away
from the element, or a voice passed in as a prop. It also cannot see an
**inherited** voice: `<dl className="type-copy-14">` silently puts every child
`<dt>` at 400 with no `type-copy-*` on the `<dt>` itself for the scanner to
find. Set the voice on the element that needs it, not on an ancestor, and the
gate can see it. Nor can it see the *absence* of a voice — a hand-rolled
control with no voice at all inherits 400, which is exactly how
`select-variants.ts` drifted. Green lint is necessary, not
sufficient — this rule covers more than the script can catch.
