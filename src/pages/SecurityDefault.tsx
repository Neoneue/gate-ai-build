import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, ShieldAlert, EyeOff, KeyRound, Gauge, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { EVENT_ROWS, ACTION_BADGE, TYPE_META, type EventRow, parseEventTime } from '@/pages/Security';
import { formatTimestamp } from '@/lib/formatters';

const ROW_HEIGHT = 48;
const TICK_MS = 3000;
const SLIDE_MS = 900;
const VISIBLE_ROWS = 6;

function SecurityEventsTable() {
  const navigate = useNavigate();
  // data[0] is the incoming row, mounted hidden above the header.
  // data[1..VISIBLE_ROWS] are the 6 visible rows.
  const cursorRef = useRef(VISIBLE_ROWS + 1);
  const [data, setData] = useState<EventRow[]>(() => EVENT_ROWS.slice(0, VISIBLE_ROWS + 1));
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      const id = setInterval(() => {
        const next = EVENT_ROWS[cursorRef.current % EVENT_ROWS.length];
        cursorRef.current += 1;
        setData((d) => [next, ...d.slice(0, VISIBLE_ROWS)]);
      }, TICK_MS);
      return () => clearInterval(id);
    }
    const id = setInterval(() => setPlaying(true), TICK_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const handleTransitionEnd = () => {
    if (!playing) return;
    const next = EVENT_ROWS[cursorRef.current % EVENT_ROWS.length];
    cursorRef.current += 1;
    setData((d) => [next, ...d.slice(0, VISIBLE_ROWS)]);
    setPlaying(false);
  };

  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-neutral-900 m-0">Latest security events</h3>
        <Link
          to="/security"
          className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm px-2 py-2 -mx-2 -my-2"
        >
          View all →
        </Link>
      </div>
      <div className="overflow-hidden">
        <table className="w-full text-sm border-separate" style={{ borderSpacing: 0, marginBottom: -ROW_HEIGHT }} aria-label="Latest security events">
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
            transition: playing && !reducedMotion ? `transform ${SLIDE_MS}ms ease-out` : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
          aria-live="polite"
        >
          {data.map((row, idx) => {
            const badge = ACTION_BADGE[row.action];
            const typeMeta = TYPE_META[row.type];
            const TypeIcon = typeMeta.Icon;
            return (
              <tr
                key={`row-${idx}`}
                tabIndex={0}
                aria-label={row.requestId ? `View security event ${row.requestId}` : 'View security event'}
                className="h-12 cursor-pointer [@media(hover:hover)_and_(pointer:fine)]:hover:bg-neutral-50 active:bg-neutral-100 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
                onClick={() => navigate(`/security?open=${row.requestId}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}
              >
                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-800 font-mono">{formatTimestamp(parseEventTime(row.time))}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-2">
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

function HeroCard() {
  const navigate = useNavigate();

  return (
    <Card density="flush">
      <div className="flex">
        {/* Left panel */}
        <div className="flex-1 flex flex-col">
          <div className="p-8 flex flex-col gap-6 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="info">PRO PLAN</Badge>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">
                $30 / MO · 14-DAY TRIAL
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 m-0">
                See every threat. Inspect every detection.
              </h2>
              <p className="text-sm text-neutral-600 text-pretty max-w-md m-0">
                Security Events is a forensics-grade log of every scan Constellation Gate ran on your behalf, with the exact prompt, model, detection rationale, and audit anchor for each row.
              </p>
            </div>

            <ul className="flex flex-col gap-4 m-0 p-0 list-none">
              {([
                { Icon: ShieldAlert, title: 'Real-time prompt injection scanning', detail: '12 attack patterns · indirect & unicode' },
                { Icon: EyeOff,      title: 'PII & PHI redaction',                 detail: 'GDPR · HIPAA · SOC2-aligned' },
                { Icon: KeyRound,    title: 'Credential leak prevention',          detail: 'AWS, OpenAI, GitHub & 40+ providers' },
                { Icon: Gauge,       title: 'Per-key risk scoring',                detail: 'Quarantine compromised keys automatically' },
              ] as { Icon: LucideIcon; title: string; detail: string }[]).map(({ Icon, title, detail }) => (
                <li key={title} className="flex items-center gap-4">
                  <span aria-hidden className="shrink-0 size-10 rounded-md bg-muted bg-linear-to-b from-white/10 to-transparent flex items-center justify-center">
                    <Icon className="size-5 text-neutral-700" strokeWidth={1.75} />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900">{title}</span>
                    <span className="text-sm text-neutral-500 text-pretty">{detail}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/billing')}>
                Upgrade to Pro <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline">
                Compare plans
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — latest security events preview */}
        <div className="flex-1 border-l border-border bg-neutral-50 flex flex-col justify-center p-12">
          <SecurityEventsTable />
        </div>
      </div>
    </Card>
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
          Every injection, PII, and credential event your policies caught, anchored to Constellation's Digital Evidence layer. Blocked, flagged, or redacted.
        </p>
      </div>
      <HeroCard />
    </DashboardChrome>
  );
}
