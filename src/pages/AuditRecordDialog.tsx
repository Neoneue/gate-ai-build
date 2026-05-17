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
            <TabsList variant="line" className="mb-4 px-0">
              <TabsTrigger value="event" className="pl-0">Event</TabsTrigger>
              <TabsTrigger value="merkle">Merkle path</TabsTrigger>
              <TabsTrigger value="how">How it works</TabsTrigger>
            </TabsList>

            {/* Event panel */}
            <TabsContent value="event">
              <DetailList>
                <DetailRow
                  label="Time"
                  value={
                    <>
                      <span className="font-mono text-ink-800">{fmtTime(row.at)}</span>
                      <span className="text-ink-500"> &middot; {fmtRelative(row.at)}</span>
                    </>
                  }
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
                      <span className="font-mono whitespace-nowrap text-ink-800">{truncateHex(row.anchor)}</span>
                    </span>
                  }
                />
              </DetailList>
            </TabsContent>

            {/* Merkle path placeholder */}
            <TabsContent value="merkle">
              <div className="py-12 text-center text-sm text-ink-500">Coming next</div>
            </TabsContent>

            {/* How it works placeholder */}
            <TabsContent value="how">
              <div className="py-12 text-center text-sm text-ink-500">Coming next</div>
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
