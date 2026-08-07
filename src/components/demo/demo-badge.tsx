import { Badge } from "@/components/ui/badge";
import { isDemoEntityId } from "@/config/first-users";

type Props = {
  entityId?: string | null;
  /** Принудительно показать бейдж (например, весь каталог из fallback). */
  force?: boolean;
};

/** Пометка демонстрационных объектов без реальных ПДн. */
export function DemoBadge({ entityId, force = false }: Props) {
  if (!force && !isDemoEntityId(entityId)) return null;
  return <Badge variant="soft">Демонстрационный</Badge>;
}
