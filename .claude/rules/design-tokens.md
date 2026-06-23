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
- **Spacing on the grid.** Component intrinsics 4px; layout gaps / padding /
  margin 8px only. No `gap-3` / `p-3`, no `*.5`.

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
fails the build on arbitrary colors and literal `text-[Npx]` sizes. Green lint
is necessary, not sufficient — this rule covers more than the script can catch.
