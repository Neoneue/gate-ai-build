# Craft Checks — Verification Before Shipping

> **Reading order:** `craft-methodology.md` (1/5) → This file (2/5) → `design-process-rules.md` → `design-recipes.md` → `pre-ship-quality-checklist.md`

> Run these checks AFTER building, BEFORE presenting to the user. Every check has a specific thing to look for and a clear pass/fail. If any critical check fails, fix before showing. **Figma/Paper:** Run them against **`get_screenshot` output** (or exported preview) the same way you would for a web build.

> **Sources:** Dieter Rams' 10 Principles; NN/g eyetracking research; Helena Zhang "7 Principles of Icon Design" (uxdesign.cc); Material Design 3 guidelines (m3.material.io); Apple Human Interface Guidelines (developer.apple.com); WCAG 2.1 AA; NN/g "AI Design Tools Are Marginally Better" (nngroup.com).

---

## Why Checks Exist

Craft checks catch what the builder can't see. When you've spent 30 minutes constructing a card, you lose the ability to see it fresh. The checks force a structured second look — with specific questions that bypass your attachment to what you just built.

> "Good design is thorough down to the last detail. Nothing must be arbitrary or left to chance. Care and accuracy in the design process show respect towards the user." — Dieter Rams, Principle 8

---

## The Six Craft Checks

Run these against the screenshot of what you built. Each check is a specific question with a pass/fail answer.

### 1. The Swap Test

**Question:** If you swapped the typeface, layout, or color palette for your usual default, would anyone notice?

**How to evaluate:**
- Look at each section of the design independently
- Could this section exist in any product? (fail) Or does it reflect THIS product? (pass)
- Where swapping wouldn't matter = where you defaulted

**What to look for:**
- Generic card layouts that could be anything
- Section headers that could belong to any dashboard
- Button labels that could be in any app ("Submit," "Continue," "View")
- Spacing that's uniform everywhere (no grouping variation)

**Pass criteria:** At least 3 elements that would need to change if you moved this to a different product.

**Fail action:** Identify the generic elements. Add domain-specific markers from your domain exploration (Step 3 in the build recipe). Replace generic labels with product-specific ones.

---

### 2. The Squint Test

**Question:** Blur your eyes (or mentally defocus). Can you still perceive hierarchy?

**How to evaluate:**
- Look at the screenshot with unfocused eyes
- You should be able to identify 3 distinct visual weight tiers
- Nothing should jump out harshly — craft whispers

**What to look for:**
- Primary element should be unmistakably the heaviest
- Secondary should be clearly lighter than primary but heavier than tertiary
- Tertiary should recede into supporting context
- No two tiers should look the same weight

> Source: The squint test originates from fine art — painters use it to check value composition. In UI, it verifies that hierarchy works through contrast alone, independent of content comprehension.

**Pass criteria:** Three distinct visual weight levels visible when blurred. Primary is obvious.

**Fail action:** Increase contrast between tiers. Options: increase font size difference, increase weight difference (400 vs 700 instead of 400 vs 500), increase color contrast (foreground vs muted-foreground).

> Source: NN/g Visual Hierarchy — hierarchy through "multiple dimensions: size, weight, color, position, space." (nngroup.com/videos/visual-hierarchy/)

---

### 3. The Signature Test

**Question:** Can you point to specific elements where your product signature appears?

**How to evaluate:**
- Review the domain exploration from your planning phase
- Find the signature element you identified
- Count how many places it appears in the built design

**What to look for:**
- The signature element from domain exploration (Step 3) should be visible
- It should be organic to the design, not forced
- If you described it to someone without showing them the screen, they should know what product it's for

**Pass criteria:** At least one domain-specific element that couldn't exist in a generic interface.

**Fail action:** Go back to your domain exploration. Take the signature element and integrate it. This might be an icon (git branch icon for deployments), a badge (environment label), a data format (commit SHA in monospace), or a structural pattern (timeline for multi-step processes).

---

### 4. The Personality Test

**Question:** Does the spacing, density, and whitespace match system.md's Direction/Personality?

**How to evaluate:**
- Read the Direction section of system.md
- Compare the personality statement against what you see

**What to look for:**

| Personality says | Check for | Fail if |
|-----------------|-----------|---------|
| Precision & Density | Tight spacing (4-16px within sections), dividers carrying separation, minimal whitespace between related items | Generous gaps (24px+) between closely related elements, airy feel |
| Calm & Spacious | Generous whitespace (24-48px between sections), breathing room around all elements | Cramped layout, tight spacing, dense feel |
| Balanced & Professional | Middle-range spacing, neither cramped nor airy | Extremes in either direction |

**Pass criteria:** Overall feeling matches the stated personality. No section contradicts it.

**Fail action:** Adjust spacing to match personality. "Precision & Density" with 20px section gaps needs to come down to 16px. "Calm & Spacious" with 8px gaps needs to come up. Use dividers to carry separation when tightening spacing.

> Source: Nathan Curtis, "Space in Design Systems" — density can be offered in variants (cozy, compact, comfortable), and spacing decisions compound across the interface to create an overall feeling. (medium.com/eightshapes-llc/space-in-design-systems)

---

### 5. The Mobile Test

**Question:** Does a mobile variant exist? If not, has the user been asked?

**How to evaluate:**
- Check whether a mobile viewport variant was built alongside desktop
- If only desktop exists, acknowledge this explicitly

**What to look for:**
- Mobile is NOT desktop-shrunk. It's a different context with different priorities.
- Touch targets must be 44px minimum on mobile (Apple HIG)
- Primary actions belong in the thumb zone (bottom center of screen)
- Information hierarchy may need to change — less data visible, prioritized differently
- Navigation model changes — sidebar → bottom bar or hamburger

> Source: NN/g "The Negative Impact of Mobile-First Web Design on Desktop" — content dispersion on large screens increases cognitive load. The inverse is also true: desktop layouts compressed to mobile increases interaction cost. Each viewport needs its own hierarchy decisions. (nngroup.com/articles/content-dispersion/)

**Pass criteria:** Either a mobile variant exists, OR the design is explicitly documented as desktop-only with user acknowledgment.

**Fail action:** Build a mobile variant. Don't just shrink — re-prioritize. What's primary on desktop might become an expandable section on mobile. What's in a sidebar on desktop might become a bottom sheet on mobile.

---

### 6. The Thumb Test (mobile only)

**Question:** Can a human complete the primary task one-handed on a phone?

**How to evaluate:**
- Identify the primary action (the verb from your intent statement)
- Check whether the button/control for that action is in the thumb zone
- The thumb zone is the bottom center of the screen — the natural resting position

**What to look for:**
- Primary CTA not at the top of a scrollable page
- No critical actions requiring reach to the top corners
- Touch targets at 44px minimum
- Adjacent interactive elements have 8px+ spacing

> Source: Apple Human Interface Guidelines — "Place principal actions where the most easily reachable thumb area can reach them." Fitts's Law confirms: larger, closer targets are faster to reach. (developer.apple.com/design/human-interface-guidelines/)

**Pass criteria:** Primary action is reachable without hand repositioning.

**Fail action:** Move primary action to a sticky bottom bar or bottom sheet. This is standard for mobile — Vercel, Linear, and GitHub mobile all use bottom-anchored actions.

---

## Anti-Default Pattern Library

These are the fingerprints of AI-generated work from 2024-2025. If your output matches any of these, it will read as AI-generated. Check against this list.

### Visual Anti-Patterns

| Pattern | Why it's a tell | Fix |
|---------|----------------|-----|
| Purple-to-blue gradients | Every AI code generator defaults to this palette | Use the domain color world or the design system's actual tokens |
| Gradient text on headings | Decorative without meaning, overused | Plain text with hierarchy through weight/size is stronger |
| Dark mode with glowing accents | "Cool" without requiring design decisions | Achromatic with purposeful color (system.md approach) |
| Glassmorphism everywhere | Blur effects used decoratively, not purposefully | Use blur only for background dismissal (modals, sheets) per Apple HIG |
| Identical card grids | 3 or 4 cards with icon + heading + text, all same size | Vary card sizes by importance, or use list layouts |
| Hero metric layout | Big number + small label + supporting stats | Contextualize metrics — what does this number mean to the user? |
| Rounded rectangles with generic drop shadows | Safe and forgettable | Follow the system's specific shadow scale and radius tokens |
| Inter/Roboto/system defaults everywhere | No typographic personality | Use what system.md specifies — the decision was already made |

> Source: NN/g "AI Design Tools Are Marginally Better: Status Update" — AI tools produce "minor variations regardless of prompt length or context provided." (nngroup.com/articles/ai-design-tools-update-2/)

### Structural Anti-Patterns

| Pattern | Why it's a tell | Fix |
|---------|----------------|-----|
| Uniform spacing everywhere | No visual grouping, no hierarchy | Tight within groups, generous between — Gestalt proximity |
| Same padding on every component | "I used the first value I found" | Card padding, section padding, and page padding are different decisions |
| Labels and values at the same weight | No typographic hierarchy | Labels should be lighter/smaller than values — at least one tier difference |
| All buttons primary | No action hierarchy | One primary, others secondary/ghost/text — hierarchy matters for actions too |
| Empty states that just say "No data" | No guidance, no personality | Icon + explanation + CTA that guides the user to action |
| Navigation that's a hamburger on desktop | Hiding structure unnecessarily | Show navigation on desktop. Only collapse for mobile. |
| Buttons that never disable | Controls that can't act must look like they can't | Pagination Prev/Next at boundaries, Submit with invalid form, Undo with empty history — all must be `disabled`. Ask: "what state does this button have available right now?" If none, disable it. |

### Content Anti-Patterns

| Pattern | Why it's a tell | Fix |
|---------|----------------|-----|
| "Submit" / "Continue" / "Click here" | Generic labels that could be in any app | Use specific verbs: "Deploy to Production," "View Build Logs," "Rollback" |
| Lorem ipsum in any shipped state | Placeholder content signals unfinished work | Use realistic data that matches the domain |
| Repeated information | Header restating what the page title says | Every word must earn its place — remove duplication |
| "Welcome to [Product]" headings | Wastes primary real estate on a greeting | Lead with what the user needs to DO, not what the product is |

---

## The Identification Test

This is the meta-check. Run it last.

**Instruction:** Describe your design to someone who can't see it. Don't mention the product name.

"It's a card with an environment badge at the top, a status headline with a check icon, a commit message with a monospace SHA and git branch indicator, timing details, and two buttons — one for viewing logs and one for rolling back."

**Could they identify this as a deployment status card?** Yes — environment badge, commit SHA, git branch, rollback button are all domain-specific.

**Now try the generic version:** "It's a card with a title, a description, some metadata in a row, two data points side by side, and two buttons."

**Could they identify what this is for?** No — it could be anything.

If your description sounds like the generic version, go back to domain exploration.

---

## When to Run Which Checks

| Context | Required checks |
|---------|----------------|
| Building a new screen | All 6 + anti-pattern scan + identification test |
| Modifying an existing design | Squint test + personality test + anti-pattern scan |
| Adding a new section to a screen | Squint test + signature test |
| Building a mobile variant | Mobile test + thumb test + squint test |
| Quick component addition | Personality test + squint test |

---

## The Compression Test (from pre-ship-quality-checklist.md)

After all checks pass, ask:

```
□ Can anything be removed without losing information? If yes, remove it.
□ Does every visual element earn its place?
□ Is typography doing the hierarchy work, or are you relying on color/borders?
□ Could the layout be denser without losing clarity? (if personality says dense)
□ Is motion adding communication, or just decoration?
□ Would this look good in a screenshot without any interaction?
```

> "Good design is as little design as possible. Back to purity, back to simplicity." — Dieter Rams, Principle 10

---

## Common Failures and What They Look Like

### The "everything is 14px" problem
Body text, labels, secondary info, metadata — all the same size. The page reads as a wall of undifferentiated text.
**Fix:** Establish at least 3 distinct size tiers with visible difference between each.

### The "equidistant everything" problem
Every gap is the same. The page loses all grouping — nothing feels related, nothing feels separate.
**Fix:** Use Gestalt proximity — related items get smaller gaps, separate items get larger gaps.

### The "no personality" problem
The design is correct — right tokens, right hierarchy — but feels like it could be any product.
**Fix:** Domain exploration → signature element → integrate into the design.

### The "generous but dense" contradiction
system.md says "Precision & Density" but the spacing is 24px everywhere.
**Fix:** Read the personality. Dense = tight. Use 8-16px within sections, let dividers carry separation.

### The "icon decoration" problem
Icons added for visual interest without matching their meaning to the label's meaning.
**Fix:** Every icon must relate to the content it accompanies. A git branch icon next to "main" makes sense. A random arrow icon next to "main" does not.

> Source: Helena Zhang, "7 Principles of Icon Design" — "Clarity is the most important property of a great icon. An icon's job is to quickly convey a concept." (uxdesign.cc/7-principles-of-icon-design)

---

## Sources

- Dieter Rams, 10 Principles of Good Design (vitsoe.com/about/good-design)
- NN/g, Visual Hierarchy (nngroup.com/videos/visual-hierarchy/)
- NN/g, Proximity Principle (nngroup.com/articles/gestalt-proximity/)
- NN/g, Content Dispersion on Desktop (nngroup.com/articles/content-dispersion/)
- NN/g, AI Design Tools Update (nngroup.com/articles/ai-design-tools-update-2/)
- Apple Human Interface Guidelines (developer.apple.com/design/human-interface-guidelines/)
- Material Design 3 (m3.material.io)
- Helena Zhang, 7 Principles of Icon Design (uxdesign.cc/7-principles-of-icon-design)
- Nathan Curtis, Space in Design Systems (medium.com/eightshapes-llc/space-in-design-systems)
- Laws of UX (lawsofux.com)
- WCAG 2.1 AA

## Retrieval Queries

- Craft checks swap squint signature mobile thumb personality
- Anti-default patterns AI slop visual tells
- How to verify design quality before presenting
- Gestalt proximity grouping spacing hierarchy verification
- Mobile-first thumb test primary action placement
- Typography hierarchy verification squint test
- Design personality spacing constraints density whitespace
- Common design failures generic output sameness
- Dieter Rams thorough detail craft verification
- Anti-pattern library AI-generated interface tells
