# UI Changelog: 2026-07-17

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-16.md`](./changelog-7-16.md)

---

## Conventions

### Subtitles full-width on mobile and tablet `b576c2c`

**22 page files** (Activity, ApiKeys, AuditTrail, Billing, Conversations, Limits, Models, Requests, Security, Settings, Team, TokenSavings, Upgrade + their `*Default`/`*Free` twins)

Page-header subtitles were capped at `max-w-1/2` at every width, so on mobile and tablet they compressed into a tall narrow column. Propagated the pattern Dashboard already used (`max-w-full` + `xl:max-w-1/2`) to every other page header: full width up to `xl` (1280px), 50% cap only on large desktop. One class per file; no other changes.

## Components

### Sidebar rail desktop-only; hamburger nav on tablet + mobile `c69e6dd`

**`src/layouts/DashboardChrome.tsx`**, **`src/components/ui/sidebar.tsx`**, **`src/App.tsx`**

The persistent sidebar rail now renders at `lg`+ only; tablet and mobile use the hamburger sheet (the rail/hamburger split moved from `md` to `lg`). The workspace switcher lives in the top bar on desktop (both collapse states) and in the hamburger sheet below `lg`; the top-bar logomark shows below `lg` (where there is no rail to carry the brand) and is hidden at `lg`+. Removed the `≤1024px` force-collapse in `App.tsx` so the rail's expand/collapse toggle works at every width, and moved the MobileNav auto-close threshold from 768px to 1024px to match. Exactly one workspace switcher is reachable at every size; no duplicate logo.

## Sections

### Overview security-events preview: unique row key `9b48cc3`

**`src/pages/Dashboard.tsx`**

A single request can carry two security findings (e.g. `req_8389e4` has both a PII and a credential finding), so keying the "Latest security events" preview rows by `requestId` produced a duplicate-React-key warning. Rows are now keyed by `requestId`-plus-index, matching the `EventsTable` house pattern. Cosmetic fix; no rows were dropped.

### Table pagination: legible active page, prev button, compact window, 32px `9d53976`

**`src/components/ui/pagination.tsx`**, **`src/components/ui/table-pagination-footer.tsx`**

Four fixes to the table pagination footer. (1) The active page number was invisible in dark mode: the Button `outline` variant carries `dark:bg-input/30` + `dark:border-input`, which tailwind-merge does not treat as conflicting with `bg-primary`, so the `.dark` rule won and left dark `text-primary-foreground` on a translucent dark fill; added `dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary` to the active state so it reads in both themes. (2) Added an always-present Previous (`<`) button, disabled + `pointer-events-none opacity-50` on page 1 (mirrors the existing Next pattern). (3) `buildPageWindow` is now constant-width: any gap of one or more hidden pages collapses to an ellipsis (removed the lone-page-to-number fill), so a 7-page table shows e.g. `‹ 1 … 3 4 5 … 7 ›` at page 4 and never balloons back to all seven numbers. (4) All controls (numbers, `<`, `>`, ellipsis) sized to 32px (`icon-sm` / `size-8`), numbered links `min-w-8 px-2` so multi-digit pages don't clip. Verified against canonical shadcn (via the shadcn skill): all a11y/semantics already match; prev/next stay icon-only (accessible name via `aria-label`).
