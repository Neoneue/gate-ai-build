# UI Changelog: 2026-07-28

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-27.md`](./changelog-7-27.md)

---

## Conventions

### Streaming chat: follow the stream by intent, not by geometry `2cb2fe0`

**`src/hooks/use-stick-to-bottom.ts`** (new)

The pattern for any future streaming surface, and a correction to a claim made earlier in the Ask AI work.

**`overflow-anchor` does NOT pin a view to the bottom.** Scroll anchoring stabilises content changing *above* the viewport; it never follows content appended *below* it. Measured while a reply streamed: the gap from the bottom climbed `0 → 36 → 217 → 458 → 819px` the moment the region became scrollable. There is no native CSS stick-to-bottom, and the comments claiming otherwise were removed rather than left in place.

**The working shape keys off user intent, not the scroll position.** Deriving "am I following" from "am I at the bottom" fails: each streamed chunk pushes the bottom sentinel past the 60px threshold, which disarms following even though the user never touched the scroll. Instead:

- Content growth (`ResizeObserver`) while armed → snap to the end, instant.
- Only real input (`wheel` / `touchmove` / `keydown`) recomputes intent, on the next frame, from the true position. Scrolling away disarms; scrolling back re-arms.
- Pressing the scroll-to-latest FAB, or sending a message, re-arms explicitly.

No scroll listener anywhere — it reuses the FAB's existing IntersectionObserver and the input handlers already bound for smooth-scroll cancellation. Verified: gap held at `0` across 12 samples through a full reply; scrolling up mid-stream stopped the follow and surfaced the FAB; the FAB press resumed it.

### The Button size scale realigns to shadcn — `default` is the largest `f6df27a`

**`button.tsx`** · **`design.md`** · **`.claude/rules/design-tokens.md`** · 69 call sites across 30 files

The scale sat **one step below shadcn's** — `default` was 32px where shadcn's is 36px — so every author reached for `lg` to get an ordinary button. The census across **120 buttons: 62 uses of `lg`, zero uses of `default`.** The API's default was dead code and `lg` was the real one.

| | xs | sm | default | lg | xl |
| --- | --- | --- | --- | --- | --- |
| shadcn | 24 | 32 | **36** | 40 | — |
| before | 24 | 32 | **32** | 36 | 44 |
| after | 24 | 32 | **36** | *gone* | *gone* |

- **`lg`, `xl`, and `icon-lg` are deleted from the type**, not deprecated. A previous sweep left them defined and they came back; now `tsc` rejects every stale call site. Migration ran as an **AST codemod** (63 `lg`/`xl` → `default`, then 6 `icon-lg` → `icon`) because `size="lg"` appears 84 times in `src` but only 62 are on a `<Button>` — `Switch`, `Input`, `Select`, and `HeroNumeric` take it too and a find-replace would have corrupted them. Two `size = "lg"` prop defaults (`alert-dialog`, `ApiKeys`) were invisible to the codemod and caught by `tsc`. **Pixel-identical:** `lg`'s recipe simply became `default`'s.
- **Icon padding is symmetric now** — `px-2.5` (10px both sides), which is shadcn's own `has-[>svg]:px-2.5`. It replaces a local `pl-2`/`pr-2` (8px icon side vs 12px text side) that upstream has at **no** size. **10px is a deliberate carve-out from the 4px grid** — the only sanctioned `*.5` in the system, recorded in `design-tokens.md`.
- **Seven icons inside Buttons had no `data-icon`**, so the padding rule matched nothing and they rendered 12px. The top bar (Ask AI / Docs / workspace switcher) was the visible case. Five more were checked and deliberately left unmarked: two aren't inside a Button at all, two are absolutely-positioned arrows out of flow.
- **New:** `shape` (`default` / `pill` / `circle`) and `variant="raised"` (`--control-raised`, lighter than a card in dark, which `outline` can't express).

Verified across 16 routes: **no button above 36px**, heights cluster 24 / 32 / 36, console clean.

### Every label takes the label voice, at `font-medium` `30de622`

**`design.md` §3 · `.claude/rules/no-handrolling.md` (new) · `scripts/check-design-tokens.mjs`**

The sidebar's active nav item had regressed to 400, and the sweep that followed found the same defect everywhere: `type-copy-*` is body text at `font-normal`, and putting it on a label silently drops the label to 400. Because the voice sits on an inner `<span>`, it also overrides the `font-medium` the parent `Button` already set, which is invisible in review.

**Before → after.** Nav items, tabs, pagination, select and multi-select items, table pagination footers, the workspace switcher, KPI tiles, and the page-level controls across ApiKeys, AuditTrail, Billing, BillingFree, Conversations, Dashboard, Limits, LimitsFree, Models, Team, TrendCard, RequestsTable, and EventsTable move `type-copy-*` → `type-label-*`. Pasted `font-normal` overrides come off `Button` call sites entirely: weight belongs to the primitive.

**The test, applied in order:** if you can click it or it names something → Label; if it is prose the user reads → Copy; if it heads a section → Heading. Two carve-outs: segmented-control labels are the Eyebrow voice, and inline text links mid-sentence stay Copy. Quiet-looking labels still take the label voice — colour does the quiet work (`text-muted-foreground`), weight does the structural work.

`design.md` §3 "Label voice — the enumeration" is the single source for which role takes which voice; `no-handrolling.md` deliberately does not keep a second list. `lint:design` now fails on a copy voice in the `className` of a button / trigger / menu-or-select item / `Label` / `CardTitle` / `SectionTitle` / `TableHead`, or on a `<span>` nested inside one. The check is conservative by design: it cannot see a voice applied through a shared `cva` recipe, passed as a prop, inherited from an ancestor, or *absent* altogether. Green lint is necessary, not sufficient.

## Components

### Ask AI panel becomes a working chat (scripted agent) `2cb2fe0`

**`src/data/ask-ai-script.ts`** (new) · **`src/hooks/use-ask-ai-thread.ts`** (new) · **`src/hooks/ask-ai-thread-provider.tsx`** (new) · **`src/components/ui/ask-ai-thinking-row.tsx`** (new) · **`ask-ai-panel.tsx`** · **`ask-ai-composer.tsx`** · **`ask-ai-message.tsx`** · **`src/App.tsx`**

The thread starts empty. Send a question and the user bubble appears immediately, a **Thinking …** row follows after 400ms and holds 1.5s, then the reply types itself out at ~20 words/sec in 3-word chunks with ±45% jitter so the cadence reads natural rather than metronomic. `prefers-reduced-motion` skips the reveal and shows the finished reply after the thinking beat. `ask-ai-placeholder-thread.tsx` is deleted — its content is now the markdown string the script serves.

- **Trigger matching is loose.** Case and punctuation are normalised, then a match requires one setup word (`set`, `setup`, `install`, `connect`, `configure`, `start`, `add`) **and** one subject word (`gate`, `connect`, `gateconnect`, `app`, `gatekeeper`). "How do I install Gate Connect" hits it; there is no exact-string dependency. Anything unmatched returns a short honest reply stating the assistant is not connected to live docs yet — no fabricated product facts.
- **Replies are markdown now, not JSX.** Added `react-markdown` + `remark-gfm` — the renderer the real agent's output will need — so progressive reveal is a growing prefix of a string, revealed on word boundaries. **`ReplyProse` needed zero changes**: react-markdown v10 renders into a Fragment, so its output lands as direct children and both the `[&>*]:m-0` reset and the `gap-5` rhythm apply as designed. Rendering is element-for-element identical to the JSX it replaces (6 × h3, 5 × code, 5 × links, 5 × strong, 6 × li).
- **Composer states.** Placeholder swaps default → "The Gatekeeper is thinking…" → "The Gatekeeper is replying…" → default. The 32px send button becomes a stop button (square) while busy, halting the reply where it stands and keeping the partial text.
- **Sending while busy interrupts rather than queues**, so a new request can push through. It shares one `interrupt()` path with the stop button. The partial reply stays in the thread as a truncated turn — the user read that text, and removing it would rewrite history under them. `abort()` runs its listeners synchronously and the consumer re-checks `signal.aborted` each iteration, so no chunk from the aborted reply can land after the new user bubble (verified: frozen at 1224 chars at interrupt, still 1224 at +500ms).
- **The reply action row is gated on completion.** Copy on a half-streamed answer captures a partial and retry is meaningless mid-stream, so the row renders but stays `opacity-0` / `aria-hidden` / `tabIndex -1` while streaming and fades in when the turn completes. It keeps its 24px box reserved throughout, so completion causes no layout shift.

**Built for the swap.** `streamReply(question, { signal })` is an async generator yielding text chunks; replacing its body with a `fetch` + reader loop changes nothing else. No timers live in any component, and the `AbortController` is already threaded through so an interrupt will cancel the request rather than merely stopping the render. Plan for the real agent: [`plans/ask-ai-live-agent.md`](../../plans/ask-ai-live-agent.md).

The thinking row has **no Figma node** — none of the panel frames contains a thinking state — so it is built to a documented fallback: lucide `Brain`, `type-copy-14-tight`, `text-muted-foreground`, with the repo's `animate-ellipsis`. Reconcile when a node exists.

### Ask AI: an empty state, a new chat, and a composer that arms itself `6f73a79`

**`src/components/ui/ask-ai-empty-state.tsx`** (new) · **`ask-ai-panel.tsx`** · **`ask-ai-composer.tsx`** · **`button.tsx`** · **`src/hooks/use-ask-ai-thread.ts`** · **`src/App.tsx`** · **`DashboardChrome.tsx`** · **`src/index.css`** · **`design.md`**

The panel opened onto a blank surface, offered no way back to a clean thread, and needed a click before it would take a keystroke. Four changes close that.

- **Empty state.** Four suggestion rows, centred over the (zero-height) thread rather than replacing it, so `scrollRef` / `sentinelRef` never unmount and `useStickToBottom` keeps one stable set of nodes for the panel's whole lifetime. Selecting a row sends it as a normal question.
- **Two new Button axes.** `size="xl"` (44px — `h-11 gap-3 px-4`) is the step above `lg`, for full-width list-style actions where the control *is* the row. `shape` (`default` / `pill`) carries radius so no call site reaches for `rounded-full`. An `outline + pill` **compound variant** raises the edge on hover *and* press via the new `--border-hover` token — always one step more contrast than `--border` (neutral-300 light, white @ 20% dark). Deliberately scoped to that pair: raising the edge on every outline button is a site-wide change and its own decision.
- **New chat.** `reset()` on the thread hook drops every turn through the same `interrupt()` path as `stop()`, so there stays exactly one abort path, and returns the panel to the empty state.
- **The composer arms itself, then goes quiet.** It takes focus at the two moments the user is being invited to type — panel open (deferred one frame so the Sheet's own initial-focus pass below `lg` cannot steal the caret back) and new chat. Send deliberately does **not** pull the caret back: the field was sitting lit through the whole reply, which read as active when nothing was expected of the user.
- **Ask AI starts closed on every page load.** The `askai` localStorage persist is gone; state still lives above the router outlet, so one open holds for the session across navigation until the user closes it.
- **Thread → composer spacing** `gap-4` → `gap-6` (16px → 24px). 16px crowded the last turn's action row against the field. The scroll-to-latest FAB anchors to the same gap, so it moved up with it.

### Hand-rolled buttons: 19 page-level raw `<button>` down to 6 `f6df27a`

**5 new/extended primitives** · **17 call sites** · full parity spec in [`button-audit-7-28.md`](../../button-audit-7-28.md)

An AST sweep of all 120 `<Button>` instances and every raw `<button>` in `src` found 19 page-level hand-rolls — including **three byte-identical copies** of the back breadcrumb and **three copies** of the credit-amount tile. Every new primitive carries the old recipe **verbatim**, so the extraction moves zero pixels.

| New | Replaces | Why not an existing primitive |
| --- | --- | --- |
| `BackLink` | 3 back breadcrumbs | **Not `TextLink`** — TextLink is *underlined*; breadcrumbs are not |
| `OptionTile` | 3 credit-preset grids | **Not `Button`** — needs `role="radio"` + `aria-checked` so it announces "2 of 4 selected" |
| `MiniRadioGroup` / `MiniRadio` | BYOK/PAYG switch | **Not `Segmented`** — Segmented is a muted track with a card thumb; this is a card track with a muted thumb, i.e. inverted |
| `ExpandingAction` | "Mark invalid" | **Not a `Button` variant** — width-on-hover is not button behavior |
| `CopyButton size="segment"` | ApiKeys copy-key | flush split-well segment; `compact`/`sm` float a short button inside a taller well |

Also converted: **four hand-rolled circular buttons** (Ask AI composer ×2, scroll-to-latest FAB, reply-action glyphs) now compose `Button shape="circle"` — that variant exists *because* four files had each pasted the same `rounded-full` + press + focus recipe. Three local class-string constants deleted. The AuditTrail info glyph and Policies chevron move to `IconActionButton`; the finding paddles to `Button size="icon-sm"`.

**Three of the audit's own mappings were wrong and were reversed at the code** — each would have repainted working UI. They're recorded so the same wrong mapping isn't proposed again: the `TextLink`, `Segmented`, and `RowActionButton` rows above and in §8 of the audit.

**Six raw `<button>`s stay, deliberately.** The test: is this a *single definition* (a component whose job is to be that control), or *duplicated chrome pasted across files*? Only the second is what the no-handrolling rule targets. A disclosure trigger with `aria-expanded` **is** the correct element; a card-list row and a timeline step have no primitive that owns them (`RowActionButton` is table-cell only); `feedback-fab` stays at 48px by direction.

### Manage subscription: the Pro dialog matches the Free one `8518ab2`

**`src/pages/plan-comparison-dialog-pro.tsx`**

The modal on `/billing` had lost the featured-card blue that `/billing-free` still showed. The two dialogs are separate files and had drifted well past that one difference.

**Before → after**, each value copied verbatim from `plan-comparison-dialog.tsx`:

- **Featured card** — `border-primary/30 ring-1 ring-primary/20` → the blue border + gradient (`border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25`, `dark:border-blue-400/30 dark:from-blue-500/10 dark:to-blue-500/5`). The root cause of the missing blue was upstream of the border: `bg-card` sat in the card's *base* class string and painted over any gradient. It now lives in the non-featured branch only.
- **Benefit icons** — the `size-7 rounded-sm bg-muted` chip wrapper comes off; the bare `mt-1 size-4 shrink-0` icon takes the featured / unfeatured split (`text-blue-700 dark:text-blue-400` vs `text-muted-foreground`). `aria-hidden` moves onto the icon.
- **Price** — `type-heading-24` → `type-heading-32`. **CTA** — `size="sm"` → `size="lg"`.
- **Sizing** — `sm:max-w-3xl` → `w-full … md:max-w-[720px]`, and the card grid `sm:grid-cols-2` → `md:grid-cols-2`. These move together: the cards must split at the same breakpoint the dialog reaches its cap, or they go side-by-side while it is still narrow.

`PRO_PLAN` already carried `featured: true`, so the blue lands on the Pro card with no data change. Pro-state copy and CTAs are untouched (Free = enabled outline "Downgrade plan", Pro = disabled outline "Your current plan"), and the Free dialog's blue filled button + `SparklesIcon` are deliberately **not** ported — those belong to the "Upgrade to Pro" action. The blue on this dialog is card chrome, not button.

**Open, not fixed.** The Pro card's CTA is a disabled outline button on the blue gradient, so the featured card has no accent-coloured element below the icon list. If that reads hollow, the fix is a `Button` variant, not a call-site override.

## Sections

*No section-level changes today.*
