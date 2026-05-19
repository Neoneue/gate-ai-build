import { BookOpen, CircleCheck, Copy, ExternalLink } from 'lucide-react';
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
  fmtRelative,
  truncateHex,
} from './AuditTrail';
import { Timestamp } from '@/components/ui/timestamp';

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
      <p className="text-sm text-neutral-800 m-0">
        Highlighted path proves{' '}
        <span className="font-mono text-neutral-900">{eventPrefix}</span> is included
        in anchor root{' '}
        <span className="font-mono text-neutral-900">{anchorShort}</span>.
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
            fill="var(--color-neutral-500)"
          >
            L0 · Anchor root
          </text>
          <text
            x="20" y="160"
            textAnchor="start"
            dominantBaseline="middle"
            fontSize="11"
            fontFamily="inherit"
            fill="var(--color-neutral-500)"
          >
            L1
          </text>

          {/* Lines drawn before nodes so circles paint over endpoints */}
          {/* Sibling → ROOT (gray) */}
          <line
            x1={SIB_CX}  y1={SIB_CY  - SIB_R}
            x2={ROOT_CX} y2={ROOT_CY + ROOT_R}
            stroke="var(--color-neutral-300)"
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
            fill="var(--color-neutral-900)"
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
            stroke="var(--color-neutral-300)"
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
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          <span className="text-neutral-400">Path:</span>{' '}
          <span className="font-mono text-neutral-700">leaf &rarr; L1.2 &rarr; ROOT</span>
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
    <span className="inline-flex items-center justify-center size-8 rounded-xs bg-neutral-100 text-neutral-700 font-mono text-xs font-medium shrink-0">
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
              <h3 className="text-sm font-medium text-neutral-900 m-0">{step.title}</h3>
            </div>
            <p className="text-sm text-neutral-700 text-pretty m-0">{step.body}</p>
          </div>
        ))}
      </div>

      {/* Go-deeper CTA — single primary resource. Links straight to the
          Digital Evidence product surface (no separate /docs path in the
          knowledge graph yet). Copy uses the approved tamper-evident /
          cryptographic-proof vocabulary from the DE product record. */}
      <a
        href="https://digitalevidence.constellationnetwork.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-md border border-border bg-card p-4 flex items-center justify-between gap-4 text-left transition-colors duration-150 ease-out hover-fine:bg-neutral-50 motion-reduce:transition-none"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="size-8 rounded-xs bg-neutral-100 inline-flex items-center justify-center shrink-0">
            <BookOpen className="size-4 text-neutral-700" aria-hidden />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-neutral-900">Digital Evidence docs</span>
            <span className="text-sm text-neutral-700 text-pretty">
              How Constellation's tamper-evident layer makes every event in this log independently verifiable.
            </span>
          </span>
        </span>
        <ExternalLink
          className="size-4 text-neutral-500 shrink-0 transition-colors duration-150 ease-out group-hover:text-neutral-900 motion-reduce:transition-none"
          aria-hidden
        />
      </a>
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
          <DialogTitleBlock badge={<VerifiedBySeal />}>Audit record</DialogTitleBlock>
        </DialogScrollHeader>

        {/* ── Anchor banner ──
         *
         * Restored 2026-05-18 with the seal moved to the title row. The
         * banner now carries the differentiator claim in plain prose plus
         * the anchor + relative-time footer so the user reads the proof
         * statement before the tabbed detail. */}
        <DialogScrollSummary>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-900 m-0">
              This event is anchored to{' '}
              <span className="font-medium">Constellation's Digital Evidence</span>{' '}
              layer.
            </p>
            <p className="text-xs text-neutral-500 m-0">
              Anchored ·{' '}
              <span className="font-mono text-neutral-800">{truncateHex(row.anchor, 4, 4)}</span>
              {' · '}
              {fmtRelative(row.at)}
            </p>
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
                  value={<Timestamp date={row.at} className="font-mono text-neutral-800" />}
                />
                <DetailRow
                  label="Event ID"
                  value={
                    <span className="font-mono break-all text-neutral-800">{row.eventId}</span>
                  }
                />
                <DetailRow
                  label="Event type"
                  value={<Badge variant={KIND_BADGE_VARIANT[row.kind]}>{row.kind}</Badge>}
                />
                <DetailRow
                  label="Description"
                  value={<span className="text-neutral-900">{row.description}</span>}
                />
                <DetailRow
                  label="Member"
                  value={<span className="text-neutral-800">{row.member}</span>}
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
                      <span className="font-mono whitespace-nowrap text-neutral-800">{truncateHex(row.anchor, 4, 4)}</span>
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
            Open DE Explorer
          </Button>
        </DialogScrollFooter>
      </DialogScrollContent>
    </Dialog>
  );
}
