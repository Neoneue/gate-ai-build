---
name: ux-laws
description: Use before building or changing any UI (placement, grouping, emphasis, adding or cutting an element, a flow, a dialog or a layout). UX before UI. Holds the 31 laws of UX as check questions, the patterns the user has corrected, and the gate to pass before writing UI.
---

# UX laws

Know these before placing anything, the way a senior designer does. Each
line is the law, then the question it asks of your change: 31 laws below.
Depth is in `references/`: `overview.md` has 30 of them with sources, from
lawsofux.com; Figure-Ground has its own file (`law-of-figure-ground.md`).

## 1. UX before UI

Before any pixel, write three lines: the job (what the user came to do), the
path (entry, steps, exit, errors), and the expectation (which app they think
this works like). The UI follows from those three lines. Bad UI means bad UX,
so a fix starts at the flow, not the styling.

## 2. The laws

**Grouping: how the eye finds structure**
- **Proximity:** near things read as one group. Check: is the space inside a group smaller than the space between groups? `references/law-of-proximity.md`
- **Similarity:** things that look alike read as the same kind. Check: does every element with one role look the same, and only those? `references/law-of-similarity.md`
- **Common Region:** a shared surface or border groups its contents. Check: does each container hold exactly one group, with no cards inside cards? `references/law-of-common-region.md`
- **Uniform Connectedness:** a connecting line or fill groups more strongly than proximity. Check: are related controls visibly tied together? `references/overview.md`
- **Prägnanz:** people read the simplest shape. Check: can the eye tell what is "one thing" at a glance? `references/overview.md`
- **Figure-Ground:** one layer is the foreground and acts; the rest recedes. Check: is it obvious what's on top and clickable? `references/law-of-figure-ground.md`

**Memory: what people can hold**
- **Cognitive Load:** every element spends attention. Check: does anything decorate without communicating? `references/overview.md`
- **Miller:** about 4 chunks fit in working memory. Check: are long lists, paths and IDs chunked? `references/millers-law.md`
- **Chunking:** group raw strings and long forms into labeled parts. Check: is anything shown as one undivided run? `references/overview.md`
- **Working Memory:** don't make people carry state across screens. Check: does a modal hide what the user needs to remember? `references/overview.md`
- **Serial Position:** first and last are remembered. Check: are the key action and fact at the ends, not the middle? `references/serial-position-effect.md`

**Attention: what stands out**
- **Von Restorff:** the one thing that differs is the one noticed. Check: is exactly one thing emphasized in this view? `references/von-restorff-effect.md`
- **Selective Attention:** people ignore what looks like ads or noise. Check: does any status look like a promo, or move for no reason? `references/overview.md`
- **Aesthetic-Usability:** polish reads as usable. Check: are alignment, rhythm and finish consistent? `references/aesthetic-usability.md`
- **Cognitive Bias:** don't exploit bias (fake urgency, pre-checked extras). Check: would this pass as honest? `references/overview.md`

**Choice: add or cut**
- **Hick:** more choices, slower decisions. Check: are 4 or fewer choices visible at each decision point? `references/hicks-law.md`
- **Choice Overload:** equal weight on everything stalls people. Check: is there a clear default or recommended option? `references/overview.md`
- **Pareto:** 20% of features carry 80% of use. Check: does the common task get the most weight? `references/overview.md`
- **Tesler:** complexity is conserved, so the system should absorb it. Check: could the system infer this instead of asking? `references/teslers-law.md`
- **Occam:** the simplest design that works wins. Check: can each element say in one sentence what it communicates? If not, cut it. `references/overview.md`

**Goals: keeping people moving**
- **Goal-Gradient:** effort rises near the finish. Check: is progress visible, with a head start? `references/overview.md`
- **Zeigarnik:** unfinished tasks stay on the mind. Check: can people see what's left and that closure is reachable? `references/zeigarnik-effect.md`
- **Flow:** interruptions break momentum. Check: does anything block or confirm mid-task without need? `references/overview.md`
- **Parkinson:** tasks expand to fill the effort asked. Check: are fields that could be inferred prefilled? `references/overview.md`

**Expectations: what people already know**
- **Jakob:** users expect it to work like apps they already use. Check: would a Vercel, Stripe or OpenAI / Anthropic console user recognize this pattern? If not, why invent it? `references/jakobs-law.md`
- **Mental Model:** labels and behavior match what people predict. Check: does every label do what its word promises? `references/overview.md`
- **Active User:** nobody reads first; they start clicking. Check: does it work without the explainer? `references/overview.md`

**Time and feedback**
- **Fitts:** bigger and closer targets are faster. Check: are targets at least 24px (44px on touch), the whole row clickable, and destructive actions far from primary ones? `references/fitts-law.md`
- **Doherty:** respond in under 400ms. Check: does every action show pending, optimistic or done state at once? `references/doherty-threshold.md`
- **Peak-End:** people remember the peak and the end. Check: is the last step clear and rewarding? `references/peak-end-rule.md`

**Robustness**
- **Postel:** accept messy input, emit clean output. Check: are `~`, trailing slashes, spaces and quotes tolerated? `references/overview.md`

## 3. Patterns the user already corrected

Ported from another project on 2026-10-05. Items marked *(from another
project, confirm with your human)* are not yet confirmed for gate-ai-build.

- Hierarchy: the title is foreground and largest; section titles and names are foreground; supporting text is `type-copy-14` (or `type-copy-12` in dense chrome) in `muted-foreground`; a child section never shares its parent's role. If everything is foreground, nothing is important.
- A collapsible section is a full-width section-header row (section title, chevron at the right edge, whole row clickable, hover fill), never a small ghost button. *(from another project, confirm with your human)*
- A list item that opens something is a full-width selectable row with a hover fill and focus ring, never an underlined link. *(from another project, confirm with your human)*
- One primary action per view; the rest are outline or ghost.
- Destructive actions are quiet at rest and confirm or undo on use, never the loudest thing on screen.
- Each section's edit action sits in the same place everywhere.
- gate-ai-build is an Operate surface, so it is dense: tight section rhythm, no marketing spacing.

## 4. The gate before building

Write it in the plan or report:
1. The three UX lines from section 1.
2. Every law this change touches, with one clause on how it passes.
3. Which corrected patterns apply, and that they hold.

If any answer is "no" or "I don't know", stop and fix the design before
writing code.
