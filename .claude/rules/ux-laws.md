# Rule: UX before UI, and know the laws

Loaded at launch for every session and subagent (no `paths:`). Before
building or changing any UI, read the **`ux-laws`** skill's SKILL.md by path
(`agents/front-end-developer/skills/ux-laws/SKILL.md`). It holds the 31 laws
as check questions and the gate to pass before writing UI. This rule carries
only what must never depend on a skill being loaded.

- **UX first:** write the job, the user's path and what they expect, then
  place. Bad UI means bad UX: fix the flow before the styling.
- **Jakob:** use the pattern people already know from Vercel, Stripe or the
  OpenAI / Anthropic consoles before inventing one.
- **Hierarchy:** the title and names are foreground; supporting text is
  `muted-foreground`. If everything is foreground, nothing is important.
- **Corrected patterns:** collapsibles are full-width section rows; list
  items that open something are selectable rows with a hover fill; one
  primary action; destructive stays quiet; each section's edit action sits in
  the same place everywhere; an action acts on its container's own object
  (a plan or page action never sits in another card's footer).
- **Decide, don't default:** before UI, write the ux-laws gate (the tested
  pattern it follows and the repo component it maps to, then objects, then
  actions on them, then laws, then at least one rejected alternative). A
  design with no rejected alternative was defaulted, not decided.
- **No invented UI:** every layout follows a tested pattern (Stripe, Vercel,
  OpenAI / Anthropic consoles) built from our components. A new component
  only when nothing existing fits, and the gate says why (owner 2026-10-08).
