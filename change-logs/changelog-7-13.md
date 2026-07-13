# UI Changelog: 2026-07-13

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-10.md`](./changelog-7-10.md)

---

## Conventions

### Recessed-surface tokens: nested inset -> --card-muted, message wells -> --background `13db63a`

**`public/design-system.html`**, **`src/components/ui/message-block.tsx`**, **`src/pages/requests/RequestDetailModal.tsx`**, **`.claude/rules/no-hardcoding.md`**

Recessed surfaces must map to a token that steps the RIGHT direction per theme (in dark, a recessed surface is darker than the card, not lighter). Two fixes:

- **Nested card inset.** On the design-system page, added `--card-muted` (neutral-50 light / neutral-800 dark, mirroring `src/index.css`) and repointed `.nested` + `.outline-demo .tag` to it. They had been set to `--muted` (neutral-100 / neutral-800) during the tokenization pass, but `--muted` is the subtle/hover-fill role; a nested card inset is `--card-muted`. Identical in dark, one step off in light (was neutral-100, now neutral-50).
- **Message wells.** The conversation/request message bubbles rode `bg-card-muted` (MessageBlock) or the card surface, so in dark they read lighter than or equal to the card. Repointed to `bg-background` (neutral-950 dark / neutral-50 light) so a well sits one surface BELOW the card in both themes, following the Vercel two-surface model . Applied to `message-block.tsx` and the request-detail message wells.
- **Rule fix.** Split the `no-hardcoding.md` mapping table row so "nested card / panel inset surface -> `--card-muted`" and "subtle / hover / active fill -> `--muted`" are distinct intents .

### No-hardcode rule + design-system reference page fully tokenized for dark mode `d151a6a`

**`.claude/rules/no-hardcoding.md`** (new), **`CLAUDE.md`**, **`public/design-system.html`**, **`design.md`**

New closed-set discipline: a raw ramp step used for a semantic role (`var(--neutral-900)` for body text, `var(--white)` for a surface, `bg-success-100` on a themed pill) is still hardcoding, because raw ramps are theme-independent and do not invert under `.dark`. The prior `design-tokens.md` rule caught hex but missed this trap. Added `.claude/rules/no-hardcoding.md` (literals live only in the token-definition layer; UI code maps intent to a semantic token) and linked it from `CLAUDE.md`'s local reminders.

Applied the rule to `public/design-system.html`, whose specimens had been hand-authored with hardcoded colors so they did not flip when the dark toggle landed. Before → after, dark mode:

- **Nav / chrome:** `.nav .brand b`/`.nav a.active`/`:hover` used `var(--neutral-900)` text on a `--card` surface that flips to `neutral-900` → invisible text. Now `--foreground` / `--muted` / `--muted-foreground`.
- **Foundations, inputs, cards, motion:** group/spec/caption text and track/tag surfaces moved off raw ramps to `--foreground` / `--muted-foreground` / `--card` / `--muted`. Input placeholder → `--muted-foreground`; nested surface → `--muted`.
- **Badges + callout:** kept the light base rules, added `[data-theme="dark"]` overrides mirroring `badge.tsx` (`{tone}-500 @15% / {tone}-300`, danger via `--destructive @20%`).
- **Destructive button:** was solid red + `var(--white)` (matched no app variant); now the app's tint (`--destructive` text on `--destructive @10%/@20%`).
- **Card edge:** unified to `border: 1px solid var(--border)` + shadow across `.demo-card` and the elevation cards; repointed the dark `--shadow-*` rings from black `rgb(0 0 0 / N)` to `color-mix(var(--foreground) 10%)` so cards keep a visible edge on the dark canvas.
- **Kept intentional:** color-ramp swatches, token catalog, `.space-row .bar` / `.ease-ball` brand accents, and the token-definition layer. The `data (mono)` specimen mapped to `--foreground` (no data-tier token exists).

Verified in-browser: nav brand, buttons, badges, inputs, and both card surfaces flip correctly light↔dark; braces balanced 182/182. Also corrected three stale "no dark mode" claims in `design.md` (Not-yet-captured list, Key characteristics, the Don't list) to present tense; the §"Dark mode (`.dark` theme)" section remains the source of truth for how the app drives it (`ThemeProvider`, follows OS until toggled, persisted to `localStorage`).

App audit (`src/`) run alongside: typography is correctly tokenized (root sets `body { color: var(--foreground) }`; every live raw/hardcoded text color is a justified fill/code-surface/CTA case). The defect was specific to the hand-authored HTML page, not the product.

## Sections

### data-model.md: sync detail surfaces to page-only `c1890f3`

Not dashboard UI, logged for traceability. Brought `data-model.md` in line with the already-shipped request-modal deletion (documented above, `2754b77`/`3d780d0`): Messages/Conversations detail now documented as page-primary. Row-click navigates to `/messages-findings/:requestId` (`RequestDetailBodyV2`, no `?open=`) and `/conversations-trace/:conversationId` (`ConversationDetailBody`; legacy `?open=cnv_*` dialog noted). Fixed stale `EventRow` and findings/Security outbound cross-links; Security's `/conversations?open=` left intact since it still resolves via the legacy dialog.

### Messages detail: flatten section titles to type-label-14 `55ed83a`

**`src/pages/requests/RequestDetailBody.tsx`**, **`src/components/ui/message-block.tsx`**, **`src/data/requests.ts`**

Every column section label on the message-findings detail page now reads at one flat 14px voice. `PanelHeading` (User message / Provider context / Error response / How to fix / Findings / Passed / Details), `SubcardHeading`, and the "Full request" collapsible trigger moved `type-heading-16` -> `type-label-14`, dropping `tracking-snug`. All three route through the shared `PanelHeading`, so nothing in the header above the two-column grid (page title, KPI bar) is touched. before -> after: 16px medium heading -> 14px flat label. `message-block.tsx` role label bumped `type-label-12` -> `type-label-14` to sit in the same voice. Also set the `req_cd0e57` compression override `100.0%` -> `22.4%` (one-decimal is the field's format convention).

### Messages: soften danger/warn message tint + drop dead modal variant `f93986b` `3d780d0`

**`src/components/ui/message-block.tsx`**, **`src/pages/requests/RequestDetailBody.tsx`**, **`src/pages/RequestsFindings.tsx`**

Two related passes on the Messages trace + detail surfaces:

- **Message tint (`f93986b`).** The `danger`/`warn` message-bubble tones used solid ramp fills in light (`bg-danger-50`, `border-danger-200`) while dark already used color+opacity, so light read as solid red. Both modes now use color+opacity on `danger`/`warning-500`, dialed down: border `/15`, bg `/8` light `/10` dark. before -> after: solid ramp fill -> subtle translucent tint. Also removed the `ring-1` from the selected state so an active bubble keeps the same 1px border width as its neighbors, distinguished only by the deeper border color .
- **Modal variant cleanup (`3d780d0`).** After the dialog deletion , `RequestDetailBodyV2`'s `variant` prop was always `"page"` . Removed the prop and resolved every `variant === "page"` branch to the page path (static title, natural-flow layout, no internal scroll), deleted the modal-only footer block, and dropped the now-unused `DialogScrollFooter`/`ExternalLink` imports. Recessed the Full request content well to `bg-background` so it matches the User message well; the collapsible trigger and its footer stay on `bg-card`.

### Messages detail: delete dead request modal, rename file to RequestDetailBody `2754b77`

**`src/pages/requests/RequestDetailBody.tsx`** (renamed from `RequestDetailModal.tsx`), **`src/pages/requests/RequestsTable.tsx`**, **`src/pages/Dashboard.tsx`**, **`src/pages/security/EventsTable.tsx`**, **`src/pages/RequestsFindings.tsx`**, **`src/data/requests.ts`**

Request detail became a URL-addressable page some time ago (`/messages-findings/:requestId` -> `RequestsFindings` -> `RequestDetailBodyV2`), but a leftover dialog lived on in the same file, still opened by `?open=req_*` deep-links. Removed it end to end:

- **Repointed the two deep-links** that fed the modal to the page instead: Dashboard recent-request row and Security `EventsTable` "open request" now `navigate('/messages-findings/:id')` . Behavior change: those land on the full page, matching the row-click path. Conversation `?open=cnv_*` deep-links are a separate system, untouched.
- **Deleted the modal:** `RequestDetailDialog` + `RequestDetailDialogV1`/`V2` + the `REQUEST_MODAL_VERSION` toggle + the V1-only body, and the dead chain that left behind (`SecurityPanel`, `SecurityCheckRow`, `rowActionToCheckStatus`, `CHECK_BADGE_VARIANT`, and now-unused `Tabs`/dialog/type imports). ~350 lines out of the detail file.
- **Cleaned `RequestsTable`:** removed the `RequestDetailDialog` render, the `?open=` sync (`selectedRow`, `useSearchParams`), and the now-redundant fragment wrapper.
- **Renamed** `RequestDetailModal.tsx` -> `RequestDetailBody.tsx` (git mv, 85% similarity), updated the one importer and a stale doc comment. No component or domain renames — `requestId`, `RequestRow` unchanged. tsc + lint clean; page verified in-browser with 0 console errors.

### Design system reference page: dark mode + theme toggle + token catalog `e6663e4`

**`public/design-system.html`** (relocated from repo root), **`biome.jsonc`**

Relocated the standalone `design-system.html` reference page from the repo root into `public/` (now served at `/design-system.html`) as part of a root-structure cleanup, and expanded it three ways:

- **Dark mode.** Added a `[data-theme="dark"]` block to the page's inline `<style>` mirroring `src/index.css`'s `.dark` block — semantic tokens (`--background`, `--card`, `--foreground`, `--border`, `--input`, `--ring`, `--destructive`, `--canvas`), the 5-points-darker chart palette (`--chart-1..8`), and the black-based elevation shadows. The raw ramps stay theme-independent as declared in `:root`.
- **Light/dark toggle.** A control pinned top-right sets `data-theme` on `<html>`, persists the choice to `localStorage`, and initializes from stored value else `prefers-color-scheme`. The whole page re-themes so light/dark are directly comparable; label + icon update on flip; `body` got a 0.2s color/background transition.
- **Tokens section.** New "Tokens" section, 9 groups / 82 rows (neutral/blue/success/warning/danger ramps, semantic tokens, chart palette, radius, elevation). Each row is a live swatch + token name + resolved value; values are read via a probe element and re-render on theme change, so they always reflect the active theme.

The page stays fully self-contained (inline CSS + vanilla JS, no build deps) and lint-excluded — `biome.jsonc`'s two exclusion paths were updated from the old root location to `public/design-system.html` (the move had pulled the file into a linted path). Verified in-browser: toggle flips and persists, tokens re-resolve, 0 console errors, dark body text renders white on neutral-950.

### Repo hygiene — root cleanup, data-model + changelog docs `c7592f6`

Not dashboard UI, logged for traceability. Root file-structure cleanup: `design-system.html` → `public/`; `.gitignore` now ignores `*.code-workspace`; `data-model.md` route refs updated `/requests` → `/messages` (component/type names unchanged); `changelog-7-10.md` reorganized into Global + per-page sections. Config and root docs (`design.md`, `data-model.md`, `README`, `CLAUDE.md`) intentionally left at root — moving them breaks tooling or committed links.
