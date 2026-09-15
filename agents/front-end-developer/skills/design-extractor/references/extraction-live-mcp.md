# Live-MCP mode extraction protocol

**Highest-fidelity mode.** Use when a browser-control MCP is connected (e.g. `chrome-devtools-mcp`, Playwright MCP, any server exposing `list_pages` / `evaluate_script` / `take_screenshot`). Produces DevTools-paste-tier evidence automatically, without asking the user to copy anything.

This mode is a direct superset of URL mode (reads the live computed DOM, not just static HTML) and screenshot mode (no pixel inference needed when CSS vars are present). Prefer it whenever available.

## 0. Preflight — confirm the MCP is connected

Call `list_pages` (or the equivalent tool on the MCP). If you get an empty list or an "about:blank" page, the browser is running but idle — ask the user to navigate to the target URL, log in if needed, and confirm when ready. If the tool errors out, the MCP isn't wired up; fall back to `extraction-url.md` or `extraction-screenshot.md`.

Do **not** navigate to authenticated URLs yourself. The user drives navigation + login; you observe.

## 1. Lock the viewport

Before any measurement, fix the viewport to a known desktop size so every pixel value is anchored. Typical:

```
resize_page(width=1440, height=900)
```

1440 × 900 is the sensible default for dashboards; 1280 × 800 for laptop-first products; 1920 × 1080 if the product explicitly targets 2xl. Record the chosen viewport at the top of `design.md` — every downstream measurement implicitly cites it.

## 2. Capture visual reference

```
take_screenshot(fullPage=true, filePath="<product>/_scratch/<view>-<vw>.png")
take_snapshot()                      # DOM accessibility tree, for structure
```

Save screenshots into a `_scratch/` subfolder inside the product folder — they're evidence, not deliverables. `take_snapshot` gives you element `uid`s and the a11y tree; use it to locate elements you want to measure without guessing CSS selectors.

**DPR gotcha:** some MCPs return clipped full-page screenshots on Retina (DPR=2) displays. If the capture looks clipped on the right, ask the user for a native OS screenshot as the visual reference and continue using the computed styles (which are unaffected) for token values.

## 3. Pull the full `:root` CSS variable catalog — one call

This is the magic of live-MCP mode. In a single `evaluate_script`, dump every CSS custom property defined on the root:

```js
() => {
  const cs = getComputedStyle(document.documentElement);
  const vars = {};
  for (let i = 0; i < cs.length; i++) {
    const p = cs[i];
    if (p.startsWith('--')) vars[p] = cs.getPropertyValue(p).trim();
  }
  return vars;
}
```

Expect 100–500+ variables on any mature design system. This one call populates:

- §2 Colors (every brand / neutral / semantic / additional variant) + YAML `colors` block
- §3 Typography (font families, size scale, weight scale, line-heights, letter-spacing) + YAML `typography` block
- §4 Layout (spacing scale, container widths, sidebar/navbar heights) + YAML `spacing` block
- §5 Elevation (any `--shadow-*` or `--tw-shadow` tokens if the system defines them)
- §6 Shapes (radius scale) + YAML `rounded` block

Every value cites the CSS variable name — no inference.

## 4. Pull computed styles on representative components

One `evaluate_script` call, a helper function, and a list of target elements. Template:

```js
() => {
  const pick = (el, extra = []) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const base = {
      tag: el.tagName.toLowerCase(),
      classes: typeof el.className === 'string' ? el.className : '',
      text: (el.textContent || '').trim().slice(0, 80),
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
      color: cs.color, backgroundColor: cs.backgroundColor,
      border: cs.border, borderRadius: cs.borderRadius,
      padding: cs.padding, margin: cs.margin,
      boxShadow: cs.boxShadow, gap: cs.gap, display: cs.display,
    };
    for (const p of extra) base[p] = cs[p];
    return base;
  };
  return {
    h1: pick([...document.querySelectorAll('h1,h2,h3')].find(e => /* ... */)),
    primaryCta: pick([...document.querySelectorAll('button')].find(e => /* ... */)),
    input: pick(document.querySelector('input[type="search"], input[type="text"]')),
    tableTh: pick(document.querySelector('th')),
    tableTd: pick(document.querySelector('td')),
    tableRow: pick(document.querySelector('tbody tr'), ['borderBottom']),
    navActive: pick(document.querySelector('[aria-current]')),
    // ... one entry per canonical component visible on this view
  };
}
```

**Target list — cover these if present in the view:**

1. H1 / page title
2. Subtitle / page description
3. Primary CTA (commit button) — the dominant filled button
4. Secondary button — bordered / ghost / transparent
5. Icon-only button (two sizes if present — small and medium)
6. Text input (default; if possible also focus by dispatching `focus()` via `evaluate_script`)
7. Table `th`, `td`, `tr` — including `borderBottom` in the `extra` array
8. In-row link / entity reference (often a different color than body)
9. Nav item — active and inactive (two picks)
10. Tab — active and inactive (two picks)
11. Any visible chip / badge / pill
12. Pagination button (enabled + disabled + current-page — three picks)
13. Page container / main wrapper (for max-width, flex direction, responsive classes)

One round-trip returns everything you need for §7 Components + the YAML `components` block.

## 5. Multi-state coverage — navigate and re-run

The single greatest advantage of live-MCP over screenshot mode: you can *ask for state changes and observe them*. Work with the user:

| State | How to reach it | What it unlocks |
|---|---|---|
| Modal / dialog | Click the primary CTA; the user confirms | §6 L4 elevation, dialog tokens |
| Popover / menu | Click a kebab / sort / dropdown | §6 L3 elevation |
| Form validation | Submit an empty form or bad value | Input error + helper-text tokens |
| Empty state | Navigate to a filtered view with no results | Empty-state tone, illustration language |
| Dark mode | If a toggle exists, flip it and re-run §3 | Full parallel token catalog under `.dark` |
| Mobile | `resize_page(width=375, height=812)` | Collapsing strategy, touch targets, drawer nav |
| Hover / focus | `evaluate_script` with `.dispatchEvent(new Event('mouseenter'))` or `.focus()` then re-pick | Interaction-state tokens |

After each state change, re-run the component-pick script targeting just the new surfaces. Append to `design.md`; don't overwrite previous evidence.

## 6. Citation format

- `#0E1012 ← computed-live: getComputedStyle(newPolicyBtn).backgroundColor at 1440x900`
- `--radius-sm: 8px ← computed-live: getComputedStyle(document.documentElement).getPropertyValue('--radius-sm')`
- `1.5px solid #3E454D ← computed-live: newPolicyBtn.border + class hover:border-[#26292C]`
- `shadow-sm (0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)) ← computed-live: activeTabChip.boxShadow`

Always capture the **class string alongside the computed value** when possible — the class names (`rounded-sm`, `bg-surface-elevate`, `text-content-secondary`) are the recipe the app codebase actually uses, and they travel downstream better than raw hex.

## 7. Confidence tag

`computed-live` — the new tag for this mode. It outranks `asked-user` because it:

- covers the entire `:root` in one call (not one component per paste)
- is repeatable (re-run the script → same values)
- captures class attribution alongside computed value

Order of trust, strongest first: `computed-live` > `asked-user` > `observed` > `inferred`.

## 8. Where live-MCP mode fails

| Symptom | Diagnosis | Action |
|---|---|---|
| `evaluate_script` returns `null` for an element | Selector didn't match on this view | Re-check via `take_snapshot` uid; the a11y tree may name it differently |
| `:root` has almost no `--*` vars | App uses CSS-in-JS (Emotion / styled-components) with hashed classes, not variables | Pivot to per-component `computed-live` — still accurate, just more picks |
| CSS variables defined but all empty strings | Variables are set at a deeper scope (e.g., `.theme-dark` on a wrapper) | Query at the wrapper: `getComputedStyle(document.querySelector('.theme-dark'))` |
| Modal never appears after click | CSS keeps it in DOM from the start, visibility toggled | Find by selector even before clicking; read regardless |
| Screenshot clips at DPR=2 | MCP bug on Retina | Ask user for OS-native screenshot; keep computed values (unaffected) |
| User hasn't navigated yet | `list_pages` shows `about:blank` | Wait; ask user to navigate + log in; do not navigate auth URLs yourself |

## 9. Stop conditions

- Got `:root` vars + representative component picks for every visible surface → fill the template in one pass.
- Missing a state (modal / form / dark) → ask the user to navigate, then re-run only the affected sections. Flag all still-unreached states as TBD in the document header.
- MCP call fails repeatedly → fall back to `extraction-screenshot.md` + user-provided screenshots; do not keep retrying.

## 10. Efficiency notes

- **One call for `:root`, one call for all components** — two round-trips cover 95% of a dashboard. Avoid per-property round-trips; each one costs a full MCP turn.
- **Stringify small**, not large — `slice(0, 80)` on `textContent` keeps response payloads manageable.
- **Don't screenshot every pick.** One full-page screenshot per captured state is enough; the computed styles carry the precision.
- **Cache the `:root` dump to scratch** — if you need to refer back, read from `<product>/_scratch/` instead of re-querying.
- **Never dispatch destructive user actions** (submit, delete, logout). Only observe, hover, focus, and click navigational elements the user has explicitly authorized.
