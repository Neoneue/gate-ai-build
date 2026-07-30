# UI Changelog: 2026-07-30

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-29.md`](./changelog-7-29.md)

---

## Conventions

*No convention-level changes today.*

## Components

### Ask AI canvas — the dark dot grid was carrying too much texture `7916c53`

**`index.css`**

Retuned in place against the live panel, one day after the 7-29 pass. The two grounds are not symmetric and the light twin was the one that needed weight; dark had been left too hot at the same stops, so light `neutral-200` dots on the `neutral-900` panel competed with the thread instead of sitting behind it.

- **`--ask-ai-canvas-strength` 0.6 → 0.3 in dark only.** Light stays at 0.8. Walked down in 0.1 steps in the browser — the same ladder the token has always been tuned on.
- **`--ask-ai-canvas-fade-floor` goes per-theme, 0.15 → 0.05 in dark.** It had been deliberately shared across both themes, with only the top stop varying; that is no longer true and the comment at the definition says so. A **lower** floor is a **stronger** fade, so the dark grid nearly dissolves at the bottom of the panel rather than holding the legible trace light mode wants. Light is unchanged at 0.15.
- **No new consumers.** Both fade stops in `.ask-ai-canvas` already read the token through `var()`, so the dark override cascades with no change to the utility.

### Ask AI empty state — the support suggestion read as a command `7916c53`

**`ask-ai-empty-state.tsx`**

The fourth `SUGGESTIONS` chip said **"Help contact customer support"** and now says **"Help contacting customer support"**. The label is sent verbatim as the first user message, so it has to read as something a person would type; the old phrasing parsed as an imperative aimed at the agent. Nothing else references the string.

## Sections

*No section-level changes today.*
