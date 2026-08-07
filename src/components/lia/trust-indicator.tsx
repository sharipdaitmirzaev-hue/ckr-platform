import { Badge } from "@/components/ui/badge";

type TrustIndicatorProps = {
  trustScore: number;
  trusted?: boolean;
};

export function TrustIndicator({
  trustScore,
  trusted = false,
}: TrustIndicatorProps) {
  const percent = Math.round(Math.min(1, Math.max(0, trustScore)) * 100);

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Badge variant="default">Trust {percent}%</Badge>
      <Badge variant={trusted ? "accent" : "soft"}>
        {trusted ? "Проверено ЦКР" : "Не подтверждено"}
      </Badge>
    </span>
  );
}
