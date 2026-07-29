# UI Changelog: 2026-06-19

Running log of UI changes for 06-19. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-18.md`](./changelog-6-18.md).

---

## Conventions

### Press affordance standardized to `active:scale-[0.98]` site-wide `3eeb8b1`

Finished the 2026-06-18 standardization by flipping the remaining
`active:scale-[0.99]` stragglers to `0.98`: the `<Button>` primitive
(`button.tsx`), `AuditRecordDialogMerkle` (4x), and the `icon-action-button`
doc comment. Most surfaces were already on `0.98`. The trigger gate
(`not-aria-[haspopup]` on the primitive, `enabled:` elsewhere) and the
`motion-reduce:active:scale-100` pairing are unchanged. `design.md` now records
`0.98` as the truth.

### `design.md` consolidated to one canonical doc `3eeb8b1`

Folded the v2 experiment back into `design.md`: uniform one-role-per-step color
ladder (intent, not lightness), Motion and Voice & Content promoted to canonical
sections, a stated typography default, and dropped the working-notes tail
(Drift / Open Questions / States). Restored the Sources page inventory and the
Validation & Export footer. Single source of truth — no parallel v2 file.

---

## Components

### Audit trail: Export view button uses the animated export icon `3eeb8b1`

The page-header **Export view** button swapped the static lucide `Download`
glyph for the animated `UploadIcon` (`@/components/ui/upload`) with
`aria-hidden data-icon="inline-start" size={16}`, matching the Export CSV
buttons on Requests / Activity / Security. It now animates on button-hover via
the host-hover retrofit. Removed the unused `Download` import.

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
