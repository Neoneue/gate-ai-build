# Skill — Theme Swap

> Swap the shadcn theme preset applied to the project. Handles the full workflow: run shadcn init, restore project customizations, regenerate theme documentation, and produce a Figma sync checklist.

## When to Use

- User provides a new shadcn preset ID (e.g. "swap to preset `abc123`")
- User wants to reset to globals defaults (no theme override)
- User says "change theme", "apply preset", "update branding"
- After finding a theme at `ui.shadcn.com/create`

## Prerequisites

- Host paths resolved (ask user if unclear):
  - **`system.md`** — primary contract (**Theme** + **Project** sections)
  - Optional long **`globals.md`** appendix (parallel to `app/globals.css`; deep token/Figma reference). Layer 1 defaults also ship in **`front-end-developer/contract/globals.md`**.
  - **`theme-manifest.json`** — machine-readable theme (regenerated on swap)
- A Next.js project with `components.json` and `globals.css`
- `pnpm` available (or the project's package manager)

## Input

The user provides ONE of:
- A shadcn preset ID (e.g. `b1ZOMFgwd`)
- A shadcn create URL (e.g. `ui.shadcn.com/create?preset=abc123` — extract the ID)
- "reset to defaults" (apply no preset — pure shadcn neutral / globals layer only)

## Workflow

### Step 1 — Read Current State

1. Read **host `theme-manifest.json`** to understand:
   - Current preset ID
   - Current `component_patches` (customizations to restore)
   - Current `overrides_from_arca` (for diffing later)
2. Read `globals.css` to snapshot current token values
3. Note which `components/ui/*.tsx` files exist

### Step 2 — Run shadcn init

```bash
# In the Next.js app directory (where components.json lives):
yes | pnpm dlx shadcn@latest init --preset <NEW_PRESET_ID> --template next
```

If resetting to defaults (no preset), omit `--preset`.

This will:
- Update `components.json` with new style/menu settings
- Update `globals.css` with new token values
- Overwrite `components/ui/*.tsx` files with new component classes
- Install any new dependencies

### Step 3 — Apply Component Patches

Iterate `component_patches` from the manifest. For each patch:

1. Read the target file
2. Find the `selector` location (e.g. "DialogContent className string")
3. Add the `add_class` value after the `after` anchor
4. Verify the edit took effect

Example: restoring `tracking-[-0.02em]` on DialogContent after `text-sm`.

If a patch cannot be applied (file structure changed), report it to the user rather than guessing.

### Step 4 — Diff the New Theme

1. Read the updated `globals.css`
2. Read the updated `components.json` for style, menuColor, menuAccent
3. Compare each token value against the defaults in `globals.md`:
   - Tokens that differ = theme overrides
   - Tokens that match = inherited from the globals layer (don't list)
4. Read each updated `components/ui/*.tsx` and compare key classes against the default component variants in `globals.md`:
   - Different radius → note it
   - Different destructive pattern → note it
   - Different shadow/ring pattern → note it
   - Different hover opacity → note it

### Step 5 — Rewrite the Theme section in system.md

Replace the **`## Theme`** section in **host `system.md`** (leave **`## Project`** unchanged) with:

1. **Identity** — new preset name/ID, style, base color, menu settings, install command
2. **Visual language** — describe the new theme's character based on the token diff and component changes
3. **Token override table** — only tokens that differ from globals defaults
4. **CSS token values** — the actual OKLCH/hex from globals.css for overridden tokens
5. **Component pattern diff** — for each component, what changed from defaults
6. **Radius assignments** — which components use which radius in this theme
7. **Depth & elevation** — how this theme handles card/dialog/dropdown surfaces

### Step 6 — Update theme-manifest.json

Write a new manifest with:
- New `preset_id`, `style`, `base_color`, `menu_color`, `menu_accent`
- New `install_command`
- New `fonts` (read from globals.css `--font-sans` / `--font-mono` variable mappings)
- New `overrides_from_arca` (each token: arca_default, theme_value, description)
- New `component_class_changes` summary
- **Preserved** `component_patches` (carried over from previous manifest)
- Preserved `figma_file_key`

### Step 7 — Verify

1. Run `pnpm run typecheck` — must pass clean
2. Run `pnpm run build` — must succeed
3. If dev server is running, take screenshots at:
   - Desktop width (1440px)
   - Mobile width (375px)
   - Open a dialog to verify component styling
4. Report any visual issues

### Step 8 — Figma Sync Checklist

Compare old `overrides_from_arca` (from Step 1) with new `overrides_from_arca` (from Step 6):

For each token that CHANGED between old and new theme:
- List the Figma Theme-collection variable name
- List the old value and new value
- Note whether it's a color, radius, or font change

For each token that was REMOVED (existed in old, not in new):
- Flag it as "reset to globals default" — the Figma variable should revert to the base value

For each token that was ADDED (not in old, exists in new):
- Flag it as "new override" — needs a Figma variable update

Mode collection aliases (`base/*`) do NOT change — they always point to Theme, which gets new values. Component instances auto-update because they bind to variables.

Output this as a checklist the user can follow or the agent can execute via `use_figma`.

### Step 9 — Report

Summarize to the user:
- Old theme → New theme
- Number of token overrides changed
- Component class changes (what looks different)
- Build status (pass/fail)
- Figma sync items count
- Any patches that couldn't be applied

## Adding New Component Patches

When the user makes a project-level customization to a component file that would be overwritten by `shadcn init`:

1. Add an entry to `theme-manifest.json` → `component_patches`
2. Each patch needs: `file`, `description`, `selector`, `add_class`, `after`
3. The patch is now preserved across all future theme swaps

## Resetting to globals defaults

If the user wants no theme (pure shadcn neutral):

1. Run `shadcn init` without `--preset`
2. Set `preset_id` to `null` in the manifest
3. The override table in the **Theme** section of `system.md` will be empty
4. All component classes revert to shadcn defaults documented in `globals.md`
5. Component patches still apply (they're project-level, not theme-level)

## Edge Cases

- **Preset changes component API** (new props, renamed exports): compare the component's export list before and after. Report breaking changes to the user.
- **New components added by preset**: add them to the **Theme** section in `system.md` (component patterns).
- **Patch target moved**: if a patch's `after` anchor no longer exists in the file, report it. Don't guess.
- **globals.css has project additions**: shadcn init only touches the token sections. Any custom CSS the project added should survive. Verify after init.
