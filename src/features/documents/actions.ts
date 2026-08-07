"use server";

import { DOCUMENTS_BUCKET } from "@/config/verification";
import { assertDocumentRelatedAccess } from "@/lib/documents/assert-related-access";
import { validateUploadFile } from "@/lib/documents/file-validation";
import { uploadDocumentSchema } from "@/lib/documents/validations";
import { logApiError, logSystemEvent } from "@/lib/logging/system-log";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DocumentActionState = {
  error?: string;
  success?: string;
};

function sanitizeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 120);
}

export async function uploadDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const parsed = uploadDocumentSchema.safeParse({
    name: formData.get("name"),
    documentType: formData.get("documentType"),
    relatedType: formData.get("relatedType"),
    relatedId: formData.get("relatedId"),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Выберите файл для загрузки." };
  }

  const fileError = validateUploadFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходимо войти в аккаунт." };
  }

  const access = await assertDocumentRelatedAccess(
    supabase,
    user.id,
    parsed.data.relatedType,
    parsed.data.relatedId,
  );
  if (!access.ok) {
    return { error: access.error };
  }

  const safeName = sanitizeFileName(file.name || "document");
  const storagePath = `${user.id}/${parsed.data.relatedType}/${parsed.data.relatedId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    await logApiError({
      source: "documents.upload",
      message: uploadError.message,
      metadata: { userId: user.id, relatedType: parsed.data.relatedType },
    });
    return { error: "Не удалось загрузить файл. Попробуйте ещё раз." };
  }

  const status =
    parsed.data.visibility === "review" ? "pending" : "uploaded";

  const { error: insertError } = await supabase.from("documents").insert({
    owner_id: user.id,
    related_type: parsed.data.relatedType,
    related_id: parsed.data.relatedId,
    name: parsed.data.name,
    document_type: parsed.data.documentType,
    file_url: storagePath,
    visibility: parsed.data.visibility,
    status,
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    await logApiError({
      source: "documents.upload",
      message: insertError.message,
      metadata: { userId: user.id },
    });
    return { error: "Не удалось сохранить документ." };
  }

  await logSystemEvent({
    source: "documents.upload",
    message: "Document uploaded",
    metadata: {
      userId: user.id,
      relatedType: parsed.data.relatedType,
      relatedId: parsed.data.relatedId,
    },
  });

  if (parsed.data.relatedType === "project") {
    await supabase.from("project_activity").insert({
      project_id: parsed.data.relatedId,
      actor_id: user.id,
      activity_type: "document_uploaded",
      title: "Загружен документ",
      body: parsed.data.name,
      metadata: {
        documentType: parsed.data.documentType,
        visibility: parsed.data.visibility,
      },
    });
  }

  await supabase.rpc("create_notification", {
    p_user_id: user.id,
    p_type: "document",
    p_title: "Документ загружен",
    p_body: parsed.data.name,
    p_link: "/dashboard/documents",
    p_application_id: null,
    p_related_type: "document",
    p_related_id: parsed.data.relatedId,
  });

  const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
  await trackAnalyticsEvent({
    eventType: "document_uploaded",
    userId: user.id,
    entityType: parsed.data.relatedType,
    entityId: parsed.data.relatedId,
    metadata: { documentType: parsed.data.documentType },
  });

  revalidatePath("/dashboard/documents");
  revalidatePath("/admin/verifications");
  if (parsed.data.relatedType === "project") {
    revalidatePath(
      `/dashboard/projects/${parsed.data.relatedId}/workspace`,
    );
  }
  return { success: "Документ загружен." };
}

export async function deleteDocumentAction(
  formData: FormData,
): Promise<void> {
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (!document || document.owner_id !== user.id) return;

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.file_url]);
  await supabase.from("documents").delete().eq("id", documentId);

  revalidatePath("/dashboard/documents");
  revalidatePath("/admin/verifications");
}
