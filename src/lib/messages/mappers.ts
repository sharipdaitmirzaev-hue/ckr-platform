import type {
  ChatMessageRow,
  ConversationRow,
} from "@/types/database";

export type Conversation = {
  id: string;
  applicationId: string | null;
  projectId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    applicationId: row.application_id,
    projectId: row.project_id,
    title: row.title || "Диалог",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export function mapChatMessageRow(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}
