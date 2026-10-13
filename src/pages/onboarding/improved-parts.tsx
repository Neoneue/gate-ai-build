import { CircleAlert, CircleCheck, Cloud, Info, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { PageTitle } from "@/components/ui/page-title";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

/** Page header: the title. The step dashes were removed once the top-bar
 *  menu carried setup progress (owner 2026-10-13); "Explore first" was
 *  removed earlier (owner direction 2026-10-08). */
export function ImprovedHeader({ title }: { title: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-6">
      <PageTitle className="mr-auto">{title}</PageTitle>
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
  description,
  tip,
  children,
}: {
  title: string;
  /** An Info glyph after the title that explains it on hover or keyboard
   *  focus: the repo's TipLabel trigger (settings/DataRetentionCard.tsx,
   *  teams/budget.tsx). */
  tip?: string;
  /** The official setup's step subtitle (gate repo, pages/setup/shared.tsx
   *  SetupStepCard), under the title in the muted copy voice. */
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      {/* Title one step up from the label row, foreground, with the
          subtitle muted under it (owner 2026-10-13). */}
      <div className="flex flex-col gap-1">
        <h2 className="type-label-16 m-0 inline-flex items-center gap-1 text-foreground">
          {title}
          {tip ? (
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <span
                    {...props}
                    aria-label={`About ${title}`}
                    className="-m-1 inline-flex shrink-0 cursor-help rounded-sm p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    // biome-ignore lint/a11y/noNoninteractiveTabindex: the tooltip trigger must be focusable or its explanation is keyboard-unreachable (WCAG 2.1.1)
                    tabIndex={0}
                  >
                    <Info aria-hidden className="size-3.5" strokeWidth={1.75} />
                  </span>
                )}
              />
              <TooltipContent>{tip}</TooltipContent>
            </Tooltip>
          ) : null}
        </h2>
        {description ? (
          <p className="type-copy-14 m-0 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** A step's pass or fail line, the first row of its card (owner
 *  2026-10-13): a `rounded-xs` row on the status badge's tone pairing
 *  (badge.tsx `success` / `destructive`: 100 fill and 800 ink, the dark
 *  recipe's wash and 300 ink), a circle glyph, the text in the label voice.
 *  Success is a polite status; failure is an alert. */
export function StatusRow({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xs px-3 py-2",
        tone === "success"
          ? "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300"
          : "bg-danger-100 text-danger-800 dark:bg-destructive/20 dark:text-danger-300"
      )}
      role={tone === "success" ? "status" : "alert"}
    >
      {/* h-5 centers the 16px glyph on the first 20px line (Callout). */}
      <span aria-hidden className="flex h-5 shrink-0 items-center">
        <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      </span>
      <p className="type-label-14 m-0 min-w-0 flex-1 text-pretty">{children}</p>
    </div>
  );
}
