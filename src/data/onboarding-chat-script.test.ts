import { describe, expect, it } from "vitest";
import {
  COMPUTER_PROMPT,
  isSetupLinkRequest,
  ONBOARDING_STARTER_PROMPTS,
  selectOnboardingReply,
} from "./onboarding-chat-script";

/* The phone demo's typed-or-tapped recognition (owner 2026-10-12): text
 * close to any of the three quick actions gets that chip's reply. */

const [WHAT_IS_CHIP, PROTECT_CHIP, SETUP_CHIP] = ONBOARDING_STARTER_PROMPTS;
const WHAT_IS = selectOnboardingReply(WHAT_IS_CHIP);
const PROTECT = selectOnboardingReply(PROTECT_CHIP);
const SETUP = selectOnboardingReply(SETUP_CHIP);
const CLAUDE = selectOnboardingReply("How do I use Gate with Claude Code?");
const FALLBACK = selectOnboardingReply("Write me a haiku");

describe("selectOnboardingReply", () => {
  it("gives each chip its own reply", () => {
    expect(new Set([WHAT_IS, PROTECT, SETUP, CLAUDE, FALLBACK]).size).toBe(5);
    expect(SETUP).toBe(COMPUTER_PROMPT.line);
  });

  it("recognises typed forms of chip 1, what Gate is", () => {
    for (const input of [
      "What is Gate AI?",
      "what is gate",
      "what's gate?",
      "Whats Gate",
      "what is gate ai",
      "What does Gate do?",
      "tell me about Gate",
      "explain gate",
      "How does Gate work?",
      "Gate AI?",
      "gate",
    ]) {
      expect(selectOnboardingReply(input), input).toBe(WHAT_IS);
    }
  });

  it("recognises typed forms of chip 2, what Gate protects", () => {
    for (const input of [
      "What will Gate protect for me?",
      "what does gate protect",
      "what will gate protect me from",
      "What does Gate protect against?",
      "is gate safe",
      "will Gate keep me safe?",
      "how does gate keep my messages secure",
      "Gate security",
      "what protection does gate give me",
    ]) {
      expect(selectOnboardingReply(input), input).toBe(PROTECT);
    }
  });

  it("recognises typed forms of chip 3, the setup link email", () => {
    for (const input of [
      "Email setup link",
      "email me the setup link",
      "send setup link",
      "send me the setup link",
      "setup email",
      "Send me the link",
      "e-mail the set up link",
      "setup link please",
    ]) {
      expect(selectOnboardingReply(input), input).toBe(SETUP);
      expect(isSetupLinkRequest(input), input).toBe(true);
    }
  });

  it("recognises chip 3's computer question and its synonyms", () => {
    for (const input of [
      SETUP_CHIP,
      "How do I use Gate on my computer?",
      "how do I use gate on my desktop",
      "can I use Gate on a laptop",
      "use gate on my computer",
    ]) {
      expect(selectOnboardingReply(input), input).toBe(SETUP);
      expect(isSetupLinkRequest(input), input).toBe(true);
    }
  });

  it("leaves Claude questions to the Claude Code reply", () => {
    for (const input of [
      "How do I use Gate with Claude Code?",
      "How do I use Claude Code on my computer?",
      "use claude on my laptop",
    ]) {
      expect(isSetupLinkRequest(input), input).toBe(false);
      expect(selectOnboardingReply(input), input).toBe(CLAUDE);
    }
  });

  it("does not read a computer word without use as chip 3", () => {
    for (const input of ["What is Gate AI on my computer?", "my laptop"]) {
      expect(isSetupLinkRequest(input), input).toBe(false);
    }
  });

  it("routes chip 3's re-send label to the setup link card", () => {
    expect(selectOnboardingReply(COMPUTER_PROMPT.resend)).toBe(SETUP);
    expect(isSetupLinkRequest(COMPUTER_PROMPT.resend)).toBe(true);
  });

  it("keeps Claude Code and the fallback", () => {
    expect(selectOnboardingReply("Can I use Claude with Gate?")).toBe(CLAUDE);
    for (const input of ["Write me a haiku", "hello", "email", "", "  "]) {
      expect(selectOnboardingReply(input), input).toBe(FALLBACK);
    }
  });

  it("does not read the other chips as the setup link", () => {
    for (const input of [WHAT_IS_CHIP, PROTECT_CHIP, "email", "send it"]) {
      expect(isSetupLinkRequest(input), input).toBe(false);
    }
  });
});
