import {
  ArrowRight,
  KeyRound,
  Loader2,
  Mail,
  MessageSquare,
  Monitor,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  ChatArt,
  CodeArt,
  ConnectArt,
  HandoffArt,
} from "@/pages/onboarding/improved-art";
import {
  LINK_VALIDITY,
  LINK_WORKSPACE,
  OTHER_SESSION,
  OWNER_EMAIL,
  SIMULATED_MS,
  wait,
} from "@/pages/onboarding/improved-data";
import {
  ImprovedColumn,
  ImprovedHeader,
} from "@/pages/onboarding/improved-parts";
import { OnboardingChrome } from "@/pages/onboarding/onboarding-chrome";
import {
  improvedStepPath,
  ONBOARDING_ROUTES,
} from "@/pages/onboarding/onboarding-routes";
import {
  DEFAULT_PAYG_MODEL,
  type ImprovedConnection,
  initialImprovedState,
  snapshotDesktopSetup,
} from "@/pages/onboarding/onboarding-state";
import { useIsMobileSetup } from "@/pages/onboarding/use-is-mobile-setup";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/* ─── Improved flow: start, handoff and setup link ──────────────────────────
 * Step 1 of the mockup's Improved flow. On a desktop it is a three-way
 * picker (Gate Chat, Gate Connect, Manual setup) with one Continue action;
 * on a phone it is "Gate Chat here, or email yourself a setup link", which
 * leads to the handoff screen and, on the desktop, to the setup-link screen.
 * ───────────────────────────────────────────────────────────────────────── */

const METHODS: {
  id: ImprovedConnection;
  title: string;
  description: string;
}[] = [
  {
    id: "gate-chat",
    title: "Gate Chat",
    description: "Start chatting with a model of your choice",
  },
  {
    id: "gate-connect",
    title: "Gate Connect",
    description: "Your desktop AI apps",
  },
  { id: "manual", title: "Manual setup", description: "SDK or any client" },
];

/** `/overview-onboarding` in the Improved flow (and the handoff route on a
 *  desktop, as in the mockup). */
export function ImprovedStart() {
  const mobile = useIsMobileSetup();
  return (
    <OnboardingChrome>
      {mobile ? <MobileStart /> : <DesktopPicker />}
    </OnboardingChrome>
  );
}

function DesktopPicker() {
  const navigate = useNavigate();
  const { improved, updateImproved } = useOnboarding();
  const chat = improved.connection === "gate-chat";

  const choose = (connection: ImprovedConnection) => {
    if (connection === improved.connection) {
      return;
    }
    updateImproved((state) => ({
      connection,
      billing:
        connection === "gate-chat"
          ? "payg"
          : state.connection === "gate-chat"
            ? "existing"
            : state.billing,
      connected: false,
      received: false,
      pathChosen: false,
      client:
        state.client === "openai-sdk" && connection === "gate-connect"
          ? "codex"
          : state.client,
    }));
  };

  return (
    <ImprovedColumn>
      <ImprovedHeader title="Get started" />
      <RadioGroup
        aria-label="Setup method"
        className="grid @5xl:grid-cols-3 @xl:grid-cols-2 gap-4"
        onValueChange={(value) => choose(value as ImprovedConnection)}
        value={improved.connection}
      >
        {METHODS.map((method) => (
          <MethodCard
            key={method.id}
            method={method}
            selected={improved.connection === method.id}
          />
        ))}
      </RadioGroup>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            updateImproved({ pathChosen: true, connected: chat });
            navigate(
              chat ? ONBOARDING_ROUTES.chat : ONBOARDING_ROUTES.improvedConnect
            );
          }}
          size="default"
        >
          {chat ? "Open Gate Chat" : "Continue"}
          <ArrowRight aria-hidden data-icon="inline-end" />
        </Button>
      </div>
    </ImprovedColumn>
  );
}

/** One setup method: a card-sized label around the group's
 *  `RadioGroupItem` (the `Policies.tsx` radio-card pattern). The
 *  illustration stage leads, then the title and description; the check
 *  radio in the stage's corner marks the choice. */
function MethodCard({
  method,
  selected,
}: {
  method: (typeof METHODS)[number];
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        "group flex min-w-0 cursor-pointer flex-col rounded-md border bg-card p-2 text-left shadow-xs transition-[background-color,border-color,scale] duration-150 ease-out hover:bg-accent-muted active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
        selected ? "border-foreground" : "border-border hover:border-input",
        method.id === "gate-chat" && "@5xl:col-span-1 @xl:col-span-2"
      )}
      data-method={method.id}
    >
      <span
        className={cn(
          "relative order-first grid h-70 place-items-center overflow-hidden rounded-xs border border-border",
          selected ? "bg-accent" : "bg-card-muted"
        )}
      >
        {method.id === "gate-chat" ? <ChatArt /> : null}
        {method.id === "gate-connect" ? <ConnectArt /> : null}
        {method.id === "manual" ? <CodeArt /> : null}
        <RadioGroupItem
          className="absolute top-4 right-4"
          indicator="check"
          value={method.id}
        />
      </span>
      <span className="flex flex-col gap-1 px-2 pt-4 pb-2">
        <span className="type-heading-20 text-foreground">{method.title}</span>
        <span className="type-copy-14 text-muted-foreground">
          {method.description}
        </span>
      </span>
    </label>
  );
}

/** The setup-link button's two beats (owner 2026-10-09): "Sending link…"
 *  for SEND_MS, then "Email sent!" for SENT_HOLD_MS, then "Re-send
 *  email". */
const SEND_MS = 3000;
const SENT_HOLD_MS = 2000;

/** Email a setup link from the phone (the mockup's `ue`, simulated). The
 *  button reports it in place: "Sending link…", then "Email sent!", then
 *  "Re-send email". The phone never leaves the page
 *  (owner 2026-10-09: sending must not lead into setup on the phone).
 *  Shared by the mobile start and the handoff screen. */
function useSendSetupLink() {
  const { improved, updateImproved, readImproved } = useOnboarding();
  const [phase, setPhase] = useState<"idle" | "sending" | "sent">("idle");

  const send = async () => {
    if (phase !== "idle") {
      return;
    }
    setPhase("sending");
    await wait(SEND_MS);
    const state = readImproved();
    updateImproved({
      handoffSent: true,
      handoffSends: state.handoffSends + 1,
      handoffAttempt: "sent",
      handoffSetup: snapshotDesktopSetup(state),
    });
    setPhase("sent");
    await wait(SENT_HOLD_MS);
    setPhase("idle");
  };

  const label =
    phase === "sending"
      ? "Sending link…"
      : phase === "sent"
        ? "Email sent!"
        : improved.handoffSent
          ? "Re-send email"
          : "Email me a setup link";

  return {
    send,
    sending: phase === "sending",
    busy: phase !== "idle",
    sent: phase === "sent",
    label,
  };
}

/** Phone: choose Gate Chat here, or continue on the desktop. */
function useOpenChatOnPhone() {
  const navigate = useNavigate();
  const { updateImproved } = useOnboarding();
  return () => {
    updateImproved((state) =>
      state.connection === "gate-chat"
        ? { pathChosen: true, connected: true }
        : {
            connection: "gate-chat",
            model: DEFAULT_PAYG_MODEL,
            connected: true,
            received: false,
            handoffSetup: state.handoffSetup ?? snapshotDesktopSetup(state),
            pathChosen: true,
          }
    );
    navigate(ONBOARDING_ROUTES.chat);
  };
}

function MobileStart() {
  const { improved } = useOnboarding();
  const link = useSendSetupLink();
  const openChat = useOpenChatOnPhone();
  const resume = improved.connection === "gate-chat" && improved.received;
  return (
    <div className="mx-auto flex w-full max-w-190 flex-col gap-6">
      <PageTitle>How would you like to start?</PageTitle>
      <div className="flex @xl:grid @xl:grid-cols-[3fr_2fr] flex-col @xl:items-start gap-4">
        <Card density="flush" elevation="raised">
          <div className="flex flex-col p-2">
            <section
              aria-labelledby="mobile-chat-title"
              className="flex flex-col"
            >
              <div className="flex h-51 items-center justify-center overflow-hidden rounded-xs border border-border bg-card-muted p-4">
                <ChatArt className="w-4/3 max-w-none shrink-0 scale-75" loop />
              </div>
              <div className="flex flex-col gap-4 px-2 pt-4 pb-2">
                <div className="flex flex-col gap-1">
                  <h2
                    className="type-heading-20 m-0 text-foreground"
                    id="mobile-chat-title"
                  >
                    Gate Chat
                  </h2>
                  <p className="type-copy-14 m-0 text-muted-foreground">
                    {resume
                      ? "Your first conversation is saved in your chat history"
                      : "Start chatting with a model of your choice"}
                  </p>
                </div>
                <Button className="w-full" onClick={openChat} size="touch">
                  <MessageSquare aria-hidden data-icon="inline-start" />
                  {resume ? "Resume Gate Chat" : "Open Gate Chat"}
                </Button>
              </div>
            </section>
          </div>
        </Card>
        <Card density="flush" elevation="raised">
          <div className="flex flex-col p-4">
            <section
              aria-labelledby="mobile-desktop-title"
              className="flex flex-col gap-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <h2
                  className="type-heading-16 m-0 flex items-center gap-2 text-foreground"
                  id="mobile-desktop-title"
                >
                  <Monitor
                    aria-hidden
                    className="size-4 shrink-0"
                    strokeWidth={1.75}
                  />
                  Continue on desktop
                </h2>
                <p className="type-copy-14 m-0 text-muted-foreground">
                  Email a setup link to{" "}
                  <span className="wrap-anywhere text-foreground">
                    {OWNER_EMAIL}
                  </span>
                </p>
              </div>
              <Button
                aria-busy={link.sending}
                aria-disabled={link.busy}
                className="w-full"
                onClick={() => void link.send()}
                size="touch"
                variant="outline"
              >
                {link.sending ? (
                  <Loader2
                    aria-hidden
                    className="animate-spin motion-reduce:animate-none"
                    data-icon="inline-start"
                  />
                ) : null}
                {link.busy ? null : (
                  <Mail aria-hidden data-icon="inline-start" />
                )}
                {link.label}
              </Button>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** `/improved-handoff-onboarding`: the phone's "check your email" card. */
export function ImprovedHandoff() {
  const mobile = useIsMobileSetup();
  return (
    <OnboardingChrome>
      {mobile ? <HandoffCard /> : <DesktopPicker />}
    </OnboardingChrome>
  );
}

/** After the link is sent, the desktop "opens" it on its own: a short pause
 *  on "Check your email", then the setup-link step (owner direction
 *  2026-10-08, replacing the demo "Open here" control). */
const LINK_OPEN_MS = 3000;

function HandoffCard() {
  const navigate = useNavigate();
  const { improved, updateImproved } = useOnboarding();
  const link = useSendSetupLink();
  const openChat = useOpenChatOnPhone();
  const sent = improved.handoffSent;
  const sending = link.sending;
  useEffect(() => {
    if (!sent || sending) {
      return;
    }
    const timer = window.setTimeout(() => {
      // A fresh desktop session: only what the emailed link holds carries
      // over from the phone.
      updateImproved((state) => ({
        ...initialImprovedState(),
        handoffSetup: state.handoffSetup,
        handoffSends: state.handoffSends,
        linkRedemption: {
          scenario: "valid",
          resent: false,
          setup: state.handoffSetup,
        },
      }));
      navigate(ONBOARDING_ROUTES.link);
    }, LINK_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [sent, sending, navigate, updateImproved]);
  return (
    <div className="mx-auto flex w-full max-w-140 flex-col">
      <Card density="flush">
        <div className="flex flex-col items-center gap-6 p-2 pb-4 text-center">
          <div className="grid min-h-40 w-full place-items-center rounded-xs bg-card-muted px-4 py-6">
            <HandoffArt
              state={link.sending ? "sending" : sent ? "sent" : "idle"}
            />
          </div>
          <div
            className="flex min-w-0 flex-col items-center gap-2 px-3"
            role="status"
            tabIndex={-1}
          >
            <PageTitle as="h1">
              {sent ? "Check your email" : "Continue on desktop"}
            </PageTitle>
            <p className="type-label-14 m-0 inline-flex max-w-full items-center gap-2 rounded-full bg-muted px-3 py-1 text-foreground">
              <Mail
                aria-hidden
                className="size-3.5 shrink-0"
                strokeWidth={1.75}
              />
              <span className="wrap-anywhere min-w-0">{OWNER_EMAIL}</span>
            </p>
            <p className="type-copy-16 m-0 text-pretty text-muted-foreground">
              {sent
                ? `Open the link on your computer to pick up your setup. ${LINK_VALIDITY}`
                : "We'll email you a link to finish setup on your computer."}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 px-2">
            <Button
              aria-busy={link.sending}
              aria-disabled={link.busy}
              className="w-full"
              onClick={() => void link.send()}
              size="touch"
              variant={sent ? "outline" : "default"}
            >
              {link.label}
            </Button>
            <Button
              className="w-full"
              onClick={openChat}
              size="touch"
              variant="ghost"
            >
              <MessageSquare aria-hidden data-icon="inline-start" />
              {sent ? "Try Gate Chat while you wait" : "Use Gate Chat instead"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/** `/improved-link-onboarding`: the desktop opened an emailed setup link.
 *  A valid link restores the phone's setup and continues where it left off;
 *  expired / other-account / other-workspace links explain and recover. */
export function ImprovedLink() {
  const navigate = useNavigate();
  const { improved, updateImproved, readImproved } = useOnboarding();
  const [sending, setSending] = useState(false);
  const redemption = improved.linkRedemption;
  const setup =
    redemption?.setup ??
    improved.handoffSetup ??
    snapshotDesktopSetup(improved);
  // The link step defaults to a valid link (owner direction 2026-10-08).
  // The expired / other-account / other-workspace screens below stay built
  // for a `linkRedemption.scenario` that names them.
  const scenario = redemption?.scenario ?? "valid";

  const restore = () => {
    const { step, ...choices } = setup;
    updateImproved({
      ...choices,
      received: false,
      pathChosen: step !== "overview",
      linkRedemption: null,
    });
    toast.success("Picked up your setup from your phone", {
      id: "link-restored",
    });
    navigate(improvedStepPath(step), { replace: true });
  };

  // A valid link resolves straight into the setup, no screen of its own.
  const valid = scenario === "valid";
  // Latest `restore` for the effect below, refreshed after each commit so the
  // ref is never written during render.
  const restoreRef = useRef(restore);
  useLayoutEffect(() => {
    restoreRef.current = restore;
  });
  useEffect(() => {
    if (valid) {
      restoreRef.current();
    }
  }, [valid]);

  const startHere = () => {
    updateImproved({ linkRedemption: null });
    navigate(ONBOARDING_ROUTES.start, { replace: true });
  };

  const resend = async () => {
    if (sending) {
      return;
    }
    setSending(true);
    await wait(SIMULATED_MS);
    setSending(false);
    const state = readImproved();
    updateImproved({
      handoffSends: state.handoffSends + 1,
      linkRedemption: {
        scenario: "expired",
        resent: true,
        setup: state.linkRedemption?.setup ?? state.handoffSetup,
      },
    });
  };

  if (scenario === "valid") {
    return <OnboardingChrome>{null}</OnboardingChrome>;
  }

  const expired = scenario === "expired";
  const account = scenario === "account";
  const resent = Boolean(redemption?.resent);
  const title = expired
    ? resent
      ? "Check your email"
      : "This setup link has expired"
    : account
      ? "This link is for another account"
      : "This link is for another workspace";
  const body = expired
    ? resent
      ? `We sent a new link to ${OWNER_EMAIL}. ${LINK_VALIDITY}`
      : `We'll email a new one to ${OWNER_EMAIL}.`
    : account
      ? `It was sent to ${OWNER_EMAIL}. You're signed in as ${OTHER_SESSION.email}.`
      : `It sets up ${LINK_WORKSPACE}. You're in ${OTHER_SESSION.workspace}.`;

  return (
    <OnboardingChrome>
      <div className="mx-auto flex w-full max-w-120 flex-col @4xl:pt-8">
        <Card density="flush">
          <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-4 text-center">
            <div
              className="flex min-w-0 flex-col items-center gap-2 px-3"
              role="status"
            >
              <span
                aria-hidden
                className="mb-2 grid size-11 place-items-center rounded-sm bg-muted text-foreground"
              >
                {expired ? (
                  <Mail className="size-5" strokeWidth={1.75} />
                ) : (
                  <KeyRound className="size-5" strokeWidth={1.75} />
                )}
              </span>
              <PageTitle>{title}</PageTitle>
              <p className="type-copy-16 wrap-anywhere m-0 text-pretty text-muted-foreground">
                {body}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 px-2">
              {expired && !resent ? (
                <Button
                  aria-busy={sending}
                  aria-disabled={sending}
                  className="w-full"
                  onClick={() => void resend()}
                  size="default"
                >
                  <Mail aria-hidden data-icon="inline-start" />
                  {sending ? "Sending link…" : "Email me a new link"}
                </Button>
              ) : null}
              {expired ? null : (
                <Button className="w-full" onClick={restore} size="default">
                  {account
                    ? `Sign in as ${OWNER_EMAIL}`
                    : `Switch to ${LINK_WORKSPACE}`}
                </Button>
              )}
              <Button
                className="w-full"
                onClick={startHere}
                size="default"
                variant="ghost"
              >
                Start setup here
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </OnboardingChrome>
  );
}
