---
name: gsap
description: "GSAP in gate-ai-build: React components with @gsap/react, npm imports, plugin registration, reduced motion through gsap.matchMedia, cleanup, and which plugin fits which UI job. Read for any GSAP tween, timeline, stagger, split-text, scramble, morph or draw decision on the site."
---

# GSAP in gate-ai-build

The site ships `gsap` (^3.15) and `@gsap/react` (^2.1) from npm. Every bonus
plugin has been free under the standard license since 3.13. GSAP is for
choreography that CSS and Motion cannot do cleanly: sequenced entrances,
split text, scramble, morphs, drawn strokes. A hover, a press or a single
enter / exit stays in CSS or the primitive's own transition (see
`../../knowledge/working-rules.md` § Which tool).

## The pattern (copy it from the site, not from memory)

Precedent: `src/layouts/AuthLayout.tsx` (lines 1-9 and 133-175).

```tsx
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

// Register once, at module scope, including the hook itself.
gsap.registerPlugin(useGSAP, SplitText);

function Panel() {
  const root = useRef<HTMLDivElement | null>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-anim]", { autoAlpha: 0, y: 8, duration: 0.2, ease: "power3.out", stagger: 0.04 });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-anim]", { autoAlpha: 1, y: 0 }); // final state, no motion
      });
    },
    { scope: root } // selectors resolve inside the component only
  );
  return <div ref={root}>…</div>;
}
```

- **`useGSAP`, never `useEffect`**: it reverts every tween and ScrollTrigger
  it created on unmount and under React Strict Mode.
- **`scope`** on every hook, so `"[data-anim]"` cannot reach another
  component's nodes.
- **`gsap.matchMedia()` for reduced motion**, not a one-off
  `window.matchMedia(...).matches` check (that misses a setting change
  mid-session; `plan-comparison-dialog.tsx:217` still does it the old way).
  Under `reduce`, render the final state with `gsap.set`, never a shorter
  animation.
- **Event-driven tweens** (on click, on open) go through `contextSafe` from
  `useGSAP`'s return value so they clean up too.
- **`autoAlpha`** over `opacity` when an element starts hidden, so it is also
  `visibility: hidden` and out of the tab order until it appears.
- **Import from `gsap/<Plugin>`** (npm), never a CDN script tag.

## Plugins: what each is for here

| Plugin | UI job | Notes |
| ------ | ------ | ----- |
| `SplitText` | Staggered words or characters in a hero or empty state | Split after fonts load (`document.fonts.ready`); `SplitText` reverts inside `useGSAP` cleanup. Keep `aria-label` on the parent so screen readers hear the whole string |
| `ScrambleTextPlugin` | A short status or code-like reveal (used on the auth screen) | Decorative only; the final text must be in the DOM for assistive tech |
| `CustomEase` | Matching the site's easing tokens exactly: `CustomEase.create("ease-out", "0.23,1,0.32,1")` | Read the curve from `src/index.css` (`--ease-out`, `--ease-in-out`, `--ease-drawer`), never invent one |
| `Flip` | A layout change that should glide (reorder, expand into place) | Measure, change state, `Flip.from`; respects `matchMedia` the same way |
| `DrawSVGPlugin` | A stroke that draws on (a check, a progress ring) | Pure function of progress |
| `MorphSVGPlugin` | An icon or shape swap | `shapeIndex` fixes twisting |
| `MotionPathPlugin` | An element that follows a path | Rare in a dashboard; justify it |
| `ScrollTrigger` | Scroll-linked sequences | Almost never on an Operate surface: dashboards are scanned, not scrolled for show. Needs a reason the owner agrees to |

Avoid in product UI: `gsap.utils.random` and `CustomWiggle` for anything a
user must read, infinite loops that never settle (except an explicit
status pulse, and only under `no-preference`), and two systems animating the
same property (GSAP and a CSS transition on one `transform`).

## Ease and duration

Durations and curves come from `design.md` (Motion) through
`../../knowledge/working-rules.md` § Current values: 100 ms overlay fade,
150 ms default control transition, 200 ms enter, 120 ms close, 300 ms sheet.
GSAP durations are in seconds (`0.2`, not `200`). Entrances ease out
(`power3.out` or the `--ease-out` curve); exits are shorter than entrances and
also ease out; symmetric moves use `--ease-in-out`. A stagger group should
finish arriving within about 0.3 s in product UI.
