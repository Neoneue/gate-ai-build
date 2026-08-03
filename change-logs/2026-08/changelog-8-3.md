# UI Changelog: 2026-08-03

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-30.md`](../2026-07/changelog-7-30.md)

---

## Conventions

### `type-copy-14-tight` is deleted — it was a no-op alias `a1279c9`

**`index.css`** · **`lib/utils.ts`** · **`design.md`**

The scale carried two tokens at 14px. `type-copy-14` is `text-sm`; `type-copy-14-tight` was `text-sm/5`. Tailwind v4 defines `--text-sm--line-height` as `calc(1.25 / 0.875)`, which resolves to `1.25rem` — the exact value `/5` supplies. The two produced byte-identical CSS, so the "tight" variant had never rendered differently from the plain one since the day it was written.

- **The token is gone from `index.css`** and from the voice allowlist in `lib/utils.ts`. All 15 call sites now use `type-copy-14`: `ask-ai-message`, `ask-ai-composer`, `ask-ai-thinking-row`, `tool-result-code`, `card`, `Policies`, `EventsTable`. Zero visual change, verified by computed style rather than by eye.
- **Three raw `text-sm/5` in the Ask AI prose recipe** (`code`, `pre`) were the same redundancy spelled inline. They are now `text-sm`; `text-sm/5` no longer appears anywhere in `src`.
- **The copy scale is Tailwind's own size/line-height pairing** at the three sizes that matter: 12/16, 14/20, 16/24. `design.md` §"Type scale" drops the duplicate row.

Still outstanding, deliberately untouched: `type-copy-18` is `text-lg/7`, and `/7` is *also* Tailwind's default for `text-lg` — the same redundancy one rung up. `type-copy-20` (`text-xl/9` = 20/36) and `type-copy-24` (`text-2xl/9` = 24/36) genuinely deviate from the defaults (28 and 32). **Resolved the same day — see the entry below.**

### The copy scale is finished — `type-copy-20` and `-24` deleted `281ecda`

**`index.css`** · **`lib/utils.ts`** · **`design.md`** · **`public/design-system.html`**

Follow-up to the entry above, closing the three sizes it left open.

- **`type-copy-18` drops its `/7`.** `text-lg/7` is 28px and Tailwind's `text-lg` already resolves to 28px, so the override said nothing. Verified live on `/upgrade`, where all three call sites live (the " per month" beside a price): 18px / 28px / -0.18px before and after.
- **`type-copy-20` and `type-copy-24` are deleted.** Neither had a single call site — only a definition and an allowlist entry — so their deviation from Tailwind's 20/28 and 24/32 (both were `/9`, 36px) never rendered anywhere. There was no design decision to preserve. Removed from `index.css`, the voice allowlist in `lib/utils.ts`, the `design.md` scale table, and the mirrored token layer in `public/design-system.html`, which defined them too. No specimen on that page referenced either, so nothing lost content.
- **The copy scale is now four tokens, each a bare Tailwind size class** with the line-height implied: 12/16, 14/20, 16/24, 18/28. `tracking-snug` still applies at 16 and above — tighter tracking as size grows is deliberate, not drift.

## Sections

### Settings — section titles move above their cards `a1279c9`

**`Settings.tsx`**

Profile and Security each led with a `CardHeader` *inside* the card. Both now lead with a title block *above* it, which is the pattern every other page already uses for a titled section over a card.

- **`CardTitle` / `CardDescription` / `CardHeader` are gone from both cards**, replaced by `<SectionTitle as="h2">` plus the standard subtitle `<p>` in a `flex-col gap-1` wrapper. The 4px title-to-subtitle gap that `CardHeader gap-y-1` provided is preserved. Each card now opens directly on `CardContent` and keeps its 16px top padding.
- **Both sizes step up.** Title `type-heading-16` → **`type-heading-20`** (the `SectionTitle` primitive — there is no primitive at 18, and reaching it would mean overriding a primitive's typography at the call site). Subtitle `type-copy-14-tight` → **`type-copy-16`**, the subtitle recipe already used in 15+ files. Verified live: 20/28/500 and 16/24.
- **Section rhythm matches the canonical spec** — first section `flex flex-col gap-4`, second `mt-2 flex flex-col gap-4`, both direct children of the page's `gap-6` column.
- **Heading outline no longer skips a level.** Lifting the `h3` `CardTitle` out of the Security card orphaned `Registered passkeys` at `h4`, so it steps to `h3`. Visual voice unchanged — only the tag moved. Outline is h1 → h2 → h3.

Form fields, dirty state, the `beforeunload` guard, and save/reset behavior are untouched.

## Components

### Ask AI reply actions — thumb ratings hidden behind a flag `a1279c9`

**`ask-ai-message.tsx`**

The reply feedback row ships as **copy + regenerate only**. Product decision, and explicitly temporary, so the rating pair is gated rather than removed.

- **`SHOW_REPLY_RATING` is a module-level `boolean`, currently `false`.** The annotation is load-bearing: without it TypeScript narrows to the literal `false`, marks the branch dead, and stops type-checking the JSX inside — it would rot silently while hidden. Flipping the one boolean restores both buttons verbatim.
- **Nothing was deleted.** `rating` state, `rate()`, `THANKS_TEXT`, the 3s `thanksVisible` timer and its unmount cleanup, and both icon imports all stay. The `aria-live` region is untouched and still announces "Copied!"; the "Thanks for your feedback!" branch is simply unreachable while the flag is off.
- **No layout fix was needed.** The row's `ml-auto` and its `gap-0 px-0` → `lg:gap-1 lg:px-1` trade absorb the two missing children; the remaining glyphs keep their 28px desktop / 32px mobile pitch relative to each other, and the row still reserves its box while `showActions` is false.
- **The block comment above the row is marked `TEMPORARILY HIDDEN`**, so the next reader does not diff against the Figma node and conclude the affordances were dropped.
