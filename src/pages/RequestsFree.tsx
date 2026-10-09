import { Requests } from "@/pages/Requests";

/** Free-tier twin of Requests. Verbatim Pro page for now; diverge here.
 *  `clamp`: the `/messages-free/clamp` preview (owner 2026-10-08), the
 *  retention statement during a downgrade's 3-day grace. */
export function RequestsFree({ clamp = false }: { clamp?: boolean }) {
  return <Requests retentionClampPreview={clamp} />;
}
