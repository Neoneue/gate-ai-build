import { type ComponentType, type SVGProps } from 'react';
import { ShieldAlert, UserRound, HeartPulse, KeyRound } from 'lucide-react';

type RiskTier = 'critical' | 'elevated' | 'normal';
type EventAction = 'blocked' | 'flagged' | 'redacted';
// Types we enforce inline at the gateway (per Security PRD S1 +
// S4 — the policies that ship): prompt injection on input;
// PII, PHI, credential leak on output. PRD S9's event schema also lists
// `content` and `format` but no policy spec'd in the PRD ships behind
// them — kept out of the UI until a real policy exists.
export type EventCategory = 'injection' | 'pii' | 'phi' | 'credential';

export type EventRow = {
	time: string;
	/** Human-friendly relative time. Cell renders this above `time` as the
	 * primary scan target; the absolute datetime sits below as the qualifier. */
	relative: string;
	type: EventCategory;
	key: string;
	action: EventAction;
	/** Gateway request that produced this event. Used for the detail
	 * dialog's title aria-label. */
	requestId: string;
	/** Conversation the request belongs to. Required — mirrors Requests'
	 * data model where every row carries a conversation. Drives the
	 * table's Conversation cell link. */
	conversationId: string;
	/** Per-key risk tier per Security PRD S6. Surfaced inline next to the
	 * API key in the detail-modal Event-details section so the team-lead
	 * user story (S2 + S8) can see why a key got enhanced scanning. */
	keyTier: RiskTier;
	/** Gateway-request fields surfaced in the detail-modal Event-details
	 * section. These mirror RequestRow on the Requests page so the two
	 * surfaces agree on what a request looks like. */
	status: 'success' | 'error';
	code: string;
	inTokens: string;
	outTokens: string;
	latency: string;
	/** 1-based position of the request in its conversation, plus total
	 * turns in that conversation. Renders as "Turn 3 of 7". */
	turn: number;
	totalTurns: number;
};

// Parses a stored `YYYY-MM-DD HH:MM:SS` string into a Date so the shared
// <Timestamp> primitive can render the absolute value and compute its
// relative-time tooltip from the same instant. Forces local midnight so the
// day rendered stays the day the event was filed.
export function parseEventTime(stored: string): Date {
	const [datePart, timePart] = stored.split(' ');
	return new Date(`${datePart}T${timePart}`);
}

export const ACTION_BADGE: Record<
	EventAction,
	{ variant: 'destructive' | 'warning' | 'info'; label: string }
> = {
	blocked: { variant: 'destructive', label: 'blocked' },
	flagged: { variant: 'warning', label: 'flagged' },
	// 2-tier severity: redacted shares amber with flagged (block = red); the
	// badge label carries the identity. CPO direction 2026-06-04.
	redacted: { variant: 'warning', label: 'redacted' },
};

// `color` mirrors the `AttackCategoriesCard` palette on this page so the
// two cards agree on which color represents which threat category. Colors
// are inline-styled on the icon (same idiom as VendorAvatar on Models /
// Requests) — bare colored glyph, no chip background.
export const TYPE_META: Record<
	EventCategory,
	{ Icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; color: string }
> = {
	injection: { Icon: ShieldAlert, label: 'Injection', color: 'var(--color-danger-600)' },
	pii: { Icon: UserRound, label: 'PII', color: 'var(--color-chart-3)' },
	phi: { Icon: HeartPulse, label: 'PHI', color: 'var(--color-chart-7)' },
	credential: { Icon: KeyRound, label: 'Credential', color: 'var(--color-chart-4)' },
};

export const EVENT_ROWS: EventRow[] = [
	// Token/turn/latency values are reconciled against the Conversations
	// mock (Conversations.tsx CONVERSATION_ROWS): per-row inTokens+outTokens
	// stays under the per-request average for the parent conversation, and
	// `turn`/`totalTurns` mirror the real conversation's turn count (NOT
	// request count). Blocked events fail-fast (~2.1s) with outTokens=0.
	// cnv_aurora_42: 3 turns, 7 reqs, 4,051 tokens
	// cnv_orion_70: 18 turns, 38 reqs, 52,810 tokens
	// cnv_lyra_92: 14 turns, 32 reqs, 12,608 tokens
	// cnv_meridian_07: 3 turns, 4 reqs, 2,104 tokens
	// cnv_skylark_18: 6 turns, 11 reqs, 8,114 tokens
	// cnv_vela_21: 12 turns, 26 reqs, 102,041 tokens
	// cnv_polaris_55: 4 turns, 7 reqs, 3,402 tokens
	// cnv_7a3f9e2b: 10 turns, 100 reqs — the live hero session (design-agent,
	// BYOK). Its three blocked injections are the auto-mode classifier denials,
	// so the model had already produced output before the tool was blocked:
	// in/out/latency mirror the real RequestRow values (NOT the fail-fast
	// outTokens=0/2.1s convention used for pre-forward blocks above).
	// All nine guardrail events from the session, newest-first: 3 injection
	// blocks (errors) + 6 PII redactions (success). Values mirror the real
	// RequestRow rows on the Requests page.
	{ time: '2026-06-06 00:50:45', relative: 'now',     type: 'injection',  key: 'design-agent (sk-gw-ef7)', action: 'blocked',  requestId: 'req_ded91e',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '255,400', outTokens: '104',   latency: '3.98s',  turn: 10, totalTurns: 10 },
	{ time: '2026-06-06 00:50:40', relative: 'now',     type: 'pii',        key: 'design-agent (sk-gw-ef7)', action: 'redacted', requestId: 'req_8389e4',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'success', code: '200', inTokens: '24',      outTokens: '17',    latency: '7.87s',  turn: 10, totalTurns: 10 },
	// Same request as the PII event above (req_8389e4 carries two findings); the
	// AWS access key in that .env paste was caught by the credentials scanner.
	{ time: '2026-06-06 00:50:40', relative: 'now',     type: 'credential', key: 'design-agent (sk-gw-ef7)', action: 'redacted', requestId: 'req_8389e4',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'success', code: '200', inTokens: '24',      outTokens: '17',    latency: '7.87s',  turn: 10, totalTurns: 10 },
	{ time: '2026-06-06 00:47:14', relative: '4m ago',  type: 'injection',  key: 'design-agent (sk-gw-ef7)', action: 'blocked',  requestId: 'req_e9c29e',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '240,300', outTokens: '204',   latency: '10.02s', turn: 9,  totalTurns: 10 },
	{ time: '2026-06-06 00:47:03', relative: '4m ago',  type: 'pii',        key: 'design-agent (sk-gw-ef7)', action: 'redacted', requestId: 'req_7de227',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'success', code: '200', inTokens: '22',      outTokens: '21',    latency: '5.32s',  turn: 9,  totalTurns: 10 },
	{ time: '2026-06-06 00:46:49', relative: '4m ago',  type: 'pii',        key: 'design-agent (sk-gw-ef7)', action: 'redacted', requestId: 'req_08fb0b',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'success', code: '200', inTokens: '22',      outTokens: '64',    latency: '7.15s',  turn: 8,  totalTurns: 10 },
	{ time: '2026-06-06 00:35:18', relative: '15m ago', type: 'pii',        key: 'design-agent (sk-gw-ef7)', action: 'redacted', requestId: 'req_de1f4a',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'success', code: '200', inTokens: '204,400', outTokens: '1,600', latency: '25.95s', turn: 6,  totalTurns: 10 },
	{ time: '2026-06-06 00:33:58', relative: '17m ago', type: 'pii',        key: 'design-agent (sk-gw-ef7)', action: 'redacted', requestId: 'req_78f14b',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'success', code: '200', inTokens: '194,200', outTokens: '526',   latency: '10.42s', turn: 5,  totalTurns: 10 },
	{ time: '2026-06-06 00:16:22', relative: '34m ago', type: 'pii',        key: 'design-agent (sk-gw-ef7)', action: 'redacted', requestId: 'req_dc4d30',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'success', code: '200', inTokens: '186,900', outTokens: '2,400', latency: '39.52s', turn: 2,  totalTurns: 10 },
	{ time: '2026-06-06 00:11:32', relative: '39m ago', type: 'injection',  key: 'design-agent (sk-gw-ef7)', action: 'blocked',  requestId: 'req_31b316',        conversationId: 'cnv_7a3f9e2b',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '160,900', outTokens: '146',   latency: '3.71s',  turn: 1,  totalTurns: 10 },
	{ time: '2026-05-12 09:48:14', relative: '2m ago',  type: 'injection',  key: 'prod-web (sk-gw-438)',     action: 'blocked',  requestId: 'req_aurora_4200',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '612',   outTokens: '0',     latency: '2.10s',  turn: 3,  totalTurns: 3  },
	{ time: '2026-05-12 09:46:23', relative: '4m ago',  type: 'credential', key: 'prod-agent (sk-gw-930)',   action: 'blocked',  requestId: 'req_orion_4203',    conversationId: 'cnv_orion_70',    keyTier: 'critical', status: 'error',   code: '403', inTokens: '1,408', outTokens: '0',     latency: '2.10s',  turn: 5,  totalTurns: 18 },
	{ time: '2026-05-12 09:43:10', relative: '7m ago',  type: 'injection',  key: 'development (sk-gw-7d2)',  action: 'flagged',  requestId: 'req_lyra_4207',     conversationId: 'cnv_lyra_92',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '412',   outTokens: '188',   latency: '3.20s',  turn: 8,  totalTurns: 14 },
	{ time: '2026-05-12 09:42:26', relative: '8m ago',  type: 'injection',  key: 'openclaw (sk-gw-1ab)',    action: 'blocked',  requestId: 'req_meridian_4208', conversationId: 'cnv_meridian_07', keyTier: 'critical', status: 'error',   code: '403', inTokens: '548',   outTokens: '0',     latency: '2.10s',  turn: 1,  totalTurns: 3  },
	{ time: '2026-05-12 09:41:08', relative: '9m ago',  type: 'pii',        key: 'hermes-agent (sk-gw-c60)', action: 'redacted', requestId: 'req_skylark_4209',  conversationId: 'cnv_skylark_18',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '742',   outTokens: '318',   latency: '3.80s',  turn: 3,  totalTurns: 6  },
	{ time: '2026-05-12 09:40:44', relative: '9m ago',  type: 'injection',  key: 'nova-chat (sk-gw-e15)',   action: 'blocked',  requestId: 'req_vela_4209',     conversationId: 'cnv_vela_21',     keyTier: 'critical', status: 'error',   code: '403', inTokens: '3,902', outTokens: '0',     latency: '2.10s',  turn: 7,  totalTurns: 12 },
	{ time: '2026-05-12 09:39:58', relative: '10m ago', type: 'pii',        key: 'test-key (sk-gw-9f4)',    action: 'flagged',  requestId: 'req_polaris_4210',  conversationId: 'cnv_polaris_55',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '484',   outTokens: '220',   latency: '5.20s',  turn: 2,  totalTurns: 4  },
	{ time: '2026-05-12 09:38:21', relative: '12m ago', type: 'credential', key: 'prod-web (sk-gw-438)',     action: 'blocked',  requestId: 'req_aurora_4212',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '588',   outTokens: '0',     latency: '2.10s',  turn: 2,  totalTurns: 3  },
	{ time: '2026-05-12 09:36:33', relative: '13m ago', type: 'phi',        key: 'prod-agent (sk-gw-930)',   action: 'flagged',  requestId: 'req_orion_4213',    conversationId: 'cnv_orion_70',    keyTier: 'elevated', status: 'success', code: '200', inTokens: '1,402', outTokens: '482',   latency: '6.40s',  turn: 11, totalTurns: 18 },
	{ time: '2026-05-12 09:34:42', relative: '15m ago', type: 'pii',        key: 'development (sk-gw-7d2)',  action: 'redacted', requestId: 'req_lyra_4215',     conversationId: 'cnv_lyra_92',     keyTier: 'normal',   status: 'success', code: '200', inTokens: '408',   outTokens: '196',   latency: '4.50s',  turn: 6,  totalTurns: 14 },
	{ time: '2026-05-12 09:32:18', relative: '18m ago', type: 'phi',        key: 'openclaw (sk-gw-1ab)',    action: 'redacted', requestId: 'req_meridian_4218', conversationId: 'cnv_meridian_07', keyTier: 'normal',   status: 'success', code: '200', inTokens: '522',   outTokens: '234',   latency: '5.40s',  turn: 2,  totalTurns: 3  },
	{ time: '2026-05-12 09:31:51', relative: '18m ago', type: 'injection',  key: 'hermes-agent (sk-gw-c60)', action: 'flagged',  requestId: 'req_skylark_4218',  conversationId: 'cnv_skylark_18',  keyTier: 'elevated', status: 'success', code: '200', inTokens: '728',   outTokens: '348',   latency: '13.40s', turn: 4,  totalTurns: 6  },
	{ time: '2026-05-12 09:30:09', relative: '20m ago', type: 'credential', key: 'nova-chat (sk-gw-e15)',   action: 'flagged',  requestId: 'req_vela_4220',     conversationId: 'cnv_vela_21',     keyTier: 'elevated', status: 'success', code: '200', inTokens: '3,892', outTokens: '1,718', latency: '3.90s',  turn: 9,  totalTurns: 12 },
	{ time: '2026-05-12 09:29:32', relative: '21m ago', type: 'phi',        key: 'test-key (sk-gw-9f4)',    action: 'redacted', requestId: 'req_polaris_4221',  conversationId: 'cnv_polaris_55',  keyTier: 'normal',   status: 'success', code: '200', inTokens: '480',   outTokens: '232',   latency: '5.40s',  turn: 3,  totalTurns: 4  },
	{ time: '2026-05-12 09:27:14', relative: '23m ago', type: 'credential', key: 'prod-web (sk-gw-438)',     action: 'blocked',  requestId: 'req_aurora_4223',   conversationId: 'cnv_aurora_42',   keyTier: 'critical', status: 'error',   code: '403', inTokens: '588',   outTokens: '0',     latency: '2.10s',  turn: 1,  totalTurns: 3  },
	{ time: '2026-05-12 09:24:47', relative: '25m ago', type: 'injection',  key: 'prod-agent (sk-gw-930)',   action: 'flagged',  requestId: 'req_orion_4225',    conversationId: 'cnv_orion_70',    keyTier: 'elevated', status: 'success', code: '200', inTokens: '1,410', outTokens: '612',   latency: '14.60s', turn: 14, totalTurns: 18 },
	{ time: '2026-05-12 09:21:09', relative: '29m ago', type: 'pii',        key: 'prod-web (sk-gw-438)',     action: 'flagged',  requestId: 'req_lyra_4229',     conversationId: 'cnv_lyra_92',     keyTier: 'normal',   status: 'success', code: '200', inTokens: '392',   outTokens: '196',   latency: '11.80s', turn: 4,  totalTurns: 14 },
];
