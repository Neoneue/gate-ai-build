import {
  AgentMessage,
  MessageThread,
  UserMessage,
} from "@/components/ui/ask-ai-message";

/* ─── PLACEHOLDER THREAD — DOC-SOURCED, NOT WIRED TO DATA ────────────────────
 * Copy authority: the live doc
 *   https://docs.constellationgate.ai/getting-started/quickstart-gate-connect
 * Type/layout authority: Figma `1125:4374`.
 *
 * Figma's reply text was pasted from that doc and picked up artifacts, so the
 * wording, bolding, link labels and paragraph structure below come from the
 * doc; only the heading TIER follows Figma (h3 / 16px — the doc's source uses
 * `##`, but Figma renders these at the 16px tier and Figma owns type).
 *
 * Deliberately authored as plain markdown-shaped HTML (h3 / p / ul / li /
 * strong / a / code) — exactly what a renderer emits — and styled entirely by
 * the ReplyProse scope in <AgentMessage>. Dropping in a real markdown renderer
 * needs no restyling here.
 *
 * REPLACE THIS ENTIRELY once the panel is wired to the live agent.
 *
 * Reconciled against the doc (2026-07-27) — every difference was Figma drift:
 *   · "Step 3. Turn off your apps"  → "Turn on your apps" (Figma typo; its own
 *     body always said "turn on").
 *   · "Step 5. Confirm it's working" → "Confirm it is working".
 *   · The download sentence now cites the doc's "latest release" link, not the
 *     stray "Route my existing subscription" label, and Figma's invented
 *     "Installs are available for:" sentence is gone — the doc runs the list
 *     straight off the colon.
 *   · Intro paragraph replaced with the doc's. Figma's ("takes about 5
 *     minutes") was an agent-authored preamble, not doc copy — flagged in the
 *     handoff in case it is wanted back.
 *   · Dropped bolds Figma added that the doc does not have: "Gate Connect",
 *     "Gate API key", "menu bar", "Cmd+Q", "Messages".
 *   · Next-steps labels and Step 5's "dashboard" now use the doc's link text
 *     instead of bare URLs. Doc-relative hrefs are absolutised, since the panel
 *     does not run on the docs domain.
 *   · Code chips carry no literal backticks — the doc confirms these are real
 *     inline-code spans, so Figma's visible backticks were a paste artifact.
 *     `x64` is a chip for the same reason.
 * NOT reproduced, on instruction / pending decisions:
 *   · The doc's "Before you start" prerequisites section — Figma's reply
 *     deliberately opens at Step 1.
 *   · Step 3's routing screenshot — `img` has no treatment in ReplyProse yet.
 *     Its caption line is kept per the doc's paragraph structure, though it
 *     repeats a sentence from the paragraph above and reads as caption text
 *     now that the image is absent.
 * ────────────────────────────────────────────────────────────────────────── */

const DASHBOARD_URL = "https://app.constellationgate.ai";
const LATEST_RELEASE_URL =
  "https://github.com/Constellation-Labs/gate-connect-app/releases/latest";
const AUDIT_TRAIL_URL =
  "https://docs.constellationgate.ai/concepts/audit-trail/";
const CONNECT_APPS_URL =
  "https://docs.constellationgate.ai/gate-connect/connect-your-apps/";
const MANUAL_SETUP_URL =
  "https://docs.constellationgate.ai/getting-started/quickstart-manual-setup/";

export function AskAiPlaceholderThread() {
  return (
    <MessageThread>
      <UserMessage>How do I set up the Gate Connect app?</UserMessage>

      <AgentMessage>
        <p>
          Gate Connect routes the AI apps you already run through Gate, with no
          code changes. You sign in once, turn on the apps you want covered, and
          they keep working exactly as before, with Gate's security scanning,
          audit trail, and cost tracking running underneath. The same flow
          covers Claude Code, Claude Desktop, Codex, and the other apps Gate
          Connect supports.
        </p>

        <h3>Step 1. Install Gate Connect</h3>
        <p>
          Download the installer for your platform from the{" "}
          <a
            href={LATEST_RELEASE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            latest release
          </a>
          :
        </p>
        <ul>
          <li>
            macOS: the universal <code>.dmg</code>
          </li>
          <li>
            Windows: the <code>x64</code> setup <code>.exe</code>
          </li>
          <li>
            Linux: the <code>.AppImage</code> or <code>.deb</code>
          </li>
        </ul>
        <p>
          Open the installer, then launch Gate Connect. It runs from the menu
          bar (top right on macOS, the system tray on Windows), not as a normal
          window. Click the icon to open its panel.
        </p>

        <h3>Step 2. Sign in</h3>
        <p>
          In the panel, paste your Gate API key and click{" "}
          <strong>Connect</strong>. The gateway address is filled in for you, so
          the key is all you need. Once it connects, the icon shows{" "}
          <strong>Connected</strong>.
        </p>
        <p>
          Your key is stored in your operating system's keychain, not in a file
          on disk.
        </p>

        <h3>Step 3. Turn on your apps</h3>
        <p>
          Open <strong>Routing</strong> and make sure{" "}
          <strong>Route through Gate</strong> is on. Then turn on each app you
          want Gate to cover. A single toggle can cover more than one, for
          example Claude Code and Claude Desktop together.
        </p>
        <p>
          Turn on each app you want Gate to cover. The rest keep talking to
          their providers directly.
        </p>

        <h3>Step 4. Restart your apps</h3>
        <p>
          Quit and reopen each app you turned on, so it picks up the new
          routing. On macOS, quit completely with Cmd+Q rather than just closing
          the window. If an app prompts you to sign in the first time it
          reopens, follow its normal sign-in.
        </p>

        <h3>Step 5. Confirm it is working</h3>
        <p>
          Send a message from one of the apps you turned on, then open the{" "}
          <a href={DASHBOARD_URL} rel="noopener noreferrer" target="_blank">
            dashboard
          </a>
          . New requests appear on the Messages page within a few seconds, each
          with its model, cost, and security result.
        </p>
        <p>
          If nothing shows up, check that the app is turned on in{" "}
          <strong>Routing</strong> and that you restarted it.
        </p>

        <h3>Next steps</h3>
        <ul>
          <li>
            See what your apps did in the{" "}
            <a href={AUDIT_TRAIL_URL} rel="noopener noreferrer" target="_blank">
              audit trail
            </a>
            .
          </li>
          <li>
            Need notes for a specific app? See{" "}
            <a
              href={CONNECT_APPS_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Connect your apps
            </a>
            .
          </li>
          <li>
            Prefer to wire things up yourself? Follow the{" "}
            <a
              href={MANUAL_SETUP_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              manual setup quickstart
            </a>
            .
          </li>
        </ul>
      </AgentMessage>
    </MessageThread>
  );
}
