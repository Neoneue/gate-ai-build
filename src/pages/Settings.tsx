import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageTitle } from '@/components/ui/page-title';
import { SectionHeading } from '@/components/ui/section-heading';
import { DashboardChrome } from '@/layouts/DashboardChrome';

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-018 — Settings (Workspace Admin)
 *
 * Profile / security configuration surface.
 *
 * Composition: two cards stacked in a `flex flex-col gap-4` container.
 *   1. ProfileCard   — three fields (display name, email, org) with a single
 *                      unified dirty state and shared Save / Reset footer.
 *   2. SecurityCard  — passkey registration (static, no dirty state).
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

/* ─── Page surface — header + cards container ───────────────────────────── */

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

/* ─── Page header ───────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Settings</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Profile, security, logging, and integrations.
        </p>
      </div>
    </div>
  );
}

/* ─── Profile & organization card ──────────────────────────────────────────
 * Three fields share a single dirty state. Dirty = any field differs from
 * its last-saved value. Save commits all three; Reset reverts all three. */

const PROFILE_DEFAULTS = {
  displayName: 'Chad Ponticas',
  email: 'chad@constellationnetwork.io',
  organization: "Chad Ponticas's workspace",
};

function ProfileCard() {
  const [saved, setSaved] = useState(PROFILE_DEFAULTS);
  const [displayName, setDisplayName] = useState(PROFILE_DEFAULTS.displayName);
  const [email, setEmail] = useState(PROFILE_DEFAULTS.email);
  const [organization, setOrganization] = useState(PROFILE_DEFAULTS.organization);

  const dirty =
    displayName !== saved.displayName ||
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
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved({ displayName, email, organization });
  }

  function handleReset() {
    setDisplayName(saved.displayName);
    setEmail(saved.email);
    setOrganization(saved.organization);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile &amp; organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="profile-form" onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-display-name"
                className="text-sm font-medium text-neutral-700 block mb-1"
              >
                Display name
              </label>
              <Input
                id="settings-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label
                htmlFor="settings-email"
                className="text-sm font-medium text-neutral-700 block mb-1"
              >
                Email
              </label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                spellCheck={false}
                autoComplete="email"
              />
            </div>
          </div>
          <div className="mt-4">
            <label
              htmlFor="settings-organization"
              className="text-sm font-medium text-neutral-700 block mb-1"
            >
              Organization
            </label>
            <Input
              id="settings-organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="max-w-md"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dirty}
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          type="submit"
          form="profile-form"
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

/* ─── Security card ─────────────────────────────────────────────────────── */

function SecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Passkeys — phishing-resistant, no password required.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-neutral-900 m-0">Passkey</p>
            <p className="text-sm text-neutral-500 m-0">
              Sign in with Touch ID, Windows Hello, or a hardware key.
            </p>
          </div>
          <Button variant="default" size="sm" className="ml-auto">
            <KeyRound data-icon="inline-start" aria-hidden />
            Add a passkey
          </Button>
        </div>
        <SectionHeading as="h4">Registered passkeys</SectionHeading>
        <p className="font-sans text-sm text-neutral-500 m-0">
          No passkeys registered yet.
        </p>
      </CardContent>
    </Card>
  );
}
