# UI Changelog: 2026-08-12

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-11.md`](./changelog-8-11.md)

---

## Sections

### Account management reads as an organization surface `734f85c`

**`pages/Settings.tsx`**

The section subtitle described the section as deletion-only, so any future account-level action added beside the delete card would have contradicted its own heading. The card itself also spoke in account language while the thing being destroyed is the organization.

- **Subtitle generalized.** Pro: "Downgrade your plan, or permanently delete your account and its data." → "Manage your plan, organization, and other account-level actions." Free (no cancel-plan card): "Permanently delete your account and its data." → "Manage your organization and other account-level actions." The specifics moved down into the card that owns them.
- **Delete card restated as organization deletion.** Title "Delete account and data" → "Delete this organization". Subtext replaced outright with the product copy: "Deleting this organization removes every member's access and permanently erases its data. You'll have 30 days to reverse it. Your pay-as-you-go balance is kept until the deletion completes."
- **Trigger carries a warning mark.** `Button size="sm" variant="destructive"` now leads with `<TriangleAlert aria-hidden data-icon="inline-start" />` and reads "Delete organization". `TriangleAlert` is the established warning glyph here (15 uses against 3 `OctagonAlert`); the `data-icon="inline-start"` form matches the `KeyRound` on "Add a passkey" in the same file.

**PAYG framing, restated not reversed.** The 2026-08-06 entry corrected this flow to say the pay-as-you-go balance is *forfeited* at purge rather than refunded. The new line says the balance is *kept until the deletion completes*, which describes the same grace-period behaviour from the other end. The forfeiture wording still stands in the confirm dialog's consequence bullets.

**Left on account language on purpose** — the ask was scoped to the card. The confirm dialog still titles "Delete account and data?", its action reads "Delete account and data", cancel reads "Keep account", and the toast reads "Account deletion scheduled".
