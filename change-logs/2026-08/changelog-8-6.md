# UI Changelog: 2026-08-06

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-5.md`](./changelog-8-5.md)

---

## Components

### The Ask AI scroll FAB rides the composer instead of a constant `37411b5`

**`ui/ask-ai-panel.tsx`** · **`ui/ask-ai-composer.tsx`** · **`ui/ask-ai-scroll-to-latest.tsx`**

The scroll-to-latest circle held a hard-coded `bottom`, which can only be right at ONE composer height. A field grown to its 4-line cap rose over the circle and covered it; a streaming reply, which shrinks the placeholder to one line, opened the gap to 44px.

- **`AskAiComposer` now hands up a `rootRef` on its SHELL** (not the textarea). The panel observes that box with a `ResizeObserver` and publishes its height as `--ask-ai-composer-h` on the canvas; the FAB sits at `calc(var(--ask-ai-composer-h) + 40px)` — the composer's 16px inset plus 24px of air. Measuring the shell means nothing has to know its 1px borders, 16px padding, 12px gap, or 32px actions row.
- **`useLayoutEffect` with a synchronous first write.** A `ResizeObserver` fires before paint, but it is *registered* in the effect, and a passive effect runs after the opening frame is already up: that frame would resolve the `calc()` against an unset variable, invalidate the declaration, and drop the FAB to its static position. For the same reason there is deliberately no fallback value in the `var()` — a fallback is the magic number coming back.
- **Measured 24px at every field height** (98 / 118 / 138 / 158px composer) in both themes, with the thread's turn-y constant throughout. The composer is out of flow, so a new value moves the circle and nothing else. Movement is instant, not animated: the field grows in whole 20px steps, and `bottom` is a layout property the `Button` recipe never transitions.
- Before: 44 / 24 / 24 / 4 / **-16** across those states, the -16 being the reported overlap.

### Light-mode dot grid eased to 0.7 `37411b5`

**`index.css`**

`--ask-ai-canvas-strength` (the texture mask's top stop) went 0.8 → 0.7 in light. The neutral-900 ink was carrying more weight than the texture needed on white. Dark is unchanged at 0.375.

---

## Sections

### Alerts is hidden from the nav `f7c6794`

**`layouts/nav-sections.ts`**

The Alerts surface stays built and routable at `/alerts` plus its `-default`/`-free` twins; only the sidebar entry is hidden until the surface is ready to show. Commented out rather than deleted, with the `BellRing` import beside it, so restoring is two lines. Manage reads Policies · Limits · Token Savings again.

### Account-management copy aligned to the AG-508 PRD `0656f0c`

**`pages/cancel-plan-dialog.tsx`** · **`pages/Settings.tsx`**

The cancel and delete flows carried one factual error and some verbosity; the PRD (AG-508) is now the source for their copy.

- **Correction — PAYG is forfeited, not refunded.** The delete flow said "your prepaid balance is refunded to the card on file"; the PRD is explicit that any remaining pay-as-you-go balance is **forfeited when the purge runs**, and that reversing during grace preserves the full balance. Fixed in both the Delete card subtext and the dialog's consequence bullet.
- **Delete dialog, tighter + fuller.** Intro now names the immediate suspend (keys stop working, no traffic passes) and the UI/email reversal path. The four consequence bullets trimmed to ~one line each while keeping purge scope (prompts, conversations, keys, provider accounts), forfeiture + no unused-day refund, retained fingerprinted Digital Evidence proofs + billing records, and the sole-owner org-teardown notice.
- **Cancel dialog.** Intro adds that renewal can be reactivated before the period ends; consequence bullet notes pruned data is not restored on a later upgrade. The billing period-end date takes the `type-label-14` voice + `text-foreground` so it stands out from the muted intro.

---
