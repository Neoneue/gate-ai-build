import { KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/page-title";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionTitle } from "@/components/ui/section-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-018 — Settings (Workspace Admin)
 *
 * Profile / security configuration surface.
 *
 * Composition: two titled sections stacked in the page column.
 *   1. Profile   — section title + subtitle ABOVE the card; three fields
 *                  (display name, email, org) with a single unified dirty
 *                  state and shared Save / Reset footer.
 *   2. Security  — section title + subtitle ABOVE the card; passkey
 *                  registration (static, no dirty state).
 *
 * Section titles sit above their card, never inside it (design.md §3 /
 * SectionTitle). The cards carry data only — no CardHeader.
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

/* ─── Page surface — header + titled sections ───────────────────────────── */

function SettingsSurface() {
  return (
    <div className="flex w-full flex-col gap-6 xl:max-w-5xl">
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
    </div>
  );
}

/* ─── Page header ───────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-full flex-col gap-2 xl:max-w-1/2">
        <PageTitle>Settings</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
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
  email: "chad@constellationnetwork.io",
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
              <p className="type-input-helper">
                Verified at sign-in; changes require identity-provider
                re-verification.
              </p>
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
        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex flex-col gap-1">
            <p className="type-label-14 m-0 text-foreground">Passkey</p>
            <p className="type-copy-14 m-0 text-muted-foreground">
              Sign in with Touch ID, Windows Hello, or a hardware key.
            </p>
          </div>
          <Button className="lg:ml-auto" size="sm" variant="default">
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
