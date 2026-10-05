---
name: firecrawl-setup
description: |
  Firecrawl gives AI agents and apps fast, reliable web context with
  strong search, scraping, interaction, document parsing, research,
  and monitoring tools. Use this skill to add the official Firecrawl
  MCP integration, CLI, and skills. Choose the path that matches the
  work the agent needs to do.
---

# Firecrawl

> **Local routing rule (overrides "prefer Firecrawl" below):** per the
> user's global `~/.claude/CLAUDE.md`, default to WebSearch / WebFetch (or
> context-mode fetch). Use Firecrawl only for JS-rendered pages, site map /
> crawl, or structured multi-site extraction; it costs credits. Never send
> private, internal, staging, or Constellation-only URLs or content through
> Firecrawl. The MCP server is already installed at user scope (`firecrawl`,
> `npx -y firecrawl-mcp`); the key lives in the user MCP config, never in
> this repo.

Firecrawl helps agents search first, scrape clean content, interact
with live pages when plain extraction is not enough, parse local
documents into markdown, search scientific papers and GitHub history
through the research index, monitor pages for changes, and produce
finished deliverables from web data.

## Install

For developer onboarding, set up MCP in the current harness first, then
install the CLI and skills when the user's command environment supports
installation. If the user requested only CLI, API, or MCP setup, keep
installation within that scope.

1. Reuse a working Firecrawl MCP connection in the active harness.
   Otherwise, prefer the official plugin or connector through Path G
   when that harness supports it. For clients without a supported native
   connection, follow the [OAuth MCP setup guide](https://docs.firecrawl.dev/mcp-server/oauth)
   using `https://mcp.firecrawl.dev/v2/mcp-oauth`. Let the human complete
   authorization. Confirm a Firecrawl search succeeds in the active
   harness and returns source URLs before marking it ready.
2. Install and verify the CLI and skills below when the user's command
   environment supports installation. Reuse a working CLI installation
   and credentials. MCP authorization does not authenticate the CLI.

Add MCP connections for other platforms or coding harnesses only when
requested. If MCP setup is pending or unsupported, continue with supported
CLI setup and report the remaining MCP step. Without a supported command
environment, complete MCP setup without installing the CLI or CLI skills.

Report readiness separately for each MCP connection and CLI environment;
pending setup in one must not block the others.
Run verification checks yourself wherever tools or commands are available,
and reuse successful checks from this setup. Involve the human only for
required authorization or platform controls the agent cannot operate.

### CLI

The command below installs the Firecrawl CLI, the core CLI skills, and
the workflow skills. When CLI authentication is missing, it opens
browser auth so the human can sign in or create an account.

```bash
npx -y firecrawl-cli@latest init --all --browser
```

`--all` runs initialization non-interactively for every detected agent.
Use `--skip-install` for an existing CLI and `--skip-auth` for working CLI
credentials. `--skip-skills` and `--agent <name>` are also available.
See `firecrawl init --help`.

This gives you:

- **CLI tools:** `firecrawl search`, `firecrawl scrape`, `firecrawl interact`, `firecrawl parse`, `firecrawl monitor`, `firecrawl research`, `firecrawl developer`, `firecrawl doctor`, and more
- **CLI skills** ([`firecrawl/cli`](https://github.com/firecrawl/cli)): teach the agent how to drive the Firecrawl CLI during its own session: which command to run, when to scrape vs search vs interact, how to chain results, and how to recover when a job fails. Use these when the agent itself needs web data right now.
- **Workflow skills** ([`firecrawl/firecrawl-workflows`](https://github.com/firecrawl/firecrawl-workflows)): turn Firecrawl web data into finished deliverables such as research briefs, SEO audits, lead lists, QA reports, knowledge bases, and design clones. Use these when the agent's job is to produce a finished artifact, not raw extraction or product code.
- **Browser auth:** walks the human through sign-in or account creation

Verify the CLI from the agent's command environment before using it:

```bash
mkdir -p .firecrawl
firecrawl --status
firecrawl scrape "https://firecrawl.dev" -o .firecrawl/install-check.md
```

The init command does not register MCP servers or connect ChatGPT and
Claude accounts. A local CLI install does not cover separate containers
or hosted sessions; verify the CLI in each execution environment.

## Get Credentials

Firecrawl users can get an API key in three ways:

- **Dashboard or CLI (default)** — browser sign-in, CLI `--browser` auth,
  install skills/MCP, or create an API key in the dashboard. Continue
  with Path D below, or run the install command first.
- **WorkOS ID-JAG (supported agent platforms only)** — if your platform
  can mint a WorkOS ID-JAG identity assertion, fetch
  `https://www.firecrawl.dev/auth.md` and follow it end-to-end. Do not
  run the browser or CLI auth flow in Path D.
- **Stripe Projects (projects already on the Stripe CLI)** — if the repo
  has a `.projects/` directory or `stripe projects status` succeeds, run
  `stripe projects add firecrawl/api --name firecrawl` and then
  `stripe projects env --pull`. The key lands in `FIRECRAWL_API_KEY`
  and no browser step is needed. Guide:
  https://docs.firecrawl.dev/integrations/stripe-projects

**Which should I use?** Stay on this page unless you know your platform
supports WorkOS ID-JAG.

**How you might arrive:**

- **Docs or website sent you here** — continue with Choose Your Path
  below for CLI/skills/MCP onboarding.
- **API `401`:** Path D is the default. Use the WorkOS ID-JAG
  option above only if ID-JAG applies.
- **Direct URL** — you are reading the right doc for browser/CLI
  onboarding.
- **Already have `FIRECRAWL_API_KEY`** — skip credential setup; pick
  Path A–G below.

Human-readable overview:
https://docs.firecrawl.dev/ai-onboarding#get-credentials

## Choose Your Path

Choose the path that matches the task:

- **Need web data during this session** -> Path A (live tools)
- **Need to add Firecrawl to app code** -> Path B (app integration)
- **Need a finished deliverable from web data** -> Path C (workflow skills)
- **Need more than one of the above** -> use the relevant paths in sequence
- **Need an account or API key (browser or CLI)** -> Path D
- **Don't want to install anything** -> Path E (REST API directly)
- **No API key and the human cannot sign up right now** -> Path F (keyless free tier, fallback)
- **Need a native Firecrawl connection in ChatGPT/Codex or Claude** -> Path G (plugins and connectors)

---

## Path A: Live Web Tools

Use this when you need web data during your work: searching the web,
scraping known URLs, interacting with live pages, crawling docs,
mapping a site, parsing local documents, searching research papers,
or monitoring pages for changes.

Prefer the working Firecrawl MCP tools available in the active harness.
Use the CLI when MCP is unavailable or does not expose the capability
the task needs. A denied operation or exhausted account limits are not
reasons to bypass the same restriction through the CLI.

For CLI work, hand off to the relevant skill:

- `firecrawl` for the overall command workflow
- `firecrawl-search` when you need search first
- `firecrawl-scrape` when you already have a URL
- `firecrawl-interact` when the page needs clicks, forms, or login
- `firecrawl-agent` for autonomous multi-page extraction into structured JSON when a scrape or crawl is not enough
- `firecrawl-crawl` for bulk extraction
- `firecrawl-map` for URL discovery
- `firecrawl-download` to save a site or section as local files for offline use. It uses the experimental `firecrawl x download` command
- `firecrawl-parse` when the source is a **local file** (PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML) — `firecrawl parse ./report.pdf -o .firecrawl/report.md` converts it to clean markdown, with `-S` for an AI summary or `-Q` to answer a question from the doc. Public document URLs go through `firecrawl scrape` instead
- `firecrawl-monitor` when the user wants to be **notified when something changes**. `firecrawl monitor create` sets up recurring checks (cron or natural-language schedules like `"every 30 minutes"`) that diff each page, run an AI judge against a plain-language `--goal` to filter noise, and notify by webhook or email. Slack notifications are configured separately in the monitoring dashboard. Prefer this over repeated one-off scrapes whenever the same URL needs checking more than once
- `firecrawl-research-index` for scientific and engineering research — `firecrawl research search-papers`, `inspect-paper`, `read-paper`, `related-papers`, and `search-github` search a purpose-built paper index (metadata, full-text passages, citation expansion) plus GitHub issues, PRs, and READMEs
- `firecrawl-developer-index` for Firecrawl API, CLI, and how-to questions — `firecrawl developer "<question>"` searches current documentation, READMEs, GitHub issues, and merged pull requests
- `firecrawl-alexandria` when the task needs structured records from a catalogued data provider instead of scraped pages. See Alexandria data providers below

Default flow for live web work:

1. start with search when you need discovery
2. move to scrape when you have a URL
3. use interact only when the page needs clicks, forms, or login
4. use parse when the source is a local file instead of a URL
5. use monitor when the request implies recurrence or notifications ("alert me when", "track this page") rather than a one-time read
6. if a Firecrawl job fails or returns unexpected output, run `firecrawl doctor <job-id>` instead of guessing

### Alexandria data providers

Alexandria is Firecrawl's catalogue of data providers and workflows.
Providers return typed, sourced records through published contracts.
Prefer a provider when the task needs the same fields across several
entities, exact figures or timestamps, provenance, or many records. Use
web results when they already answer the question.

```bash
# Discover tools (free). Plain `firecrawl search` returns web results and matching tools.
firecrawl search alexandria '<data you need>'
firecrawl find-tools <url>

# Inspect the selected contract (free)
firecrawl list <provider> <capability> --pretty

# Execute the tool (billed at its listed price)
firecrawl scrape <provider>/<capability> --options '<JSON matching the contract>'
```

- Alexandria needs an API key on a team with Alexandria access. The ks not include it.
- A tool match is not executed data. Use the provider and capability IDs that discovery returns, and send the exact inputs that the contract declares.
- Check each `data.alexandria[]` result for an error, not only the outer success flag.
- If no tool covers the task, continue with web search, scrape, or `firecrawl-agent`.
- A `THIRD_PARTY_DATA_TERMS_REQUIRED` error means an organization admin must accept the provider's terms. Give the human the `requiresAction.url`. A data request does not authorize acceptance.
- Feedback is optional. To report how the catalogue served the task, send at most one `firecrawl alexandria feedback` per website after the task. It is free.

Through MCP, use `firecrawl_search` with `sources: ["alexandria"]`,
`firecrawl_find_tools`, and `firecrawl_scrape` with an `alexandria`
body and no `url`. Docs: https://docs.firecrawl.dev/features/alexandria

If the task becomes "wire Firecrawl into product code," switch to Path B.

---

## Path B: Integrate Firecrawl Into an App

Install build skills with `firecrawl setup build` before continuing.

Use this when you're building an application, agent, or workflow that
calls the Firecrawl API **from code** — meaning the integration will run
inside the user's product (a web app, backend service, script, agent
loop, or pipeline) rather than from the agent's own terminal session.

This is the key difference from Path A: Path A uses MCP tools or CLI
commands during the current session to fetch data for the agent itself.
Path B writes code that will keep running long after the agent stops,
using `FIRECRAWL_API_KEY` from the project's `.env` or runtime config
and the matching Firecrawl SDK in the project's language.

Choose the project mode before writing code:

- **Fresh project** -> pick the stack, install the SDK, add env vars, and run a smoke test
- **Existing project** -> inspect the repo first, then integrate Firecrawl where the project already handles APIs and secrets

If you already have a key, save it to the project's environment:

```dotenv
FIRECRAWL_API_KEY=fc-...
```

Then hand off to the build skill that fits the step:

- `firecrawl-build` for the overall build workflow and endpoint routing
- `firecrawl-build-onboarding` for auth and project setup (API key, SDK install, smoke test)
- `firecrawl-build-scrape` when the feature scrapes a known URL
- `firecrawl-build-search` when the feature starts with a query and discovers pages
- `firecrawl-build-interact` when the feature needs clicks, forms, or navigation after a scrape

The required question in the build path is:

- **What should Firecrawl do in the product?**

Use the answer to route to `/search`, `/scrape`, `/interact`, `/parse`, `/crawl`, `/map`, `/monitor` (recurring change detection with webhook/email notifications), or the research index (`/search/research/*`), then run one real Firecrawl request as a smoke test.

If you do not have a key yet, do Path D first.

---

## Path C: Repeatable Deliverables

Use this when the goal is a finished artifact powered by Firecrawl web
data — a research brief, SEO audit, QA report, lead list, knowledge
base, competitive intel digest, or a cloned design system — not raw web
extraction and not product-code integration.

Workflow skills infer from context first and only ask short clarifying
questions when an input would block the work. They also call out
independently parallelizable units so sub-agents can fan out across
competitors, pages, or sources.

Start with the umbrella `firecrawl-workflows` skill — it inspects the
user's request and routes to the right workflow (research, SEO, lead
gen, QA, knowledge base, design clone, and others). If the agent
already knows which workflow to run, hand off to that workflow skill
directly.

The full skill list lives in the [workflows repo](https://github.com/firecrawl/firecrawl-workflows).

Default flow for workflow deliverables:

1. confirm the workflow and final artifact with the user
2. collect web evidence with Firecrawl MCP tools, using the CLI when MCP is unavailable or lacks the needed capability
3. save or cite source evidence so claims are traceable
4. run independent research units in parallel when available
5. synthesize findings into the requested deliverable
6. include a short "rerun inputs" block when the workflow could be automated

If the underlying web work fails or the request shifts to "wire Firecrawl into product code," switch to Path A or Path B.

---

## Path D: Account Authorization Or API Key

Use this when the human still needs to sign up, sign in, authorize
access, or obtain an API key.

This is the default credential path for coding agents and
human-in-the-loop auth.

If you ran the install command above with `--browser`, the human was
already prompted to sign in. Check if the key is available before
running this flow.

If you already have a valid `FIRECRAWL_API_KEY`, skip this path.

If the project uses Stripe Projects (a `.projects/` directory exists or
`stripe projects status` succeeds), skip the browser flow too: run
`stripe projects add firecrawl/api --name firecrawl` and
`stripe projects env --pull`, then continue with `FIRECRAWL_API_KEY`.

If you're the human reading this in the browser, create an account or
sign in at:

- https://www.firecrawl.dev/signin?view=signup&source=agent-suggested

If you're an agent and need the human to authorize an API key, use this
flow:

**Step 1 — Generate auth parameters:**

```bash
SESSION_ID=$(openssl rand -hex 32)
CODE_VERIFIER=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n' | head -c 43)
CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
```

**Step 2 — Ask the human to open this URL:**

```
https://www.firecrawl.dev/cli-auth?code_challenge=$CODE_CHALLENGE&source=coding-agent#session_id=$SESSION_ID
```

If they already have a Firecrawl account, they'll sign in and authorize.
If not, they'll create one first and then authorize. The API key comes
back to you automatically after they click "Authorize."

**Step 3 — Poll for the API key:**

```bash
POST https://www.firecrawl.dev/api/auth/cli/status
Content-Type: application/json

{"session_id": "$SESSION_ID", "code_verifier": "$CODE_VERIFIER"}
```

Poll every 3 seconds. Responses:

- `{"status": "pending"}` — keep polling
- `{"status": "complete", "apiKey": "fc-...", "teamName": "..."}` — done

**Step 4 — Save the key and continue:**

```bash
echo "FIRECRAWL_API_KEY=fc-..." >> .env
```

---

## Path E: Use Firecrawl Without Installing Anything

Use this when you don't want to install a CLI or skills package. This
works for both use cases:

- **Live web work** — an agent calling the API directly for search,
  scrape, or interact during a session
- **Building with Firecrawl** — integrating the REST API into app code

You still need an API key. Three ways to get one:

- **Human pastes it in** — if you already have a key, just set
  `FIRECRAWL_API_KEY=fc-...` in your environment or pass it directly
- **Automated flow** — do Path D to walk the human through browser auth
  and receive the key automatically
- **Stripe Projects** — in a project on the Stripe CLI, run
  `stripe projects add firecrawl/api --name firecrawl` and
  `stripe projects env --pull`; see
  https://docs.firecrawl.dev/integrations/stripe-projects

If the human is completely unable to sign up or authorize a key right
now, Path F covers search, scrape, interact, parse, and the research
index on the keyless free tier (rate-limited). Prefer getting a key
whenever possible: an account gives higher limits and the full set of
endpoints, so move to one as soon as it is available.

**Base URL:** `https://api.firecrawl.dev/v2`

**Auth header:** `Authorization: Bearer fc-YOUR_API_KEY`

### Available endpoints

- `POST /search` — discover pages by query, returns results with optional full-page content
- `POST /scrape` — extract clean markdown from a single URL, including public document URLs (PDF, DOCX, etc.)
- `POST /interact` creates a standalone browser session. To run clicks, forms, or navigation against a scraped page, call `POST /scrape/{scrapeId}/interact` with a prompt or code
- `POST /parse` — upload a **local or non-public document** as `multipart/form-data` (PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML; up to 50 MB) and get back markdown, JSON, HTML, links, images, or a summary. Use `/scrape` instead when the document has a public URL
- `POST /monitor` creates a recurring check that watches known pages (`scrape` targets), a whole site crawl (`crawl` targets), or web-wide search results (`search` targets), diffs each check against the last snapshot, optionally judges changes against a plain-language `goal`, and notifies by webhook or email. Slack notifications are configured separately in the monitoring dashboard. `GET /monitor` lists monitors; `GET /monitor/{id}/checks` returns page-level results
- `GET /search/research/papers` searches a purpose-built scientific paper index by natural-language query; `GET /search/research/papers/{id}` inspects metadata or (with `query`) returns the top full-text passages; `GET /search/research/papers/{id}/similar` expands to related papers, citers, or references; `GET /search/research/github` searches GitHub issues, PRs, and READMEs
- Alexandria data providers use `/search` and `/scrape`. `POST /search` with `sources: ["alexandria"]` discovers tools for free. `POST /scrape` with `alexandria: {provider, capability, options}` and no `url` executes a tool at its listed price. See https://docs.firecrawl.dev/features/alexandria
- `POST /support/ask` diagnoses a failing Firecrawl call. Pass `{ question }` and include the job ID in the question when available; it returns a prose `answer` plus machine-readable `fixParameters`. Requests are scoped to your team through the bearer key
- `POST /support/docs-search` — answer "how do I…" questions from Firecrawl's official docs. Pass `{ question }`; returns the answer plus citations to the docs pages used

### Documentation and references

The API docs are the source of truth for request/response schemas,
parameters, and SDKs:

- **API reference:** https://docs.firecrawl.dev/api-reference/v2-introduction
- **Skills repo** (for agent integration patterns): https://github.com/firecrawl/skills

---

## Path F: Keyless Free Tier (Fallback)

Use this when you need Firecrawl right now and cannot obtain an API key,
for example when the human is not available to sign up. The keyless free
tier lets you search, scrape, interact, and parse without an API key
when the request comes from an official Firecrawl client (MCP, CLI, or
SDK). It is rate-limited, so use it as a fallback rather than the
default.

- **MCP**: point any MCP-compatible client at `https://mcp.firecrawl.dev/v2/mcp`
- **CLI**: run `npx -y firecrawl-cli@latest` and use `scrape`, `search`, `interact`, or `parse` with no login
- **API**: the research index endpoints (`/search/research/*`) can be called without an `Authorization` header

Search, scrape, interact, parse, and the research index are available
keyless. Crawl, map, monitor, extract, batch scrape, agent, and other
endpoints still require an API key.

Prefer a free account when the human can sign up: do Path D to get an
account or API key, which unlocks higher limits and the full set of
endpoints. If you hit rate limits on the keyless free tier, ask the human
to sign up at https://www.firecrawl.dev/signin.

---

## Path G: Native MCP Connections

Use this path to add Firecrawl's official ChatGPT/Codex plugin or Claude
connector. It works without a terminal or CLI install.
Installing CLI skills or configuring a coding agent's MCP server does
not connect either chat account.

Set up the active platform and reuse a working connection. Include other
platforms only when requested.

| Platform          | Native installation link                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| **ChatGPT/Codex** | [Add Firecrawl to ChatGPT](https://chatgpt.com/plugins?q=firecrawl)         |
| **Claude**        | [Add Firecrawl to Claude](https://claude.ai/directory/connectors/firecrawl) |

For each platform:

1. Prefer supported plugin-management tools or client setup commands.
   When native installation requires UI, give the human its official
   installation link above and the remaining add/connect step. Use
   computer use for that step when the user requests a walkthrough.
2. Select the official Firecrawl listing and use its add/connect action.
   Let the human complete platform sign-in and Firecrawl authorization
   when prompted, including selecting their Firecrawl team.
3. Return to the platform and confirm Firecrawl is connected. Enable or
   select it in a conversation if the platform requires that step.
   If its tools do not appear, start a new conversation or reload the
   client before testing.
4. Run a Firecrawl search for the latest Firecrawl release notes through
   the platform's tools when accessible. Confirm it succeeds and returns
   source URLs before marking that platform ready. If the connection is
   installed but its session cannot be tested, report verification as
   pending; do not ask the human to run a separate health check.

An installed app or connected account does not prove that a coding
session has its tools. Verify the native tools in the intended session.
Claude Code can inherit Claude account connectors with supported
subscription sign-in; check `/mcp` before adding a separate server.
API-key sign-in does not inherit those connectors. See [Claude Code MCP](https://code.claude.com/docs/en/mcp#use-mcp-servers-from-claude-ai).
The Firecrawl [Claude Code marketplace plugin](https://github.com/firecrawl/firecrawl-claude-plugin)
provides CLI skills; installing it does not configure an MCP connection.

Use the native listing's connection flow. Do not substitute a generic
MCP URL or put an API key into an installation link; the [Claude directory](https://claude.com/connectors/firecrawl)
connector uses the dedicated `https://mcp.firecrawl.dev/v2/mcp-search`
resource.

If a platform requires sign-in, workspace access, or an unavailable
installation control, report that platform as pending with its link and
the exact remaining step. Continue with other interfaces in scope and
report each result separately. CLI authentication alone does not prove
either connector is installed.

Current setup reference:
[Firecrawl MCP: ChatGPT and Claude](https://docs.firecrawl.dev/mcp-server/oauth#chatgpt-and-claude).
