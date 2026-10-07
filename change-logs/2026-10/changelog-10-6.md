# UI Changelog: 2026-10-06

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-5.md`](./changelog-10-5.md)

---

## General

### Count formatter: billions tier (`lib/formatters.ts`) `eae53d9`

- **Before:** `formatCompactCount` had an M tier only, so 1,526,400,000
  rendered as "1526.4M".
- **After:** once a count would round to 1000.0M it steps to "B"
  ("1.5B"). Below a million it still renders the full grouped integer.
  KPI tiles only, as before.

## Gate Chat: desktop, mobile and phone

Everything for the Gate Chat responsive pass, grouped so it can be read on
its own. Commits, in order:

- `10afc67` feat(chat): mobile Gate Chat keyboard, document scroll and demo send
- `1e42ade` fix(chat): landing, header, logo and memories polish
- `757bf58` fix(chat): header actions, sidebar credits and alignment

### Conventions

#### `keyboard-open` variant (`index.css`) `10afc67`

- **New:** `@custom-variant keyboard-open`, true while `<html>` carries
  `data-keyboard-open`. `useVisualViewportVars` sets it only when a field
  has focus AND the visible area is 150px+ below the resting height (the
  height with nothing focused). A desktop, a narrow window or DevTools'
  phone mode never matches. Use it for keyboard-only UI, never
  `pointer-coarse` + focus.

#### Touch text fields at 16px (`index.css`) `10afc67`

- **New:** an unlayered `@media (pointer: coarse)` rule sets `input`,
  `textarea` and `select` to `--text-base`, so iOS no longer zooms into
  a field under 16px. Recorded in design.md §Inputs & Forms.

#### Vertical separators centre on their row (`pages/chat/chat-composer.tsx`, `pages/chat/chat-header.tsx`, `pages/chat/chat-usage-row.tsx`) `1e42ade`

- **Before:** a fixed-height vertical `Separator` asked for `self-center`
  but the primitive's `data-vertical:self-stretch` outranks it, so the
  composer divider sat 6px high and the usage-row dividers 3px high.
- **After:** call sites use `data-vertical:self-center`; every chat
  divider's centre now equals its row's. The primitive is unchanged.

### Surfaces

#### Gate Chat: mobile layout and keyboard (`layouts/ChatLayout.tsx`, `pages/Chat.tsx`, `pages/chat/chat-thread.tsx`, `hooks/use-visual-viewport-vars.ts`) `10afc67`

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

#### Gate Chat: landing steps aside for the keyboard (`pages/chat/chat-landing.tsx`) `10afc67`

- **Before:** title, description and workspace line stayed put when the
  composer took focus.
- **After:** they fade and lift 8px (150ms, 50ms stagger) only while an
  on-screen keyboard is open (`keyboard-open:`), and return after it
  closes. They also enter on page load with the same 50ms stagger.
  Desktop keeps them on focus. Recorded in design.md Motion.

#### Gate Chat: new chat opens the demo conversation (`pages/Chat.tsx`) `10afc67`

- **Before:** Send was inert everywhere and a starter prompt seeded the
  composer.
- **After:** from a new chat (`/chat` and every tier twin), Send or a
  starter prompt navigates (push) to the seeded conversation
  `chat_8f2c41d7`; Back returns to the clean landing. A browser refresh
  on that thread also returns to the landing. Inside a conversation,
  Send stays inert and keeps the draft. Documented in data-model.md.

#### Gate Chat: phone composer details (`pages/chat/chat-composer.tsx`, `pages/chat/chat-attachment-picker.tsx`, `pages/chat/chat-landing.tsx`, `pages/Chat.tsx`) `10afc67`

- **After:** starter chips sit on the phone composer (`sm:hidden`); the
  "AI can make mistakes" helper line shows at every width (was `sm` up);
  picked attachments render as chips above the prompt instead of growing
  the toolbar row; toolbar icons are 20px on coarse pointers.

#### Gate Chat: model picker provider filter (`pages/chat/chat-model-selector.tsx`) `10afc67`

- **Before:** the "All providers" select sat at its content width under
  the search field on phones.
- **After:** full width below sm (`w-full sm:w-fit`); beside the search
  field from sm, unchanged. The picker stays the centered Dialog at every
  width.

#### Gate Chat: landing polish (`pages/chat/chat-landing.tsx`, `pages/Chat.tsx`) `1e42ade`

- **Before:** the "AI can make mistakes" line sat under the composer;
  chips 8px above it; starter buttons 36px (44 touch); starter list
  624px wide; only the title, description and workspace line animated in.
- **After:** the helper line is gone; chips sit 12px (`gap-3`) above the
  composer; chips and the landing list are 40px with a mouse and keep
  44px on touch; description and list share one 540px column
  (`max-w-135`); from `md` the buttons join the entrance stagger
  (100 / 150 / 200ms, workspace line 250ms).

#### Gate Chat: top bar logo and rail (`pages/chat/chat-top-bar.tsx`, `layouts/ChatLayout.tsx`, `components/ui/sidebar.tsx`) `1e42ade`

- **Before:** the logo mark at every width, and a rail collapse toggle.
- **After:** the full lockup (`BrandLockup`, the dashboard rail's own,
  now exported) from `lg`, the mark below it; the rail is always
  expanded and the toggle and its state are removed.

#### Gate Chat: conversation header (`pages/chat/chat-header.tsx`) `1e42ade`

- **Before:** 56px at every width; Credits label 12px.
- **After:** 64px from `lg` (`lg:h-16`), meeting the docked Ask AI header
  (both 64 to 128); Credits label `type-label-14`, level with the balance.

#### Gate Chat: Memories dialog (`pages/chat/chat-memory-panel.tsx`) `1e42ade`

- **Before:** 384px; row switches `sm` (24x14) pinned to the row top, 9px
  off the delete button's centre.
- **After:** 400px (`sm:max-w-100`); every switch default (32x20); each
  row centres its switch and delete button on the text.

#### Gate Chat: top bar and header actions (`pages/chat/chat-top-bar.tsx`, `pages/chat/chat-header.tsx`, `pages/chat/chat-conversation-stats.tsx`, `pages/chat/chat-data.ts`, `components/ui/notifications-menu.tsx`) `757bf58`

- **Before:** the notifications bell was outlined from `lg`; the stats
  (Activity) button sat muted beside the title; the header read
  "Title  yesterday" with no separator; relative dates were lowercase.
- **After:** the bell is a ghost button like the theme toggle (new
  optional `triggerVariant` / `triggerClassName` on `NotificationsMenu`;
  the dashboard keeps its `ghost-to-outline` bell); stats sits at the far
  right after Memories, both in the foreground, 12px apart (36px buttons,
  44px on touch); the title reads "Title · Yesterday" with a muted bullet
  8px either side; dates are sentence case ("Yesterday") in the header
  and the rail.

#### Gate Chat: sidebar credits, drawer and alignment (`pages/chat/chat-sidebar.tsx`) `757bf58`

- **Before:** the rail/drawer Credits label was 12px and ran straight
  into Back to dashboard; Back to dashboard had 16px above and below on
  phones; drawer row names ran under the always-visible more button;
  "Chats" and the date headings sat 12px inside the panel padding at
  medium weight.
- **After:** Credits label `type-label-14`, with a full-width divider
  under the credits block (shown below `xl`, wherever the block is); Back
  to dashboard has 12px above and below in the phone drawer (16px in the
  rail); drawer rows truncate 20px earlier (`pr-16`), 12px clear of the
  more button; "Chats" and the date headings sit on the 16px panel edge,
  flush with New chat; the date headings are regular weight
  (`type-copy-12`).
