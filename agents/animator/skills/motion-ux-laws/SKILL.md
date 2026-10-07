---
name: motion-ux-laws
description: "The laws of UX applied to motion in a product UI: whether something should move at all, what the eye follows, how motion groups and separates, how fast feedback must land, and how reduced motion changes the answer. Read before deciding that anything on the site animates."
---

# Motion UX laws (product UI)

The 31 laws themselves live in the front-end kit:
`agents/front-end-developer/skills/ux-laws/SKILL.md` (read it first; the UI
gate requires it). This skill answers one question: **what do the laws mean
when the interface moves?** gate-ai-build is an Operate surface. People come
to scan, filter and act, many times a day, so motion has to earn its place
by helping them do that.

## First: should it move?

Motion is the strongest attention signal on a screen, stronger than size or
color. Spend it only on:

1. **Feedback**: a press, a toggle, a save landing (Doherty).
2. **Continuity**: where something came from or went (a dialog from its
   trigger, a row expanding into place), so the user keeps their place.
3. **State change the user must notice**: an error appearing, a status
   flipping.

Anything else (decorative loops, entrances on every page load, scroll
shows) is a cost. Frequent actions get the least motion: a thing used 50
times a day should feel instant.

## Attention

| Law | In motion |
| --- | --------- |
| **Selective attention** | Two things moving at once split the eye. One moving thing per moment; the rest holds still |
| **Von Restorff** | The one element that moves differently is the one noticed. Use it for the thing that changed, never for decoration |
| **Figure-ground** | Overlays (dialog, sheet, popover) move; the page behind them only dims. Never animate the page and the overlay together |
| **Change blindness** | A change made during another motion goes unseen. Don't update a value while its container is still animating in |

## Grouping

| Law | In motion |
| --- | --------- |
| **Common fate** | Things that move together read as one group. A list that staggers in reads as items; keep the whole group inside about 0.3 s or it reads as separate events |
| **Similarity** | Same role, same motion: every dialog opens the same way, every toast enters the same way. A new motion style signals a new kind of thing |
| **Common region** | A card or panel that moves as a unit carries its contents; animate the container, not each child |

## Time and feedback

| Rule | Value |
| ---- | ----- |
| **Doherty** | Feedback starts within 100 ms of the input and the result lands within 400 ms. A press responds on press, not on release |
| **Durations** | From `design.md` only: 100 / 120 / 150 / 200 / 300 ms (`../../knowledge/working-rules.md` § Current values). Above 300 ms in product UI needs a reason |
| **Closes faster than opens** | Exit is shorter than entrance; never delay a close or a hover-out |
| **Fitts** | Motion never moves a target the user is about to click |
| **Peak-end** | The end of a flow (saved, sent, upgraded) is what users remember: one clear, quiet confirmation, not a celebration |

## Reduced motion

`prefers-reduced-motion: reduce` always wins. The element arrives in its
final state with no movement; an opacity cross-fade under 150 ms is the most
it may do. Continuous motion (pulses, loops, shimmer) stops entirely. Test
both settings.

## Pre-flight for any motion

1. Which of the three jobs above does this motion do? If none, cut it.
2. Is it the only thing moving at that moment?
3. Is every duration and curve a `design.md` value?
4. Does feedback start within 100 ms, and does the close run shorter than
   the open?
5. What does it do under reduced motion?
