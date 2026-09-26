# UI Changelog: 2026-09-26

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-25.md`](./changelog-9-25.md)

---

## Sections & surfaces

### Messages: a Manager's or Member's hero total matches their Activity page (`requests/HeroMetric.tsx`, `requests/hero-data.ts`) · [f7573de]

- **Before:** the scoped hero scaled the org chart by the viewer's 7d
  traffic share and rounded each bucket, so a small user read 0 (Jordan at
  7D: hero 0, Activity 9).
- **After:** the hero total is the viewer's own keys' messages for the
  range (`usageAt`, the Activity page's number), spread across the org
  chart's buckets by largest remainder. The trace keeps its shape and the
  bars sum exactly to the headline. Admin still reads the org view as is.
- `requestShare` and `scaleByShare` removed from `teams/view-scope.ts` (no
  other consumer). Test: hero total equals Activity total per scoped
  viewer and range.

### Message detail: blocked and error rows show no assistant reply (`requests/RequestDetailBody.tsx`) · [f7573de]

- **Before:** a blocked or errored row whose capture carried text showed
  that text as the reply.
- **After:** `assistantReply()` returns empty for both, so the response
  block is skipped. The conversation view still shows the captured text as
  the model's next turn in the thread.

### Messages: two authored blocked messages rewritten (`data/request-previews.ts`, `data/authored-request-bodies.ts`) · [f7573de]

- d33a9b66: the injection now arrives inside a pasted relationship-manager
  email carrying source-of-funds documents.
- d0b46d2b: the pasted curl is a valid Messages API call. Previews
  regenerated.

## Conventions

### Credential findings carry the credential scanner rule (`data/requests.ts`) · [f7573de]

- 3 anthropic-key findings relabelled rule `pii-detection` to
  `credential-scanner`.

### Dead key sparkline data and stale doc references removed (`data/api-keys.ts`, `CLAUDE.md`) · [f7573de]

- `requests7d` removed from API key rows and the new-key default in
  `ApiKeys.tsx` (never read).
- `CLAUDE.md` and `gateway-context.md` no longer point at two findings docs
  absent on this machine; the June changelogs name the PII scanner by role,
  not vendor.
