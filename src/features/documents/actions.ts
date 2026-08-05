"use server";

import { DOCUMENTS_BUCKET } from "@/config/verification";
import { uploadDocumentSchema } from "@/lib/documents/validations";
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
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл для загрузки." };
  }

  if (file.size > 20 * 1024 * 1024) {
    return { error: "Максимальный размер файла — 20 МБ." };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходимо войти в аккаунт." };
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
    return { error: uploadError.message };
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
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/documents");
  revalidatePath("/admin/verifications");
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
