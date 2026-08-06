# UI Changelog: 2026-08-06

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-5.md`](./changelog-8-5.md)

---

## Sections

### Account-management copy aligned to the AG-508 PRD `0656f0c`

**`pages/cancel-plan-dialog.tsx`** · **`pages/Settings.tsx`**

The cancel and delete flows carried one factual error and some verbosity; the PRD (AG-508) is now the source for their copy.

- **Correction — PAYG is forfeited, not refunded.** The delete flow said "your prepaid balance is refunded to the card on file"; the PRD is explicit that any remaining pay-as-you-go balance is **forfeited when the purge runs**, and that reversing during grace preserves the full balance. Fixed in both the Delete card subtext and the dialog's consequence bullet.
- **Delete dialog, tighter + fuller.** Intro now names the immediate suspend (keys stop working, no traffic passes) and the UI/email reversal path. The four consequence bullets trimmed to ~one line each while keeping purge scope (prompts, conversations, keys, provider accounts), forfeiture + no unused-day refund, retained fingerprinted Digital Evidence proofs + billing records, and the sole-owner org-teardown notice.
- **Cancel dialog.** Intro adds that renewal can be reactivated before the period ends; consequence bullet notes pruned data is not restored on a later upgrade. The billing period-end date takes the `type-label-14` voice + `text-foreground` so it stands out from the muted intro.

---
