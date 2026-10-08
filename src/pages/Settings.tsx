import { Eraser, KeyRound, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/page-title";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionTitle } from "@/components/ui/section-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import type { RetentionTier } from "@/lib/retention";
import {
  CancelPlanDialog,
  ConsequenceCallout,
} from "@/pages/cancel-plan-dialog";
import { DataRetentionCard } from "@/pages/settings/DataRetentionCard";
import { useViewRole } from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-018 — Settings (Workspace Admin)
 *
 * Profile / security configuration surface.
 *
 * Composition: four titled sections stacked in the page column.
 *   1. Profile   — section title + subtitle ABOVE the card; three fields
 *                  (display name, email, org) with a single unified dirty
 *                  state and shared Save / Reset footer.
 *   2. Security  — section title + subtitle ABOVE the card; passkey
 *                  registration (static, no dirty state).
 *   3. Data      — section title + subtitle ABOVE the card; the retention
 *      retention    window field, its stat rows, and the shorten confirm
 *                  (`settings/DataRetentionCard.tsx`, AG-1018). Owner /
 *                  admin only, the same gate as Account management.
 *   4. Account   — section title + subtitle ABOVE the cards; one
 *      management   `tone="danger"` card per irreversible flow (erase
 *                  stored data first, then cancel plan on paid tiers, then
 *                  delete account), each confirming through an AlertDialog.
 *
 * Section titles sit above their card, never inside it (design.md §3 /
 * SectionTitle). The cards carry data only — no CardHeader.
 *
 * TIER FORK: two props, and they are the ONLY differences between the twins.
 *   `showCancelPlan`  — `SettingsFree` passes false: a Free workspace has no
 *                       subscription to stop, so the card would offer an
 *                       action that cannot happen.
 *   `retentionTier`   — required, passed by every route: `/settings` "pro",
 *                       `/settings-enterprise` "enterprise", `SettingsFree`
 *                       "free" (and `SettingsDefault`, which renders it).
 *                       It sets the Data retention ceiling: Free fixed at 30
 *                       days and read-only, Pro 0 to 90, Enterprise 0 to the
 *                       contract ceiling.
 * Everything else, including "Delete account and data", renders on every
 * tier. The twins pass props rather than copying the sections, so this file
 * stays the single source of truth.
 * ───────────────────────────────────────────────────────────────────────── */

type SettingsProps = {
  /**
   * Render the "Cancel plan" card. False on the Free tier, where there is no
   * paid subscription to cancel. Defaults true (Pro).
   */
  showCancelPlan?: boolean;
  /**
   * Which plan's data retention rules the Data retention card follows.
   * Required so a new route cannot silently inherit another tier's ceiling.
   */
  retentionTier: RetentionTier;
};

export function Settings({
  showCancelPlan = true,
  retentionTier,
}: SettingsProps) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="settings"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <SettingsSurface
        retentionTier={retentionTier}
        showCancelPlan={showCancelPlan}
      />
    </DashboardChrome>
  );
}

/* ─── Page surface — header + titled sections ───────────────────────────── */

function SettingsSurface({
  showCancelPlan,
  retentionTier,
}: Required<SettingsProps>) {
  // Account management (cancel plan, delete org) is owner / admin only; the
  // team-manager and member views hide the whole section (AG-695 AC 3,
  // user 2026-09-03). Non-Enterprise routes never leave the admin role.
  const isAdmin = useViewRole() === "admin";
  return (
    <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
      <PageHeader />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <SectionTitle as="h2">Profile</SectionTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            View and update your personal and organization's information.
          </p>
        </div>
        <ProfileCard />
      </div>
      <div className="mt-2 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <SectionTitle as="h2">Security</SectionTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            Passkeys — phishing-resistant, no password required.
          </p>
        </div>
        <SecurityCard />
      </div>
      {/* Owner / admin only (PRD): members and team managers never see the
          section, the same gate as Account management below. */}
      {isAdmin ? (
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <SectionTitle as="h2">Data retention</SectionTitle>
            <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
              How long Gate keeps request logs and prompt and response content
              for this organization.
            </p>
          </div>
          <DataRetentionCard tier={retentionTier} />
        </div>
      ) : null}
      {isAdmin ? (
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <SectionTitle as="h2">Account management</SectionTitle>
            <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
              {showCancelPlan
                ? "Manage your plan, organization, and other account-level actions."
                : "Erase stored data or delete this organization."}
            </p>
          </div>
          <EraseStoredDataCard />
          {showCancelPlan && <CancelPlanCard />}
          <DeleteAccountCard />
        </div>
      ) : null}
    </div>
  );
}

/* ─── Page header ───────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>Settings</PageTitle>
        <p className="type-copy-18 m-0 text-pretty text-muted-foreground tracking-snug">
          Profile, security, logging, and integrations
        </p>
      </div>
    </div>
  );
}

/* ─── Profile & organization card ──────────────────────────────────────────
 * Three fields share a single dirty state. Dirty = any field differs from
 * its last-saved value. Save commits all three; Reset reverts all three. */

const PROFILE_DEFAULTS = {
  fullName: "Chad Ponticas",
  email: "chad@example.com",
  organization: "Chad Ponticas's workspace",
};

function ProfileCard() {
  const [saved, setSaved] = useState(PROFILE_DEFAULTS);
  const [fullName, setFullName] = useState(PROFILE_DEFAULTS.fullName);
  const [email, setEmail] = useState(PROFILE_DEFAULTS.email);
  const [organization, setOrganization] = useState(
    PROFILE_DEFAULTS.organization
  );

  const dirty =
    fullName !== saved.fullName ||
    email !== saved.email ||
    organization !== saved.organization;

  const dirtyRef = useRef(dirty);

  useEffect(() => {
    dirtyRef.current = dirty;
  });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved({ fullName, email, organization });
  }

  function handleReset() {
    setFullName(saved.fullName);
    setEmail(saved.email);
    setOrganization(saved.organization);
  }

  return (
    <Card>
      <CardContent>
        <form id="profile-form" onSubmit={handleSave}>
          <div className="grid @lg:grid-cols-2 grid-cols-1 gap-4">
            <div className="@lg:col-span-2">
              <label
                className="type-label-14 mb-1 block text-muted-foreground"
                htmlFor="settings-full-name"
              >
                Full name
              </label>
              <Input
                autoComplete="name"
                id="settings-full-name"
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
              />
            </div>
            <div>
              <label
                className="type-label-14 mb-1 block text-muted-foreground"
                htmlFor="settings-email"
              >
                Email
              </label>
              <Input
                autoComplete="email"
                id="settings-email"
                onChange={(e) => setEmail(e.target.value)}
                spellCheck={false}
                type="email"
                value={email}
              />
            </div>
            <div>
              <label
                className="type-label-14 mb-1 block text-muted-foreground"
                htmlFor="settings-organization"
              >
                Organization
              </label>
              <Input
                id="settings-organization"
                onChange={(e) => setOrganization(e.target.value)}
                value={organization}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <Button
          disabled={!dirty}
          onClick={handleReset}
          size="sm"
          type="button"
          variant="outline"
        >
          Reset
        </Button>
        <Button
          disabled={!dirty}
          form="profile-form"
          size="sm"
          type="submit"
          variant="default"
        >
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ─── Security card ─────────────────────────────────────────────────────── */

function SecurityCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {/* Stacks in a narrow column, goes side-by-side once there's room.
            CONTAINER query, not viewport: `<main>` declares `@container`, and
            the Ask AI panel narrows this column without narrowing the window,
            so `lg:` kept the label and the button on one line at a 372px
            column width. `@2xl` (672px inline-size) is the column width at
            the old `lg` viewport, so every desktop width is unchanged. */}
        <div className="flex @2xl:flex-row flex-col items-start @2xl:items-center @2xl:gap-4 gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Passkey</CardTitle>
            <p className="type-copy-14 m-0 text-muted-foreground">
              Sign in with Touch ID, Windows Hello, or a hardware key.
            </p>
          </div>
          <Button className="@2xl:ml-auto" size="sm" variant="default">
            <KeyRound aria-hidden data-icon="inline-start" />
            Add a passkey
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <SectionHeading as="h3">Registered passkeys</SectionHeading>
          <p className="type-copy-14 m-0 text-muted-foreground">
            No passkeys registered yet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Account management cards ─────────────────────────────────────────────
 * Three irreversible flows, one card each. `tone="danger"` puts the
 * `--destructive` edge on the surface (danger-600 light / danger-400 dark)
 * — the border is the only thing that changes, so the fill, the ink, and
 * the card's rhythm stay identical to Profile and Security above and the
 * destructive Button stays the loudest element on the card.
 *
 * Interior repeats the Profile card's shape verbatim: copy in the body, the
 * single action in a `border-t` / `py-2` CardFooter, right-aligned. The
 * section therefore reads as a peer of the two above it rather than as a
 * special-cased warning box.
 *
 * Neither flow mutates anything — there is no backend — so each confirm
 * closes its dialog and fires the house confirmation toast. Copy follows the
 * self-serve account-management PRD.
 *
 * The "Cancel plan" confirm dialog itself lives in `cancel-plan-dialog.tsx`
 * (`<CancelPlanDialog>`) because it is now shared with the Billing downgrade
 * flow; this card owns only its local open state and passes its trigger in.
 * Removing this whole card would not affect that dialog's other entry point.
 * The delete flow is Settings-only and stays here — it is the one gated by a
 * type-to-confirm: intro copy, the shared warning callout enumerating the
 * consequences, then the confirm field.
 * ───────────────────────────────────────────────────────────────────────── */

/** Typed verbatim, case-sensitive, to arm the delete confirm. */
const DELETE_CONFIRM_PHRASE = "Delete my account";

const DELETE_CONSEQUENCES = [
  "After grace, identifiable content (prompts, conversations, keys, provider accounts) is purged and the subscription canceled.",
  "Any remaining pay-as-you-go balance is forfeited on purge; unused subscription days are not refunded.",
  "Fingerprinted Digital Evidence proofs and billing records are retained for legal reasons.",
  "If you solely own a shared organization, it is torn down too and its members are notified.",
];

/** Typed verbatim, case-sensitive, to arm the erase confirm. */
const ERASE_CONFIRM_PHRASE = "Erase data";

const ERASE_CONSEQUENCES = [
  "Every stored prompt, response, and cached body is permanently deleted.",
  "Exports and request history for the erased content will be empty afterward.",
  "This cannot be undone.",
];

/* Same shape as `DeleteAccountCard` below: danger card, destructive trigger
 * in the footer, AlertDialog with the shared consequence callout and a
 * type-to-confirm field. Erases content only; the org, keys, members and
 * billing stay. */
function EraseStoredDataCard() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const confirmed = confirmText === ERASE_CONFIRM_PHRASE;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Reopening always starts from an empty field, so a stale match cannot
    // arm the confirm on the next visit.
    if (!next) {
      setConfirmText("");
    }
  }

  function handleConfirm() {
    handleOpenChange(false);
    toast("Stored data erased");
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <Card tone="danger">
        <CardContent className="flex max-w-2xl flex-col gap-1">
          <CardTitle>Erase stored data</CardTitle>
          <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
            Permanently delete every stored prompt, response, and cached body
            for this organization. Your account, subscription, API keys,
            members, and billing stay active. Only the stored content is
            removed. This cannot be undone.
          </p>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-border border-t py-2">
          <AlertDialogTrigger
            render={<Button size="sm" variant="destructive" />}
          >
            <Eraser aria-hidden data-icon="inline-start" />
            Erase stored data
          </AlertDialogTrigger>
        </CardFooter>
      </Card>
      <AlertDialogContent className="data-[size=default]:sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Erase all stored data</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes all stored prompts, responses, and cached
            content for this organization. Your account keeps working: keys,
            members, subscription, billing, and pay-as-you-go balance are
            untouched.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ConsequenceCallout items={ERASE_CONSEQUENCES} />
        <Field>
          <FieldLabel htmlFor="settings-erase-confirm">
            To confirm, type &quot;{ERASE_CONFIRM_PHRASE}&quot;
          </FieldLabel>
          <Input
            autoComplete="off"
            id="settings-erase-confirm"
            onChange={(e) => setConfirmText(e.target.value)}
            spellCheck={false}
            value={confirmText}
          />
        </Field>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!confirmed}
            onClick={handleConfirm}
            variant="destructive"
          >
            Erase stored data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelPlanCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card tone="danger">
      <CardContent className="flex max-w-2xl flex-col gap-1">
        <CardTitle>Cancel plan</CardTitle>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          Renewal stops and access continues to the end of the paid period. This
          workspace then drops to the Free tier, and data retention reverts to
          the Free-tier window.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <CancelPlanDialog
          onOpenChange={setOpen}
          open={open}
          trigger={
            <Button size="sm" variant="destructive">
              Cancel plan
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}

function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const confirmed = confirmText === DELETE_CONFIRM_PHRASE;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Reopening always starts from an empty field — a stale match would let
    // the second visit confirm on one click.
    if (!next) {
      setConfirmText("");
    }
  }

  function handleConfirm() {
    handleOpenChange(false);
    toast("Account deletion scheduled", {
      description: "Reversible for the next 30 days.",
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <Card tone="danger">
        <CardContent className="flex max-w-2xl flex-col gap-1">
          <CardTitle>Delete this organization</CardTitle>
          <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
            Deleting this organization removes every member&apos;s access and
            permanently erases its data. You&apos;ll have 30 days to reverse it.
            Your pay-as-you-go balance is kept until the deletion completes.
          </p>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-border border-t py-2">
          <AlertDialogTrigger
            render={<Button size="sm" variant="destructive" />}
          >
            <TriangleAlert aria-hidden data-icon="inline-start" />
            Delete organization
          </AlertDialogTrigger>
        </CardFooter>
      </Card>
      <AlertDialogContent className="data-[size=default]:sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account and data?</AlertDialogTitle>
          <AlertDialogDescription>
            Access is suspended immediately: your keys stop working and no
            traffic passes. A 30-day grace period follows; reverse it from here
            or the confirmation email to restore your account, data, and full
            balance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ConsequenceCallout items={DELETE_CONSEQUENCES} />
        <Field>
          <FieldLabel htmlFor="settings-delete-confirm">
            To confirm, type &quot;{DELETE_CONFIRM_PHRASE}&quot;
          </FieldLabel>
          <Input
            autoComplete="off"
            id="settings-delete-confirm"
            onChange={(e) => setConfirmText(e.target.value)}
            spellCheck={false}
            value={confirmText}
          />
        </Field>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Keep account</AlertDialogCancel>
          <AlertDialogAction
            disabled={!confirmed}
            onClick={handleConfirm}
            variant="destructive"
          >
            Delete account and data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
