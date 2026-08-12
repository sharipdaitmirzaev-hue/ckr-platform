import { createClient } from "@/lib/supabase/server";
import { mapCkrCommentRow, mapCkrEventRow, mapCkrRequestRow } from "@/lib/ckr-inbox/mappers";
import type { CkrRequest, CkrRequestComment, CkrRequestEvent } from "@/types/ckr-inbox";
import type { CkrRequestRow } from "@/types/ckr-inbox";
import type { CkrRequestStatus } from "@/config/ckr-inbox";

export type InboxFilters = {
  status?: string;
  type?: string;
  priority?: string;
  assignedTo?: string;
  region?: string;
  organizationId?: string;
  q?: string;
  bucket?: "all" | "new" | "active" | "waiting" | "done";
};

function applyBucket(status: string, bucket?: InboxFilters["bucket"]) {
  if (!bucket || bucket === "all") return true;
  if (bucket === "new") return status === "NEW";
  if (bucket === "waiting")
    return status === "WAITING_CLIENT" || status === "WAITING_EXTERNAL";
  if (bucket === "done")
    return (
      status === "COMPLETED" ||
      status === "REJECTED" ||
      status === "CANCELLED"
    );
  // active
  return (
    status === "IN_REVIEW" ||
    status === "ACCEPTED" ||
    status === "IN_PROGRESS"
  );
}

export async function listCkrRequests(
  filters: InboxFilters = {},
  limit = 100,
): Promise<CkrRequest[]> {
  const supabase = createClient();
  let query = supabase
    .from("ckr_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.type) query = query.eq("request_type", filters.type);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.organizationId)
    query = query.eq("organization_id", filters.organizationId);
  if (filters.region) query = query.ilike("region", `%${filters.region}%`);
  if (filters.q) {
    query = query.or(
      `subject.ilike.%${filters.q}%,body.ilike.%${filters.q}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as CkrRequestRow[])
    .map(mapCkrRequestRow)
    .filter((r) => applyBucket(r.status, filters.bucket));
}

export async function listMyCkrRequests(userId: string): Promise<CkrRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ckr_requests")
    .select("*")
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as CkrRequestRow[]).map(mapCkrRequestRow);
}

export async function listOrgCkrRequests(
  organizationId: string,
): Promise<CkrRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ckr_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as CkrRequestRow[]).map(mapCkrRequestRow);
}

export async function getCkrRequestById(
  id: string,
): Promise<CkrRequest | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ckr_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapCkrRequestRow(data as CkrRequestRow);
}

export async function listCkrComments(
  requestId: string,
): Promise<CkrRequestComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ckr_request_comments")
    .select("*, profiles:author_id ( full_name )")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) =>
    mapCkrCommentRow(
      row as Parameters<typeof mapCkrCommentRow>[0],
    ),
  );
}

export async function listCkrEvents(
  requestId: string,
): Promise<CkrRequestEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ckr_request_events")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) =>
    mapCkrEventRow(row as Parameters<typeof mapCkrEventRow>[0]),
  );
}

export async function getInboxStats(): Promise<{
  newCount: number;
  inProgress: number;
  waiting: number;
  done: number;
  recent: CkrRequest[];
}> {
  const all = await listCkrRequests({ bucket: "all" }, 200);
  return {
    newCount: all.filter((r) => r.status === "NEW").length,
    inProgress: all.filter((r) =>
      (["IN_REVIEW", "ACCEPTED", "IN_PROGRESS"] as CkrRequestStatus[]).includes(
        r.status,
      ),
    ).length,
    waiting: all.filter((r) =>
      (["WAITING_CLIENT", "WAITING_EXTERNAL"] as CkrRequestStatus[]).includes(
        r.status,
      ),
    ).length,
    done: all.filter((r) =>
      (["COMPLETED", "REJECTED", "CANCELLED"] as CkrRequestStatus[]).includes(
        r.status,
      ),
    ).length,
    recent: all.slice(0, 8),
  };
}
