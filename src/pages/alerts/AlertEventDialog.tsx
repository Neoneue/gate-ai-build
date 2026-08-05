import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { DetailList, DetailRow } from "@/components/ui/detail-list";
import {
  Dialog,
  DialogClose,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogTitleBlock,
} from "@/components/ui/dialog";
import { InlineCode } from "@/components/ui/inline-code";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusDot } from "@/components/ui/status-dot";
import { Timestamp } from "@/components/ui/timestamp";
import { CONDITION_CATALOG, formatObservedValue, formatWindow } from "./data";
import { ChannelGlyph, ConditionIcon } from "./glyphs";
import type { AlertEventStatus } from "./types";
import {
  CHANNEL_NAME,
  DELIVERY_DOT,
  DELIVERY_LABEL,
  type FiringRow,
  SEVERITY_BADGE,
  STATUS_BADGE,
} from "./view";

/* ─── Firing detail dialog ──────────────────────────────────────────────────
 * A centered `Dialog`, not a `Sheet`. design.md's rule for the two: Sheet is
 * for INSPECTION you keep open while reading the page behind it; Dialog is for
 * a decision. A firing is a triage decision — acknowledge it or resolve it —
 * and the actions are the point of opening it.
 *
 * Scroll shell rather than the short `DialogContent`: a rule can fan out to any
 * number of channels, so the delivery list has no fixed height, and the
 * shell's bordered footer both anchors the action band and supplies the 24px
 * standing gap above the buttons structurally (body `pb-6` → `border-t`).
 *
 * EVERY VALUE APPEARS EXACTLY ONCE. The rule name is the title and is not
 * repeated as a row; status lives in the list and is deliberately NOT also a
 * badge beside the title. The numbers come off the EVENT (`observed`,
 * `thresholdAtFiring`) and the configuration off the RULE — see `FiringRow`.
 * ───────────────────────────────────────────────────────────────────────── */

export type AlertEventDialogProps = {
  /** The firing to show. Retained by the parent through the close animation, so
   *  the body does not blank out mid-exit. */
  row: FiringRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onStatusChange: (eventId: string, status: AlertEventStatus) => void;
};

export function AlertEventDialog({
  row,
  open,
  onOpenChange,
  onStatusChange,
}: AlertEventDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogScrollContent className="sm:max-w-[560px]">
        {row ? (
          <FiringDetail onStatusChange={onStatusChange} row={row} />
        ) : null}
      </DialogScrollContent>
    </Dialog>
  );
}

function FiringDetail({
  row,
  onStatusChange,
}: {
  row: FiringRow;
  onStatusChange: (eventId: string, status: AlertEventStatus) => void;
}) {
  const { event, rule } = row;
  const condition = CONDITION_CATALOG[rule.condition];

  return (
    <>
      <DialogScrollHeader>
        <DialogTitleBlock
          meta={
            <span className="inline-flex items-center gap-1">
              <InlineCode size="sm">{event.id}</InlineCode>
              <CopyButton
                label="firing ID"
                mode="icon"
                size="inline-xs"
                value={event.id}
              />
            </span>
          }
        >
          {rule.name}
        </DialogTitleBlock>
      </DialogScrollHeader>

      <DialogScrollBody className="flex flex-col gap-6">
        <DetailList>
          <DetailRow
            label="Severity"
            value={
              <Badge variant={SEVERITY_BADGE[rule.severity]}>
                {rule.severity}
              </Badge>
            }
          />
          <DetailRow
            label="Status"
            value={
              <Badge variant={STATUS_BADGE[event.status]}>{event.status}</Badge>
            }
          />
          <DetailRow
            label="Condition"
            value={
              // Same glyph the wizard's condition tile carries, so the thing
              // you picked and the thing that fired look like one concept.
              <span className="flex items-center gap-2">
                <ConditionIcon condition={rule.condition} />
                {condition.label}
              </span>
            }
          />
          <DetailRow label="Time window" value={formatWindow(rule.window)} />
          <DetailRow
            label="Observed"
            value={
              <span className="type-mono-14 text-foreground">
                {formatObservedValue(rule.condition, event.observed)}
              </span>
            }
          />
          {/* Not "Threshold": this is `thresholdAtFiring`, the snapshot taken
              when the rule fired. Naming it plainly would claim the rule's
              CURRENT threshold, and the two diverge the moment someone re-tunes
              the rule — which is exactly why the event stores its own copy. */}
          <DetailRow
            label="Threshold at firing"
            value={
              <span className="type-mono-14 text-foreground">
                {formatObservedValue(rule.condition, event.thresholdAtFiring)}
              </span>
            }
          />
          <DetailRow
            label="Fired"
            value={
              <Timestamp
                className="type-mono-14 text-foreground"
                date={event.firedAt}
              />
            }
          />
        </DetailList>

        <section className="flex flex-col gap-3">
          <SectionHeading>Notifications</SectionHeading>
          <DetailList>
            {event.deliveries.map((delivery) => (
              <DetailRow
                key={`${delivery.channel.type}-${delivery.channel.target}`}
                label={
                  <span className="flex items-center gap-2">
                    {/* The dot leads the row and its word closes it: colour is
                        the scan cue, the label is the accessible one. */}
                    <StatusDot kind={DELIVERY_DOT[delivery.outcome]} />
                    <ChannelGlyph type={delivery.channel.type} />
                    {CHANNEL_NAME[delivery.channel.type]}
                  </span>
                }
                value={
                  <span className="flex items-start justify-between gap-4">
                    <span className="type-mono-12 min-w-0 break-all text-foreground">
                      {delivery.channel.target}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {DELIVERY_LABEL[delivery.outcome]}
                    </span>
                  </span>
                }
              />
            ))}
          </DetailList>
        </section>
      </DialogScrollBody>

      <DialogScrollFooter>
        {event.status === "resolved" ? (
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            Close
          </DialogClose>
        ) : null}
        {event.status === "open" ? (
          <Button
            onClick={() => onStatusChange(event.id, "acknowledged")}
            size="default"
            type="button"
            variant="outline"
          >
            Acknowledge
          </Button>
        ) : null}
        {event.status === "resolved" ? null : (
          <Button
            onClick={() => onStatusChange(event.id, "resolved")}
            size="default"
            type="button"
          >
            Resolve
          </Button>
        )}
      </DialogScrollFooter>
    </>
  );
}
