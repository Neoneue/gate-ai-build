import { CircleCheck, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogTitleBlock,
} from '@/components/ui/dialog';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type EventRow,
  KIND_BADGE_VARIANT,
  fmtTime,
  fmtRelative,
  truncateHex,
} from './AuditTrail';

/* ─────────────────────────────────────────────────────────────────────────
 * AuditRecordDialog — drill-in modal for a single audit event row.
 *
 * Scroll-shell pattern (DialogScrollContent):
 *   Header → Summary (verification banner) → Body (tabbed detail)
 *   → Footer (actions)
 *
 * Only the "Event" tab is built out; "Merkle path" and "How it works"
 * render as "Coming next" placeholders.
 * ───────────────────────────────────────────────────────────────────────── */

/* ─── Verification seal placeholder ──────────────────────────────────── */

/** Constellation Digital Evidence "Verified" badge — native asset at
 *  269×40. Rendered at `h-8` (32px) to fit the banner without dominating. */
function VerifiedBySeal() {
  return (
    <img
      src="/icons/de-verified-badge.svg"
      alt="Verified by Constellation Digital Evidence"
      className="h-6 w-auto self-start"
    />
  );
}

/* ─── Merkle path panel ───────────────────────────────────────────────── */

/** Renders a two-level Merkle inclusion proof for a single audit event.
 *
 *  Layout:
 *    - Description sentence (prose + mono spans)
 *    - Bordered card containing an inline SVG tree (ROOT + two L1 nodes)
 *    - Footer: path notation left, tree metadata right
 *
 *  All SVG fills/strokes reference CSS custom properties — no raw hex. */
function MerklePathPanel({ row }: { row: EventRow }) {
  const eventPrefix = row.eventId.slice(0, 10); // "e_cc8ae185"
  const anchorShort = truncateHex(row.anchor, 4, 4);

  // SVG layout constants (viewBox "0 0 600 200")
  const ROOT_CX = 300; const ROOT_CY = 48;  const ROOT_R = 22;
  const SIB_CX  = 120; const SIB_CY  = 160; const SIB_R  = 14;
  const LEAF_CX = 480; const LEAF_CY = 160; const LEAF_R = 14;

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="text-sm text-ink-800 m-0">
        Highlighted path proves{' '}
        <span className="font-mono text-ink-900">{eventPrefix}</span> is included
        in anchor root{' '}
        <span className="font-mono text-ink-900">{anchorShort}</span>.
        Verifiable from the leaf with 1 sibling hash.
      </p>

      {/* Tree card */}
      <div className="relative rounded-md border border-border bg-card p-4">
        <svg
          viewBox="0 0 600 200"
          className="w-full h-auto"
          aria-hidden
        >
          {/* Layer labels — left margin */}
          <text
            x="20" y="56"
            textAnchor="start"
            dominantBaseline="middle"
            fontSize="11"
            fontFamily="inherit"
            fill="var(--color-ink-500)"
          >
            L0 · Anchor root
          </text>
          <text
            x="20" y="160"
            textAnchor="start"
            dominantBaseline="middle"
            fontSize="11"
            fontFamily="inherit"
            fill="var(--color-ink-500)"
          >
            L1
          </text>

          {/* Lines drawn before nodes so circles paint over endpoints */}
          {/* Sibling → ROOT (gray) */}
          <line
            x1={SIB_CX}  y1={SIB_CY  - SIB_R}
            x2={ROOT_CX} y2={ROOT_CY + ROOT_R}
            stroke="var(--color-ink-300)"
            strokeWidth="1.5"
          />
          {/* Event leaf → ROOT (highlighted path, blue) */}
          <line
            x1={LEAF_CX} y1={LEAF_CY  - LEAF_R}
            x2={ROOT_CX} y2={ROOT_CY + ROOT_R}
            stroke="var(--color-blue-500)"
            strokeWidth="2"
          />

          {/* ROOT node */}
          <circle
            cx={ROOT_CX} cy={ROOT_CY} r={ROOT_R}
            fill="var(--color-ink-900)"
          />
          <text
            x={ROOT_CX} y={ROOT_CY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="500"
            fontFamily="inherit"
            fill="var(--color-white)"
          >
            ROOT
          </text>

          {/* Sibling node (L1.1) — hollow */}
          <circle
            cx={SIB_CX} cy={SIB_CY} r={SIB_R}
            fill="var(--color-white)"
            stroke="var(--color-ink-300)"
            strokeWidth="1.5"
          />

          {/* Event leaf node (L1.2) — filled blue */}
          <circle
            cx={LEAF_CX} cy={LEAF_CY} r={LEAF_R}
            fill="var(--color-blue-500)"
          />
        </svg>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          <span className="text-ink-400">Path:</span>{' '}
          <span className="font-mono text-ink-700">leaf &rarr; L1.2 &rarr; ROOT</span>
        </span>
        <span>Tree depth: 1 &middot; Sibling hashes needed: 1</span>
      </div>
    </div>
  );
}

/* ─── How it works panel ─────────────────────────────────────────────── */

const HOW_STEPS = [
  {
    id: '01',
    title: 'Hash',
    body: 'Each request, policy decision, and limit check is hashed at the gateway edge using SHA-256.',
  },
  {
    id: '02',
    title: 'Batch',
    body: 'Hashes are batched into a Merkle tree every 5 minutes, or 64 events, whichever comes first.',
  },
  {
    id: '03',
    title: 'Anchor',
    body: 'The Merkle root is submitted to Constellation Digital Evidence with a 3-of-3 validator quorum.',
  },
  {
    id: '04',
    title: 'Verify',
    body: 'Anyone with the leaf, root, and sibling hashes can re-derive the root locally. No trust in us required.',
  },
] as const;

function NumberChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center justify-center size-6 rounded-xs bg-ink-700 text-white font-mono text-xs font-medium shrink-0">
      {children}
    </span>
  );
}

function HowItWorksPanel() {
  return (
    <div className="flex flex-col gap-4">
      {/* 2×2 step grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOW_STEPS.map((step) => (
          <div
            key={step.id}
            className="rounded-md border border-border bg-card p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <NumberChip>{step.id}</NumberChip>
              <h3 className="text-sm font-medium text-ink-900 m-0">{step.title}</h3>
            </div>
            <p className="text-sm text-ink-700 text-pretty m-0">{step.body}</p>
          </div>
        ))}
      </div>

      {/* Footer link row */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => {}}
          className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-ink-900 transition-colors duration-150 ease-out motion-reduce:transition-none"
        >
          <ExternalLink className="size-4" aria-hidden />
          Read whitepaper
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-ink-900 transition-colors duration-150 ease-out motion-reduce:transition-none"
        >
          <ExternalLink className="size-4" aria-hidden />
          Constellation DE docs
        </button>
      </div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────── */

export function AuditRecordDialog({
  row,
  open,
  onOpenChange,
}: {
  row: EventRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollContent className="sm:max-w-2xl">
        {/* ── Header ── */}
        <DialogScrollHeader>
          <DialogTitleBlock>Audit record</DialogTitleBlock>
        </DialogScrollHeader>

        {/* ── Verification banner ── */}
        <DialogScrollSummary>
          <div className="rounded-md border border-border bg-card flex flex-col items-start gap-3 p-4">
            <VerifiedBySeal />

            {/* Description */}
            <div className="min-w-0">
              <p className="text-sm text-ink-800 m-0">
                This event is anchored to{' '}
                <span className="font-medium text-ink-900">
                  Constellation's Digital Evidence
                </span>{' '}
                layer.
              </p>
              <p className="text-xs text-ink-500 mt-1 m-0">
                Anchored &middot;{' '}
                <span className="font-mono text-ink-800">{truncateHex(row.anchor, 4, 4)}</span>{' '}
                &middot; {fmtRelative(row.at)}
              </p>
            </div>
          </div>
        </DialogScrollSummary>

        {/* ── Tabbed body ── */}
        <DialogScrollBody className="pt-2">
          <Tabs defaultValue="event">
            <TabsList variant="line" className="mb-2 px-0">
              <TabsTrigger value="event" className="pl-0">Event</TabsTrigger>
              <TabsTrigger value="merkle">Merkle path</TabsTrigger>
              <TabsTrigger value="how">How it works</TabsTrigger>
            </TabsList>

            {/* Event panel */}
            <TabsContent value="event">
              <DetailList>
                <DetailRow
                  label="Time"
                  value={<span className="font-mono text-ink-800">{fmtTime(row.at)}</span>}
                />
                <DetailRow
                  label="Event ID"
                  value={
                    <span className="font-mono break-all text-ink-800">{row.eventId}</span>
                  }
                />
                <DetailRow
                  label="Kind"
                  value={<Badge variant={KIND_BADGE_VARIANT[row.kind]}>{row.kind}</Badge>}
                />
                <DetailRow
                  label="Description"
                  value={<span className="text-ink-900">{row.description}</span>}
                />
                <DetailRow
                  label="Member"
                  value={<span className="text-ink-800">{row.member}</span>}
                />
                <DetailRow
                  label="Anchor"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <CircleCheck
                        className="size-4 text-success-600 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="sr-only">Verified anchor</span>
                      <span className="font-mono whitespace-nowrap text-ink-800">{truncateHex(row.anchor, 4, 4)}</span>
                    </span>
                  }
                />
              </DetailList>
            </TabsContent>

            {/* Merkle path panel */}
            <TabsContent value="merkle">
              <MerklePathPanel row={row} />
            </TabsContent>

            {/* How it works panel */}
            <TabsContent value="how">
              <HowItWorksPanel />
            </TabsContent>
          </Tabs>
        </DialogScrollBody>

        {/* ── Footer ── */}
        <DialogScrollFooter>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Copy className="size-3.5" />
            Copy proof JSON
          </Button>
          <Button size="sm" onClick={() => {}}>
            <ExternalLink className="size-3.5" />
            Open on DE explorer
          </Button>
        </DialogScrollFooter>
      </DialogScrollContent>
    </Dialog>
  );
}
