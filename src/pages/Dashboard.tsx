import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  BarChart2,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
import { KpiRail as KpiRailShell } from '@/components/ui/kpi-rail';
import { PageTitle } from '@/components/ui/page-title';
import { EVENT_ROWS } from '@/pages/Security';
import { TOTAL_7D_BASE_DOLLARS, TOTAL_7D_BASE_REQUESTS, TOTAL_7D_BASE_TOKENS, distributeSeries } from '@/pages/Activity';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { DashboardChrome } from '@/layouts/DashboardChrome';

const THREATS_DETECTED_COUNT = EVENT_ROWS.length;

const fmtTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : `${n}`;

const SPEND_7D_SPARK    = distributeSeries(TOTAL_7D_BASE_DOLLARS,   7, 101);
const REQUESTS_7D_SPARK = distributeSeries(TOTAL_7D_BASE_REQUESTS,  7, 103);
const TOKENS_7D_SPARK   = distributeSeries(TOTAL_7D_BASE_TOKENS,    7, 107);
const THREATS_SPARK     = distributeSeries(THREATS_DETECTED_COUNT,  9, 109);

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-012 — Composed · Dashboard
 *
 * Production-shell surface composed entirely from primitives that already
 * exist elsewhere in the system:
 *   - KPI rail   →  CompactKpi pattern from CMP-008 (Stat cards)
 *   - Bar chart  →  ComposedChart pattern from CMP-009.1 (Spend trend)
 *   - Audit feed →  table treatment from CMP-010.1 (Data table)
 *
 * The shell itself (sidebar + screen-head) is bespoke to this surface — the
 * 64px icon sidebar isn't part of the system's reusable primitives, so it
 * stays local to this artboard.
 *
 * Color palette: only ink-* / blue-* / semantic vars from index.css.
 * Status pill colors (red/amber for 4xx / 5xx codes) use the destructive
 * and warning semantic vars at low alpha — same approach as CMP-003.
 * ───────────────────────────────────────────────────────────────────────── */

export function Dashboard() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
            activeNavId="overview"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <PageHeader />
            <SetupBanner />
            <div className="hidden"><KpiRail /></div>
            <KpiRailEmpty />
            <FirstStepsSection />
          </DashboardChrome>
  );
}

/* ─── Page header (title + actions) ──────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 max-w-1/2">
      {/* h2 (not h1) — the artboard's ArtboardHeader already emits the
          outer h1; this is the in-surface page title and reads as h2
          in the document outline so RecentRequestsCard h3 doesn't
          create a level skip. */}
      <PageTitle>Overview</PageTitle>
      <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
        Cost controls, inline security, and a tamper-evident audit trail. Anchored to Constellation's Digital Evidence layer.
      </p>
    </div>
  );
}

/* ─── Setup banner ───────────────────────────────────────────────────────── */

function SetupBanner() {
  const navigate = useNavigate();
  return (
    <div className="bg-card border border-border rounded-md px-4 py-3 flex items-center gap-4">
      <span className="shrink-0 size-8 inline-flex items-center justify-center rounded-xs bg-muted text-neutral-700">
        <KeyRound className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-900">Create your first API key</span>
        <span className="text-sm text-neutral-500">Gate AI requires at least one API key before it can route any requests.</span>
      </div>
      <Button
        size="sm"
        variant="default"
        className="ml-auto shrink-0"
        onClick={() => navigate('/api-keys')}
      >
        + Create key
      </Button>
    </div>
  );
}

/* ─── KPI rail (3-up sparkline cards) ────────────────────────────────────── */

function KpiRail() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col rounded-md border border-border bg-white shadow-xs overflow-hidden">
      <div className="flex items-center py-3 px-4 border-b border-border">
        <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
          Your week so far
        </h3>
      </div>
    <KpiRailShell columns={4} className="border-0 shadow-none rounded-none">
      <CompactKpi
        flat
        title="Total spent"
        value={formatCurrency(TOTAL_7D_BASE_DOLLARS, { minFrac: 0, maxFrac: 0 })}
        delta="+12.6%"
        deltaNote="vs last week"
        deltaSize="md"
        onClick={() => navigate('/activity?range=7d')}
        ariaLabel="Weekly spend — open Activity for the last 7 days"
        spark={<CompactSpark colorVar="var(--color-success-600)" data={SPEND_7D_SPARK} />}
      />
      <CompactKpi
        flat
        title="Requests sent"
        value={formatNumber(TOTAL_7D_BASE_REQUESTS)}
        delta="+8.2%"
        deltaNote="vs last week"
        deltaSize="md"
        onClick={() => navigate('/activity?range=7d')}
        ariaLabel="Weekly requests — open Activity for the last 7 days"
        spark={<CompactSpark colorVar="var(--color-neutral-500)" data={REQUESTS_7D_SPARK} />}
      />
      <CompactKpi
        flat
        title="Tokens used"
        value={fmtTokens(TOTAL_7D_BASE_TOKENS)}
        delta="+8.7%"
        deltaNote="vs last week"
        deltaSize="md"
        onClick={() => navigate('/activity?range=7d')}
        ariaLabel="Weekly tokens — open Activity for the last 7 days"
        spark={<CompactSpark colorVar="var(--color-chart-3)" data={TOKENS_7D_SPARK} />}
      />
      <CompactKpi
        flat
        title="Threats detected"
        value={formatNumber(THREATS_DETECTED_COUNT)}
        delta="+12.4%"
        deltaNote="vs last week"
        deltaSize="md"
        onClick={() => navigate('/security')}
        ariaLabel="Threats detected — open the Security event log"
        spark={<CompactSpark colorVar="var(--color-chart-5)" data={THREATS_SPARK} />}
      />
    </KpiRailShell>
    </div>
  );
}

/* ─── KPI rail — empty state ─────────────────────────────────────────────── */

const PLACEHOLDER_TILES = [
  'No spend this week',
  'No requests this week',
  'No tokens this week',
  'No threats this week',
] as const;

function KpiRailEmpty() {
  return (
    <div className="flex flex-col rounded-md border border-border bg-white shadow-xs overflow-hidden">
      <div className="flex items-center py-3 px-4 border-b border-border">
        <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
          Your week so far
        </h3>
      </div>
      <KpiRailShell columns={4} className="border-0 shadow-none rounded-none">
        {PLACEHOLDER_TILES.map((label) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-2 bg-white p-6 min-h-[120px]"
          >
            <BarChart2 className="size-6 text-neutral-500" strokeWidth={1.5} aria-hidden />
            <span className="text-sm text-neutral-400">{label}</span>
          </div>
        ))}
      </KpiRailShell>
    </div>
  );
}

/* ─── Your first steps ───────────────────────────────────────────────────── */

type SetupStep = {
  label: string;
  href?: string;
};

type SetupLane = {
  title: string;
  steps: SetupStep[];
};

const SETUP_LANES: SetupLane[] = [
  {
    title: 'Connect',
    steps: [
      { label: 'Create an API key',       href: '/api-keys' },
      { label: 'Set your base URL' },
    ],
  },
  {
    title: 'Protect',
    steps: [
      { label: 'Set a spend limit',       href: '/guardrails?create=1' },
      { label: 'Add a guardrail policy',  href: '/guardrails' },
    ],
  },
  {
    title: 'Verify',
    steps: [
      { label: 'Send a test request',     href: '/requests' },
      { label: 'Check the audit trail',   href: '/audit-trail' },
    ],
  },
];

function FirstStepsSection() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-3 gap-6">
      {SETUP_LANES.map((lane) => (
        <Card key={lane.title} density="flush">
          <div className="flex items-center py-3 px-4 border-b border-border">
            <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
              {lane.title}
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {lane.steps.map((step, i) => (
              <StepItem
                key={step.label}
                index={i}
                label={step.label}
                href={step.href}
                onNavigate={step.href ? () => navigate(step.href!) : undefined}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function StepItem({
  index,
  label,
  onNavigate,
}: {
  index: number;
  label: string;
  href?: string;
  onNavigate?: () => void;
}) {
  const inner = (
    <>
      <span className="shrink-0 size-6 inline-flex items-center justify-center rounded-full bg-muted font-mono text-xs font-medium text-neutral-600">
        {index + 1}
      </span>
      <span className="flex-1 text-sm font-medium text-neutral-900">{label}</span>
      {onNavigate ? (
        <ChevronRight className="shrink-0 size-4 text-neutral-400" strokeWidth={1.75} aria-hidden />
      ) : null}
    </>
  );

  if (onNavigate) {
    return (
      <button
        type="button"
        onClick={onNavigate}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-card hover:bg-neutral-100 outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {inner}
    </div>
  );
}
