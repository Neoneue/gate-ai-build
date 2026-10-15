import {
  ArrowLeftRight,
  BarChart2,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactKpi } from "@/components/ui/compact-kpi";
import { KpiRail } from "@/components/ui/kpi-rail";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { formatCompactCount, formatTimestamp } from "@/lib/formatters";
import { fmtTokens } from "@/pages/activity/chart-helpers";
import {
  demoWeek,
  type OnboardingDemoTraffic,
  useOnboardingDemoTraffic,
} from "@/pages/onboarding/onboarding-demo-traffic";
import {
  DemoUsageChart,
  EmptyChartCard,
  EmptyKpiTile,
  IconChip,
  MobilePageHeader,
  MobilePageMain,
  PreviewCard,
} from "@/pages/onboarding/onboarding-mobile-parts";
import { GUARDRAIL_BADGE } from "@/pages/requests/data";

/* ─── OnboardingMobileOverview ──────────────────────────────────────────────
 * `/overview-mobile-onboarding`: the Mobile A demo's Overview (signup ->
 * Gate Chat -> site menu or logo). The regular Overview layout (`Dashboard`):
 * before the first Gate Chat message every block says what will appear
 * there, never zeros; after it (owner 2026-10-12) the Messages tile, the
 * tokens chart, "Latest messages" and "Latest conversations" show every
 * demo message and conversation (`useOnboardingDemoTraffic`, the one source
 * the other phone pages read). No compression ran and nothing was flagged,
 * so savings and security events stay empty; Threats detected reads 0
 * because every message was scanned. Mobile only: a separate
 * copy, so `Dashboard` and `DashboardDefault` never change for it (owner
 * 2026-10-11). Empty strings are reused from the Default pages.
 * ───────────────────────────────────────────────────────────────────────── */

/** Dashboard's preview tables show eight rows (Overview composition). */
const PREVIEW_ROWS = 8;

export function OnboardingMobileOverview() {
  const traffic = useOnboardingDemoTraffic();
  const week = traffic ? demoWeek(traffic) : null;

  return (
    <MobilePageMain>
      <MobilePageHeader
        description="Monitor request volume, token usage, spend, and security signals across your gateway."
        title="Overview"
      />
      <div className="flex flex-col gap-4">
        <SectionTitle as="h2">Activity this week</SectionTitle>
        <KpiRail columns={3}>
          {week ? (
            <CompactKpi
              flat
              title="Messages"
              value={formatCompactCount(week.messages.length)}
            />
          ) : (
            <EmptyKpiTile icon={ArrowLeftRight} label="No messages yet" />
          )}
          <EmptyKpiTile icon={BarChart2} label="No savings yet" />
          {traffic ? (
            <CompactKpi flat title="Threats detected" value="0" />
          ) : (
            <EmptyKpiTile icon={ShieldCheck} label="No events yet" />
          )}
        </KpiRail>
        {traffic && week ? (
          <TokensCard rows={week.rows} traffic={traffic} />
        ) : (
          <EmptyChartCard icon={Zap} label="No tokens used" />
        )}
      </div>
      <div className="grid @4xl:grid-cols-3 grid-cols-1 gap-6">
        <PreviewCard title="Latest messages">
          {traffic ? (
            <LatestMessageTable traffic={traffic} />
          ) : (
            <TableEmptyState
              body="Individual messages routed through the gateway will appear here."
              icon={<IconChip icon={ArrowLeftRight} />}
              title="No messages"
            />
          )}
        </PreviewCard>
        <PreviewCard title="Latest conversations">
          {traffic ? (
            <LatestConversationTable traffic={traffic} />
          ) : (
            <TableEmptyState
              body="Multi-turn conversations grouped by key and model will appear here as your workspace routes traffic."
              icon={<IconChip icon={MessageSquare} />}
              title="No conversations"
            />
          )}
        </PreviewCard>
        <PreviewCard title="Latest security events">
          <TableEmptyState
            body="Prompt injection, PII, and credential leak events flagged by your policies will appear here."
            icon={<IconChip icon={ShieldCheck} />}
            title="No security events"
          />
        </PreviewCard>
      </div>
    </MobilePageMain>
  );
}

/** Dashboard's "Tokens used" chart card, stacked by the models the demo
 *  used, no dimension or metric controls (the demo has no keys or providers
 *  to switch to). The bars sum to the week's tokens. */
function TokensCard({
  rows,
  traffic,
}: {
  rows: Array<Record<string, number | string>>;
  traffic: OnboardingDemoTraffic;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-heading-20">Tokens used</CardTitle>
      </CardHeader>
      <CardContent>
        <DemoUsageChart
          data={rows}
          series={traffic.models.map((m) => ({
            key: m.id,
            label: m.label,
            slot: m.slot,
          }))}
          yFormatter={fmtTokens}
        />
      </CardContent>
    </Card>
  );
}

/** Dashboard's RecentConversationsTable columns: one row per demo Gate Chat
 *  conversation, newest first. The 2nd and 3rd chips in one chat add turns
 *  to its row (owner 2026-10-12). Like the message rows, they open nothing
 *  in the demo. */
function LatestConversationTable({
  traffic,
}: {
  traffic: OnboardingDemoTraffic;
}) {
  return (
    <Table aria-label="Latest conversations">
      <TableHeader>
        <TableRow>
          <TableHead>Conversation</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Turns</TableHead>
          <TableHead className="text-right">Reqs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {traffic.conversations
          .slice(0, PREVIEW_ROWS)
          .map(({ id, title, updated, turns, requests }) => (
            <TableRow className="h-12" key={id}>
              <TableCell className="w-full max-w-0">
                <span className="block w-full truncate">{title}</span>
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap">
                {formatTimestamp(updated)}
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right">
                {turns}
              </TableCell>
              {/* Reqs: one per reply; a desktop compare turn sends two
                  (owner 2026-10-14, the shared chat history). */}
              <TableCell className="type-mono-14 whitespace-nowrap text-right">
                {requests}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

/** Dashboard's LatestRequestsTable columns, one row per demo message, newest
 *  first. No detail page exists for a mock message, so a row opens nothing. */
function LatestMessageTable({ traffic }: { traffic: OnboardingDemoTraffic }) {
  return (
    <Table aria-label="Latest messages">
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Security</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {traffic.messages.slice(0, PREVIEW_ROWS).map((message) => (
          <TableRow className="h-12" key={message.id}>
            <TableCell className="type-mono-14 whitespace-nowrap">
              {message.timeLabel}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {message.modelLabel}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge variant="success">success</Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge variant={GUARDRAIL_BADGE.allow.variant}>allow</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
