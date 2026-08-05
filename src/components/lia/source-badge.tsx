import { Badge } from "@/components/ui/badge";

type SourceBadgeProps = {
  source: string;
  external?: boolean;
};

export function SourceBadge({ source, external = true }: SourceBadgeProps) {
  return (
    <Badge variant={external ? "soft" : "accent"} title={`Источник: ${source}`}>
      {external ? `Источник: ${source}` : source}
    </Badge>
  );
}
