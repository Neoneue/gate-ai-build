# Screenshot mode extraction protocol

**Primary mode for logged-in dashboards, internal tools, and auth-walled apps.**

Use when the user shares a screenshot (image attachment) or points you at an open page you cannot fetch.

## 1. Read the image

Use the `Read` tool on the screenshot path. Multimodal vision extracts what's visible. Always ask for — or infer — the capture viewport width (1440 desktop, 1280 laptop, 768 tablet, 375 mobile). This anchors every pixel measurement that follows.

## 2. Inventory what's visible

Before extracting tokens, write a plain list of what the screenshot contains. This prevents jumping into tokens and missing structure.

- **Background** — single color / gradient / image / illustration / video
- **Surfaces** — cards, panels, sheets; how many layers of depth
- **Typography** — roughly: display, heading, body, caption, button, label
- **Primary controls** — buttons, tabs, chips, toggles
- **Form controls** — inputs, selects, checkboxes, radios
- **Data surfaces** — tables, lists, card grids, charts
- **Navigation** — sidebar, top bar, breadcrumbs, footer nav
- **Status / feedback** — badges, toasts, alerts, banners
- **Icons** — library fingerprint (Lucide / Phosphor / Heroicons / Material / custom)

## 3. Sample tokens

### Colors

For each distinct color, estimate the hex and tag confidence:

- `observed` — distinctly visible; confident within 1–2 hex digits
- `inferred` — estimated from pattern ("hue matches Tailwind violet-600")
- `asked-user` — user confirmed via DevTools paste or explicit statement

When in doubt, give a range: `#8674FB — #7C3AED (range) ← observed, primary CTA button`.

### Typography

Measure text heights against the screenshot's known viewport width:

- Desktop capture at 1440px rendered at 50% zoom → 1 image pixel ≈ 2 real pixels
- Body text that looks ~8px tall on-screen → real height ~16px → likely `font-size: 16px`
- Identify font family by letterform:
  - Geometric + open terminals → Inter / Geist / SF Pro
  - Humanist with slight curvature → Segoe UI / Helvetica Neue
  - Workhorse → Roboto / Arial
  - Mono → JetBrains Mono / Geist Mono / SF Mono

Tag every size estimate: `16px ← inferred from measured height against 1440px viewport`.

### Spacing

Identify the base grid by looking at repeated gaps: is the rhythm 4pt, 5pt, or 8pt? Multiples should stay consistent across the image. Common scales:

- **4pt**: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80
- **8pt**: 8 / 16 / 24 / 32 / 40 / 48 / 64 (less granular)
- **5pt**: 5 / 10 / 15 / 20 / 25 (rare, often custom)

### Radii

Measure corner rounding on buttons, cards, inputs. Common scales: `0 / 2 / 4 / 6 / 8 / 10 / 12 / 16 / 9999 (pill)`. Round to the nearest scale step; don't invent 7px.

### Shadows

Hard to measure precisely from an image. Describe in tiers:

- **None** — no shadow at all
- **Faint** — `0 1px 2px rgba(0,0,0,0.05)` (flat-adjacent; borders do most of the structural work)
- **Medium** — `0 4px 12px rgba(0,0,0,0.10)` (popovers)
- **Deep** — `0 8px 24px rgba(0,0,0,0.15)+` (modals, top-layer)

Always tag shadow estimates as `inferred` unless the user pastes them.

## 4. Framework detection

Visual tells tell you which library is underneath. See [framework-fingerprints.md](framework-fingerprints.md). If you recognize shadcn / Radix / MUI / Ant / Chakra / Mantine / Bootstrap, you can pre-fill defaults and only note deviations.

If you see a distinctive purple at roughly `#7C3AED` and rounded-8 buttons → likely shadcn or Tailwind default. If you see `#1677FF` and square-ish buttons → Ant v5. If you see layered glossy shadows with Roboto → MUI.

## 5. Escalate to DevTools paste

When the user wants precise values, ask:

> "For the primary button's exact background, hover, and shadow values, open Chrome DevTools, inspect a Sign In button, and paste the Computed panel here. I'll swap the inferred values for exact ones."

Same for typography, inputs, cards. **One paste per component is enough for high fidelity** on that component.

Ideal components to request DevTools paste for (ranked by impact):

1. Primary button (drives color, radius, elevation, typography)
2. Text input in default + focus state
3. Body heading and body text (anchors typography)
4. Card / container wrapper (drives surface token, radius, elevation)
5. A navigation active state

## 6. Multi-screenshot workflow

One screenshot = partial design system. Ask for:

1. **Landing / home** — brand marks, primary CTAs, heading scale
2. **Data-dense view** — row heights, column spacing, truncation patterns
3. **Form / modal** — input states, overlay elevation, validation
4. **Empty state** — tone, illustration language, low-density type
5. **Dark mode** if offered — surface tokens and contrast
6. **Mobile viewport** if the design claims responsive support — collapsing strategy, touch targets

If the user provides only one, extract what's visible and list what's missing as TBD sections at the top of the design.md.

## 7. Citation format

- `#8674FB ← observed: primary CTA on landing screenshot`
- `~16px ← inferred: button padding measured against known 1440px viewport`
- `rgba(0,0,0,0.05) ← inferred: faint card shadow; confirm via DevTools paste`
- `Inter 500 16/16 ← asked-user: DevTools paste of .btn-primary`

## 8. Common mistakes to avoid

- **Don't invent exact hex values** from a screenshot. Give a range or tag `inferred`.
- **Don't assume Tailwind defaults** just because a site uses purple — check hue against Tailwind's violet-500 (`#8B5CF6`) vs purple-600 (`#9333EA`) vs custom brand shades.
- **Don't guess responsive breakpoints** from one viewport capture. Say "responsive behavior not observed — needs additional screenshots or DevTools paste".
- **Don't pad thin evidence.** TBD is honest; fabricated tokens poison downstream agents.
- **Don't measure against a cropped screenshot** without asking what the full viewport width was. An 800px-wide image could be a cropped desktop or a full tablet — the math differs.
- **Don't over-promise precision.** A screenshot can get you within 1–2 hex digits and within 1 radius step — that's useful, but tell the user that's the floor.
