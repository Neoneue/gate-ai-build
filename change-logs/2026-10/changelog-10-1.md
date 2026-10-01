# UI Changelog: 2026-10-01

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-29.md`](../2026-09/changelog-9-29.md)

---

## Conventions

### Agent tooling: Firecrawl setup skill and routing (`.claude/skills/`) · [1ee8d34]

- **Before:** agents had no web tool for JS-rendered pages, site crawls or
  structured multi-site extraction beyond WebFetch and Playwright.
- **After:** the Firecrawl MCP, CLI and official skills are installed at
  user level (outside the repo). This repo adds
  `.claude/skills/firecrawl-setup/` (setup and reinstall notes, no key) and
  a `.claude/skills/INDEX.md` row: WebFetch first, Firecrawl only when it
  falls short, never private or Constellation URLs. No UI change.

### Shareable prompt: Gate Chat model dialog spacing fixes (`gate-chat-model-dialog-fixes.md`) · [3e42b0b]

- **Before:** the two model picker spacing fixes made in this build had no
  write-up for the production site.
- **After:** a repo-root prompt for the dev: the search grows so the
  "All providers" dropdown reaches the right padding, and the favourite
  star sits 16px from the list's inner edge, with file, lines and the
  expected measurements. No UI change.

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

### Smoke test: sidebar walk follows new-tab items (`e2e/smoke.spec.ts`) · [be72fa6]

- **Before:** the "sidebar walk across every tier root" test clicked every
  sidebar link and expected the same tab to navigate. Gate Chat opens in a
  new tab, so the page stayed on `/models` and CI's `e2e` job failed on
  PR #49.
- **After:** a `target="_blank"` item is followed through the popup: the
  test asserts the new tab's URL, closes it and continues the walk. No UI
  change.

### MultiSelect: `emptyIsAll` prop (`components/ui/multi-select.tsx`) · [974bbf9]

- **Before:** an empty selection always rendered the trigger label in
  `text-muted-foreground`, so a filter's "All capabilities" read as a
  placeholder beside a sibling Select's "All providers".
- **After:** with `emptyIsAll`, the empty label stays `text-foreground`
  and reads as a value. Used on the Models capabilities filter. "Select
  ..." pickers (Teams windows) leave it off and keep the muted placeholder.

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

### Models: Features renamed Capabilities, modality tabs hidden (`pages/Models.tsx`) · [974bbf9]

- **Before:** the catalog showed an All types / Text / Multimodal tab bar,
  and the column, filter and empty state said "Features" ("All features",
  "Filter by features", "fewer features").
- **After:** the tab bar is hidden, not deleted (`hidden` on its
  `TabsList`, `modality` stays "all"). The column header, filter
  placeholder, aria-label and empty-state copy say "Capabilities" ("All
  capabilities", "Filter by capabilities", "fewer capabilities").

### Model detail: Deprecated badge, capability tags hidden (`pages/Models.tsx`, `data/model-deprecations.ts`) · [974bbf9]

- **Before:** no deprecation signal on any model, and the page header
  showed a row of capability tags.
- **After:** a `Badge variant="warning"` reading "Deprecated" sits beside
  the title when `isDeprecated(model.id)`. `MODEL_DEPRECATIONS` lists 16
  models deprecated as of 2026-10-01, each with a date and a cited source
  (Anthropic's model table, the route head's LiteLLM `deprecation_date`,
  or the vendor's first-party LiteLLM entry).
  `model-deprecations.test.ts` asserts every id exists in `MODELS` and no
  date is in the future. The capability tags wrapper is hidden, not
  deleted (`flex` to `hidden`). `data-model.md` updated.
