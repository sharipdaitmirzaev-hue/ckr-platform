import { Badge } from "@/components/ui/badge";
import {
  planTypeLabels,
  subscriptionStatusLabels,
} from "@/config/monetization";
import type { SubscriptionPlanType, SubscriptionStatus } from "@/types";

type SubscriptionBadgeProps = {
  planName?: string | null;
  planType?: SubscriptionPlanType | null;
  status?: SubscriptionStatus | null;
};

export function SubscriptionBadge({
  planName,
  planType,
  status,
}: SubscriptionBadgeProps) {
  if (!planName && !status) {
    return <Badge variant="soft">Без подписки</Badge>;
  }

  const label = [
    planName || (planType ? planTypeLabels[planType] : null),
    status ? subscriptionStatusLabels[status] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Badge variant={status === "active" ? "accent" : "soft"}>{label}</Badge>
  );
}
