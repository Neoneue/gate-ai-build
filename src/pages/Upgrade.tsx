import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Route,
  Anchor,
  BarChart3,
  MessagesSquare,
  ShieldAlert,
  EyeOff,
  KeyRound,
  SlidersHorizontal,
  Coins,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';

type PlanFeature = { Icon: LucideIcon; title: string; detail: string };

type PlanCardData = {
  badge: { label: string; tone: 'neutral' | 'pro' };
  price: string;
  benefitsLabel: string;
  features: PlanFeature[];
  featured?: boolean;
  cta: { label: string; variant: 'default' | 'outline'; icon?: LucideIcon; onClick?: () => void; disabled?: boolean; ariaLabel?: string };
};

const FREE_PLAN: PlanCardData = {
  badge: { label: 'FREE', tone: 'neutral' },
  price: '$0',
  benefitsLabel: 'Included in your Free plan:',
  features: [
    { Icon: Route, title: 'Multi-provider routing', detail: 'One base URL for OpenAI, Anthropic, and more' },
    { Icon: Anchor, title: 'Tamper-evident audit', detail: 'Every request anchored to Constellation Digital Evidence' },
    { Icon: BarChart3, title: 'Activity & request logs', detail: 'Cost, tokens, and latency across the workspace' },
    { Icon: MessagesSquare, title: 'Conversation threading', detail: 'Follow agent runs and chats end-to-end' },
  ],
  cta: { label: 'Current plan', variant: 'outline', disabled: true, ariaLabel: 'Free plan is your current plan' },
};

const PRO_PLAN: PlanCardData = {
  featured: true,
  badge: { label: 'PRO PLAN', tone: 'pro' },
  price: '$30',
  benefitsLabel: "What you'll get going Pro:",
  features: [
    { Icon: ShieldAlert, title: 'Prompt injection scanning', detail: 'Block or flag before tokens reach the model' },
    { Icon: EyeOff, title: 'PII & PHI redaction', detail: 'Detect and redact before sensitive data reaches the model' },
    { Icon: KeyRound, title: 'Credential leak prevention', detail: 'Stop API keys and secrets from leaking in requests or responses' },
    { Icon: SlidersHorizontal, title: 'Spend, token & rate limits', detail: 'Caps at the org, project, or key level, to stay within your budget' },
    { Icon: Coins, title: 'Token savings', detail: 'Cache and compression per request to cut excess token costs' },
  ],
  cta: { label: 'Upgrade to Pro', variant: 'default', icon: Sparkles },
};

function PlanCard({ plan, onUpgrade }: { plan: PlanCardData; onUpgrade: () => void }) {
  const CtaIcon = plan.cta.icon;
  return (
    <div
      className={`flex flex-col gap-4 rounded-md border bg-card p-4 ${plan.featured ? 'border-primary/30 ring-1 ring-primary/20' : 'border-border'}`}
    >
      <Badge
        variant={plan.badge.tone === 'pro' ? 'info' : 'neutral'}
        className={`self-start ${plan.badge.tone === 'pro' ? '' : 'border border-border'}`}
      >
        {plan.badge.label}
      </Badge>

      <h3 className="text-2xl font-medium tracking-tight text-neutral-900 tabular-nums m-0">
        {plan.price}
        <span className="text-lg text-muted-foreground"> per month</span>
      </h3>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-neutral-900 m-0">{plan.benefitsLabel}</p>
        <ul className="flex flex-col gap-3 m-0 p-0 list-none">
          {plan.features.map(({ Icon, title, detail }) => (
            <li key={title} className="flex items-start gap-3">
              <span aria-hidden className="shrink-0 size-7 rounded-sm bg-muted flex items-center justify-center mt-0.5">
                <Icon className="size-3.5 text-neutral-700" strokeWidth={1.75} />
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-neutral-900">{title}</span>
                <span className="text-xs text-neutral-500 text-pretty">{detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-2">
        <Button
          variant={plan.cta.variant}
          disabled={plan.cta.disabled}
          aria-label={plan.cta.ariaLabel}
          onClick={plan.cta.disabled ? undefined : (plan.cta.onClick ?? onUpgrade)}
          className="w-full"
        >
          {CtaIcon ? <CtaIcon className="size-4" /> : null}
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
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Limits & quotas</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Enforce spend, token, and request rate caps at the org, project, or key level. Limits run inline with no separate billing system to wire up.
        </p>
      </div>
      <section aria-labelledby="compare-plans-heading">
        <div className="flex flex-col gap-2 mb-4">
          <h2
            id="compare-plans-heading"
            className="font-sans text-lg font-medium tracking-tight text-neutral-900 m-0"
          >
            Compare plans
          </h2>
          <p className="font-sans text-sm text-neutral-500 m-0">
            Choose the plan that fits your team. Upgrade any time from your billing settings.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanCard plan={FREE_PLAN} onUpgrade={() => navigate('/billing')} />
          <PlanCard plan={PRO_PLAN} onUpgrade={() => navigate('/billing')} />
        </div>
      </section>
    </DashboardChrome>
  );
}
