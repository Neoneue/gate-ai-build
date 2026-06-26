import { Code, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChoiceCard, SetupScaffold } from "@/pages/onboarding-shared";

/* ─── /setup-connect-default ────────────────────────────────────────────────
 * BYOK branch: pick how to route your existing subscriptions — automatically
 * via the Gate Connect menu-bar app, or by hand with a key + config snippet.
 * Back breadcrumb → Overview.
 * ────────────────────────────────────────────────────────────────────────── */

export function SetupConnect() {
  const navigate = useNavigate();

  return (
    <SetupScaffold
      backLabel="Overview"
      backTo="/overview-default"
      subtitle="Two ways to route the plans you already pay for. Switch anytime."
      title="Pick how to connect"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ChoiceCard
          body="A menu-bar app routes your Claude app, Cowork, Codex, and Cursor automatically. No keys to copy."
          cta="Set up Gate Connect"
          ctaVariant="default"
          icon={Zap}
          onClick={() => navigate("/setup-gate-connect-default")}
          title="Gate Connect"
          tone="blue"
        />
        <ChoiceCard
          body="Create a key and add the config to your code, CLI, or CI."
          cta="Set up manually"
          ctaVariant="default"
          icon={Code}
          onClick={() => navigate("/setup-manual-default?bill=byok")}
          title="Manual"
          tone="blue"
        />
      </div>
    </SetupScaffold>
  );
}
