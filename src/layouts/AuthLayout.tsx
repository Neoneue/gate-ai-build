import { useRef } from "react"
import { Outlet } from "react-router-dom"
import { Coins, ShieldAlert, ShieldCheck } from "lucide-react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { SplitText } from "gsap/SplitText"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"

gsap.registerPlugin(useGSAP, SplitText, ScrambleTextPlugin)

const FEATURES = [
  {
    Icon: ShieldAlert,
    title: "Prompt injection blocked, secrets redacted",
    sub: "Every call scanned for injection attempts. PII and credentials redacted before they reach the model.",
  },
  {
    Icon: Coins,
    title: "Token savings, no code changes",
    sub: "Compression trims input tokens before they hit the model. Per-key budgets cap runaway spend.",
  },
  {
    Icon: ShieldCheck,
    title: "Tamper-evident audit trail",
    sub: "Every prompt, response, and policy decision cryptographically anchored to Constellation's Digital Evidence layer.",
  },
] as const

const SPACING = 24
const BASE_R = 1
const PEAK_R = 2
const FALLOFF = 64
const PULSE_DURATION = 4
const BASE_MIX_PCT = 5
const PEAK_MIX_PCT = 25
const WRITE_EPSILON = 0.005

/** Horizontal sweep over the auth-page dot grid. A virtual scan line
 *  travels top to bottom on a fixed-rate loop. Per frame each dot's
 *  scale + fill are recomputed via a raised-cosine falloff around the
 *  line Y; dots inside the band scale toward 2× and brighten, then
 *  snap back outside. */
function DotRadar() {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useGSAP(
    () => {
      const svg = svgRef.current
      if (!svg) return

      const rect = svg.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (w === 0 || h === 0) return

      const baselineFill = `color-mix(in oklch, var(--color-neutral-800) ${100 - BASE_MIX_PCT}%, white ${BASE_MIX_PCT}%)`

      svg.replaceChildren()
      const dots: { style: CSSStyleDeclaration; y: number; lastT: number }[] = []
      const ns = "http://www.w3.org/2000/svg"
      for (let x = 0; x <= w + SPACING; x += SPACING) {
        for (let y = 0; y <= h + SPACING; y += SPACING) {
          const c = document.createElementNS(ns, "circle")
          c.setAttribute("cx", String(x))
          c.setAttribute("cy", String(y))
          c.setAttribute("r", String(BASE_R))
          c.setAttribute("fill", baselineFill)
          // transform-box: fill-box pins the transform origin to each
          // circle's own bounding box so scale() grows around (cx,cy)
          // instead of the SVG root. Compositor-only update path.
          c.style.transformBox = "fill-box"
          c.style.transformOrigin = "center"
          svg.appendChild(c)
          dots.push({ style: c.style, y, lastT: 0 })
        }
      }

      const state = { lineY: -FALLOFF }
      const scaleSpan = PEAK_R - BASE_R
      const mixSpan = PEAK_MIX_PCT - BASE_MIX_PCT
      gsap.to(state, {
        lineY: h + FALLOFF,
        duration: PULSE_DURATION,
        ease: "none",
        repeat: -1,
        repeatDelay: 1,
        yoyo: true,
        // Per gsap-performance: skip writes for dots whose falloff value
        // hasn't materially changed since the previous frame. Horizontal
        // sweep means only dots within ±FALLOFF of the current line Y
        // are active each frame.
        onUpdate: () => {
          const lineY = state.lineY
          for (let i = 0; i < dots.length; i++) {
            const dot = dots[i]
            const diff = Math.abs(dot.y - lineY)
            const t = diff < FALLOFF ? 0.5 * (1 + Math.cos((Math.PI * diff) / FALLOFF)) : 0
            if (Math.abs(t - dot.lastT) < WRITE_EPSILON) continue
            dot.lastT = t
            const scale = BASE_R + scaleSpan * t
            dot.style.transform = `scale(${scale})`
            const mixPct = BASE_MIX_PCT + mixSpan * t
            dot.style.fill = `color-mix(in oklch, var(--color-neutral-800) ${100 - mixPct}%, white ${mixPct}%)`
          }
        },
      })
    },
    { scope: svgRef },
  )

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}

/** Shared shell for /sign-in and /sign-up. Background split + 12-col page
 *  grid + brand mark + hero copy + bullets + trust strip. Rendered as a
 *  React Router parent route so it stays mounted across the two auth
 *  pages — switching between sign-in and sign-up swaps the <Outlet />
 *  contents without replaying the entrance animations. */
export function AuthLayout() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Staggered entrance for tagged elements on mount. useGSAP runs inside
  // a layout effect so gsap.from() zeroes opacity before paint — no flash.
  // Scope confines the [data-anim] selector to this subtree per the
  // gsap-react skill.
  useGSAP(
    () => {
      gsap.from("[data-anim]", {
        autoAlpha: 0,
        y: 16,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      })
      gsap.from("[data-anim-pop]", {
        autoAlpha: 0,
        scale: 0.94,
        transformOrigin: "center center",
        duration: 0.7,
        ease: "power3.out",
        stagger: { each: 0.16, from: "start" },
      })
      // Per gsap-plugins skill: ScrambleTextPlugin scrambles each
      // element's chars through `chars` then progressively reveals the
      // real text. `text: "{original}"` is the special token that means
      // "scramble to whatever this element already contains." Staggered
      // across the three title segments so the line decodes left-to-right.
      gsap.to("[data-scramble]", {
        duration: 1.0,
        scrambleText: {
          text: "{original}",
          chars: "!<>-_/[]{}=+*^?#",
          revealDelay: 0.2,
          speed: 0.6,
        },
        ease: "none",
        stagger: 0.15,
      })
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-2">
        <div
          className="relative overflow-hidden bg-neutral-950"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 70% 60% at 85% 20%, rgba(255,255,255,0.05), transparent 75%)",
              "radial-gradient(ellipse 70% 60% at 15% 80%, rgba(255,255,255,0.05), transparent 75%)",
            ].join(", "),
            backgroundSize: "100% 100%, 100% 100%",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        >
          <DotRadar />
        </div>
        <div className="bg-background" />
      </div>

      <div className="relative grid h-full grid-cols-12 grid-rows-[auto_1fr_auto] gap-x-4 px-16 py-10">
        <div className="col-span-5 row-start-1 flex items-center">
          <img
            data-anim-pop
            src="/gate-ai-logo-light.svg"
            alt="Gate AI"
            className="h-11 w-auto"
          />
        </div>

        <div className="col-span-5 col-start-1 row-start-2 self-center">
          <h1 className="text-5xl font-medium leading-tight tracking-tight text-white">
            <span data-scramble>Gate</span>{" "}
            <span data-scramble className="text-blue-400">every</span>{" "}
            <span data-scramble>agent call.</span>
          </h1>
          <p data-anim className="mt-4 font-mono text-lg/8 text-neutral-400">
            Catch prompt injection and credential leaks, contain runaway
            spend, and prove what your agents actually did. Free to start.
          </p>

          <ul className="mt-12 space-y-6">
            {FEATURES.map(({ Icon, title, sub }) => (
              <li key={title} data-anim className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-neutral-900 text-white" style={{ backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)" }}>
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-base font-medium text-white">{title}</p>
                  <p className="text-sm/6 text-neutral-400">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div data-anim-pop className="col-span-6 col-start-7 row-start-2 flex justify-center self-center">
          <Outlet />
        </div>

        <p data-anim className="col-span-5 col-start-1 row-start-3 self-end text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          &copy; 2026 Constellation Network
        </p>
      </div>
    </div>
  )
}
