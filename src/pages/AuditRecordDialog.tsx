import { BookOpen, CircleCheck, Copy, ExternalLink } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timestamp } from "@/components/ui/timestamp";
import {
  type EventRow,
  fmtRelative,
  KIND_BADGE_VARIANT,
  truncateHex,
} from "@/data/audit-trail";

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
      alt="Verified by Constellation Digital Evidence"
      className="h-6 w-auto self-start"
      src="/icons/de-verified-badge.svg"
    />
  );
}

/* ─── Merkle path panel ───────────────────────────────────────────────── */

const TREE_DEPTH = 3;

/** Renders a static SVG of a Merkle inclusion proof. The diagram itself
 *  is fixed (asset at `public/icons/merkle-tree.svg`); the description
 *  above and path/depth footer below carry the per-event detail.
 *
 *  The full dynamic v2 implementation — depth-3 tree built from real
 *  event data, animated cascade, zoomable expand viewer — lives on the
 *  `feature/merkle-tree-v2` branch for future reactivation. */
function MerklePathPanel({ row }: { row: EventRow }) {
  const anchorShort = truncateHex(row.anchor, 4, 4);
  const strippedId = row.eventId.replace(/^e_/, "").replace(/-/g, "");
  const leafHex = strippedId.slice(0, 8).padEnd(8, "0");

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="m-0 text-neutral-800 text-sm">
        Highlighted path cryptographically proves{" "}
        <span className="font-mono text-neutral-900">{leafHex}</span> is
        included in fingerprint root{" "}
        <span className="font-mono text-neutral-900">{anchorShort}</span>.
      </p>

      {/* Tree card — SVG fills the card edge-to-edge; the SVG's own
          background acts as the card's fill, the card chrome only owns
          the rounded border. `overflow-hidden` clips the SVG to the
          rounded corners. */}
      <div className="overflow-hidden rounded-md border border-border">
        <img
          alt={`Merkle inclusion proof: leaf ${leafHex} verified against fingerprint root ${anchorShort} in ${TREE_DEPTH} hash operations.`}
          className="block h-auto w-full"
          src="/icons/merkle-tree.svg"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-neutral-500 text-xs">
        <span>
          <span className="text-neutral-500">Path:</span>{" "}
          <span className="font-mono text-neutral-700">
            leaf → L2 → L1 → ROOT
          </span>
        </span>
        <span>
          Tree depth: {TREE_DEPTH} · Hash operations: {TREE_DEPTH}
        </span>
      </div>
    </div>
  );
}

/* ─── How it works panel ─────────────────────────────────────────────── */

const HOW_STEPS = [
  {
    id: "01",
    title: "Hash",
    body: "Each request, policy decision, and limit check is hashed at the gateway edge using SHA-256.",
  },
  {
    id: "02",
    title: "Batch",
    body: "Hashes are batched into a Merkle tree every 5 minutes, or 64 events, whichever comes first.",
  },
  {
    id: "03",
    title: "Fingerprint",
    body: "The Merkle root is submitted to Constellation Digital Evidence with a 3-of-3 validator quorum.",
  },
  {
    id: "04",
    title: "Verify",
    body: "Anyone with the leaf, root, and sibling hashes can re-derive the root locally. No trust in us required.",
  },
] as const;

function NumberChip({ children }: { children: string }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xs bg-neutral-100 font-medium font-mono text-neutral-700 text-xs">
      {children}
    </span>
  );
}

function HowItWorksPanel() {
  return (
    <div className="flex flex-col gap-4">
      {/* 2×2 step grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HOW_STEPS.map((step) => (
          <div
            className="flex flex-col gap-2 rounded-md border border-border bg-card p-4"
            key={step.id}
          >
            <div className="flex items-center gap-2">
              <NumberChip>{step.id}</NumberChip>
              <h3 className="m-0 font-medium text-neutral-900 text-sm">
                {step.title}
              </h3>
            </div>
            <p className="m-0 text-pretty text-neutral-700 text-sm">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* Go-deeper CTA — single primary resource. Links straight to the
          Digital Evidence product surface (no separate /docs path in the
          knowledge graph yet). Copy uses the approved tamper-evident /
          cryptographic-proof vocabulary from the DE product record. */}
      <a
        className="group flex items-center justify-between gap-4 rounded-md border border-border bg-card p-4 text-left transition-colors duration-150 ease-out hover-fine:bg-neutral-50 motion-reduce:transition-none"
        href="https://digitalevidence.constellationnetwork.io/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xs bg-neutral-100">
            <BookOpen aria-hidden className="size-4 text-neutral-700" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-medium text-neutral-900 text-sm">
              Digital Evidence docs
            </span>
            <span className="text-pretty text-neutral-700 text-sm">
              How Constellation's tamper-evident layer makes every event in this
              log independently verifiable.
            </span>
          </span>
        </span>
        <ExternalLink
          aria-hidden
          className="size-4 shrink-0 text-neutral-500 transition-colors duration-150 ease-out group-hover:text-neutral-900 motion-reduce:transition-none"
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
  if (!row) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogScrollContent className="sm:max-w-2xl">
        {/* ── Header ── */}
        <DialogScrollHeader>
          <DialogTitleBlock badge={<VerifiedBySeal />}>
            Audit record
          </DialogTitleBlock>
        </DialogScrollHeader>

        {/* ── Anchor banner ──
         *
         * Restored 2026-05-18 with the seal moved to the title row. The
         * banner now carries the differentiator claim in plain prose plus
         * the anchor + relative-time footer so the user reads the proof
         * statement before the tabbed detail. */}
        <DialogScrollSummary className="pt-4">
          <div className="flex flex-col gap-2">
            <p className="m-0 text-neutral-900 text-sm">
              This event is fingerprinted to{" "}
              <span className="font-medium">
                Constellation's Digital Evidence
              </span>{" "}
              layer.
            </p>
            <p className="m-0 text-neutral-500 text-xs">
              Fingerprinted ·{" "}
              <span className="font-mono text-neutral-800">
                {truncateHex(row.anchor, 4, 4)}
              </span>
              {" · "}
              {fmtRelative(row.at)}
            </p>
          </div>
        </DialogScrollSummary>

        {/* ── Tabbed body ── */}
        <DialogScrollBody className="pt-4">
          <Tabs defaultValue="event">
            <TabsList className="mb-2 px-0" variant="line">
              <TabsTrigger className="pl-0" value="event">
                Event
              </TabsTrigger>
              <TabsTrigger value="merkle">Merkle path</TabsTrigger>
              <TabsTrigger value="how">How it works</TabsTrigger>
            </TabsList>

            {/* Event panel */}
            <TabsContent value="event">
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
                    <Badge variant={KIND_BADGE_VARIANT[row.kind]}>
                      {row.kind}
                    </Badge>
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
          <Button size="sm" variant="outline">
            <Copy className="size-3.5" />
            Copy proof JSON
          </Button>
          <Button size="sm">
            <ExternalLink className="size-3.5" />
            Open DE Explorer
          </Button>
        </DialogScrollFooter>
      </DialogScrollContent>
    </Dialog>
  );
}
