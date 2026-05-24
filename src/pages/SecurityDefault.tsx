import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Sparkles, ShieldAlert, EyeOff, KeyRound, Radar, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { EVENT_ROWS, ACTION_BADGE, TYPE_META, type EventRow, parseEventTime } from '@/pages/Security';
import { formatTimestamp } from '@/lib/formatters';

const ROW_HEIGHT = 48;
const TICK_MS = 3000;
const SLIDE_MS = 600;
const FADE_DELAY = 0;
const FADE_DURATION = 360;
const SLIDE_DELAY = 100;
const VISIBLE_ROWS = 6;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

// 8 additional mock events with times earlier than EVENT_ROWS' oldest
// (09:21:09), chronological ASC, so the feed extends to 24 events before
// looping. Times march from 09:09:* up to 09:20:*.
const EXTRA_FEED: EventRow[] = [
  { time: '2026-05-12 09:09:42', relative: '40m ago', type: 'pii',        key: 'test-key (sk-gw-9f4)', action: 'redacted', requestId: 'req_polaris_4140',  conversationId: 'cnv_polaris_55',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '396',   outTokens: '184',   latency: '4.20s',  turn: 1,  totalTurns: 4  },
  { time: '2026-05-12 09:10:55', relative: '39m ago', type: 'injection',  key: 'nova-chat (sk-gw-e15)',     action: 'flagged',  requestId: 'req_vela_4144',     conversationId: 'cnv_vela_21',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '2,810', outTokens: '1,206', latency: '4.10s',  turn: 4,  totalTurns: 12 },
  { time: '2026-05-12 09:12:17', relative: '38m ago', type: 'credential', key: 'prod-agent (sk-gw-930)',    action: 'blocked',  requestId: 'req_orion_4148',    conversationId: 'cnv_orion_70',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '1,322', outTokens: '0',     latency: '2.10s',  turn: 2,  totalTurns: 18 },
  { time: '2026-05-12 09:14:02', relative: '36m ago', type: 'phi',        key: 'openclaw (sk-gw-1ab)',      action: 'flagged',  requestId: 'req_meridian_4152', conversationId: 'cnv_meridian_07', keyTier: 'elevated', status: 'success', code: '200', inTokens: '510',   outTokens: '236',   latency: '5.80s',  turn: 1,  totalTurns: 3  },
  { time: '2026-05-12 09:15:38', relative: '35m ago', type: 'pii',        key: 'hermes-agent (sk-gw-c60)',  action: 'redacted', requestId: 'req_skylark_4155',  conversationId: 'cnv_skylark_18',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '710',   outTokens: '302',   latency: '3.60s',  turn: 1,  totalTurns: 6  },
  { time: '2026-05-12 09:17:11', relative: '33m ago', type: 'injection',  key: 'development (sk-gw-7d2)',           action: 'flagged',  requestId: 'req_lyra_4158',     conversationId: 'cnv_lyra_92',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '402',   outTokens: '180',   latency: '3.40s',  turn: 1,  totalTurns: 14 },
  { time: '2026-05-12 09:18:46', relative: '32m ago', type: 'phi',        key: 'prod-agent (sk-gw-930)',    action: 'redacted', requestId: 'req_orion_4162',    conversationId: 'cnv_orion_70',    keyTier: 'normal',   status: 'success', code: '200', inTokens: '1,378', outTokens: '498',   latency: '6.10s',  turn: 3,  totalTurns: 18 },
  { time: '2026-05-12 09:20:01', relative: '30m ago', type: 'credential', key: 'prod-web (sk-gw-438)',      action: 'flagged',  requestId: 'req_aurora_4166',   conversationId: 'cnv_aurora_42',   keyTier: 'elevated', status: 'success', code: '200', inTokens: '602',   outTokens: '288',   latency: '3.90s',  turn: 1,  totalTurns: 3  },
];

// 8 more mock events with times AFTER EVENT_ROWS' newest (09:48:14),
// chronological ASC, so the feed extends past the live Security data.
// Times march from 09:49:* up to 09:56:*.
const POST_EXTRA_FEED: EventRow[] = [
  { time: '2026-05-12 09:49:33', relative: '1m ago',  type: 'pii',        key: 'hermes-agent (sk-gw-c60)',  action: 'flagged',  requestId: 'req_skylark_4233',  conversationId: 'cnv_skylark_18',   keyTier: 'normal',   status: 'success', code: '200', inTokens: '702',   outTokens: '316',   latency: '3.40s',  turn: 5,  totalTurns: 6  },
  { time: '2026-05-12 09:50:48', relative: '1m ago',  type: 'phi',        key: 'openclaw (sk-gw-1ab)',      action: 'redacted', requestId: 'req_meridian_4235', conversationId: 'cnv_meridian_07',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '514',   outTokens: '224',   latency: '4.90s',  turn: 3,  totalTurns: 3  },
  { time: '2026-05-12 09:51:52', relative: 'just now',type: 'injection',  key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4237',   conversationId: 'cnv_aurora_42',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '604',   outTokens: '0',     latency: '2.10s',  turn: 3,  totalTurns: 3  },
  { time: '2026-05-12 09:52:41', relative: 'just now',type: 'credential', key: 'nova-chat (sk-gw-e15)',     action: 'flagged',  requestId: 'req_vela_4239',     conversationId: 'cnv_vela_21',      keyTier: 'elevated', status: 'success', code: '200', inTokens: '3,914', outTokens: '1,728', latency: '4.20s',  turn: 10, totalTurns: 12 },
  { time: '2026-05-12 09:53:30', relative: 'just now',type: 'pii',        key: 'development (sk-gw-7d2)',   action: 'redacted', requestId: 'req_lyra_4241',     conversationId: 'cnv_lyra_92',      keyTier: 'normal',   status: 'success', code: '200', inTokens: '418',   outTokens: '198',   latency: '5.10s',  turn: 9,  totalTurns: 14 },
  { time: '2026-05-12 09:54:18', relative: 'just now',type: 'phi',        key: 'prod-agent (sk-gw-930)',    action: 'flagged',  requestId: 'req_orion_4243',    conversationId: 'cnv_orion_70',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '1,422', outTokens: '506',   latency: '7.80s',  turn: 13, totalTurns: 18 },
  { time: '2026-05-12 09:55:07', relative: 'just now',type: 'injection',  key: 'test-key (sk-gw-9f4)',      action: 'flagged',  requestId: 'req_polaris_4245',  conversationId: 'cnv_polaris_55',   keyTier: 'elevated', status: 'success', code: '200', inTokens: '488',   outTokens: '226',   latency: '5.60s',  turn: 4,  totalTurns: 4  },
  { time: '2026-05-12 09:56:02', relative: 'just now',type: 'credential', key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4248',   conversationId: 'cnv_aurora_42',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '596',   outTokens: '0',     latency: '2.10s',  turn: 3,  totalTurns: 3  },
];

// 32-event feed in chronological ASC order: 8 pre-extras, all 16 mid events
// from EVENT_ROWS (slice reversed to chronological), then 8 post-extras. The
// rotation walks the full array before looping, so each new top row is
// strictly later in time than the previous one until a single wrap.
const SECURITY_FEED: EventRow[] = [
  ...EXTRA_FEED,
  ...[...EVENT_ROWS].slice(-16).reverse(),
  ...POST_EXTRA_FEED,
];

function SecurityEventsTable() {
  // data[0] is the incoming row, mounted hidden above the header.
  // data[1..VISIBLE_ROWS] are the 6 visible rows.
  const cursorRef = useRef(VISIBLE_ROWS + 1);
  // Visible window shows newest at top, oldest at bottom. Take the first 7
  // chronological events (the oldest of the pool) and reverse so data[0] is
  // the incoming "next newest" and data[6] is the oldest of the visible six.
  const [data, setData] = useState<EventRow[]>(() => SECURITY_FEED.slice(0, VISIBLE_ROWS + 1).reverse());
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

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
    const onVisibility = () => { document.visibilityState === 'visible' ? start() : stop(); };
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
        <table className="w-full text-sm border-separate table-fixed" style={{ borderSpacing: 0, marginBottom: -ROW_HEIGHT }} aria-label="Latest security events">
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
  // First-mount cascade. `cardMounted` drives the parent card fade-up; once
  // that's underway, `itemsMounted` releases the per-item stagger so the
  // list visibly follows the card in.
  const [cardMounted, setCardMounted] = useState(false);
  const [itemsMounted, setItemsMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setCardMounted(true));
    const timeout = setTimeout(() => setItemsMounted(true), 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className="motion-reduce:transition-none"
      style={{
        opacity: cardMounted ? 1 : 0,
        transform: cardMounted ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 480ms ${EASE_OUT}, transform 480ms ${EASE_OUT}`,
      }}
    >
    <Card density="flush">
      <div className="flex">
        {/* Left panel */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="border border-border">PRO PLAN</Badge>
              <span className="text-xs font-medium text-neutral-500">
                $30 / month after your 14-day trial ends
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-medium tracking-tight text-balance text-neutral-900 m-0">
                See <span className="text-blue-600">every</span> threat. Inspect <span className="text-blue-600">every</span> detection.
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-neutral-900 m-0">
                What you&rsquo;ll get going Pro:
              </p>
              <ul className="flex flex-col gap-4 m-0 p-4 list-none rounded-md border border-border bg-card">
              {([
                { Icon: ShieldAlert, title: 'Real-time prompt injection scanning', detail: 'Block or flag before tokens reach the model' },
                { Icon: EyeOff,      title: 'PII & PHI redaction',                 detail: 'Detect and redact before sensitive data reaches the model' },
                { Icon: KeyRound,    title: 'Credential leak prevention',          detail: 'Catch provider tokens in prompts and completions' },
                { Icon: Radar,       title: 'Per-key risk scoring',                detail: 'Normal, elevated, or critical tier on every event' },
              ] as { Icon: LucideIcon; title: string; detail: string }[]).map(({ Icon, title, detail }, idx) => (
                <li
                  key={title}
                  className="flex items-center gap-4 motion-reduce:transition-none"
                  style={{
                    opacity: itemsMounted ? 1 : 0,
                    transform: itemsMounted ? 'translateY(0)' : 'translateY(8px)',
                    transition: `opacity 320ms ${EASE_OUT} ${idx * 80}ms, transform 320ms ${EASE_OUT} ${idx * 80}ms`,
                  }}
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
              <Button onClick={() => navigate('/billing')}>
                <Sparkles className="size-4" /> Upgrade to Pro
              </Button>
              <Button variant="outline" onClick={() => navigate('/billing')}>
                Compare plans
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — latest security events preview */}
        <div className="flex-1 border-l border-border bg-neutral-50 flex flex-col justify-center p-8">
          <SecurityEventsTable />
        </div>
      </div>
    </Card>
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
