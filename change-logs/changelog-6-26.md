# UI Changelog: 2026-06-26

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-25.md`](./changelog-6-25.md)

---

## Conventions

### Heading primitives routed onto `type-heading-*` tokens `f939c3b`

**`src/index.css`, `src/components/ui/{page-title,section-title,card}.tsx`, `design.md`**

- Retired the duplicate `.h1`–`.h5` element-aliases from `index.css`. They were a second hand-assigned heading recipe that had drifted from the semantic `type-heading-*` scale (the `.hN` aliases were missing the `tracking-snug` the scale carried).
- Mapped the primitives onto the scale: `PageTitle` `h1` → `type-heading-32`, `h2` → `type-heading-24`; `SectionTitle` → `type-heading-20`; `CardTitle` → `type-heading-16`. The `type-heading-*` utilities are now the single source of truth for heading voice.
- Tracking: `tracking-snug` (`-0.01em`) on the sans heading tiers `type-heading-16` through `type-heading-24`; the display tier (`type-heading-32`+) keeps the tighter `tracking-tight`; `type-heading-14` stays `tracking-normal`. Confirmed in-browser: SectionTitle 20px → -0.2px, CardTitle 16px → -0.16px, PageTitle 32px → -0.8px.
- Reconciled `design.md` to match the code: Hierarchy intro + table (h2/h3/h4 letter-spacing `normal` → `snug`, notes reference the tokens) and the §975 tracking rule (rewritten to lead with the sans heading tiers).
