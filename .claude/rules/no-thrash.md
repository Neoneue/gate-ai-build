# Rule: pin the surface before debugging "it's not working"

Two gotchas this codebase will not tell you on its own.

**Free / Pro / Default twins are separate files.** `BillingFree` vs `Billing`,
`PoliciesFree` vs `Policies`, `RequestsDefault` vs `Requests`, and so on. A fix
applied to the wrong twin looks identical to a fix that didn't work. Before
editing, confirm which route renders what the user is looking at. The
screenshot usually names the route.

**A green build is not proof the feature works.** Vite renders the app despite
TypeScript errors, so `tsc`, lint, and build all passing says nothing about
whether the behavior is correct. Verify in the browser before and after any
refactor.

When a fix doesn't work, revert it before trying the next one. Two failed edits
to the same element means the cause is still unknown, and stacking a third
patch on top will not find it.
