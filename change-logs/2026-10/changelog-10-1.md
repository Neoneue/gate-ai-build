# UI Changelog: 2026-10-01

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-29.md`](../2026-09/changelog-9-29.md)

---

## Components

### Sidebar: nav items can open in a new tab (`components/ui/sidebar.tsx`) · [544eb1b]

- **Before:** every sidebar item was an in-app router link.
- **After:** an item with `newTab: true` renders a real
  `<a target="_blank" rel="noreferrer">`. Gate Chat is the one item that
  uses it.

### Dashboard chrome: shared top-bar pieces extracted (`layouts/DashboardChrome.tsx`) · [544eb1b]

- **Before:** the sidebar collapse toggle, logo mark link, Ask AI surface
  and desktop media query lived inline in `DashboardChrome`.
- **After:** extracted with no visual change into
  `components/ui/top-bar-brand.tsx`, `components/ui/ask-ai-surface.tsx`
  and `hooks/use-is-desktop.ts`, so the chat layout reuses them.

## Sections & surfaces

### Gate Chat: UI ported from production (`pages/Chat.tsx`, `pages/chat/`, `layouts/ChatLayout.tsx`) · [544eb1b]

- **Before:** no chat surface in the design build.
- **After:** the production Gate Chat UI (AG-599) with the site's copy
  verbatim. UI only: Send keeps the draft and adds nothing.
  - Nav: "Gate Chat" in the Gateway section after Models (`Bot` icon),
    opens in a new tab, on every tier and for every role
    (`layouts/nav-sections.ts`).
  - Routes: `/chat` and `/chat/:conversationId` on each tier suffix (8 in
    `App.tsx`), under a full-screen `ChatLayout` outside
    `DashboardChrome`. `/chat` joins the tier twin sets in `lib/plan.ts`.
  - 14 components plus store, data, contract and types in `pages/chat/`.
    Seed in `data/gate-chat.ts`: every dollar is catalog price times the
    seed's tokens; the credit balance is Billing's `CREDIT_BALANCE_USD`.
  - Top bar uses the dashboard's collapse toggle and the logo MARK only,
    not the full logo (deviation from the site, by request).
- Model picker (`pages/chat/chat-model-selector.tsx`):
  - Search grows so the "All providers" dropdown sits on the right
    padding (`sm:grid-cols-[minmax(0,1fr)_auto]`).
  - Star column sits 16px from the list edge: row `pr-0 pl-3`, the
    selected-model `Check` moved before the star button.
- Tests: `nav-sections.test.ts` covers 17 ids plus a Gate Chat tier by
  role check; `data/gate-chat.test.ts` and `pages/chat/chat.test.tsx`
  added. `data-model.md` updated.
- **Open (pending a decision), deviations from the site:**
  - Mobile: the brand column tracks the rail at `lg+` only.
  - The workspace switcher moves into the chat drawer.
  - The drawer has no close X.
  - The seed's request ids link to not-found pages.
  - Landing gap is 24px instead of 28px.
  - Starter rows are 36px instead of 44px.
