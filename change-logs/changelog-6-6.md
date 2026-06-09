# UI Changelog: 2026-06-06 → 06-08

Running log of UI changes for this stretch (06-06 through 06-08; folded into one
file, no separate 06-07/06-08). Written for an agent/dev to **diff against and
replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior days: [`changelog-6-5.md`](./changelog-6-5.md), [`changelog-6-4.md`](./changelog-6-4.md).

**Using this log to make a change:**

- Each entry is tagged with its commit (`[abc1234]`) or `(uncommitted)`. For a
  committed entry, **`git show <hash>` is the exact diff** (the most reliable
  source; this prose is the summary).
- This file logs **deltas, not the full contract.** `design.md` is the
  authoritative design system (token + primitive rules, e.g. Badge's
  no-icons-inside); `data-model.md` is the architecture (routes, types, data).
  Check those before a "fix" so you don't break an unstated invariant.
- **Verify** edits with `npx tsc -b` (must exit 0) and the dev server at
  `localhost:3000`; per-surface deep-links are noted under each surface entry.

Organized by **scope**. Filing test: edit one primitive → **Components**; apply a
rule in N places → **Conventions**; rebuild one surface → **Sections**. Components
are alphabetical; Conventions and Sections are newest-first.

---

## Conventions & tokens

### Redacted-by-default Full request + one shared Unredact toggle (06-08) [16598f4]

The gateway's promise is that a caught secret/PII never re-egresses, so no detail
surface should show it raw by default. Before: the Findings-tab evidence span had
its own `Unredact` toggle (default off), but the Details-tab **Full request** (and
its copy-to-clipboard payload) always rendered the raw value. → Now `showRaw` is
lifted to `RequestDetailBodyV2` (default `false`) and shared: the single
admin-gated toggle masks/reveals **both** the evidence span and the Full request.
When off, `RequestBodyPanel` replaces **every** finding's `match` with its
`redactedAs` in the body + clipboard (not just the selected finding, so a
2-finding request never leaks the unselected secret). Non-admins can't toggle, so
they only ever see the redacted form. Where: `src/pages/Requests.tsx`
(`RequestDetailBodyV2`, `PiiRightPanel` props, `RequestBodyPanel`).

### Blocked requests are errors, not 2xx (06-08) [5e22c0e]

A gateway block rejects the request, so its HTTP status is an error. Before: the
injection blocks carried `status: "success" / code "200"` (block lived only on the
guardrail axis). → Now a block is `status: "error" / code "403"` across the
Requests table, the trace (red `danger` node), and the Errors tab. Applies to the
3 injection blocks + the new credential block. Reconciles with the documented
two-axis schema (`error | block` = 403; `success | block` kept out of mock data).
Where: `src/pages/Requests.tsx` (`REQUEST_ROWS_RECENT`).

### Selection is a status-tone outline, never a blue fill (06-08) [5e22c0e, 69d25c5]

Selecting a trace step or message bubble previously painted a flat `bg-blue-50`
fill. → Now selection is an **outline** whose color tracks the row's status, so the
only colors in the trace are the three status tones: **green** = normal/success,
**amber** = flag/redact, **red** = block/error. On the trace, the ring is drawn as
an `::after` overlay (so it sits above the timeline track, not under it) plus a
`bg-card` fill overlay that masks the gray line through the selected row; rows get
`cursor-pointer` and a faint `-200` status-tone hover ring to read as clickable.
Message bubbles adopt their request's status tone (added a `danger` tone to
`MessageBlock`). Where: `src/pages/Conversations.tsx` (`TraceItem`,
`TRACE_SELECT_RING` / `TRACE_HOVER_RING`), `src/components/ui/message-block.tsx`.

### Entity findings name the redaction token, never the raw value (06-08) [6b6643c]

`findingBannerSentence` is the single source for the detection sentence. Before:
PII/credential read "detector matched email address in user turn N" (abstract). →
Now "detector **caught** `<REDACTION_TOKEN>` in {role} turn N", i.e. the
`redactedAs` placeholder (`<EMAIL>` / `<AWS_ACCESS_KEY_ID>`), never the raw value.
Where: `src/pages/Requests.tsx` (`findingBannerSentence`).

### A caught value never re-appears raw in the transcript (uncommitted)

Redaction happens at the gateway on ingress: Presidio / the credentials scanner
detect the entity, then the anonymizer replaces it with a placeholder before the
prompt reaches the provider. The Conversations **Messages** panel is a
reconstruction from those logs, so it must show the redacted form, not the raw
value the user typed.

Before: the message bubble rendered `r.userMessage` verbatim, so the user turn
showed `lena.ortiz@constellation.io`, the AWS key, and the live Anthropic key in
full. That contradicted the request-detail redaction diff and the assistant's own
"shows as a masked token" narration. → Now `redactUserBody(row, body)` replaces
each **user-role** finding's `match` with its `redactedAs` placeholder, so bubbles
read `<EMAIL>` / `<AWS_ACCESS_KEY_ID>` / `<ANTHROPIC_API_KEY>`. Assistant bubbles
are untouched (they narrate the redaction, never repeat the value). The
`…EXAMPLEKEY` dummy secret stays raw because it is not a finding, matching how the
detector behaves.

The request detail (`/requests-findings/:id`) is the **one** sanctioned place that
shows the raw value, as the before → after redaction diff. Where:
`src/data/conversationDetail.ts` (`redactUserBody`, applied in the scripted
messages `flatMap`).

## Components

### MessageBlock — 200px scroll cap, status tone, danger variant (06-08) [db7ba6c, 5e22c0e]

Three changes: (1) bubble body capped at `max-h-[200px] overflow-y-auto
overscroll-contain` so a long tool result scrolls inside the bubble instead of
ballooning the panel; (2) added a `danger` tone (red) alongside `warn`, with base
border softened to `border-danger-200` to match the `warn` weight; (3) selected
ring tracks tone — green (`success-600`) normal, amber (`warning-500`) warn, red
(`destructive`) danger. Where: `src/components/ui/message-block.tsx`. Consumer:
`Conversations.tsx` passes each bubble's tone from its trace step status.

### PiiRightPanel — block-aware "What we did"; Unredact via props (06-08) [16598f4]

Credential findings render through `PiiRightPanel` (non-injection route). Before:
it always showed "What we sent upstream" + a redaction diff + "Bytes redacted",
which is wrong for a **block** (nothing egresses). → Now when `finding.action ===
'block'` it shows "What we did / Action: Blocked, not sent upstream" and drops the
diff + bytes row. Also: `showRaw` is no longer local state — it's a prop
(`showRaw` + `onShowRawChange`) so the Unredact toggle is shared with the Full
request. Where: `src/pages/Requests.tsx` (`PiiRightPanel`).

### RequestBodyPanel — showRaw redaction of Full request + clipboard (06-08) [16598f4]

New `showRaw` prop (default `false`). When off, every `row.findings` match is
replaced with its `redactedAs` in the Full request body and the copy payload, and
the selected finding's placeholder is highlighted; when on, the raw body + raw
match show. Where: `src/pages/Requests.tsx` (`RequestBodyPanel`).

### TraceItem — selection outline above the track + clickable affordance (06-08) [5e22c0e, 69d25c5]

Selection moved from a `bg-blue-50` fill to a status-tone `::after` ring drawn
above the timeline track, with a `bg-card` overlay masking the gray line through
the selected row (content raised `relative` above the fill). Added
`cursor-pointer` and a solid `-200` status-tone hover ring (replacing the
neutral hover bg; `-50` was invisible). See the Conventions entry for the tone
system. Where: `src/pages/Conversations.tsx` (`TraceItem`).

### TraceItem — node color keys off guardrail status, not latency (uncommitted)

The timeline node ring + icon signal whether a security check fired, so latency
must not color them.

Before: a codified slow-latency policy flipped the node to amber
(`border-warning-600` / `text-warning-700`) for any `status === 'success' &&
latency > 2000ms`, so a clean-but-slow Allow step read as a finding. → Now
`nodeBorder` / `nodeIconTone` derive from `event.status` only via
`TRACE_NODE_BORDER` / `TRACE_NODE_ICON_TONE`: **green** = clean Allow (no detector
fired), **amber** = flag / redact, **red** = block / error. The slow-row tint is
kept on the latency **text** in the data line, so slowness is still surfaced but
never as a false security signal. Removed the now-unused `isVerySlow`. Matches
staging, which shows clean steps green regardless of latency. Where:
`src/pages/Conversations.tsx` (`TraceItem`).

## Sections & surfaces

### Overview hero — new "Download Gate Connect" modal (Figma 514:42) (06-08) (uncommitted)

Replaced the old "Select a version to download" modal (a single Base UI `Select`
of mac/windows/linux + Cancel/Download footer) in the Overview hero's Gate Connect
tab with a 548px three-region modal matching Figma node `514:42`. → **Header**
(BrandMark + "Download Gate **Connect**" with Connect in `text-blue-700` + muted
subtitle + custom X, bottom divider). **Body**: a "Choose your platform" radiogroup
of three 92px toggle cards (brand-colored 24px OS icons, selected = `border-neutral-900`
+ `shadow-xs`) with a dark "Detected" pill on the auto-detected OS; a "Choose your
build" Base UI `RadioGroup` of two 52px rows per platform (Installer + arch + muted
detail + right-aligned file size); a `v1.4.2 · Requires …` line. **Footer**: full-width
48px primary Download button labeled "Download for {platform}", top divider. Behavior:
OS auto-detection (`navigator.userAgentData?.platform` → `platform` → `userAgent`,
default Windows) sets the initial platform + which card wears the Detected pill (the
pill never moves when the user picks another card); switching platform swaps the build
matrix, requirement line, and button label. Outside-press does **not** dismiss (scrim
inert; X + Escape close) via `onOpenChange` ignoring `reason === 'outside-press'`.
New co-located `DownloadGateConnectDialog` component + `PLATFORMS` build matrix;
removed the unused `downloadOS` state and `Select`/`Dialog{Header,Title,Footer}`
imports. New assets: `public/icons/os/{macos,windows,linux}-color.svg` (brand-colored
24px; old monochrome `os/*.svg` left untouched, now unreferenced). Locked
`rounded-xl` (16px) modal radius kept; regions own their 24px x-padding (`gap-0 p-0`
on the content). **Deep-link:** `/overview-default` → Gate Connect tab → Download
Gate Connect. Where: `src/pages/DashboardDefault.tsx`.

### Requests / Conversations — credentials surfaced once, keys redacted everywhere (06-08) [16598f4]

The captured debugging-script lines (`hasRaw*` / `exampleSecretStillRaw`) were
leaking the raw AWS + Anthropic keys across many message bodies. → Removed them and
redacted every raw secret in the session content to placeholders. Each key is now
surfaced **once** as a real, doc-grounded finding: `req_8389e4` is a combined
**PII-email + AWS-credential redact** (2 findings; `AWSKeyDetector`,
`AKIA[0-9A-Z]{16}`), and `req_bbeb7d` is an **Anthropic credential block**
(`allow` → `error/403`; `AnthropicKeyRecognizer`). Raw keys live only in those two
rows' findings (the analyst view), never raw in any message bubble. Conversation
tab counts move to All 100 / Findings 11 / Errors 4. **Deep-links:**
`/requests-findings/req_8389e4` (PII + credential redact),
`/requests-findings/req_bbeb7d` (credential block). Where: `src/pages/Requests.tsx`.

### Security events — credential leak listed under its PII event (06-08) (uncommitted)

The Events feed was missing the AWS credential catch on `req_8389e4`. → Added a
`Credential · REDACTED` row at the same timestamp (`00:50:40`), directly below the
PII row for the same request (one request, two findings). The 9 hero-conversation
events (3 injection blocks + 6 PII redactions) were already surfaced at the top of
the feed earlier in this stretch. Where: `src/pages/security-data.ts`
(`EVENT_ROWS`). Still missing: the `req_bbeb7d` Anthropic block event.

### Token Savings — Overview + Savings options sections, KPI sparklines (06-08) [9dbf5b5]

Before: a bare 3-tile KPI bar showing `0 %` with no trend. → Split into a titled
**Overview** section (range selector + custom-date picker, `size="sm"`, defaults to
All) with 3 KPI tiles carrying real values (Total saved 13.9% / Caching 0.15% /
Compression 13.7%), derived deltas, and ramp-then-plateau `CompactSpark`
sparklines; and a **Savings options** section wrapping the Caching/Compression
cards. Deltas are computed from each sparkline (last − first) so they can't
contradict the chart; All-time/30d show the lifetime climb-from-~0, 24h/7d sit in
the plateau. Where: `src/pages/TokenSavings.tsx`. Deep-link: `/token-savings`,
`?range=24h|7d|30d|all`.

### Conversations trace — Findings-only + Errors tabs built (06-08) [db7ba6c, 5e22c0e]

The `findings` and `errors` step tabs were placeholders. → Both now render the same
two-panel layout as **All steps**, filtered to finding steps (`e.finding`) /
errored steps (`e.status === 'danger'`); runs of passing steps collapse into a
muted "N passing request(s)" separator. Reuses `RequestTracePanel` via a new
`items` / `countLabel` prop (no forked component); cross-highlight + the
View-Request footer keep working. Where: `src/pages/Conversations.tsx`. Deep-link:
`/conversations-trace/cnv_7a3f9e2b`.

### Requests — injection req_18039f flipped to Flag (06-08) [6b6643c]

One injection finding modeled as a **Flag** (policy = Flag, request proceeds)
rather than Block: chip reads `INJECTION · FLAG`, the injection panel Action shows
"Flagged - request proceeded", and the How-to-fix copy points to Tune policy /
Mark false positive. Where: `src/pages/Requests.tsx` (`req_18039f`,
`InjectionRightPanel`).

### Limits — Threshold / Used cells right-aligned (06-08) [9dbf5b5]

The Threshold + Used columns have `numeric` (right-aligned) headers, but the body
cells were left-aligned, so values didn't sit under their headers. → Added
`text-right` to both body cells. Where: `src/pages/Limits.tsx`.

### Security event detail — Message box 200px scroll cap (06-08) [6b6643c]

The event-detail Message block (evidence + sample prompt/response) could be a long
unbounded dump. → Capped at `max-h-[200px] overflow-y-auto overscroll-contain`.
Where: `src/pages/Security.tsx`.

### Conversations trace — redacted transcript + status-true node colors (uncommitted)

On `/conversations-trace/cnv_7a3f9e2b` the two changes above land together: the
Messages transcript shows the redacted placeholders, and the Request Trace nodes
color by guardrail. No raw PII or credential value appears anywhere on the
conversation surface.

**Verified at `localhost:3000`:** node sequence (oldest → newest) reads
`1-3 green · 4 amber (PII · Redact) · 5-6 green · 7 amber (PII · Redact) ·
8-9 green · 10 red (Credential · Block)`; the clean steps stay green despite 4-5s
latencies; the transcript contains no `lena.ortiz@` / `ops@` / `AKIA…` / `sk-ant-…`
values; banner reads "3 findings across this conversation · Highest action: Block".
Request detail keeps the raw value + redaction diff.

**Deep-links:** `/conversations-trace/cnv_7a3f9e2b` (trace page);
`/requests-findings/req_a1f3d9` (PII email), `/requests-findings/req_e4c7b1`
(PII + credential), `/requests-findings/req_3f9c2a` (block).
