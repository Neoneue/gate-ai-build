# UI Changelog: 2026-07-15

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-14.md`](./changelog-7-14.md)

---

## Sections

### Large-table section-header toolbars: stack above the table `7e36951`

**`src/pages/Activity.tsx`**, **`src/pages/Conversations.tsx`**, **`src/pages/AuditTrail.tsx`**, **`src/pages/requests/RequestsTable.tsx`**, **`src/pages/security/EventsTable.tsx`**, **`src/pages/Models.tsx`**

The five large-table section headers each laid their search + controls out differently (Activity/Models fixed-width search that squished; Conversations/AuditTrail stacked at `sm`/`md`; Messages/Events wrapped organically). Unified them: the section title sits on its own row and the toolbar always sits beneath it on the page background. The search stretches to fill (`flex-1`) and the action controls group to the right. Models additionally moved its filter controls out of the in-card `FilterToolbar` bar onto the page background under the tab bar so it matches the rest (the `FilterToolbar` wrapper and its import were dropped there). No breakpoint-specific inline state remains.

### Activity "Recent key usage": drop Billing column, even column widths `7e36951`

**`src/pages/Activity.tsx`**

Removed the Billing column (the `GATE` / `BYOK` badge) from the "Recent key usage" table — header cell, per-row cell, and the now-unused `Info` / `Tooltip` / `TableHead` imports. Switched the `<Table>` to `table-fixed` so the eight remaining columns (Key, Member, Messages, Alerts, Tokens in, Tokens out, Saved, Spend) split evenly instead of pooling the full-width slack into the Member→Messages seam.

### Security MiddleRow: stack the two category cards below `lg` `de97fa7`

**`src/pages/Security.tsx`**

The Action-categories and Attack-categories cards above the Security events table sat in a fixed `grid grid-cols-2 gap-4` that never stacked. Made it mobile-first — `grid-cols-1` base, `lg:grid-cols-2` — so the two cards drop to a single column on smaller screens and return to side-by-side at `lg`+. Applied via `/impeccable adapt`.
