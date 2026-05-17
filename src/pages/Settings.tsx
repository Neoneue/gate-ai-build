import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTitle } from '@/components/ui/page-title';
import { SectionHeading } from '@/components/ui/section-heading';
import { SettingsRow } from '@/components/ui/settings-row';
import { DashboardChrome } from '@/layouts/DashboardChrome';

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-018 — Settings (Workspace Admin)
 *
 * Profile / security / logging / integration configuration surface. Same
 * production-frame chrome as CMP-012 / CMP-013 / CMP-014 / CMP-017.
 * Line-variant Tabs (General / Logging / Integration) — Settings is a
 * settled-state surface where each tab is a peer scope, not a workflow
 * funnel, so the line variant's "context switch" affordance reads better
 * than the pill funnel.
 *
 * Composition: title + subtitle + control rows flow through the shared
 * `<SettingsRow>` primitive at `@/components/ui/settings-row` — both the
 * Logging tab's four rows and SecurityCard's passkey row consume it.
 * Do not re-inline the recipe; extend the primitive (new variant, new
 * prop) when behavior diverges.
 * ───────────────────────────────────────────────────────────────────────── */

export function Settings() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
            activeNavId="settings"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <SettingsSurface />
          </DashboardChrome>
  );
}

/* ─── Page surface — header + tabs container ───────────────────────────── */

function SettingsSurface() {
  return (
    <>
      <PageHeader />
      <div className="flex flex-col gap-4">
        <ProfileCard />
        <SecurityCard />
      </div>
    </>
  );
}

/* ─── Page header — no eyebrow per spec, just title + subtitle ────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Settings</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Profile, security, logging, and integrations.
        </p>
      </div>
    </div>
  );
}

/* ─── General · Profile & workspace ────────────────────────────────────── */

function ProfileCard() {
  const [displayName, setDisplayName] = useState('Chad Ponticas');
  const [email, setEmail] = useState('chad@constellationnetwork.io');
  const [organization, setOrganization] = useState("Chad Ponticas's workspace");
  // Snapshot the saved values so we can detect dirty state — the Save
  // button stays disabled until something actually changes, which is
  // the standard "no-op submit" guard.
  const [saved, setSaved] = useState({
    displayName: 'Chad Ponticas',
    email: 'chad@constellationnetwork.io',
    organization: "Chad Ponticas's workspace",
  });
  const dirty =
    displayName !== saved.displayName ||
    email !== saved.email ||
    organization !== saved.organization;

  // Warn on tab close / reload when there are unsaved changes. Does NOT
  // catch in-app navigation (sidebar clicks); a react-router useBlocker
  // would cover that, but adding it touches more surface than this fix
  // is scoped to.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base font-medium text-ink-900">
          Profile &amp; workspace
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Two-column form grid. Display name + Email pair on the first
            row (canonical "who you are" pair); Organization sits alone on
            the second row because it's a workspace-scope value, not a
            personal one — the gap signals the shift. Form labels follow
            the codified pattern: sans, ink-600, font-medium, text-sm
            (NOT the uppercase eyebrow recipe). The form lives inside CardContent and
            the Save button in CardFooter associates via `form` attribute
            — this lets Enter from any input submit. Card.tsx applies
            `pb-0` automatically when a CardFooter slot is present, so
            the footer's own `p-4` carries the action-zone padding. */}
        <form
          id="settings-profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved({ displayName, email, organization });
          }}
          className="grid grid-cols-2 gap-x-4 gap-y-4"
        >
          <FormField
            id="settings-display-name"
            label="Display name"
            value={displayName}
            onChange={setDisplayName}
            autoComplete="name"
          />
          <FormField
            id="settings-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            spellCheck={false}
          />
          <FormField
            id="settings-organization"
            label="Organization"
            value={organization}
            onChange={setOrganization}
            autoComplete="organization"
          />
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dirty}
          onClick={() => {
            setDisplayName(saved.displayName);
            setEmail(saved.email);
            setOrganization(saved.organization);
          }}
          className="border-border bg-card text-ink-900"
        >
          Reset
        </Button>
        <Button
          type="submit"
          form="settings-profile-form"
          variant="default"
          size="sm"
          disabled={!dirty}
        >
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  spellCheck,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  /** Default undefined — let the browser decide. Set `false` on email /
   *  username / code fields where spellcheck is noise. */
  spellCheck?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-ink-600 font-medium text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
      />
    </div>
  );
}

/* ─── General · Security ───────────────────────────────────────────────── */

function SecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base font-medium text-ink-900">
          Security
        </CardTitle>
        <CardDescription className="font-sans text-sm text-ink-500">
          Passkeys — phishing-resistant, no password required.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Passkey row — title + subtitle + action. Same shape as the
            Logging tab's SettingsRows; migrated to the shared primitive
            with `titleAs="h4"` to nest semantically under the CardTitle
            ("Authentication") and `alignTop` to preserve the original
            top-aligned layout when the subtitle wraps. */}
        <SettingsRow
          first
          static
          titleAs="h4"
          alignTop
          title="Passkey"
          subtitle="Sign in with Touch ID, Windows Hello, or a hardware key."
          control={
            <Button variant="default" size="sm" className="shrink-0">
              <KeyRound data-icon="inline-start" aria-hidden />
              Add a passkey
            </Button>
          }
        />

        {/* Registered passkeys subsection — h4 heading + empty body.
            The wrapping `<CardContent className="flex flex-col gap-4">`
            supplies the 16px rhythm between the Passkey row and this
            group; adding a border-t + pt-4 here would double-up two
            rhythms (whitespace + hairline) for the same visual job. */}
        <div className="flex flex-col gap-2">
          <SectionHeading as="h4">Registered passkeys</SectionHeading>
          <p className="font-sans text-sm text-ink-500 m-0">
            No passkeys registered yet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* SettingsRow — extracted to `@/components/ui/settings-row` (2026-05-10).
 * SecurityCard's passkey row imports from the primitive. Do not re-inline
 * the recipe here. */
