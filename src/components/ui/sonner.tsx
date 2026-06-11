import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Skill: emil-design-eng — no hardcoded hex; route through the
          // theme background var so the toast surface tracks light/dark.
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--color-neutral-900)",
          "--normal-border": "var(--color-neutral-200)",
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      theme="light"
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
