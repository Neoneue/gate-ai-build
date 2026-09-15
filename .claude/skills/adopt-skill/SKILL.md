---
name: adopt-skill
description: Install a skill from skills.sh (npx skills add) or impeccable and place it in exactly one home, the owning agent's folder under agents/<agent>/skills/ or .claude/skills/ for a general skill. Removes the installer's .agents/ tree and symlinks, adds the agent routing row, keeps skills-lock.json. Use when the user pastes an "npx skills add" command or says "install this skill".
argument-hint: <npx skills add owner/repo [-s name]>   or   <path already installed>
---

# adopt-skill

Skills are owned by agents. `.claude/skills/` holds only skills no agent owns.
`.agents/` (the skills.sh default) must not exist after this runs. No symlinks,
no copies, one home.

Arguments: `$ARGUMENTS` = the install command the user gave, or a path.

## Steps

1. **Install as given.** Run the user's command verbatim from repo root with
   `-y`. skills.sh writes real files to `.agents/skills/<name>/` and a symlink
   `.claude/skills/<name>`. Read the resulting `SKILL.md` frontmatter
   (`name`, `description`) for each skill it produced; a repo can ship several.
2. **Ask the owner question, once, listing every skill installed:**
   "Does `<name>` belong to the front-end-developer agent
   (`agents/front-end-developer/skills/`) or is it a general skill for
   `.claude/skills/`?" Skip the question only if the user named the owner in
   the request or the skill is unambiguously a UI / design / motion skill and
   the user has already said design skills go to the agent (they have).
3. **Adopt** with [adopt.sh](adopt.sh): `sh .claude/skills/adopt-skill/adopt.sh
   <agent|general> <name> [<name>...]`. It moves the files, removes the
   `.claude/skills` symlink for agent-owned skills, deletes `.agents/` when
   empty, and asserts no symlink remains anywhere under `.claude/skills` or
   `agents/`. Read its output.
4. **Route it.** For an agent-owned skill add one row to the "Skill routing"
   table in `.claude/agents/<agent>.md`: intent | kit path | one line on how
   it interacts with design.md. Point at `agents/<agent>/skills/<name>/SKILL.md`.
5. **Provenance.** Leave `skills-lock.json` as the installer wrote it; it is the
   record for re-installs. Add nothing to `.gitignore` unless the skill ships
   a per-machine binary (then ignore only that `bin/` path, as impeccable does).
6. **Lint.** `npm run lint:md` (kits are excluded via `agents/**`; the run
   confirms nothing tracked broke). Report: skills adopted, home path, routing
   row added, `.agents/` gone, `ls -la .claude/skills` output.
7. Do not commit; the user asks.

## impeccable special case

`npx impeccable update --project` writes to `.claude/skills/impeccable/` and
its `check` only detects that path. After an update: `sh adopt.sh agent
impeccable`, then verify the PostToolUse hook in `.claude/settings.local.json`
still points at `agents/front-end-developer/skills/impeccable/scripts/impeccable`
(Claude cannot edit hook entries; hand the user a self-deleting `fix-*.sh`).
