import { Badge } from "@/components/ui/badge";
import { verificationStatusLabels } from "@/config/verification";
import type { VerificationStatus } from "@/types";
import { cn } from "@/lib/utils";

type VerificationBadgeProps = {
  status?: VerificationStatus | null;
  className?: string;
};

const variants: Record<
  VerificationStatus,
  "default" | "accent" | "soft"
> = {
  unverified: "soft",
  pending: "default",
  verified: "accent",
};

export function VerificationBadge({
  status = "unverified",
  className,
}: VerificationBadgeProps) {
  const value = status ?? "unverified";

  return (
    <Badge
      variant={variants[value]}
      className={cn(
        value === "verified" && "border-accent/50",
        className,
      )}
      title="Статус проверки ЦКР"
    >
      {verificationStatusLabels[value]}
    </Badge>
  );
}
