# Skills index: copywriter

Routing for the copywriter in gate-ai-build. Read skills by path
(`agents/copywriter/skills/<name>/SKILL.md`), never through the Skill tool.
The kit was ported from the motion-graphics studio on 2026-10-07; the skill
files are byte-identical to it, and only this INDEX.md is local.

## Your job here

Every user-facing string in the dashboard: titles, labels, helper and
description lines, buttons, errors, toasts, dialogs, empty states, banners
and tooltips. You write it, ground every fact in its PRD, and hand it back
to the lead who asked. You do not place it in the UI.

## The order

1. **Read the brief.** The surface (route and file), each string with its
   state (tier, role, empty, error), what the user is doing at that moment,
   and the PRD the brief names.
2. **Source first: `triage-copy`** (`.claude/skills/triage-copy/SKILL.md`,
   a general skill, read by path). Run `npm run lint:copy -- <files>`, then
   find the governing PRD live in Notion (top-down from Gate AI Product
   Docs) and note the facts it states. A string may say less than its
   sources; it never adds a fact.
3. **Draft with `copywriting`** (adapted below): one idea per string,
   clarity over cleverness, the user's words.
4. **Tighten with `copy-editing`**: its clarity, specificity and voice
   sweeps.
5. **Run `humanizer`** on every string.
6. **Re-lint** the strings with `lint:copy`, then check the house rules
   below line by line.
7. **Return** per the Contract in `.claude/agents/copywriter.md`.

## Which skill for what

| Need | Skill |
| --- | --- |
| PRD grounding, lint, waive or rewrite a flag | `.claude/skills/triage-copy/SKILL.md` |
| Drafting a string from the job and its facts | `copywriting/SKILL.md` |
| Tightening and reviewing existing strings | `copy-editing/SKILL.md` |
| Removing AI tells | `humanizer/SKILL.md` |
| A Gate voice profile the team reuses | `voice-builder/SKILL.md` |

**Not used for dashboard copy** (vendored, studio-specific): `on-screen-copy`
(video hold times), `hook-generator` (social hooks), `ad-creative` (ad
variants). Use one only when the owner asks for marketing or video copy.

## Per-skill overrides (read with the skill)

- **`copywriting`**: written for marketing pages. Here it is product UI
  microcopy: no headlines that sell, no benefit stacks, no CTAs beyond the
  one action a control names. Keep its clarity, specificity and
  customer-language rules. Its product context file is
  `agents/front-end-developer/knowledge/core/gateway-context.md` plus the
  PRD, not `.claude/product-marketing.md`.
- **`copy-editing`**: use the clarity, specificity and voice sweeps; skip
  SEO, page structure and content refresh.
- **`humanizer`**: run on every string. Short UI strings hide tells badly:
  watch for tricolons, "not X, it's Y", stacked adjectives and em dashes.
- **`voice-builder`**: one voice file, `agents/copywriter/knowledge/voices/gate.md`.
  It does not exist yet; build it only in an interview with the owner,
  never from invented answers. Until then, the house rules below are the
  voice.

## House rules (gate-ai-build)

- **The PRD is the spec; the live product owns existing strings.** Never
  invent UI facts, numbers, limits or behavior.
- **Copy is for users, not a PRD echo.** No mechanism ("the next run",
  "eligible", "returns 429"), no "cannot", no "there is no". Say what the
  user gets or must do.
- **Site terms win.** "Messages" (not requests or records) for the request
  log; "fingerprint" / "fingerprinted" for the audit anchor; plan names
  Free, Pro, Enterprise; "Gate", never "the platform".
- **Forbidden:** "platform" (for Gate), "enterprise-grade", "CISO-ready",
  "SOC-integrated", "industry-leading", "best-in-class detection",
  "blockchain audit", "on-chain", "Web3", the DAG name, "decentralized AI",
  "node compute".
- **Required, where provenance is the point:** "tamper-evident",
  "cryptographically verifiable", "anchored to Constellation's Digital
  Evidence layer".
- **Form** (design.md Voice & Content): sentence case; a period on every
  complete descriptive sentence; buttons are a specific verb; no em dashes
  in copy (an em dash glyph only as the empty-value placeholder).
- **No duplication:** a value or idea appears once on a surface. If the
  field shows 30, the line under it does not repeat 30.
- **Numbers:** never change a figure, plan name, role name or product term
  without the PRD line that gives it. Compression percentages carry one
  decimal (22.4%).

## Reused from other agents (by path)

| For | Read |
| --- | --- |
| Product facts and audience | `agents/front-end-developer/knowledge/core/gateway-context.md` |
| Voice and content form rules | `design.md` "Voice & Content" |
| Routes, roles and tiers a string appears in | `data-model.md` |
| Every file a route renders (tier twins) | `node .claude/skills/verify-twins/resolve-route.mjs <route>` |

## Sources (agenticskills.io, vendored 2026-10-02 in motion-graphics)

| Skill | Tier | Author | Upstream |
| --- | --- | --- | --- |
| `copywriting`, `copy-editing`, `ad-creative` | S (marketing-skills bundle) | Corey Haines | `coreyhaines31/marketingskills` `skills/<name>` (`evals/` trimmed) |
| `voice-builder`, `hook-generator` | S (social-media-skills bundle) | Charlie Hills | `charlie947/social-media-skills` `skills/<name>` |
| `humanizer` | A | blader | `blader/humanizer` (SKILL.md, LICENSE) |
| `on-screen-copy` | studio | motion-graphics | local |
