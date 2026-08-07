export const buttonVariants = {
  primary:
    "bg-accent text-background hover:bg-accent/90 focus-visible:ring-accent",
  secondary:
    "bg-surface-elevated text-foreground border border-border hover:border-muted/40 focus-visible:ring-muted",
  ghost:
    "bg-transparent text-foreground hover:bg-foreground/5 focus-visible:ring-muted",
  outline:
    "bg-transparent text-foreground border border-border hover:border-accent/50 hover:text-accent focus-visible:ring-accent",
} as const;

export const buttonSizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45";

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
