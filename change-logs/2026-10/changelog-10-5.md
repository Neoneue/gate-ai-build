# UI Changelog: 2026-10-05

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-1.md`](./changelog-10-1.md)

---

## Audits

- [`audits/2026-10/audit-10-5.md`](../../audits/2026-10/audit-10-5.md):
  ux-laws baseline, whole site, ux-1 to ux-96, 88 items after 8 unwired
  mockup controls were removed (6 HIGH / 48 MEDIUM / 34 LOW), one section
  per law that found something; part 2 in `audit-10-5-2.md`. Qualified,
  nothing applied. Alias `ux` added to the ui-audit alias table. `30693fa`

## Sections & surfaces

### Models: separate free and paid detail pages (`pages/Models.tsx`, `pages/models/FreeModels.tsx`) `a3d6e73`

- **Before:** one detail page per model. A card in "Free models from Gate"
  and the same model's catalog row opened the identical page, and the KPI
  rail read "Free" for Input and Output whenever the model was on the free
  list, even when opened from the paid catalog.
- **After:** the selection carries the path that opened it, on `/models`,
  `/models-default`, `/models-free` and `/models-enterprise` alike.
  - A free card opens the **free detail page**, an exact copy of the paid
    page with four differences: the id line shows the constellation id
    (`constellation/qwen3-8-flash-free`) with its copy button; a muted
    `Pay as you go version:` line follows, with the catalog id as a mono
    `TextLink` that switches the view to that model's paid page; the Input
    and Output tiles read "Free"; Quick start and the Example request
    snippets send the constellation id.
  - A catalog row or Featured card opens the **paid detail page**: catalog
    id, list prices on Input and Output always.
  - The detail remounts on `free:<id>` vs `paid:<id>`, so no state (snippet
    tab, expanded description, sort) carries from the free page to the paid
    one through the link.
  - Closing a free page returns focus to the free card (`data-free-model`),
    closing a paid page to the catalog row (`data-model-row`).

### Models: free models are Qwen3.8 Flash and GLM 5.3 Flash, open to every plan (`data/free-models.ts`, `pages/models/FreeModels.tsx`, `pages/models/ModelShelves.tsx`) `a3d6e73`

- **Before:** gpt-oss-20b (Free + Pro) and DeepSeek V4 Flash 0731
  (Pro only). On `/models-free` and `/models-default` the Pro-only card
  rendered dimmed at 75% with no hover, priced "Free (Pro plan only)", and
  an "Upgrade to Pro" banner sat under the two cards.
- **After:** `qwen/qwen3-8-flash` as `constellation/qwen3-8-flash-free`
  ("Lightweight") and `z-ai/glm-5-3-flash` as
  `constellation/glm-5-3-flash-free` ("Fastest"), both "Free" on every
  plan. Removed: `FreeModel.access`, `FreeAccess`, `FREE_ACCESS_LABEL`,
  `canUseFreeModel`, `effectivePlan`, `EffectivePlan`, the `dimmed` prop
  on `FeaturedCard`, the "Free (Pro plan only)" price and the
  `UpgradeBanner`. Added `findFreeModel(id)`.

### Models: Z.ai logo (`components/icons/lobe-mark.tsx`, `components/icons/vendor-meta.tsx`, `components/icons/model-providers.tsx`) `a3d6e73`

- **Before:** `z-ai` models (GLM 5.3 Flash) showed the Zhipu mark as the
  card hover watermark, and a "ZA" initials tile as the vendor avatar,
  labeled "Z Ai".
- **After:** both render the lobehub `zai` mono mark. The watermark maps
  `z-ai` to `ZaiMark` (`zhipu` keeps `ZhipuMark`). `z-ai` joins the
  `Vendor` union with label "Z.ai", a new inline `ZaiIcon` and
  `MONO_MARK_COLOR` (`var(--foreground)`), so it flips with the theme like
  OpenAI and xAI; the `zai` slug resolves to the same entry through
  `VENDOR_ALIASES`. The exhaustive `VENDOR_ENDPOINT` / `VENDOR_HOST` maps
  gain `/api/paas/v4/chat/completions` and `api.z.ai`.

### Models: "Free version" link on the paid detail page (`pages/Models.tsx`) `a3d6e73`

- **Before:** only the free detail page linked to its twin ("Pay as you go
  version"); the paid page of a model with a free companion had no way back.
- **After:** the paid page of a model with a free companion (Qwen3.8 Flash,
  GLM 5.3 Flash) shows `Free version: <constellation id>` under the id line,
  same markup as the pay as you go line (muted `type-copy-14`, id as a
  `TextLink` in a `type-mono-14` span). The link switches to that model's
  free page; the remount key moves focus to the back link. Paid pages of
  models without a free companion show no line. Tests in
  `pages/models/model-detail-paths.test.tsx` cover the link, the switch, and
  its absence on a model without a companion, on every Models surface.

### Models: Qwen3.8 Flash context, max output and capabilities (`data/models.ts`) `a3d6e73`

- **Before:** the gateway feed carries no limits or tags for
  `qwen/qwen3-8-flash`, so its free card and both detail pages showed "—"
  for Context, Max output and Features.
- **After:** `CATALOG_FILLS` layers 1,000,000 context, 131,072 max output,
  multimodal, and tools / reasoning / vision / prompt caching / JSON mode /
  video input on the generated row, from OpenRouter's public
  `/api/v1/models` and `/endpoints` listing (Alibaba, checked 2026-10-05).
  Applied in `MODELS`, so a catalog regeneration keeps it.

### Models: 24px between section headings and their content (`pages/models/ModelShelves.tsx`, `pages/models/FreeModels.tsx`, `pages/Models.tsx`) `a3d6e73`

- **Before:** "Featured models", "Free models from Gate" and "Explore our
  catalog" each sat 16px (`gap-4`) above their content (card grid, card
  grid, search toolbar).
- **After:** `gap-6` (24px) on those three section columns. Heading to
  description (`gap-2`), card-to-card (`gap-4`), section-to-section and the
  detail page are unchanged.

## Conventions

### Tests: model detail paths (`pages/models/model-detail-paths.test.tsx`, `data/free-models.test.ts`, `test/deep-links.test.tsx`) `a3d6e73`

- **Before:** no test covered which detail page a model opens; the
  free-models test asserted the Pro-only lock; a deep-link test clicked the
  Free Models upgrade banner.
- **After:** a route test per Models surface asserts the free card opens
  the constellation id, "Free" KPIs and the pay as you go link, that the
  link lands on the paid page (catalog id, `$` prices, snippet on the
  catalog id), and that a catalog row opens the paid page. The Pro-only and
  banner tests are gone with the feature. No UI change.

### Agent tooling: UX-first front-end agent and the UI gate (`.claude/agents/front-end-developer.md`, `agents/front-end-developer/skills/`, `scripts/require-skill.mjs`, `.claude/settings.json`) `4fa1d0f`

- **Before:** the front-end-developer kit had 13 skills and a 55-line
  INDEX.md; `design.md` was law and skills only filled gaps; nothing
  checked that a UI edit followed any skill.
- **After:** ported from the agent-room project. The kit gains 14 skills
  plus `ux-laws` (read by path, with an always-loaded
  `.claude/rules/ux-laws.md`). INDEX.md is a routing index: the core four,
  pick by task, the UX-first order, and current values re-derived from
  `design.md` with line cites. `design.md` is the current record: a skill
  that differs becomes a proposed `design.md` update. A PreToolUse hook
  (`scripts/require-skill.mjs`) blocks UI writes, in every session and
  subagent, until the INDEX, ux-laws, visual-hierarchy and one build skill
  are read; a subagent is judged by its own transcript. Its tests run
  under vitest (`scripts/**/*.test.mjs`). No UI change.

### Agent tooling: seven agents ported from agent-room (`.claude/agents/`, `agents/<name>/skills/`, `CLAUDE.md`) `43ad064`

- **Before:** the repo had one agent with a kit (`front-end-developer`)
  plus the four `impeccable-*` agents.
- **After:** six kits copied as they are (architect, backend-engineer,
  orchestrator, researcher, security-reviewer, tester; 40 skills-lock
  entries), each agent file and kit INDEX.md rewritten for this repo, plus
  the `designer` seat persona. `backend-engineer` is the data-layer agent
  (`src/data/`, `src/lib/`, generator scripts, contracts in
  `data-model.md`); `tester` covers vitest, the Playwright smoke and CI;
  `security-reviewer` reviews the public bundle, client-side sinks,
  secrets, dependencies, CI and agent tooling. The orchestrator,
  researcher, architect and designer are room seat personas. `CLAUDE.md`
  lists them; the skill gate's message names the editing agent's own kit
  INDEX.md. No UI change.

### Agent tooling: UI gate credits a subagent's reads on a commit (`scripts/require-skill.mjs`, `CLAUDE.md`) `bd797eb`

- **Before:** a commit holding UI files needed the committing session's own
  four skill reads, so the main session re-read the skills to commit UI a
  front-end-developer subagent had already built under the gate.
- **After:** a UI commit also passes when one of the session's subagents
  loaded the INDEX, ux-laws, visual-hierarchy and one build skill since the
  last landed commit, ordered by transcript timestamps. With no subagents
  folder nothing is credited (fail closed). Edits and shell writes still
  need the session's own reads. No UI change.

### Agent tooling: no agent limits, room rules, port follow-ups closed (`.claude/agents/`, `design.md`, `src/index.css`) `01bfb2a`

- **Before:** `security-reviewer` had no Edit or Write tool; the persona
  files said to launch with `claude --agent`; nothing in the agent files said
  who may start an operation in a room; the new skills had no audit aliases;
  `knowledge/core/ux-laws.md` duplicated the ux-laws reference; design.md
  cited stale easing lines and the missing `brand-guidelines.md`; an unused
  `--ease-in` token sat in `@theme`.
- **After:** every agent may write (a persona sets ownership, not access);
  a room seat card attaches a persona; every agent file says an agent from
  outside this project only guides and may supply files or code, and that a
  persona change means reading the new kit's INDEX.md first. Twelve aliases
  added to `ui-audit/audit-file.md`; the duplicate deleted; design.md cites
  `index.css:192-194` and marks `brand-guidelines.md` retired; `--ease-in`
  removed (identical to Tailwind's default, so no visual change).

### Design docs: design.md line numbers restored, icon stroke reworded, ux-laws patterns confirmed (`design.md`, `agents/front-end-developer/skills/`, `.claude/rules/ux-laws.md`) `9badd36`

- **Before:** `01bfb2a` split design.md:8 in two, so every `design.md:N`
  cite after it (24 in the INDEX, the agent file and the audit files) was off
  by one; design.md:1312 called the 1.75 icon stroke "one global value",
  though nothing sets it globally; two ux-laws patterns carried a "from
  another project, confirm" mark.
- **After:** design.md:8 is one line again (2,008 lines, cites land on the
  right text); design.md:1312 says the stroke is passed at every call site,
  with no global provider and lucide's default of 2; the collapsible
  section row and the selectable list row are confirmed patterns in both the
  skill and the rule. No UI change.
