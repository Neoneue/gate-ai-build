# UI Changelog: 2026-06-16

Running log of UI changes for 06-16. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-15.md`](./changelog-6-15.md).

---

## Components

### Workspace switcher: blue PRO plan badge `da8cd10`

The top-bar workspace plan badge now uses the `info` variant (blue,
`bg-blue-700/10 text-blue-600`) when the surface is Pro; Free stays `neutral`.
`variant={plan === "Pro" ? "info" : "neutral"}` in `workspace-switcher.tsx`.

## Sections

### Policies: hide card-title scan-tag badge `5e22442`

Removed the per-card `scanTag` `<Badge>` next to each policy title (e.g. "Input +
Output scan") in `Policies.tsx`. `config.scanTag` data and the `Badge` import are
kept (Badge still backs the action-option DEFAULT badge), so restoring is a
one-line re-add of `<Badge variant="info">{config.scanTag}</Badge>`.
