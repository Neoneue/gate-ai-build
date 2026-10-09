import { Cloud, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { PageTitle } from "@/components/ui/page-title";
import { cn } from "@/lib/utils";
import {
  AppIcon,
  GateMark,
  RouteFigure,
} from "@/pages/onboarding/improved-art";
import { appNameOf, clientOf, modelOf } from "@/pages/onboarding/improved-data";
import type { ImprovedState } from "@/pages/onboarding/onboarding-state";

/* ─── Improved flow: shared parts ───────────────────────────────────────── */

/** The route figure for the current choices: app -> Gate -> target. */
export function ImprovedRouteFigure({
  improved,
  state,
  caption,
  centered,
}: {
  improved: ImprovedState;
  state?: "idle" | "live" | "done";
  caption?: ReactNode;
  centered?: boolean;
}) {
  const chat = improved.connection === "gate-chat";
  const payg = chat || improved.billing === "payg";
  const model = modelOf(improved);
  return (
    <RouteFigure
      app={appNameOf(improved)}
      appIcon={
        chat ? (
          <GateMark className="size-6" />
        ) : (
          <AppIcon className="size-6" src={clientOf(improved).icon} />
        )
      }
      caption={caption}
      centered={centered}
      state={state}
      target={chat ? "Free model" : payg ? model.label : "Your provider"}
      targetIcon={
        chat ? (
          <Sparkles
            aria-hidden
            className="size-6 text-foreground"
            strokeWidth={1.75}
          />
        ) : payg ? (
          <VendorAvatar decorative size="md" vendor={model.vendor} />
        ) : (
          <Cloud
            aria-hidden
            className="size-6 text-foreground"
            strokeWidth={1.75}
          />
        )
      }
    />
  );
}

const PROGRESS_STEPS = [
  "Choose how to use Gate",
  "Prepare your setup",
  "Send a message",
] as const;

/** Page header: title and the three-segment progress (hidden on the
 *  picker). "Explore first" was removed (owner direction 2026-10-08). */
export function ImprovedHeader({
  title,
  step,
}: {
  title: ReactNode;
  /** 1-3; omit to hide the progress segments. */
  step?: number;
}) {
  return (
    <header className="flex flex-wrap items-center gap-6">
      <PageTitle className="mr-auto">{title}</PageTitle>
      {step ? (
        <ol
          aria-label="Setup progress"
          className="m-0 flex list-none gap-1 p-0"
        >
          {PROGRESS_STEPS.map((label, index) => {
            const n = index + 1;
            return (
              <li
                aria-current={n === step ? "step" : undefined}
                className={cn(
                  "h-1 w-8 rounded-full",
                  n < step
                    ? "bg-foreground"
                    : n === step
                      ? "bg-info"
                      : "bg-border"
                )}
                data-complete={n < step}
                key={label}
              >
                <span className="sr-only">{label}</span>
              </li>
            );
          })}
        </ol>
      ) : null}
    </header>
  );
}

/** Centered column every Improved desktop step sits in. */
export function ImprovedColumn({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 flex-col gap-8 @4xl:pt-4",
        narrow ? "max-w-180 items-center" : "max-w-5xl"
      )}
    >
      {children}
    </div>
  );
}

/** A labelled group in the setup column (the mockup's `_d`). */
export function SetupGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="type-label-14 m-0 text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
