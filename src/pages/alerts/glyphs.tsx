import { HashIcon, MailIcon, WebhookIcon } from "lucide-react";
import type {
  AlertChannelType,
  AlertConditionType,
  AlertSeverity,
} from "./types";
import { CONDITION_ICON, SEVERITY_ICON } from "./view";

/* ─── Alerts glyphs ─────────────────────────────────────────────────────────
 * The two icon vocabularies this feature uses, in one module so a channel type
 * or a condition cannot be drawn one way in the table and another in a dialog.
 * Both are components, which keeps `react-refresh` happy — the MAPS they read
 * live in `view.ts` beside the badge tones (`CONDITION_ICON`), so the page
 * modules import presentation from one place.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * The per-type glyph for a notification channel, shared by the Rules table's
 * channel cluster, its popover, and the firing dialog's delivery list.
 *
 * Slack reads as `Hash` because **lucide ships no Slack glyph** (brand marks
 * were removed upstream; all 5,849 exports were checked). That is not a
 * stand-in: a Slack destination IS a `#channel`, so the hash is the literal
 * affordance rather than a substitute for one.
 *
 * `aria-hidden` throughout — every consumer names the channel in adjacent text
 * or in the control's accessible name, so the glyph is a redundant cue.
 */
export function ChannelGlyph({ type }: { type: AlertChannelType }) {
  if (type === "email") {
    return <MailIcon aria-hidden className="size-3.5" strokeWidth={1.75} />;
  }
  if (type === "slack") {
    return <HashIcon aria-hidden className="size-3.5" strokeWidth={1.75} />;
  }
  return <WebhookIcon aria-hidden className="size-3.5" strokeWidth={1.75} />;
}

/**
 * The 16px glyph that leads a condition's title — the wizard's step-1 tiles and
 * the firing dialog's Condition row.
 *
 * No colour of its own: it inherits `currentColor` from the title it sits in, so
 * it reads as part of the label rather than as decoration beside it, and it
 * follows the title through every state (selected tile, muted row) for free.
 * `aria-hidden` because the condition is always named in the adjacent text.
 */
export function ConditionIcon({
  condition,
}: {
  condition: AlertConditionType;
}) {
  const Icon = CONDITION_ICON[condition];
  return <Icon aria-hidden className="size-4" strokeWidth={1.75} />;
}

/**
 * The 16px glyph that leads a severity's title on the wizard's step-2 tiles.
 *
 * Same contract as `ConditionIcon`: no colour of its own, so it inherits the
 * title's ink and follows it through the selected state. It is STATIC — present
 * on all three tiles regardless of selection — and independent of the tinted
 * border/fill a selected tile also takes.
 */
export function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  const Icon = SEVERITY_ICON[severity];
  return <Icon aria-hidden className="size-4" strokeWidth={1.75} />;
}
