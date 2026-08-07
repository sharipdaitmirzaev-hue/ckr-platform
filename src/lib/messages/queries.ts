import {
  mapChatMessageRow,
  mapConversationRow,
  type ChatMessage,
  type Conversation,
} from "@/lib/messages/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ChatMessageRow,
  ConversationRow,
} from "@/types/database";

export type ConversationListItem = Conversation & {
  lastMessage: string | null;
  lastMessageAt: string | null;
  peerName: string | null;
  projectTitle: string | null;
};

export type ChatMessageWithSender = ChatMessage & {
  senderName: string | null;
};

export async function listMyConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();

  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);

  if (error || !memberships?.length) return [];

  const ids = memberships.map((m) => m.conversation_id as string);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, projects:project_id ( title )")
    .in("id", ids)
    .order("updated_at", { ascending: false });

  if (!conversations?.length) return [];

  const items: ConversationListItem[] = [];

  for (const row of conversations) {
    const conversation = mapConversationRow(row as ConversationRow);
    const projects = row.projects as
      | { title: string | null }
      | { title: string | null }[]
      | null;
    const project = Array.isArray(projects) ? projects[0] : projects;

    const { data: lastRows } = await supabase
      .from("messages")
      .select("body, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: members } = await supabase
      .from("conversation_members")
      .select("user_id, profiles:user_id ( full_name )")
      .eq("conversation_id", conversation.id);

    const peer = (members ?? []).find((m) => m.user_id !== userId);
    const peerProfiles = peer?.profiles as
      | { full_name: string | null }
      | { full_name: string | null }[]
      | null
      | undefined;
    const peerProfile = Array.isArray(peerProfiles)
      ? peerProfiles[0]
      : peerProfiles;

    items.push({
      ...conversation,
      lastMessage: lastRows?.[0]?.body ?? null,
      lastMessageAt: lastRows?.[0]?.created_at ?? conversation.updatedAt,
      peerName: peerProfile?.full_name ?? null,
      projectTitle: project?.title ?? null,
    });
  }

  return items.sort((a, b) =>
    (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""),
  );
}

export async function getConversationForUser(
  conversationId: string,
  userId: string,
): Promise<Conversation | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapConversationRow(data as ConversationRow);
}

export async function listMessages(
  conversationId: string,
): Promise<ChatMessageWithSender[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles:sender_id ( full_name )")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error || !data) return [];

  return data.map((row) => {
    const message = mapChatMessageRow(row as ChatMessageRow);
    const profiles = row.profiles as
      | { full_name: string | null }
      | { full_name: string | null }[]
      | null;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      ...message,
      senderName: profile?.full_name ?? null,
    };
  });
}
