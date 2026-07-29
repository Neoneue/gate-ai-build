# UI Changelog: 2026-07-29

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-28.md`](./changelog-7-28.md)

---

## Conventions

### `Button` gains `icon-action`, the one responsive size `71c62a5`

**`button.tsx`** · **`design.md`**

A dense action row wants a compact box on a pointer device and a real tap target on touch. `size="icon-action"` is `size-8` below `lg` and `size-6` from `lg`, with the glyph stepping 16px → 14px to match.

- **The breakpoint lives inside the recipe** because `size` is a prop and cannot carry one, and overriding a primitive's size from a call-site `className` is hand-rolling. This is the only responsive entry in the scale; a second needs the same justification in `design.md`.
- **Pair it with `gap-0 px-0` → `lg:gap-1 lg:px-1`.** The 8px the box gains on touch is exactly the 8px the gap gives up, so the icon PITCH and every glyph position are unchanged — the tap target grows **24px → 32px without moving a pixel**. Measured: mobile pitch stays 32px and the glyph stays 8px from the row edge, matching Figma's mobile node exactly.
- **32px is the ceiling here, and that is correct.** Pitch caps a non-overlapping target: at a 32px pitch anything larger makes neighbours steal each other's taps, which fails worse than a small target. 32px clears WCAG 2.2 SC 2.5.8 (AA, 24×24) with room; the 44px of AAA / Apple HIG would need a wider row, i.e. a design change.

### Dark `--muted-foreground` retunes neutral-300 → neutral-400 `71c62a5`

**`index.css`** · **`design.md`**

At neutral-300 (#d4d4d4) secondary text sat **one ramp step** from `--foreground` (white) and stopped reading as secondary at all — the Ask AI composer's placeholder was indistinguishable from a typed question.

Figma's dark nodes place secondary text at neutral-400/500 against primary at neutral-200, a consistently wider gap than the code carried. neutral-400 (#a1a1a1) is Figma's own placeholder value.

| | Placeholder | Typed | Lightness gap |
| --- | --- | --- | --- |
| Dark before | `oklch(0.87)` | `oklch(1.0)` | 0.13 |
| Dark after | `oklch(0.708)` | `oklch(1.0)` | **0.29** |
| Light (untouched) | `oklch(0.439)` | `oklch(0.205)` | 0.23 |

The two modes now separate by comparable amounts; before, dark was less than half of light's. Still clears AA (~7.7:1 on `--background`). **Light is deliberately unchanged** — neutral-600 against neutral-900 was already correct, which is the point of fixing this at the token: one semantic pair, `text-muted-foreground` / `text-foreground`, now reads correctly in both modes with no call-site variants.

## Components

### Ask AI reply feedback row — thumbs, copy, and a wired retry `71c62a5`

**`ask-ai-message.tsx`** · **`use-ask-ai-thread.ts`** · **`use-copy-feedback.ts`** · **`ask-ai-panel.tsx`**

Built to Figma `1125:6235` (desktop) and `1125:5937` (mobile). Both nodes carry the same six states: resting, each thumb **filled** with "Thanks for your feedback!", copy swapped to CircleCheck with "Copied!", and the two combinations of those.

- **Rating is mutually exclusive by construction** — one value, never two booleans — and the selected thumb renders as a **filled** glyph (`fill="currentColor"`), not a recoloured outline.
- **The confirmation holds 3s; the rating persists past it.** Only the copy glyph and the helper text are on the clock, which is exactly what Figma's states 5/6 show. Helper text is `type-copy-12`, right-aligned, in an always-mounted `role="status"` region so a change is announced rather than only rendered.
- **Copy runs through `useCopyFeedback`**, not a second timer. The hook gained optional `holdMs` and `notify`; every existing caller is byte-for-byte unchanged. The **failure** toast is deliberately not opt-out — an inline confirmation never renders on a denied clipboard, so suppressing it would make the click look dead.
- **Retry is wired.** `runAgentTurn()` is extracted from `send()` so both entry points share one state machine. `regenerate()` re-answers a turn from the nearest **user** message above it, going through the same single `interrupt()` path as stop and reset, and truncating from the target rather than replacing in place (a replaced reply would leave later turns answering something that no longer exists). The index is re-found inside the state updater so a concurrent update cannot truncate at a stale position.
- **Its reason for existing is the STOP case.** Verified: stop mid-stream freezes the partial at 28 chars with no late chunks; regenerate drops that partial, keeps the user bubble (question appears once, not twice), and streams a whole reply in its place.

Measured live: glyphs 14px desktop / 16px mobile, pitch 28px / 32px, ink `text-muted-foreground` resting and `text-foreground` active — Figma's `neutral/500` and `neutral/200` mapped to semantic tokens so both flip with the theme.

### The Ask AI composer floats over the thread `71c62a5`

**`ask-ai-panel.tsx`**

The composer was a flex **sibling** of the thread, so every field resize stole height from the message region — **20px of drift per line**, and the empty state slid from y=331 to y=301 as the field grew.

It is now `absolute`, out of flow, and the scroll viewport runs the **full height of the body to the panel's bottom edge**. Content passes underneath and fades out into that edge, per the user's designs.

- **Fade mask, not an overlay.** `mask-image: linear-gradient(to bottom, black calc(100% - 174px), transparent calc(100% + 24px))` on the scroll region, with a `-webkit-` twin reusing Tailwind's own `--tw-mask-linear` so there is one gradient and the prefixed copy cannot drift. A mask removes alpha rather than painting a colour, so it needs **no surface token** and is theme-agnostic. Stops are **lengths, not percentages** — a percentage ramp would stretch on a taller viewport and start dimming the newest turn. The end sits one air-step *past* the panel edge so the sliver of thread below the composer stays faintly legible instead of being erased before it gets there.
- **Every offset derives from the field's measured geometry**: 118px at rest, 158px at `max-h-20`, 16px inset. 174px is the reserve and the fade start; 158px stops the empty state so it keeps centring above the field; the FAB keeps 198px so it never collides. These are off the 4px grid — the field's 1px borders put them there, and they must be its real rendered heights or the empty state slides off its baseline.
- **The empty state does not move.** It was `inset-0`; on a wrapper that now runs under the composer that would have dropped it by half the reserve. `bottom-[158px]` reproduces the exact pre-float centring box.
- **Resting gap above the field: 64px → 40px.** That 24px was the reserve's only slack, so the newest turn now meets the field's top edge at full height and slides behind it as the field grows — which is what the fade is for. It returns to 40px the moment the field shrinks.

| | Composer | Scroll viewport | Empty-state title | Thread y | scrollTop |
| --- | --- | --- | --- | --- | --- |
| Before | 98 → 158px | 698 → 638 | **331 → 301** | 22 → −38 | 58 → 118 |
| After | 98 → 158px | **836 constant** | **321 constant** | **constant** | **constant** |

Zero movement at every field size, with an empty thread and a populated one. The FAB stays on the wrapper, outside the masked region, so the fade never touches it (opacity 1.0, always ≥24px clear).

**Deferred:** mobile soft-keyboard handling. The absolute positioning makes it easier, not harder — a future `visualViewport` handler only has to offset one element, with no flex geometry entangled.

## Sections

*No section-level changes today.*
