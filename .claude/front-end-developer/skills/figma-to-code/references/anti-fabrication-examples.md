# Anti-fabrication examples

Five real failure cases from past `figma-to-code` sessions. Each one shipped a build that looked plausible to the agent and broken to the user. Read these before extracting — recognize the pattern before you commit it.

The common thread: **fabrication is what happens when "looks fine" replaces "matches Figma."** The agent has good design intuition and pattern-matches naturally; that exact instinct is what produces fabricated content. Discipline is reading Figma when you'd rather ship.

---

## Case 1 — Made-up transaction subtitles

**What shipped:**

```ts
const defaultTransactions = [
  { kind: 'buy', title: 'Buy', subtitle: 'Today, 9:24 AM', amount: 500 },
  { kind: 'received', title: 'Received', subtitle: 'Today, 8:02 AM', amount: 8000 },
  { kind: 'sent', title: 'Sent', subtitle: 'Yesterday, 6:41 PM', amount: -320 },
  { kind: 'withdraw', title: 'Withdraw', subtitle: 'Yesterday, 2:15 PM', amount: -50 },
];
```

**What Figma had** (visible in the populated-state node, as plain text-node values):

```
Buy / MoonPay / +$100.00 / 10m ago
Received / 0x123acb… / +$1,000.00 / 15m ago
Sent / 0x123acb… / -$100.00 (strikethrough) / Failed
Sent / 0x123acb… / -$100.00 / 1h ago
Withdraw / Coinbase Inc. / -$100.00 / 1h ago
```

**Root cause chain:**

1. The first extraction targeted the empty-state Figma node, not the populated-state node.
2. The agent's report flagged this: "Recent Activity is empty-state only at this node — populated rows live elsewhere."
3. The orchestrator (Claude) saw the flag, did not ask the user for the populated-state node, and instead **invented sample transaction data** for the build agent's brief.
4. The build agent followed the brief faithfully and shipped fabricated content.
5. User caught it on visual review — the entire row structure (one-line right side, generic timestamps, no failed state, no relative-time format) was wrong.

**The fix that should have happened:**

When the extraction agent flags "this node has only the empty state," **stop and ask the user for the populated-state node ID.** Do not improvise data. The cost of asking is one message; the cost of inventing is a full rebuild cycle.

**The discipline rule:**

> Mock data in Figma IS the canonical content. Treat `MoonPay`, `0x123acb…`, `Coinbase Inc.` as the strings the user wants in the build. They put them there on purpose. If the user wants different content for production, they'll say so.

---

## Case 2 — Pattern-matched icons by name

**What shipped:**

For each icon in the wallet screen, the extraction agent produced an `iconRecipes` map mapping the Figma instance name to a Heroicons npm import:

```json
{
  "header.cog": "@heroicons/react/24/outline/Cog6ToothIcon",
  "header.scan": "@heroicons/react/24/solid/QrCodeIcon",
  "actionButtons.buy": "@heroicons/react/24/outline/CurrencyDollarIcon",
  "actionButtons.send": "@heroicons/react/24/outline/PaperAirplaneIcon",
  ...
}
```

The build agent inlined the **canonical Heroicons v2 SVG paths** for each name. Type-checked clean. Looked fine in the preview.

**What was actually wrong:**

The Figma instances had **drifted from canonical Heroicons** in several places:

- `Header.tsx` "QR" icon — Figma had a modern QR-code grid (3 corner squares + dots). Heroicons v2 had a grid pattern with different spacing. The Heroicons substitution shipped a visually similar but subtly different glyph.
- `ActionButtons.tsx` "Buy" — Figma rendered an older Heroicons currency-dollar shape. The build agent imported the latest published path, which has a different curve geometry.
- `TabBar.tsx` "Wallet" active — Figma had a folded-billfold style wallet. Build agent used the archive-box-style wallet. Completely different glyph.

**Root cause:**

The agent treated the icon NAME as the source of truth. Names are metadata, not pixels. When the designer's icon set drifts from the published library — which happens every Heroicons / Lucide / Phosphor minor version — name-matching ships a different icon than the user sees in Figma.

**The fix:**

Extract SVG path data from each icon node directly via `get_design_context({ nodeId: <icon-node-id> })`. Inline the verbatim path. Treat the Figma rendering as canonical, even when the name claims it's a known library glyph.

**The discipline rule:**

> Names lie. Paths don't. Read the path from the icon's specific Figma node, not from your mental map of `heroicons-outline/<name>`.

**The "looks identical right now" trap:**

A subtle variant of this case: an audit agent compares the build's canonical-Heroicons path to Figma's rendered SVG, sees they're identical *at the current point in time*, and decides to leave the build alone "because the Figma viewBox dimensions are weirder and replacing would be churn." This is wrong. The rule isn't "match the visible pixels today" — it's "the build's icon source IS Figma." If Figma drifts tomorrow (designer rounds a corner, adjusts a stroke, swaps a glyph), the canonical-path build silently ships the old version. There is no "visually identical, skip the swap" exception. Always extract. Always inline what Figma renders. The 30 seconds of "churn" buys permanent correctness against future drift.

---

## Case 3 — Generalized a variant across siblings

**What shipped:**

```ts
const apps = [
  { id: 'nadanada', name: 'Nadanada', haloColor: '#fedc57' },     // yellow halo
  { id: 'bitrefill', name: 'Bitrefill' },                          // no halo (correct)
  { id: 'travala', name: 'Travala', haloColor: '#fedc57' },        // yellow halo
  { id: 'starchild', name: 'Starchild', haloColor: '#fedc57' },    // yellow halo (FABRICATED)
];
```

**What Figma had:**

Inspecting each AppCard instance individually showed:

- Nadanada: `bg-[#fedc57]` on the avatar wrapper — yellow halo present
- Bitrefill: no halo (the brand "B" logo is the avatar)
- Travala: `bg-[#fedc57]` on the avatar wrapper — yellow halo present
- Starchild: **no visible halo** — the orange/black brand circle IS the avatar; whatever wrapper fill exists, the brand image covers it completely

**Root cause:**

The build agent saw "three of four cards have a halo" and added it to the fourth on the assumption that omission was an oversight. Figma intent: the halo is a visual treatment for cards whose brand mark doesn't fully cover the avatar circle. Brand-saturated avatars (Bitrefill, Starchild) skip the halo because it's visually pointless.

**The fix:**

Per-instance read. For each instance node, check whether the variant property is present in the actual node data, not in the pattern across siblings. If three of four have it and the fourth doesn't, the fourth doesn't have it.

**The discipline rule:**

> Consistency is not transitivity. Read every instance. Don't generalize from "most" to "all."

---

## Case 4 — Guessed component prop shapes in a render script

**What shipped:**

When applying a small icon change, the agent rewrote the SSR preview script and called the `ActionButton` component like this:

```tsx
<ActionButton kind="buy" />
<ActionButton kind="receive" />
<ActionButton kind="send" />
```

**What `ActionButton.tsx` actually exports:**

```ts
export type ActionButtonProps = {
  icon: ReactNode;     // required — caller provides the icon
  label: string;       // required — caller provides the label
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
};
```

The component received `kind` (an unknown prop, ignored), `icon` and `label` were both `undefined`, and rendered as **empty black pill chrome with no content**. Three blank black blobs in the preview gallery.

**Why it didn't fail at type-check:**

The agent type-checked `wallet/*.tsx` + `tokens.ts` + `types.ts` — but **not** the render script itself. The render script lived in `/tmp` and was excluded from the `tsc` invocation. The mismatch was invisible until visual review.

**The fix:**

1. Read the target component's `.tsx` before writing any invocation. Two seconds of `Read` cost prevents this entire class of error.
2. Type-check the render script in the same `tsc` run as the components. If your preview pipeline has a render script, it is part of the source — type-check it.

**The discipline rule:**

> Read the component before calling it. Don't invoke from memory. And type-check every file you write, not just the ones the agent considers "real source."

---

## Case 5 — Re-wrote a working render script from memory

**What shipped:**

The first build agent produced a working SSR render script (call it `render.tsx`) inside a `/tmp` build dir, used it once to write `preview.html`, and then `rm -rf`'d the temp dir. When the orchestrator later needed to apply a small icon swap, it **re-wrote the entire render script from memory** in a new `/tmp` build, introducing the bug from Case 4.

**Root cause:**

Render scripts were treated as ephemeral scaffolding. Each iteration regenerated them from memory rather than persisting and re-using.

**The fix:**

Persist the render script in the workspace at `<workspace>/scripts/preview.ts` (not `/tmp`). Make it part of the codebase. Type-check it alongside the components. Run it via `tsx scripts/preview.ts` or an `npm run preview` script. Then small changes to components require zero changes to the render pipeline.

**The discipline rule:**

> If a script is going to be re-run, it lives in the repo. `/tmp` is for one-shot operations.

---

## Pattern recognition: when am I about to fabricate?

You're at risk of fabricating when any of these is true:

- The Figma response was truncated and you didn't read the persisted output file
- You're about to write a string that "sounds like" placeholder text (timestamps, "Today, 9:24 AM", "Lorem ipsum", "user@example.com") instead of the actual mock data Figma shows
- You're about to import a Heroicons / Lucide path because the Figma instance name matches a known library
- You're about to add a property to all instances because most have it
- You're about to write a component invocation without reading the component's file first
- You're about to regenerate a render/build script from memory instead of editing the persisted one
- The user gave you a screenshot but you haven't asked for the corresponding Figma node URL

In each case: stop, read the source, ask the user, or both. Fabrication is one tool call away from prevention.

## How to audit your own output before reporting done

Before saying "done" on a `figma-to-code` extraction, run this checklist:

1. **Text audit.** Open the spec / Figma screenshot. For every text string in your output, find its source in Figma. If a string in your output isn't in Figma, it's fabricated.
2. **Icon audit.** For every `<svg><path d="...">` in your output, the path must come from a `get_design_context` call on a specific icon node in Figma. If it came from training data or a Heroicons import, it's fabricated.
3. **Variant audit.** For every variant flag (halo, badge, special state), find the instance node in Figma that justifies it. Don't trust "matches the pattern."
4. **Prop audit.** For every component invocation in render scripts, tests, or preview harnesses, the props must match the component's declared types. Open each component and verify.
5. **Script audit.** If you wrote a render script, did you type-check it? Is it persisted in the workspace?

If any of the five fail, fix it before reporting done. The user will catch it anyway, and asking for a third rebuild is more expensive than a five-minute audit.
