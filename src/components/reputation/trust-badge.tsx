import { Badge } from "@/components/ui/badge";
import {
  trustBadgeDescriptions,
  trustBadgeLabels,
} from "@/config/reputation";
import { cn } from "@/lib/utils";
import type { TrustBadgeKey } from "@/types";

type TrustBadgeProps = {
  badge: TrustBadgeKey;
  className?: string;
};

const accentBadges: TrustBadgeKey[] = ["verified", "trusted_partner", "ckr_expert"];

export function TrustBadge({ badge, className }: TrustBadgeProps) {
  return (
    <Badge
      variant={accentBadges.includes(badge) ? "accent" : "soft"}
      className={cn(className)}
      title={trustBadgeDescriptions[badge]}
    >
      {trustBadgeLabels[badge]}
    </Badge>
  );
}

type TrustBadgesRowProps = {
  badges: TrustBadgeKey[];
  className?: string;
};

export function TrustBadgesRow({ badges, className }: TrustBadgesRowProps) {
  if (badges.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <TrustBadge key={badge} badge={badge} />
      ))}
    </div>
  );
}
