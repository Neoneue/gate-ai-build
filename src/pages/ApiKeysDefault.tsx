import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { randomHex } from "@/lib/utils";
import {
  CreateKeyDialog,
  KeyCreatedDialog,
  KeysEmptyState,
  PageHeader,
  UsageInfo,
} from "@/pages/ApiKeys";

/* ─────────────────────────────────────────────────────────────────────────
 * API Keys — default / empty variant (route: /api-keys-default, sidebar:
 * "API Keys").
 *
 * Mirrors the full API Keys page but with no keys: the table + Active/Revoked
 * tabs are gone, replaced by the shared no-keys <KeysEmptyState> card (built
 * on the <EmptyState> primitive — the same default empty card used across the
 * site). The page header (with "Create key") and the "Using your key" section
 * are reused verbatim from <ApiKeys> so the two pages never drift. The create
 * flow still opens its dialogs; since there's no table here, a created key
 * surfaces in the one-time "Key created" modal and isn't appended to a list.
 * ───────────────────────────────────────────────────────────────────────── */

export function ApiKeysDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [createOpen, setCreateOpen] = useState(false);
  // One-time full key for the step-2 modal. No table to append to on this
  // variant, so creating just surfaces the key once and resets.
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = () => {
    setCreateOpen(false);
    setCreatedKey(`sk-gw-${randomHex(64)}`);
  };

  return (
    <DashboardChrome
      activeNavId="api-keys"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Content stays fluid up to xl, then caps tighter so the cards don't
          stretch across ultrawide displays. */}
      <div className="flex w-full flex-col gap-6 xl:max-w-5xl">
        <PageHeader />
        <KeysEmptyState onCreate={() => setCreateOpen(true)} />
        <UsageInfo />
      </div>
      <CreateKeyDialog
        onCreate={handleCreate}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
      <KeyCreatedDialog
        fullKey={createdKey}
        onClose={() => setCreatedKey(null)}
      />
    </DashboardChrome>
  );
}
