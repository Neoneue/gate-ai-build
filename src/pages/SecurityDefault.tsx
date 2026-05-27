import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Sparkles, ShieldAlert, EyeOff, KeyRound, Radar, BarChart3, Route, Anchor, MessagesSquare, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { ACTION_BADGE, TYPE_META, type EventRow, parseEventTime } from '@/pages/Security';
import { formatTimestamp } from '@/lib/formatters';

const ROW_HEIGHT = 48;
const TICK_MS = 3000;
const SLIDE_MS = 600;
const FADE_DELAY = 0;
const FADE_DURATION = 360;
const SLIDE_DELAY = 100;
const VISIBLE_ROWS = 6;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

// Self-contained 48-event feed in chronological ASC order. No external data
// dependency — every event needed to drive the rotation animation lives here.
// The rotation walks the full array before looping, so each new top row is
// strictly later in time than the previous one until a single wrap.
const SECURITY_FEED: EventRow[] = [
  // Early band (09:09–09:20) — 8 events
  { time: '2026-05-12 09:09:42', relative: '40m ago', type: 'pii',        key: 'test-key (sk-gw-9f4)',      action: 'redacted', requestId: 'req_polaris_4140',  conversationId: 'cnv_polaris_55',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '396',   outTokens: '184',   latency: '4.20s',  turn: 1,  totalTurns: 4  },
  { time: '2026-05-12 09:10:55', relative: '39m ago', type: 'injection',  key: 'nova-chat (sk-gw-e15)',     action: 'flagged',  requestId: 'req_vela_4144',     conversationId: 'cnv_vela_21',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '2,810', outTokens: '1,206', latency: '4.10s',  turn: 4,  totalTurns: 12 },
  { time: '2026-05-12 09:12:17', relative: '38m ago', type: 'credential', key: 'prod-agent (sk-gw-930)',    action: 'blocked',  requestId: 'req_orion_4148',    conversationId: 'cnv_orion_70',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '1,322', outTokens: '0',     latency: '2.10s',  turn: 2,  totalTurns: 18 },
  { time: '2026-05-12 09:14:02', relative: '36m ago', type: 'phi',        key: 'openclaw (sk-gw-1ab)',      action: 'flagged',  requestId: 'req_meridian_4152', conversationId: 'cnv_meridian_07', keyTier: 'elevated', status: 'success', code: '200', inTokens: '510',   outTokens: '236',   latency: '5.80s',  turn: 1,  totalTurns: 3  },
  { time: '2026-05-12 09:15:38', relative: '35m ago', type: 'pii',        key: 'hermes-agent (sk-gw-c60)',  action: 'redacted', requestId: 'req_skylark_4155',  conversationId: 'cnv_skylark_18',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '710',   outTokens: '302',   latency: '3.60s',  turn: 1,  totalTurns: 6  },
  { time: '2026-05-12 09:17:11', relative: '33m ago', type: 'injection',  key: 'development (sk-gw-7d2)',   action: 'flagged',  requestId: 'req_lyra_4158',     conversationId: 'cnv_lyra_92',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '402',   outTokens: '180',   latency: '3.40s',  turn: 1,  totalTurns: 14 },
  { time: '2026-05-12 09:18:46', relative: '32m ago', type: 'phi',        key: 'prod-agent (sk-gw-930)',    action: 'redacted', requestId: 'req_orion_4162',    conversationId: 'cnv_orion_70',    keyTier: 'normal',   status: 'success', code: '200', inTokens: '1,378', outTokens: '498',   latency: '6.10s',  turn: 3,  totalTurns: 18 },
  { time: '2026-05-12 09:20:01', relative: '30m ago', type: 'credential', key: 'prod-web (sk-gw-438)',      action: 'flagged',  requestId: 'req_aurora_4166',   conversationId: 'cnv_aurora_42',   keyTier: 'elevated', status: 'success', code: '200', inTokens: '602',   outTokens: '288',   latency: '3.90s',  turn: 1,  totalTurns: 3  },
  // Mid band (09:21–09:46) — 16 events, mirrors the Security page log
  { time: '2026-05-12 09:21:09', relative: '29m ago', type: 'pii',        key: 'prod-web (sk-gw-438)',      action: 'flagged',  requestId: 'req_lyra_4229',     conversationId: 'cnv_lyra_92',     keyTier: 'normal',   status: 'success', code: '200', inTokens: '392',   outTokens: '196',   latency: '11.80s', turn: 4,  totalTurns: 14 },
  { time: '2026-05-12 09:24:47', relative: '25m ago', type: 'injection',  key: 'prod-agent (sk-gw-930)',    action: 'flagged',  requestId: 'req_orion_4225',    conversationId: 'cnv_orion_70',    keyTier: 'elevated', status: 'success', code: '200', inTokens: '1,410', outTokens: '612',   latency: '14.60s', turn: 14, totalTurns: 18 },
  { time: '2026-05-12 09:27:14', relative: '23m ago', type: 'credential', key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4223',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '588',   outTokens: '0',     latency: '2.10s',  turn: 1,  totalTurns: 3  },
  { time: '2026-05-12 09:29:32', relative: '21m ago', type: 'phi',        key: 'test-key (sk-gw-9f4)',      action: 'redacted', requestId: 'req_polaris_4221',  conversationId: 'cnv_polaris_55',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '480',   outTokens: '232',   latency: '5.40s',  turn: 3,  totalTurns: 4  },
  { time: '2026-05-12 09:30:09', relative: '20m ago', type: 'credential', key: 'nova-chat (sk-gw-e15)',     action: 'flagged',  requestId: 'req_vela_4220',     conversationId: 'cnv_vela_21',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '3,892', outTokens: '1,718', latency: '3.90s',  turn: 9,  totalTurns: 12 },
  { time: '2026-05-12 09:31:51', relative: '18m ago', type: 'injection',  key: 'hermes-agent (sk-gw-c60)',  action: 'flagged',  requestId: 'req_skylark_4218',  conversationId: 'cnv_skylark_18',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '728',   outTokens: '348',   latency: '13.40s', turn: 4,  totalTurns: 6  },
  { time: '2026-05-12 09:32:18', relative: '18m ago', type: 'phi',        key: 'openclaw (sk-gw-1ab)',      action: 'redacted', requestId: 'req_meridian_4218', conversationId: 'cnv_meridian_07', keyTier: 'normal',   status: 'success', code: '200', inTokens: '522',   outTokens: '234',   latency: '5.40s',  turn: 2,  totalTurns: 3  },
  { time: '2026-05-12 09:34:42', relative: '15m ago', type: 'pii',        key: 'development (sk-gw-7d2)',   action: 'redacted', requestId: 'req_lyra_4215',     conversationId: 'cnv_lyra_92',     keyTier: 'normal',   status: 'success', code: '200', inTokens: '408',   outTokens: '196',   latency: '4.50s',  turn: 6,  totalTurns: 14 },
  { time: '2026-05-12 09:36:33', relative: '13m ago', type: 'phi',        key: 'prod-agent (sk-gw-930)',    action: 'flagged',  requestId: 'req_orion_4213',    conversationId: 'cnv_orion_70',    keyTier: 'elevated', status: 'success', code: '200', inTokens: '1,402', outTokens: '482',   latency: '6.40s',  turn: 11, totalTurns: 18 },
  { time: '2026-05-12 09:38:21', relative: '12m ago', type: 'credential', key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4212',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '588',   outTokens: '0',     latency: '2.10s',  turn: 2,  totalTurns: 3  },
  { time: '2026-05-12 09:39:58', relative: '10m ago', type: 'pii',        key: 'test-key (sk-gw-9f4)',      action: 'flagged',  requestId: 'req_polaris_4210',  conversationId: 'cnv_polaris_55',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '484',   outTokens: '220',   latency: '5.20s',  turn: 2,  totalTurns: 4  },
  { time: '2026-05-12 09:40:44', relative: '9m ago',  type: 'injection',  key: 'nova-chat (sk-gw-e15)',     action: 'blocked',  requestId: 'req_vela_4209',     conversationId: 'cnv_vela_21',     keyTier: 'critical', status: 'error',   code: '403', inTokens: '3,902', outTokens: '0',     latency: '2.10s',  turn: 7,  totalTurns: 12 },
  { time: '2026-05-12 09:41:08', relative: '9m ago',  type: 'pii',        key: 'hermes-agent (sk-gw-c60)',  action: 'redacted', requestId: 'req_skylark_4209',  conversationId: 'cnv_skylark_18',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '742',   outTokens: '318',   latency: '3.80s',  turn: 3,  totalTurns: 6  },
  { time: '2026-05-12 09:42:26', relative: '8m ago',  type: 'injection',  key: 'openclaw (sk-gw-1ab)',      action: 'blocked',  requestId: 'req_meridian_4208', conversationId: 'cnv_meridian_07', keyTier: 'critical', status: 'error',   code: '403', inTokens: '548',   outTokens: '0',     latency: '2.10s',  turn: 1,  totalTurns: 3  },
  { time: '2026-05-12 09:43:10', relative: '7m ago',  type: 'injection',  key: 'development (sk-gw-7d2)',   action: 'flagged',  requestId: 'req_lyra_4207',     conversationId: 'cnv_lyra_92',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '412',   outTokens: '188',   latency: '3.20s',  turn: 8,  totalTurns: 14 },
  { time: '2026-05-12 09:46:23', relative: '4m ago',  type: 'credential', key: 'prod-agent (sk-gw-930)',    action: 'blocked',  requestId: 'req_orion_4203',    conversationId: 'cnv_orion_70',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '1,408', outTokens: '0',     latency: '2.10s',  turn: 5,  totalTurns: 18 },
  // Late band (09:49–09:56) — 8 events
  { time: '2026-05-12 09:49:33', relative: '1m ago',  type: 'pii',        key: 'hermes-agent (sk-gw-c60)',  action: 'flagged',  requestId: 'req_skylark_4233',  conversationId: 'cnv_skylark_18',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '702',   outTokens: '316',   latency: '3.40s',  turn: 5,  totalTurns: 6  },
  { time: '2026-05-12 09:50:48', relative: '1m ago',  type: 'phi',        key: 'openclaw (sk-gw-1ab)',      action: 'redacted', requestId: 'req_meridian_4235', conversationId: 'cnv_meridian_07', keyTier: 'normal',   status: 'success', code: '200', inTokens: '514',   outTokens: '224',   latency: '4.90s',  turn: 3,  totalTurns: 3  },
  { time: '2026-05-12 09:51:52', relative: 'just now',type: 'injection',  key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4237',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '604',   outTokens: '0',     latency: '2.10s',  turn: 3,  totalTurns: 3  },
  { time: '2026-05-12 09:52:41', relative: 'just now',type: 'credential', key: 'nova-chat (sk-gw-e15)',     action: 'flagged',  requestId: 'req_vela_4239',     conversationId: 'cnv_vela_21',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '3,914', outTokens: '1,728', latency: '4.20s',  turn: 10, totalTurns: 12 },
  { time: '2026-05-12 09:53:30', relative: 'just now',type: 'pii',        key: 'development (sk-gw-7d2)',   action: 'redacted', requestId: 'req_lyra_4241',     conversationId: 'cnv_lyra_92',     keyTier: 'normal',   status: 'success', code: '200', inTokens: '418',   outTokens: '198',   latency: '5.10s',  turn: 9,  totalTurns: 14 },
  { time: '2026-05-12 09:54:18', relative: 'just now',type: 'phi',        key: 'prod-agent (sk-gw-930)',    action: 'flagged',  requestId: 'req_orion_4243',    conversationId: 'cnv_orion_70',    keyTier: 'elevated', status: 'success', code: '200', inTokens: '1,422', outTokens: '506',   latency: '7.80s',  turn: 13, totalTurns: 18 },
  { time: '2026-05-12 09:55:07', relative: 'just now',type: 'injection',  key: 'test-key (sk-gw-9f4)',      action: 'flagged',  requestId: 'req_polaris_4245',  conversationId: 'cnv_polaris_55',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '488',   outTokens: '226',   latency: '5.60s',  turn: 4,  totalTurns: 4  },
  { time: '2026-05-12 09:56:02', relative: 'just now',type: 'credential', key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4248',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '596',   outTokens: '0',     latency: '2.10s',  turn: 3,  totalTurns: 3  },
  // Trail band (09:57–10:28) — 16 events
  { time: '2026-05-12 09:57:48', relative: 'just now',type: 'phi',        key: 'hermes-agent (sk-gw-c60)',  action: 'flagged',  requestId: 'req_skylark_4250',  conversationId: 'cnv_skylark_18',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '716',   outTokens: '308',   latency: '4.10s',  turn: 6,  totalTurns: 6  },
  { time: '2026-05-12 09:59:21', relative: 'just now',type: 'injection',  key: 'nova-chat (sk-gw-e15)',     action: 'flagged',  requestId: 'req_vela_4252',     conversationId: 'cnv_vela_21',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '2,914', outTokens: '1,210', latency: '4.30s',  turn: 11, totalTurns: 12 },
  { time: '2026-05-12 10:01:07', relative: 'just now',type: 'pii',        key: 'openclaw (sk-gw-1ab)',      action: 'redacted', requestId: 'req_meridian_4254', conversationId: 'cnv_meridian_07', keyTier: 'normal',   status: 'success', code: '200', inTokens: '496',   outTokens: '218',   latency: '4.80s',  turn: 1,  totalTurns: 3  },
  { time: '2026-05-12 10:02:53', relative: 'just now',type: 'credential', key: 'prod-agent (sk-gw-930)',    action: 'blocked',  requestId: 'req_orion_4256',    conversationId: 'cnv_orion_70',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '1,344', outTokens: '0',     latency: '2.10s',  turn: 15, totalTurns: 18 },
  { time: '2026-05-12 10:04:31', relative: 'just now',type: 'phi',        key: 'development (sk-gw-7d2)',   action: 'redacted', requestId: 'req_lyra_4258',     conversationId: 'cnv_lyra_92',     keyTier: 'normal',   status: 'success', code: '200', inTokens: '432',   outTokens: '204',   latency: '5.20s',  turn: 10, totalTurns: 14 },
  { time: '2026-05-12 10:06:15', relative: 'just now',type: 'injection',  key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4260',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '620',   outTokens: '0',     latency: '2.10s',  turn: 1,  totalTurns: 3  },
  { time: '2026-05-12 10:08:02', relative: 'just now',type: 'pii',        key: 'test-key (sk-gw-9f4)',      action: 'flagged',  requestId: 'req_polaris_4262',  conversationId: 'cnv_polaris_55',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '502',   outTokens: '236',   latency: '5.40s',  turn: 1,  totalTurns: 4  },
  { time: '2026-05-12 10:09:48', relative: 'just now',type: 'credential', key: 'nova-chat (sk-gw-e15)',     action: 'blocked',  requestId: 'req_vela_4264',     conversationId: 'cnv_vela_21',     keyTier: 'critical', status: 'error',   code: '403', inTokens: '3,820', outTokens: '0',     latency: '2.10s',  turn: 2,  totalTurns: 12 },
  { time: '2026-05-12 10:11:33', relative: 'just now',type: 'phi',        key: 'hermes-agent (sk-gw-c60)',  action: 'flagged',  requestId: 'req_skylark_4266',  conversationId: 'cnv_skylark_18',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '688',   outTokens: '294',   latency: '4.60s',  turn: 2,  totalTurns: 6  },
  { time: '2026-05-12 10:13:20', relative: 'just now',type: 'injection',  key: 'openclaw (sk-gw-1ab)',      action: 'flagged',  requestId: 'req_meridian_4268', conversationId: 'cnv_meridian_07', keyTier: 'elevated', status: 'success', code: '200', inTokens: '526',   outTokens: '242',   latency: '6.10s',  turn: 2,  totalTurns: 3  },
  { time: '2026-05-12 10:15:04', relative: 'just now',type: 'pii',        key: 'prod-agent (sk-gw-930)',    action: 'redacted', requestId: 'req_orion_4270',    conversationId: 'cnv_orion_70',    keyTier: 'normal',   status: 'success', code: '200', inTokens: '1,392', outTokens: '518',   latency: '6.80s',  turn: 16, totalTurns: 18 },
  { time: '2026-05-12 10:17:11', relative: 'just now',type: 'credential', key: 'development (sk-gw-7d2)',   action: 'blocked',  requestId: 'req_lyra_4272',     conversationId: 'cnv_lyra_92',     keyTier: 'critical', status: 'error',   code: '403', inTokens: '422',   outTokens: '0',     latency: '2.10s',  turn: 11, totalTurns: 14 },
  { time: '2026-05-12 10:19:48', relative: 'just now',type: 'phi',        key: 'test-key (sk-gw-9f4)',      action: 'redacted', requestId: 'req_polaris_4274',  conversationId: 'cnv_polaris_55',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '514',   outTokens: '238',   latency: '5.60s',  turn: 2,  totalTurns: 4  },
  { time: '2026-05-12 10:22:30', relative: 'just now',type: 'injection',  key: 'prod-web (sk-gw-438)',      action: 'blocked',  requestId: 'req_aurora_4276',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '634',   outTokens: '0',     latency: '2.10s',  turn: 2,  totalTurns: 3  },
  { time: '2026-05-12 10:25:14', relative: 'just now',type: 'pii',        key: 'nova-chat (sk-gw-e15)',     action: 'flagged',  requestId: 'req_vela_4278',     conversationId: 'cnv_vela_21',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '3,944', outTokens: '1,742', latency: '4.40s',  turn: 12, totalTurns: 12 },
  { time: '2026-05-12 10:28:42', relative: 'just now',type: 'credential', key: 'hermes-agent (sk-gw-c60)',  action: 'blocked',  requestId: 'req_skylark_4280',  conversationId: 'cnv_skylark_18',  keyTier: 'critical', status: 'error',   code: '403', inTokens: '696',   outTokens: '0',     latency: '2.10s',  turn: 3,  totalTurns: 6  },
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

function HeroCard() {
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
              {([
                { Icon: ShieldAlert, title: 'Prompt injection scanning', detail: 'Block or flag before tokens reach the model' },
                { Icon: EyeOff,      title: 'PII & PHI redaction',                 detail: 'Detect and redact before sensitive data reaches the model' },
                { Icon: KeyRound,    title: 'Credential leak prevention',          detail: 'Catch provider tokens in prompts and completions' },
                { Icon: Radar,       title: 'Per-key risk scoring',                detail: 'Normal, elevated, or critical tier on every event' },
              ] as { Icon: LucideIcon; title: string; detail: string }[]).map(({ Icon, title, detail }) => (
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
              <Button onClick={() => navigate('/billing')}>
                <Sparkles className="size-4" /> Upgrade to Pro
              </Button>
              <Button variant="outline" onClick={() => setCompareOpen(true)}>
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
    <PlanComparisonDialog open={compareOpen} onOpenChange={setCompareOpen} onUpgrade={() => navigate('/billing')} />
    </div>
  );
}

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
  benefitsLabel: "Included in your Free plan:",
  features: [
    { Icon: Route,          title: 'Multi-provider routing',   detail: 'One base URL for OpenAI, Anthropic, and more' },
    { Icon: Anchor,         title: 'Tamper-evident audit',     detail: 'Every request anchored to Constellation Digital Evidence' },
    { Icon: BarChart3,      title: 'Activity & request logs',  detail: 'Cost, tokens, and latency across the workspace' },
    { Icon: MessagesSquare, title: 'Conversation threading',   detail: 'Follow agent runs and chats end-to-end' },
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
    { Icon: EyeOff,      title: 'PII & PHI redaction',                 detail: 'Detect and redact before sensitive data reaches the model' },
    { Icon: KeyRound,    title: 'Credential leak prevention',          detail: 'Catch provider tokens in prompts and completions' },
    { Icon: Radar,       title: 'Per-key risk scoring',                detail: 'Normal, elevated, or critical tier on every event' },
  ],
  cta: { label: 'Upgrade to Pro', variant: 'default', icon: Sparkles },
};

function PlanCard({ plan, onUpgrade }: { plan: PlanCardData; onUpgrade: () => void }) {
  const CtaIcon = plan.cta.icon;
  return (
    <div
      data-plan-card
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

function PlanComparisonDialog({
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
  useGSAP(() => {
    if (!open || !cardsRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = cardsRef.current.querySelectorAll('[data-plan-card]');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.32, stagger: 0.08, ease: 'power3.out', delay: 0.12 },
    );
  }, { scope: cardsRef, dependencies: [open] });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] p-4 gap-4">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg/6 font-medium text-neutral-900">
            Compare plans
          </DialogTitle>
        </DialogHeader>
        <div ref={cardsRef} className="grid grid-cols-2 gap-4">
          <PlanCard plan={FREE_PLAN} onUpgrade={onUpgrade} />
          <PlanCard plan={PRO_PLAN} onUpgrade={() => { onOpenChange(false); onUpgrade(); }} />
        </div>
      </DialogContent>
    </Dialog>
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
