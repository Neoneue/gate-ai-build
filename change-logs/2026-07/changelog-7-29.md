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

### Elevation moves to Tailwind’s shadow scale — five bespoke families deleted `a81067b`

**`src/index.css`** · **`design.md`** · 12 component / page call sites

Standing rule, restated and now enforced: **the project uses Tailwind shadows, not invented ones.** The Figma file scales elevation on Tailwind's steps, so the code does too. This was drifting badly — `--shadow-border`, `--shadow-border-hover`, `--shadow-popup`, `--shadow-modal`, and `--shadow-card-soft` were five hand-authored families (light + dark), and `--shadow-xs` itself carried a retuned `0.055` alpha documented as "Tailwind default darkened ~10%".

- **`shadow-2xs` → `shadow-lg` added to `@theme`, copied byte-for-byte** from `node_modules/tailwindcss/theme.css` (v4.2.4, lines 406-410). Restated in the token layer rather than left implicit so drift from upstream shows up as a diff. Documented as `design.md` §5.0 with the exact values in a table.
- **Assignment, per the user:** menus/popovers → **`shadow-md`**; modals → **`shadow-lg`**; the soft-lift tier → **`shadow-sm`**; cards and tables → **`shadow-xs`**.
- **All five legacy families deleted**, light and dark. `--shadow-border-hover` turned out to have had zero consumers.
- **`--shadow-xs` is back to stock `0.05`**, and the dark theme's `--shadow-xs: … / 0.4` override is **gone**. One scale, one set of values, both themes.
- **The ring layer is the real migration risk.** Every deleted token bundled a `0 0 0 1px` ring *plus* a lift; Tailwind's steps are lift only. Surfaces that leaned on the ring for their edge now carry an explicit `border border-border`. Most already had one — **`CompactKpi` and the `Artboard` shell did not, and were given one.** An edgeless converted surface means a missing border, not too small a shadow.
- **Tables were already correct** and needed no change: they carry no shadow of their own, they sit inside a `Card`. Same for `Card` / `KpiRail` / `EmptyState`, on `border border-border shadow-xs` since 2026-05-15.

**Known cost, accepted knowingly:** the deleted dark tokens ran at 0.3–0.6 alpha because Tailwind's 0.05–0.1 is tuned for light grounds and nearly vanishes on near-black. Dark elevation now reads softer, with the `border-border` hairline carrying most of the separation.

**Two orphans shipped briefly and were caught in review.** `SelectContent` and `AlertDialog` still referenced the deleted `--shadow-popup` / `--shadow-modal`, so they rendered with **no shadow at all** — reported from the Filters dialog, where the Type dropdown sat flat on the modal. Root cause is a tooling habit, not a typo: the sweep grepped with `awk 'length($0)<400'` to keep long class strings out of context, and both call sites live on lines longer than that, so they were silently filtered out of the results. **A length-filtered grep is not a completeness check.** The re-sweep used `grep -rl` with no filter. `select-variants.ts` was also normalised from `shadow-(--shadow-xs)` to the plain `shadow-xs` utility — same value, but the arbitrary-property form invites the same class of miss.

Verified in the browser: the workspace menu and the in-dialog Select both read clearly at `shadow-md`, borders intact.

### New `--accent-muted` token — hover is half of selected `a81067b`

**`src/index.css`** · **`design.md`**

Hover and selected were the same fill. Every menu row, every Select option, and every sidebar nav item highlighted at `bg-accent` — the exact value the *selected* row already carried — so the row you were pointing at was indistinguishable from the row you were on. The report, on the Ask AI session dropdown: *"the hover state should be 50% opacity of the active state. otherwise it's too solid."*

The two states now split at the token layer. **`--accent` is the SELECTED fill; `--accent-muted` is the HIGHLIGHT fill (hover + focus-visible), the same accent at half strength.** Strength-named rather than state-named, matching `--card-muted` — focus-visible uses it too, so `--accent-hover` would have been a lie.

Defined in **both themes** as `color-mix(in oklab, var(--accent) 50%, transparent)`, exposed through `@theme` as `bg-accent-muted`. **Derived, not resolved**, on purpose:

- it tracks `--accent` automatically if that value ever moves; and
- being translucent it lands half-way toward the accent from *whatever surface it sits on*, so it holds the same relative strength on `--card` (Menu popup), `--popover` (Select popup) and `--sidebar` (nav rail) — three values that diverge in dark (neutral-900 / neutral-800 / neutral-950).

An opaque value cannot do that. The midpoint between dark's `--accent` (neutral-700) and `--card` (neutral-900) is neutral-800 — which *is* the `--popover` surface, so an opaque token tuned for menus would have been invisible inside every Select. Measured live: light resolves to `oklab(0.97 / 0.5)` ≈ neutral-50 over white; dark to `oklab(0.371 / 0.5)`. **No `bg-accent/50` anywhere at a call site** — the modifier is banned, the token is the interface.

## Components

### Menus, Select, and the sidebar split hover from active `a81067b`

**`menu.tsx`** · **`select.tsx`** · **`multi-select.tsx`** · **`sidebar.tsx`** · **`ask-ai-panel.tsx`** · **`workspace-switcher.tsx`**

Every highlight fill moves to `bg-accent-muted`; every selected fill stays at full `bg-accent`.

- **`MenuItem` gains an `active` prop.** It sets `data-active="true"`, and the recipe owns all three behaviors: active = full accent, other rows highlight at half, **hovering the active row does not change it**. That last one is the trap this API exists to close. `data-[highlighted]:bg-accent-muted` in the recipe and a call-site `data-[highlighted]:bg-accent` are the same specificity, so which one wins is an accident of Tailwind's output order — if the muted rule wins, the *selected* row lightens on hover, the precise opposite of the intent. Inside the primitive it is decided by **specificity, not order**: the active-and-highlighted rules stack two data-attribute selectors (0,3,0) against the plain highlighted rule's one (0,2,0), so the full fill provably holds.
- **The duplicated `ACTIVE_ITEM` constants are deleted** from `ask-ai-panel.tsx` and `workspace-switcher.tsx` — the same hand-copied `"bg-accent data-[highlighted]:bg-accent"` string in two files. Both now pass `active={…}`. One place expresses the rule.
- **`SelectItem`**: `focus:` / `data-[highlighted]:` → `bg-accent-muted`. **`MultiSelect`**: the "(Select All)" row and every option row, `hover:` / `focus-visible:` / `has-focus-visible:` → `bg-accent-muted`.
- **Sidebar nav** (in scope after *"this also applies to the side nav"*): both inactive branches — the collapsed 36px icon rail and the expanded list — move to `hover:bg-accent-muted`. The active branches keep full `bg-accent`, and the expanded active item keeps its `border-border` + `shadow-xs`; that extra contrast is deliberate and the hover state deliberately does not imitate it. Disabled branches untouched. The nested-ternary structure was left exactly as it was — this change is the fill, nothing else.

Verified in **both themes** with computed values read off the live DOM, not screenshots. Workspace switcher, Ask AI session picker (3 sessions), a `Select`, the collapsed rail at 1440 and the expanded nav at 1920 — in every case: selected row `oklch(0.97)` light / `oklch(0.371)` dark, hovered sibling `oklab(… / 0.5)`, selected row **unchanged** while a sibling is hovered *and* while hovered itself. The destructive `MenuItem` branch is untouched: it has no selected state to be half of, and its `bg-danger-50` / `dark:bg-danger-500/15` tints were already light.

**One thing to know:** in light the highlight resolves to ≈ neutral-50 on a white popup — quiet by design and correctly weaker than the selected row, but it is a subtle step. It is exactly the 50% that was asked for; if it reads too faint in use, the fix is the ratio in one token, not a sweep.

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

### The Ask AI header trigger becomes a real chat picker `a81067b`

**`ask-ai-panel.tsx`** · **`use-ask-ai-thread.ts`** · **`ask-ai-script.ts`** · **new `lib/ask-ai-title.ts`**

The header's "New session" caret was a visual placeholder. It is now a wired dropdown over a list of chat sessions, each carrying a title derived from its own first question.

- **Copy: "New session" → "New message"**, and the `SquarePen` icon button's label with it. The button that OPENS a chat and the row that IS an unopened chat are the same idea, so they carry the same word — one constant, `NEW_CHAT_LABEL`, feeds both.
- **Titles are derived once, at send time, in the same state update as the user bubble** — so the name is on the trigger while the "Thinking…" row is still on screen, not after the reply lands. Only a `title === null` session gets named; later turns never re-title, so a chat's name is stable for its whole life.
- **Two layers.** Scripted first: `selectTitle()` sits next to `selectReply()` in `ask-ai-script.ts`, so a matched intent owns both its answer and its name and the two cannot drift ("Setup Gate Connect app"). Heuristic otherwise, in `lib/ask-ai-title.ts`: strip leading scaffolding (`how do i`, `can you`, `what is`, `tell me about`, `please`, …, repeatedly, lowercase compare / original-case cut), strip trailing `?.!`, sentence-case the first character only, cap at 6 words. Measured live: "How do I rotate a key?" → **Rotate a key**; "What is the audit trail" → **The audit trail**; "Can you explain the very long winded policy configuration workflow please" → **Explain the very long winded policy**.
- **Truncation is a RENDER concern, never stored.** `truncateTitle()` caps display at 40 chars, cuts on a word boundary, appends `…`, and the untruncated name stays in a `title` attribute. Measured: "Configure organization-wide authentication credentials rotation" renders as "Configure organization-wide…", full text on hover. The trigger is `min-w-0` with a `truncate` label and a `shrink-0` caret, so a long name shrinks the BUTTON — **header stays 64px and the caret stays in view at every length**.
- **The hook owns sessions, not one flat thread.** `AskAiSession = { id, title, messages }`, ordered newest first, with one always active; `messages`/`phase`/`isBusy`/`send`/`stop`/`regenerate`/`reset` behave exactly as before for the active chat, so the panel is the only file that knows the list exists. **Every write targets a session by id** — an agent turn still resolving when the user switches chats can only ever write back to the chat it started in.
- **`reset()` no-ops on a blank, untitled chat.** It already IS a new chat; opening a second would put two identical "New message" rows in the picker and lose nothing in return. It still aborts through the single `interrupt()` path.
- **`selectSession()` returns the phase to `idle`, not `complete`.** Both are non-busy and the composer's placeholder map names only `thinking`/`replying`, so they render identically — and `idle` is the one state correct for a restored chat whether its last reply finished, was stopped, or never happened.
- **Built on the `WorkspaceSwitcher` recipe, not a new one**: `MenuTrigger render={<Button size="default" variant="outline" />}`, `type-label-14` label, muted `ChevronsUpDown`, `MenuContent align="start" side="bottom" sideOffset={8}` at `min-w-[var(--anchor-width)] p-2`, same `bg-accent` active row + `text-primary` `Check`.
- **Four rows, then it scrolls: `max-h-38` (152px).** Derived off the primitives, not picked: the popup's own `p-2` (8 + 8) + 4 × the `MenuItem`'s `h-8` (32) + a deliberate 16px half-row. It was first built at a flush 144px, which measured (6 chats, popup 144px, `scrollHeight` 208px, rows 32px) as visible slices `[32, 32, 32, 32, 7, 0]` — the 5th row's 7px sat *under* the bottom padding with its centred label outside it, so the list scrolled but nothing said so. **The peek IS the affordance**, so the cap carries a half-row on purpose. Ruled 2026-07-29: more affordance should always be available.

Verified in **both themes** at 1512×900: fresh panel reads "New message"; the trigger flips to "Setup Gate Connect app" **while the thinking row is still showing**; the icon button opens a chat that lands as row 1 with the previous one below; clicking the oldest row restores its full thread.

### The thinking row swaps lucide `Brain` for the `@dotmatrix` 3×3 pulse `a81067b`

**`ask-ai-thinking-row.tsx`** · **`ask-ai-script.ts`** · vendored `dotm-3x3-11.tsx` / `dotmatrix-core.tsx` / `dotmatrix-hooks.ts` / `dotmatrix-loader.css`

The placeholder `Brain` glyph (a stand-in noted in that file as unreconciled against Figma) is replaced by the `@dotmatrix` glyph-pulse loader, installed via `pnpm dlx shadcn@latest add @dotmatrix/dotm-3x3-11`. `components.json` gains the `@dotmatrix` registry.

- **No `colorPreset`, on purpose.** Every preset the component ships hardcodes a hex or gradient (`#34d399`, `linear-gradient(… #ff5f6d …)`) that would not flip with the theme. Its default is `currentColor`, so the mark inherits the row's `text-muted-foreground` and themes correctly for free. The preset table stays unused, not deleted — it is vendor source.
- **Sized by pinning the gap, not by `size`.** First attempt passed `size={16}` and rendered visibly squished horizontally: `getMatrix3Layout` *infers* the gap from `size` (`floor((16 − dotSize × 3) / 2)` = 3), and at 16px the inferred spacing disagrees with the box it draws into. `dotSize={4} cellPadding={2}` sets it explicitly and lands on 16px exactly — 3 dots × 4 + 2 gaps × 2 — so nothing is scaled by a fraction.
- **`TIMING.thinking` 1500 → 2500ms.** The hold read as a flash once the mark was animated; the pulse needs a beat to complete a motif before the first token lands.
- **The vendored files are excluded from ESLint and Biome** (`src/lib/dotmatrix-*`, `src/components/ui/dotm-*`, `dotmatrix-loader.css`). They produced 79 house-style errors — nearly all `react-refresh/only-export-components` on a module that legitimately exports both components and helpers — and any fix would be overwritten by the next `shadcn add`. **Correctness is not waived: `tsc -b` still covers them**, which is why three unused imports the registry ships were dropped from `dotmatrix-core.tsx` (a TS error blocks the Vercel build).

Known and left alone: the impeccable design hook flags the 18 literal hexes in that unused preset table. They are vendor source in a code path this app never enters, and no ignore was added to silence it.

## Sections

*No section-level changes today.*
