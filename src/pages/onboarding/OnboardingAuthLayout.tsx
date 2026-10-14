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

/** The Onboarding demo's copy of `layouts/AuthLayout.tsx`, the shell for
 *  `/sign-in-onboarding` and `/sign-up-onboarding` (owner 2026-10-12). The
 *  demo never edits a file the main site uses (`.claude/rules/no-thrash.md`),
 *  so the phone fix lives here and `/sign-in` and `/sign-up` keep AuthLayout.
 *
 *  The one difference is below `md`: the dark stage is a viewport-fixed layer
 *  sized to the large viewport (`h-lvh`), and the page flows in the document
 *  (`min-h-svh`, no `h-dvh overflow-hidden`). When the phone keyboard opens,
 *  the user scrolls the card up to reach every field while the background
 *  stays put, and a card taller than the screen scrolls instead of clipping.
 *  Same scroll model as the Gate Chat keyboard fix
 *  (`OnboardingChatLayout.tsx`): the keyboard overlays the page, html and
 *  body overflow are never locked. `md+` renders exactly as AuthLayout. */
export function OnboardingAuthLayout() {
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
    // Below md: document flow, the page scrolls under the keyboard. md+: the
    // AuthLayout frame, unchanged.
    <div
      className="relative min-h-svh md:h-dvh md:min-h-0 md:w-dvw md:overflow-hidden"
      ref={rootRef}
    >
      {/* Below md the stage is pinned to the large viewport, so opening the
          keyboard neither moves nor resizes it, and DotRadar measures one
          stable box. md+: `absolute inset-0`, as in AuthLayout. */}
      <div className="fixed inset-x-0 top-0 grid h-lvh grid-cols-1 md:absolute md:inset-0 md:h-auto md:grid-cols-2">
        <div
          className="relative overflow-hidden bg-auth-panel"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 70% 60% at 85% 20%, var(--auth-glow), transparent 75%)",
              "radial-gradient(ellipse 70% 60% at 15% 80%, var(--auth-glow), transparent 75%)",
            ].join(", "),
            backgroundSize: "100% 100%, 100% 100%",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        >
          <DotRadar />
        </div>
        <div className="hidden bg-muted md:block" />
      </div>

      {/* Below md (owner 2026-10-14): the logo 20px from the top, the
          copyright 16px from the bottom, and 24px at least between each and
          the card, which no longer meets them when it outgrows the screen. */}
      <div className="relative grid min-h-svh grid-cols-1 grid-rows-[auto_1fr_auto] gap-x-4 gap-y-6 px-6 pt-5 pb-4 md:h-full md:min-h-0 md:grid-cols-12 md:gap-y-0 md:px-16 md:py-10">
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
          <h1 className="type-heading-56 text-auth-panel-foreground leading-tight">
            <span data-scramble>Gate</span>{" "}
            <span className="text-auth-accent" data-scramble>
              every
            </span>{" "}
            <span data-scramble>agent call</span>
          </h1>
          {/* design-allow-raw-type: mono display lede at 18/32; no type-mono-18 voice exists. */}
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
                  className="grid size-10 shrink-0 place-items-center rounded-md border border-auth-panel-edge bg-auth-panel-tile text-auth-panel-foreground"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, var(--auth-glow), transparent)",
                  }}
                >
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="type-heading-16 text-auth-panel-foreground">
                    {title}
                  </p>
                  <p className="type-copy-14 text-muted-foreground leading-6">
                    {sub}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <main
          className="row-start-2 flex justify-center self-center md:col-span-6 md:col-start-7"
          data-anim-pop
        >
          <Outlet />
        </main>

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
