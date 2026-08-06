"use server";

import {
  isLaunchWaveParticipantStatus,
  isLaunchWaveStatus,
  isLaunchWaveType,
} from "@/config/launch-waves";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type LaunchActionState = {
  error?: string;
  success?: string;
};

function revalidateLaunch() {
  revalidatePath("/admin/launch");
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
  await requireStaff("/admin/launch");
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

  await supabase.from("launch_waves").update({ status }).eq("id", id);
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
