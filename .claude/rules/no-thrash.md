# Rule: pin the surface before debugging "it's not working"

Two gotchas this codebase will not tell you on its own.

**Free / Pro / Default twins are separate files.** `BillingFree` vs `Billing`,
`PoliciesFree` vs `Policies`, `RequestsDefault` vs `Requests`, and so on. A fix
applied to the wrong twin looks identical to a fix that didn't work. Before
editing, confirm which route renders what the user is looking at. The
screenshot usually names the route.

**Mobile demo versions are separate from desktop (owner 2026-10-11).** Work
on a mobile onboarding version (Mobile A, Mobile B) never edits a file,
route or shared primitive the desktop version uses. Copy the part into
`src/pages/onboarding/` and route it as `/<page>-mobile-onboarding`; a phone
link change goes only on the `lg:hidden` element. A desktop browser narrowed
to phone width is a separate, later problem, never a reason to touch desktop.
The routes are listed in `data-model.md` ("Onboarding workspace").
Which page to copy (owner 2026-10-12): with no data yet, the Default twin's
layout; once the demo has data, the full Pro page (every section, control
and card), with a section that has nothing to show in its own empty state.
Never fill the Default layout with data. Compare the result against the
live product's phone page before reporting.

**A green build is not proof the feature works.** Vite renders the app despite
TypeScript errors, so `tsc`, lint, and build all passing says nothing about
whether the behavior is correct. Verify in the browser before and after any
refactor.

When a fix doesn't work, revert it before trying the next one. Two failed edits
to the same element means the cause is still unknown, and stacking a third
patch on top will not find it.
