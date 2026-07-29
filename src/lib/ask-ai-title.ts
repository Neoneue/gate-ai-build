import { selectTitle } from "@/data/ask-ai-script";

/* ─── Ask AI chat titles ────────────────────────────────────────────────────
 * A chat is named ONCE, from its first user message, at send time — so the
 * name is already on the trigger while the thinking row is still on screen.
 * Later turns never re-title.
 *
 * Two layers, in order:
 *   1. SCRIPTED (`selectTitle`) — a matched intent carries its own approved
 *      title next to its reply in `src/data/ask-ai-script.ts`.
 *   2. HEURISTIC (`heuristicTitle`) — everything else, derived from the
 *      question text. Deterministic and pure; no model, no network.
 * ────────────────────────────────────────────────────────────────────────── */

/** Conversational scaffolding that carries no meaning in a title. Compared
 *  lowercase against the head of the question and stripped, repeatedly, so
 *  "Can you please tell me about X" reduces the same as "How do I X". */
const LEADING_SCAFFOLDING = [
  "how do i",
  "how can i",
  "can you",
  "could you",
  "what is",
  "what's",
  "tell me about",
  "please",
  "help me",
];

/** Words kept from the (stripped) question. Longer names truncate at render
 *  time; this keeps the STORED title short enough to stay readable anywhere. */
const MAX_TITLE_WORDS = 6;

/**
 * Derive a title from raw question text.
 *
 * 1. Strip leading scaffolding (lowercase compare, repeated until none match).
 * 2. Strip trailing `?`, `.`, `!`.
 * 3. Sentence-case the first character.
 * 4. Cap at 6 words.
 *
 * "How do I rotate a key?" → "Rotate a key"
 */
export function heuristicTitle(input: string): string {
  let text = input.trim();

  // 1. Leading scaffolding, repeatedly — the compare is lowercase but the cut
  //    is taken from the ORIGINAL string so casing downstream is the user's.
  let stripped = true;
  while (stripped) {
    stripped = false;
    const lower = text.toLowerCase();
    for (const phrase of LEADING_SCAFFOLDING) {
      if (lower.startsWith(phrase)) {
        text = text.slice(phrase.length).trim();
        stripped = true;
        break;
      }
    }
  }

  // 2. Trailing punctuation.
  text = text.replace(/[?.!]+$/, "").trim();

  // A question made of nothing but scaffolding ("How do I?") strips to empty —
  // fall back to the original so a chat is never nameless.
  if (text.length === 0) {
    text = input
      .trim()
      .replace(/[?.!]+$/, "")
      .trim();
  }

  // 4. Word cap.
  const words = text.split(/\s+/).filter(Boolean).slice(0, MAX_TITLE_WORDS);
  text = words.join(" ");

  // 3. Sentence case (first character only — the rest keeps the user's casing
  //    so "Gate Connect" is not flattened).
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The title a new chat takes from its first user message: scripted if the
 *  script covers the intent, heuristic otherwise. */
export function deriveSessionTitle(input: string): string {
  return selectTitle(input) ?? heuristicTitle(input);
}

/** Longest title rendered in full on the picker trigger and its rows. */
const MAX_TITLE_CHARS = 40;

/**
 * Shorten a title for DISPLAY only — the stored title is never modified, and
 * the full text stays available in a `title` attribute. Cuts on a word
 * boundary so a name never breaks mid-word, and appends a real ellipsis.
 */
export function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_CHARS) {
    return title;
  }
  const head = title.slice(0, MAX_TITLE_CHARS);
  const lastSpace = head.lastIndexOf(" ");
  // No space in the window means one very long word — cut it hard rather than
  // return the whole thing.
  const cut = lastSpace > 0 ? head.slice(0, lastSpace) : head;
  return `${cut.replace(/[\s,;:]+$/, "")}…`;
}
