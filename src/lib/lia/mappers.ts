import type { LiaMessage, LiaMessageMetadata, LiaMessageRole, LiaSession } from "@/types/lia";

export type LiaSessionRow = {
  id: string;
  user_id: string;
  title: string;
  context_type: string | null;
  context_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LiaMessageRow = {
  id: string;
  session_id: string;
  role: LiaMessageRole;
  content: string;
  metadata: LiaMessageMetadata | null;
  created_at: string;
};

export function mapLiaSessionRow(row: LiaSessionRow): LiaSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contextType: row.context_type,
    contextId: row.context_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLiaMessageRow(row: LiaMessageRow): LiaMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    metadata: (row.metadata as LiaMessageMetadata) || {},
    createdAt: row.created_at,
  };
}
