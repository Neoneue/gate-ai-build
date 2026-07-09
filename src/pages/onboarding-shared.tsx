import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Onboarding shared primitives — the get-started Overview card and every
 * setup subpage (Connect / Gate Connect / Manual / Credits / Models) compose
 * from these so the choice-card treatment and the back-breadcrumb chrome stay
 * identical across the flow. All accents map to design tokens (no raw hex).
 * ───────────────────────────────────────────────────────────────────────── */

type ChoiceTone = "blue" | "success" | "neutral";

/** Icon-chip tone → tokenized icon ink only. The chip sits on a shared light
 *  gray (`bg-muted`) wrapper; the tone just colors the glyph. `blue` =
 *  primary path, `success` = pay-as-you-go / credits, `neutral` = manual. */
const CHOICE_ICON_TONE: Record<ChoiceTone, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  success: "text-success-600 dark:text-success-400",
  neutral: "text-muted-foreground",
};

/**
 * The one onboarding icon chip — light gray (`bg-muted`) square, one-step-sharp
 * `rounded-sm`, tone-colored glyph. Single source so the Get-started choice
 * cards and every setup-subpage header/row chip stay identical. `md` (size-10 /
 * icon size-5) is the card + section-header default; `sm` (size-8 / size-4)
 * is the inline-row size (e.g. the Manual create-key row).
 */
export function SetupIconChip({
  icon: Icon,
  tone = "neutral",
  size = "md",
}: {
  icon: ComponentType<{ className?: string }>;
  tone?: ChoiceTone;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm bg-muted",
        size === "md" ? "size-10" : "size-8",
        CHOICE_ICON_TONE[tone]
      )}
    >
      <Icon className={size === "md" ? "size-5" : "size-4"} />
    </span>
  );
}

/**
 * A single tappable onboarding option. Featured cards get the same
 * blue-200 / blue-50→blue-25 gradient treatment used by the Pro and
 * Token-Savings upsell cards so the recommended path reads as primary.
 */
export function ChoiceCard({
  icon: Icon,
  tone = "neutral",
  featured = false,
  title,
  body,
  supports,
  cta,
  ctaVariant = "outline",
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  tone?: ChoiceTone;
  featured?: boolean;
  title: string;
  body: string;
  supports?: ReactNode;
  cta: string;
  ctaVariant?: "default" | "outline";
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-start gap-4 rounded-md border border-border bg-card p-5 text-left shadow-xs",
        featured && "border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25"
      )}
    >
      <SetupIconChip icon={Icon} tone={featured ? "blue" : tone} />
      <span className="flex flex-col gap-1">
        <span className="type-heading-16 text-foreground">{title}</span>
        <span className="type-copy-14 text-pretty text-muted-foreground">
          {body}
        </span>
      </span>
      {supports ? (
        <span className="type-copy-14 w-full text-pretty rounded-sm border border-border bg-card px-3 py-2 text-muted-foreground">
          {supports}
        </span>
      ) : null}
      <Button className="mt-auto" onClick={onClick} variant={ctaVariant}>
        {cta}
        <ArrowRight
          aria-hidden
          className="transition-transform duration-150 ease-out group-hover/button:translate-x-1 motion-reduce:transition-none"
          data-icon="inline-end"
        />
      </Button>
    </div>
  );
}

/** Back-breadcrumb button — mirrors the RequestsFindings pattern (ChevronLeft
 *  + label, hover ink + nudge, generous invisible hit area). */
export function SetupBackLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="type-label-14 group relative inline-flex w-fit items-center gap-1 rounded-xs text-muted-foreground transition-[colors,scale] duration-150 ease-out after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
      onClick={onClick}
      type="button"
    >
      <ChevronLeft
        aria-hidden
        className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        strokeWidth={1.75}
      />
      {label}
    </button>
  );
}

/**
 * Page scaffold for every setup subpage: default-tier DashboardChrome (the
 * route ends in `-default`, so the sidebar shows the new-workspace locks),
 * a left-aligned column (max-width 1024px, matching Settings/Policies), a back
 * breadcrumb, and the page title/subtitle. Subpages pass `backTo` (a route,
 * optionally with a `?bill=` query) to preserve the multi-level back stack.
 */
export function SetupScaffold({
  backTo,
  backLabel,
  title,
  subtitle,
  maxWidthClassName = "xl:max-w-5xl",
  children,
}: {
  backTo: string;
  backLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  maxWidthClassName?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="overview"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className={cn("flex w-full flex-col gap-6", maxWidthClassName)}>
        <SetupBackLink label={backLabel} onClick={() => navigate(backTo)} />
        <div className="flex flex-col gap-2">
          <PageTitle>{title}</PageTitle>
          {subtitle ? (
            <p className="type-copy-16 m-0 text-pretty text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </DashboardChrome>
  );
}

/** Pure-CSS animated ellipsis (. → .. → ...) for "listening / waiting" copy.
 *  Decorative — keep the meaning in the preceding text. */
export function AnimatedEllipsis() {
  return <span aria-hidden className="animate-ellipsis" />;
}

/** Tokenized "listening / waiting for first request" strip used by the
 *  Gate Connect and Manual setup subpages. Solid surface + spinning loader.
 *  Pass `active={false}` to show a static icon (step not yet reached). */
export function WaitingStrip({
  children,
  active = true,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card-muted px-4 py-4 text-muted-foreground">
      <Loader2
        aria-hidden
        className={cn(
          "size-5 shrink-0 motion-reduce:animate-none",
          active
            ? "animate-spin text-blue-600 dark:text-blue-400"
            : "text-muted-foreground"
        )}
        strokeWidth={1.75}
      />
      <span className="type-copy-14 flex-1">{children}</span>
    </div>
  );
}
