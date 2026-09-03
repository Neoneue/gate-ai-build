import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { Switch } from "@/components/ui/switch";
import type { TeamSavings } from "@/data/teams";
import type { PolicyState } from "@/pages/policies/config";
import { TeamPoliciesPane } from "@/pages/teams/PoliciesPane";
import { TeamSavingsOptionCards } from "@/pages/teams/TokenSavingsPane";

/* ─────────────────────────────────────────────────────────────────────────
 * SettingsStack — the General / Policies / Token savings stack shared by the
 * team detail Settings tab and the org-level Settings tab on the Teams list
 * (AG-624 / PRD 8.5). Three titled blocks split by 1px rules.
 *
 * `locked` disables every policy and savings control; `lockedBy` is the
 * "who set it" copy the ticket asks for, rendered as a Callout above the
 * first locked block. General is the caller's: the lock card comes first,
 * then whatever else the scope has (rename / delete for a team, nothing
 * more for the org).
 * ───────────────────────────────────────────────────────────────────────── */

export function SettingsStack({
  lockCard,
  general,
  policies,
  onPoliciesChange,
  savings,
  onSavingsChange,
  locked,
  lockedBy,
}: {
  lockCard: React.ReactNode;
  general?: React.ReactNode;
  policies: PolicyState[];
  onPoliciesChange: (policies: PolicyState[]) => void;
  savings: TeamSavings;
  onSavingsChange: (savings: TeamSavings) => void;
  locked: boolean;
  lockedBy?: string;
}) {
  return (
    <div className="flex flex-col gap-8 [&>*+*]:border-border [&>*+*]:border-t [&>*+*]:pt-8">
      <div className="flex flex-col gap-4">
        <SectionTitle className="type-heading-24">General</SectionTitle>
        {lockCard}
        {general}
      </div>
      <div className="flex flex-col gap-4">
        <SectionTitle className="type-heading-24">Policies</SectionTitle>
        {locked && lockedBy ? <Callout>{lockedBy}</Callout> : null}
        <TeamPoliciesPane
          locked={locked}
          onChange={onPoliciesChange}
          policies={policies}
        />
      </div>
      <div className="flex flex-col gap-4">
        <SectionTitle className="type-heading-24">Token savings</SectionTitle>
        {locked && lockedBy ? <Callout>{lockedBy}</Callout> : null}
        <TeamSavingsOptionCards
          locked={locked}
          onChange={onSavingsChange}
          savings={savings}
        />
      </div>
    </div>
  );
}

/** The lock toggle card, first under General at both scopes. */
export function LockSettingsCard({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  /** The org lock is on, so the team lock has nothing left to lock. */
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle id={id}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="self-center">
          <Switch
            aria-labelledby={id}
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            size="lg"
          />
        </CardAction>
      </CardHeader>
    </Card>
  );
}
