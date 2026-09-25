# UI Changelog: 2026-09-25

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-24.md`](./changelog-9-24.md)

---

## Sections & surfaces

### Messages: Device name column and filter, columns reordered (`pages/requests/RequestsTable.tsx`) · [911a926]

The Recent messages table on `/messages` gains a Device name column and
filter, and two columns move.

- **Column order, before:** Time, Status, Security, Model, Message,
  Conversation, Key, Tokens In/Out, Latency, Cost. **After:** Time, Status,
  Security, Key, Device name, Message, Conversation, Model, Tokens In/Out,
  Latency, Cost. Key moves before Message; Model moves after Conversation.
- **Device name column:** new, sortable, after Key. Cell styling copies the
  Activity page's Device name column (`type-copy-14 block max-w-[20ch]
  truncate`). The device resolves from `API_KEY_ROWS` (`activity-data.ts`)
  through a module-level `DEVICE_BY_KEY` map, so both pages agree. A miss
  renders a dash plus sr-only "No device recorded".
- **Widths:** Device name takes 8% (header-bound, about 123px needed of
  126px). Table floor `min-w-[1484px]` to `min-w-[1612px]`; other columns
  keep their pixel widths.
- **Filters modal:** new Device name select (distinct devices on the
  scope-filtered rows, sorted, plus "All devices"), wired through draft,
  apply, reset and the active count. Field order is now Key, Device name,
  Model, Response, Guardrail.
