# UI Changelog: 2026-10-13

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-12.md`](./changelog-10-12.md)

---

## Sections

### Onboarding desktop: setup steps, real Gate Chat, setup Overview `c9c7663`

- Step 3 Check connection uses step 2's layout: "Send a test message", then
  a required "Run the protection demo" with matching success / error rows
  (`?simulate=fail-connection|fail-demo|fail-both` previews the errors).
- Final page "You're protected and live"; its task rows open in a new tab.
- Top-bar Get started / Tasks menu: per-path rows, forward only, opens only.
- Sidebar "Get started" item; Overview appears after Finish setup and opens
  `/overview-setup-onboarding`, a Pro-layout Overview fed by the two setup
  messages.
- Desktop onboarding Gate Chat is the real Gate Chat (attach, picker with
  the Free tab, compare), opens in a new tab, starts the user's own
  conversation; credits added in setup carry to the chat tab.
- Manual setup: the official repo's ConnectTabs ported
  (`onboarding-connect-tabs.tsx`), key step, official titles and subtitles.
  Gate Connect shows its billing choice below the app.
- Notifications and Ask AI are hidden during onboarding.
