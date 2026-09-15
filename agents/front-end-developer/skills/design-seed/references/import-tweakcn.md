# Importing tweakcn / shadcn theme generator output

Turn brand decisions into `decided` tokens in an existing seeded `design.md`. Use this when the team has:

- A **tweakcn URL** (e.g. `tweakcn.com/editor/theme?primary=...`) — tool at https://tweakcn.com/
- A **shadcn theme generator export** (https://ui.shadcn.com/themes) — usually a copy-pasted CSS block
- A **hand-authored OKLCH block** from a designer

All three land in the same place: the `:root` + `.dark` CSS blocks in `app/globals.css` — and the same tokens live in design.md's §2 Color Palette. Import is just a flip: `seeded` → `decided`.

## Input formats

### tweakcn / shadcn theme generator CSS block

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.606 0.25 292.717);     /* <-- team's chosen primary */
  --primary-foreground: oklch(0.969 0.016 293.756);
  --secondary: oklch(0.97 0 0);
  ...
  --radius: 0.5rem;                         /* <-- team's chosen radius */
}

.dark {
  --background: oklch(0.145 0 0);
  --primary: oklch(0.541 0.281 293.009);
  ...
}
```

Each line maps 1:1 to a row in design.md's §2 core-tokens table. The `--radius` line maps to §5 Border Radius Scale.

### Hand-authored OKLCH (or hex) from a designer

Usually a shorter list:

```
Primary: #7C3AED  (oklch(0.606 0.25 292.717))
Primary-foreground: white
Accent: #F59E0B
Radius: 6 px
```

Same outcome — flip the matching seeded rows.

## Import protocol

### 1. Read the existing design.md

Find the stack line in the header + the §2 Color tables. Confirm the file is seeded (every row tagged `seeded`). If the file has already been partly customized (some `decided` rows), proceed carefully — don't overwrite decided rows without explicit confirmation.

### 2. Parse the input

For CSS blocks: extract every `--<token>: <value>;` line under `:root` and `.dark`. Match token names against the §2 Core / Chart / Sidebar tables.

For hand-authored blocks: ask the user for a token-by-token mapping if ambiguous ("does `#F59E0B` go to `--accent` or `--secondary`?").

### 3. Flip the matching rows

For each imported token:

1. Replace the value in the Light / Dark column with the imported value.
2. Change the confidence tag on that row from `← seeded: shadcn/ui new-york default` to `← decided: imported from <source>, <date>`.
3. If the imported value equals the seeded default (no change from shadcn), still flip to `decided` — the team has explicitly chosen to keep the default.

Example before:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | primary CTA fill ← `seeded` |

Example after:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--primary` | `oklch(0.606 0.25 292.717)` | `oklch(0.541 0.281 293.009)` | primary CTA fill ← `decided: tweakcn export 2026-04-20` |

### 4. Flip the radius stance (if changed)

If `--radius` shifted, update §5 Border Radius Scale. The sm/md/lg/xl derivatives recompute automatically via Tailwind v4's `calc(var(--radius) ± Npx)` pattern, so the token table values stay, but the confidence tag on the `--radius: 0.Nrem` line flips to `decided`.

### 5. Update the Open Questions

Strike through (or remove) the answered items:

- ~~1. Primary hue~~ — decided `oklch(0.606 0.25 292.717)` via tweakcn on 2026-04-20
- ~~4. Radius stance~~ — decided 0.5rem (sharper than default)

Leave unresolved items in place.

### 6. Update the header confidence summary

```
**Confidence summary:** 3 decided · 27 seeded · 10 `[needs user confirmation]`
```

Recount after each import.

### 7. Regenerate `globals.css` (separate generator — out of scope for this protocol)

Once design.md is updated, a generator reads §2 + §5 + §6 + motion defaults and emits `app/globals.css` via `@theme inline`. The team commits both files together:

```
git commit -m "brand: import primary + radius from tweakcn — flip 5 seeded tokens to decided"
```

## Partial imports

Brand briefs rarely cover every token. A typical first-round import might hit:

- primary + primary-foreground
- maybe accent + accent-foreground
- radius
- font family (if the brand specifies one beyond Geist)

That leaves 20+ tokens still `seeded`. That's fine. Only flip what the team has actually decided. Leave everything else as scaffold.

## Multiple imports over time

Each import is additive. Second-round import might bring success / warning / info semantic colors (which shadcn doesn't ship). Add them as new rows in §2 Semantic / Status with `decided` tags:

```
| `--success` | `oklch(0.62 0.17 148)` | `oklch(0.67 0.18 148)` | success text/icon ← decided: brand brief 2026-05-12 |
| `--warning` | `oklch(0.72 0.18 75)` | ... |
```

Don't retrofit these into the shadcn default seed — they weren't there. The team extended the system.

## Stop conditions

- User pastes a format that doesn't match any known input (not CSS, not OKLCH, not hex) → ask for clarification.
- Imported token name doesn't exist in design.md (e.g. `--brand-accent-2`) → append a new row in §2 with `decided` and note it extends the shadcn default palette.
- Two imports conflict (tweakcn + a later hand-authored override on the same token) → **the later one wins**, but log the prior value in the Drift section as "was X on <date>, overridden to Y" so history is recoverable.

## Relationship to `design-seed`

- `design-seed` produces the initial seeded design.md.
- This protocol (import) flips seeded rows to decided as brand lands.
- `design-extractor` in browser-live-MCP mode verifies shipped code against the decided tokens and flags drift.

All three compose around the same design.md file. No side channels, no separate theme.json.
