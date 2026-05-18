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
 * Profile / security configuration surface. Same production-frame chrome
 * as CMP-012 / CMP-013 / CMP-014 / CMP-017.
 *
 * Composition: four cards stacked in a `flex flex-col gap-4` container.
 *   1. Display name  — SettingsFieldCard (one field, own Save/Reset)
 *   2. Email         — SettingsFieldCard (one field, own Save/Reset)
 *   3. Organization  — SettingsFieldCard (one field, own Save/Reset)
 *   4. Passkey       — SecurityCard (static, no dirty state)
 *
 * The three editable cards share the local `SettingsFieldCard` helper
 * (defined below) instead of inlining the pattern three times. Each card
 * manages its own dirty state — editing one card does NOT affect the
 * Save/Reset state of the others.
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
        <SettingsFieldCard
          id="settings-display-name"
          title="Display name"
          description="The name shown to teammates on this workspace."
          initialValue="Chad Ponticas"
          autoComplete="name"
        />
        <SettingsFieldCard
          id="settings-email"
          title="Email"
          description="Used to sign in and receive workspace notifications."
          initialValue="chad@constellationnetwork.io"
          type="email"
          autoComplete="email"
          spellCheck={false}
        />
        <SettingsFieldCard
          id="settings-organization"
          title="Organization"
          description="Your workspace name. Appears across billing, members, and audit records."
          initialValue="Chad Ponticas's workspace"
          autoComplete="organization"
        />
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
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Profile, security, logging, and integrations.
        </p>
      </div>
    </div>
  );
}

/* ─── Local helper — one-field settings card ────────────────────────────
 * Encapsulates the repeated pattern: single input, dirty detection,
 * per-card Save + Reset, beforeunload guard. Do NOT extract to a shared
 * file — this pattern is Settings-specific. */

type SettingsFieldCardProps = {
  /** Stable id for the input + form. Used as prefix: `${id}-form`. */
  id: string;
  /** Card title — also serves as the input's accessible name. */
  title: string;
  /** Short factual description shown under the title. */
  description: string;
  /** Initial value. The card seeds its current + saved state from this. */
  initialValue: string;
  /** Input type. Default 'text'. */
  type?: string;
  autoComplete?: string;
  /** Pass `false` to suppress browser spellcheck (e.g. email). */
  spellCheck?: boolean;
};

function SettingsFieldCard({
  id,
  title,
  description,
  initialValue,
  type = 'text',
  autoComplete,
  spellCheck,
}: SettingsFieldCardProps) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const dirty = value !== saved;

  // Keep a ref so the handler always reads the latest dirty state without
  // re-subscribing on every change. Subscribes exactly once (mount) and
  // removes on unmount.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Warn on tab close / reload when there are unsaved changes. Does NOT
  // catch in-app navigation (sidebar clicks); a react-router useBlocker
  // would cover that, but adding it touches more surface than this fix
  // is scoped to.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base font-medium text-neutral-900">
          {title}
        </CardTitle>
        <CardDescription className="font-sans text-sm text-neutral-500">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <form
          id={`${id}-form`}
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(value);
          }}
        >
          {/* Card title is the visual label — drop the redundant inline Label.
              Use aria-label so the input still has an accessible name. */}
          <Input
            id={id}
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete={autoComplete}
            spellCheck={spellCheck}
            aria-label={title}
            className="max-w-md"
          />
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dirty}
          onClick={() => setValue(saved)}
          className="border-border bg-card text-neutral-900"
        >
          Reset
        </Button>
        <Button
          type="submit"
          form={`${id}-form`}
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

/* ─── General · Security ───────────────────────────────────────────────── */

function SecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base font-medium text-neutral-900">
          Passkey
        </CardTitle>
        <CardDescription className="font-sans text-sm text-neutral-500">
          Sign in with Touch ID, Windows Hello, or a hardware key.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pb-2">
        <SectionHeading as="h4">Registered passkeys</SectionHeading>
        <p className="font-sans text-sm text-neutral-500 m-0">
          No passkeys registered yet.
        </p>
      </CardContent>
      <CardFooter className="justify-end border-t border-border">
        <Button variant="default" size="sm">
          <KeyRound data-icon="inline-start" aria-hidden />
          Add a passkey
        </Button>
      </CardFooter>
    </Card>
  );
}
