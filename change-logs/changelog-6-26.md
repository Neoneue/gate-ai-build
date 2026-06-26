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

### One-h1-per-page rule codified `6cc819d`

**`design.md`**

- Added an explicit typography rule: exactly one `<h1>` per page (the `<PageTitle>`), section titles `<h2>` (`SectionTitle`), card/modal-body titles `<h3>`, no level skips, and chrome never emits a competing `<h1>`. Element level and visual size are independent (the `type-heading-*` voice sets the look, the tag sets the outline).
- Corrected the `PageTitle` primitive description: it renders `<h1>` by default (the page's sole h1), not `<h2>` as the doc previously claimed. Verified against the live `/overview` outline (one h1 = "Overview", h2 section titles, h3 card titles).
- Fixed the `SectionTitle` recipe note from "20/28, no tracking" → "20/28, tracking-snug" after the heading-tier `tracking-snug` restore.

### Standalone `design-system.html` reference page `c4f08f0`

**`design-system.html` (new, repo root), `biome.jsonc`**

- Added a self-contained design-system specimen page. No React, no Tailwind build, no routing — tokens are inlined verbatim from `src/index.css` so it renders by opening the file directly.
- Sections: Color (five OKLCH ramps — the four chromatic ramps carry the `-25` floor step, neutral is 11-step — plus semantic, chart, syntax and traffic-light tokens), Typography (every `type-*` voice with live specimens), Heading outline (the one-h1 rule), Radius, Spacing, Elevation, Motion (easing-curve plots + animated demos + the duration/pattern table), and Components (buttons / badges / input / nested-radius card).
- Sticky left nav with grouped links and `IntersectionObserver` scrollspy; smooth-scroll anchors; rail collapses below 720px.
- Excluded the artifact from Biome (mirroring the `src/index.css` precedent in `biome.jsonc`) since its inlined CSS and static buttons aren't app source; added `type="button"` to the specimen buttons.
