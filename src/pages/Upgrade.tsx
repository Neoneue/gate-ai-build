import {
  BarChart3,
  Coins,
  EyeOff,
  Fingerprint,
  KeyRound,
  type LucideIcon,
  MessagesSquare,
  Route,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import type { ComponentType } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { SparklesIcon } from "@/components/ui/sparkles";
import { DashboardChrome } from "@/layouts/DashboardChrome";

type PlanFeature = { Icon: LucideIcon; title: string; detail: string };

type PlanCardData = {
  badge: { label: string; tone: "neutral" | "pro" };
  price: string;
  benefitsLabel: string;
  features: PlanFeature[];
  featured?: boolean;
  cta: {
    label: string;
    variant: "default" | "outline";
    icon?: ComponentType<{
      size?: number;
      className?: string;
      "aria-hidden"?: boolean;
    }>;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
  };
};

const FREE_PLAN: PlanCardData = {
  badge: { label: "FREE", tone: "neutral" },
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
      title: "Tamper-evident audit",
      detail: "Every request fingerprinted to Constellation Digital Evidence",
    },
    {
      Icon: BarChart3,
      title: "Activity & request logs",
      detail: "Cost, tokens, and latency across the workspace",
    },
    {
      Icon: MessagesSquare,
      title: "Conversation threading",
      detail: "Follow agent runs and chats end-to-end",
    },
  ],
  cta: {
    label: "Current plan",
    variant: "outline",
    disabled: true,
    ariaLabel: "Free plan is your current plan",
  },
};

const PRO_PLAN: PlanCardData = {
  featured: true,
  badge: { label: "PRO PLAN", tone: "pro" },
  price: "$20",
  benefitsLabel: "What you'll get going Pro:",
  features: [
    {
      Icon: ShieldAlert,
      title: "Prompt injection scanning",
      detail: "Block or flag before tokens reach the model",
    },
    {
      Icon: EyeOff,
      title: "PII & PHI redaction",
      detail: "Detect and redact before sensitive data reaches the model",
    },
    {
      Icon: KeyRound,
      title: "Credential leak prevention",
      detail: "Stop API keys and secrets from leaking in requests or responses",
    },
    {
      Icon: SlidersHorizontal,
      title: "Spend, token & rate limits",
      detail:
        "Caps at the org, project, or key level, to stay within your budget",
    },
    {
      Icon: Coins,
      title: "Token savings",
      detail: "Cache and compression per request to cut excess token costs",
    },
  ],
  cta: { label: "Upgrade to Pro", variant: "default", icon: SparklesIcon },
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
      className={`flex flex-col gap-4 rounded-md border bg-card p-4 ${plan.featured ? "border-primary/30 ring-1 ring-primary/20" : "border-border"}`}
    >
      <Badge
        className={`self-start ${plan.badge.tone === "pro" ? "" : "border border-border"}`}
        variant={plan.badge.tone === "pro" ? "info" : "neutral"}
      >
        {plan.badge.label}
      </Badge>

      <p className="m-0 font-medium text-2xl text-neutral-900 tabular-nums tracking-tight">
        {plan.price}
        <span className="text-lg text-muted-foreground"> per month</span>
      </p>

      <div className="flex flex-col gap-2">
        <p className="m-0 font-medium text-neutral-900 text-xs">
          {plan.benefitsLabel}
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {plan.features.map(({ Icon, title, detail }) => (
            <li className="flex items-start gap-3" key={title}>
              <span
                aria-hidden
                className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted"
              >
                <Icon
                  className="size-3.5 text-neutral-700"
                  strokeWidth={1.75}
                />
              </span>
              <div className="flex flex-col">
                <span className="text-neutral-900 text-sm">{title}</span>
                <span className="text-pretty text-neutral-500 text-xs">
                  {detail}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-2">
        <Button
          aria-label={plan.cta.ariaLabel}
          className="w-full"
          disabled={plan.cta.disabled}
          onClick={
            plan.cta.disabled ? undefined : (plan.cta.onClick ?? onUpgrade)
          }
          variant={plan.cta.variant}
        >
          {CtaIcon ? <CtaIcon aria-hidden size={16} /> : null}
          {plan.cta.label}
        </Button>
      </div>
    </div>
  );
}

export function Upgrade() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="limits"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex max-w-1/2 flex-col gap-2">
        <PageTitle>Limits & quotas</PageTitle>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-tight">
          Enforce spend, token, and request rate caps at the org, project, or
          key level. Limits run inline with no separate billing system to wire
          up.
        </p>
      </div>
      <section aria-labelledby="compare-plans-heading">
        <div className="mb-4 flex flex-col gap-2">
          <h2
            className="m-0 font-medium font-sans text-lg text-neutral-900 tracking-tight"
            id="compare-plans-heading"
          >
            Compare plans
          </h2>
          <p className="m-0 font-sans text-neutral-500 text-sm">
            Choose the plan that fits your team. Upgrade any time from your
            billing settings.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlanCard onUpgrade={() => navigate("/billing")} plan={FREE_PLAN} />
          <PlanCard onUpgrade={() => navigate("/billing")} plan={PRO_PLAN} />
        </div>
      </section>
    </DashboardChrome>
  );
}
