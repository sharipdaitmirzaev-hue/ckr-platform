"use server";

import {
  FEEDBACK_TYPES,
  USER_FEEDBACK_EVENT_TYPES,
  generateInviteCode,
  isBetaInviteRole,
  type FeedbackType,
  type UserFeedbackEventType,
} from "@/config/beta";
import { requireAdmin } from "@/lib/auth/require-admin";
import { trackUserFeedbackEvent } from "@/lib/beta/track-feedback-event";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BetaActionState = {
  error?: string;
  success?: string;
  code?: string;
};

export type BetaClientResult =
  | { ok: true }
  | { ok: false; error: string };

function revalidateInvites() {
  revalidatePath("/admin/invites");
}

export async function createBetaInviteAction(
  _prev: BetaActionState,
  formData: FormData,
): Promise<BetaActionState> {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const roleRaw = String(formData.get("role") ?? "entrepreneur");
  const markSent = formData.get("markSent") === "on";

  if (!email || !email.includes("@")) {
    return { error: "Укажите корректный email." };
  }
  if (!isBetaInviteRole(roleRaw)) {
    return { error: "Некорректная роль приглашения." };
  }

  const code = generateInviteCode();
  const supabase = createClient();
  const { error } = await supabase.from("beta_invites").insert({
    email,
    code,
    role: roleRaw,
    status: markSent ? "sent" : "created",
    created_by: admin.user.id,
  });

  if (error) return { error: error.message };

  revalidateInvites();
  return {
    success: `Приглашение создано${markSent ? " и отмечено как отправленное" : ""}.`,
    code,
  };
}

export async function markInviteSentAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const inviteId = String(formData.get("inviteId") ?? "");
  if (!inviteId) return;

  const supabase = createClient();
  await supabase
    .from("beta_invites")
    .update({ status: "sent" })
    .eq("id", inviteId)
    .in("status", ["created"]);

  revalidateInvites();
}

export async function expireInviteAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const inviteId = String(formData.get("inviteId") ?? "");
  if (!inviteId) return;

  const supabase = createClient();
  await supabase
    .from("beta_invites")
    .update({ status: "expired" })
    .eq("id", inviteId)
    .in("status", ["created", "sent"]);

  revalidateInvites();
}

export async function submitFeedbackAction(input: {
  type: FeedbackType;
  message: string;
  rating?: number | null;
  page?: string;
}): Promise<BetaClientResult> {
  const type = input.type;
  const message = input.message.trim();
  const page = (input.page ?? "").trim();
  const rating =
    input.rating === undefined || input.rating === null
      ? null
      : Number(input.rating);

  if (!FEEDBACK_TYPES.includes(type)) {
    return { ok: false, error: "Некорректный тип обратной связи." };
  }
  if (message.length < 5) {
    return { ok: false, error: "Опишите сообщение подробнее (от 5 символов)." };
  }
  if (
    rating !== null &&
    (!Number.isFinite(rating) || rating < 1 || rating > 5)
  ) {
    return { ok: false, error: "Оценка должна быть от 1 до 5." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    type,
    message,
    rating,
    page: page || "/",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitScenarioRatingAction(input: {
  eventType: string;
  rating: number;
  page?: string;
  entityType?: string | null;
  entityId?: string | null;
  comment?: string;
}): Promise<BetaClientResult> {
  const eventType = input.eventType as UserFeedbackEventType;
  const rating = Number(input.rating);
  const comment = (input.comment ?? "").trim();

  if (!USER_FEEDBACK_EVENT_TYPES.includes(eventType)) {
    return { ok: false, error: "Неизвестный тип события." };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Выберите оценку от 1 до 5." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Войдите, чтобы оценить сценарий." };

  await trackUserFeedbackEvent({
    eventType,
    userId: user.id,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    rating,
    comment:
      comment ||
      (input.page ? `Оценка сценария на ${input.page}` : "Оценка сценария"),
  });

  return { ok: true };
}
