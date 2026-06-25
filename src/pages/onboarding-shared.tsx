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

/** Icon-chip tone → tokenized bg + text. `blue` = primary/featured path,
 *  `success` = pay-as-you-go / credits, `neutral` = manual / config. */
const CHOICE_ICON_TONE: Record<ChoiceTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  success: "bg-success-100 text-success-700",
  neutral: "bg-neutral-100 text-neutral-700",
};

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
        "flex h-full flex-col items-start gap-4 rounded-xs border border-border bg-card p-5 text-left shadow-xs",
        featured && "border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-md",
          // Featured cards sit on a blue-50→blue-25 gradient, so the chip
          // steps one notch darker (blue-100) to stay legible against it.
          featured ? "bg-blue-100 text-blue-700" : CHOICE_ICON_TONE[tone]
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="type-heading-16 text-foreground">{title}</span>
        <span className="type-copy-14 text-pretty text-muted-foreground">
          {body}
        </span>
      </span>
      {supports ? (
        <span className="type-copy-12 w-full text-pretty rounded-sm border border-border bg-card px-3 py-2 text-muted-foreground">
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
 * a centered column, a back breadcrumb, and the page title/subtitle. Subpages
 * pass `backTo` (a route, optionally with a `?bill=` query) to preserve the
 * concept's multi-level back stack.
 */
export function SetupScaffold({
  backTo,
  backLabel,
  title,
  subtitle,
  maxWidthClassName = "max-w-[720px]",
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
      <div
        className={cn("mx-auto flex w-full flex-col gap-6", maxWidthClassName)}
      >
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

/** Tokenized "listening / waiting for first request" strip used by the
 *  Gate Connect and Manual setup subpages. Dashed surface + spinning loader. */
export function WaitingStrip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border border-dashed bg-neutral-50 px-4 py-4 text-muted-foreground">
      <Loader2
        aria-hidden
        className="size-5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none"
        strokeWidth={1.75}
      />
      <span className="type-copy-14 flex-1">{children}</span>
    </div>
  );
}
