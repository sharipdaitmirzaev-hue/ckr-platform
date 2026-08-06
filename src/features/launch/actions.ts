"use server";

import { isLaunchDecision } from "@/config/launch-decision";
import {
  isLaunchGoalMetricType,
  isLaunchGoalStatus,
} from "@/config/launch-goals";
import {
  isLaunchWaveParticipantStatus,
  isLaunchWaveStatus,
  isLaunchWaveType,
} from "@/config/launch-waves";
import { isPublicLaunchDecision } from "@/config/public-launch-decision";
import {
  PUBLIC_LAUNCH_WAVE_ID,
  PUBLIC_LAUNCH_WAVE_NAME,
} from "@/config/public-launch";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";
import { requireStaff } from "@/lib/auth/require-staff";
import { emitLaunchGoalEvent } from "@/lib/launch/events";
import { evaluateWaveCompletion } from "@/lib/launch/goals";
import { createClient } from "@/lib/supabase/server";
import type { LaunchWaveRow } from "@/types/database";
import { revalidatePath } from "next/cache";

export type LaunchActionState = {
  error?: string;
  success?: string;
};

function revalidateLaunch() {
  revalidatePath("/admin/launch");
  revalidatePath("/admin/launch-decision");
  revalidatePath("/admin/wave-review");
  revalidatePath("/admin/public-launch-decision");
  revalidatePath("/admin/public-launch");
  revalidatePath("/admin/public-launch-kpi");
  revalidatePath("/admin/open-beta");
}

export async function createLaunchWaveAction(
  _prev: LaunchActionState,
  formData: FormData,
): Promise<LaunchActionState> {
  await requireStaff("/admin/launch");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "planned");
  const waveType = String(formData.get("waveType") ?? "closed");
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  if (name.length < 3) {
    return { error: "Укажите название волны (от 3 символов)." };
  }
  if (!isLaunchWaveStatus(status)) {
    return { error: "Некорректный статус волны." };
  }
  if (!isLaunchWaveType(waveType)) {
    return { error: "Некорректный тип волны." };
  }

  const supabase = createClient();

  if (status === "active") {
    await supabase
      .from("launch_waves")
      .update({ status: "planned" })
      .eq("status", "active");
  }

  const { error } = await supabase.from("launch_waves").insert({
    name,
    description,
    status,
    wave_type: waveType,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) return { error: error.message };

  revalidateLaunch();
  return { success: "Волна создана." };
}

export async function updateLaunchWaveStatusAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff("/admin/launch");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isLaunchWaveStatus(status)) return;

  const supabase = createClient();

  if (status === "active") {
    await supabase
      .from("launch_waves")
      .update({ status: "planned" })
      .eq("status", "active")
      .neq("id", id);
  }

  const { data: wave } = await supabase
    .from("launch_waves")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (status === "completed" && wave) {
    await evaluateWaveCompletion(wave as LaunchWaveRow, staff.user.id);
  }

  revalidateLaunch();
}

export async function addLaunchWaveParticipantAction(
  _prev: LaunchActionState,
  formData: FormData,
): Promise<LaunchActionState> {
  await requireStaff("/admin/launch");
  const waveId = String(formData.get("waveId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "invited");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!waveId) return { error: "Укажите волну." };
  if (!isLaunchWaveParticipantStatus(status)) {
    return { error: "Некорректный статус участника." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("launch_wave_participants").insert({
    wave_id: waveId,
    user_id: userId,
    status,
    notes,
  });

  if (error) return { error: error.message };

  revalidateLaunch();
  return { success: "Участник добавлен в волну." };
}

export async function updateLaunchWaveParticipantStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/launch");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isLaunchWaveParticipantStatus(status)) return;

  const supabase = createClient();
  await supabase
    .from("launch_wave_participants")
    .update({ status })
    .eq("id", id);

  revalidateLaunch();
}

export async function createLaunchGoalAction(
  _prev: LaunchActionState,
  formData: FormData,
): Promise<LaunchActionState> {
  const staff = await requireStaff("/admin/launch");
  const waveId = String(formData.get("waveId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const metricType = String(formData.get("metricType") ?? "users");
  const targetRaw = String(formData.get("targetValue") ?? "0");
  const targetValue = Number(targetRaw);

  if (!waveId) return { error: "Укажите волну." };
  if (title.length < 3) {
    return { error: "Укажите название цели (от 3 символов)." };
  }
  if (!isLaunchGoalMetricType(metricType)) {
    return { error: "Некорректный тип метрики." };
  }
  if (!Number.isFinite(targetValue) || targetValue < 0) {
    return { error: "Укажите корректный target_value." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("launch_goals")
    .insert({
      wave_id: waveId,
      title,
      description,
      metric_type: metricType,
      target_value: targetValue,
      current_value: 0,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  await emitLaunchGoalEvent({
    eventType: "launch_goal_created",
    userId: staff.user.id,
    entityId: (data?.id as string) ?? null,
    title: `Цель создана: ${title}`,
    body: `${title} · target ${targetValue} (${metricType})`,
    metadata: { waveId, metricType, targetValue },
  });

  revalidateLaunch();
  return { success: "Цель добавлена." };
}

export async function updateLaunchGoalStatusAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff("/admin/launch");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isLaunchGoalStatus(status)) return;

  const supabase = createClient();
  const { data: prev } = await supabase
    .from("launch_goals")
    .select("id, title, status, current_value, target_value")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("launch_goals")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (prev && prev.status !== status) {
    if (status === "achieved") {
      await emitLaunchGoalEvent({
        eventType: "launch_goal_achieved",
        userId: staff.user.id,
        entityId: id,
        title: `Цель достигнута: ${prev.title}`,
        body: `${prev.title}: ${prev.current_value} / ${prev.target_value}`,
      });
    } else if (status === "failed") {
      await emitLaunchGoalEvent({
        eventType: "launch_goal_failed",
        userId: staff.user.id,
        entityId: id,
        title: `Цель не достигнута: ${prev.title}`,
        body: `${prev.title}: ${prev.current_value} / ${prev.target_value}`,
      });
    }
  }

  revalidateLaunch();
}

export async function syncLaunchGoalsAction(): Promise<void> {
  const staff = await requireStaff("/admin/launch");
  const { getActiveLaunchWave } = await import("@/lib/launch/waves");
  const { syncLaunchGoalsForWave } = await import("@/lib/launch/goals");
  const wave = await getActiveLaunchWave();
  if (wave) {
    await syncLaunchGoalsForWave(wave, staff.user.id);
  }
  revalidateLaunch();
}

export async function recordLaunchDecisionAction(
  _prev: LaunchActionState,
  formData: FormData,
): Promise<LaunchActionState> {
  const staff = await requireStaff("/admin/launch-decision");
  const decision = String(formData.get("decision") ?? "").trim();
  const waveId = String(formData.get("waveId") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isLaunchDecision(decision)) {
    return { error: "Некорректное решение Decision Gate." };
  }
  if (decision === "needs_improvement") {
    return {
      error:
        "needs_improvement фиксируется через улучшения; выберите continue_closed, expand_beta или public_launch_ready.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("launch_decisions").insert({
    wave_id: waveId,
    decision,
    notes,
    created_by: staff.user.id,
  });

  if (error) return { error: error.message };

  revalidateLaunch();
  return { success: "Решение Decision Gate зафиксировано." };
}

export async function recordPublicLaunchDecisionAction(
  _prev: LaunchActionState,
  formData: FormData,
): Promise<LaunchActionState> {
  const staff = await requireStaff("/admin/public-launch-decision");
  const decision = String(formData.get("decision") ?? "").trim();
  const waveId = String(formData.get("waveId") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isPublicLaunchDecision(decision)) {
    return { error: "Некорректное решение Public Launch Decision Gate." };
  }
  if (notes.length < 3) {
    return { error: "Укажите комментарий к решению (от 3 символов)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("public_launch_decisions").insert({
    wave_id: waveId,
    decision,
    notes,
    created_by: staff.user.id,
  });

  if (error) {
    return {
      error:
        error.message.includes("public_launch_decisions") ||
        error.code === "42P01"
          ? "Примените миграцию 20260325520000_public_launch_decision.sql"
          : error.message,
    };
  }

  revalidateLaunch();
  return {
    success: "Решение Public Launch Decision Gate зафиксировано.",
  };
}

/**
 * Активирует Public Launch Wave 1 только если последнее решение = public_launch.
 * planned → active; Open Beta Wave → completed.
 */
export async function activatePublicLaunchWaveAction(
  _prev: LaunchActionState,
  _formData: FormData,
): Promise<LaunchActionState> {
  const staff = await requireStaff("/admin/public-launch");
  const supabase = createClient();

  const { data: decisionRow, error: decisionError } = await supabase
    .from("public_launch_decisions")
    .select("decision, id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (decisionError) {
    return {
      error:
        decisionError.message.includes("public_launch_decisions") ||
        decisionError.code === "42P01"
          ? "Примените миграцию public_launch_decisions."
          : decisionError.message,
    };
  }

  if (!decisionRow || decisionRow.decision !== "public_launch") {
    if (!decisionRow) {
      return {
        error:
          "Нет зафиксированного решения. Сначала Decision Gate → public_launch.",
      };
    }
    if (decisionRow.decision === "continue_beta") {
      return {
        error:
          "Решение continue_beta — продолжайте beta-сценарий, запуск не активируется.",
      };
    }
    return {
      error:
        "Решение improve_product — остановите запуск и работайте над улучшениями.",
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  // Завершить Open Beta Wave, если активна
  await supabase
    .from("launch_waves")
    .update({
      status: "completed",
      end_date: today,
    })
    .eq("id", LAUNCH_WAVE_IDS.openBeta)
    .eq("status", "active");

  // Любые другие active → planned
  await supabase
    .from("launch_waves")
    .update({ status: "planned" })
    .eq("status", "active")
    .neq("id", PUBLIC_LAUNCH_WAVE_ID);

  const { data: wave, error: waveError } = await supabase
    .from("launch_waves")
    .update({
      status: "active",
      start_date: today,
      wave_type: "public",
      name: PUBLIC_LAUNCH_WAVE_NAME,
    })
    .eq("id", PUBLIC_LAUNCH_WAVE_ID)
    .select("*")
    .maybeSingle();

  if (waveError) {
    return {
      error:
        waveError.message.includes("launch_waves") || waveError.code === "42P01"
          ? "Примените миграцию 20260325530000_public_launch_wave.sql"
          : waveError.message,
    };
  }

  if (!wave) {
    return {
      error:
        "Волна Public Launch Wave 1 не найдена. Примените миграцию public_launch_wave.",
    };
  }

  // Привязать последнее решение к волне
  await supabase
    .from("public_launch_decisions")
    .update({ wave_id: PUBLIC_LAUNCH_WAVE_ID })
    .eq("id", decisionRow.id);

  try {
    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    await trackAnalyticsEvent({
      eventType: "launch_goal_created",
      userId: staff.user.id,
      entityType: "launch_wave",
      entityId: PUBLIC_LAUNCH_WAVE_ID,
      metadata: {
        wave: PUBLIC_LAUNCH_WAVE_NAME,
        decision: "public_launch",
        source: "public_launch_activation",
        channel: "public_launch",
      },
    });
  } catch {
    // мягкий сбой
  }

  revalidateLaunch();
  return {
    success: `${PUBLIC_LAUNCH_WAVE_NAME} активирована (planned → active).`,
  };
}
