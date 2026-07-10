import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  BarChart3,
  EyeOff,
  Fingerprint,
  type LucideIcon,
  MessagesSquare,
  Recycle,
  Route,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SparklesIcon } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";

export type PlanFeature = { Icon: LucideIcon; title: string; detail: string };

type PlanCardData = {
  badge: { label: string; tone: "neutral" | "pro" };
  title: string;
  price: string;
  benefitsLabel: string;
  features: PlanFeature[];
  featured?: boolean;
  cta: {
    label: string;
    variant: "default" | "outline";
    icon?: LucideIcon;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
  };
  ctaCaption: string;
};

const FREE_PLAN: PlanCardData = {
  badge: { label: "FREE", tone: "neutral" },
  title: "Free plan",
  price: "$0",
  benefitsLabel: "Included in your Free plan:",
  features: [
    {
      Icon: Route,
      title: "Multi-provider routing",
      detail: "One base URL for OpenAI, Anthropic, and more",
    },
    {
      Icon: Fingerprint,
      title: "Immutable audit trail",
      detail:
        "Every request fingerprinted to Constellation Digital Evidence (30 day retention)",
    },
    {
      Icon: BarChart3,
      title: "Activity & request logs",
      detail: "Cost, tokens, and latency across the workspace",
    },
    {
      Icon: MessagesSquare,
      title: "Conversation threading",
      detail: "Follow agent runs and chats end-to-end.",
    },
  ],
  cta: {
    label: "Your current plan",
    variant: "outline",
    disabled: true,
    ariaLabel: "Free plan is your current plan",
  },
  ctaCaption: "Free to use, forever",
};

const PRO_PLAN: PlanCardData = {
  featured: true,
  badge: { label: "PRO PLAN", tone: "pro" },
  title: "Pro plan",
  price: "$20",
  benefitsLabel: "What you'll get going Pro:",
  features: [
    {
      Icon: ShieldAlert,
      title: "Prompt injection scanning",
      detail: "Block or flag before tokens reach the model.",
    },
    {
      Icon: EyeOff,
      title: "PII, PHI & credential redaction",
      detail: "Redacted before the response returns.",
    },
    {
      Icon: SlidersHorizontal,
      title: "Spend, token & rate limits",
      detail: "Caps at the org, project, or key level.",
    },
    {
      Icon: Recycle,
      title: "Token savings",
      detail:
        "20%+ tokens saved per request via lossless compression and cache injection.",
    },
  ],
  cta: { label: "Upgrade to Pro", variant: "default" },
  ctaCaption: "$20/month after your 14-day trial ends",
};

function PlanCard({
  plan,
  onUpgrade,
}: {
  plan: PlanCardData;
  onUpgrade: () => void;
}) {
  const CtaIcon = plan.cta.icon;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-md border p-4",
        plan.featured
          ? "border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25 dark:border-blue-400/30 dark:from-blue-500/10 dark:to-blue-500/5"
          : "border-border bg-card"
      )}
      data-plan-card
    >
      <div className="flex items-center justify-between gap-4">
        <p className="type-heading-18 m-0 text-foreground">{plan.title}</p>
      </div>

      <h3 className="type-heading-32 m-0 text-foreground tabular-nums tracking-tight">
        {plan.price}
        <span className="type-copy-18 text-muted-foreground"> per month</span>
      </h3>

      <div className="flex flex-col gap-4">
        <p className="type-label-12 m-0 text-foreground">
          {plan.benefitsLabel}
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {plan.features.map(({ Icon, title, detail }) => (
            <li className="flex items-start gap-3" key={title}>
              <Icon
                aria-hidden
                className={cn(
                  "mt-1 size-4 shrink-0",
                  plan.featured
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-muted-foreground"
                )}
                strokeWidth={1.75}
              />
              <div className="flex flex-col">
                <span className="type-copy-14 text-foreground">{title}</span>
                <span className="type-copy-12 text-pretty text-muted-foreground">
                  {detail}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-2">
        <Button
          aria-label={plan.cta.ariaLabel}
          className={cn(
            "w-full",
            plan.featured &&
              "bg-blue-700 text-white shadow-blue-700/30 shadow-sm hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
          )}
          disabled={plan.cta.disabled}
          onClick={
            plan.cta.disabled ? undefined : (plan.cta.onClick ?? onUpgrade)
          }
          variant={plan.cta.variant}
        >
          {plan.featured ? (
            <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
          ) : null}
          {CtaIcon ? <CtaIcon className="size-4" /> : null}
          {plan.cta.label}
        </Button>
        <p className="type-copy-12 m-0 text-center text-muted-foreground">
          {plan.ctaCaption}
        </p>
      </div>
    </div>
  );
}

export function PlanComparisonDialog({
  open,
  onOpenChange,
  onUpgrade,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onUpgrade: () => void;
}) {
  const cardsRef = useRef<HTMLDivElement>(null);

  // Stagger the plan cards in just after the Dialog primitive's own
  // enter animation, scoped to this content so cleanup is automatic.
  useGSAP(
    () => {
      if (!(open && cardsRef.current)) {
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const cards = cardsRef.current.querySelectorAll("[data-plan-card]");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.12,
        }
      );
    },
    { scope: cardsRef, dependencies: [open] }
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-4 overflow-hidden p-4 sm:p-6 md:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="type-heading-18 text-foreground">
            Manage subscription
          </DialogTitle>
        </DialogHeader>
        <div
          className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2"
          ref={cardsRef}
        >
          <PlanCard onUpgrade={onUpgrade} plan={FREE_PLAN} />
          <PlanCard
            onUpgrade={() => {
              onOpenChange(false);
              onUpgrade();
            }}
            plan={PRO_PLAN}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
