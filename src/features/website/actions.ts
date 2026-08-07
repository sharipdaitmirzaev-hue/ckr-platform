"use server";

import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { createClient } from "@/lib/supabase/server";

export type ContactActionState = {
  error?: string;
  success?: string;
};

export async function submitContactFormAction(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) {
    return { error: "Укажите имя (от 2 символов)." };
  }
  if (!email.includes("@") || email.length < 5) {
    return { error: "Укажите корректный email." };
  }
  if (message.length < 10) {
    return { error: "Опишите обращение подробнее (от 10 символов)." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await trackAnalyticsEvent({
    eventType: "contact_started",
    userId: user?.id ?? null,
    entityType: "page",
    entityId: null,
    metadata: {
      path: "/contacts",
      topic: topic || null,
      channel: "ckr_website",
    },
  });

  const composed = [
    `[Контакты ЦКР]`,
    `Имя: ${name}`,
    `Email: ${email}`,
    topic ? `Тема: ${topic}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    type: "idea",
    message: composed,
    page: "/contacts",
    related_type: "contact",
    related_id: null,
    priority: "medium",
    category: "website_contact",
  });

  if (error) {
    return {
      error:
        error.code === "42P01"
          ? "Форма временно недоступна. Напишите на hello@ckr.platform."
          : error.message,
    };
  }

  await trackAnalyticsEvent({
    eventType: "feedback_sent",
    userId: user?.id ?? null,
    entityType: "page",
    entityId: null,
    metadata: { path: "/contacts", channel: "ckr_website" },
  });

  return {
    success: "Обращение отправлено. Команда ЦКР ответит на указанный email.",
  };
}
