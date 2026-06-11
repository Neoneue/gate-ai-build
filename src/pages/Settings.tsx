import { KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/page-title";
import { SectionHeading } from "@/components/ui/section-heading";
import { DashboardChrome } from "@/layouts/DashboardChrome";

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
      <div className="flex max-w-1/2 flex-col gap-2">
        <PageTitle>Settings</PageTitle>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-tight">
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
  displayName: "Chad Ponticas",
  email: "chad@constellationnetwork.io",
  organization: "Chad Ponticas's workspace",
};

function ProfileCard() {
  const [saved, setSaved] = useState(PROFILE_DEFAULTS);
  const [displayName, setDisplayName] = useState(PROFILE_DEFAULTS.displayName);
  const [email, setEmail] = useState(PROFILE_DEFAULTS.email);
  const [organization, setOrganization] = useState(
    PROFILE_DEFAULTS.organization
  );

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
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
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
                className="mb-1 block font-medium text-neutral-700 text-sm"
                htmlFor="settings-display-name"
              >
                Display name
              </label>
              <Input
                autoComplete="name"
                id="settings-display-name"
                onChange={(e) => setDisplayName(e.target.value)}
                value={displayName}
              />
            </div>
            <div>
              <label
                className="mb-1 block font-medium text-neutral-700 text-sm"
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
          </div>
          <div className="mt-4">
            <label
              className="mb-1 block font-medium text-neutral-700 text-sm"
              htmlFor="settings-organization"
            >
              Organization
            </label>
            <Input
              className="max-w-md"
              id="settings-organization"
              onChange={(e) => setOrganization(e.target.value)}
              value={organization}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t">
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
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Passkeys — phishing-resistant, no password required.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center">
          <div className="flex flex-col gap-1">
            <p className="m-0 font-medium text-neutral-900 text-sm">Passkey</p>
            <p className="m-0 text-neutral-500 text-sm">
              Sign in with Touch ID, Windows Hello, or a hardware key.
            </p>
          </div>
          <Button className="ml-auto" size="sm" variant="default">
            <KeyRound aria-hidden data-icon="inline-start" />
            Add a passkey
          </Button>
        </div>
        <SectionHeading as="h4">Registered passkeys</SectionHeading>
        <p className="m-0 font-sans text-neutral-500 text-sm">
          No passkeys registered yet.
        </p>
      </CardContent>
    </Card>
  );
}
