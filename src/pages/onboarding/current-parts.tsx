import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { RowActionButton } from "@/components/ui/row-action-button";
import { SectionTitle } from "@/components/ui/section-title";
import { Switch } from "@/components/ui/switch";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
import { OnboardingChrome } from "@/pages/onboarding/onboarding-chrome";

/* ─── Current flow: shared parts ────────────────────────────────────────────
 * The Current flow (mockup "current" version) is one "Get started" page per
 * step: page title, a four-step progress stepper, an optional Back link and
 * the step's content. Values map to design.md: 32 page title over 16 copy,
 * 24 / 20 section headings, 8px cards with 16px padding, the Stepper state
 * table (§7 Inputs & Forms, "Stepper"), and default-variant primaries.
 * ───────────────────────────────────────────────────────────────────────── */

export const DOCS_URL = "https://docs.constellationgate.ai";

/** Docs link with the external-link affordance. */
export function DocsLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <TextLink
      as="a"
      className="inline-flex items-center gap-1 whitespace-nowrap"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <ArrowUpRight
        aria-hidden
        className="size-3 shrink-0"
        strokeWidth={1.75}
      />
    </TextLink>
  );
}

const STEPS = [
  {
    title: "Choose your path",
    doneTitle: "Choose your path",
    caption: "How you use Gate",
  },
  {
    title: "Connect",
    doneTitle: "Connected",
    caption: "Link your app to Gate",
  },
  {
    title: "Send a message",
    doneTitle: "Message received",
    caption: "Confirm you're set up",
  },
  {
    title: "Simulate an attack",
    doneTitle: "Attack simulated",
    caption: "Watch Gate protect your model",
  },
] as const;

/** Numbered step indicator, the design.md Stepper state table: active and
 *  complete share the filled primary circle (numeral vs check), upcoming is
 *  muted. The numeral is a counter, so it takes the mono badge voice. */
export function StepIndicator({
  n,
  state,
}: {
  n: number;
  state: "upcoming" | "active" | "complete";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "type-mono-12 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
        state === "upcoming"
          ? "bg-muted text-muted-foreground"
          : "bg-primary text-primary-foreground"
      )}
    >
      {state === "complete" ? (
        <Check className="size-3.5" strokeWidth={1.75} />
      ) : (
        n
      )}
    </span>
  );
}

const STATE_LABEL = {
  upcoming: "not started",
  active: "current step",
  complete: "completed",
} as const;

/** The four-step progress strip under the page title. Horizontal from the
 *  `@lg` container width, stacked below it. `current` past 4 = all done. */
export function SetupStepper({ current }: { current: number }) {
  return (
    <ol
      aria-label="Setup progress"
      className="m-0 flex list-none @lg:flex-row flex-col @lg:items-start gap-x-4 gap-y-3 rounded-md border border-border bg-card p-4 shadow-xs"
      data-onboarding-stepper=""
    >
      {STEPS.map((step, index) => {
        const n = index + 1;
        const state =
          n < current ? "complete" : n === current ? "active" : "upcoming";
        return (
          <li
            aria-current={state === "active" ? "step" : undefined}
            className="flex min-w-0 flex-1 items-start gap-3"
            key={step.title}
          >
            <StepIndicator n={n} state={state} />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="sr-only">
                Step {n}, {STATE_LABEL[state]}:
              </span>
              <span
                className={cn(
                  "type-label-14 truncate",
                  state === "active"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {state === "complete" ? step.doneTitle : step.title}
              </span>
              <span className="type-copy-12 @3xl:block hidden truncate text-muted-foreground">
                {step.caption}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Page scaffold for every Current-flow step (the mockup's `qi`). */
export function CurrentScaffold({
  step,
  back,
  children,
}: {
  step: number;
  back?: string;
  children: ReactNode;
}) {
  return (
    <OnboardingChrome>
      <div className="flex w-full @4xl:max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <PageTitle>Get started</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground">
            Everything you need to get your AI gateway up and running.
          </p>
        </div>
        <SetupStepper current={step} />
        {back ? (
          <BackLink className="self-start" href={back} label="Back" />
        ) : null}
        {children}
      </div>
    </OnboardingChrome>
  );
}

/** Section heading + supporting line for a step's content. `size="section"`
 *  is the 24px section voice over 16px copy (the Overview question);
 *  `block` is the 20px block voice over 14px copy (every subpage). */
export function StepHeading({
  title,
  children,
  size = "block",
}: {
  title: ReactNode;
  children?: ReactNode;
  size?: "section" | "block";
}) {
  return (
    <div className="flex flex-col gap-2">
      {size === "section" ? (
        <h2 className="type-heading-24 m-0 text-foreground">{title}</h2>
      ) : (
        <SectionTitle as="h2">{title}</SectionTitle>
      )}
      {children ? (
        <p
          className={cn(
            "m-0 max-w-4xl text-pretty text-muted-foreground",
            size === "section" ? "type-copy-16" : "type-copy-14"
          )}
        >
          {children}
        </p>
      ) : null}
    </div>
  );
}

/** A path choice with an illustration (the mockup's `ch`). The whole card is
 *  the target: Card `interactive` owns hover and press, the flush
 *  RowActionButton owns focus (the Models Featured card recipe). */
export function ImageChoiceCard({
  title,
  badge,
  body,
  image,
  onClick,
}: {
  title: string;
  badge?: string;
  body: string;
  image: string;
  onClick: () => void;
}) {
  return (
    <Card className="h-full" density="flush" interactive>
      <RowActionButton
        aria-label={title}
        className="group h-full justify-start gap-4 rounded-md p-4 focus-visible:ring-inset focus-visible:ring-offset-0"
        layout="stack"
        onClick={onClick}
      >
        <span className="h-36 w-full overflow-hidden rounded-xs border border-border bg-muted">
          <img
            alt=""
            className="size-full object-cover"
            height={440}
            src={image}
            width={1420}
          />
        </span>
        <span className="flex w-full items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="type-heading-20 text-foreground">{title}</span>
            {badge ? <Badge variant="info">{badge}</Badge> : null}
          </span>
          <ArrowRight
            aria-hidden
            className="size-5 shrink-0 text-muted-foreground"
            data-onboarding-card-arrow=""
            strokeWidth={1.75}
          />
        </span>
        <span className="type-copy-14 text-pretty text-muted-foreground">
          {body}
        </span>
      </RowActionButton>
    </Card>
  );
}

/** One numbered setup step (the mockup's `lr`). `dimmed` steps are not yet
 *  reachable: faded and `inert`, so neither pointer nor keyboard reaches
 *  their controls. The action sits on the right of the header row; a
 *  `footer` drops under the copy, indented to the title column. */
export function StepCard({
  n,
  title,
  description,
  active = false,
  dimmed = false,
  action,
  footer,
}: {
  n: number;
  title: string;
  description?: string;
  active?: boolean;
  dimmed?: boolean;
  action?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card
      className={cn(dimmed && "opacity-50")}
      data-onboarding-step-card={dimmed ? "dimmed" : "active"}
      inert={dimmed}
    >
      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-60 flex-1 items-start gap-3">
            <StepIndicator n={n} state={active ? "active" : "upcoming"} />
            <div className="flex flex-1 flex-col gap-1">
              <span className="type-label-14 text-foreground">{title}</span>
              {description ? (
                <span className="type-copy-14 text-pretty text-muted-foreground">
                  {description}
                </span>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {footer ? <div className="pl-9">{footer}</div> : null}
      </div>
    </Card>
  );
}

/** Static end state of the mockup's Gate Connect window illustration: the
 *  menu-bar app signed in with Proxy On. The mockup loops it between Idle
 *  and Connected; `ref` and `data-motion-root` are the animator's hooks. */
export function GateConnectWindow({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      aria-hidden
      className="w-full max-w-xs rounded-sm border border-border bg-card shadow-xs"
      data-motion-root="gate-connect-window"
      data-state="connected"
      ref={ref}
    >
      <div className="flex items-center gap-2 border-border border-b px-3 py-2">
        <img
          alt=""
          className="size-4"
          height={226}
          src="/gate-ai-logo-mark.png"
          width={195}
        />
        <span className="type-label-14 text-foreground">
          Gate <span className="text-tier-pro">Connect</span>
        </span>
        <Badge className="ml-auto" variant="success">
          Connected
        </Badge>
      </div>
      <div className="p-2">
        <div className="flex items-center gap-3 rounded-xs border border-border bg-card-muted px-3 py-2">
          <span className="inline-flex size-7 items-center justify-center rounded-xs border border-border bg-card text-tier-pro">
            <ShieldCheck className="size-3.5" strokeWidth={1.75} />
          </span>
          <span className="flex flex-col">
            <span className="type-label-14 text-foreground">Proxy</span>
            <span className="type-copy-12 text-muted-foreground">
              On · 3 providers · 0 tools
            </span>
          </span>
          <Switch
            checked
            className="pointer-events-none ml-auto"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}
