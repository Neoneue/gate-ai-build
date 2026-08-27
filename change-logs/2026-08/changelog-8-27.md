# UI Changelog: 2026-08-27

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-25.md`](./changelog-8-25.md)

---

## Sections

### Org security events gain the scope tray `3714c67`

The "Which security events" tray (every event, or narrowed by policy, action,
or rate) existed only under the personal Security event row; the Organization
card's Org-wide security events row had channel checkboxes but no fine-tuning.
PM direction: an org admin gets the same options in both places. The same
`SecurityScopePanel` now renders under the org row whenever that row has any
channel checked (same reveal rule as the personal row, selection only), reused
verbatim with zero copy or layout changes. To make a second instance legal, the
panel gained an `idPrefix` prop (personal `notif-scope`, org `notif-org-scope`)
that namespaces every DOM id and `htmlFor`, so the two trays cannot cross-wire
labels. Org scope state is a separate in-memory `orgSecurityScope` beside
`orgPrefs`, seeded to the untouched defaults (every event, rate off at 10/1h);
the persisted `NotificationPrefs` model still declares no org shape, so it
resets on refresh by design. Pro twin only: Default and Free hide the whole
Organization section. Both trays open at once stay fully independent
(browser-verified, duplicate-id audit clean). `src/pages/Notifications.tsx`.
