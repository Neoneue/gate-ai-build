# UI Changelog: 2026-07-30

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-29.md`](./changelog-7-29.md)

---

## Conventions

### `DialogContent` gains `density` — a dialog is 16px, a modal is 24px `f0896d9`

**`dialog.tsx`** · **`design.md`**

`DialogContent` was `p-6` for everything, bumped there on 2026-05-11 because the live detail modals needed the air. The Security event's "Add a note" surface is a different animal — one field, one decision — and wanted 16px. That is a primitive-level distinction, not a call-site override.

- **`density="default"` is `p-6` (24px), `density="compact"` is `p-4` (16px).** Default is unchanged, so every existing call site renders pixel-identically. Prop name matches `<Card>`'s `density`, which already exists.
- **The padding moved out of the popup recipe** into a density map applied *ahead* of `className` in the `cn()`. That ordering is load-bearing: `DialogScrollContent` overrides with `p-0` through `className` and has to keep winning. Verified through the project's `tailwind-merge` against every real call site — `DialogScrollContent` still resolves `p-0`, `Team` / `ApiKeys` / `plan-comparison` / `feedback-fab` all unchanged.

### `ToolResultCode` goes sans, and breaks at words `f0896d9`

**`tool-result-code.tsx`** · **`design.md`**

The Conversations trace renders `Tool · Read` bodies through this recipe, and in mono they read as a dense wall. Two changes, one primitive, one consumer.

- **`font-mono text-sm` → `type-copy-14-tight`.** Same 14px, sans, no tracking. It reuses the voice Ask AI already applies to `code` / `pre` inside a reply rather than minting a parallel one. The `<code>` element stays — only the face moved, the content is still machine output.
- **`break-all` → `break-words`.** `break-all` splits at any character, which is what produced `sta/rted` and `$0.025/8` in the trace. `break-words` breaks at word boundaries and only splits inside a word wider than the line, so a long unbroken token still cannot overflow the bubble: same protection, no gratuitous mid-word splits.
- **`design.md` §2's mono scope clause named "request/transcript surfaces" as mono territory**, which this contradicted. It now carries a second, hard-scoped carve-out: `ToolResultCode` is the *only* excepted transcript surface. IDs, timestamps, numerics, and `InlineCode` on the same page stay mono.

## Components

### Ask AI canvas — the dark dot grid was carrying too much texture `7916c53`

**`index.css`**

Retuned in place against the live panel, one day after the 7-29 pass. The two grounds are not symmetric and the light twin was the one that needed weight; dark had been left too hot at the same stops, so light `neutral-200` dots on the `neutral-900` panel competed with the thread instead of sitting behind it.

- **`--ask-ai-canvas-strength` 0.6 → 0.3 in dark only.** Light stays at 0.8. Walked down in 0.1 steps in the browser — the same ladder the token has always been tuned on.
- **`--ask-ai-canvas-fade-floor` goes per-theme, 0.15 → 0.05 in dark.** It had been deliberately shared across both themes, with only the top stop varying; that is no longer true and the comment at the definition says so. A **lower** floor is a **stronger** fade, so the dark grid nearly dissolves at the bottom of the panel rather than holding the legible trace light mode wants. Light is unchanged at 0.15.
- **No new consumers.** Both fade stops in `.ask-ai-canvas` already read the token through `var()`, so the dark override cascades with no change to the utility.

### Ask AI empty state — the support suggestion read as a command `7916c53`

**`ask-ai-empty-state.tsx`**

The fourth `SUGGESTIONS` chip said **"Help contact customer support"** and now says **"Help contacting customer support"**. The label is sent verbatim as the first user message, so it has to read as something a person would type; the old phrasing parsed as an imperative aimed at the agent. Nothing else references the string.

### New primitive: `ToolCallCard` — the CALL card inside an assistant bubble `f0896d9`

**`tool-call-card.tsx`** · **`design.md`** · **`data-model.md`**

Matches the shipped product's assistant-reply pattern: a nested card per tool call, `CALL` eyebrow + tool name, arguments below.

- **Radius and padding step down concentrically** — `rounded-xs` (4px) inside the bubble's `rounded-md` (8px), `p-3` inside the bubble's `p-4`. Flat (border, no shadow): an inset panel inside a bubble, not a card lifted off a canvas.
- **Built from flex `<span>`s, not `<div>`s.** Not cosmetic. `MessageBlock` renders the bubble as a `<button>` whenever the message is cross-link selectable, which is every message on this surface, and a `<button>` takes phrasing content only. `display:flex` on a span is the same box with valid markup. The existing `<ToolResultCode>` is a `<code>`, so this never came up before.
- **14px on the tool name and args; the `CALL` eyebrow keeps the locked Eyebrow voice at 12px.** The reference build renders the whole thing at 12 and it was too small.
- **Args are mono and clamp to `line-clamp-3`.** Mono because these are short machine *input* (median 91 chars), unlike the multi-line result walls that drove `ToolResultCode` to sans. The clamp exists because captured args run to 7,612 chars and one `evaluate_script` payload would otherwise blow out the bubble.

### `MessageBlock` default fill: `bg-background` → `bg-card-muted` `f0896d9`

**`message-block.tsx`** · **`design.md`**

Two reasons, one token.

- **The nested-card inversion needs headroom below the bubble.** An inner card must read lighter than its parent in light and **darker** in dark. `--background` is neutral-950 in dark — the floor of the ramp — so nothing could sit below it and the dark direction inverted backwards. `--card-muted` is neutral-800 there, leaving exactly the step the pattern needs against the card's neutral-900.
- **`bg-background` was already off-contract.** `design.md` §2 reserves it for the dashboard content canvas and bars it from darkening a component.
- **No-op in light** — both tokens resolve to neutral-50. Only the `default` tone moved; the `warn` / `danger` tinted fills and the whole `selectedTone` ladder are untouched. One runtime consumer, `ConversationDetail` — the `MessageBlock` in `RequestDetailBody` is an unrelated local component that shares the name.
- **Deliberate dark side effect:** a `warn` / `danger` bubble now reads slightly *darker* than its plain neighbours instead of lighter, because the tint composites over the panel. Status is carried by hue and the tinted border, not luminance, and this brings dark into agreement with light. Do not "fix" it by re-tinting the tone strings.

## Sections

### Security event modal — an "Add note" button and its dialog `f0896d9`

**`security/EventsTable.tsx`** · **`security/events-data.ts`**

- **Footer.** `Mark event` stays flush left; the verdict Select is now grouped with a new `Add note` button 12px to its left (`gap-3`). The button is `size="sm"` (32px) to match the Select's `h-8` — this repo's Select scale sits one step below the Button scale, so `size="default"` would have stood 4px proud.
- **The dialog.** Nested over the event modal, which stays open behind it. `nestedBackdrop` supplies the dim and blur — Base UI's `Dialog.Backdrop` dedups when dialogs nest, so only the outermost reaches the DOM and an inner dialog would otherwise open over an undimmed parent. This is that prop's first consumer anywhere in the repo. 140px fixed text well (`h-35`), `field-sizing-fixed` to defeat the primitive's `field-sizing-content` auto-grow, scrolling on overflow. Footer is Clear (ghost, flush left, disabled while empty) · Close (outline) · Save (primary), the same split-footer string the Filters dialog in this file already uses.
- **State.** A committed note and a draft: opening reseeds the draft from the committed value so a saved note is still there, Close discards an uncommitted edit, Save commits and toasts. No backend, same as the verdict Select beside it.
- **Detection cards drop their pass description.** A passing check is title + `pass` badge alone; only a firing check carries a reason. Gated on `firing`, *not* on `action === "blocked"` — 18 of 27 events are redacted or flagged, and gating on blocked would have stripped the explanation off all of them. `passText` is kept in `events-data.ts` for reference, with its comment corrected to say it no longer renders.

### Conversations trace — assistant tool calls, and a reflow that finally respects its container `f0896d9`

**`conversations/ConversationDetail.tsx`** · **`data/conversationDetail.ts`** · **`conversations/types.ts`** · **`data-model.md`**

- **Assistant turns render their tool calls.** `ConversationMessage` gains `toolCalls?: ConversationToolCall[]`, derived per row from `toolName` + `toolArgs`. The redundant `"<Tool>: "` prefix comes off, but only when it matches that row's own tool — the 1 value of 89 without one renders whole.
- **Args are rendered as captured, never re-shaped.** 76 of 88 are plain command strings rather than JSON; wrapping them in a `{"command": …}` envelope would have invented payload structure that was never captured.
- **A turn that calls a tool without prose now emits an assistant message too.** Previously none was emitted, so 57 of 89 calls were invisible — a result appeared with no visible call. Assistant messages go 43 → 100 for the scripted conversation, and the Messages panel's turn counter reads that same set.
- **The two-column split now queries its container, not the viewport.** It was keyed to `lg:`, so with the sidebar and Ask AI panel open it squeezed to ~370px panes instead of stacking, until the whole *window* crossed 1024px. Now `@4xl` (896px), applied to all three tabs' grids, footer rows, and footer buttons. `@3xl` was rejected: at a 1512px window with both panels open the container is 832px and would have stayed two-up at 408px panes — the exact reported state.
- **The container is established on `DialogScrollBody`'s className**, not inherited from `<main>`. `ConversationDetailBody` also renders inside a portaled dialog, which has no `@container` ancestor; keying to `<main>` would have pinned that mount to one column forever.
