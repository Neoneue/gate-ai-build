import { Coins, ShieldAlert, ShieldCheck } from "lucide-react"

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: "Tamper-evident audit trail",
    sub: "Every prompt, response, and policy decision anchored to Constellation's Digital Evidence layer.",
  },
  {
    Icon: ShieldAlert,
    title: "Guardrails on every call",
    sub: "Prompt injection, PII, and credential leaks caught before the model responds.",
  },
  {
    Icon: Coins,
    title: "Spend you can prove and contain",
    sub: "Per-key budgets and semantic caching cut cost without changing your code.",
  },
] as const

/** Shared shell for /sign-in and /sign-up. Background split + 12-col page
 *  grid + brand mark + hero copy + bullets + trust strip. The `children`
 *  slot renders inside the right-half centered card column. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="bg-neutral-950" />
        <div className="bg-background" />
      </div>

      <div className="relative grid h-full grid-cols-12 grid-rows-[auto_1fr_auto] gap-x-4 px-16 py-10">
        <div className="col-span-5 row-start-1 flex items-center">
          <img
            src="/gate-ai-logo-mono.svg"
            alt="Gate AI"
            className="h-11 w-auto"
          />
        </div>

        <div className="col-span-5 col-start-1 row-start-2 self-center">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white">
            Prove every agent call.
          </h1>
          <p className="mt-4 text-lg/8 text-neutral-400">
            Catch prompt injection and credential leaks, contain runaway
            spend, and prove what your agents actually did. Free to start.
          </p>

          <ul className="mt-12 space-y-4">
            {FEATURES.map(({ Icon, title, sub }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-neutral-900 text-white">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="pt-1">
                  <p className="text-base font-medium text-white">{title}</p>
                  <p className="text-sm/6 text-neutral-400">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-6 col-start-7 row-start-2 flex justify-center self-center">
          {children}
        </div>

        <p className="col-span-5 col-start-1 row-start-3 self-end text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Zero-knowledge verification&nbsp;&nbsp;·&nbsp;&nbsp;SOC 2 trajectory&nbsp;&nbsp;·&nbsp;&nbsp;SSO readiness
        </p>
      </div>
    </div>
  )
}
