# Rule: never hand-roll a component. Compose the primitives.

Companion to [`design-tokens.md`](./design-tokens.md) and
[`no-hardcoding.md`](./no-hardcoding.md). Those govern *values*. This one
governs *construction*: the components in `src/components/ui/` are the closed
set, exactly as the tokens are. If a primitive exists for what you are
building, you use it — you do not rebuild it, and you do not override the parts
of it you happen to disagree with.

This rule exists because a single hand-copied class string
(`border-border bg-card font-normal text-foreground`) spread to ~20 call sites
across 10 files, silently contradicted `design.md`, and then drifted — the same
"Export CSV" button rendered at two different weights on four different pages.
Nobody decided that. It happened one paste at a time.

## The one rule

Build from the primitive. If the primitive cannot express what the design
needs, **change the primitive** (or add a variant to it) and document it in
`design.md` — do not work around it at the call site.

- **Never write a raw `<button>`** with its own padding / border / radius /
  weight when `Button` exists. Same for `Input`, `Select`, `Dialog`, `Card`,
  `Badge`, `Table`, `Tooltip`, and every other primitive in
  `src/components/ui/`.
- **Never re-specify what a variant already gives you.** `variant="outline"`
  supplies `border-border bg-card`. Passing those again at the call site is
  noise that hides the one utility you actually meant to change.
- **Never override a primitive's typography.** Weight, size, tracking, and
  line-height come from the component and its `size` prop. A `font-normal` on
  a `Button` is a defect, not a preference.

## Button labels are `font-medium` (500). No exceptions.

`design.md` §3: *sans labels are `font-medium` minimum — `font-normal` reads as
ambient body, not a label.* `Button`'s base recipe is already `font-medium`.
Every interactive control on the site renders at 500 — see the enumeration in
`design.md` §3 for the exhaustive list, including anything hand-rolled that
behaves as a button.

Ruled 2026-07-28, after a site-wide sweep. There is no quiet-button variant.
If one is ever wanted, it gets added to `Button` and documented in `design.md`
first — it does not get pasted into a `className`.

## Labels take the LABEL voice, never the copy voice

`type-copy-*` is `font-normal` — it is **body text**. `type-label-*` is
`font-medium` — it is **a label**. Putting a copy voice on a label silently
drops it to 400, and because the voice sits on an inner `<span>` it overrides
the `font-medium` the parent button already set. That is invisible in review
and is exactly how the sidebar's active nav item regressed .

**`design.md` §3 "Label voice — the enumeration" is the single source** for
which roles take which voice. It lists every interactive and naming role, and
the ones that are deliberately excluded. Do not maintain a second list here —
two lists that can disagree is how the drift happened in the first place.

The test, from §3, applied in order:

1. **If you can click it, or it names something → Label** (`type-label-*`).
2. **If it is prose the user reads → Copy** (`type-copy-*`).
3. **If it heads a section → Heading** (`type-heading-*`).

Two carve-outs worth knowing without opening `design.md`: **segmented control
labels are the Eyebrow voice**, not Label; and **inline text links mid-sentence
stay Copy**, because they are prose that happens to be clickable.

Quiet-looking labels still take the label voice. Inactive nav items, secondary
actions, and disabled controls go quiet with `text-muted-foreground` — color
does the quiet work, weight does the structural work (`design.md` §3). Never
reach for `type-copy-*` to make a label look softer.

## What a legitimate `className` on a primitive looks like

Layout and flow only — how the component sits in *its container*, never how it
looks in itself:

```tsx
// fine — layout only
<Button className="flex-1 md:flex-none" size="lg" variant="outline">

// defect — re-specifies the variant, overrides the typography
<Button className="flex-1 border-border bg-card font-normal text-foreground">
```

Good: `flex-1`, `w-full`, `md:ml-auto`, `shrink-0`, grid placement, responsive
visibility. Bad: colors, borders, radius, shadows, font weight, font size,
tracking — those belong to the primitive.

## When the primitive doesn't fit

STOP and ask. Then either:

1. **Add a variant or `size` to the primitive**, document it in `design.md`,
   and use it everywhere the case occurs; or
2. **Build a new primitive** in `src/components/ui/`, document it, and compose
   from it.

Both outcomes are reviewable and apply everywhere at once. A call-site override
is neither — it is invisible to everyone who is not reading that exact file,
which is precisely how the button-weight drift happened.

## Self-check before you add a `className` to a primitive

1. Is every utility about **placement in the parent**? If yes, fine.
2. Am I re-stating something the `variant` or `size` already provides? Delete
   it.
3. Am I changing how the component *looks* — color, weight, border, radius?
   Then I am hand-rolling. Change the primitive instead, or ask.

Two call sites needing the same override means the primitive is missing a
variant. Twenty means the system was bypassed.
