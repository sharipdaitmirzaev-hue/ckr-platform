import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "accent" | "warning" | "danger" | "success";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  className?: string;
};

const toneClass: Record<StatusTone, string> = {
  neutral: "",
  accent: "",
  warning: "border-amber-500/40 text-amber-200 bg-amber-500/10",
  danger: "border-danger/40 text-danger bg-danger-muted",
  success: "border-accent/50 text-accent bg-accent-muted",
};

const toneVariant: Record<
  StatusTone,
  "default" | "accent" | "soft"
> = {
  neutral: "soft",
  accent: "accent",
  warning: "default",
  danger: "default",
  success: "accent",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant={toneVariant[tone]}
      className={cn(toneClass[tone], className)}
    >
      {label}
    </Badge>
  );
}

export function publishStatusTone(
  status: string,
): StatusTone {
  if (status === "published") return "success";
  if (status === "moderation" || status === "pending") return "warning";
  if (status === "archived" || status === "closed" || status === "rejected") {
    return "danger";
  }
  return "neutral";
}

export function verificationStatusTone(
  status: string,
): StatusTone {
  if (status === "verified") return "success";
  if (status === "pending") return "warning";
  return "neutral";
}
