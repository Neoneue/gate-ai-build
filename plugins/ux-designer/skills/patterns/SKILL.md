---
name: patterns
description: Tested UI patterns organised by the user's job, each with when to use, when not, the rule, anti-patterns, evidence and a check. Read the entries that match the surface before choosing a layout, and cite the entry in the spec's Precedent line.
---

# Patterns

Each entry is one user job. Read the entries that match the surface you are
designing, follow the Rule, and run the Check before handing the spec on. Cite
the entry by file name in the spec's Precedent line. Evidence lines name what
was fetched; a rule marked "rule of this library" has no external source.

| Job | File | One-line rule |
| --- | --- | --- |
| Read the facts about one object | `key-value-details.md` | Label-value rows by default; a card per object only when several objects or block actions share the surface. |
| See a setting I cannot change | `locked-setting.md` | Value as text, one line on why and what unlocks it, one action on the setting's own surface; no disabled input. |
| Enter a value inside a limit | `limit-and-ceiling.md` | State the range at rest once; let users type past it; the error names the range and the higher-limit path appears beside it. |
| Learn what a higher plan unlocks | `upgrade-prompts.md` | The upgrade sits on the locked thing and names the next plan, not every plan; no page-wide banners for local locks. |
| Name a card, section or field | `titles-and-labels.md` | Short noun phrases, sentence case, the object named once per region, labels name the setting not its state. |
| Read each fact once | `one-home-per-value.md` | Every value has one home per surface; helper, readout, error and dialog each add something new. |
| See what matters now, the rest when I ask | `progressive-disclosure.md` | At rest only what most users need; detail on interaction, on error or behind one labelled trigger, two levels at most. |
| Notice something important on the page | `page-banners-and-inline-notices.md` | At most one page banner; messages about a thing live on that thing; tone matches the stakes. |
| Confirm an action I cannot undo | `destructive-confirmation.md` | Title names action and object, body adds facts once, buttons say verb and object; no confirm for undoable or routine actions. |
| Change one setting | `settings-field-row.md` | Label and helper left, control right; one-sentence helper; error below the helper without repeating it; one save model. |
| Check the headline numbers at a glance | `stat-summary.md` | Three to five tiles that change what the user does, from the same data and range as the table or chart below. |
| Fix what I entered wrong | `form-errors.md` | At the field, say what is wrong and how to fix it, keep the input, validate on leave, remove when fixed. |
| Act on the right object | `action-placement.md` | An action sits in the container whose object it changes; one primary; destructive quiet; same place everywhere; verb plus object labels. |
| Scan and compare rows in a table | `table-rows.md` | Human name first, numbers right-aligned, no wrapping or truncated essentials, rows that open look selectable. |
| Know whether data is empty, loading or zero | `empty-and-loading.md` | Skeleton the value and keep the chrome; empty only after loading; say the next action; never fake zeros. |
| Trust the numbers | `numbers-you-can-trust.md` | One source per value, real data only, one format per measure, bars and lines rather than angles. |
| Read the page in the right order | `reading-order.md` | One element leads, muted supporting text, one alignment edge per list, proximity shows grouping, a tested layout. |
| Type a value into a field | `enter-a-value.md` | A visible label, never a placeholder label; field width fits the value; a safe default preselected. |
| Finish a short task in a dialog | `dialogs.md` | Detail is a page, not a modal; one task per dialog; 24px above the footer buttons. |
| Read copy that earns its place | `ux-copy.md` | Say only what the surface does not show; what the user gets, not how it works; cause and fix in errors. |
| Use it without color or a mouse | `accessible-states.md` | Color plus a word; nothing interactive in a tooltip; nothing clipped by its container. |
