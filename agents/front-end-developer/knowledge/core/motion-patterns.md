# Motion Patterns — CSS Animation & Micro-Interaction Reference

> **When to load:** Before adding hover effects, entrance animations, scroll-triggered reveals, icon animations, or any motion work. Pairs with `craft-methodology.md` (intent) and `web-interface-guidelines.md` (a11y).

> **Sources:** Emil Kowalski (animations.dev, Linear/Vercel), Adam Wathan (Tailwind CSS/Stripe arrow), Mark Horn (SVG arrow buttons), frontendtools.tech, thelinuxcode.com. Patterns validated against production sites, 2024–2026.

---

## Core Principles

1. **Animate only `transform` and `opacity`.** These trigger composite only (no layout, no paint). Everything else (`margin`, `padding`, `width`, `height`, `border`, `box-shadow` changes) risks dropped frames. `box-shadow` transitions are acceptable for hover lifts but avoid on scroll-triggered or high-frequency animations.

2. **Stay under 300ms for UI animations.** 120–220ms for hover/tap feedback. 200–300ms for enter/exit. Anything longer feels like the UI is "thinking."

3. **Gate hover behind `@media (hover: hover)`.** Touch devices trigger false hover states on tap. Always gate transform/shadow hover effects. Color-only hover changes are safe ungated.

4. **Respect `prefers-reduced-motion`.** Remove transform-based motion; keep opacity fades for comprehension. Never disable all feedback — the user still needs to know things happened.

5. **Purpose over decoration.** Every animation must answer: what does this communicate? If it communicates nothing, remove it. Animations seen hundreds of times daily (keyboard shortcuts, repeated actions) should have zero or near-zero animation.

6. **Interruptibility matters.** CSS `transition` is interruptible (user can re-trigger mid-animation and it smoothly redirects). CSS `@keyframes` are not. Use transitions for dynamic UI (toasts, toggles, hovers). Use keyframes for predetermined, fire-once animations (page entrance, loading spinners).

---

## Custom Easing Curves

Built-in CSS easings (`ease`, `ease-in-out`) are too gentle for professional UI. Use these custom cubic-bezier curves from Emil Kowalski:

```css
:root {
  /* Strong ease-out: enter/exit, dropdowns, popovers — starts fast, feels responsive */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);

  /* Strong ease-in-out: on-screen movement, repositioning, tabs */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

  /* Drawer/sheet curve: iOS-like pull feel (from Ionic Framework) */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  /* Spring-approximation for CSS: overshoot-settle (no true spring in CSS) */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### When to use which

| Curve | Use case | Why |
|-------|----------|-----|
| `--ease-out` | Enter/exit, dropdowns, tooltips, popovers | Starts fast → feels responsive |
| `--ease-in-out` | On-screen movement (tabs, repositioning) | Natural acceleration + deceleration |
| `--ease-drawer` | Drawers, bottom sheets, swipe-to-dismiss | Mimics iOS physics |
| `--ease-spring` | Buttons, icons, micro-interactions | Slight overshoot → feels alive |
| `ease` (built-in) | Simple background-color hover only | Good enough for color-only changes |

**Never use `ease-in` for UI.** It starts slow and ends fast — the opposite of what the user expects.

---

## Icon Animation Techniques

### Technique 1: Sliding Track (Out-In Effect)

Two identical icons in a flex row inside an `overflow-hidden` container. On hover, translate the track to reveal the second icon while the first exits.

**Critical math:** CSS `translate` percentages are relative to the **element itself**, not its parent. Two flush 16px icons = 32px track. `-translate-x-1/2` = 50% of 32px = 16px = exactly one icon width.

```
Structure:
┌──────────┐  overflow-hidden container (size-4 = 16px)
│ [→1] [→2]│  two icons, NO gap, track = 32px
└──────────┘

On hover (-translate-x-1/2 = -16px):
     ┌──────────┐
[→1] │ [→2]     │  first exits left, second enters from right
     └──────────┘
```

#### Direction: Arrow exits RIGHT, new enters from LEFT

Default state shows second icon (track starts shifted). On hover, track returns to origin.

```html
<!-- Tailwind + Lucide React -->
<button class="group">
  Text
  <span class="inline-flex size-4 overflow-hidden">
    <span class="flex -translate-x-1/2 transition-transform duration-300
                 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                 group-hover:translate-x-0">
      <ArrowRight class="size-4 shrink-0" />
      <ArrowRight class="size-4 shrink-0" />
    </span>
  </span>
</button>
```

#### Direction: Arrow exits LEFT, new enters from RIGHT

Default state shows first icon (track at origin). On hover, track shifts left.

```html
<span class="inline-flex size-4 overflow-hidden">
  <span class="flex transition-transform duration-300
               [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
               group-hover:-translate-x-1/2">
    <ArrowRight class="size-4 shrink-0" />
    <ArrowRight class="size-4 shrink-0" />
  </span>
</span>
```

#### Diagonal arrows (ArrowUpRight)

For diagonal movement on hover, a subtle nudge is smoother than the full track technique:

```html
<ArrowUpRight class="size-4 transition-transform duration-300
  [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
  group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
```

#### Common mistakes

- **Adding `gap` between icons:** Creates a track wider than 2× icon size, breaking the `-translate-x-1/2` math.
- **Using `calc(100% + Xrem)`:** `100%` in `transform` is the element's own width, not the parent. Unpredictable when flex sizing is involved.
- **Forgetting `shrink-0`:** Flex items will compress, breaking the fixed-width assumption.
- **Missing `overflow-hidden`:** Both icons will be visible simultaneously.

### Technique 2: SVG Part Animation (Stripe-Style Extend)

Decompose the arrow SVG into separate `<line>` (shaft) and `<polyline>` (chevron) elements. Animate each independently on group hover.

```html
<button class="group inline-flex items-center gap-1">
  Text
  <svg viewBox="0 0 24 24"
       class="size-5 stroke-[2px] fill-none stroke-current
              opacity-60 group-hover:opacity-100
              transition-opacity duration-300 ease-in-out">
    <!-- Shaft: hidden by default, scales in on hover -->
    <line x1="5" y1="12" x2="19" y2="12"
          class="scale-x-0 translate-x-[10px]
                 group-hover:translate-x-0 group-hover:scale-x-100
                 transition-transform duration-300 ease-in-out" />
    <!-- Chevron: shifted left, slides to position on hover -->
    <polyline points="12 5 19 12 12 19"
              class="-translate-x-2 group-hover:translate-x-0
                     transition-transform duration-300 ease-in-out" />
  </svg>
</button>
```

**When to use which:**
- **Sliding track:** Best for "replace" feel — one icon fully exits, another enters. Works with any icon component (Lucide, etc.).
- **SVG part animation:** Best for "extend" feel — arrow grows/morphs. Requires raw SVG with separated paths.

---

## Button Micro-Interactions

### Press feedback (scale)

```css
.button {
  transition: transform 160ms var(--ease-out);
}
.button:active {
  transform: scale(0.97);
}
```

In Tailwind: `active:scale-[0.97] transition-transform duration-150`

### Hover lift

```css
@media (hover: hover) {
  .button:hover {
    transform: translateY(-1px);
  }
}
```

In Tailwind: `[@media(hover:hover)]:hover:-translate-y-px transition-transform duration-150`

### Combined pattern (production)

```html
<button class="transition-transform duration-150
  [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]
  [@media(hover:hover)]:hover:-translate-y-px
  active:scale-[0.97]">
```

### State transition blur

When a button switches between two visual states (e.g., "Copy" → "Copied"), adding 2px of blur during the crossfade masks the harsh swap:

```css
.button-content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
  transition: filter 200ms ease, opacity 200ms ease;
}
```

---

## Card Hover Patterns

### Lift + shadow

```css
.card {
  transition: transform 180ms var(--ease-out),
              box-shadow 180ms var(--ease-out);
}

@media (hover: hover) {
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }
  .card:active {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
}
```

### Subtle border glow (dark mode)

```css
.card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: border-color 250ms ease, background-color 250ms ease;
}

@media (hover: hover) {
  .card:hover {
    border-color: rgba(255, 255, 255, 0.12);
    background-color: rgba(255, 255, 255, 0.02);
  }
}
```

In Tailwind: `border border-white/[0.06] transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]`

---

## Entrance Animations

### Staggered page load (CSS keyframes)

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Stagger delays: 50–80ms between items */
.stagger-1 { animation-delay: 0ms; }
.stagger-2 { animation-delay: 80ms; }
.stagger-3 { animation-delay: 160ms; }
.stagger-4 { animation-delay: 240ms; }
.stagger-5 { animation-delay: 320ms; }
```

Never animate from `scale(0)` — it looks like objects appear from nothing. Start from `scale(0.95)` or use `translateY(8-16px)` instead.

### Scroll-triggered entrance (IntersectionObserver)

Use a `<Reveal>` wrapper component that observes viewport intersection and applies a CSS transition on mount:

```tsx
"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"

export function Reveal({
  children, className = "", delay = 0,
}: {
  children: ReactNode; className?: string; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
      },
      { threshold: 0.15, rootMargin: "-40px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref} className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms,
                     transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >{children}</div>
  )
}
```

---

## Origin-Aware Popovers

Popovers should scale in from their trigger, not from center. Radix and shadcn/ui expose CSS variables for this:

```css
.popover {
  transform-origin: var(--radix-popover-content-transform-origin);
  animation: scale-in 200ms var(--ease-out);
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```

Exception: Modals use `transform-origin: center` because they aren't anchored to a specific trigger.

---

## Tooltip Sequential Delay

First tooltip: delay before appearing (prevents accidental activation). Subsequent tooltips while one is already open: instant, no animation.

```css
.tooltip {
  transition: transform 125ms ease-out, opacity 125ms ease-out;
}
.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0; transform: scale(0.97);
}
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

---

## Clip-Path Animations

Powerful for reveals, tab transitions, and progress indicators:

```css
/* Left-to-right reveal */
.reveal {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 300ms var(--ease-in-out);
}
.reveal.visible {
  clip-path: inset(0 0 0 0);
}

/* Hold-to-confirm button fill */
.button .fill-overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms ease-out;
}
.button:active .fill-overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;
}
```

---

## Decorative Ambient Motion

For "alive" feeling without interaction (terminal cursors, status indicators):

```css
@keyframes terminal-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.cursor { animation: terminal-blink 1.1s steps(1) infinite; }
.live-dot { animation: pulse-subtle 3s ease-in-out infinite; }
```

These must be disabled under `prefers-reduced-motion: reduce`.

---

## Performance Checklist

- [ ] Animate only `transform` and `opacity`
- [ ] No `margin`, `padding`, `width`, `height` transitions in animations
- [ ] `will-change: transform` only when needed (remove after animation completes)
- [ ] Use CSS transitions/keyframes over JS `requestAnimationFrame` when possible
- [ ] For Framer Motion: use full `transform` strings, not shorthand `x`/`y` (not hardware-accelerated)
- [ ] Test with CPU 6× throttle in DevTools

## Accessibility Checklist

- [ ] All motion wrapped in `@media (prefers-reduced-motion: reduce)` fallback
- [ ] Reduced-motion users still see opacity transitions (not blank)
- [ ] Hover effects gated behind `@media (hover: hover)`
- [ ] No animation on keyboard-initiated frequent actions
- [ ] `aria-hidden="true"` on purely decorative animated elements

---

## CSS Transform Gotcha Reference

| Property | `%` relative to | Example |
|----------|-----------------|---------|
| `translateX(%)` | Element's own width | 50% of a 32px element = 16px |
| `translateY(%)` | Element's own height | 100% of a 40px element = 40px |
| `width: %` | Parent's width | 50% of 200px parent = 100px |
| `left: %` | Parent's width | 50% of 200px parent = 100px |
| `transform-origin: %` | Element's own dimensions | `50% 50%` = center of element |

This difference between transform-% and position-% is the #1 source of animation math bugs.

---

## Retrieval Queries

- Arrow icon slide animation hover overflow hidden technique
- Custom easing cubic-bezier curves for UI animations
- Button hover lift press scale micro-interaction
- Card hover shadow elevation animation pattern
- Staggered entrance fade-up animation CSS keyframes
- Scroll-triggered reveal IntersectionObserver animation
- CSS transform translate percentage relative to what
- Sliding track icon animation two icons overflow clip
- SVG part animation line polyline separate paths
- Emil Kowalski animation principles easing spring
- Origin-aware popover transform-origin animation
- Clip-path reveal animation technique
- Reduced motion accessibility prefers-reduced-motion
- Interruptible CSS transition vs keyframe animation
- Performance animate only transform opacity composite
