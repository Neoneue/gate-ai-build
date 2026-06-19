# UI Changelog: 2026-06-19

Running log of UI changes for 06-19. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-18.md`](./changelog-6-18.md).

---

## Components

### Audit trail: drop synthetic delta from Events logged KPI `3ffb14a`

`src/pages/AuditTrail.tsx`. The "Events logged" KPI tile carried a hardcoded
`delta="+12.4%"` / `deltaNote="All time"` with no backing entity data. Removed
both props; the tile now renders only the eyebrow + value (no delta row).

### Audit record modal: single details card, tabs removed `e98cfde`

`src/pages/AuditRecordDialog.tsx` (the drill-in modal on Audit trail, also used
by Requests).

- Removed the **Event / Merkle path / How it works** tab strip. The body now
  renders the Event `DetailList` directly. Deleted the dead `MerklePathPanel`,
  `HowItWorksPanel`, `NumberChip`, `HOW_STEPS`, `TREE_DEPTH`, and the unused
  `Tabs`/`BookOpen`/`fmtRelative` imports.
- Banner sentence ("This event is fingerprinted to Constellation's Digital
  Evidence layer.") `text-sm` (14/20) → `text-base/6` (16/24).
- Removed the `Fingerprinted · <hash> · <ago>` footer line beneath the banner.
- Moved the **Verified by Digital Evidence** seal out of the title row to sit
  directly below the banner copy (left-aligned, 8px below).
- Footer CTA `Open DE Explorer` → `Open Explorer`.
- Summary-band → details-card gap 32px → 24px (`DialogScrollBody` `pt-8` →
  `pt-6`).

`AuditRecordDialogMerkle.tsx` (the `/audit-trail-merkle` variant) is untouched.
