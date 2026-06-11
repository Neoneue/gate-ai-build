"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { cn } from "@/lib/utils";

export interface ExternalLinkIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ExternalLinkIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const ARROW_VARIANTS: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: 2,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
      mass: 1,
    },
  },
};

// Hand-built in the lucide-animated template style (the registry has no
// external-link icon). Glyph paths are pixel-exact lucide v1.14.0
// <ExternalLink>; the arrow nudges toward the top-right with the same
// spring as the vendored download/upload icons. The box never moves.
const ExternalLinkIcon = forwardRef<
  ExternalLinkIconHandle,
  ExternalLinkIconProps
>(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Deviation from upstream lucide-animated: animate on hover of the host
  // button/anchor (house pattern), gated by prefers-reduced-motion. Parent
  // refs (imperative handle) still take over when attached.
  useEffect(() => {
    if (isControlledRef.current) {
      return;
    }
    const host = wrapperRef.current?.closest('[role="menuitem"], button, a');
    if (!host) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const enter = () => void controls.start("animate");
    const leave = () => void controls.start("normal");
    host.addEventListener("mouseenter", enter);
    host.addEventListener("mouseleave", leave);
    return () => {
      host.removeEventListener("mouseenter", enter);
      host.removeEventListener("mouseleave", leave);
    };
  }, [controls]);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;

    return {
      startAnimation: () => controls.start("animate"),
      stopAnimation: () => controls.start("normal"),
    };
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        controls.start("animate");
      }
    },
    [controls, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e);
      } else {
        controls.start("normal");
      }
    },
    [controls, onMouseLeave]
  );

  return (
    <div
      className={cn("inline-flex", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={wrapperRef}
      {...props}
    >
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <motion.g animate={controls} variants={ARROW_VARIANTS}>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
        </motion.g>
      </svg>
    </div>
  );
});

ExternalLinkIcon.displayName = "ExternalLinkIcon";

export { ExternalLinkIcon };
