import { CircleCheck, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailList, DetailRow } from "@/components/ui/detail-list";
import {
  Dialog,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogTitleBlock,
} from "@/components/ui/dialog";
import { Timestamp } from "@/components/ui/timestamp";
import {
  type EventRow,
  KIND_BADGE_VARIANT,
  truncateHex,
} from "@/data/audit-trail";

/* ─────────────────────────────────────────────────────────────────────────
 * AuditRecordDialog — drill-in modal for a single audit event row.
 *
 * Scroll-shell pattern (DialogScrollContent):
 *   Header → Summary (verification banner) → Body (event detail)
 *   → Footer (actions)
 * ───────────────────────────────────────────────────────────────────────── */

/* ─── Verification seal placeholder ──────────────────────────────────── */

/** Constellation Digital Evidence "Verified" badge — native asset at
 *  269×40. Rendered at `h-6` (24px) to fit the banner without dominating. */
function VerifiedBySeal() {
  return (
    <img
      alt="Verified by Constellation Digital Evidence"
      className="h-6 w-auto self-start"
      src="/icons/de-verified-badge.svg"
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
  if (!row) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogScrollContent className="sm:max-w-2xl">
        {/* ── Header ── */}
        <DialogScrollHeader>
          <DialogTitleBlock>Audit record</DialogTitleBlock>
        </DialogScrollHeader>

        {/* ── Fingerprint banner ──
         *
         * The differentiator claim in plain prose, with the Digital Evidence
         * "Verified" seal sitting directly beneath the copy. */}
        <DialogScrollSummary className="pt-4">
          <div className="flex flex-col gap-2">
            <p className="m-0 text-base/6 text-neutral-900">
              This event is fingerprinted to{" "}
              <span className="font-medium">
                Constellation's Digital Evidence
              </span>{" "}
              layer.
            </p>
            <VerifiedBySeal />
          </div>
        </DialogScrollSummary>

        {/* ── Details body ── */}
        <DialogScrollBody className="pt-6">
          <DetailList>
            <DetailRow
              label="Time"
              value={
                <Timestamp
                  className="font-mono text-neutral-800"
                  date={row.at}
                />
              }
            />
            <DetailRow
              label="Event ID"
              value={
                <span className="break-all font-mono text-neutral-800">
                  {row.eventId}
                </span>
              }
            />
            <DetailRow
              label="Event type"
              value={
                <Badge variant={KIND_BADGE_VARIANT[row.kind]}>{row.kind}</Badge>
              }
            />
            <DetailRow
              label="Description"
              value={
                <span className="text-neutral-900">{row.description}</span>
              }
            />
            <DetailRow
              label="Member"
              value={<span className="text-neutral-800">{row.member}</span>}
            />
            <DetailRow
              label="Fingerprint"
              value={
                <span className="inline-flex items-center gap-2">
                  <CircleCheck
                    aria-hidden
                    className="size-4 shrink-0 text-success-600"
                    strokeWidth={1.75}
                  />
                  <span className="sr-only">Verified fingerprint</span>
                  <span className="whitespace-nowrap font-mono text-neutral-800">
                    {truncateHex(row.anchor, 4, 4)}
                  </span>
                </span>
              }
            />
          </DetailList>
        </DialogScrollBody>

        {/* ── Footer ── */}
        <DialogScrollFooter>
          <Button size="sm" variant="outline">
            <Copy className="size-3.5" />
            Copy proof JSON
          </Button>
          <Button
            nativeButton={false}
            render={
              // biome-ignore lint/a11y/useAnchorContent: label + icon are injected as children by Base UI's render prop at runtime
              <a
                href="https://digitalevidence.constellationnetwork.io/"
                rel="noopener noreferrer"
                target="_blank"
              />
            }
            size="sm"
          >
            <ExternalLink className="size-3.5" />
            Open Explorer
          </Button>
        </DialogScrollFooter>
      </DialogScrollContent>
    </Dialog>
  );
}
