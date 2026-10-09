import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { planTierOf } from "@/data/plans";
import { formatDate } from "@/lib/formatters";
import { withTierOf } from "@/lib/plan";
import {
  clampDate,
  FREE_RETENTION_DAYS,
  oldestInWindow,
  PRO_RETENTION_CEILING_DAYS,
  retentionCeilingDays,
} from "@/lib/retention";
import { MESSAGE_TIMES } from "@/pages/settings/retention-data";
import { useViewRole } from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * Messages retention statement (PRD "Configurable data retention v1",
 * mockup 04, AG-1021 Chunk 2): one info line above the table saying what
 * window is showing, how far back it goes, and that older messages are
 * deleted while their fingerprints stay verifiable.
 *
 * Numbers come from the same sources as the Settings card
 * (`retentionCeilingDays`, `oldestInWindow` over `MESSAGE_TIMES`), so the
 * two pages state the same window and date (PRD: "always the same
 * number"). The mock org's defaults: Free 30 days, Pro and Enterprise 90.
 *
 * `clamp`: the `/messages-free/clamp` preview, matching
 * `/settings-free/clamp`: a Pro org just downgraded to Free, still on Pro's
 * 90 days, dropping to Free's 30 on `clampDate(now)`.
 *
 * "Retention settings" is for Admins only: Managers and Members cannot open
 * the setting (Settings hides the section), so the button would dead-end.
 * Copy: copywriter, 2026-10-08. The table is not filtered to the window in
 * the mock (owner 2026-10-08: the real build's job).
 * ───────────────────────────────────────────────────────────────────────── */

export function RetentionStatement({ clamp = false }: { clamp?: boolean }) {
  const { pathname } = useLocation();
  const isAdmin = useViewRole() === "admin";
  // One clock per mount, like the Settings card.
  const [now] = useState(() => new Date());
  const days = clamp
    ? PRO_RETENTION_CEILING_DAYS
    : retentionCeilingDays(planTierOf(pathname));
  const oldest = oldestInWindow(MESSAGE_TIMES, now, days);
  const settingsHref = clamp
    ? "/settings-free/clamp"
    : withTierOf(pathname, "/settings");

  const lead = oldest
    ? `Showing the last ${days} days, back to ${formatDate(oldest)}.`
    : `Showing the last ${days} days.`;

  return (
    <Callout
      action={
        isAdmin ? (
          <Button
            nativeButton={false}
            render={<Link to={settingsHref} />}
            size="sm"
            variant="info-outline"
          >
            Retention settings
          </Button>
        ) : null
      }
    >
      {lead}{" "}
      {clamp
        ? `On ${formatDate(clampDate(now))}, messages older than ${FREE_RETENTION_DAYS} days are deleted and their fingerprints remain verifiable.`
        : "Older messages are deleted, and their fingerprints remain verifiable."}
    </Callout>
  );
}
