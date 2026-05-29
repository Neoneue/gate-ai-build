import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ShieldAlert, EyeOff, KeyRound, Radar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { ACTION_BADGE, TYPE_META, type EventRow, parseEventTime } from '@/pages/security-data';
import { SECURITY_FEED } from '@/pages/security-feed';
import { PlanComparisonDialog, type PlanFeature } from '@/pages/plan-comparison-dialog';
import { formatTimestamp } from '@/lib/formatters';

const ROW_HEIGHT = 48;
const TICK_MS = 3000;
const SLIDE_MS = 600;
const FADE_DELAY = 0;
const FADE_DURATION = 360;
const SLIDE_DELAY = 100;
const VISIBLE_ROWS = 6;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';


function SecurityEventsTable() {
  // data[0] is the incoming row, mounted hidden above the header.
  // data[1..VISIBLE_ROWS] are the 6 visible rows.
  const cursorRef = useRef(VISIBLE_ROWS + 1);
  // Visible window shows newest at top, oldest at bottom. Take the first 7
  // chronological events (the oldest of the pool) and reverse so data[0] is
  // the incoming "next newest" and data[6] is the oldest of the visible six.
  const [data, setData] = useState<EventRow[]>(() => SECURITY_FEED.slice(0, VISIBLE_ROWS + 1).reverse());
  const [playing, setPlaying] = useState(false);
  // Lazy init reads matchMedia once on mount — avoids the cascading render
  // that a useEffect setState would trigger.
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    // Pause the ticker when the tab/window isn't visible — decorative motion
    // shouldn't burn paint/battery off-screen.
    let id: ReturnType<typeof setInterval> | null = null;
    const tick = reducedMotion
      ? () => {
          const next = SECURITY_FEED[cursorRef.current % SECURITY_FEED.length];
          cursorRef.current += 1;
          setData((d) => [next, ...d.slice(0, VISIBLE_ROWS)]);
        }
      : () => setPlaying(true);
    const start = () => { if (id == null) id = setInterval(tick, TICK_MS); };
    const stop = () => { if (id != null) { clearInterval(id); id = null; } };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLTableSectionElement>) => {
    if (!playing) return;
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    const next = SECURITY_FEED[cursorRef.current % SECURITY_FEED.length];
    cursorRef.current += 1;
    setData((d) => [next, ...d.slice(0, VISIBLE_ROWS)]);
    setPlaying(false);
  };

  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-card-soft overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-neutral-900 m-0">Latest security events</h3>
      </div>
      <div className="overflow-hidden">
        <table className="w-full text-sm border-separate table-fixed" style={{ borderSpacing: 0, marginBottom: -ROW_HEIGHT }} aria-hidden>
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[22%]" />
          <col className="w-[20%]" />
          <col className="w-[28%]" />
        </colgroup>
        <thead className="relative z-10">
          <tr>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500 bg-neutral-50 border-b border-border">Time</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500 bg-neutral-50 border-b border-border">Type</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500 bg-neutral-50 border-b border-border">Action</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500 bg-neutral-50 border-b border-border">Key</th>
          </tr>
        </thead>
        <tbody
          className="[&>tr>td]:border-t [&>tr>td]:border-border"
          style={{
            transform: playing ? 'translateY(-1px)' : `translateY(-${ROW_HEIGHT + 1}px)`,
            transition: playing && !reducedMotion ? `transform ${SLIDE_MS}ms ${EASE_OUT} ${SLIDE_DELAY}ms` : 'none',
            willChange: reducedMotion ? undefined : 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
          aria-hidden
        >
          {data.map((row, idx) => {
            const badge = ACTION_BADGE[row.action];
            const typeMeta = TYPE_META[row.type];
            const TypeIcon = typeMeta.Icon;
            const isLast = idx === data.length - 1;
            return (
              <tr
                key={`row-${idx}`}
                className="h-12"
                style={isLast && !reducedMotion ? {
                  opacity: playing ? 0 : 1,
                  filter: playing ? 'blur(3px)' : 'blur(0)',
                  transition: playing
                    ? `opacity ${FADE_DURATION}ms ${EASE_OUT} ${FADE_DELAY}ms, filter ${FADE_DURATION}ms ${EASE_OUT} ${FADE_DELAY}ms`
                    : 'none',
                } : undefined}
              >
                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-800 font-mono tabular-nums">{formatTimestamp(parseEventTime(row.time))}</td>
                <td className="whitespace-nowrap px-4 py-3 align-middle">
                  <span className="inline-flex items-center gap-2 align-middle">
                    <TypeIcon className="size-4 shrink-0" style={{ color: typeMeta.color }} strokeWidth={1.75} aria-hidden />
                    <span className="text-xs text-neutral-800">{typeMeta.label}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500 font-mono">{row.key.split(' (')[0]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

// Default "What you'll get going Pro" list — the Security feature set. Pages
// that gate different Pro surfaces can pass their own `features` to HeroCard;
// omitting the prop renders this security list unchanged.
const DEFAULT_PRO_FEATURES: PlanFeature[] = [
  { Icon: ShieldAlert, title: 'Prompt injection scanning', detail: 'Block or flag before tokens reach the model' },
  { Icon: EyeOff,      title: 'PII & PHI redaction',        detail: 'Detect and redact before sensitive data reaches the model' },
  { Icon: KeyRound,    title: 'Credential leak prevention', detail: 'Catch provider tokens in prompts and completions' },
  { Icon: Radar,       title: 'Per-key risk scoring',       detail: 'Normal, elevated, or critical tier on every event' },
];

export function HeroCard({ features = DEFAULT_PRO_FEATURES, preview }: { features?: PlanFeature[]; preview?: ReactNode } = {}) {
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <div>
    <Card density="flush">
      <div className="flex">
        {/* Left panel */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="info">PRO PLAN</Badge>
              <span className="text-xs font-medium text-neutral-500">
                $30 / month after your 14-day trial ends
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-medium tracking-tight text-balance text-neutral-900 m-0">
                Inspect <span className="text-blue-600">every</span> detection, gate <span className="text-blue-600">every</span> threat.
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-neutral-900 m-0">
                What you&rsquo;ll get going Pro:
              </p>
              <ul className="flex flex-col gap-4 m-0 p-4 list-none rounded-md border border-border bg-card">
              {features.map(({ Icon, title, detail }) => (
                <li
                  key={title}
                  className="flex items-center gap-4"
                >
                  <span aria-hidden className="shrink-0 size-8 rounded-md bg-muted flex items-center justify-center">
                    <Icon className="size-4 text-neutral-700" strokeWidth={1.75} />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-900">{title}</span>
                    <span className="text-sm text-neutral-500 text-pretty">{detail}</span>
                  </div>
                </li>
              ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button onClick={() => navigate('/billing')}>Go to Billing</Button>
              <Button variant="outline" onClick={() => setCompareOpen(true)}>
                Compare plans
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — latest security events preview */}
        <div className="flex-1 border-l border-border bg-neutral-50 flex flex-col justify-center p-8">
          {preview ?? <SecurityEventsTable />}
        </div>
      </div>
    </Card>
    <PlanComparisonDialog open={compareOpen} onOpenChange={setCompareOpen} onUpgrade={() => navigate('/billing')} />
    </div>
  );
}

export function SecurityDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="security-events"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Security events</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          See every threat event your policies caught, with the prompt, model, and per-key risk tier behind each call. Anchored to Constellation's Digital Evidence layer so every detection is auditable, not just logged.
        </p>
      </div>
      <HeroCard />
    </DashboardChrome>
  );
}
