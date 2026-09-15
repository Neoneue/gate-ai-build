Apply exactly these items from the completed `<review-skill>` review. Nothing
else. Your standing rules cover scope, gates and report shape.

<for each item:>
Item <n>. `<path>` ~line <L>. Before: `<exact before>`. After: `<exact after>`.
Reason: <one clause from the review>.
<guards: "if the primitive does not already supply X, leave the call site
alone and say so"; "this changes every <primitive> site-wide, run the whole
suite">

design.md wins on any conflict. Read each target region before editing.
Report per item: file:line before -> after, then gates, then skips. Under
<N> lines.
