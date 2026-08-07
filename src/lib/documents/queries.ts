import { DOCUMENTS_BUCKET } from "@/config/verification";
import { mapDocumentRow } from "@/lib/documents/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Document, DocumentRelatedType } from "@/types";
import type { DocumentRow } from "@/types/database";

export type DocumentListItem = Document & {
  signedUrl: string | null;
};

async function withSignedUrls(
  documents: Document[],
): Promise<DocumentListItem[]> {
  if (documents.length === 0) return [];

  const supabase = createClient();

  return Promise.all(
    documents.map(async (document) => {
      const { data } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(document.fileUrl, 60 * 60);

      return {
        ...document,
        signedUrl: data?.signedUrl ?? null,
      };
    }),
  );
}

export async function listMyDocuments(
  userId: string,
): Promise<DocumentListItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const documents = data.map((row) => mapDocumentRow(row as DocumentRow));
  return withSignedUrls(documents);
}

export async function listDocumentsForTarget(
  relatedType: DocumentRelatedType,
  relatedId: string,
): Promise<DocumentListItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("related_type", relatedType)
    .eq("related_id", relatedId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const documents = data.map((row) => mapDocumentRow(row as DocumentRow));
  return withSignedUrls(documents);
}

export async function listPublicDocumentsForTarget(
  relatedType: DocumentRelatedType,
  relatedId: string,
): Promise<DocumentListItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("related_type", relatedType)
    .eq("related_id", relatedId)
    .eq("visibility", "public")
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const documents = data.map((row) => mapDocumentRow(row as DocumentRow));
  return withSignedUrls(documents);
}
