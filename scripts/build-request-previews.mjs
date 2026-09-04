#!/usr/bin/env node
/**
 * Generates `src/data/request-previews.ts`: the Messages table's first-line
 * preview per request row, already run through `redactFindings`.
 *
 * Why this exists: the preview is the ONLY thing the Messages and
 * Conversations list pages need from `src/data/request-bodies.ts` (~425 KB of
 * verbatim transcripts). Precomputing it lets `messagePreview()` drop that
 * import, so the transcript chunk is downloaded only by the detail surfaces.
 *
 * Resolution order and masking are NOT duplicated here. The script calls
 * `buildMessagePreview(row, body)` from `src/pages/requests/message-preview.ts`,
 * the same function `message-preview.test.ts` uses to assert the generated
 * file has not drifted from the source data.
 *
 * Run:  npm run build:previews
 * Then: re-run whenever `src/data/requests.ts` or `src/data/request-bodies.ts`
 *       change a row, a body, or a finding. The vitest drift check fails
 *       until you do.
 *
 * Loads TypeScript through vite's SSR module loader so the `@/` alias and
 * extensionless imports resolve exactly as they do in the app.
 */
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src/data/request-previews.ts");

// `message-preview.ts` imports the file this script writes, so a fresh
// checkout without it cannot load the module. Seed an empty map first; the
// real content replaces it below.
if (!existsSync(OUT)) {
  await writeFile(
    OUT,
    "export const REQUEST_PREVIEWS: Record<string, string> = {};\n",
    "utf8"
  );
}

const server = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, "vite.config.ts"),
  logLevel: "error",
  appType: "custom",
  // No browser entry is served; skip the dep pre-bundle scan of index.html.
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, watch: null },
});

try {
  const [
    { REQUEST_ROWS_ALL, requestRowId },
    { getRequestBody },
    { buildMessagePreview },
  ] = await Promise.all([
    server.ssrLoadModule("/src/data/requests.ts"),
    server.ssrLoadModule("/src/data/request-bodies.ts"),
    server.ssrLoadModule("/src/pages/requests/message-preview.ts"),
  ]);

  const entries = [];
  for (const row of REQUEST_ROWS_ALL) {
    const preview = buildMessagePreview(row, getRequestBody(row));
    if (preview !== undefined) {
      entries.push([requestRowId(row), preview]);
    }
  }

  const body = entries
    .map(([id, text]) => `  ${JSON.stringify(id)}: ${JSON.stringify(text)},`)
    .join("\n");

  const source = `/** GENERATED FILE. Do not edit by hand.
 *
 *  Masked first-line previews for the Messages table, one per request row
 *  that resolves to real text, keyed by \`requestRowId(row)\`. Produced from
 *  \`REQUEST_ROWS_ALL\` + \`REQUEST_BODIES\` through \`buildMessagePreview\`
 *  (resolution order + \`redactFindings\`), so the list pages never download
 *  the transcript blob. Rows absent here render the empty-cell dash.
 *
 *  Regenerate:  npm run build:previews
 *  Drift guard: src/pages/requests/message-preview.test.ts
 */
export const REQUEST_PREVIEWS: Record<string, string> = {
${body}
};
`;

  await writeFile(OUT, source, "utf8");
  console.log(
    `wrote ${path.relative(ROOT, OUT)}: ${entries.length}/${REQUEST_ROWS_ALL.length} rows, ${Buffer.byteLength(source)} bytes`
  );
} finally {
  await server.close();
}
