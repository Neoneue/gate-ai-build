---
name: on-screen-copy
description: Write and size on-screen text so every line reads before the cut - a characters-per-second budget against hold time, plus headline, stat line, label and CTA patterns - and record it in BRIEF.md Words.
---

# On-screen copy

## The budget: hold time >= reading time

A viewer reads a line only while it is fully on screen and still. For each
line:

- **Characters** = every character including spaces.
- **Readable hold** = seconds the line is fully in and not moving fast
  (exclude its entrance and exit). The animator's cut list gives this.
- **Reading time** = characters / reading rate.

Reading rate: subtitle standards are the reference. The Netflix Timed Text
Style Guide sets a maximum subtitle reading speed in characters per second;
check the current figure for the audience and language before relying on it.
Display type in motion is harder to read than subtitles (it moves, it
competes with picture, the viewer does not know where it will appear), so
budget well under that maximum, and add time for numbers and unfamiliar
names. When in doubt, cut words rather than ask for hold.

Record per line in § Words: scene, line, characters, readable hold, reading
time at your chosen rate, and "reads in time? yes/no".

## Patterns

- **Headline:** one idea, the noun the viewer remembers early in the line.
- **Stat line:** the number big, its unit and meaning short; a number needs
  its own beat before the label lands. The number comes from the product file
  with a source.
- **Label / kicker:** 1 to 3 words, names a section, never a sentence.
- **CTA / end frame:** one action or one name plus one URL or date; the
  longest hold in the piece.
- **Sound off:** where the piece autoplays muted, the words alone must carry
  the one message.

## Check

1. Every line in § Words has a "reads in time" yes, or a flag to the
   storyboard-artist and creative-director asking for hold time.
2. After build, view the snapshots at each line's hold: the line is fully
   visible, legible at its size, and not fighting a moving background.
3. Run `humanizer` over the final set.
