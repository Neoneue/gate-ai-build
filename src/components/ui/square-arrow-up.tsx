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

export interface SquareArrowUpIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SquareArrowUpIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const SQUARE_VARIANTS: Variants = {
  normal: { transition: { duration: 0.4 } },
  animate: { transition: { duration: 0.6, ease: "easeInOut" } },
};

const PATH_VARIANTS: Variants = {
  normal: { d: "m16 12-4-4-4 4", translateY: 0, opacity: 1 },
  animate: {
    d: "m16 12-4-4-4 4",
    translateY: [0, 3, 0],
    transition: { duration: 0.4 },
  },
};

const SECOND_PATH_VARIANTS: Variants = {
  normal: { d: "M12 16V8", opacity: 1 },
  animate: {
    d: ["M12 16V8", "M12 16V13", "M12 16V8"],
    transition: { duration: 0.4 },
  },
};

const SquareArrowUpIcon = forwardRef<
  SquareArrowUpIconHandle,
  SquareArrowUpIconProps
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
        <motion.rect
          animate={controls}
          height="18"
          initial="normal"
          rx="2"
          variants={SQUARE_VARIANTS}
          width="18"
          x="3"
          y="3"
        />
        <motion.path
          animate={controls}
          d="m16 12-4-4-4 4"
          initial="normal"
          variants={PATH_VARIANTS}
        />
        <motion.path
          animate={controls}
          d="M12 16V8"
          initial="normal"
          variants={SECOND_PATH_VARIANTS}
        />
      </svg>
    </div>
  );
});

SquareArrowUpIcon.displayName = "SquareArrowUpIcon";

export { SquareArrowUpIcon };
