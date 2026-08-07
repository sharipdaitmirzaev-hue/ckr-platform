"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MessageActionState = {
  error?: string;
  success?: boolean;
};

export async function sendMessageAction(
  conversationId: string,
  formData: FormData,
): Promise<MessageActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Войдите в аккаунт." };

  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Введите сообщение." };
  if (body.length > 4000) {
    return { error: "Сообщение слишком длинное." };
  }

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { error: "Нет доступа к диалогу." };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) return { error: error.message };

  revalidatePath("/messages");
  revalidatePath(`/messages`);
  return { success: true };
}
