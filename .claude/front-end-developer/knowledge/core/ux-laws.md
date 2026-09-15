# The 30 Laws of UX — Reference

> **Source:** [lawsofux.com](https://lawsofux.com) — curated by Jon Yablonski. Definitions below are verbatim from that site unless marked `[interp]` for interpretation. Primary academic citations follow each entry.

> **How to use this file:** This is a decision-support reference, not a reading assignment. When you're about to add an element, change a layout, pick a color, or make any UI call — scan the theme that governs the decision, read the 2-3 relevant laws, and apply. The Pre-flight Checklist at the bottom is for use before every Paper or Figma write.

> **Reading order:** `craft-methodology.md` → `craft-checks.md` → `design-process-rules.md` → `ux-methodology.md` → **This file** → `design-recipes.md` → `pre-ship-quality-checklist.md`

---

## How the laws cluster

Reference by **decision type**, not alphabetical:

| When you're deciding... | Consult these laws |
|---|---|
| How to group related content | Gestalt Grouping (1–5) |
| Whether you're overloading the user | Memory & Cognition (6–10) |
| Whether something stands out for the right reason | Attention & Emphasis (11–14) |
| Whether to add or cut a feature / element / option | Choice & Simplicity (15–19) |
| How to keep users engaged through a flow | Motion Toward Goals (20–23) |
| Whether your UI matches expectations | Expectations & Mental Models (24–26) |
| How responsive and reachable things feel | Time, Space & Feedback (27–29) |
| How tolerant the system is of messy input | Robustness (30) |

---

## 1–5 · Gestalt Grouping

How the eye perceives structure before it reads content.

### 1. Law of Proximity
**Def:** Objects that are near, or proximate to each other, tend to be grouped together.
**Use it when:** spacing forms, layouts, list rows, labels/inputs — the closest elements read as related.
**Anti-pattern:** uniform spacing everywhere (labels equidistant between two inputs; cards as tightly packed internally as they are between each other).
**Source:** Wertheimer (1923); [lawsofux.com/law-of-proximity](https://lawsofux.com/law-of-proximity/).

### 2. Law of Similarity
**Def:** The human eye tends to perceive similar elements as a complete picture, shape, or group, even if those elements are separated.
**Use it when:** styling peers — buttons, tags, avatars, nav items. If two things do the same job, they must look the same. If they do different jobs, they must look different.
**Anti-pattern:** mixed grammars within a single column (gradient avatar for person, flat circle for org, arrow button for system) — the peer relationship breaks. `[this is exactly what I did wrong in the dashboard feed]`
**Source:** Gestalt psychologists, early 1900s; [lawsofux.com/law-of-similarity](https://lawsofux.com/law-of-similarity/).

### 3. Law of Common Region
**Def:** Elements tend to be perceived into groups if they are sharing an area with a clearly defined boundary.
**Use it when:** you need a structural group — card, panel, fieldset, tinted section. A shared background or border is a stronger grouping signal than proximity alone.
**Anti-pattern:** nested cards-in-cards; heavy borders on every element so nothing reads as grouped; a "group" container that spans unrelated content.
**Source:** Palmer (1992); [lawsofux.com/law-of-common-region](https://lawsofux.com/law-of-common-region/).

### 4. Law of Uniform Connectedness
**Def:** Elements that are visually connected are perceived as more related than elements with no connection.
**Use it when:** drawing relationships between items that aren't adjacent — arrows in flow diagrams, connector lines between steps, shared background across non-contiguous cells.
**Anti-pattern:** related fields scattered across a page with no shared border, background, or connector; a single visible container wrapping unrelated content.
**Source:** Gestalt grouping family; [lawsofux.com/law-of-uniform-connectedness](https://lawsofux.com/law-of-uniform-connectedness/).

### 5. Law of Prägnanz (Simplicity)
**Def:** People will perceive and interpret ambiguous or complex images as the simplest form possible, because it is the interpretation that requires the least cognitive effort of us.
**Use it when:** designing icons, logos, hero graphics, card compositions — resolve to one unified silhouette, not a pile of shapes.
**Anti-pattern:** fragmented compositions where the user's eye has to work to figure out what is "one thing"; overly detailed icons at small sizes.
**Source:** Wertheimer (1910); [lawsofux.com/law-of-prägnanz](https://lawsofux.com/law-of-prägnanz/).

---

## 6–10 · Memory & Cognition

The invisible cost. Every element on screen spends mental resources.

### 6. Cognitive Load
**Def:** The amount of mental resources needed to understand and interact with an interface.
**Use it when:** deciding what to add or remove. **Intrinsic** load comes from the task itself (can't reduce). **Extraneous** load is what bad design adds (eliminate). **Germane** load is learning the system (minimize via consistency).
**Anti-pattern:** decoration that doesn't communicate; inconsistent patterns across screens; 8 competing CTAs on one page.
**Source:** Sweller (1988); [lawsofux.com/cognitive-load](https://lawsofux.com/cognitive-load/).

### 7. Miller's Law
**Def:** The average person can only keep 7 (plus or minus 2) items in their working memory.
**Use it when:** sizing nav groups, dropdowns, filter chips, dashboard stat rows. The site explicitly warns: **don't** use 7±2 as a hard cap — use it as a guide to chunk.
**Anti-pattern:** 30 unlabeled filter toggles in a flat row; 40-item dropdown; forcing the user to do the chunking work.
**Source:** Miller (1956), *The Magical Number Seven*; [lawsofux.com/millers-law](https://lawsofux.com/millers-law/).

### 8. Chunking
**Def:** A process by which individual pieces of an information set are broken down and then grouped together in a meaningful whole.
**Use it when:** formatting phone numbers, card numbers, long forms, nav lists. Structure content into visually distinct groups so the user doesn't chunk manually.
**Anti-pattern:** phone number as `5551234567` instead of `(555) 123-4567`; 40-field form with no section headings.
**Source:** Miller (1956); [lawsofux.com/chunking](https://lawsofux.com/chunking/).

### 9. Working Memory
**Def:** A cognitive system that temporarily holds and manipulates information needed to complete tasks.
**Use it when:** designing any multi-step flow, comparison view, or wizard. Capacity is ~4–7 chunks fading in 20–30 seconds. Recognition beats recall — transfer the memory burden to the system (sticky summaries, persistent breadcrumbs, visited-link styling).
**Anti-pattern:** wizards that hide previous steps; modals that cover the context the user was reading and expect them to remember it.
**Source:** Miller, Galanter, Pribram (1960s); Atkinson & Shiffrin (1968); [lawsofux.com/working-memory](https://lawsofux.com/working-memory/).

### 10. Serial Position Effect
**Def:** Users have a propensity to best remember the first and last items in a series.
**Use it when:** ordering nav items, feature lists, onboarding sequences. Put critical items at the ends, not the middle.
**Anti-pattern:** burying primary CTA mid-navigation; hiding the strongest proof point in the middle of a feature list.
**Source:** Ebbinghaus, late 19th century; [lawsofux.com/serial-position-effect](https://lawsofux.com/serial-position-effect/).

---

## 11–14 · Attention & Emphasis

What the eye lands on, and what it skips.

### 11. Von Restorff Effect (Isolation Effect)
**Def:** When multiple similar objects are present, the one that differs from the rest is most likely to be remembered.
**Use it when:** highlighting one primary CTA, one recommended pricing tier, one destructive action. **Restraint is the mechanism** — one thing standing out works only because everything else is uniform.
**Anti-pattern:** every button primary; every card with a badge; over-emphasis that reads as noise or banner-ad decoration. `[this is what my colored-gradient avatars did — everyone emphasized = no one emphasized]`
**Source:** Hedwig von Restorff (1933); [lawsofux.com/von-restorff-effect](https://lawsofux.com/von-restorff-effect/).

### 12. Selective Attention
**Def:** The process of focusing our attention only to a subset of stimuli in an environment — usually those related to our goals.
**Use it when:** designing hero sections, promos, announcements, in-app banners. **Banner blindness** is real — don't style important content like an ad. **Change blindness** is real — significant changes need visible cues or users miss them.
**Anti-pattern:** hero images that look like carousel ads; three simultaneous animations on a state change (nothing registers); promos dressed as notifications.
**Source:** Cherry (1953), Broadbent (1958), Treisman (1960); [lawsofux.com/selective-attention](https://lawsofux.com/selective-attention/).

### 13. Aesthetic-Usability Effect
**Def:** Users often perceive aesthetically pleasing design as design that's more usable.
**Use it when:** investing craft effort. Polish in onboarding, empty states, and first impressions buys forgiveness for edge-case issues. But beware: beauty can mask real usability defects so testers don't surface them.
**Anti-pattern:** utilitarian UI that tests worse than it works because users pre-decide it's hard; conversely, a beautiful shell that hides broken flows.
**Source:** Kurosu & Kashimura, Hitachi (1995); [lawsofux.com/aesthetic-usability-effect](https://lawsofux.com/aesthetic-usability-effect/).

### 14. Cognitive Bias
**Def:** A systematic error of thinking or rationality in judgment that influence our perception of the world and our decision-making ability.
**Use it when:** designing defaults, pricing anchors, copy framing ("don't lose progress" > "save progress"). Also: when *reviewing your own work* — run tests with people outside your echo chamber to counter confirmation bias.
**Anti-pattern:** weaponizing bias as a dark pattern (fake urgency timers, pre-checked paid add-ons); or designers only showing prototypes to people who already like the direction.
**Source:** Tversky & Kahneman (1972); [lawsofux.com/cognitive-bias](https://lawsofux.com/cognitive-bias/).

---

## 15–19 · Choice & Simplicity

When to add, when to cut, and who absorbs the complexity.

### 15. Hick's Law
**Def:** The time it takes to make a decision increases with the number and complexity of choices.
**Use it when:** sizing choice sets — pricing tiers, payment options, settings toggles, filter options. Break complex tasks into steps; highlight a recommended default to anchor.
**Anti-pattern:** mega-menus with 60+ links; checkout with ten payment methods and no default; radio group with 15 options where 3 would suffice.
**Source:** Hick (1952), Hyman (1953); [lawsofux.com/hicks-law](https://lawsofux.com/hicks-law/).

### 16. Choice Overload
**Def:** The tendency for people to get overwhelmed when they are presented with a large number of options.
**Use it when:** surfacing catalogs, product lists, feature menus. Enable side-by-side comparison for decisions that genuinely need it; otherwise, prioritize (featured, recommended) and hide the rest behind filter/search.
**Anti-pattern:** showing every SKU at equal visual weight; pricing pages with 8 tiers and no "best value" anchor; settings exposing every toggle at the top level.
**Source:** Toffler (1970), *Future Shock*; [lawsofux.com/choice-overload](https://lawsofux.com/choice-overload/).

### 17. Pareto Principle (80/20)
**Def:** Roughly 80% of the effects come from 20% of the causes.
**Use it when:** prioritizing what to ship, what to surface in primary nav, what to optimize first. The 20% of features driving 80% of usage get primary position; the rest moves to "More."
**Anti-pattern:** every feature at equal weight in navigation; roadmaps that allocate effort evenly across requests instead of weighting by impact.
**Source:** Pareto (late 1800s), generalized by Juran; [lawsofux.com/pareto-principle](https://lawsofux.com/pareto-principle/).

### 18. Tesler's Law (Conservation of Complexity)
**Def:** For any system there is a certain amount of complexity which cannot be reduced.
**Use it when:** deciding who absorbs a hard part — designer/engineer during build, or user at runtime. **Carry the burden yourself.** An hour of your work saves a million user-seconds.
**Anti-pattern:** shipping a "flexible" form with 20 optional fields because "the user can decide"; making users pick "Basic" vs "Advanced" on first run. `[redundant type-icon + tag pushed complexity to user here]`
**Source:** Larry Tesler at Xerox PARC (mid-1980s); [lawsofux.com/teslers-law](https://lawsofux.com/teslers-law/).

### 19. Occam's Razor
**Def:** Among competing hypotheses that predict equally well, the one with the fewest assumptions should be selected.
**Use it when:** auditing a design for decoration. Remove each element; if the user loses nothing concrete, the element was decoration.
**Anti-pattern:** adding an "advanced" mode when basic mode suffices; three-sentence help copy for a self-evident field; a gradient where a flat fill would communicate the same thing. `[this is the rule from design-process-rules step 6 — "if you can't explain what it communicates, delete it"]`
**Source:** William of Ockham (c. 1287–1347); [lawsofux.com/occams-razor](https://lawsofux.com/occams-razor/).

---

## 20–23 · Motion Toward Goals

Why users start, keep going, and finish.

### 20. Goal-Gradient Effect
**Def:** The tendency to approach a goal increases with proximity to the goal.
**Use it when:** designing progress indicators, onboarding checklists, loyalty programs. Artificial endowed progress (start at "2 of 10 done" instead of 0) pulls users forward.
**Anti-pattern:** invisible progress on long forms; checklists that start at 0/10 with no head start; stalling the last step breaks the gradient entirely.
**Source:** Hull (1932); Kivetz, Urminsky & Zheng (2006); [lawsofux.com/goal-gradient-effect](https://lawsofux.com/goal-gradient-effect/).

### 21. Zeigarnik Effect
**Def:** People remember uncompleted or interrupted tasks better than completed tasks.
**Use it when:** creating pull to finish — partial content previews, article teasers, form step indicators, onboarding checklists. Zeigarnik's original research showed ~90% better recall for interrupted tasks.
**Anti-pattern:** hiding remaining steps (user doesn't know closure is reachable); checklists with no visible percentage or count.
**Source:** Bluma Zeigarnik (1927); [lawsofux.com/zeigarnik-effect](https://lawsofux.com/zeigarnik-effect/).

### 22. Flow
**Def:** The mental state in which a person performing some activity is fully immersed in a feeling of energized focus, full involvement, and enjoyment in the process of the activity.
**Use it when:** designing tools for skilled/repeat users (IDEs, design tools, triage UIs). Match task difficulty to user skill. Reduce friction. Keyboard-first where productivity compounds.
**Anti-pattern:** confirmation modals during creative actions; forced tutorials that interrupt experts; 800ms transitions that stall momentum.
**Source:** Csíkszentmihályi (1975); [lawsofux.com/flow](https://lawsofux.com/flow/).

### 23. Parkinson's Law
**Def:** Any task will inflate until all of the available time is spent.
**Use it when:** building any time-cost-to-user interaction. Autofill, smart defaults, passkeys, saved addresses, inline validation all beat the user's expected time budget — which is the actual UX win.
**Anti-pattern:** long forms with no autofill or field memory; required fields that could be inferred (country from IP, timezone from browser).
**Source:** Cyril Northcote Parkinson (1955); [lawsofux.com/parkinsons-law](https://lawsofux.com/parkinsons-law/).

---

## 24–26 · Expectations & Mental Models

What users bring with them, not what you teach them.

### 24. Jakob's Law
**Def:** Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know.
**Use it when:** picking patterns — cart icon top-right, logo top-left, underlined links, hamburger on mobile. Novel patterns cost users relearning time; they spend that cost reluctantly.
**Anti-pattern:** reinventing dropdowns that break keyboard nav; custom scrollbars that hijack native behavior; gesture-only web navigation. `[inventing my own actor-column grammar violated this]`
**Source:** Jakob Nielsen (2000), "End of Web Design"; [lawsofux.com/jakobs-law](https://lawsofux.com/jakobs-law/).

### 25. Mental Model
**Def:** A compressed model based on what we think we know about a system and how it works.
**Use it when:** naming, iconography, flow shape. A trash icon means delete. A cart icon means pending purchase. A floppy disk means save. Users expect these — match them, don't fight them. Close the gap between your internal model and theirs through research (interviews, journey maps, empathy maps).
**Anti-pattern:** custom checkout that hides the cart; a "Commit" label where "Save" is expected; swipe-to-archive wired to permanent delete.
**Source:** Kenneth Craik (1943); [lawsofux.com/mental-model](https://lawsofux.com/mental-model/).

### 26. Paradox of the Active User
**Def:** Users never read manuals but start using the software immediately.
**Use it when:** designing onboarding, help, feature discovery. Embed guidance inline at the moment of need — not in a pre-roll modal, not in a Help Center users won't visit.
**Anti-pattern:** multi-step welcome modals that block usage; feature tours no one completes; wall-of-text READMEs assumed to be read before use.
**Source:** Rosson & Carroll at IBM (1987); [lawsofux.com/paradox-of-the-active-user](https://lawsofux.com/paradox-of-the-active-user/).

---

## 27–29 · Time, Space & Feedback

Physical and temporal qualities of the interaction.

### 27. Fitts's Law
**Def:** The time to acquire a target is a function of the distance to and size of the target.
**Use it when:** sizing touch targets and placing actions. Minimum 44×44 mobile / 24×24 desktop. Primary actions near the user's current attention. Destructive actions small and far from primary. Screen edges and corners are effectively infinite size.
**Anti-pattern:** 12×12 close icons; Save and Delete 4px apart; a mobile CTA sized for a desktop mouse. `[12×12 kebab menu + 22×22 arrow buttons in my dashboard violated this]`
**Source:** Paul Fitts (1954); [lawsofux.com/fittss-law](https://lawsofux.com/fittss-law/) *(note: URL has double 's' — the single-'s' form 404s)*.

### 28. Doherty Threshold
**Def:** Productivity soars when a computer and its users interact at a pace (<400ms) that ensures that neither has to wait on the other.
**Use it when:** designing feedback for every interactive element. Instant press states, skeletons within 100ms, optimistic UI updates, streaming over blank pages. Occasionally add *intentional* delay where instant feels cheap (AI "thinking," security scans) to build trust.
**Anti-pattern:** blank white screens during loading; buttons with no pressed state; spinners without progress estimates on long tasks.
**Source:** Doherty & Thadani, IBM (1982); [lawsofux.com/doherty-threshold](https://lawsofux.com/doherty-threshold/).

### 29. Peak-End Rule
**Def:** People judge an experience largely based on how they felt at its peak and at its end, rather than the total sum or average of every moment of the experience.
**Use it when:** designing emotional moments — payment success, send confirmation, task completion, error recovery. Treat the peak and the end as craft investments; middle moments can be utilitarian.
**Anti-pattern:** abrupt "Success" text after a high-stakes action; ending a long onboarding with "…now go figure it out"; error messages at the peak moment instead of inline prevention earlier.
**Source:** Kahneman, Fredrickson, Schreiber, Redelmeier (1993); [lawsofux.com/peak-end-rule](https://lawsofux.com/peak-end-rule/).

---

## 30 · Robustness

What the system accepts, and how it behaves when input is imperfect.

### 30. Postel's Law (Robustness Principle)
**Def:** Be liberal in what you accept, and conservative in what you send. (Original: "TCP implementations should follow a general principle of robustness: be conservative in what you do, be liberal in what you accept from others.")
**Use it when:** designing inputs — dates, phone numbers, emails, search, URLs. Accept messy input, normalize it, don't punish the user for whitespace or capitalization or format variation.
**Anti-pattern:** "invalid format" on a phone number that needed spaces stripped; case-sensitive email login; search that returns zero results for one misspelled letter.
**Source:** Jon Postel, RFC 760/761 (c. 1980); [lawsofux.com/postels-law](https://lawsofux.com/postels-law/).

---

## Pre-flight Checklist — Apply Before Every UI Write

Before any `write_html`, `update_styles`, `use_figma`, or code commit that changes UI, run these five questions. They map to the laws most commonly violated in practice:

1. **Similarity (Law 2):** For every visual treatment I'm using, are elements with the same *role* getting the same *appearance*? If two things look different, is there a semantic reason?

2. **Von Restorff (Law 11):** I'm about to emphasize something. Is it the *only* thing emphasized in this view? If three things are "important," none of them will be.

3. **Tesler (Law 18) + Occam (Law 19):** For every element I'm adding, can I explain what it communicates in one sentence? If not — or if the system could handle it instead of the user — delete or absorb.

4. **Jakob (Law 24) + Mental Model (Law 25):** Does this pattern match what users already know from Linear, Stripe, GitHub, Apple, their own OS? If I'm inventing something, is the invention justified by a task that existing patterns can't solve?

5. **Fitts (Law 27) + Doherty (Law 28):** Are interactive targets ≥24px (desktop) / ≥44px (mobile)? Does every action give feedback in <400ms? Destructive actions far from primary ones?

If any answer is "no" or "I don't know," stop the write and fix it before proceeding.

---

## Sourcing Notes

- **Definitions** are verbatim from [lawsofux.com](https://lawsofux.com), fetched April 2026.
- **Takeaways** are paraphrased from the site's Takeaways sections, condensed to one-sentence "Use it when" guidance.
- **Anti-patterns** combine failure modes described on lawsofux.com with standard HCI practice (NN/g, Interaction Design Foundation, Smashing Magazine). Not every anti-pattern is explicit on the law's page.
- **Weber's Law** is *not* on lawsofux.com and was excluded here. If Weber's Law guidance is needed, consult Nielsen Norman Group or Jeff Johnson's *Designing with the Mind in Mind*.
- **Source URL quirks:** Fitts's Law uses a double-'s' (`fittss-law`). Prägnanz uses the actual umlaut character (URL-encoded `%C3%A4`).

## Retrieval Queries

- 30 Laws of UX reference grouped by theme
- When to add or cut a design element cognitive load decoration rule
- Gestalt grouping proximity similarity common region uniform connectedness
- Attention emphasis Von Restorff selective attention aesthetic usability
- Choice overload Hick's Law Tesler Occam's Razor simplicity
- Progress motivation goal gradient Zeigarnik flow Parkinson
- Mental model Jakob's Law paradox of active user expectations
- Fitts Doherty Peak-End feedback time response
- Postel's Law robustness input tolerance
- UX pre-flight checklist Similarity Von Restorff Tesler Jakob Fitts
