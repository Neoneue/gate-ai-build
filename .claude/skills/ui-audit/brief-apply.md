Apply exactly these items from the completed `<review-skill>` review. Nothing
else. Your standing rules cover scope, gates and report shape.

<for each item:>
Item <n>. `<path>` ~line <L>. Before: `<exact before>`. After: `<exact after>`.
Reason: <one clause from the review>.
<guards: "if the primitive does not already supply X, leave the call site
alone and say so"; "this changes every <primitive> site-wide, run the whole
suite">

design.md wins on any conflict. Read each target region before editing.
Report per item: file:line before -> after, then a PROOF line the
orchestrator can re-run: the grep that shows the `Before:` pattern is gone
from `src --exclude=request-bodies.ts` (hit count 0, or the surviving hits
named and justified), and for a visual or interaction item the
`page.evaluate` measurement after the change. Twin sweep table: item, files
touched, and for each of Free / Default / Pro / Enterprise "covered by
<file>" or "pattern absent (grep)". "pattern absent" is a report, not a
to-do: never add a feature, section or control to a tier that lacks it to
make the table symmetric; tiers differ per feature by design. If unsure
whether a tier should carry the feature, stop and say so in the report. Then gates with counts, then skips.
Under <N> lines.

REPORT AND PROOF. Write the report to `<report path>` (given by the
orchestrator, in the session scratchpad). Then run
`node .claude/skills/ui-audit/check-report.mjs apply <report path> <routes>`
from the repo root and fix the report (or the work) until it prints PASS.
Hand back only the report path and the checker's PASS line; the orchestrator
runs the same command and sends the FAIL list back if it differs.
