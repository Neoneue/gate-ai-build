import { CircleCheck, Copy, Loader2, Mail } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  COMPUTER_PROMPT,
  estimateTokens,
  LOGGED_NOTE,
  ONBOARDING_TIMING,
} from "@/data/onboarding-chat-script";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { cn } from "@/lib/utils";
import { formatExactUsd } from "@/pages/chat/chat-data";
import { CHAT_TOUCH_TARGET } from "@/pages/chat/chat-layout";
import { ChatProse } from "@/pages/chat/chat-prose";
import { CHAT_COPY } from "@/pages/chat/copy";
import type { ChatLane, ChatUsage } from "@/pages/chat/types";
import { OnboardingChatLaneHeader } from "@/pages/onboarding/onboarding-chat-message";
import {
  onboardingChatStore,
  useOnboardingChatStore,
} from "@/pages/onboarding/onboarding-chat-store";
import { OnboardingChatUsageRow } from "@/pages/onboarding/onboarding-chat-usage-row";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/** How long the inline "Copied" confirmation holds (chat-message.tsx). */
const COPY_HOLD_MS = 3000;

/**
 * The agent's two follow-up replies after its first answer, Mobile A only
 * (owner 2026-10-12: "extra replies from the agent"): first where the
 * message is logged (PRD phone step 3, "shows up on Activity and
 * Messages"), then the computer offer with its email button (PRD phone
 * step 4). Each is drawn as the reply card (`ChatLaneCard`,
 * chat-message.tsx, copied here since that file is shared with the desktop
 * chat): the same model header and time (`OnboardingChatLaneHeader`, the
 * onboarding message copy's, which wraps at 200%), the usage row (MOCK tokens, the
 * free model's $0.00) and Copy. No Regenerate: a scripted follow-up has
 * nothing to redo. A mockup: the email is a toast. Rendered inside the
 * thread (`onboarding-chat-thread.tsx`) right after the turn it follows, so a
 * later turn lands below it.
 */
export function OnboardingComputerPrompt({
  className,
  lane,
  prompt,
  showOffer = true,
}: {
  className?: string;
  /** The first reply, for its model, time and text. */
  lane: ChatLane;
  prompt: string;
  /** False when the first message already asked for the setup link: its
   *  reply is the offer card, so only the logged note follows. */
  showOffer?: boolean;
}) {
  // The model reads the conversation so far, so each follow-up's input is
  // everything before it.
  const loggedIn = `${prompt} ${lane.body}`;
  const offerText = `${COMPUTER_PROMPT.line} ${COMPUTER_PROMPT.button}`;

  return (
    // `relative`, as ChatThread's wrapper: the canvas dots
    // (`.ask-ai-canvas::before`) are positioned and paint over anything that
    // is not, which let them show through the cards. The thread's column
    // already carries the measure.
    <div className={cn("relative flex flex-col gap-3", className)}>
      <FollowUpCard
        copyText={LOGGED_NOTE}
        lane={lane}
        usage={followUpUsage(loggedIn, LOGGED_NOTE)}
      >
        <ChatProse>{LOGGED_NOTE}</ChatProse>
      </FollowUpCard>
      {showOffer ? (
        <FollowUpCard
          copyText={COMPUTER_PROMPT.line}
          lane={lane}
          usage={followUpUsage(`${loggedIn} ${LOGGED_NOTE}`, offerText)}
        >
          <OfferBody />
        </FollowUpCard>
      ) : null}
    </div>
  );
}

/**
 * The reply to quick action 3 (owner 2026-10-12): the same computer offer
 * card, drawn as that turn's settled reply with its own model, time and
 * usage. Its button reads the one `setupLinkSent` flag, so every offer card
 * in every chat shows "Re-send email setup link" once any of them sent it.
 */
export function OnboardingSetupLinkReply({ lane }: { lane: ChatLane }) {
  return (
    <FollowUpCard
      copyText={COMPUTER_PROMPT.line}
      lane={lane}
      usage={lane.usage}
    >
      <OfferBody />
    </FollowUpCard>
  );
}

/** The offer's line and its email button. */
function OfferBody() {
  return (
    <div className="flex flex-col items-start gap-3">
      <ChatProse>{COMPUTER_PROMPT.line}</ChatProse>
      <SetupLinkButton />
    </div>
  );
}

/** MOCK usage for a follow-up: estimated tokens, the free model's cost,
 *  settled, not compressed, no Gate record (no View message link). */
function followUpUsage(input: string, output: string): ChatUsage {
  return {
    kind: "response",
    settlement: "settled",
    compression: null,
    compressionPercent: null,
    promptTokens: String(estimateTokens(input)),
    tokens: String(estimateTokens(output)),
    cost: formatExactUsd(0),
    estimated: false,
    messageId: null,
    security: null,
  };
}

/** ChatLaneCard's complete state: header, body, usage row, Copy. */
function FollowUpCard({
  lane,
  usage,
  copyText,
  children,
}: {
  lane: ChatLane;
  usage: ChatUsage;
  copyText: string;
  children: ReactNode;
}) {
  const { copied, trigger: copyResponse } = useCopyFeedback({
    value: copyText,
    label: "response",
    holdMs: COPY_HOLD_MS,
    notify: false,
  });
  const CopyGlyph = copied ? CircleCheck : Copy;

  return (
    <div className="flex min-w-0 flex-col gap-2" data-slot="chat-lane">
      <div className="flex min-w-0 flex-col gap-3 rounded-md border border-border bg-chat-bubble-agent p-4 text-chat-bubble-agent-foreground shadow-xs">
        <OnboardingChatLaneHeader lane={lane} />
        <div className="flex min-h-9 min-w-0 flex-col justify-center">
          {children}
        </div>
        <OnboardingChatUsageRow
          className="mt-auto border-border border-t pt-3"
          usage={usage}
        />
      </div>
      <div className="flex min-h-8 items-center gap-0 px-0 text-muted-foreground lg:gap-1 lg:px-1">
        <Button
          aria-label={copied ? "Copied" : CHAT_COPY.copyResponse}
          className={cn(
            CHAT_TOUCH_TARGET,
            copied ? "text-foreground" : "text-muted-foreground"
          )}
          onClick={copyResponse}
          size="icon-action"
          type="button"
          variant="ghost"
        >
          <CopyGlyph aria-hidden strokeWidth={1.75} />
        </Button>
        <span aria-live="polite" className="type-copy-12 ml-auto" role="status">
          {copied ? "Copied" : ""}
        </span>
      </div>
    </div>
  );
}

/** The offer's email action (owner 2026-10-12): a spinner and "Sending
 *  email" for the mock send, then the toast, then "Re-send email setup
 *  link". The sent state lives in the chat store so it survives leaving the
 *  chat; the spinner pattern is ImprovedStart's setup-link button. Option B
 *  can send the link from its phone start first (`improved.handoffSent`),
 *  which counts as sent too; the chat never sets that flag, since it drives
 *  Option B's simulated desktop open. */
function SetupLinkButton() {
  const { setupLinkSent: chatSent } = useOnboardingChatStore();
  const { improved } = useOnboarding();
  const setupLinkSent = chatSent || improved.handoffSent;
  const [sending, setSending] = useState(false);
  const send = () => {
    if (sending) {
      return;
    }
    setSending(true);
    setTimeout(() => {
      onboardingChatStore.markSetupLinkSent();
      setSending(false);
      toast.success(COMPUTER_PROMPT.toast);
    }, ONBOARDING_TIMING.emailSend);
  };
  // Large text (200%): the label is wider than a phone card, so the button
  // is capped at the card's width and the label ends in an ellipsis instead
  // of pushing the page sideways. At 100% it fits and nothing changes.
  return (
    <Button
      aria-busy={sending}
      aria-disabled={sending}
      className="max-w-full"
      onClick={send}
      size="sm"
      type="button"
      variant="outline"
    >
      {sending ? (
        <Loader2
          aria-hidden
          className="animate-spin motion-reduce:animate-none"
          data-icon="inline-start"
        />
      ) : (
        <Mail aria-hidden data-icon="inline-start" strokeWidth={1.75} />
      )}
      <span className="min-w-0 truncate">
        {sending
          ? COMPUTER_PROMPT.sending
          : setupLinkSent
            ? COMPUTER_PROMPT.resend
            : COMPUTER_PROMPT.button}
      </span>
    </Button>
  );
}
