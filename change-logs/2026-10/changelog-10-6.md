# UI Changelog: 2026-10-06

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-5.md`](./changelog-10-5.md)

---

## Conventions

### Count formatter: billions tier (`lib/formatters.ts`) `eae53d9`

- **Before:** `formatCompactCount` had an M tier only, so 1,526,400,000
  rendered as "1526.4M".
- **After:** once a count would round to 1000.0M it steps to "B"
  ("1.5B"). Below a million it still renders the full grouped integer.
  KPI tiles only, as before.

### `keyboard-open` variant (`index.css`) `10afc67`

- **New:** `@custom-variant keyboard-open`, true while `<html>` carries
  `data-keyboard-open`. `useVisualViewportVars` sets it only when a field
  has focus AND the visible area is 150px+ below the resting height (the
  height with nothing focused). A desktop, a narrow window or DevTools'
  phone mode never matches. Use it for keyboard-only UI, never
  `pointer-coarse` + focus.

### Touch text fields at 16px (`index.css`) `10afc67`

- **New:** an unlayered `@media (pointer: coarse)` rule sets `input`,
  `textarea` and `select` to `--text-base`, so iOS no longer zooms into
  a field under 16px. Recorded in design.md §Inputs & Forms.

## Sections & surfaces

### Gate Chat: mobile layout and keyboard (`layouts/ChatLayout.tsx`, `pages/Chat.tsx`, `pages/chat/chat-thread.tsx`, `hooks/use-visual-viewport-vars.ts`) `10afc67`

- **Before:** below lg the shell was a fixed `h-dvh` box with the thread
  in its own scroller. On iPhone the keyboard panned the page and both
  header bars slid off screen.
- **After:** below lg the document scrolls. `ChatTopBar` is `sticky
  top-0 z-30` and `ChatHeader` is `sticky top-16 z-20`. The thread is in
  normal flow and the composer is `fixed bottom-0`, lifted by
  `--kb-inset` (innerHeight - vv.height - vv.offsetTop). `<main>` pads
  by the composer's measured height (`--chat-composer-h`) so the last
  bubble clears it, and the jump-to-latest button floats 12px above it.
  While a keyboard is open, background touch-drags are cancelled (the
  page cannot scroll behind the lifted composer) and the shell gets 50svh
  of keyboard room. `interactive-widget=overlays-content` is appended to
  the viewport meta on the chat pages only and restored on leave. lg+ is
  unchanged.

### Gate Chat: landing steps aside for the keyboard (`pages/chat/chat-landing.tsx`) `10afc67`

- **Before:** title, description and workspace line stayed put when the
  composer took focus.
- **After:** they fade and lift 8px (150ms, 50ms stagger) only while an
  on-screen keyboard is open (`keyboard-open:`), and return after it
  closes. They also enter on page load with the same 50ms stagger.
  Desktop keeps them on focus. Recorded in design.md Motion.

### Gate Chat: new chat opens the demo conversation (`pages/Chat.tsx`) `10afc67`

- **Before:** Send was inert everywhere and a starter prompt seeded the
  composer.
- **After:** from a new chat (`/chat` and every tier twin), Send or a
  starter prompt navigates (push) to the seeded conversation
  `chat_8f2c41d7`; Back returns to the clean landing. A browser refresh
  on that thread also returns to the landing. Inside a conversation,
  Send stays inert and keeps the draft. Documented in data-model.md.

### Gate Chat: phone composer details (`pages/chat/chat-composer.tsx`, `pages/chat/chat-attachment-picker.tsx`, `pages/chat/chat-landing.tsx`, `pages/Chat.tsx`) `10afc67`

- **After:** starter chips sit on the phone composer (`sm:hidden`); the
  "AI can make mistakes" helper line shows at every width (was `sm` up);
  picked attachments render as chips above the prompt instead of growing
  the toolbar row; toolbar icons are 20px on coarse pointers.

### Gate Chat: model picker provider filter (`pages/chat/chat-model-selector.tsx`) `10afc67`

- **Before:** the "All providers" select sat at its content width under
  the search field on phones.
- **After:** full width below sm (`w-full sm:w-fit`); beside the search
  field from sm, unchanged. The picker stays the centered Dialog at every
  width.
