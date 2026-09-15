---
name: design-extractor
description: Extract a complete design.md (YAML front matter + Google DESIGN.md canonical sections — Overview, Colors, Typography, Layout, Elevation, Motion, Shapes, Components, Voice & Content, Do's/Don'ts — plus our extensions: Direction, Responsive, Sources) from a public URL or from screenshots of an auth-walled site. Auto-validates via `npx @google/design.md lint` after write and reports lint findings (contrast failures, orphaned tokens) in its summary (not embedded in the doc). Offers Tailwind + DTCG token export. Use when the user says "extract design", "generate design.md", "document this site's tokens", "run the extractor", or points at a page, dashboard, URL, or image for design analysis. Screenshots are the primary input for logged-in dashboards where WebFetch hits a login page.
---

# design-extractor

Turn a live website or screenshot into a production-ready `design.md` documenting the full design system — tokens, components, layout, responsive behavior — using the [Google DESIGN.md format](https://github.com/google-labs-code/design.md) (YAML front matter + canonical section order) plus our authoring extensions (Direction, Responsive, Sources). Output is lint-valid with `npx @google/design.md lint`.

## When to use

Trigger on any of:

- "Extract the design from [URL / figma file / this page / this screenshot]"
- "Generate a design.md for..." → produce `design.md` only
- "Generate a system.md" / "replace the current system.md" / "use the interface-design plugin" → produce `system.md` (write `design.md` first if absent). See [references/contract-systemmd.md](references/contract-systemmd.md).
- "Full extraction" / "extract everything" → write **both** `design.md` first, then distill `system.md` from it
- "Document the design tokens for this site / this kit / this Figma file"
- "Run the design extractor"
- User pastes a `figma.com/design/...`, `figma.com/board/...`, or `figma.com/make/...` URL → Figma live-MCP, skip the "which source?" ask
- User pastes a web URL (non-figma) → Browser live-MCP if connected; URL mode otherwise
- User shares a screenshot and asks for design tokens / component specs → Screenshot mode
- User points at an open browser page and asks you to document what you see → Browser live-MCP
- User references a Figma file or kit without a URL → ask for the Figma URL
- A browser-control MCP is connected and the user says "extract what I'm looking at" → Browser live-MCP

### interface-design plugin fallback

If the user asks to "use the interface-design plugin" and that plugin is **not installed** (check `~/.claude/plugins/installed_plugins.json` or the available-skills list), do **not** pretend it ran. Say so once, then produce an equivalent hand-authored `system.md` using [references/contract-systemmd.md](references/contract-systemmd.md). The hand-authored output composes cleanly with the plugin when it's later installed.

## Input modes

| Mode | Tool | Best for |
|---|---|---|
| **Figma live-MCP** | official Figma MCP (`mcp__plugin_figma_figma__*`) — `get_variable_defs`, `get_design_context`, `get_metadata`, `get_screenshot` | **Design source of truth.** Named tokens, collection modes (light/dark), component-set variants, bound text styles. Preferred when the user has a Figma URL. |
| **Browser live-MCP** | browser-control MCP (`chrome-devtools-mcp`, Playwright MCP, etc.) with `evaluate_script` | **Implementation source of truth.** Auth-walled dashboards, any logged-in app, multi-state capture. Produces DevTools-paste-tier evidence across the full `:root` in one call. Preferred when the user has a web URL. |
| **URL mode** | `WebFetch` | Public sites (landing pages, docs, logged-out marketing) when no browser MCP is connected |
| **Screenshot mode** | multimodal `Read` on an image path | Fallback for auth-walled sites when no browser MCP is connected; mobile captures the user takes themselves |
| **Hybrid** | Figma live-MCP + browser live-MCP | Product has both a Figma kit and a deployed app — cross-reference and flag design↔code drift |
| **DevTools paste** | user-provided | Last-resort precision tool when no browser MCP is available — user manually copies the Computed panel |

**Mode precedence, highest first:** Figma live-MCP ≈ Browser live-MCP > URL > DevTools paste > Screenshot. Figma and browser live-MCP are peer tier-1 modes — pick based on which source the user points at. Always offer to upgrade: if the user is on screenshot mode but a browser or Figma MCP is installed, suggest switching.

Route to the right protocol:

- [references/extraction-figma-mcp.md](references/extraction-figma-mcp.md) — Figma live-MCP mode (primary when given a figma.com URL)
- [references/extraction-live-mcp.md](references/extraction-live-mcp.md) — Browser live-MCP mode (primary when given a web URL of a logged-in app)
- [references/extraction-url.md](references/extraction-url.md) — URL mode
- [references/extraction-screenshot.md](references/extraction-screenshot.md) — screenshot mode (fallback for auth-walled sites)
- [references/stack-dialects.md](references/stack-dialects.md) — **per-stack YAML vocabulary.** Tailwind-shadcn / Tailwind-plain / Material v3 / MUI / Chakra / Apple HIG / CSS-vars-custom / others. Load this before writing YAML — the extracted design.md must use the source stack's native vocabulary 1:1, no translation.
- [references/contract-systemmd.md](references/contract-systemmd.md) — `system.md` template + discipline (contract companion to `design.md`)
- [references/framework-fingerprints.md](references/framework-fingerprints.md) — Tailwind / shadcn / Radix / MUI / Ant / Chakra visual + structural tells
- [template.md](template.md) — empty skeleton to fill for `design.md` (YAML front matter + Google DESIGN.md canonical sections + our authoring extensions)

## Entry flow — ask one question first

When triggered **without** a clear mode signal in the user's request, lead with this exact question:

> "Which source? Paste a **web URL** (I'll use the browser MCP to read computed styles from the live app) or a **Figma URL** (I'll use the Figma MCP to read variables, text styles, and component variants directly from the design file)."

Mode signals that **skip the question** (use them directly):

- `figma.com/design/...`, `figma.com/board/...`, `figma.com/make/...` in the user's message → Figma live-MCP, no ask
- `http(s)://...` to any non-figma domain → Browser live-MCP (if browser MCP is connected) or URL mode (if not)
- A pasted screenshot with no URL → Screenshot mode
- The user says "the page I'm looking at" and `list_pages` returns a non-blank page → Browser live-MCP
- The user says "this Figma file" and a `mcp__plugin_figma_figma__*` tool is available → Figma live-MCP, confirm the file key before querying

Then ask for the URL if still missing:

> "Paste the **web URL** — I'll navigate the browser MCP there."

or

> "Paste the **Figma URL** (the `figma.com/design/...` link with the node selected)."

After the URL lands, route directly to the matching protocol file and run.

## Output contract

Every run produces a single `design.md` file with:

1. **YAML front matter** — machine-readable design tokens per the [Google DESIGN.md schema](https://github.com/google-labs-code/design.md): `colors`, `typography`, `rounded`, `spacing`, `components` with `{path.to.token}` cross-references. `colors.primary` is required (everything else is the product's vocabulary — use the source's actual token names). Every value carries a trailing confidence comment (`# ← figma-live: ...`, `# ← seeded: ...`, etc.) — the linter ignores comments.

2. **Prose body** — Google-canonical sections (fixed order, never skip or reorder; Motion and Voice & Content are part of the canonical format — see Geist / vercel.com/design.md — not extensions) plus our authoring extensions:

| # | Section | Google canonical | Notes |
|---|---|---|---|
| 0 | Direction | our extension | preserved by linter as unknown section |
| 1 | Overview *(also "Brand & Style")* | §1 | prose + key characteristics |
| 2 | Colors | §2 | one-role-per-step ladder (intent, not lightness — never group steps); tokens cite YAML keys |
| 3 | Typography | §3 | font family, hierarchy table keyed to YAML roles, **stated default voice** |
| 4 | Layout *(also "Layout & Spacing")* | §4 | spacing system, grid, whitespace |
| 5 | Elevation & Depth | §5 | elevation/shadow table paired with radius + surfaces |
| — | Motion | canonical | **own section, not folded into Elevation**; easing/duration quick-ref table + one contract paragraph |
| 6 | Shapes | §6 | border radius scale + shape language |
| 7 | Components | §7 | per-component blocks keyed to YAML `components` |
| — | Voice & Content | canonical | microcopy/tone rules: case, actions, terminology, numbers, errors |
| 8 | Do's and Don'ts | §8 | cross-cutting only |
| — | Responsive Behavior | our extension | preserved |
| — | Sources & Composed-page References | our extension | merged — one short table |

**Agent Prompt Guide section is OUT** as of this revision. It was a TL;DR-for-agents recap of §2/§3/§7, but an agent reading the full doc just sees the same facts twice. Putting the same info in two places forces the agent to disambiguate and burns tokens. Drop it; if a Quick Color Reference is genuinely useful for a specific consumer, regenerate via `--format dtcg` and let the consumer index that.

If the source has no evidence for a section (e.g., no modals visible → can't document modal elevation), include the section header with a `— No evidence from source` note and an explicit TBD list of what's needed to fill it. Don't fabricate.

**Validation (auto-run — see workflow §10):** every write is followed by `npx @google/design.md lint <file>`. Errors must be zero. The linter runs **8 rules** — handle each one's findings as follows (findings are reported in the extraction summary, not embedded as doc sections):

| Rule | Severity | Handling |
|---|---|---|
| `broken-ref` | error | Stop and fix; the `{colors.foo}` reference points at a token that doesn't exist |
| `missing-primary` | warning | Fix the YAML (`colors.primary` is required by the spec) |
| `contrast-ratio` | warning | Report in summary (accessibility triage; note the actual ratio and the WCAG floor) |
| `orphaned-tokens` | warning | Report in summary (token declared in YAML but never referenced by any component — either wire it or drop) |
| `missing-typography` | warning | Add a `typography` block (colors-only systems warned) |
| `section-order` | warning | Reorder to canonical (Overview → Colors → Typography → Layout → Elevation & Depth → Motion → Shapes → Components → Voice & Content → Do's and Don'ts); our extension sections stay after |
| `missing-sections` | info | `spacing` or `rounded` block is absent while colors exist; declare deliberately or accept the info |
| `token-summary` | info | Counts tokens per block; informational only |

**Export (optional — see workflow §11):** `npx @google/design.md export --format tailwind <file>` emits a **Tailwind-v3-shape JSON** (`{theme: {extend: {colors, fontFamily, fontSize, borderRadius, spacing}}}`) — not a `.js` module, and not a Tailwind v4 `@theme` CSS block. Devs hand-wrap it to make it runnable: for v3, `module.exports = <JSON>` in a `tailwind.config.js`; for v4, translate each primitive into `@theme inline { --color-<name>: …; --font-sans: …; --radius: …; --spacing-<n>: …; }` inside `globals.css`. **The Tailwind export drops `components` tokens entirely** — if the team's downstream pipeline depends on component tokens (Style Dictionary, Tokens Studio, Figma variables import), use `--format dtcg` instead. DTCG preserves every `components.*` entry with `{path.to.token}` references intact.

**Spec as injectable agent context:** `npx @google/design.md spec` prints the full DESIGN.md spec as markdown. Flags: `--rules` appends the active lint-rule table; `--rulesOnly` emits **only** the rule table; `--format json` switches to JSON. Useful to brief a fresh agent on the contract before authoring.

**Drift detection across re-extractions:** `npx @google/design.md diff <before>.md <after>.md` emits a JSON diff with per-section token adds / removes / modifications plus a regression flag (true when the new file has more errors or warnings than the old). See workflow §12.

> If Google's repo is vendored at `google-design.md/` (see repo root), substitute `cd google-design.md && bun packages/cli/src/index.ts <cmd>` — same behavior, no npm download. **Don't use `bun run cli <cmd>`** when redirecting output to a file: `bun run` echoes the resolved script command to stdout, which corrupts redirected JSON (the first line ends up being `$ bun run packages/cli/src/index.ts ...` instead of `{`). Invoking the entry file directly (`bun packages/cli/src/index.ts ...`) skips the echo and is safe for `> file.json` redirects.

## Concision discipline

**Target: ≤750 lines for the entire `design.md`.** Hard ceiling 1000.

This came from on-the-job tuning (2026-05-09): an early extraction landed at 1240 lines, was trimmed to 996 (≤1000 ceiling), then again to 747 — and the 747-line version is *more useful* to a consuming agent than the 996. The verbose version's extra ~250 lines were atmospheric prose, recap sections, per-line YAML citations, and YAML variant blocks that an agent simply doesn't read.

### What to cut, in priority order

The cuts below go from "always cut" to "cut with a flag." Each one was validated against an LLM agent's actual read pattern (tokens → component contracts → prohibitions → composition recipes).

**Always cut (no signal loss):**

1. **Agent Prompt Guide section** — pure recap of §2 colors + §3 typography + §7 components in slightly different words. Drop entirely.
2. **§0 Who/Verb/Feel** — atmospheric framing. Compress to one sentence (`**Who:** X. **Verb:** Y. **Feel:** Z.`). The Defaults Rejected list does the durable work.
3. **§1 Overview** — one paragraph + one key-characteristics line. Don't write 3 mood-board paragraphs.
4. **§4 Whitespace Philosophy / §6 Shape Language / §3 Principles paragraphs** — already in the adjacent tables (spacing roles, radius uses, voice taxonomy). Drop or fold into the table preamble.
5. **§2 Colors preamble** — the YAML comments already say "src/index.css is source of truth." One sentence is enough.
6. **YAML block-header comments** (`# ─── Buttons ──`) — agent ignores them. Strip.
7. **Per-line `# ← code-direct: file.tsx:LINE` citations** — the YAML header already explains the citation scheme. Per-line provenance is dead weight. Keep only meaningful trailing notes (e.g. `# brand mark ≈#1F2FCE`, `# 12px LOCKED`).
8. **`(decided)` / `(codified 2026-05-07)` / date-stamp parentheticals** — the rule itself is what matters; date-stamps don't help the agent.
9. **Vendor brand colors table** → one inline-bulleted line. Same data, no row chrome.
10. **Sources & Extraction Log table + Composed-page References table** → merged into one short table. Per-section provenance is implicit from inline citations.
11. **Combined Elevation table** — fold the prior shadow-table-then-material-table pattern into one table with columns: Tier · Token · Composition · Radius · Surfaces.

**Cut with a flag (state risk to user):**

13. **Variant-only YAML blocks** (`button-default-hover`, `input-focused`, `input-disabled`, `dialog-overlay`, `tabs-trigger-active`, per-tone `status-dot-*`, `switch-checked/unchecked`, `delta-tag-positive/negative`, `card-footer`, `table-row/table-row-hover`, `hero-numeric-lg`) — collapse into flow-style one-liners OR fold into the parent's trailing comment. **Risk:** agent loses dedicated state contracts; mitigation = §7 prose carries the state class strings. **Gate:** only safe when no `{components.X-variant}` reference exists in the prose.
14. **§7 prose-to-bullet compression** — the verbose form has sub-headings + 5-bullet specs + Rule/Don't pairs per primitive. Compress to one bullet per primitive: `**[Component]** (`file.tsx`) — [class string]. [size variants]. [state behaviors].`. **Risk:** loses some state-specific class strings; verify by spot-checking that the bullet still has the focus + disabled + invalid recipes inline.
15. **`(rationale prose)` after rules** — the §8 Do/Don't catches the rule itself. Removing the why-prose makes the agent more likely to "improve" a deliberate decision (e.g. symmetrize `SelectTrigger` padding). Keep one short why-line per genuinely counter-intuitive rule; cut it for self-explanatory ones.
16. **`Uses` columns on radius / spacing tables** — the Uses column tells which token is the canonical default for which surface. **Risk:** agent picks `rounded-md` when `rounded-sm` is the convention. Mitigation: bold the dominant row + add a one-line Rule below the table.

### What's never cut

- **YAML token block** — every color, type, spacing, radius, and component value with its `{path.to.token}` references. This IS the contract. Compressing further breaks the agent's ability to bind to specific tokens.
- **§8 Do's and Don'ts** — cross-cutting prohibitions. Each one prevents a class of agent mistake.
- **Class strings inside §7 component bullets** — `bg-ink-50 border-ink-200 rounded-sm h-9` is what the agent will paste verbatim.
- **Locked-decision callouts** (three-tier table ink, DeltaTag inversion rules, link affordance, Badge mono default, etc.). These are the durable signal.

### Process

After the first-pass write, run `wc -l design.md`. If over 750:

1. Apply cuts 1–12 in order. After each, re-check.
2. If still over 750 after 1–12, apply cut 13 (low risk).
3. If still over after 13, apply 14 with prose-by-prose verification.
4. Apply 15–16 only with explicit user confirmation — flag each one as a risk-bearing cut.

If the user requests a softer ceiling (e.g. 850), stop after cut 12 and skip the risk-bearing tier.

The aim is not minimal prose; the aim is high signal-per-line for an agent rebuilding from this contract. A doc that's 750 lines of binding facts beats a doc that's 1500 lines of binding facts plus mood-board context.

## Anti-hallucination contract

**Every token must cite its source.** No exceptions.

Citation formats:

- Figma live-MCP: `#0E1012 ← figma-live: fileKey=abc123, Primitives/color/neutral/950, mode=Light` or `font-family: "Inter" ← figma-live: textStyle=heading/h1, node=5:12`
- Browser live-MCP: `#0E1012 ← computed-live: getComputedStyle(newPolicyBtn).backgroundColor at 1440x900` or `--radius-sm: 8px ← computed-live: :root var via evaluate_script`
- URL mode: `#8674FB ← globals.css:42 --primary` or `10px ← .auth-card { border-radius } in styles.css:1089`
- Screenshot mode: `#8674FB ← observed: primary CTA button on landing screenshot` or `~16px ← inferred: button padding, measured against 1440px viewport`
- User-paste mode: `#8674FB ← asked-user: DevTools paste of .btn-primary computed background-color`

Confidence tags — strongest first (shared with the `design-seed` skill):

- `figma-live` — pulled from the design source via Figma MCP. Token **names** preserved, collection modes (light/dark) captured, component-set variants enumerated. **Highest trust when design is the question; tied with `computed-live` when code is the question.**
- `computed-live` — pulled directly from `getComputedStyle` via a browser-control MCP on a running app. Repeatable, covers full `:root` in one call, carries class attribution. **Highest trust for implementation reality.**
- `asked-user` — user manually pasted DevTools Computed panel for a specific element. Precise but single-component.
- `decided` — team has committed to this value. Usually flipped from `seeded` or `inferred` after a brand decision (e.g. tweakcn import, designer hand-off). Durable until a new `computed-live` or `figma-live` measurement confirms or contradicts it.
- `observed` — directly visible / measurable from a screenshot (or `figma-observed` when the source is a Figma node without bound variables).
- `inferred` — structural guess from patterns (e.g., "spacing consistent with 4pt scale").
- `seeded` — stack default carried in by the `design-seed` skill. **Change before ship** if brand requires it. Lowest trust.

When **both** Figma and browser are available, prefer running hybrid and recording both tags side-by-side — mismatches between `figma-live` and `computed-live` are the drift log.

Never output a hex, size, radius, or spacing value without a source. If the evidence isn't there, write `TBD — need [screenshot of X / DevTools paste of Y / navigate MCP browser to Z]` and move on.

## Step-by-step workflow

1. **Detect input mode — and ask if unclear.** If the user's message contains a `figma.com/...` URL → Figma live-MCP. If it contains a non-figma web URL → Browser live-MCP (or URL mode if no browser MCP). If it contains a screenshot only → Screenshot mode. **If none of the above, ask the one question:** "Which source? Paste a **web URL** or a **Figma URL**." Don't pick for them.
1.5. **Detect the stack — and lock the YAML dialect.** Per [stack-dialects.md](references/stack-dialects.md), identify the source's stack BEFORE writing YAML. Figma mode: read `get_libraries` kit names + `get_variable_defs` variable naming. Browser/URL mode: fetch `package.json` and/or probe `:root` CSS vars via `evaluate_script`. Screenshot mode: visual fingerprints (see `framework-fingerprints.md`). Output one `stackId` and record it in the design.md metadata header (`**Stack:** tailwind-shadcn`). **Every YAML key must match that stack's native vocabulary 1:1.** Never translate Tailwind → Material or vice versa. If `unknown`, ask the user to pick (Tailwind / Material / preserve-source / generic). A Tailwind-shadcn source produces shadcn-keyed YAML (`background`, `foreground`, `card`, `muted-foreground`, `spacing.4`, `rounded.xl`). A Material source produces Material-role-keyed YAML (`surface-container-highest`, `on-primary-container`, `headline-large`, `extra-small`). Flipping this breaks the contract with the host codebase.
2. **For Figma live-MCP:** follow [extraction-figma-mcp.md](references/extraction-figma-mcp.md) — parse URL, preflight (`whoami` + `get_libraries`), `get_variable_defs` for the full token catalog, `get_design_context` per canonical component, `get_screenshot` for visual reference. Tag everything `figma-live`. Handle collection modes (light/dark) as parallel columns; enumerate component-set variants.
3. **For Browser live-MCP:** follow [extraction-live-mcp.md](references/extraction-live-mcp.md) — resize viewport, screenshot + snapshot for reference, then one `evaluate_script` call for `:root` vars + one for representative components. Tag everything `computed-live`. Navigate to additional states (modal / form / dark) and re-query.
4. **For URL mode:** WebFetch the page, follow linked stylesheets, extract what the HTML/CSS tells you. If it hits a login wall, offer to switch to browser live-MCP.
5. **For Screenshot mode:** `Read` the image. Identify frameworks by visual tells (see `framework-fingerprints.md`). Sample colors, measure typography, map components. Tag every value with `observed` / `inferred` / `asked-user`.
6. **For Hybrid (Figma + browser):** run steps 2 and 3 against the two sources, then cross-reference. Record design↔code drift at the top of `design.md`.
7. **Ask for gaps.** If a single source covered only one state but the template needs modal / form / empty / dark / mobile evidence, navigate (live-MCP) or ask for additional screenshots. Don't invent.
8. **Populate `template.md`.** Every row cites a source.
9. **Present the design.md.** Tell the user which sections had strong evidence vs which are TBD, and — for hybrid runs — highlight the drift rows. Never silently pad weak sections.
10. **Auto-validate with Google's CLI.** Run `npx @google/design.md lint <product>/design.md` (or `cd google-design.md && bun packages/cli/src/index.ts lint <path>` from the vendored repo if present — **never `bun run cli`** when redirecting; its banner corrupts JSON files). Parse the JSON output. Fix what belongs in the doc; report the rest in the summary (do not embed working-notes sections):
    - Any `broken-ref` error → stop. The `{colors.foo}` reference points at a token that doesn't exist. Fix before returning to the user.
    - `missing-primary` → add `primary` to the YAML `colors` block.
    - Each `contrast-ratio` warning → report in the summary: `"components.<name>: <ratio>:1 (below WCAG AA 4.5:1). Darken textColor, lighten backgroundColor, or lift weight to ≥600 for the 3:1 large-text floor."`
    - Each `orphaned-tokens` warning → report in the summary: `"colors.<name> declared in YAML but unused by any component — reference it or drop."`
    Re-lint after patching. In the user-facing summary, report: errors, warnings count, and the specific contrast / orphaned-token findings.
11. **Offer the stack-matched export.** After lint passes, route by `stackId` (from step 1.5):
    - `tailwind-shadcn` / `tailwind-plain` → ask "Emit `<product-name>/tailwind.theme.json`? Raw Tailwind-v3-shape JSON (`{theme: {extend: ...}}`). Devs hand-wrap as `module.exports` for v3, or translate into `@theme inline` CSS vars for v4." If yes: `npx @google/design.md export --format tailwind <path> > <product>/tailwind.theme.json`. **Note:** `components.*` tokens are dropped by this export (Tailwind is a primitives-only layer). If component tokens matter downstream, also offer DTCG.
    - `material-v3` / `material-v2` / `mui` / `chakra` / `mantine` / `antd` / `apple-hig` / `styled-components` / `emotion` / `css-vars-custom` / `unknown` → ask "Emit `<product-name>/tokens.json`? W3C Design Tokens Format (DTCG 2025.10). Interops with Style Dictionary, Tokens Studio, Figma Variables import, Material Theme Builder. **Preserves `components.*` entries** with `{path.to.token}` references intact." If yes: `npx @google/design.md export --format dtcg <path> > <product>/tokens.json`.
    - For any stack, DTCG is also available on request as a second artifact (some teams want both).
    **Never emit `--format tailwind` for non-Tailwind stacks** — the Tailwind export converts the YAML into `theme.extend` under Tailwind assumptions, which mangles the source vocabulary for Material / Chakra / MUI / Apple / CSS-vars projects.
12. **Detect drift on re-extractions.** When re-extracting a product whose `design.md` already exists, capture the diff before overwriting: `npx @google/design.md diff <product>/design.md <product>/design.new.md`. Review the returned JSON — it reports per-section token adds / removes / modifications plus a `regression` flag (true when the new version has more errors or warnings than the old). If non-regression, promote `design.new.md` → `design.md`, record the adds / removes / modifications in **Sources & Extraction Log** (note the kit or code state that caused each change), and report them in the user-facing summary. If regression, stop and triage before overwriting.

## Precision escalation

**First, check whether a browser-control MCP is connected** (`chrome-devtools-mcp`, Playwright MCP, etc.). If yes, switch to live-MCP mode — it produces the same precision as DevTools paste, automatically, across every component at once. See [extraction-live-mcp.md](references/extraction-live-mcp.md).

If no browser MCP is available, fall back to a manual paste. Offer:

> "For precise values, open Chrome DevTools on the target element, copy the Computed panel, and paste it here. I'll swap the inferred values for exact ones and cite them as asked-user."

One paste per component (button, input, card, heading) is enough to lift a whole section from inferred to exact. If the user later installs a browser MCP, re-run in live-MCP mode for a full upgrade.

## Multi-screenshot strategy

For a complete design.md of an app, one screenshot is never enough. Request:

- **Home / landing** — typography scale, brand marks, CTAs
- **Data-dense view** (table, feed, list) — spacing rhythm, row/cell treatment
- **Form or modal** — input states, dialog elevation, validation
- **Empty state** — tone, illustration, low-density type
- **Dark mode** if it exists — surface tokens and contrast
- **A non-default state** — hover / focus / active (rare without video or DevTools)

If the user provides only one, extract what's visible and list the gaps.

## File output

**One deliverable: `design.md`.** As of this revision, `design.md` absorbs the policy layer that used to live in a separate `system.md` — Direction / Defaults-rejected prose, per-row **Rule** lines, per-component Do/Don't, frequency-ranked spacing tables, the Motion section. The canonical evidence shape still holds; the opinion sits inline with its evidence.

Default location: **`<product-name>/design.md`** at the repo root.

See [template.md](template.md) for the current shape (evidence **plus** absorbed policy). See [references/contract-systemmd.md](references/contract-systemmd.md) for the legacy `system.md` template, retained only for projects that already have one.

### Defaults

- Derive `<product-name>` from the URL hostname stem or Figma file name. For a web URL, strip subdomains/TLD and title-case the stem. For a Figma file, title-case the file name; append a brand-context qualifier if the file name alone is generic.
- Title-case the folder name.
- Scratch evidence (full-page screenshots, raw variable dumps) goes in `<product-name>/_scratch/`.

Confirm before overwriting an existing `design.md`. If the user is re-extracting to cover new states (modal, form, dark mode), **append or patch** — the prior TBD / `[needs user confirmation]` notes name exactly what to fill.

### `system.md` (legacy / deprecated)

`system.md` used to be a separate contract file (often at `.interface-design/system.md` per interface-design plugin convention). It has been **superseded by an upgraded `design.md`** that absorbs the policy layer inline. Keep existing `system.md` files in projects that actively maintain the interface-design plugin; otherwise do not create new ones and consider removing `.interface-design/` once its contents are absorbed into `design.md`.

If the user explicitly asks for a new `system.md` (e.g. "use the interface-design plugin"), write an upgraded `design.md` first, then offer to also produce `system.md` as a legacy companion. Explain the change in one sentence.

## Sections that can almost always be filled from a single screenshot

- §1 Overview — prose impression
- Agent Prompt Guide — synthesis of what was captured

## Sections that may legitimately be sparse

- §5 Elevation & Depth — levels 3 (popover) and 4 (modal) without those surfaces visible → note TBD
- Responsive Behavior — without a mobile capture or DevTools-measured container queries → note "inferred from container widths; mobile not observed"

## Relationship to the active contract

This skill *produces* a design.md — it does not enforce one. The produced document becomes input into a host `system.md` (Theme + Project) or a net-new `system.md` in a greenfield repo. It is evidence-gathering, not contract authoring. The user decides what to adopt from the extracted doc.

## Stop conditions

Stop and hand to the user when:

- WebFetch hits an auth wall → offer browser live-MCP mode first (if connected); else ask for screenshots
- CSS is fully obfuscated (CSS-in-JS hashed without exposed mapping) → in browser live-MCP mode, pivot to per-component `computed-live` picks; otherwise ask for DevTools paste on representative components
- One-screenshot inputs leave > 3 sections as TBD → ask for more screenshots before writing, or offer to upgrade to a live-MCP mode if a matching source is reachable
- Live-MCP is available but the user hasn't navigated or selected a node yet → wait; do **not** navigate authenticated URLs or pick arbitrary Figma nodes on their behalf
- Figma file has no variables, no text styles, no components → tell the user the kit needs codification before extraction is high-value; offer to extract what's there but flag it as low-structure
- Figma file is a product consumer of a library and library tokens don't appear → ask for the library file's Figma URL; re-run against that
- User provides a non-matching URL (figma URL when they said "web", or vice versa) → confirm once, then proceed with the URL they actually pasted

Never write a design.md that is majority `TBD` without flagging it explicitly at the top of the document.
