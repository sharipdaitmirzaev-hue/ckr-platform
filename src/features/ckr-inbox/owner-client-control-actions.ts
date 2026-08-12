"use server";

import { isCkrRequestStatus } from "@/config/ckr-inbox";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  CLIENT_MESSAGE_MAX_LEN,
  NEXT_STEP_PUBLIC_MAX_LEN,
  OWNER_SCENARIOS,
  PUBLIC_ACTIVITY_MAX_LEN,
  sanitizePublicText,
  type OwnerScenarioId,
} from "@/lib/ckr-inbox/owner-client-control";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type OwnerClientControlState = {
  error?: string;
  success?: string;
  warning?: string;
};

function revalidateOwnerClient(id: string) {
  revalidatePath("/admin/owner");
  revalidatePath("/admin/owner/inbox");
  revalidatePath(`/admin/owner/inbox/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ckr-requests");
  revalidatePath(`/dashboard/ckr-requests/${id}`);
}

async function appendEvent(input: {
  requestId: string;
  eventType: string;
  title: string;
  detail?: string;
  visibility?: "INTERNAL" | "CLIENT";
  actorUserId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const supabase = createClient();
  await supabase.from("ckr_request_events").insert({
    request_id: input.requestId,
    event_type: input.eventType,
    title: input.title,
    detail: input.detail || "",
    visibility: input.visibility || "INTERNAL",
    actor_user_id: input.actorUserId ?? null,
    meta: input.meta || {},
  });
}

async function notifyClientOptional(
  requestId: string,
  body: string,
): Promise<void> {
  const supabase = createClient();
  const { data: req } = await supabase
    .from("ckr_requests")
    .select("from_user_id, subject")
    .eq("id", requestId)
    .maybeSingle();
  if (!req?.from_user_id) return;
  await supabase.rpc("create_notification", {
    p_user_id: req.from_user_id,
    p_type: "ckr_request",
    p_title: "Обновление по обращению",
    p_body: body.slice(0, 200),
    p_link: `/dashboard/ckr-requests/${requestId}`,
    p_related_type: "ckr_request",
    p_related_id: requestId,
  });
}

/** Save CUSTOM / AUTO «Сейчас ЦКР» (public_activity_text). */
export async function updatePublicActivityAction(
  _prev: OwnerClientControlState,
  formData: FormData,
): Promise<OwnerClientControlState> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const mode = String(formData.get("activityMode") ?? "AUTO").trim();
  const raw = String(formData.get("publicActivityText") ?? "");
  if (!id) return { error: "requestId required" };

  let text = "";
  if (mode === "CUSTOM") {
    const cleaned = sanitizePublicText(raw, PUBLIC_ACTIVITY_MAX_LEN);
    if (!cleaned.ok) return { error: cleaned.error };
    text = cleaned.text;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("ckr_requests")
    .update({ public_activity_text: text })
    .eq("id", id);
  if (error) {
    return {
      error:
        error.message.includes("public_activity_text")
          ? "Колонка public_activity_text ещё не применена (миграция Stage 4K)."
          : error.message,
    };
  }

  await appendEvent({
    requestId: id,
    eventType: "PUBLIC_ACTIVITY_UPDATED",
    title: text
      ? "Обновлена публичная активность ЦКР"
      : "Публичная активность: AUTO",
    detail: text || "AUTO (Stage 4J)",
    visibility: "CLIENT",
    actorUserId: staff.user.id,
    meta: { mode: text ? "CUSTOM" : "AUTO", text },
  });

  revalidateOwnerClient(id);
  return {
    success: text
      ? "Сохранено: клиент увидит ваш текст «Сейчас ЦКР»."
      : "Сохранено: AUTO — текст формируется по типу и статусу.",
  };
}

/** Save / clear next_step_public. */
export async function updateNextStepPublicAction(
  _prev: OwnerClientControlState,
  formData: FormData,
): Promise<OwnerClientControlState> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const clear = formData.get("clearNextStep") === "1";
  const setWaiting = formData.get("setWaitingClient") === "on";
  const raw = clear ? "" : String(formData.get("nextStepPublic") ?? "");
  if (!id) return { error: "requestId required" };

  const cleaned = sanitizePublicText(raw, NEXT_STEP_PUBLIC_MAX_LEN);
  if (!cleaned.ok) return { error: cleaned.error };
  const text = cleaned.text;

  const supabase = createClient();
  const { data: prev } = await supabase
    .from("ckr_requests")
    .select("status, next_step_public")
    .eq("id", id)
    .maybeSingle();

  const patch: Record<string, string> = { next_step_public: text };
  let statusChanged = false;
  if (setWaiting && text && prev?.status !== "WAITING_CLIENT") {
    patch.status = "WAITING_CLIENT";
    statusChanged = true;
  }

  const { error } = await supabase.from("ckr_requests").update(patch).eq("id", id);
  if (error) return { error: error.message };

  await appendEvent({
    requestId: id,
    eventType: "NEXT_STEP_UPDATED",
    title: text
      ? "Обновлено: что нужно от клиента"
      : "С клиента ничего не требуется",
    detail: text || "idle",
    visibility: "CLIENT",
    actorUserId: staff.user.id,
    meta: { next_step_public: text, cleared: !text },
  });

  if (statusChanged) {
    await appendEvent({
      requestId: id,
      eventType: "STATUS_CHANGED",
      title: "Статус: WAITING_CLIENT",
      detail: `${prev?.status || "?"} → WAITING_CLIENT`,
      visibility: "CLIENT",
      actorUserId: staff.user.id,
    });
  }

  const warning =
    (patch.status || prev?.status) === "WAITING_CLIENT" && !text
      ? "Вы указали, что ждёте клиента, но не написали, что именно требуется."
      : undefined;

  revalidateOwnerClient(id);
  return {
    success: clear
      ? "С клиента ничего не требуется."
      : "Сохранено: «Что нужно от вас».",
    warning,
  };
}

/** Apply a quick scenario after explicit preview confirmation. */
export async function applyOwnerScenarioAction(
  _prev: OwnerClientControlState,
  formData: FormData,
): Promise<OwnerClientControlState> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const scenarioId = String(formData.get("scenarioId") ?? "").trim() as OwnerScenarioId;
  const confirm = formData.get("confirmScenario") === "on";
  const nextStepOverride = String(formData.get("scenarioNextStep") ?? "").trim();
  const sendClientMessage = formData.get("sendClientMessage") === "on";

  if (!id) return { error: "requestId required" };
  if (!confirm) return { error: "Подтвердите применение сценария." };

  const scenario = OWNER_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return { error: "Неизвестный сценарий." };

  if (scenario.id === "need_info") {
    const step = sanitizePublicText(nextStepOverride, NEXT_STEP_PUBLIC_MAX_LEN);
    if (!step.ok) return { error: step.error };
    if (!step.text) {
      return { error: "Для «Нужна информация» укажите, что нужно от клиента." };
    }
  }

  const supabase = createClient();
  const { data: prev } = await supabase
    .from("ckr_requests")
    .select("status, public_activity_text, next_step_public")
    .eq("id", id)
    .maybeSingle();
  if (!prev) return { error: "Заявка не найдена." };

  const patch: Record<string, string> = {};
  if (scenario.status && isCkrRequestStatus(scenario.status)) {
    patch.status = scenario.status;
  }
  if (scenario.publicActivityText !== undefined) {
    const act = sanitizePublicText(
      scenario.publicActivityText,
      PUBLIC_ACTIVITY_MAX_LEN,
    );
    if (!act.ok) return { error: act.error };
    patch.public_activity_text = act.text;
  }
  if (scenario.id === "need_info") {
    const step = sanitizePublicText(nextStepOverride, NEXT_STEP_PUBLIC_MAX_LEN);
    if (!step.ok) return { error: step.error };
    patch.next_step_public = step.text;
  } else if (scenario.nextStepPublic !== undefined) {
    patch.next_step_public = scenario.nextStepPublic || "";
  }

  if (Object.keys(patch).length) {
    const { error } = await supabase
      .from("ckr_requests")
      .update(patch)
      .eq("id", id);
    if (error) {
      return {
        error:
          error.message.includes("public_activity_text")
            ? "Колонка public_activity_text ещё не применена (миграция Stage 4K)."
            : error.message,
      };
    }
  }

  if (patch.public_activity_text !== undefined) {
    await appendEvent({
      requestId: id,
      eventType: "PUBLIC_ACTIVITY_UPDATED",
      title: "Обновлена публичная активность ЦКР",
      detail: patch.public_activity_text,
      visibility: "CLIENT",
      actorUserId: staff.user.id,
      meta: { scenario: scenarioId },
    });
  }
  if (patch.next_step_public !== undefined) {
    await appendEvent({
      requestId: id,
      eventType: "NEXT_STEP_UPDATED",
      title: "Обновлено: что нужно от клиента",
      detail: patch.next_step_public,
      visibility: "CLIENT",
      actorUserId: staff.user.id,
      meta: { scenario: scenarioId },
    });
  }
  if (patch.status && patch.status !== prev.status) {
    await appendEvent({
      requestId: id,
      eventType: "STATUS_CHANGED",
      title: `Статус: ${patch.status}`,
      detail: `${prev.status} → ${patch.status}`,
      visibility: "CLIENT",
      actorUserId: staff.user.id,
      meta: { scenario: scenarioId },
    });
  }

  if (sendClientMessage && scenario.clientMessage) {
    const msg = sanitizePublicText(
      scenario.clientMessage,
      CLIENT_MESSAGE_MAX_LEN,
    );
    if (!msg.ok) return { error: msg.error };
    const { error: cErr } = await supabase.from("ckr_request_comments").insert({
      request_id: id,
      author_id: staff.user.id,
      body: msg.text,
      visibility: "CLIENT",
    });
    if (cErr) return { error: cErr.message };
    await appendEvent({
      requestId: id,
      eventType: "CLIENT_MESSAGE",
      title: "Сообщение от ЦКР",
      detail: msg.text.slice(0, 200),
      visibility: "CLIENT",
      actorUserId: staff.user.id,
    });
    await notifyClientOptional(id, msg.text);
  }

  revalidateOwnerClient(id);
  return { success: `Сценарий «${scenario.label}» применён.` };
}
