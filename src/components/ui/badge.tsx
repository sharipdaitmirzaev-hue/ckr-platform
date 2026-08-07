import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const variants = {
  default: "border-border text-muted",
  accent: "border-accent/40 text-accent bg-accent-muted",
  soft: "border-transparent bg-foreground/5 text-muted",
} as const;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
