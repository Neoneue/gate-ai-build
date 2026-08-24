# UI Changelog: 2026-08-24

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-20.md`](./changelog-8-20.md)

---

## Sections

### Alerts page removed `d520877`

The hidden Alerts page is gone. `/alerts` and its `-default`/`-free` twins
routed to a fully built rules-and-firings surface (added 2026-08-05, hidden
from the nav 2026-08-06) that the notifications PRD has since superseded:
alerting splits into a Workspace "My Notifications" page plus per-limit alert
controls on Limits, so no standalone Alerts page ships. Deleted
`src/pages/Alerts.tsx` and twins, the `src/pages/alerts/` module (types, data,
view, glyphs, `AlertRuleWizard`, `AlertEventDialog`), and
`src/components/ui/stepper.tsx`, which only the wizard used. Routes and lazy
imports left `App.tsx`, the commented-out nav item left `nav-sections.ts`, and
`/alerts` left both twin sets in `plan.ts` (15 nav bases down to 14). The two
`src/pages/requests/` comments and the `data-model.md` sections that justified
the transcript-blob split by pointing at the Alerts route were rewritten.
Recover from git history if a future Alerts page wants the wizard back. The
Activity table's "Alerts" count column stays for now; it points at a concept
with no page and gets renamed or rewired with the My Notifications build.
