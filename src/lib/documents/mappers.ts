import type {
  Document,
  DocumentRelatedType,
  DocumentStatus,
  DocumentType,
  DocumentVisibility,
} from "@/types";
import type { DocumentRow } from "@/types/database";

export function mapDocumentRow(row: DocumentRow): Document {
  return {
    id: row.id,
    ownerId: row.owner_id,
    relatedType: row.related_type as DocumentRelatedType,
    relatedId: row.related_id,
    name: row.name,
    documentType: row.document_type as DocumentType,
    fileUrl: row.file_url,
    visibility: row.visibility as DocumentVisibility,
    status: row.status as DocumentStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
