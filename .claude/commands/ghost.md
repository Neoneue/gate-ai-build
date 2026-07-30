---
description: Rewrite prose so it reads as human-written. Strips AI tells (em dashes, signposting, hedges, balanced rhythm) without changing facts.
argument-hint: [the text to rewrite, or omit to use the most recent draft in context]
---

Rewrite the text below so it reads as if a competent human typed it in one
pass. Output ONLY the rewritten text. No preamble, no "here's the rewrite,"
no explanation of what you changed.

Text: $ARGUMENTS

## Scope guard, check this first

This is for prose a human will read as writing: emails, Slack messages,
social posts, landing-page copy, PR descriptions, release notes.

Do NOT apply it to code, commit messages, changelog entries, `design.md`,
`data-model.md`, `.claude/rules/*`, API docs, or anything where precision and
scannable structure beat voice. If the request targets one of those, say so in
one line and stop. Structure is a feature there, not a tell.

## Never change

Facts, numbers, names, dates, links, product claims, technical terms, and the
argument's actual position. This is a voice pass, not an edit pass. If a
sentence is wrong, leave it wrong and flag it in one line after the rewrite.

## The tells, in the order they give it away

1. **Em dashes.** Cut every one. Use a period, a comma, or restructure. Also
   watch the semicolon habit, which is the same reflex wearing a hat.
2. **Even rhythm.** The giveaway is not sentence length, it is the *variance*.
   AI writes 15, 17, 14, 16 words. Humans write 6, 31, 4, 22. Put a
   three-word sentence next to a long one. Let one run slightly too long.
3. **Signposting.** Delete "First," "Let me explain," "It's worth noting,"
   "In conclusion," "Importantly," "That said," and every sentence whose job
   is to announce the next sentence.
4. **Hedging.** Cut "somewhat," "arguably," "generally," "it could be argued,"
   "perhaps," "I think." State the thing. If it is genuinely uncertain, say
   why in plain words instead of softening the verb.
5. **The antithesis reflex.** "It's not X, it's Y." "This isn't about X, it's
   about Y." Kill on sight. Same for the rule of three used as decoration
   ("faster, cleaner, and more maintainable").

## Also strip

- Polite closers: "Hope this helps," "Let me know if you need anything else,"
  "Happy to clarify."
- Corporate vocabulary: delve, leverage, robust, seamless, elevate, unlock,
  landscape, journey, testament, tapestry, "in today's fast-paced."
- Symmetrical parallel structure across consecutive sentences.
- Abstractions where a concrete noun exists. "Solutions" is almost never the
  right word.

## Let it be imperfect

Contractions. Start a sentence with And or But. Trail off with a fragment.
End on the weaker of two available words if it sounds more like speech. The
target is a smart person typing quickly, not a polished draft.

Read the result out loud in your head. If any sentence sounds like it was
built rather than said, rewrite that one.
