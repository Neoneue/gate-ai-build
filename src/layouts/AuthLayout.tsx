import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { SplitText } from "gsap/SplitText";
import { Coins, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import { Outlet } from "react-router-dom";

gsap.registerPlugin(useGSAP, SplitText, ScrambleTextPlugin);

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
    sub: "Every prompt, response, and policy decision cryptographically fingerprinted to Constellation's Digital Evidence layer.",
  },
] as const;

const SPACING = 24;
const BASE_R = 1;
const PEAK_R = 2;
const FALLOFF = 80;
const PULSE_DURATION = 3;
const BASE_MIX_PCT = 5;
const PEAK_MIX_PCT = 25;
const WRITE_EPSILON = 0.005;

/** Horizontal sweep over the auth-page dot grid. Dot grid renders
 *  always; the pulse animation is gated by `(prefers-reduced-motion:
 *  no-preference)` so opt-out users still get the texture but no
 *  continuous motion. Per gsap-react skill, matchMedia integrates with
 *  useGSAP for automatic cleanup. */
function DotRadar() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useGSAP(
    () => {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        return;
      }

      const baselineFill = `color-mix(in oklch, var(--color-neutral-800) ${100 - BASE_MIX_PCT}%, white ${BASE_MIX_PCT}%)`;
      svg.replaceChildren();
      const dots: { style: CSSStyleDeclaration; y: number; lastT: number }[] =
        [];
      const ns = "http://www.w3.org/2000/svg";
      for (let x = 0; x <= w + SPACING; x += SPACING) {
        for (let y = 0; y <= h + SPACING; y += SPACING) {
          const c = document.createElementNS(ns, "circle");
          c.setAttribute("cx", String(x));
          c.setAttribute("cy", String(y));
          c.setAttribute("r", String(BASE_R));
          c.setAttribute("fill", baselineFill);
          c.style.transformBox = "fill-box";
          c.style.transformOrigin = "center";
          svg.appendChild(c);
          dots.push({ style: c.style, y, lastT: 0 });
        }
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const state = { lineY: -FALLOFF };
        const scaleSpan = PEAK_R - BASE_R;
        const mixSpan = PEAK_MIX_PCT - BASE_MIX_PCT;
        gsap.to(state, {
          lineY: h + FALLOFF,
          duration: PULSE_DURATION,
          ease: "none",
          repeat: -1,
          repeatDelay: 1,
          yoyo: true,
          onUpdate: () => {
            const lineY = state.lineY;
            for (let i = 0; i < dots.length; i++) {
              const dot = dots[i];
              const diff = Math.abs(dot.y - lineY);
              const t =
                diff < FALLOFF
                  ? 0.5 * (1 + Math.cos((Math.PI * diff) / FALLOFF))
                  : 0;
              if (Math.abs(t - dot.lastT) < WRITE_EPSILON) {
                continue;
              }
              dot.lastT = t;
              const scale = BASE_R + scaleSpan * t;
              dot.style.transform = `scale(${scale})`;
              const mixPct = BASE_MIX_PCT + mixSpan * t;
              dot.style.fill = `color-mix(in oklch, var(--color-neutral-800) ${100 - mixPct}%, white ${mixPct}%)`;
            }
          },
        });
      });
    },
    { scope: svgRef }
  );

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={svgRef}
    />
  );
}

/** Shared shell for /sign-in and /sign-up. Full-dark stage on mobile
 *  with the card centered; splits 50/50 with the light surface on the
 *  right at md+. Rendered as a React Router parent route so it stays
 *  mounted across the two auth pages — the <Outlet /> swap doesn't
 *  re-fire the entrance animations. */
export function AuthLayout() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Entrance gated by reduced-motion via gsap.matchMedia(). No-preference
  // runs the full hero choreography (y-rise stagger + scale-pop + title
  // scramble); reduce swaps in a single 0.3s autoAlpha fade for the same
  // targets and skips the scramble entirely.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-anim]", {
          autoAlpha: 0,
          y: 16,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
        });
        gsap.from("[data-anim-pop]", {
          autoAlpha: 0,
          scale: 0.94,
          transformOrigin: "center center",
          duration: 0.7,
          ease: "power3.out",
          stagger: { each: 0.16, from: "start" },
        });
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
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from("[data-anim], [data-anim-pop]", {
          autoAlpha: 0,
          duration: 0.3,
          ease: "none",
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <div className="relative h-dvh w-dvw overflow-hidden" ref={rootRef}>
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
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
        <div className="hidden bg-background md:block" />
      </div>

      <div className="relative grid h-full grid-cols-1 grid-rows-[auto_1fr_auto] gap-x-4 px-6 py-8 md:grid-cols-12 md:px-16 md:py-10">
        <div className="row-start-1 flex items-center justify-center md:col-span-5 md:justify-start">
          <img
            alt="Gate AI"
            className="h-11 w-auto"
            data-anim-pop
            height={80}
            src="/gate-ai-logo-light.svg"
            width={226}
          />
        </div>

        <div className="hidden self-center md:col-span-5 md:col-start-1 md:row-start-2 md:block">
          <h1 className="font-medium text-6xl text-white leading-tight tracking-tight">
            <span data-scramble>Gate</span>{" "}
            <span className="text-blue-400" data-scramble>
              every
            </span>{" "}
            <span data-scramble>agent call</span>
          </h1>
          <p
            className="mt-4 font-mono text-lg/8 text-muted-foreground"
            data-anim
          >
            Catch prompt injection and credential leaks, contain runaway spend,
            and prove what your agents actually did. Free to start.
          </p>

          <ul className="mt-12 space-y-6">
            {FEATURES.map(({ Icon, title, sub }) => (
              <li className="flex items-start gap-4" data-anim key={title}>
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-neutral-900 text-white"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)",
                  }}
                >
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="type-heading-16 text-white">{title}</p>
                  <p className="type-copy-14 text-muted-foreground leading-6">
                    {sub}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="row-start-2 flex justify-center self-center md:col-span-6 md:col-start-7"
          data-anim-pop
        >
          <Outlet />
        </div>

        <p
          className="type-label-12 row-start-3 self-end text-center text-muted-foreground uppercase tracking-widest md:col-span-5 md:col-start-1 md:text-left"
          data-anim
        >
          &copy; 2026 Constellation Network
        </p>
      </div>
    </div>
  );
}
