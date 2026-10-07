# Deciding, not defaulting: why the gate has eight lines

Research behind the ux-laws gate (SKILL.md section 4), gathered 2026-10-07
after "Upgrade plan" landed in a Settings card footer, where it read as that
card's own action. Every gate line passed as written, and the button was
still wrong. This file says what designers actually do before pixels, so
the gate is a design method rather than a form to fill in.

Confidence marks: **verified** means quoted from the fetched page;
**snippet** means seen only in a search result; **ours** means our own
inference or extension, not a published rule.

## 1. Agree the problem before judging the design

- NN/g on design critiques: "there must be agreement on the problem that
  needs to be solved", and critiques "can happen at any stage in a design
  process". Verified.
  <https://www.nngroup.com/articles/design-critiques/>
- Critique practice: the presenter should "state what problem they are
  solving, who is the target user, and what constraints exist". Snippet.
  <https://blog.uxtweak.com/design-critique/>

Gate lines: `Job:`, `Path:`, `Expectation:`.

## 2. A law's name is not a check

- NN/g: the ten heuristics are "rules of thumb and not specific usability
  guidelines". Verified.
  <https://www.nngroup.com/articles/ten-usability-heuristics/>
- Ours: writing "Common Region: passes" catches nothing. A law passes only
  when you can say how, in one clause about this change. That is why
  `Laws:` asks how each one passes, and why the corrected patterns
  (SKILL.md section 3) are concrete rules, not law names.

Gate line: `Laws:`.

## 3. Objects first, then the actions on them

- Object-Oriented UX: "The approach advocates designing objects before
  actions." "Calls to action (CTAs) are the main entry points to
  interaction flows." The order is user, then mental model (objects), then
  "Finally, I design the interactions." Verified.
  <https://alistapart.com/article/ooux-a-foundation-for-interaction-design/>
- OOUX's ORCA process: "objects, relationships, calls-to-action, and
  attributes"; CTAs are the actions users can perform on each object.
  Snippet. <https://sophiavux.medium.com/in-the-approach-to-ooux-that-i-teach-we-call-the-process-orca-e226dfdd015a>

Gate lines: `Objects:` then `Actions:` (action -> object it changes ->
container). The Upgrade-plan case: the action changes the workspace plan,
and it sat in a retention card. The object did not match the container.

## 4. A container's actions belong to its subject

- Material Design cards: "Cards should display content and actions on a
  single topic." Snippet (the page text did not load), moderate confidence.
  <https://m3.material.io/components/cards/guidelines>
- Microsoft Atlas card pattern: the footer "usually contains actions
  relevant to the card's subject". Snippet.
  <https://microsoft.github.io/atlas-design/patterns/card.html>
- Shopify Polaris: one primary call to action per card; calls to action at
  the bottom for next steps; persistent optional actions (Edit) in the
  upper right. Snippet, low to moderate confidence.
  <https://polaris-react.shopify.com/components/layout-and-structure/card>
- Ours: no source states "an action acts on its container's object" as a
  rule; it generalises Material and Atlas. A footer is a fine place for an
  action. The problem is a footer action whose object is not the card's.

Rule: SKILL.md section 3, "An action acts on the object of the container it
sits in", and the Common Region check in section 2.

## 5. Slop is a decision nobody made

- "The core failure mode of AI slop is missing context about why a change
  was made"; humans explain "tradeoffs, rejected alternatives, and
  constraints" in review. Snippet, about code.
  <https://www.aviator.co/blog/how-to-avoid-ai-code-slop/>
- AI design output "hurts when those constraints stay implicit"; a prompt
  for "modern" or "clean" with no constraints yields the most common
  pattern. Snippet. <https://managed-code.com/blog-post/ai-slop-in-design>
- NN/g on generative UI: "Humans will need to provide guidance and
  constraints for generative UI", framed as must show, should show, never
  show. Verified. <https://www.nngroup.com/articles/generative-ui/>
- Design rationale "aims to provide a record of the reasons behind design
  choices". Snippet.
  <https://www.sciencedirect.com/topics/computer-science/design-rationale>

Gate line: `Rejected:`. A design with no rejected alternative was
defaulted, not decided. When the owner gives no exact solution, the
alternatives you weighed and why one won are the decision.

## 6. Check the build against the intent, not fresh

- Design QA: "A missing reference is an unresolved question, not an
  automatic pass." "The primary action is visible and reachable in each
  reviewed state." Verified. <https://21st.dev/blog/design-qa-checklist>
- "Human review resolves intent and tradeoffs. A changed layout may be
  approved. An unchanged layout may still be confusing." Snippet.
  <https://21st.dev/blog/automated-design-qa>
- "Design Theater" (arXiv 2607.22928): generative UI tools state design
  reasoning they do not implement, about 25% of it. Unverified (the PDF
  was not read).
- Ours: no published checklist targets misplaced actions; the action check
  below is our own.

Post-build: re-read your gate against the built diff, line by line. For
each button or link, name the thing it changes and confirm it is the object
of the container it sits in. Report each as match or mismatch (the
front-end-developer Contract asks for this; the orchestrator's critic loop
re-checks it).

## Not found

How lawsofux.com says to apply the laws (the site lists them only); NN/g's
guidance on when to run a heuristic evaluation (404); a page-level vs
component-level action rule in GOV.UK, Apple HIG, Carbon or Atlassian.
