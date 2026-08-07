import type {
  ProductImprovementPriority,
  ProductImprovementSource,
  ProductImprovementStatus,
} from "@/config/improvements";
import type { ProductImprovement } from "@/types";
import type { ProductImprovementRow } from "@/types/database";

export function mapProductImprovementRow(
  row: ProductImprovementRow,
): ProductImprovement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sourceType: row.source_type as ProductImprovementSource,
    sourceId: row.source_id,
    priority: row.priority as ProductImprovementPriority,
    status: row.status as ProductImprovementStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
