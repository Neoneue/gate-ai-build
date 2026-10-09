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
