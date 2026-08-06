# Rule: token-efficient reads — never load capture data whole

The mock data embeds real captured session transcripts. Two files carry
multi-hundred-KB string blobs that will flood your context if read or
grepped naively. The split exists precisely so you never have to load them.

## The heavy files

| File | What it is | How to treat it |
| --- | --- | --- |
| `src/data/request-bodies.ts` | ~450 KB of verbatim message bodies (`REQUEST_BODIES`, keyed by `requestRowId`). Marked "do not edit". | Never Read whole. Never needs editing for row/label/finding work — it is looked up at runtime via `getRequestBody(row)`. |
| `src/data/requests.ts` | Row metadata + findings. Still contains the `SHARED_TRANSCRIPT_*` consts and long `evidence:` strings. | Read the API region (helpers/types, top ~550 lines) with offset/limit; the row arrays below are data. |

## Working rules

- **Grep with exclusions.** Sweeps across `src` must exclude the blob file:
  `grep -rn <pat> src --exclude=request-bodies.ts`, and pipe through
  `awk 'length($0)<300'` when touching `src/data/requests.ts` so a match
  inside a transcript string cannot dump a 250 KB line into context.
- **Questions about blob content** (what a transcript says, counts, field
  stats) → run code over the file (`ctx_execute_file` / a node one-liner
  printing only the answer), never a Read.
- **Scoped reads over monolith reads.** The Messages page is modular
  (`src/pages/requests/`: `range-store` 49 · `types` 117 · `data` 206 ·
  `HeroMetric` 234 · `hero-data` 357 · `RequestsTable` 754 ·
  `RequestDetailBody` ~1860 lines). Read the module the task names, not
  the set. Same idea everywhere: prefer Grep → offset/limit Read of the
  matched region over whole-file reads for anything >500 lines.
- **Authoring rule.** New heavy message bodies go in `request-bodies.ts`
  (or reference a `SHARED_TRANSCRIPT_*` const) — never inline on a row.
