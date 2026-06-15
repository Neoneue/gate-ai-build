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

export interface CreditCardIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CreditCardIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const CARD_VARIANTS: Variants = {
  normal: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 18,
    },
  },
  animate: {
    x: [0, -2, 1, 0],
    transition: {
      duration: 0.7,
      times: [0, 0.4, 0.75, 1],
      ease: "easeInOut",
    },
  },
};

const CreditCardIcon = forwardRef<CreditCardIconHandle, CreditCardIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
          className="overflow-visible"
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
          <motion.g
            animate={controls}
            initial="normal"
            variants={CARD_VARIANTS}
          >
            <rect height="14" rx="2" width="20" x="2" y="5" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </motion.g>
        </svg>
      </div>
    );
  }
);

CreditCardIcon.displayName = "CreditCardIcon";

export { CreditCardIcon };
