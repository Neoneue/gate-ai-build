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
      <div className="grid grid-cols-12">
        <div className="col-span-12 flex flex-col gap-4 2xl:col-span-9">
          <ProfileCard />
          <SecurityCard />
        </div>
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
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-snug">
          Profile, security, logging, and integrations.
        </p>
      </div>
    </div>
  );
}

/* ─── Profile & organization card ──────────────────────────────────────────
 * Four fields share a single dirty state. Dirty = any field differs from
 * its last-saved value. Save commits all four; Reset reverts all four. */

const PROFILE_DEFAULTS = {
  firstName: "Chad",
  lastName: "Ponticas",
  email: "chad@constellationnetwork.io",
  organization: "Chad Ponticas's workspace",
};

function ProfileCard() {
  const [saved, setSaved] = useState(PROFILE_DEFAULTS);
  const [firstName, setFirstName] = useState(PROFILE_DEFAULTS.firstName);
  const [lastName, setLastName] = useState(PROFILE_DEFAULTS.lastName);
  const [email, setEmail] = useState(PROFILE_DEFAULTS.email);
  const [organization, setOrganization] = useState(
    PROFILE_DEFAULTS.organization
  );

  const dirty =
    firstName !== saved.firstName ||
    lastName !== saved.lastName ||
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
    setSaved({ firstName, lastName, email, organization });
  }

  function handleReset() {
    setFirstName(saved.firstName);
    setLastName(saved.lastName);
    setEmail(saved.email);
    setOrganization(saved.organization);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          View and update your personal and organization's information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="profile-form" onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="mb-1 block font-medium text-neutral-700 text-sm"
                htmlFor="settings-first-name"
              >
                First name
              </label>
              <Input
                autoComplete="given-name"
                id="settings-first-name"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
              />
            </div>
            <div>
              <label
                className="mb-1 block font-medium text-neutral-700 text-sm"
                htmlFor="settings-last-name"
              >
                Last name
              </label>
              <Input
                autoComplete="family-name"
                id="settings-last-name"
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
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
              <p className="m-0 mt-1 text-pretty font-sans text-neutral-500 text-xs tracking-tight">
                Verified at sign-in. Changing it requires re-verification
                through your identity provider.
              </p>
            </div>
            <div>
              <label
                className="mb-1 block font-medium text-neutral-700 text-sm"
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
