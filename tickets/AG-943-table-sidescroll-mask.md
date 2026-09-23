# Horizontally scrolling tables: edge fade affordance

Wide tables scroll sideways with no visual sign that they do. Add the edge
fade the design mockup uses, so a table that has more columns off screen says
so.

---

## Existing issue

Several tables are wider than their container and scroll horizontally. Nothing
in the UI indicates that.

- The last visible column ends flush at the container edge, so it reads as the
  final column rather than a cut-off one.
- Users on a trackpad discover the extra columns by accident. Users on a mouse
  often do not discover them at all, because the horizontal scrollbar is
  hidden until a scroll gesture starts.
- The tables most affected are the widest ones, where the hidden columns carry
  the values people came for.

---

## What needs to change

### The affordance

- Paint a soft fade at each horizontal edge of the scroll area: 48px wide, full
  height of the scrollport, going from the surface color behind the table out
  to transparent.
- Show the leading fade only when content is hidden to the left, and the
  trailing fade only when content is hidden to the right. At rest on a freshly
  rendered wide table, that means a trailing fade only.
- When the table fits its container, render neither. A non-overflowing table
  should produce exactly the DOM it produces today.
- Cross-fade the two overlays on a short opacity transition rather than
  snapping them in and out, and disable that transition under reduced motion.

### Correctness requirements

- The fades must not intercept pointer events. They sit on top of the last
  visible column, so without that they swallow row clicks and scrollbar drags.
- They are decoration, so they carry no content and are hidden from assistive
  technology.
- Use the surface color token, not a literal color value, so the fade blends in
  both light and dark themes.

### Structure

- The fades cannot live inside the scrolling element. Absolutely positioned
  children of a scroll container are part of its scrollable content and scroll
  away with it, so the fade would slide off instead of hugging the edge. They
  need a non-scrolling wrapper around the scrollport.

---

## How this will help

- A wide table announces that it is wide, at the moment the user first looks at
  it, rather than after an exploratory gesture.
- Hidden columns stop being a discovery problem on the tables where they cost
  the most.
- The affordance is self-correcting: it tracks the real scroll position, so it
  disappears at each end and never claims content that is not there.
- It costs no layout. The overlays are absolutely positioned and render only
  while the table actually overflows.

---

## Prompt for your coding agent

Paste the block below into your agent, along with the screenshots of the
mockup's behavior.

```text
Add a horizontal scroll affordance to the shared table component: a soft fade
at each edge of the scroll area, visible only when there is content hidden on
that side. Screenshots of the target behavior are attached.

BUILD

1. Structure, this part is not optional
   - The scrollport (the element carrying overflow-x-auto) must be wrapped in a
     non-scrolling, position:relative parent.
   - The two fade overlays are siblings of the scrollport inside that wrapper,
     NOT children of the scrollport.
   - Reason: absolutely positioned children of a scroll container are part of
     its scrollable content and scroll away with it. Put the fades inside and
     they slide off screen instead of hugging the visible edge.

2. The overlays
   - Each is absolutely positioned, pinned to its edge, full height of the
     scrollport, 48px wide, above the table in stacking order.
   - Leading edge: gradient from the surface color to transparent, left to
     right. Trailing edge: the mirror of that, right to left.
   - Use the design system's surface color token, never a hardcoded color, so
     the fade blends against the card in both themes.
   - pointer-events: none. This is load-bearing. The fade sits on top of the
     last visible column, and without it a row click or a scrollbar drag under
     the fade is swallowed.
   - aria-hidden. It is a pure affordance with no content.
   - Toggle each one by opacity on a short transition (about 100ms, ease-out),
     and disable the transition under prefers-reduced-motion.

3. Visibility state
   - Compute two booleans from the scrollport: content hidden to the left, and
     content hidden to the right.
   - maxScroll = scrollWidth - clientWidth. Overflowing when maxScroll exceeds
     the tolerance below. Hidden-left when scrollLeft exceeds the tolerance.
     Hidden-right when scrollLeft is below maxScroll minus the tolerance.
   - When the content fits, both are false and NEITHER overlay renders. A
     non-overflowing table must produce the same DOM it produces today.

4. Use a sub-pixel tolerance of 1px in those comparisons
   - Browsers report fractional scrollWidth and scrollLeft at non-integer zoom
     and device pixel ratios. An exact scrollLeft === maxScroll comparison
     never settles at the far edge, and the trailing fade then never clears.

5. Observe the content, not just the container
   - Attach a scroll listener (passive) to the scrollport.
   - Attach a ResizeObserver to the scrollport AND to its first element child.
   - Both are needed. The scrollport catches container resizes, such as a side
     panel opening or a nav rail collapsing. The child catches the content
     changing size: a fixed-layout table redistributing its column widths
     changes scrollWidth without the container ever resizing, and a
     scroll-only listener never hears about it.

6. Get the element via a callback ref stored in state, not a useRef plus a
   mount effect
   - An effect keyed on a ref object runs before the node necessarily exists
     and never re-runs when it appears, so the measured state stays stuck at
     its initial value and the fade never shows.
   - Keying the effect on the node itself means listeners attach the moment the
     node mounts, and re-attach if the node is ever swapped.

7. Bail out of unchanged state updates
   - The scroll event fires every frame during a drag. Compare the newly
     measured booleans against the current ones and return the existing state
     object when they match, otherwise every frame re-renders the whole table.

VERIFY BEFORE YOU CALL IT DONE
- A table narrower than its container: no overlays in the DOM at all.
- A table wider than its container, scrolled to the far left: trailing fade
  only.
- Scrolled to the middle: both fades.
- Scrolled fully to the right: leading fade only, and the trailing fade fully
  clears (this is what the 1px tolerance protects).
- Click a row underneath a visible fade: the row click still fires.
- Drag the horizontal scrollbar where it passes under a fade: the drag works.
- Narrow the container until the table starts overflowing: the fade appears
  without a scroll gesture.
- Check both light and dark themes: the fade blends into the surface in both
  and never shows a grey or white band.
```
