---
name: token-report
description: Token and cost report for gate-ai-build from Claude Code's own transcripts (spend by kind, context size, what sessions spent calls on, subagents by model, blocked calls, rebuilt scratch scripts, and the Jev correction rate) against the 2026-09-26..10-10 baseline. Use weekly, or when the user says /token-report or asks how token use is trending.
context: fork
model: haiku
---

# /token-report

1. From the repo root run `node scripts/token-report.mjs` (the last 7 days).
   If the user names a window, add `--since YYYY-MM-DD` and
   `--until YYYY-MM-DD`. Add `--no-jev` only when the user says to skip Jev.
2. Relay the printed lines exactly as printed, then one line naming the
   biggest change against the baseline. No other commentary, no em dashes.
3. Edit no file. The script saves its own snapshot to `docs/token-report/`
   (local-only, gitignored); `baseline.json` there is the 2026-09-26..10-10
   run and is never overwritten.
